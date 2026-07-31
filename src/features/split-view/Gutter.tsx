import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GutterProps {
  orientation: 'vertical' | 'horizontal';
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function Gutter({ orientation, onMouseDown, className }: GutterProps) {
  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      onMouseDown={onMouseDown}
      className={cn(
        'group relative z-20 shrink-0 select-none transition-colors',
        isVertical
          ? 'w-2 cursor-col-resize hover:bg-accent-500/20'
          : 'h-2 cursor-row-resize hover:bg-accent-500/20',
        className,
      )}
      whileHover={{ scale: 1 }}
    >
      {/* Drag indicator dots */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-0.5',
          isVertical ? 'flex-col' : 'flex-row',
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1 w-1 rounded-full bg-white/20 transition group-hover:bg-accent-400/60"
          />
        ))}
      </div>

      {/* Expanded hit-area */}
      <div
        className={cn(
          'absolute',
          isVertical ? 'inset-x-[-6px] inset-y-0' : 'inset-x-0 inset-y-[-6px]',
        )}
      />
    </motion.div>
  );
}
