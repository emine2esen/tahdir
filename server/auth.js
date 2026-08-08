const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'tahdir-mauritanie-secret-change-me';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'tahdir-admin-secret-change-me';

function signCandidateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function signAdminToken(payload) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '8h' });
}

function verifyCandidateToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyAdminToken(token) {
  return jwt.verify(token, ADMIN_JWT_SECRET);
}

function newJti() {
  return uuidv4();
}

function isCodeExpired(row) {
  if (!row.expires_at) return false;
  return new Date(row.expires_at).getTime() < Date.now();
}

function remainingJwtExpiry(row) {
  if (!row.expires_at) {
    const days = Number(row.duration_days) || 7;
    return `${days}d`;
  }
  const ms = new Date(row.expires_at).getTime() - Date.now();
  if (ms <= 0) return '1s';
  const seconds = Math.max(60, Math.floor(ms / 1000));
  return `${seconds}s`;
}

function authCandidate(db) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const deviceId = req.headers['x-device-id'];

    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    try {
      const payload = verifyCandidateToken(token);
      const row = db.prepare('SELECT * FROM access_codes WHERE id = ?').get(payload.codeId);

      if (!row || !row.is_used) {
        return res.status(401).json({ error: 'Session invalide' });
      }

      if (isCodeExpired(row)) {
        return res.status(401).json({
          error: 'Votre accès a expiré. Contactez le support pour un nouveau code.',
          code: 'CODE_EXPIRED',
        });
      }

      if (row.active_jti !== payload.jti) {
        return res.status(401).json({
          error: 'Session déconnectée : une autre connexion est active',
          code: 'SESSION_REPLACED',
        });
      }

      if (row.active_device_id && deviceId && row.active_device_id !== deviceId) {
        return res.status(401).json({
          error: 'Session déconnectée : une autre connexion est active',
          code: 'SESSION_REPLACED',
        });
      }

      req.candidate = { ...payload, codeRow: row };
      next();
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  };
}

function authAdmin(db) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentification admin requise' });
    }

    try {
      const payload = verifyAdminToken(token);
      const admin = db.prepare('SELECT id, username FROM admins WHERE id = ?').get(payload.adminId);
      if (!admin) {
        return res.status(401).json({ error: 'Admin introuvable' });
      }
      req.admin = admin;
      next();
    } catch {
      return res.status(401).json({ error: 'Token admin invalide ou expiré' });
    }
  };
}

module.exports = {
  signCandidateToken,
  signAdminToken,
  verifyCandidateToken,
  verifyAdminToken,
  newJti,
  authCandidate,
  authAdmin,
  isCodeExpired,
  remainingJwtExpiry,
  JWT_SECRET,
};
