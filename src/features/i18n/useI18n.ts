import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RTL_LOCALES, SUPPORTED_LOCALES, TRANSLATIONS, type Locale } from './translations';

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const raw = navigator.language?.toLowerCase() ?? '';
  const short = raw.split('-')[0] as Locale;
  return SUPPORTED_LOCALES.includes(short) ? short : 'en';
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: detectBrowserLocale(),
      setLocale: (locale) => {
        applyDocumentLocale(locale);
        set({ locale });
      },
    }),
    {
      name: 'mosaic-i18n',
      onRehydrateStorage: () => (state) => {
        if (state) applyDocumentLocale(state.locale);
      },
    },
  ),
);

export interface UseTranslationResult {
  t: (key: string, fallback?: string) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export function useTranslation(): UseTranslationResult {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en[key] ?? fallback ?? key;
  };

  return { t, locale, setLocale };
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeToIntlTag(locale)).format(value);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeToIntlTag(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function localeToIntlTag(locale: Locale): string {
  const tags: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'ja-JP',
    ar: 'ar-SA',
  };
  return tags[locale];
}
