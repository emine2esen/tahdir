const db = require('./db');

const LEVEL_LABELS = {
  1: 'Facile',
  2: 'Très facile',
  3: 'Débutant',
  4: 'Élémentaire',
  5: 'Intermédiaire',
  6: 'Confirmé',
  7: 'Avancé',
  8: 'Difficile',
  9: 'Très difficile',
  10: 'Expert',
};

function pickLang(req) {
  const lang = String(req.query.lang || req.headers['accept-language'] || 'fr')
    .slice(0, 2)
    .toLowerCase();
  return lang === 'ar' ? 'ar' : 'fr';
}

function mapQuestion(q, lang) {
  return {
    id: q.id,
    order_num: q.order_num,
    text: db.localized(q, 'text', lang),
    text_lang: db.localizedLang(q, 'text', lang),
    text_fr: q.text_fr || q.text || '',
    text_ar: q.text_ar || '',
    image_url: q.image_url,
    explanation: db.localized(q, 'explanation', lang),
    explanation_fr: q.explanation_fr || q.explanation || '',
    explanation_ar: q.explanation_ar || '',
  };
}

function mapChoice(c, lang) {
  return {
    id: c.id,
    label: c.label,
    text: db.localized(c, 'text', lang),
    text_fr: c.text_fr || c.text || '',
    text_ar: c.text_ar || '',
    is_correct: !!c.is_correct,
  };
}

module.exports = { LEVEL_LABELS, pickLang, mapQuestion, mapChoice };
