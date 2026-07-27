const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authAdmin } = require('../auth');

const router = express.Router();
const requireAdmin = authAdmin(db);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées'));
    }
    cb(null, true);
  },
});

function touch(table, id) {
  db.prepare(`UPDATE ${table} SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

// --- Concours ---
router.get('/concours', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM profils p WHERE p.concours_id = c.id) AS profils_count
       FROM concours c
       ORDER BY c.year DESC, c.id DESC`
    )
    .all();
  res.json(rows);
});

router.post('/concours', requireAdmin, (req, res) => {
  const { title, description = '', year = null, is_active = 1 } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
  const result = db
    .prepare(
      `INSERT INTO concours (title, description, year, is_active) VALUES (?, ?, ?, ?)`
    )
    .run(title.trim(), description, year, is_active ? 1 : 0);
  const row = db.prepare('SELECT * FROM concours WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/concours/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM concours WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Concours introuvable' });

  const title = req.body.title ?? existing.title;
  const description = req.body.description ?? existing.description;
  const year = req.body.year ?? existing.year;
  const is_active =
    req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : existing.is_active;

  db.prepare(
    `UPDATE concours SET title = ?, description = ?, year = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, description, year, is_active, id);

  res.json(db.prepare('SELECT * FROM concours WHERE id = ?').get(id));
});

router.delete('/concours/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM concours WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Concours introuvable' });
  res.json({ ok: true });
});

// --- Profils ---
router.get('/profils', requireAdmin, (req, res) => {
  const concoursId = req.query.concours_id;
  let rows;
  if (concoursId) {
    rows = db
      .prepare(
        `SELECT p.*, c.title AS concours_title,
          (SELECT COUNT(*) FROM qcms q WHERE q.profil_id = p.id) AS qcms_count
         FROM profils p
         JOIN concours c ON c.id = p.concours_id
         WHERE p.concours_id = ?
         ORDER BY p.title`
      )
      .all(Number(concoursId));
  } else {
    rows = db
      .prepare(
        `SELECT p.*, c.title AS concours_title,
          (SELECT COUNT(*) FROM qcms q WHERE q.profil_id = p.id) AS qcms_count
         FROM profils p
         JOIN concours c ON c.id = p.concours_id
         ORDER BY c.title, p.title`
      )
      .all();
  }
  res.json(rows);
});

router.post('/profils', requireAdmin, (req, res) => {
  const { concours_id, title, description = '', is_active = 1 } = req.body || {};
  if (!concours_id || !title?.trim()) {
    return res.status(400).json({ error: 'concours_id et titre requis' });
  }
  const concours = db.prepare('SELECT id FROM concours WHERE id = ?').get(Number(concours_id));
  if (!concours) return res.status(404).json({ error: 'Concours introuvable' });

  const result = db
    .prepare(
      `INSERT INTO profils (concours_id, title, description, is_active) VALUES (?, ?, ?, ?)`
    )
    .run(Number(concours_id), title.trim(), description, is_active ? 1 : 0);

  res.status(201).json(db.prepare('SELECT * FROM profils WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/profils/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM profils WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Profil introuvable' });

  const title = req.body.title ?? existing.title;
  const description = req.body.description ?? existing.description;
  const concours_id = req.body.concours_id ?? existing.concours_id;
  const is_active =
    req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : existing.is_active;

  db.prepare(
    `UPDATE profils SET concours_id = ?, title = ?, description = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(concours_id, title, description, is_active, id);

  res.json(db.prepare('SELECT * FROM profils WHERE id = ?').get(id));
});

router.delete('/profils/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM profils WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Profil introuvable' });
  res.json({ ok: true });
});

// --- QCMs ---
router.get('/qcms', requireAdmin, (req, res) => {
  const profilId = req.query.profil_id;
  if (!profilId) return res.status(400).json({ error: 'profil_id requis' });

  const rows = db
    .prepare(
      `SELECT q.*,
        (SELECT COUNT(*) FROM questions qs WHERE qs.qcm_id = q.id) AS questions_count
       FROM qcms q
       WHERE q.profil_id = ?
       ORDER BY q.level ASC`
    )
    .all(Number(profilId));
  res.json(rows);
});

