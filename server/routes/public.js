const express = require('express');
const db = require('../db');
const { mapQuestion, mapChoice, pickLang } = require('../locale');

const router = express.Router();

const WHATSAPP_NUMBER = '22236949445';

/** Catalogue public pour la simulation (sans auth) */
router.get('/catalog', (_req, res) => {
  const concours = db
    .prepare(`SELECT id, title, description, year FROM concours WHERE is_active = 1 ORDER BY year DESC, title`)
    .all();

  const getProfils = db.prepare(
    `SELECT p.id, p.concours_id, p.title, p.description,
      (SELECT COUNT(*) FROM questions qs
         JOIN qcms q ON q.id = qs.qcm_id
        WHERE q.profil_id = p.id AND q.is_active = 1) AS questions_available
     FROM profils p
     WHERE p.is_active = 1 AND p.concours_id = ?
     ORDER BY p.title`
  );

  res.json({
    whatsapp: WHATSAPP_NUMBER,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
    concours: concours.map((c) => ({
      ...c,
      profils: getProfils.all(c.id),
    })),
  });
});

/**
 * Simulation : {limit} questions (ordre fixe, non aléatoire) pour un profil.
 * Priorité aux questions cochées "simulation" par l'admin (toutes QCM actifs
 * confondus, triées par niveau puis ordre). À défaut (aucune question cochée
 * pour ce profil), repli sur les {limit} premières questions du premier QCM
 * actif (niveau le plus bas). Scoring côté navigateur — aucune session.
 */
router.get('/simulation', (req, res) => {
  const profilId = Number(req.query.profil_id);
  const lang = pickLang(req);
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 5);

  if (!profilId) {
    return res.status(400).json({ error: 'profil_id requis' });
  }

  const profil = db
    .prepare(
      `SELECT p.*, c.title AS concours_title
       FROM profils p
       JOIN concours c ON c.id = p.concours_id
       WHERE p.id = ? AND p.is_active = 1 AND c.is_active = 1`
    )
    .get(profilId);

  if (!profil) {
    return res.status(404).json({ error: 'Profil introuvable' });
  }

  let questions = db
    .prepare(
      `SELECT q.id, q.order_num, q.text, q.text_fr, q.text_ar, q.image_url,
              q.explanation, q.explanation_fr, q.explanation_ar, q.qcm_id
       FROM questions q
       JOIN qcms qc ON qc.id = q.qcm_id
       WHERE qc.profil_id = ? AND qc.is_active = 1 AND q.is_simulation = 1
       ORDER BY qc.level ASC, q.order_num ASC
       LIMIT ?`
    )
    .all(profilId, limit);

  if (!questions.length) {
    const firstQcm = db
      .prepare(
        `SELECT id FROM qcms WHERE profil_id = ? AND is_active = 1 ORDER BY level ASC LIMIT 1`
      )
      .get(profilId);

    questions = firstQcm
      ? db
          .prepare(
            `SELECT id, order_num, text, text_fr, text_ar, image_url,
                    explanation, explanation_fr, explanation_ar, qcm_id
             FROM questions
             WHERE qcm_id = ?
             ORDER BY order_num ASC
             LIMIT ?`
          )
          .all(firstQcm.id, limit)
      : [];
  }

  const getChoices = db.prepare(
    `SELECT id, label, text, text_fr, text_ar, is_correct
     FROM choices WHERE question_id = ? ORDER BY label`
  );

  res.json({
    profil_id: profil.id,
    profil_title: profil.title,
    concours_title: profil.concours_title,
    lang,
    limit,
    whatsapp: WHATSAPP_NUMBER,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      lang === 'ar'
        ? `مرحبا، أريد إكمال تقييمي على تحضير — الشعبة: ${profil.title}`
        : `Bonjour, je souhaite compléter mon évaluation sur Tahdir — profil : ${profil.title}`
    )}`,
    questions: questions.map((q) => ({
      ...mapQuestion(q, lang),
      choices: getChoices.all(q.id).map((c) => mapChoice(c, lang)),
    })),
  });
});

router.get('/contact', (_req, res) => {
  res.json({
    phone: '36949445',
    whatsapp: WHATSAPP_NUMBER,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}`,
  });
});

module.exports = router;
