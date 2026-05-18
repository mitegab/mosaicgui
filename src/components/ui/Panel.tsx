import { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type PanelProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  sidebar?: boolean;
}>;

export function Panel({ title, subtitle, action, className, bodyClassName, noPadding, sidebar, children }: PanelProps) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-[10px]',
        sidebar
          ? 'bg-[var(--bg-sidebar)] text-[var(--text-sidebar)]'
          : 'bg-[var(--bg-panel)] border border-[var(--border)]',
        'shadow-card',
        className,
      )}
    >
      {(title || action) && (
        <header
          className={cn(
            'flex shrink-0 items-center justify-between',
            'h-11 px-3.5 border-b',
            sidebar ? 'border-[var(--border-sidebar)]' : 'border-[var(--border)]',
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2
                className={cn(
                  'text-[0.8125rem] font-semibold tracking-[-0.01em] truncate',
                  sidebar ? 'text-white' : 'text-[var(--text-primary)]',
                )}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-1.5 ml-2">{action}</div>}
        </header>
      )}
      <div className={cn('flex-1 min-h-0', !noPadding && '', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
