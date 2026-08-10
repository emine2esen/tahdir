const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const {
  signCandidateToken,
  signAdminToken,
  newJti,
  authCandidate,
  authAdmin,
  isCodeExpired,
  remainingJwtExpiry,
} = require('../auth');

const router = express.Router();

// Durées autorisées, en heures : 3h, 5h, 1 jour, 2 jours, 1 semaine, 1 mois.
const ALLOWED_DURATIONS = [3, 5, 24, 48, 168, 720];

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function addHoursIso(hours) {
  const d = new Date();
  d.setHours(d.getHours() + Number(hours));
  return d.toISOString();
}

// --- Admin auth ---
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiants requis' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = signAdminToken({ adminId: admin.id, username: admin.username });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

router.get('/admin/me', authAdmin(db), (req, res) => {
  res.json({ admin: req.admin });
});

// --- Candidate auth : code réutilisable jusqu'à expiration, 1 seule session ---
router.post('/candidate/login', (req, res) => {
  const code = normalizeCode(req.body?.code);
  const deviceId = req.headers['x-device-id'] || req.body?.deviceId;

  if (!code) {
    return res.status(400).json({ error: 'Code requis' });
  }
  if (!deviceId) {
    return res.status(400).json({ error: 'Identifiant appareil requis' });
  }

  const row = db.prepare('SELECT * FROM access_codes WHERE code = ?').get(code);
  if (!row) {
    return res.status(404).json({ error: 'Code invalide' });
  }

  if (row.is_used && isCodeExpired(row)) {
    return res.status(403).json({
      error: 'Ce code a expiré. Contactez le support pour un nouveau code.',
      code: 'CODE_EXPIRED',
    });
  }

  const jti = newJti();
  let expiresAt = row.expires_at;

  if (!row.is_used) {
    const hours = ALLOWED_DURATIONS.includes(Number(row.duration_hours))
      ? Number(row.duration_hours)
      : 168;
    expiresAt = addHoursIso(hours);
    db.prepare(
      `UPDATE access_codes
       SET is_used = 1, used_at = datetime('now'), expires_at = ?,
           active_jti = ?, active_device_id = ?
       WHERE id = ?`
    ).run(expiresAt, jti, deviceId, row.id);
  } else {
    // Reconnexion autorisée : remplace la session active (pas 2 sessions)
    db.prepare(
      `UPDATE access_codes SET active_jti = ?, active_device_id = ? WHERE id = ?`
    ).run(jti, deviceId, row.id);
  }

  const updated = db.prepare('SELECT * FROM access_codes WHERE id = ?').get(row.id);
  const token = signCandidateToken(
    {
      codeId: updated.id,
      code: updated.code,
      profilId: updated.profil_id,
      jti,
    },
    remainingJwtExpiry(updated)
  );

  res.json({
    token,
    profilId: updated.profil_id,
    code: updated.code,
    expiresAt: updated.expires_at,
    durationHours: updated.duration_hours,
  });
});

router.post('/candidate/claim', authCandidate(db), (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.body?.deviceId;
  if (!deviceId) {
    return res.status(400).json({ error: 'Identifiant appareil requis' });
  }

  const jti = newJti();
  db.prepare(
    `UPDATE access_codes SET active_jti = ?, active_device_id = ? WHERE id = ?`
  ).run(jti, deviceId, req.candidate.codeId);

  const row = db.prepare('SELECT * FROM access_codes WHERE id = ?').get(req.candidate.codeId);
  const token = signCandidateToken(
    {
      codeId: row.id,
      code: row.code,
      profilId: row.profil_id,
      jti,
    },
    remainingJwtExpiry(row)
  );

  res.json({
    token,
    profilId: row.profil_id,
    code: row.code,
    expiresAt: row.expires_at,
    durationHours: row.duration_hours,
  });
});

router.get('/candidate/me', authCandidate(db), (req, res) => {
  const row = req.candidate.codeRow;
  res.json({
    code: req.candidate.code,
    profilId: req.candidate.profilId,
    expiresAt: row.expires_at,
    durationHours: row.duration_hours,
  });
});

router.post('/candidate/logout', authCandidate(db), (req, res) => {
  // Libère la session mais le code reste valable jusqu'à expires_at
  db.prepare(
    `UPDATE access_codes SET active_jti = NULL, active_device_id = NULL WHERE id = ?`
  ).run(req.candidate.codeId);
  res.json({ ok: true });
});

module.exports = router;
module.exports.ALLOWED_DURATIONS = ALLOWED_DURATIONS;
