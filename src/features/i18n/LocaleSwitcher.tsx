import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Globe2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from './translations';
import { formatDate, formatNumber, useTranslation } from './useI18n';

const PREVIEW_KEYS = ['app.title', 'action.runQuery', 'query.filters', 'results.export'];

export function LocaleSwitcher() {
  const { t, locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  const demoNumber = 1284392.5;
  const demoDate = new Date();

  return (
    <div className="flex flex-col gap-3 text-start">
      <div className="relative w-56">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <Globe2 size={14} className="text-[var(--text-muted)]" />
          <span className="flex-1 text-start">
            {LOCALE_LABELS[locale].flag} {LOCALE_LABELS[locale].name}
          </span>
          <ChevronDown size={14} className={cn('transition-transform text-[var(--text-muted)]', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-panel)] shadow-card-lg"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <li key={loc}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale(loc);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-[var(--bg-panel-hover)]',
                      loc === locale ? 'text-[var(--brand)] font-medium' : 'text-[var(--text-primary)]',
                    )}
                  >
                    <span>{LOCALE_LABELS[loc].flag}</span>
                    {LOCALE_LABELS[loc].name}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-panel)] p-3 flex flex-col gap-1.5">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">Live preview</p>
        {PREVIEW_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <code className="text-[0.6875rem] text-[var(--text-muted)]">{key}</code>
            <span className="text-[var(--text-primary)]">{t(key)}</span>
          </div>
        ))}
        <div className="mt-1.5 flex items-center justify-between border-t border-[var(--border)] pt-1.5 text-xs text-[var(--text-secondary)]">
          <span>Number</span>
          <span className="font-mono">{formatNumber(demoNumber, locale)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Date</span>
          <span className="font-mono">{formatDate(demoDate, locale)}</span>
        </div>
      </div>

      {locale === 'ar' && (
        <div className="rounded-md border border-[var(--brand-border)] bg-[var(--brand-subtle)] p-3" dir="rtl">
          <p className="mb-2 text-xs text-[var(--brand)]">RTL layout automatically applied</p>
          <div className="flex flex-row-reverse items-center gap-2 rounded-md bg-[var(--bg-panel)] p-2">
            <button type="button" className="rounded bg-[var(--brand)] px-2 py-1 text-xs text-white">
              {t('action.runQuery')}
            </button>
            <button type="button" className="rounded border border-[var(--border-strong)] px-2 py-1 text-xs text-[var(--text-primary)]">
              {t('action.cancel')}
            </button>
            <Globe2 size={14} className="flip-rtl text-[var(--text-muted)]" />
          </div>
        </div>
      )}
    </div>
  );
}
