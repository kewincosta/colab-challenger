import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

type TranslationValue = string | { [key: string]: string | TranslationValue };

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'municipal-service-lang';

function getNestedValue(obj: { [key: string]: string | TranslationValue }, path: string): string {
  const keys = path.split('.');
  let current: string | TranslationValue = obj;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'ptBR' || stored === 'enUS') ? stored : 'ptBR';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = (key: string): string => {
    const translationObj = translations[lang] as { [key: string]: string | TranslationValue };
    return getNestedValue(translationObj, key);
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const value: I18nContextType = { lang, setLang, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
