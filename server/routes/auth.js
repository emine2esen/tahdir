const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const {
  signCandidateToken,
  signAdminToken,
  newJti,
  authCandidate,
  authAdmin,
} = require('../auth');

const router = express.Router();

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
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

// --- Candidate auth (code unique) ---
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
  if (row.is_used) {
    return res.status(403).json({
      error: 'Ce code a déjà été utilisé et ne peut plus créer de session',
      code: 'CODE_USED',
    });
  }

  const jti = newJti();
  db.prepare(
    `UPDATE access_codes
     SET is_used = 1, used_at = datetime('now'), active_jti = ?, active_device_id = ?
     WHERE id = ?`
  ).run(jti, deviceId, row.id);

  const token = signCandidateToken({
    codeId: row.id,
    code: row.code,
    profilId: row.profil_id,
    jti,
  });

  res.json({
    token,
    profilId: row.profil_id,
    code: row.code,
  });
});

// Claim session with existing JWT → invalide les autres appareils
router.post('/candidate/claim', authCandidate(db), (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.body?.deviceId;
  if (!deviceId) {
    return res.status(400).json({ error: 'Identifiant appareil requis' });
  }

  const jti = newJti();
  db.prepare(
    `UPDATE access_codes SET active_jti = ?, active_device_id = ? WHERE id = ?`
  ).run(jti, deviceId, req.candidate.codeId);

  const token = signCandidateToken({
    codeId: req.candidate.codeId,
    code: req.candidate.code,
    profilId: req.candidate.profilId,
    jti,
  });

  res.json({ token, profilId: req.candidate.profilId, code: req.candidate.code });
});

router.get('/candidate/me', authCandidate(db), (req, res) => {
  res.json({
    code: req.candidate.code,
    profilId: req.candidate.profilId,
  });
});

router.post('/candidate/logout', authCandidate(db), (req, res) => {
  db.prepare(
    `UPDATE access_codes SET active_jti = NULL, active_device_id = NULL WHERE id = ?`
  ).run(req.candidate.codeId);
  res.json({ ok: true });
});

module.exports = router;
