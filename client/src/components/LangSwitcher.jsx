import { useLang } from '../i18n/LanguageContext';

export default function LangSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-brand/20 bg-white/60 overflow-hidden text-sm ${className}`}
      role="group"
      aria-label={t('lang.switch')}
    >
      <button
        type="button"
        onClick={() => setLang('fr')}
        className={`px-2.5 py-1.5 transition ${
          lang === 'fr' ? 'bg-brand text-white' : 'text-muted hover:text-brand'
        }`}
        lang="fr"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang('ar')}
        className={`px-2.5 py-1.5 transition ${
          lang === 'ar' ? 'bg-brand text-white' : 'text-muted hover:text-brand'
        }`}
        lang="ar"
      >
        ع
      </button>
    </div>
  );
}
