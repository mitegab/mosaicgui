import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  rows?: number;
  variant?: 'text' | 'block' | 'table' | 'node-card';
}

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 1.8, repeat: Infinity, ease: 'linear' },
  },
};

function SkeletonLine({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        'rounded-md bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:400%_100%]',
        className,
      )}
      variants={shimmer}
      animate="animate"
      style={{ backgroundSize: '400% 100%' }}
    />
  );
}

export function SkeletonLoader({ className, rows = 3, variant = 'text' }: SkeletonProps) {
  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Header */}
        <div className="flex gap-3 border-b border-white/10 pb-2">
          {[120, 160, 100, 80].map((w, i) => (
            <SkeletonLine key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-3">
            {[120, 160, 100, 80].map((w, i) => (
              <SkeletonLine
                key={i}
                className="h-3"
                style={{ width: w, opacity: 1 - rowIdx * 0.12 }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'node-card') {
    return (
      <div className={cn('min-w-52 rounded-xl border border-white/10 bg-surface-900 p-3 space-y-2', className)}>
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-4 w-4 rounded-full" />
          <SkeletonLine className="h-3 w-28" />
        </div>
        <SkeletonLine className="h-2 w-20" />
        <SkeletonLine className="h-2 w-32" />
        <SkeletonLine className="h-2 w-24" />
      </div>
    );
  }

  if (variant === 'block') {
    return (
      <div className={cn('space-y-3', className)}>
        <SkeletonLine className="h-32 w-full rounded-xl" />
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine
          key={i}
          className="h-3"
          style={{ width: `${100 - i * 12}%`, opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

// Export a style attribute helper
SkeletonLine.defaultProps = {};
(SkeletonLine as React.FC<{ className?: string; style?: React.CSSProperties }> & {
  displayName?: string;
}).displayName = 'SkeletonLine';