router.post('/qcms', requireAdmin, (req, res) => {
  const { profil_id, title, level, duration_minutes = 60, is_active = 1 } = req.body || {};
  if (!profil_id || !title?.trim() || !level) {
    return res.status(400).json({ error: 'profil_id, title et level requis' });
  }
  const lvl = Number(level);
  if (lvl < 1 || lvl > 10) {
    return res.status(400).json({ error: 'Le niveau doit être entre 1 et 10' });
  }

  const count = db
    .prepare('SELECT COUNT(*) AS c FROM qcms WHERE profil_id = ?')
    .get(Number(profil_id)).c;
  if (count >= 10) {
    return res.status(400).json({ error: 'Maximum 10 QCM par profil' });
  }

  try {
    const result = db
      .prepare(
        `INSERT INTO qcms (profil_id, title, level, duration_minutes, is_active)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(Number(profil_id), title.trim(), lvl, Number(duration_minutes) || 60, is_active ? 1 : 0);
    res.status(201).json(db.prepare('SELECT * FROM qcms WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ce niveau existe déjà pour ce profil' });
    }
    throw e;
  }
});

router.put('/qcms/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM qcms WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'QCM introuvable' });

  const title = req.body.title ?? existing.title;
  const level = req.body.level ?? existing.level;
  const duration_minutes = req.body.duration_minutes ?? existing.duration_minutes;
  const is_active =
    req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : existing.is_active;

  try {
    db.prepare(
      `UPDATE qcms SET title = ?, level = ?, duration_minutes = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(title, Number(level), Number(duration_minutes), is_active, id);
    res.json(db.prepare('SELECT * FROM qcms WHERE id = ?').get(id));
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ce niveau existe déjà pour ce profil' });
    }
    throw e;
  }
});

router.delete('/qcms/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM qcms WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'QCM introuvable' });
  res.json({ ok: true });
});

// --- Questions ---
router.get('/qcms/:id/questions', requireAdmin, (req, res) => {
  const qcmId = Number(req.params.id);
  const questions = db
    .prepare('SELECT * FROM questions WHERE qcm_id = ? ORDER BY order_num ASC')
    .all(qcmId);

  const getChoices = db.prepare(
    'SELECT id, label, text, is_correct FROM choices WHERE question_id = ? ORDER BY label'
  );

  res.json(
    questions.map((q) => ({
      ...q,
      choices: getChoices.all(q.id),
    }))
  );
});

router.post('/qcms/:id/questions', requireAdmin, (req, res) => {
  const qcmId = Number(req.params.id);
  const qcm = db.prepare('SELECT * FROM qcms WHERE id = ?').get(qcmId);
  if (!qcm) return res.status(404).json({ error: 'QCM introuvable' });

  const count = db.prepare('SELECT COUNT(*) AS c FROM questions WHERE qcm_id = ?').get(qcmId).c;
  if (count >= 50) {
    return res.status(400).json({ error: 'Maximum 50 questions par QCM' });
  }

  const { text, explanation = '', image_url = null, choices, order_num } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'Texte de la question requis' });
  if (!Array.isArray(choices) || choices.length !== 4) {
    return res.status(400).json({ error: 'Exactement 4 choix (A,B,C,D) requis' });
  }

  const labels = choices.map((c) => c.label);
  if (!['A', 'B', 'C', 'D'].every((l) => labels.includes(l))) {
    return res.status(400).json({ error: 'Les labels A,B,C,D sont obligatoires' });
  }
  if (!choices.some((c) => c.is_correct)) {
    return res.status(400).json({ error: 'Au moins une bonne réponse est requise' });
  }

  const nextOrder =
    order_num ||
    (db.prepare('SELECT COALESCE(MAX(order_num), 0) + 1 AS n FROM questions WHERE qcm_id = ?').get(
      qcmId
    ).n);

  const insertQ = db.prepare(
    `INSERT INTO questions (qcm_id, order_num, text, image_url, explanation)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertC = db.prepare(
    `INSERT INTO choices (question_id, label, text, is_correct) VALUES (?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    const result = insertQ.run(qcmId, nextOrder, text.trim(), image_url, explanation);
    const qid = result.lastInsertRowid;
    for (const c of choices) {
      insertC.run(qid, c.label, c.text || '', c.is_correct ? 1 : 0);
    }
    touch('qcms', qcmId);
    return qid;
  });

  const qid = tx();
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(qid);
  const qChoices = db
    .prepare('SELECT id, label, text, is_correct FROM choices WHERE question_id = ? ORDER BY label')
    .all(qid);
  res.status(201).json({ ...question, choices: qChoices });
});

