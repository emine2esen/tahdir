import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, scoreQuiz, setCandidateToken } from '../api';
import { useLang } from '../i18n/LanguageContext';
import { textDir } from '../i18n/translations';
import LangSwitcher from '../components/LangSwitcher';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [qcm, setQcm] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const startedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    // Langue figée au démarrage : changer de langue en cours d'épreuve ne doit pas
    // réinitialiser le chronomètre ni les réponses déjà données.
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getQcm(id, lang);
        if (cancelled) return;
        setQcm(data);
        setSecondsLeft(data.duration_minutes * 60);
        startedRef.current = true;
      } catch (err) {
        if (err.status === 401 || err.code === 'SESSION_REPLACED') {
          setCandidateToken(null);
          navigate('/connexion', { replace: true });
          return;
        }
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  function finish(currentAnswers = answersRef.current) {
    if (!qcm || finished) return;
    const scored = scoreQuiz(qcm.questions, currentAnswers);
    setResult(scored);
    setFinished(true);
  }

  function quitExam() {
    if (window.confirm(t('quiz.quitConfirm'))) {
      navigate('/');
    }
  }

  useEffect(() => {
    if (!qcm || finished || !startedRef.current) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qcm, finished]);

  const question = qcm?.questions?.[index];
  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a?.length).length,
    [answers]
  );

  function toggleChoice(label) {
    if (!question || finished) return;
    setAnswers((prev) => {
      const current = new Set(prev[question.id] || []);
      if (current.has(label)) current.delete(label);
      else current.add(label);
      return { ...prev, [question.id]: [...current] };
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted">
        {t('quiz.preparing')}
      </div>
    );
  }

  if (error || !qcm) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <p className="text-red-700 mb-4" dir="auto">
            {error || t('quiz.notFound')}
          </p>
          <Link to="/catalogue" className="text-brand underline">
            {t('quiz.backCatalog')}
          </Link>
        </div>
      </div>
    );
  }

  if (finished && result) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-brand/10 bg-sand/85 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-5 flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-xl text-brand">{t('quiz.results')}</div>
              <p className="text-sm text-muted content-auto" dir={textDir(`${qcm.concours_title} ${qcm.profil_title}`)}>
                {qcm.concours_title} · {qcm.profil_title}
              </p>
            </div>
            <LangSwitcher />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-fade-up text-center mb-10 rounded-2xl border border-brand/10 bg-white/70 p-8">
            <p className="text-sm uppercase tracking-widest text-gold mb-2">
              {t('quiz.score')}
            </p>
            <p className="font-display text-5xl md:text-6xl text-brand-dark" dir="ltr">
              {result.score}
              <span className="text-2xl text-muted">/{result.total}</span>
            </p>
            <p className="text-muted mt-3">
              {Math.round((result.score / Math.max(result.total, 1)) * 100)}%{' '}
              {t('quiz.scoreLocal')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Link
                to="/catalogue"
                className="rounded-xl bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark transition"
              >
                {t('quiz.backToCatalog')}
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-brand/20 px-5 py-2.5 hover:bg-white transition"
              >
                {t('quiz.restart')}
              </button>
            </div>
          </div>

          <h2 className="font-display text-2xl text-brand-dark mb-4">
            {t('quiz.details')}
          </h2>
          <div className="space-y-4">
            {result.details.map((d, i) => (
              <article
                key={d.question.id}
                className={`rounded-xl border p-4 ${
                  d.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-red-200 bg-red-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="font-medium content-auto"
                    dir={textDir(d.question.text)}
                  >
                    Q{i + 1}. {d.question.text}
                  </h3>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      d.isCorrect ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {d.isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
                  </span>
                </div>
                {d.question.image_url && (
                  <img
                    src={d.question.image_url}
                    alt=""
                    className="max-h-40 rounded-lg mb-3"
                  />
                )}
                <ul className="space-y-1.5">
                  {d.question.choices.map((c) => {
                    const selected = d.selected.includes(c.label);
                    const correct = c.is_correct;
                    let cls = 'border-transparent bg-white/50';
                    if (correct) cls = 'border-emerald-400 bg-emerald-100';
                    if (selected && !correct) cls = 'border-red-400 bg-red-100';
                    return (
                      <li
                        key={c.label}
                        className={`rounded-lg border px-3 py-2 text-sm content-auto ${cls}`}
                        dir={textDir(c.text)}
                      >
                        <strong className="me-2" dir="ltr">
                          {c.label}.
                        </strong>
                        {c.text}
                        {correct && (
                          <span className="ms-2 text-xs text-emerald-700">
                            {t('quiz.goodAnswer')}
                          </span>
                        )}
                        {selected && !correct && (
                          <span className="ms-2 text-xs text-red-700">
                            {t('quiz.yourChoice')}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {d.question.explanation && (
                  <p
                    className="text-sm text-muted mt-3 border-t border-black/5 pt-2 content-auto"
                    dir={textDir(d.question.explanation)}
                  >
                    {d.question.explanation}
                  </p>
                )}
              </article>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const selected = new Set(answers[question.id] || []);
  const urgent = secondsLeft <= 60;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-brand/10 bg-sand/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className="font-medium text-brand-dark truncate content-auto"
              dir={textDir(qcm.title)}
            >
              {qcm.title}
            </div>
            <div className="text-xs text-muted">
              {t('quiz.questionOf', {
                current: index + 1,
                total: qcm.questions.length,
              })}{' '}
              · {t('quiz.answered', { n: answeredCount })}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={quitExam}
              className="text-sm text-red-700 font-medium hover:underline"
            >
              {t('quiz.quit')}
            </button>
            <div
              className={`font-display text-2xl tabular-nums ${
                urgent ? 'timer-urgent' : 'text-brand'
              }`}
              dir="ltr"
            >
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>
        <div className="h-1 bg-brand/10">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{
              width: `${((index + 1) / Math.max(qcm.questions.length, 1)) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {!qcm.questions.length ? (
          <p className="text-center text-muted py-20">{t('quiz.noQuestions')}</p>
        ) : (
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-wider text-gold mb-2">
              {t(`levels.${qcm.level}`)} · {t('quiz.multiHint')}
            </p>
            <p className="text-xs text-muted mb-3">{t('quiz.arabicNote')}</p>
            {question.text_lang !== lang && (
              <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded-lg px-3 py-1.5 mb-3 inline-block" dir="auto">
                {question.text_lang === 'fr'
                  ? t('quiz.langFallbackFr')
                  : t('quiz.langFallbackAr')}
              </p>
            )}
            <h1
              className="font-display text-2xl md:text-3xl text-brand-dark mb-5 leading-snug content-auto"
              dir={textDir(question.text)}
            >
              {question.text}
            </h1>
            {question.image_url && (
              <img
                src={question.image_url}
                alt=""
                className="mb-5 max-h-56 rounded-xl border border-brand/10"
              />
            )}
            <div className="space-y-3">
              {question.choices.map((c) => {
                const on = selected.has(c.label);
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => toggleChoice(c.label)}
                    className={`w-full text-start rounded-xl border px-4 py-3.5 transition content-auto ${
                      on
                        ? 'border-brand bg-brand/10 shadow-sm'
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
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-brand/10 bg-sand/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded-lg px-4 py-2 border border-brand/20 disabled:opacity-40 hover:bg-white transition"
          >
            {t('quiz.prev')}
          </button>
          {index < qcm.questions.length - 1 ? (
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
              onClick={() => finish()}
              className="rounded-lg px-4 py-2 bg-gold text-brand-dark font-semibold hover:brightness-105 transition"
            >
              {t('quiz.finish')}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
