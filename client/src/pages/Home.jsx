import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setCandidateToken } from '../api';
import { useLang } from '../i18n/LanguageContext';
import LangSwitcher from '../components/LangSwitcher';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLang();

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

  const features = [
    { title: t('home.feat1Title'), text: t('home.feat1Text') },
    { title: t('home.feat2Title'), text: t('home.feat2Text') },
    { title: t('home.feat3Title'), text: t('home.feat3Text') },
    { title: t('home.feat4Title'), text: t('home.feat4Text') },
    { title: t('home.feat5Title'), text: t('home.feat5Text') },
  ];

  const steps = [
    { step: '01', title: t('home.step1Title'), text: t('home.step1Text') },
    { step: '02', title: t('home.step2Title'), text: t('home.step2Text') },
    { step: '03', title: t('home.step3Title'), text: t('home.step3Text') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <div className="font-display text-2xl md:text-3xl text-brand tracking-tight">
          {t('brand')}
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <LangSwitcher />
          <Link
            to="/connexion"
            className="text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            {t('nav.login')}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative min-h-[calc(100vh-5rem)] flex items-center px-4 pb-16">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 end-[-10%] w-[55vw] h-[55vw] max-w-[520px] rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute bottom-0 start-[-5%] w-[40vw] h-[40vw] max-w-[380px] rounded-full bg-gold/20 blur-3xl" />
          </div>

          <div className="w-full max-w-3xl mx-auto text-center">
            <p className="animate-fade-up text-gold font-medium tracking-[0.12em] uppercase text-xs mb-5">
              {t('tagline')}
            </p>
            <h1 className="animate-fade-up-delay font-display text-5xl md:text-7xl text-brand-dark leading-[1.05] mb-5">
              {t('brand')}
            </h1>
            <p className="animate-fade-up-delay text-muted text-lg md:text-xl max-w-xl mx-auto mb-10">
              {t('home.hero')}
            </p>
            <div className="animate-fade-up-delay-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/simulation"
                className="inline-flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-7 py-3.5 transition"
              >
                {t('sim.tryFromHome')}
              </Link>
              <Link
                to="/connexion"
                className="inline-flex items-center justify-center rounded-xl border border-brand/25 px-7 py-3.5 text-brand-dark hover:bg-white/60 transition"
              >
                {t('home.enterCode')}
              </Link>
            </div>
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="max-w-5xl mx-auto px-4 py-20 border-t border-brand/10"
        >
          <h2 className="font-display text-3xl md:text-4xl text-brand-dark text-center mb-3">
            {t('home.howTitle')}
          </h2>
          <p className="text-muted text-center max-w-2xl mx-auto mb-12">
            {t('home.howSubtitle')}
          </p>

          <ol className="grid md:grid-cols-3 gap-8 mb-16">
            {steps.map((item, i) => (
              <li
                key={item.step}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="font-display text-4xl text-gold mb-3">{item.step}</div>
                <h3 className="font-semibold text-lg text-brand-dark mb-2">
                  {item.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ol>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {features.map((f) => (
              <article key={f.title}>
                <h3 className="font-semibold text-brand-dark mb-1.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" />
                  {f.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed ps-3.5">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
          <h2 className="font-display text-2xl md:text-3xl text-brand-dark mb-3">
            {t('home.readyTitle')}
          </h2>
          <p className="text-muted mb-6">{t('home.readyText')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/simulation"
              className="inline-flex rounded-xl border border-brand/25 px-7 py-3.5 text-brand-dark hover:bg-white/60 transition"
            >
              {t('sim.tryFromHome')}
            </Link>
            <Link
              to="/connexion"
              className="inline-flex rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-7 py-3.5 transition"
            >
              {t('home.accessExams')}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand/10 py-6 text-center text-xs text-muted">
        {t('home.footer')}
      </footer>
    </div>
  );
}
