import { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/toastStore';
import { cn } from '../../utils/cn';

const icons = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const colors = {
  success: 'border-l-success-400 text-success-400',
  error:   'border-l-danger-400  text-danger-400',
  warning: 'border-l-warning-400 text-warning-400',
  info:    'border-l-info-400    text-info-400',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'toast-enter flex w-80 items-start gap-3 rounded-xl border border-[var(--border-strong)]',
        'bg-[var(--bg-panel)] px-4 py-3 shadow-card-lg',
        'border-l-4',
        colors[toast.type],
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
