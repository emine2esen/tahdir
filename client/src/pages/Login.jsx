import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setCandidateToken } from '../api';
import { useLang } from '../i18n/LanguageContext';
import LangSwitcher from '../components/LangSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tahdir_candidate_token');
    if (!token) return;
    api
      .candidateClaim()
      .then((data) => {
        setCandidateToken(data.token);
        navigate('/catalogue', { replace: true });
      })
      .catch(() => setCandidateToken(null));
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.candidateLogin(code);
      setCandidateToken(data.token);
      navigate('/catalogue');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <Link to="/" className="font-display text-2xl md:text-3xl text-brand tracking-tight">
          {t('brand')}
        </Link>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link to="/" className="text-sm text-muted hover:text-brand transition-colors">
            {t('nav.home')}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl md:text-4xl text-brand-dark mb-2 text-center">
            {t('login.title')}
          </h1>
          <p className="text-muted text-center mb-8">{t('login.subtitle')}</p>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-brand/10 bg-white/70 backdrop-blur-sm p-6 md:p-8 shadow-[0_20px_50px_-28px_rgba(11,93,62,0.45)]"
          >
            <label className="block text-start text-sm font-medium text-brand-dark mb-2">
              {t('login.codeLabel')}
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CONCOURS-XXXX"
              dir="ltr"
              className="w-full rounded-xl border border-brand/20 bg-sand/50 px-4 py-3 text-lg tracking-wider outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-start"
              autoComplete="off"
              required
            />
            <p className="text-start text-xs text-muted mt-2 mb-5">{t('login.codeHint')}</p>
            {error && (
              <p className="text-start text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4" dir="auto">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold py-3.5 transition disabled:opacity-60"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
