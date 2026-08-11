import { useEffect, useState } from 'react';
import { getCandidateExpiresAt } from '../api';
import { useLang } from '../i18n/LanguageContext';

function computeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h:${String(minutes).padStart(2, '0')}`;
}

export default function CodeCountdown({ className = '' }) {
  const { t } = useLang();
  const [remaining, setRemaining] = useState(() => computeRemaining(getCandidateExpiresAt()));

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(getCandidateExpiresAt()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  if (!remaining) return null;

  return (
    <span
      className={`text-xs text-gold bg-gold/10 border border-gold/25 rounded-full px-3 py-1 whitespace-nowrap ${className}`}
    >
      {t('catalog.timeRemainingLabel')} <span dir="ltr">{remaining}</span>
    </span>
  );
}
