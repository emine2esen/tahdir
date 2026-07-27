import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredLang, storeLang, t as translate } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.classList.toggle('lang-ar', lang === 'ar');
    document.body.classList.toggle('lang-fr', lang === 'fr');
    document.title =
      lang === 'ar'
        ? 'تَحضير — التحضير للمسابقات'
        : 'Tahdir — Préparation aux concours';
  }, [lang]);

  const value = useMemo(() => {
    function setLang(next) {
      storeLang(next);
      setLangState(next);
    }
    function t(path, vars) {
      return translate(lang, path, vars);
    }
    return { lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr', isAr: lang === 'ar' };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
