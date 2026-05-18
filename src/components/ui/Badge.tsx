import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'outline';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--border)] text-[var(--text-secondary)]',
  brand:   'bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]',
  teal:    'bg-[var(--teal-subtle)] text-[var(--teal)] border border-[var(--teal-subtle)]',
  success: 'bg-success-500/10 text-success-400 border border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  danger:  'bg-danger-500/10 text-danger-400 border border-danger-500/20',
  info:    'bg-info-500/10 text-info-400 border border-info-500/20',
  outline: 'border border-[var(--border-strong)] text-[var(--text-secondary)]',
};

/** Maps Django model field types to badge variants */
export function fieldTypeBadgeVariant(type: string): BadgeVariant {
  const t = type.toLowerCase();
  if (t.includes('int') || t.includes('float') || t.includes('decimal')) return 'info';
  if (t.includes('bool'))    return 'warning';
  if (t.includes('foreign') || t.includes('relation') || t.includes('many')) return 'teal';
  if (t.includes('char') || t.includes('text') || t.includes('slug') || t.includes('url')) return 'default';
  if (t.includes('date') || t.includes('time')) return 'success';
  if (t.includes('json') || t.includes('array')) return 'danger';
  return 'brand';
}

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}>;

export function Badge({ variant = 'default', className, dot, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-success-400 animate-pulse-ring',
            variant === 'danger'  && 'bg-danger-400',
            variant === 'warning' && 'bg-warning-400',
            variant === 'brand'   && 'bg-[var(--brand)]',
            variant === 'teal'    && 'bg-[var(--teal)]',
            variant === 'info'    && 'bg-info-400',
            !['success','danger','warning','brand','teal','info'].includes(variant) && 'bg-[var(--text-muted)]',
          )}
        />
      )}
      {children}
    </span>
  );
}
