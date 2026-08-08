import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, scoreQuiz } from '../api';
import { useLang } from '../i18n/LanguageContext';
import { textDir } from '../i18n/translations';
import LangSwitcher from '../components/LangSwitcher';

const WHATSAPP_FALLBACK = 'https://wa.me/22236949445';

export default function Simulation() {
  const { t, lang } = useLang();
  const [catalog, setCatalog] = useState(null);
  const [concoursId, setConcoursId] = useState('');
  const [profilId, setProfilId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api
      .publicCatalog()
      .then((data) => {
        setCatalog(data);
        if (data.concours?.[0]) {
          setConcoursId(String(data.concours[0].id));
          const firstProfil = data.concours[0].profils?.[0];
          if (firstProfil) setProfilId(String(firstProfil.id));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const profils = useMemo(() => {
    const c = catalog?.concours?.find((x) => String(x.id) === concoursId);
    return c?.profils || [];
  }, [catalog, concoursId]);

  useEffect(() => {
    if (!profils.length) {
      setProfilId('');
      return;
    }
    if (!profils.some((p) => String(p.id) === profilId)) {
      setProfilId(String(profils[0].id));
    }
  }, [profils, profilId]);

  async function start() {
    if (!profilId) return;
    setStarting(true);
    setError('');
    setResult(null);
    setAnswers({});
    setIndex(0);
    try {
      const data = await api.publicSimulation(profilId, lang);
      if (!data.questions?.length) {
        throw new Error(t('sim.noQuestions'));
      }
      setQuiz(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  }

  function toggleChoice(label) {
    const q = quiz?.questions?.[index];
    if (!q || result) return;
    setAnswers((prev) => {
      const current = new Set(prev[q.id] || []);
      if (current.has(label)) current.delete(label);
      else current.add(label);
      return { ...prev, [q.id]: [...current] };
    });
  }

  function finish() {
    if (!quiz) return;
    setResult(scoreQuiz(quiz.questions, answers));
  }

  const whatsappUrl =
    quiz?.whatsappUrl ||
    catalog?.whatsappUrl ||
    WHATSAPP_FALLBACK;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted">
        {t('sim.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-4xl mx-auto w-full gap-3">
        <Link to="/" className="font-display text-2xl text-brand">
          {t('brand')}
        </Link>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link to="/connexion" className="text-sm text-brand font-medium">
            {t('nav.login')}
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pb-16">
        <h1 className="font-display text-3xl md:text-4xl text-brand-dark mb-2">
          {t('sim.title')}
        </h1>
        <p className="text-muted mb-8">{t('sim.subtitle')}</p>

        {error && (
          <p className="text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4" dir="auto">
            {error}
          </p>
        )}

        {!quiz && (
          <div className="rounded-2xl border border-brand/10 bg-white/70 p-6 space-y-4">
            <label className="block text-sm">
              {t('sim.pickConcours')}
              <select
                className="mt-1 w-full rounded-xl border border-brand/20 px-3 py-2.5 bg-sand/40"
                value={concoursId}
                onChange={(e) => setConcoursId(e.target.value)}
              >
                {(catalog?.concours || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              {t('sim.pickProfil')}
              <select
                className="mt-1 w-full rounded-xl border border-brand/20 px-3 py-2.5 bg-sand/40"
                value={profilId}
                onChange={(e) => setProfilId(e.target.value)}
              >
                {profils.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.questions_available != null
                      ? ` (${p.questions_available})`
                      : ''}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!profilId || starting}
              onClick={start}
              className="w-full rounded-xl bg-brand text-white font-semibold py-3.5 hover:bg-brand-dark disabled:opacity-60"
            >
              {starting ? t('sim.starting') : t('sim.start')}
            </button>
          </div>
        )}

        {quiz && !result && (
          <div>
            <p className="text-sm text-muted mb-4">
              {quiz.concours_title} · {quiz.profil_title} ·{' '}
              {t('sim.progress', {
                current: index + 1,
                total: quiz.questions.length,
              })}
            </p>
            <div className="h-1 bg-brand/10 rounded mb-6">
              <div
                className="h-full bg-gold rounded transition-all"
                style={{
                  width: `${((index + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {(() => {
              const q = quiz.questions[index];
              const selected = new Set(answers[q.id] || []);
              return (
                <div>
                  {q.text_lang !== lang && (
                    <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded-lg px-3 py-1.5 mb-3 inline-block" dir="auto">
                      {q.text_lang === 'fr'
                        ? t('quiz.langFallbackFr')
                        : t('quiz.langFallbackAr')}
                    </p>
                  )}
                  <h2
                    className="font-display text-2xl text-brand-dark mb-5 content-auto"
                    dir={textDir(q.text)}
                  >
                    {q.text}
                  </h2>
                  <div className="space-y-3">
                    {q.choices.map((c) => {
                      const on = selected.has(c.label);
                      return (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => toggleChoice(c.label)}
                          className={`w-full text-start rounded-xl border px-4 py-3.5 transition content-auto ${
                            on
                              ? 'border-brand bg-brand/10'
                              : 'border-brand/15 bg-white/60 hover:border-brand/35'
                          }`}
                          dir={textDir(c.text)}
                        >
                          <span
                            className={`inline-flex w-7 h-7 items-center justify-center rounded-md me-3 text-sm font-semibold ${
                              on ? 'bg-brand text-white' : 'bg-sand text-brand'
                            }`}
                            dir="ltr"
                          >
                            {c.label}
                          </span>
                          {c.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {result && (
          <div className="animate-fade-up space-y-6">
            <div className="rounded-2xl border border-brand/10 bg-white/70 p-8 text-center">
              <p className="text-sm uppercase tracking-widest text-gold mb-2">
                {t('quiz.score')}
              </p>
              <p className="font-display text-5xl text-brand-dark" dir="ltr">
                {result.score}
                <span className="text-2xl text-muted">/{result.total}</span>
              </p>
              <p className="text-muted mt-4 max-w-md mx-auto">
                {t('sim.ctaText')}
              </p>
              <p className="font-semibold text-brand-dark mt-2" dir="ltr">
                36949445
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white font-semibold px-6 py-3 hover:brightness-105 transition"
                >
                  {t('sim.whatsapp')}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setQuiz(null);
                    setResult(null);
                    setAnswers({});
                  }}
                  className="rounded-xl border border-brand/20 px-6 py-3 hover:bg-white transition"
                >
                  {t('sim.retry')}
                </button>
                <Link
                  to="/connexion"
                  className="rounded-xl bg-brand text-white px-6 py-3 font-medium hover:bg-brand-dark transition"
                >
                  {t('sim.fullAccess')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {quiz && !result && (
        <footer className="sticky bottom-0 border-t border-brand/10 bg-sand/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-lg px-4 py-2 border border-brand/20 disabled:opacity-40 hover:bg-white transition"
            >
              {t('quiz.prev')}
            </button>
            {index < quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="rounded-lg px-4 py-2 bg-brand text-white hover:bg-brand-dark transition"
              >
                {t('quiz.next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg px-4 py-2 bg-gold text-brand-dark font-semibold hover:brightness-105 transition"
              >
                {t('quiz.finish')}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
