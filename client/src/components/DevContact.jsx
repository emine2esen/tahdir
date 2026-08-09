import { useLang } from '../i18n/LanguageContext';

const DEV_WHATSAPP = '22227707210';

export default function DevContact({ className = '', linkClassName = 'text-brand hover:text-brand-dark' }) {
  const { t } = useLang();

  return (
    <p className={`text-xs ${className}`}>
      {t('dev.label')} : {t('dev.name')} ·{' '}
      <a
        href={`https://wa.me/${DEV_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`transition ${linkClassName}`}
        dir="ltr"
      >
        {t('dev.contact')} (+222 27707210)
      </a>
    </p>
  );
}
