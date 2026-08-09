const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authAdmin } = require('../auth');

const router = express.Router();
const requireAdmin = authAdmin(db);

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MIN_CHOICES = 2;
const MAX_CHOICES = CHOICE_LABELS.length;
const MAX_QUESTIONS_PER_QCM = 100;

/** Valide une liste de choix déjà normalisée (label, is_correct) : nombre, labels, bonne réponse. */
function choicesValidationError(choices) {
  if (!Array.isArray(choices) || choices.length < MIN_CHOICES || choices.length > MAX_CHOICES) {
    return `Chaque question doit avoir entre ${MIN_CHOICES} et ${MAX_CHOICES} choix (${CHOICE_LABELS.join(', ')})`;
  }
  const expected = CHOICE_LABELS.slice(0, choices.length);
  const labels = choices.map((c) => String(c.label || '').toUpperCase());
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length || !expected.every((l) => uniqueLabels.has(l))) {
    return `Les labels de choix doivent être exactement ${expected.join(', ')}, sans doublon`;
  }
  if (!choices.some((c) => c.is_correct)) {
    return 'Au moins une bonne réponse est requise';
  }
  return null;
}

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
// Par défaut, seuls les profils actifs sont renvoyés (utilisé par les sélecteurs
// de profil ailleurs dans l'admin : QCM, questions, codes). Passer ?all=1 pour
// obtenir aussi les profils désactivés (utilisé par la page de gestion des profils).
router.get('/profils', requireAdmin, (req, res) => {
  const concoursId = req.query.concours_id;
  const includeInactive = req.query.all === '1' || req.query.all === 'true';
  const activeClause = includeInactive ? '' : 'AND p.is_active = 1';
  let rows;
  if (concoursId) {
    rows = db
      .prepare(
        `SELECT p.*, c.title AS concours_title,
          (SELECT COUNT(*) FROM qcms q WHERE q.profil_id = p.id) AS qcms_count
         FROM profils p
         JOIN concours c ON c.id = p.concours_id
         WHERE p.concours_id = ? ${activeClause}
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
         WHERE 1 = 1 ${activeClause}
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
    'SELECT id, label, text, text_fr, text_ar, is_correct FROM choices WHERE question_id = ? ORDER BY label'
  );

  res.json(
    questions.map((q) => ({
      ...q,
      text_fr: q.text_fr || q.text || '',
      text_ar: q.text_ar || '',
      explanation_fr: q.explanation_fr || q.explanation || '',
      explanation_ar: q.explanation_ar || '',
      choices: getChoices.all(q.id).map((c) => ({
        ...c,
        text_fr: c.text_fr || c.text || '',
        text_ar: c.text_ar || '',
      })),
    }))
  );
});

router.post('/qcms/:id/questions', requireAdmin, (req, res) => {
  const qcmId = Number(req.params.id);
  const qcm = db.prepare('SELECT * FROM qcms WHERE id = ?').get(qcmId);
  if (!qcm) return res.status(404).json({ error: 'QCM introuvable' });

  const count = db.prepare('SELECT COUNT(*) AS c FROM questions WHERE qcm_id = ?').get(qcmId).c;
  if (count >= MAX_QUESTIONS_PER_QCM) {
    return res.status(400).json({ error: `Maximum ${MAX_QUESTIONS_PER_QCM} questions par QCM` });
  }

  const body = req.body || {};
  const text_fr = String(body.text_fr ?? body.text ?? '').trim();
  const text_ar = String(body.text_ar ?? '').trim();
  const explanation_fr = String(body.explanation_fr ?? body.explanation ?? '').trim();
  const explanation_ar = String(body.explanation_ar ?? '').trim();
  const image_url = body.image_url || null;
  const choices = body.choices;

  if (!text_fr && !text_ar) {
    return res.status(400).json({ error: 'Texte FR ou AR de la question requis' });
  }
  const choicesError = choicesValidationError(choices);
  if (choicesError) {
    return res.status(400).json({ error: choicesError });
  }

  const nextOrder =
    body.order_num ||
    (db.prepare('SELECT COALESCE(MAX(order_num), 0) + 1 AS n FROM questions WHERE qcm_id = ?').get(
      qcmId
    ).n);

  const primaryText = text_fr || text_ar;
  const primaryExpl = explanation_fr || explanation_ar;

  const insertQ = db.prepare(
    `INSERT INTO questions (
      qcm_id, order_num, text, text_fr, text_ar, image_url,
      explanation, explanation_fr, explanation_ar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertC = db.prepare(
    `INSERT INTO choices (question_id, label, text, text_fr, text_ar, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    const result = insertQ.run(
      qcmId,
      nextOrder,
      primaryText,
      text_fr,
      text_ar,
      image_url,
      primaryExpl,
      explanation_fr,
      explanation_ar
    );
    const qid = result.lastInsertRowid;
    for (const c of choices) {
      const cfr = String(c.text_fr ?? c.text ?? '').trim();
      const car = String(c.text_ar ?? '').trim();
      insertC.run(qid, c.label, cfr || car, cfr, car, c.is_correct ? 1 : 0);
    }
    touch('qcms', qcmId);
    return qid;
  });

  const qid = tx();
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(qid);
  const qChoices = db
    .prepare(
      'SELECT id, label, text, text_fr, text_ar, is_correct FROM choices WHERE question_id = ? ORDER BY label'
    )
    .all(qid);
  res.status(201).json({ ...question, choices: qChoices });
});

function normalizeImportChoices(choices) {
  if (!Array.isArray(choices) || choices.length < MIN_CHOICES || choices.length > MAX_CHOICES) {
    throw new Error(
      `Chaque question doit avoir entre ${MIN_CHOICES} et ${MAX_CHOICES} choix (${CHOICE_LABELS.join(', ')})`
    );
  }

  const expected = CHOICE_LABELS.slice(0, choices.length);
  const byLabel = {};
  for (const c of choices) {
    const label = String(c.label || c.lettre || '').toUpperCase();
    if (!expected.includes(label)) {
      throw new Error(`Les labels de choix doivent être ${expected.join(', ')}`);
    }
    const text_fr = String(c.text_fr ?? c.text ?? c.texte ?? '').trim();
    const text_ar = String(c.text_ar ?? c.texte_ar ?? '').trim();
    byLabel[label] = {
      label,
      text_fr,
      text_ar,
      text: text_fr || text_ar,
      is_correct: !!(c.is_correct ?? c.correcte ?? c.correct),
    };
  }

  if (!expected.every((l) => byLabel[l])) {
    throw new Error(`Les labels ${expected.join(', ')} sont obligatoires, sans doublon`);
  }
  if (!expected.some((l) => byLabel[l].is_correct)) {
    throw new Error('Au moins une bonne réponse est requise par question');
  }

  return expected.map((l) => byLabel[l]);
}

function normalizeImportQuestion(raw, index) {
  const text_fr = String(
    raw.text_fr ?? raw.text ?? raw.enonce ?? raw.question ?? ''
  ).trim();
  const text_ar = String(raw.text_ar ?? raw.enonce_ar ?? raw.question_ar ?? '').trim();
  if (!text_fr && !text_ar) {
    throw new Error(`Question #${index + 1} : texte manquant (FR ou AR)`);
  }

  let choices = raw.choices ?? raw.choix;
  if (!choices) {
    const shorthandLabels = CHOICE_LABELS.filter((l) => raw[l] !== undefined);
    if (shorthandLabels.length) {
      const correct = new Set(
        []
          .concat(raw.correct || raw.correctes || raw.bonnes_reponses || [])
          .map((x) => String(x).toUpperCase())
      );
      if (raw.bonne_reponse) correct.add(String(raw.bonne_reponse).toUpperCase());
      choices = shorthandLabels.map((label) => ({
        label,
        text_fr: raw[label] || '',
        text_ar: raw[`${label}_ar`] || '',
        is_correct: correct.has(label),
      }));
    }
  }

  try {
    return {
      text_fr,
      text_ar,
      text: text_fr || text_ar,
      explanation_fr: String(
        raw.explanation_fr ?? raw.explanation ?? raw.explication ?? ''
      ).trim(),
      explanation_ar: String(
        raw.explanation_ar ?? raw.explication_ar ?? ''
      ).trim(),
      image_url: raw.image_url || raw.image || null,
      choices: normalizeImportChoices(choices),
    };
  } catch (e) {
    throw new Error(`Question #${index + 1} : ${e.message}`);
  }
}

/**
 * Normalise une question issue d'un fichier JSON monolingue (une seule langue par
 * fichier). Un objet vide / sans texte signifie « pas de version dans cette langue
 * pour cette question » et renvoie null plutôt que de lever une erreur, pour
 * permettre l'import de 2 fichiers (AR + FR) désalignés question par question.
 */
function normalizeImportQuestionMonolingual(raw, index, langLabel) {
  const text = String(raw?.text ?? raw?.enonce ?? raw?.question ?? '').trim();
  if (!text) return null;

  let choices = raw.choices ?? raw.choix;
  if (!choices) {
    const shorthandLabels = CHOICE_LABELS.filter((l) => raw[l] !== undefined);
    if (shorthandLabels.length) {
      const correct = new Set(
        []
          .concat(raw.correct || raw.correctes || raw.bonnes_reponses || [])
          .map((x) => String(x).toUpperCase())
      );
      if (raw.bonne_reponse) correct.add(String(raw.bonne_reponse).toUpperCase());
      choices = shorthandLabels.map((label) => ({
        label,
        text: raw[label] || '',
        is_correct: correct.has(label),
      }));
    }
  }

  if (!Array.isArray(choices) || choices.length < MIN_CHOICES || choices.length > MAX_CHOICES) {
    throw new Error(
      `Question #${index + 1} (${langLabel}) : chaque question doit avoir entre ${MIN_CHOICES} et ${MAX_CHOICES} choix (${CHOICE_LABELS.join(', ')})`
    );
  }

  const expected = CHOICE_LABELS.slice(0, choices.length);
  const byLabel = {};
  for (const c of choices) {
    const label = String(c.label || c.lettre || '').toUpperCase();
    if (!expected.includes(label)) {
      throw new Error(`Question #${index + 1} (${langLabel}) : les labels de choix doivent être ${expected.join(', ')}`);
    }
    byLabel[label] = {
      label,
      text: String(c.text ?? c.texte ?? '').trim(),
      is_correct: !!(c.is_correct ?? c.correcte ?? c.correct),
    };
  }
  if (!expected.every((l) => byLabel[l])) {
    throw new Error(`Question #${index + 1} (${langLabel}) : les labels ${expected.join(', ')} sont obligatoires, sans doublon`);
  }
  if (!expected.some((l) => byLabel[l].is_correct)) {
    throw new Error(`Question #${index + 1} (${langLabel}) : au moins une bonne réponse est requise`);
  }

  return {
    text,
    explanation: String(raw.explanation ?? raw.explication ?? '').trim(),
    image_url: raw.image_url || raw.image || null,
    choices: expected.map((l) => byLabel[l]),
  };
}

/**
 * Fusionne 2 listes monolingues (AR et FR) alignées par position (même index =
 * même question). Une question absente d'une des deux listes (liste plus courte,
 * ou entrée vide) reste disponible uniquement dans l'autre langue.
 */
function mergeBilingualQuestions(arList, frList) {
  const len = Math.max(arList.length, frList.length);
  const merged = [];
  for (let i = 0; i < len; i++) {
    const ar = arList[i] || null;
    const fr = frList[i] || null;
    if (!ar && !fr) continue;

    const labelSet = new Set([
      ...(ar?.choices || []).map((c) => c.label),
      ...(fr?.choices || []).map((c) => c.label),
    ]);
    const labels = CHOICE_LABELS.filter((l) => labelSet.has(l));

    const choices = labels.map((label) => {
      const arC = ar?.choices.find((c) => c.label === label);
      const frC = fr?.choices.find((c) => c.label === label);
      return {
        label,
        text_ar: arC?.text || '',
        text_fr: frC?.text || '',
        text: frC?.text || arC?.text || '',
        is_correct: !!(arC?.is_correct || frC?.is_correct),
      };
    });
    if (!choices.some((c) => c.is_correct)) {
      throw new Error(`Question #${i + 1} : au moins une bonne réponse est requise`);
    }

    merged.push({
      text_ar: ar?.text || '',
      text_fr: fr?.text || '',
      text: fr?.text || ar?.text || '',
      explanation_ar: ar?.explanation || '',
      explanation_fr: fr?.explanation || '',
      image_url: fr?.image_url || ar?.image_url || null,
      choices,
    });
  }
  if (!merged.length) {
    throw new Error('Aucune question valide dans les fichiers fournis');
  }
  return merged;
}

router.post('/qcms/:id/questions/import', requireAdmin, (req, res) => {
  const qcmId = Number(req.params.id);
  const qcm = db.prepare('SELECT * FROM qcms WHERE id = ?').get(qcmId);
  if (!qcm) return res.status(404).json({ error: 'QCM introuvable' });

  const replace = !!(req.body?.replace || req.body?.remplacer);
  const arRaw = req.body?.questions_ar;
  const frRaw = req.body?.questions_fr;
  const separateMode = Array.isArray(arRaw) || Array.isArray(frRaw);

  let normalized;
  try {
    if (separateMode) {
      const arList = Array.isArray(arRaw)
        ? arRaw.map((q, i) => normalizeImportQuestionMonolingual(q, i, 'AR'))
        : [];
      const frList = Array.isArray(frRaw)
        ? frRaw.map((q, i) => normalizeImportQuestionMonolingual(q, i, 'FR'))
        : [];
      normalized = mergeBilingualQuestions(arList, frList);
    } else {
      let payload = req.body?.questions ?? req.body?.questions_list ?? req.body;
      if (Array.isArray(payload)) {
        // body is the array itself
      } else if (payload && Array.isArray(payload.questions)) {
        payload = payload.questions;
      } else {
        throw new Error(
          'Format JSON invalide. Attendu : { "questions": [ ... ] } ou un tableau de questions.'
        );
      }
      if (!payload.length) {
        throw new Error('Aucune question dans le fichier');
      }
      normalized = payload.map((q, i) => normalizeImportQuestion(q, i));
    }
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const existingCount = db
    .prepare('SELECT COUNT(*) AS c FROM questions WHERE qcm_id = ?')
    .get(qcmId).c;
  const baseCount = replace ? 0 : existingCount;
  if (baseCount + normalized.length > MAX_QUESTIONS_PER_QCM) {
    return res.status(400).json({
      error: `Import impossible : ${baseCount} existante(s) + ${normalized.length} à importer dépasse ${MAX_QUESTIONS_PER_QCM}.`,
    });
  }

  const insertQ = db.prepare(
    `INSERT INTO questions (
      qcm_id, order_num, text, text_fr, text_ar, image_url,
      explanation, explanation_fr, explanation_ar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertC = db.prepare(
    `INSERT INTO choices (question_id, label, text, text_fr, text_ar, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`
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
        q.text_fr,
        q.text_ar,
        q.image_url,
        q.explanation_fr || q.explanation_ar,
        q.explanation_fr,
        q.explanation_ar
      );
      for (const c of q.choices) {
        insertC.run(
          result.lastInsertRowid,
          c.label,
          c.text,
          c.text_fr,
          c.text_ar,
          c.is_correct ? 1 : 0
        );
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

  const text_fr = String(
    req.body.text_fr ?? existing.text_fr ?? existing.text ?? ''
  ).trim();
  const text_ar = String(req.body.text_ar ?? existing.text_ar ?? '').trim();
  const explanation_fr = String(
    req.body.explanation_fr ?? existing.explanation_fr ?? existing.explanation ?? ''
  ).trim();
  const explanation_ar = String(
    req.body.explanation_ar ?? existing.explanation_ar ?? ''
  ).trim();
  const image_url =
    req.body.image_url !== undefined ? req.body.image_url : existing.image_url;
  const order_num = req.body.order_num ?? existing.order_num;
  const choices = req.body.choices;
  const primaryText = text_fr || text_ar;
  const primaryExpl = explanation_fr || explanation_ar;

  if (!primaryText) {
    return res.status(400).json({ error: 'Texte FR ou AR requis' });
  }

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE questions SET
        text = ?, text_fr = ?, text_ar = ?,
        explanation = ?, explanation_fr = ?, explanation_ar = ?,
        image_url = ?, order_num = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      primaryText,
      text_fr,
      text_ar,
      primaryExpl,
      explanation_fr,
      explanation_ar,
      image_url,
      order_num,
      id
    );

    if (Array.isArray(choices) && choices.length) {
      const choicesError = choicesValidationError(choices);
      if (choicesError) {
        throw new Error(choicesError);
      }
      db.prepare('DELETE FROM choices WHERE question_id = ?').run(id);
      const insertC = db.prepare(
        `INSERT INTO choices (question_id, label, text, text_fr, text_ar, is_correct)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const c of choices) {
        const cfr = String(c.text_fr ?? c.text ?? '').trim();
        const car = String(c.text_ar ?? '').trim();
        insertC.run(id, c.label, cfr || car, cfr, car, c.is_correct ? 1 : 0);
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
    .prepare(
      'SELECT id, label, text, text_fr, text_ar, is_correct FROM choices WHERE question_id = ? ORDER BY label'
    )
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
  const { count = 1, label = '', profil_id = null, duration_days = 7 } = req.body || {};
  const n = Math.min(Math.max(Number(count) || 1, 1), 100);
  const days = [1, 2, 7, 30].includes(Number(duration_days))
    ? Number(duration_days)
    : 7;
  const insert = db.prepare(
    `INSERT INTO access_codes (code, label, profil_id, duration_days) VALUES (?, ?, ?, ?)`
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

      const result = insert.run(
        code,
        label,
        profil_id ? Number(profil_id) : null,
        days
      );
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