function normalizeImportChoices(choices) {
  if (!Array.isArray(choices) || choices.length !== 4) {
    throw new Error('Chaque question doit avoir exactement 4 choix (A,B,C,D)');
  }

  const byLabel = {};
  for (const c of choices) {
    const label = String(c.label || c.lettre || '').toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(label)) {
      throw new Error('Les labels de choix doivent être A, B, C ou D');
    }
    byLabel[label] = {
      label,
      text: String(c.text ?? c.texte ?? '').trim(),
      is_correct: !!(c.is_correct ?? c.correcte ?? c.correct),
    };
  }

  if (!['A', 'B', 'C', 'D'].every((l) => byLabel[l])) {
    throw new Error('Les labels A, B, C et D sont obligatoires');
  }
  if (!['A', 'B', 'C', 'D'].some((l) => byLabel[l].is_correct)) {
    throw new Error('Au moins une bonne réponse est requise par question');
  }

  return ['A', 'B', 'C', 'D'].map((l) => byLabel[l]);
}

function normalizeImportQuestion(raw, index) {
  const text = String(raw.text ?? raw.enonce ?? raw.question ?? '').trim();
  if (!text) {
    throw new Error(`Question #${index + 1} : texte manquant`);
  }

  let choices = raw.choices ?? raw.choix;
  // Format court : { "A": "...", "B": "...", correct: ["A"] }
  if (!choices && (raw.A || raw.B || raw.C || raw.D)) {
    const correct = new Set(
      []
        .concat(raw.correct || raw.correctes || raw.bonnes_reponses || [])
        .map((x) => String(x).toUpperCase())
    );
    if (raw.bonne_reponse) correct.add(String(raw.bonne_reponse).toUpperCase());
    choices = ['A', 'B', 'C', 'D'].map((label) => ({
      label,
      text: raw[label] || '',
      is_correct: correct.has(label),
    }));
  }

  try {
    return {
      text,
      explanation: String(raw.explanation ?? raw.explication ?? '').trim(),
      image_url: raw.image_url || raw.image || null,
      choices: normalizeImportChoices(choices),
    };
  } catch (e) {
    throw new Error(`Question #${index + 1} : ${e.message}`);
  }
}

