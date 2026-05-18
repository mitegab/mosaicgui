import { useRef, useEffect, PropsWithChildren } from 'react';

// ─── Focusable selector ────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface FocusTrapProps extends PropsWithChildren {
  /** When true, traps focus within children. When false, restores previous focus. */
  active?: boolean;
  /** Extra className for the wrapper element. */
  className?: string;
}

// ─── FocusTrap ─────────────────────────────────────────────────────────────

export function FocusTrap({ active = true, className, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Element to restore focus to when trap deactivates
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // On activation: save current focus and move to first focusable child
  useEffect(() => {
    if (!active) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      // Restore focus when trap deactivates or component unmounts
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [active]);

  // Keyboard handler: intercept Tab / Shift+Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!active || e.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const active_el = document.activeElement as HTMLElement;

    if (e.shiftKey) {
      // Shift+Tab: wrap from first → last
      if (active_el === first || !container.contains(active_el)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap from last → first
      if (active_el === last || !container.contains(active_el)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      // Ensure the wrapper is reachable by keyboard events
      tabIndex={active ? -1 : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
