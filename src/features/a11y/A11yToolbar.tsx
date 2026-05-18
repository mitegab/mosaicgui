import { Moon, Sun, Minus, Plus, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useA11yStore, type FontSizeLevel } from './useA11yStore';

// ─── Font size cycle helpers ───────────────────────────────────────────────

const FONT_SIZES: FontSizeLevel[] = ['normal', 'large', 'x-large'];

function nextFontSize(current: FontSizeLevel): FontSizeLevel {
  const idx = FONT_SIZES.indexOf(current);
  return FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
}

function prevFontSize(current: FontSizeLevel): FontSizeLevel {
  const idx = FONT_SIZES.indexOf(current);
  return FONT_SIZES[Math.max(idx - 1, 0)];
}

const FONT_SIZE_LABELS: Record<FontSizeLevel, string> = {
  normal:  'Normal text size',
  large:   'Large text size',
  'x-large': 'Extra-large text size',
};

// ─── A11yToolbar ──────────────────────────────────────────────────────────

export function A11yToolbar() {
  const { highContrast, reducedMotion, fontSize, toggleHighContrast, toggleReducedMotion, setFontSize, announce } =
    useA11yStore();

  // Skip framer-motion animations if reduced motion is active
  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: -16 },
        animate: { opacity: 1, x: 0 },
        exit:    { opacity: 0, x: -16 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
      };

  const handleToggleContrast = () => {
    toggleHighContrast();
    announce(highContrast ? 'High contrast disabled' : 'High contrast enabled');
  };

  const handleToggleMotion = () => {
    toggleReducedMotion();
    announce(reducedMotion ? 'Animations enabled' : 'Animations reduced');
  };

  const handleIncreaseFontSize = () => {
    const next = nextFontSize(fontSize);
    if (next === fontSize) return;
    setFontSize(next);
    announce(FONT_SIZE_LABELS[next]);
  };

  const handleDecreaseFontSize = () => {
    const prev = prevFontSize(fontSize);
    if (prev === fontSize) return;
    setFontSize(prev);
    announce(FONT_SIZE_LABELS[prev]);
  };

  const btnClass = cn(
    'flex items-center justify-center w-8 h-8 rounded-lg',
    'bg-surface-800/80 border border-white/10',
    'text-white/60 hover:text-white hover:bg-surface-700/80 hover:border-white/20',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
  );

  return (
    <div
      role="toolbar"
      aria-label="Accessibility controls"
      style={{ position: 'fixed', bottom: 24, left: 16, zIndex: 9998 }}
    >
      <AnimatePresence>
        <motion.div
          key="a11y-toolbar"
          {...motionProps}
          className="flex flex-col gap-1.5 p-1.5 rounded-xl bg-surface-900/90 backdrop-blur border border-white/10 shadow-2xl"
        >
          {/* High contrast toggle */}
          <button
            onClick={handleToggleContrast}
            aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            aria-pressed={highContrast}
            title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            className={cn(btnClass, highContrast && 'bg-amber-500/20 border-amber-400/40 text-amber-300')}
          >
            {highContrast ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Reduce motion toggle */}
          <button
            onClick={handleToggleMotion}
            aria-label={reducedMotion ? 'Enable animations' : 'Reduce motion'}
            aria-pressed={reducedMotion}
            title={reducedMotion ? 'Enable animations' : 'Reduce motion'}
            className={cn(btnClass, reducedMotion && 'bg-blue-500/20 border-blue-400/40 text-blue-300')}
          >
            {reducedMotion ? <ZapOff size={14} /> : <Zap size={14} />}
          </button>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-1" />

          {/* Font size increase */}
          <button
            onClick={handleIncreaseFontSize}
            aria-label="Increase font size"
            disabled={fontSize === 'x-large'}
            title="Increase font size"
            className={cn(btnClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
          >
            <Plus size={14} />
          </button>

          {/* Font size label */}
          <div
            aria-label={`Current font size: ${FONT_SIZE_LABELS[fontSize]}`}
            title={FONT_SIZE_LABELS[fontSize]}
            className="flex items-center justify-center text-[0.55rem] font-mono text-white/30 h-4"
          >
            {fontSize === 'normal' ? 'Aa' : fontSize === 'large' ? 'AA' : 'A+'}
          </div>

          {/* Font size decrease */}
          <button
            onClick={handleDecreaseFontSize}
            aria-label="Decrease font size"
            disabled={fontSize === 'normal'}
            title="Decrease font size"
            className={cn(btnClass, 'disabled:opacity-30 disabled:cursor-not-allowed')}
          >
            <Minus size={14} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
