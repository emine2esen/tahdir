import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setCandidateToken } from '../api';
import { useLang } from '../i18n/LanguageContext';
import { textDir } from '../i18n/translations';
import LangSwitcher from '../components/LangSwitcher';

export default function Catalog() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLogoutNotice, setShowLogoutNotice] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await api.catalog();
        if (!cancelled) setData(catalog);
      } catch (err) {
        if (err.code === 'SESSION_REPLACED' || err.status === 401) {
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
  }, [navigate]);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await api.candidateLogout();
    } catch {
      /* session déjà invalide */
    }
    setCandidateToken(null);
    setShowLogoutNotice(false);
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted">
        {t('catalog.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center">
          <p className="text-red-700 mb-4" dir="auto">
            {error}
          </p>
          <Link to="/" className="text-brand underline">
            {t('catalog.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-brand/10 bg-sand/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-xl text-brand">{t('brand')}</div>
            <p className="text-xs text-muted">{t('catalog.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button
              type="button"
              onClick={() => setShowLogoutNotice(true)}
              className="text-sm px-3 py-1.5 rounded-lg border border-brand/20 hover:bg-white/70 transition"
            >
              {t('catalog.logout')}
            </button>
          </div>
        </div>
      </header>

      {showLogoutNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-notice-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-brand/10 bg-sand p-6 shadow-xl">
            <h2
              id="logout-notice-title"
              className="font-display text-xl text-brand-dark mb-3"
            >
              {t('catalog.logoutTitle')}
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-6">
              {t('catalog.logoutWarn')}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutNotice(false)}
                disabled={loggingOut}
                className="rounded-lg border border-brand/20 px-4 py-2 text-sm hover:bg-white/70 transition"
              >
                {t('catalog.logoutCancel')}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={loggingOut}
                className="rounded-lg bg-red-700 text-white px-4 py-2 text-sm font-medium hover:bg-red-800 transition disabled:opacity-60"
              >
                {t('catalog.logoutConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {data?.assignedProfilId && (
          <p className="text-sm text-brand bg-brand/5 border border-brand/10 rounded-xl px-4 py-3">
            {t('catalog.assigned')}
          </p>
        )}

        {!data?.concours?.length && (
          <p className="text-muted text-center py-16">{t('catalog.empty')}</p>
        )}

        {data?.concours?.map((concours, i) => (
          <section
            key={concours.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <h2
              className="font-display text-2xl md:text-3xl text-brand-dark mb-1 content-auto"
              dir={textDir(concours.title)}
            >
              {concours.title}
            </h2>
            {concours.description && (
              <p
                className="text-muted mb-5 max-w-2xl content-auto"
                dir={textDir(concours.description)}
              >
                {concours.description}
              </p>
            )}

            <div className="space-y-6">
              {concours.profils.map((profil) => (
                <div key={profil.id}>
                  <h3
                    className="font-semibold text-lg text-ink mb-3 flex items-center gap-2 content-auto"
                    dir={textDir(profil.title)}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-gold shrink-0" />
                    {profil.title}
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profil.qcms.map((qcm) => (
                      <Link
                        key={qcm.id}
                        to={`/qcm/${qcm.id}`}
                        className="group block rounded-xl border border-brand/10 bg-white/65 hover:bg-white hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 p-4 transition"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gold">
                            {t('catalog.level', { n: qcm.level })}
                          </span>
                          <span className="text-xs text-muted">
                            {t('catalog.minutes', { n: qcm.duration_minutes })}
                          </span>
                        </div>
                        <div
                          className="font-medium text-brand-dark group-hover:text-brand transition content-auto"
                          dir={textDir(qcm.title)}
                        >
                          {qcm.title}
                        </div>
                        <div className="text-xs text-muted mt-2">
                          {t(`levels.${qcm.level}`)} ·{' '}
                          {t('catalog.questionsCount', { n: qcm.questions_count })}
                        </div>
                      </Link>
                    ))}
                  </div>
                  {!profil.qcms.length && (
                    <p className="text-sm text-muted">{t('catalog.noQcm')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
