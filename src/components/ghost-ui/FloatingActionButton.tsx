import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

type Position = 'top-right' | 'bottom-right' | 'bottom-left';

interface FloatingActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  position?: Position;
  className?: string;
}

const positionClasses: Record<Position, string> = {
  'top-right':    'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left':  'bottom-4 left-4',
};

const tooltipSide: Record<Position, string> = {
  'top-right':    'left-full ml-2 top-1/2 -translate-y-1/2',
  'bottom-right': 'right-full mr-2 top-1/2 -translate-y-1/2',
  'bottom-left':  'left-full ml-2 top-1/2 -translate-y-1/2',
};

const tooltipOrigin: Record<Position, { initial: object; animate: object }> = {
  'top-right':    { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 } },
  'bottom-right': { initial: { opacity: 0, x: 6 },  animate: { opacity: 1, x: 0 } },
  'bottom-left':  { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 } },
};

export function FloatingActionButton({
  icon,
  label,
  onClick,
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) {
  return (
    <div
      className={cn(
        'absolute group',
        positionClasses[position],
        className,
      )}
    >
      {/* Button */}
      <motion.button
        onClick={onClick}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'w-10 h-10 rounded-full',
          'flex items-center justify-center',
          'bg-accent-500 text-white',
          'shadow-lg shadow-accent-500/30',
          'border border-accent-400/30',
          // Ghost reveal: hidden by default, shown on group (parent) hover
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
        )}
        aria-label={label}
      >
        {icon}
      </motion.button>

      {/* Tooltip */}
      <motion.span
        initial={tooltipOrigin[position].initial}
        whileHover={tooltipOrigin[position].animate}
        className={cn(
          'absolute pointer-events-none',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75',
          tooltipSide[position],
          'whitespace-nowrap',
          'px-2 py-1 rounded-md text-xs font-medium',
          'bg-surface-800 text-surface-200 border border-surface-700',
          'shadow-lg',
        )}
      >
        {label}
      </motion.span>
    </div>
  );
}
