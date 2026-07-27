import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getAdminToken, setAdminToken } from '../../api';
import { useLang } from '../../i18n/LanguageContext';
import LangSwitcher from '../../components/LangSwitcher';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) return;
    api
      .adminMe()
      .then(() => navigate('/admin/dashboard', { replace: true }))
      .catch(() => setAdminToken(null));
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.adminLogin(username, password);
      setAdminToken(data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="absolute top-4 end-4">
        <LangSwitcher />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-brand/10 bg-white/75 p-8 shadow-lg shadow-brand/5"
      >
        <Link to="/" className="font-display text-2xl text-brand block mb-1">
          {t('brand')}
        </Link>
        <h1 className="text-xl font-semibold text-brand-dark mb-6">
          {t('admin.loginTitle')}
        </h1>
        <label className="block text-sm mb-1">{t('admin.username')}</label>
        <input
          className="w-full mb-4 rounded-xl border border-brand/20 px-3 py-2.5 bg-sand/40 outline-none focus:ring-2 focus:ring-brand/20"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          dir="ltr"
          required
        />
        <label className="block text-sm mb-1">{t('admin.password')}</label>
        <input
          type="password"
          className="w-full mb-4 rounded-xl border border-brand/20 px-3 py-2.5 bg-sand/40 outline-none focus:ring-2 focus:ring-brand/20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
          required
        />
        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-4" dir="auto">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand text-white py-3 font-semibold hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? t('login.loading') : t('admin.login')}
        </button>
      </form>
    </div>
  );
}