router.post('/qcms/:id/questions/import', requireAdmin, (req, res) => {
  const qcmId = Number(req.params.id);
  const qcm = db.prepare('SELECT * FROM qcms WHERE id = ?').get(qcmId);
  if (!qcm) return res.status(404).json({ error: 'QCM introuvable' });

  const replace = !!(req.body?.replace || req.body?.remplacer);
  let payload = req.body?.questions ?? req.body?.questions_list ?? req.body;

  if (Array.isArray(payload)) {
    // body is the array itself
  } else if (payload && Array.isArray(payload.questions)) {
    payload = payload.questions;
  } else {
    return res.status(400).json({
      error:
        'Format JSON invalide. Attendu : { "questions": [ ... ] } ou un tableau de questions.',
    });
  }

  if (!payload.length) {
    return res.status(400).json({ error: 'Aucune question dans le fichier' });
  }

  let normalized;
  try {
    normalized = payload.map((q, i) => normalizeImportQuestion(q, i));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const existingCount = db
    .prepare('SELECT COUNT(*) AS c FROM questions WHERE qcm_id = ?')
    .get(qcmId).c;
  const baseCount = replace ? 0 : existingCount;
  if (baseCount + normalized.length > 50) {
    return res.status(400).json({
      error: `Import impossible : ${baseCount} existante(s) + ${normalized.length} à importer dépasse 50.`,
    });
  }

  const insertQ = db.prepare(
    `INSERT INTO questions (qcm_id, order_num, text, image_url, explanation)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertC = db.prepare(
    `INSERT INTO choices (question_id, label, text, is_correct) VALUES (?, ?, ?, ?)`
  );
  const deleteAll = db.prepare('DELETE FROM questions WHERE qcm_id = ?');

  const tx = db.transaction(() => {
    if (replace) deleteAll.run(qcmId);
    const startOrder =
      db
        .prepare('SELECT COALESCE(MAX(order_num), 0) AS n FROM questions WHERE qcm_id = ?')
        .get(qcmId).n + 1;

    let order = startOrder;
    for (const q of normalized) {
      const result = insertQ.run(
        qcmId,
        order,
        q.text,
        q.image_url,
        q.explanation
      );
      for (const c of q.choices) {
        insertC.run(result.lastInsertRowid, c.label, c.text, c.is_correct ? 1 : 0);
      }
      order += 1;
    }
    touch('qcms', qcmId);
  });

  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const total = db
    .prepare('SELECT COUNT(*) AS c FROM questions WHERE qcm_id = ?')
    .get(qcmId).c;

  res.status(201).json({
    imported: normalized.length,
    replaced: replace,
    total,
  });
});

router.put('/questions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question introuvable' });

  const text = req.body.text ?? existing.text;
  const explanation = req.body.explanation ?? existing.explanation;
  const image_url =
    req.body.image_url !== undefined ? req.body.image_url : existing.image_url;
  const order_num = req.body.order_num ?? existing.order_num;
  const choices = req.body.choices;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE questions SET text = ?, explanation = ?, image_url = ?, order_num = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(text, explanation, image_url, order_num, id);

    if (Array.isArray(choices) && choices.length === 4) {
      if (!choices.some((c) => c.is_correct)) {
        throw new Error('Au moins une bonne réponse est requise');
      }
      db.prepare('DELETE FROM choices WHERE question_id = ?').run(id);
      const insertC = db.prepare(
        `INSERT INTO choices (question_id, label, text, is_correct) VALUES (?, ?, ?, ?)`
      );
      for (const c of choices) {
        insertC.run(id, c.label, c.text || '', c.is_correct ? 1 : 0);
      }
    }
    touch('qcms', existing.qcm_id);
  });

  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  const qChoices = db
    .prepare('SELECT id, label, text, is_correct FROM choices WHERE question_id = ? ORDER BY label')
    .all(id);
  res.json({ ...question, choices: qChoices });
});

router.delete('/questions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question introuvable' });
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  touch('qcms', existing.qcm_id);
  res.json({ ok: true });
});

router.post('/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// --- Access codes ---
function generateCode() {
  const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CONCOURS-${part()}${part()}`.slice(0, 16);
}

router.get('/codes', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT ac.*, p.title AS profil_title, c.title AS concours_title
       FROM access_codes ac
       LEFT JOIN profils p ON p.id = ac.profil_id
       LEFT JOIN concours c ON c.id = p.concours_id
       ORDER BY ac.id DESC
       LIMIT 500`
    )
    .all();
  res.json(rows);
});

router.post('/codes', requireAdmin, (req, res) => {
  const { count = 1, label = '', profil_id = null } = req.body || {};
  const n = Math.min(Math.max(Number(count) || 1, 1), 100);
  const insert = db.prepare(
    `INSERT INTO access_codes (code, label, profil_id) VALUES (?, ?, ?)`
  );

  const codes = [];
  const tx = db.transaction(() => {
    for (let i = 0; i < n; i++) {
      let code;
      let attempts = 0;
      do {
        code = generateCode();
        attempts++;
      } while (db.prepare('SELECT id FROM access_codes WHERE code = ?').get(code) && attempts < 20);

      const result = insert.run(code, label, profil_id ? Number(profil_id) : null);
      codes.push(db.prepare('SELECT * FROM access_codes WHERE id = ?').get(result.lastInsertRowid));
    }
  });
  tx();
  res.status(201).json(codes);
});

router.delete('/codes/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM access_codes WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Code introuvable' });
  res.json({ ok: true });
});

module.exports = router;
