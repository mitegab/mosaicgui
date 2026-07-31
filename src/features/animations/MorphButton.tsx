import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Play, Square } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface MorphButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isRunning: boolean;
  isLoading?: boolean;
  onRun: () => void;
  onStop: () => void;
  className?: string;
}

const spring = { type: 'spring', stiffness: 500, damping: 28 } as const;

export function MorphButton({
  isRunning,
  isLoading = false,
  onRun,
  onStop,
  className,
  ...rest
}: MorphButtonProps) {
  const handleClick = () => (isRunning ? onStop() : onRun());

  return (
    <motion.button
      layout
      onClick={handleClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors',
        isRunning
          ? 'bg-rose-600 hover:bg-rose-500'
          : 'bg-accent-500 hover:bg-accent-400 shadow-glow',
        className,
      )}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      transition={spring}
      {...(rest as object)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Running…
          </motion.span>
        ) : isRunning ? (
          <motion.span
            key="stop"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4 fill-white" />
            Stop
          </motion.span>
        ) : (
          <motion.span
            key="run"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4 fill-white" />
            Run Query
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple on click */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg bg-white/20"
        initial={{ opacity: 0, scale: 0 }}
        whileTap={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 0.25 }}
      />
    </motion.button>
  );
}
