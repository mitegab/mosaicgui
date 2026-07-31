import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface SpringModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 16,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export function SpringModal({
  isOpen,
  onClose,
  title,
  description,
  action,
  size = 'md',
  className,
  children,
}: PropsWithChildren<SpringModalProps>) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /* Trap focus inside the modal */
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Modal */}
          <motion.div
            key="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            className={cn(
              'fixed inset-x-0 top-1/2 z-50 mx-auto -translate-y-1/2 w-full rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-2xl',
              sizeMap[size],
              className,
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            {(title || action) && (
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  {title && (
                    <h2 id="modal-title" className="text-lg font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-desc" className="mt-1 text-sm text-slate-400">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {children}

            {action && <div className="mt-5 flex justify-end gap-2">{action}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
