import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: boolean;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-django-400 text-white hover:bg-django-500 active:bg-django-600 shadow-sm hover:shadow-glow-green border border-django-500/30',
  secondary: 'bg-[var(--bg-panel)] text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)] border border-[var(--border-strong)] shadow-sm',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-subtle)]',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 shadow-sm border border-danger-600/30',
  success:   'bg-success-500 text-white hover:bg-success-600 shadow-sm border border-success-600/30',
  outline:   'border border-[var(--brand-border)] text-[var(--brand)] hover:bg-[var(--brand-subtle)] bg-transparent',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1 rounded-md',
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg font-semibold',
};

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1',
        sizes[size],
        variants[variant],
        icon && '!px-0 aspect-square',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
