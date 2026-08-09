import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, getAdminToken, setAdminToken } from '../../api';
import { useLang } from '../../i18n/LanguageContext';
import LangSwitcher from '../../components/LangSwitcher';
import DevContact from '../../components/DevContact';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [ready, setReady] = useState(false);

  const links = [
    { to: '/admin/dashboard', label: t('admin.dashboard') },
    { to: '/admin/concours', label: t('admin.concours') },
    { to: '/admin/profils', label: t('admin.profils') },
    { to: '/admin/qcms', label: t('admin.qcms') },
    { to: '/admin/questions', label: t('admin.questions') },
    { to: '/admin/codes', label: t('admin.codes') },
  ];

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin', { replace: true });
      return;
    }
    api
      .adminMe()
      .then(() => setReady(true))
      .catch(() => {
        setAdminToken(null);
        navigate('/admin', { replace: true });
      });
  }, [navigate]);

  function logout() {
    setAdminToken(null);
    navigate('/admin');
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-muted">
        {t('admin.checking')}
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 border-b md:border-b-0 md:border-e border-brand/10 bg-brand-dark text-white shrink-0 md:flex md:flex-col">
        <div className="px-5 py-5 flex items-start justify-between gap-2">
          <div>
            <Link to="/" className="font-display text-2xl text-gold-soft">
              {t('brand')}
            </Link>
            <p className="text-xs text-white/60 mt-1">{t('admin.backoffice')}</p>
          </div>
          <LangSwitcher className="bg-white/10 border-white/20" />
        </div>
        <nav className="px-3 pb-4 flex md:flex-col gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-white/15 text-gold-soft'
                    : 'text-white/75 hover:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="text-start whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/10 mt-2"
          >
            {t('admin.logout')}
          </button>
        </nav>
        <div className="px-5 pb-4 md:mt-auto">
          <DevContact className="text-white/50" linkClassName="text-gold-soft hover:text-white" />
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
