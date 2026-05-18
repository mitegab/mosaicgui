import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────

export type FontSizeLevel = 'normal' | 'large' | 'x-large';

export interface A11yState {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: FontSizeLevel;
  announcements: string[];
}

export interface A11yActions {
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: FontSizeLevel) => void;
  announce: (message: string) => void;
}

export type A11yStore = A11yState & A11yActions;

// ─── Side-effect helpers ───────────────────────────────────────────────────

const FONT_SCALE_MAP: Record<FontSizeLevel, string> = {
  normal:  '1',
  large:   '1.125',
  'x-large': '1.25',
};

function applyHighContrast(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('high-contrast', enabled);
}

function applyReducedMotion(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('reduce-motion', enabled);
}

function applyFontSize(size: FontSizeLevel): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--a11y-font-scale', FONT_SCALE_MAP[size]);
}

// ─── Detect OS preference at module load time ──────────────────────────────

const OS_PREFERS_REDUCED_MOTION: boolean =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Store ─────────────────────────────────────────────────────────────────

export const useA11yStore = create<A11yStore>()(
  persist(
    (set, get) => ({
      highContrast: false,
      reducedMotion: OS_PREFERS_REDUCED_MOTION,
      fontSize: 'normal',
      announcements: [],

      toggleHighContrast: () => {
        const next = !get().highContrast;
        applyHighContrast(next);
        set({ highContrast: next });
      },

      toggleReducedMotion: () => {
        const next = !get().reducedMotion;
        applyReducedMotion(next);
        set({ reducedMotion: next });
      },

      setFontSize: (fontSize) => {
        applyFontSize(fontSize);
        set({ fontSize });
      },

      announce: (message) => {
        set((s) => ({
          announcements: [...s.announcements.slice(-4), message], // keep max 5
        }));
      },
    }),
    {
      name: 'mosaic-a11y',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Honour OS preference on first run if nothing is persisted
        const reducedMotion = state.reducedMotion || OS_PREFERS_REDUCED_MOTION;
        applyHighContrast(state.highContrast);
        applyReducedMotion(reducedMotion);
        applyFontSize(state.fontSize);
        // Patch reducedMotion in case OS preference differs from stored value
        if (reducedMotion !== state.reducedMotion) {
          state.reducedMotion = reducedMotion;
        }
      },
    }
  )
);
