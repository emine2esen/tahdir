import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLang } from '../../i18n/LanguageContext';
import { textDir } from '../../i18n/translations';

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MIN_CHOICES = 2;
const MAX_CHOICES = CHOICE_LABELS.length;

function blankChoices(count = 4) {
  return CHOICE_LABELS.slice(0, count).map((label) => ({
    label,
    text_fr: '',
    text_ar: '',
    is_correct: label === 'A',
  }));
}

const emptyQuestion = {
  text_fr: '',
  text_ar: '',
  explanation_fr: '',
  explanation_ar: '',
  image_url: '',
  choices: blankChoices(),
};

export default function AdminQuestions() {
  const { t } = useLang();
  const [profils, setProfils] = useState([]);
  const [profilId, setProfilId] = useState('');
  const [qcms, setQcms] = useState([]);
  const [qcmId, setQcmId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [replaceOnImport, setReplaceOnImport] = useState(false);
  const [importFileAr, setImportFileAr] = useState(null);
  const [importFileFr, setImportFileFr] = useState(null);
  const [importResetKey, setImportResetKey] = useState(0);

  useEffect(() => {
    api.getProfils().then((p) => {
      setProfils(p);
      if (p[0]) setProfilId(String(p[0].id));
    });
  }, []);

  useEffect(() => {
    if (!profilId) return;
    api.getQcms(profilId).then((list) => {
      setQcms(list);
      setQcmId(list[0] ? String(list[0].id) : '');
    });
  }, [profilId]);

  useEffect(() => {
    if (!qcmId) {
      setQuestions([]);
      return;
    }
    api
      .getQuestions(qcmId)
      .then(setQuestions)
      .catch((e) => setError(e.message));
  }, [qcmId]);

  function updateChoice(label, patch) {
    setForm((f) => ({
      ...f,
      choices: f.choices.map((c) => (c.label === label ? { ...c, ...patch } : c)),
    }));
  }

  function addChoice() {
    setForm((f) => {
      if (f.choices.length >= MAX_CHOICES) return f;
      const label = CHOICE_LABELS[f.choices.length];
      return {
        ...f,
        choices: [...f.choices, { label, text_fr: '', text_ar: '', is_correct: false }],
      };
    });
  }

  function removeChoice(label) {
    setForm((f) => {
      if (f.choices.length <= MIN_CHOICES) return f;
      const remaining = f.choices.filter((c) => c.label !== label);
      return {
        ...f,
        choices: remaining.map((c, i) => ({ ...c, label: CHOICE_LABELS[i] })),
      };
    });
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadImage(file);
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.text_fr.trim() && !form.text_ar.trim()) {
      setError(t('admin.bilingualHint'));
      return;
    }
    try {
      const payload = {
        text_fr: form.text_fr,
        text_ar: form.text_ar,
        explanation_fr: form.explanation_fr,
        explanation_ar: form.explanation_ar,
        image_url: form.image_url || null,
        choices: form.choices,
      };
      if (editId) await api.updateQuestion(editId, payload);
      else await api.createQuestion(qcmId, payload);
      setForm(emptyQuestion);
      setEditId(null);
      setQuestions(await api.getQuestions(qcmId));
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(q) {
    setEditId(q.id);
    setForm({
      text_fr: q.text_fr || q.text || '',
      text_ar: q.text_ar || '',
      explanation_fr: q.explanation_fr || q.explanation || '',
      explanation_ar: q.explanation_ar || '',
      image_url: q.image_url || '',
      choices: q.choices.map((c) => ({
        label: c.label,
        text_fr: c.text_fr || c.text || '',
        text_ar: c.text_ar || '',
        is_correct: !!c.is_correct,
      })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!confirm('Supprimer cette question ?')) return;
    await api.deleteQuestion(id);
    setQuestions(await api.getQuestions(qcmId));
    const list = await api.getQcms(profilId);
    setQcms(list);
  }

  async function refreshQuestions() {
    const [qs, list] = await Promise.all([
      api.getQuestions(qcmId),
      api.getQcms(profilId),
    ]);
    setQuestions(qs);
    setQcms(list);
  }

  async function parseQuestionsFile(file) {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Fichier JSON invalide (syntaxe incorrecte) : ${file.name}`);
    }
    return Array.isArray(data) ? data : data?.questions;
  }

  async function onImportSeparate() {
    if (!qcmId) return;
    if (!importFileAr && !importFileFr) {
      setError(t('admin.importSeparateNeedOne'));
      return;
    }

    setError('');
    setSuccess('');
    setImporting(true);
    try {
      const body = { replace: replaceOnImport };
      if (importFileAr) body.questions_ar = await parseQuestionsFile(importFileAr);
      if (importFileFr) body.questions_fr = await parseQuestionsFile(importFileFr);

      const result = await api.importQuestions(qcmId, body);

      await refreshQuestions();
      setImportFileAr(null);
      setImportFileFr(null);
      setImportResetKey((k) => k + 1);
      setSuccess(
        `${result.imported} question(s) importée(s)${
          result.replaced ? ' (remplacement)' : ''
        }. Total : ${result.total}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  const selectedQcm = qcms.find((q) => String(q.id) === qcmId);

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-2">
        {t('admin.questions')}
      </h1>
      <p className="text-muted mb-2">{t('admin.questionsSubtitle')}</p>
      <p className="text-sm text-brand mb-6">{t('admin.arabicContentNote')}</p>
      {error && (
        <p className="text-red-700 mb-4" dir="auto">
          {error}
        </p>
      )}
      {success && (
        <p className="text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4 text-sm">
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="rounded-lg border border-brand/20 px-3 py-2 bg-white max-w-full"
          value={profilId}
          onChange={(e) => setProfilId(e.target.value)}
        >
          {profils.map((p) => (
            <option key={p.id} value={p.id}>
              {p.concours_title} — {p.title}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-brand/20 px-3 py-2 bg-white"
          value={qcmId}
          onChange={(e) => {
            setQcmId(e.target.value);
            setEditId(null);
            setForm(emptyQuestion);
            setSuccess('');
            setError('');
          }}
        >
          {!qcms.length && <option value="">{t('admin.noQcm')}</option>}
          {qcms.map((q) => (
            <option key={q.id} value={q.id}>
              Niv. {q.level} — {q.title} ({q.questions_count})
            </option>
          ))}
        </select>
      </div>

      {qcmId && (
        <div className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-semibold text-brand-dark">{t('admin.importJson')}</h2>
              <p className="text-sm text-muted mt-1">{t('admin.importHint')}</p>
            </div>
            <a
              href="/exemple-questions.json"
              download
              className="text-sm text-brand underline underline-offset-2"
            >
              {t('admin.downloadExample')}
            </a>
          </div>
          <div className="flex flex-wrap items-end gap-4" key={importResetKey}>
            <label className="text-sm">
              {t('admin.chooseJsonAr')}
              <input
                type="file"
                accept=".json,application/json"
                className="block mt-1 text-sm"
                dir="rtl"
                disabled={importing}
                onChange={(e) => setImportFileAr(e.target.files?.[0] || null)}
              />
            </label>
            <label className="text-sm">
              {t('admin.chooseJsonFr')}
              <input
                type="file"
                accept=".json,application/json"
                className="block mt-1 text-sm"
                disabled={importing}
                onChange={(e) => setImportFileFr(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={onImportSeparate}
              disabled={importing || (!importFileAr && !importFileFr)}
              className="rounded-lg bg-brand text-white px-4 py-2 disabled:opacity-50 hover:bg-brand-dark transition"
            >
              {importing ? t('admin.importing') : t('admin.importSeparateBtn')}
            </button>
          </div>
          <label className="text-sm flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={replaceOnImport}
              onChange={(e) => setReplaceOnImport(e.target.checked)}
            />
            {t('admin.replaceExisting')}
          </label>
        </div>
      )}

      {qcmId && (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-8 space-y-3"
        >
          <div className="text-sm text-muted">
            {editId
              ? `#${editId}`
              : t('admin.newQuestion', { n: questions.length })}
            {selectedQcm ? ` · ${selectedQcm.title}` : ''}
          </div>
          <p className="text-xs text-muted -mb-1">{t('admin.bilingualHint')}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <textarea
              className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-24 content-auto"
              placeholder={t('admin.questionTextFr')}
              value={form.text_fr}
              onChange={(e) => setForm({ ...form, text_fr: e.target.value })}
              dir="ltr"
            />
            <textarea
              className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-24 content-auto"
              placeholder={t('admin.questionTextAr')}
              value={form.text_ar}
              onChange={(e) => setForm({ ...form, text_ar: e.target.value })}
              dir="rtl"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {form.choices.map((c) => (
              <div key={c.label} className="rounded-lg border border-brand/15 p-3 bg-sand/30 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold" dir="ltr">
                    {c.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={c.is_correct}
                        onChange={(e) =>
                          updateChoice(c.label, { is_correct: e.target.checked })
                        }
                      />
                      {t('admin.correct')}
                    </label>
                    {form.choices.length > MIN_CHOICES && (
                      <button
                        type="button"
                        onClick={() => removeChoice(c.label)}
                        className="text-xs text-red-700 hover:underline"
                      >
                        {t('admin.removeChoice')}
                      </button>
                    )}
                  </div>
                </div>
                <input
                  className="w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm content-auto"
                  placeholder={t('admin.choiceTextFr', { label: c.label })}
                  value={c.text_fr}
                  onChange={(e) => updateChoice(c.label, { text_fr: e.target.value })}
                  dir="ltr"
                />
                <input
                  className="w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm content-auto"
                  placeholder={t('admin.choiceTextAr', { label: c.label })}
                  value={c.text_ar}
                  onChange={(e) => updateChoice(c.label, { text_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            ))}
          </div>
          {form.choices.length < MAX_CHOICES && (
            <button
              type="button"
              onClick={addChoice}
              className="text-sm text-brand hover:underline"
            >
              {t('admin.addChoice')}
            </button>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <textarea
              className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-16 content-auto"
              placeholder={t('admin.explanationFr')}
              value={form.explanation_fr}
              onChange={(e) => setForm({ ...form, explanation_fr: e.target.value })}
              dir="ltr"
            />
            <textarea
              className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-16 content-auto"
              placeholder={t('admin.explanationAr')}
              value={form.explanation_ar}
              onChange={(e) => setForm({ ...form, explanation_ar: e.target.value })}
              dir="rtl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              {t('admin.imageOptional')}
              <input
                type="file"
                accept="image/*"
                className="block mt-1 text-sm"
                onChange={onUpload}
              />
            </label>
            {uploading && <span className="text-sm text-muted">…</span>}
            {form.image_url && (
              <img src={form.image_url} alt="" className="h-16 rounded-md border" />
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-brand text-white px-4 py-2">
              {editId ? t('admin.save') : t('admin.addQuestion')}
            </button>
            {editId && (
              <button
                type="button"
                className="rounded-lg border px-4 py-2"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyQuestion);
                }}
              >
                {t('admin.cancel')}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-brand/10 bg-white/60 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div
                className="font-medium content-auto"
                dir={textDir(q.text)}
              >
                #{q.order_num}. {q.text}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(q)}
                  className="text-sm border rounded-lg px-3 py-1"
                >
                  {t('admin.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => remove(q.id)}
                  className="text-sm border border-red-200 text-red-700 rounded-lg px-3 py-1"
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
            <ul className="text-sm text-muted space-y-1">
              {q.choices.map((c) => (
                <li key={c.label} className="content-auto" dir={textDir(c.text)}>
                  <span dir="ltr">{c.label}.</span> {c.text}{' '}
                  {c.is_correct ? (
                    <span className="text-emerald-700 font-medium">✓</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
