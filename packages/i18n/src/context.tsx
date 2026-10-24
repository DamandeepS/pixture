import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LocaleCode,
  LocaleMeta,
  SUPPORTED_LOCALES,
  translations,
  TranslationKey,
} from './translations.js';

interface I18nContextValue {
  locale: LocaleCode;
  localeMeta: LocaleMeta;
  setLocale: (code: LocaleCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'pixture_preferred_locale';

export function I18nProvider({
  children,
  defaultLocale = 'en',
}: {
  children: ReactNode;
  defaultLocale?: LocaleCode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode;
      if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {
      // LocalStorage unavailable
    }
    return defaultLocale;
  });

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const meta = SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];

  useEffect(() => {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [meta]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[locale] || translations.en;
    let text: string = (dict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, localeMeta: meta, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
