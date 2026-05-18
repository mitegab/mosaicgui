import { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type PanelProps = PropsWithChildren<{
  title?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}>;

export function Panel({ title, action, className, bodyClassName, children }: PanelProps) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-white/10 bg-surface-900/80 shadow-2xl backdrop-blur', className)}>
      {(title || action) && (
        <header className="flex h-12 items-center justify-between border-b border-white/10 px-4">
          {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn('h-full', bodyClassName)}>{children}</div>
    </section>
  );
}
