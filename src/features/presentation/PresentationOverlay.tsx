import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Type, RefreshCw, Clock, X } from 'lucide-react';
import { usePresentationMode, FontSize, PollInterval } from './usePresentationMode';
import { useQueryStore } from '../../store/queryStore';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';

// ─── Live clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <span className="font-mono text-sm text-surface-300 tabular-nums">
      {hh}:{mm}:{ss}
    </span>
  );
}

// ─── Poll interval labels ─────────────────────────────────────────────────────

const POLL_OPTIONS: { value: PollInterval; label: string }[] = [
  { value: 0,     label: 'Off' },
  { value: 5000,  label: '5s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '60s' },
];

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'large',  label: 'A+' },
  { value: 'xl',     label: 'A++' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PresentationOverlay() {
  const { isPresentation, fontSize, pollIntervalMs, toggle, setFontSize, setPollInterval } =
    usePresentationMode();
  const { compileGraph } = useQueryStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up / tear down polling
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPresentation && pollIntervalMs > 0) {
      intervalRef.current = setInterval(() => {
        compileGraph();
        window.dispatchEvent(new CustomEvent('mosaic:refresh'));
      }, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPresentation, pollIntervalMs, compileGraph]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('presentation-mode');
      delete document.body.dataset.fontSize;
    };
  }, []);

  return (
    <AnimatePresence>
      {isPresentation && (
        <motion.div
          key="presentation-bar"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 48 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className={cn(
            'fixed bottom-5 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-3 px-4 py-2.5 rounded-2xl',
            'bg-surface-900/95 border border-surface-700',
            'shadow-2xl shadow-black/50',
            'backdrop-blur-md',
          )}
        >
          {/* Presentation icon */}
          <Monitor size={15} className="text-accent-400 shrink-0" />
          <span className="text-xs font-semibold text-surface-300 pr-1 border-r border-surface-700">
            Kiosk
          </span>

          {/* Font size selector */}
          <div className="flex items-center gap-1" title="Font size">
            <Type size={12} className="text-surface-500" />
            <div className="flex gap-0.5">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFontSize(opt.value)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
                    fontSize === opt.value
                      ? 'bg-accent-500 text-white'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-surface-700" />

          {/* Poll interval selector */}
          <div className="flex items-center gap-1" title="Auto-refresh interval">
            <RefreshCw size={12} className="text-surface-500" />
            <div className="flex gap-0.5">
              {POLL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPollInterval(opt.value)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
                    pollIntervalMs === opt.value
                      ? 'bg-accent-500 text-white'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-surface-700" />

          {/* Live clock */}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-surface-500" />
            <LiveClock />
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-surface-700" />

          {/* Exit button */}
          <Button
            variant="danger"
            size="sm"
            onClick={toggle}
            className="gap-1.5"
          >
            <X size={12} />
            Exit
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
