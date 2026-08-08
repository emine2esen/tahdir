const express = require('express');
const db = require('../db');
const { authCandidate } = require('../auth');
const { LEVEL_LABELS, pickLang, mapQuestion, mapChoice } = require('../locale');

const router = express.Router();
const requireCandidate = authCandidate(db);

router.get('/catalog', requireCandidate, (req, res) => {
  const assignedProfilId = req.candidate.profilId;

  let concours;
  if (assignedProfilId) {
    concours = db
      .prepare(
        `SELECT DISTINCT c.*
         FROM concours c
         JOIN profils p ON p.concours_id = c.id
         WHERE c.is_active = 1 AND p.is_active = 1 AND p.id = ?
         ORDER BY c.year DESC, c.title`
      )
      .all(assignedProfilId);
  } else {
    concours = db
      .prepare(`SELECT * FROM concours WHERE is_active = 1 ORDER BY year DESC, title`)
      .all();
  }

  const getProfils = assignedProfilId
    ? db.prepare(
        `SELECT id, concours_id, title, description FROM profils
         WHERE is_active = 1 AND concours_id = ? AND id = ?
         ORDER BY title`
      )
    : db.prepare(
        `SELECT id, concours_id, title, description FROM profils
         WHERE is_active = 1 AND concours_id = ?
         ORDER BY title`
      );

  const getQcms = db.prepare(
    `SELECT id, profil_id, title, level, duration_minutes,
      (SELECT COUNT(*) FROM questions qs WHERE qs.qcm_id = qcms.id) AS questions_count
     FROM qcms
     WHERE is_active = 1 AND profil_id = ?
     ORDER BY level ASC`
  );

  const result = concours.map((c) => {
    const profils = assignedProfilId
      ? getProfils.all(c.id, assignedProfilId)
      : getProfils.all(c.id);

    return {
      ...c,
      profils: profils.map((p) => ({
        ...p,
        qcms: getQcms.all(p.id).map((q) => ({
          ...q,
          level_label: LEVEL_LABELS[q.level] || `Niveau ${q.level}`,
        })),
      })),
    };
  });

  res.json({
    assignedProfilId,
    concours: result,
    expiresAt: req.candidate.codeRow?.expires_at || null,
  });
});

router.get('/qcms/:id', requireCandidate, (req, res) => {
  const id = Number(req.params.id);
  const lang = pickLang(req);
  const qcm = db
    .prepare(
      `SELECT q.*, p.title AS profil_title, p.id AS profil_id, c.title AS concours_title, c.id AS concours_id
       FROM qcms q
       JOIN profils p ON p.id = q.profil_id
       JOIN concours c ON c.id = p.concours_id
       WHERE q.id = ? AND q.is_active = 1 AND p.is_active = 1 AND c.is_active = 1`
    )
    .get(id);

  if (!qcm) return res.status(404).json({ error: 'QCM introuvable' });

  if (req.candidate.profilId && req.candidate.profilId !== qcm.profil_id) {
    return res.status(403).json({ error: 'Ce QCM n’est pas assigné à votre profil' });
  }

  const questions = db
    .prepare(
      `SELECT id, order_num, text, text_fr, text_ar, image_url,
              explanation, explanation_fr, explanation_ar
       FROM questions WHERE qcm_id = ? ORDER BY order_num ASC`
    )
    .all(id);

  const getChoices = db.prepare(
    `SELECT id, label, text, text_fr, text_ar, is_correct
     FROM choices WHERE question_id = ? ORDER BY label`
  );

  res.json({
    id: qcm.id,
    title: qcm.title,
    level: qcm.level,
    level_label: LEVEL_LABELS[qcm.level] || `Niveau ${qcm.level}`,
    duration_minutes: qcm.duration_minutes,
    profil_title: qcm.profil_title,
    concours_title: qcm.concours_title,
    lang,
    questions: questions.map((q) => ({
      ...mapQuestion(q, lang),
      choices: getChoices.all(q.id).map((c) => mapChoice(c, lang)),
    })),
  });
});

module.exports = router;
