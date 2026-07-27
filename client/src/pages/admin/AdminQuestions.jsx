import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLang } from '../../i18n/LanguageContext';
import { textDir } from '../../i18n/translations';

function blankChoices() {
  return ['A', 'B', 'C', 'D'].map((label) => ({
    label,
    text: '',
    is_correct: label === 'A',
  }));
}

const emptyQuestion = {
  text: '',
  explanation: '',
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
    try {
      const payload = {
        text: form.text,
        explanation: form.explanation,
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
      text: q.text,
      explanation: q.explanation || '',
      image_url: q.image_url || '',
      choices: q.choices.map((c) => ({
        label: c.label,
        text: c.text,
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

  async function onImportJson(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !qcmId) return;

    setError('');
    setSuccess('');
    setImporting(true);
    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Fichier JSON invalide (syntaxe incorrecte)');
      }

      const result = await api.importQuestions(qcmId, {
        ...(Array.isArray(data) ? { questions: data } : data),
        replace: replaceOnImport,
      });

      await refreshQuestions();
      setSuccess(
        `${result.imported} question(s) importée(s)${
          result.replaced ? ' (remplacement)' : ''
        }. Total : ${result.total}/50.`
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
              Niv. {q.level} — {q.title} ({q.questions_count}/50)
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
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 rounded-lg bg-brand text-white px-4 py-2 cursor-pointer hover:bg-brand-dark transition">
              {importing ? t('admin.importing') : t('admin.chooseJson')}
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={importing}
                onChange={onImportJson}
              />
            </label>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={replaceOnImport}
                onChange={(e) => setReplaceOnImport(e.target.checked)}
              />
              {t('admin.replaceExisting')}
            </label>
          </div>
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
          <textarea
            className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-24 content-auto"
            placeholder={t('admin.questionText')}
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            dir={textDir(form.text) === 'rtl' || !form.text ? undefined : 'ltr'}
            style={{ direction: form.text ? textDir(form.text) : undefined }}
            required
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {form.choices.map((c) => (
              <div key={c.label} className="rounded-lg border border-brand/15 p-3 bg-sand/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" dir="ltr">
                    {c.label}
                  </span>
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
                </div>
                <input
                  className="w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm content-auto"
                  placeholder={t('admin.choiceText', { label: c.label })}
                  value={c.text}
                  onChange={(e) => updateChoice(c.label, { text: e.target.value })}
                  style={{ direction: c.text ? textDir(c.text) : undefined }}
                  required
                />
              </div>
            ))}
          </div>
          <textarea
            className="w-full rounded-lg border border-brand/20 px-3 py-2 min-h-16 content-auto"
            placeholder={t('admin.explanation')}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            style={{
              direction: form.explanation ? textDir(form.explanation) : undefined,
            }}
          />
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
