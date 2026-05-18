import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-400 shadow-glow',
  secondary: 'bg-surface-800 text-slate-100 hover:bg-surface-700 border border-white/10',
  ghost: 'text-slate-300 hover:bg-white/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

export function Button({ className, variant = 'secondary', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
