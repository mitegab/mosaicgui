import { PropsWithChildren, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

type TooltipProps = PropsWithChildren<{
  content: string;
  side?: TooltipSide;
  shortcut?: string;
  className?: string;
}>;

const positionClasses: Record<TooltipSide, { wrapper: string; tip: string }> = {
  top:    { wrapper: 'bottom-full left-1/2 -translate-x-1/2 mb-2', tip: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-code)] border-t-4 border-x-4 border-x-transparent border-b-0' },
  bottom: { wrapper: 'top-full left-1/2 -translate-x-1/2 mt-2',   tip: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-code)] border-b-4 border-x-4 border-x-transparent border-t-0' },
  left:   { wrapper: 'right-full top-1/2 -translate-y-1/2 mr-2',  tip: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--bg-code)] border-l-4 border-y-4 border-y-transparent border-r-0' },
  right:  { wrapper: 'left-full top-1/2 -translate-y-1/2 ml-2',   tip: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-code)] border-r-4 border-y-4 border-y-transparent border-l-0' },
};

export function Tooltip({ content, side = 'top', shortcut, className, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 400); }}
      onMouseLeave={() => { clearTimeout(timer.current); setVisible(false); }}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'pointer-events-none absolute z-50 animate-fade-in',
            positionClasses[side].wrapper,
          )}
        >
          <div className="flex items-center gap-2 whitespace-nowrap rounded-md bg-[var(--bg-code)] border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-card-md">
            {content}
            {shortcut && <kbd className="kbd">{shortcut}</kbd>}
          </div>
        </div>
      )}
    </div>
  );
}
