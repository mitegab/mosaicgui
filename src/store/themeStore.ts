import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────

export type DensityMode = 'compact' | 'comfortable' | 'spacious';

export interface ThemeState {
  accentColor: string;
  backgroundColor: string;
  density: DensityMode;
  fontScale: number; // 0.8 – 1.3 (80% – 130%)
}

export interface ThemeActions {
  setAccentColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setDensity: (density: DensityMode) => void;
  setFontScale: (scale: number) => void;
  resetToDefaults: () => void;
  exportTheme: () => void;
  importTheme: (json: string) => void;
}

export type ThemeStore = ThemeState & ThemeActions;

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULTS: ThemeState = {
  accentColor: '#7c3aed',      // purple-700
  backgroundColor: '#0d0d0f',  // near-black
  density: 'comfortable',
  fontScale: 1.0,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Very simple hex → RGB luminance-based lightening (no deps). */
function lightenHex(hex: string, amount = 30): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8)  & 0xff) + amount);
  const b = Math.min(255, ((num)       & 0xff) + amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const STYLE_TAG_ID = 'mosaic-theme-vars';

function injectAccentVariables(accent: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = `:root {
  --color-accent: ${accent};
  --color-accent-hover: ${lightenHex(accent, 30)};
}`;
}

function applyDensity(density: DensityMode): void {
  if (typeof document === 'undefined') return;
  document.body.setAttribute('data-density', density);
}

function applyFontScale(scale: number): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--font-scale', String(scale));
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      setAccentColor: (accentColor) => {
        injectAccentVariables(accentColor);
        set({ accentColor });
      },

      setBackgroundColor: (backgroundColor) => {
        set({ backgroundColor });
      },

      setDensity: (density) => {
        applyDensity(density);
        set({ density });
      },

      setFontScale: (fontScale) => {
        applyFontScale(fontScale);
        set({ fontScale });
      },

      resetToDefaults: () => {
        injectAccentVariables(DEFAULTS.accentColor);
        applyDensity(DEFAULTS.density);
        applyFontScale(DEFAULTS.fontScale);
        set({ ...DEFAULTS });
      },

      exportTheme: () => {
        const { accentColor, backgroundColor, density, fontScale } = get();
        const json = JSON.stringify({ accentColor, backgroundColor, density, fontScale }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'mosaic-theme.json';
        a.click();
        URL.revokeObjectURL(url);
      },

      importTheme: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<ThemeState>;
          const next: ThemeState = {
            accentColor:     parsed.accentColor     ?? DEFAULTS.accentColor,
            backgroundColor: parsed.backgroundColor ?? DEFAULTS.backgroundColor,
            density:         parsed.density         ?? DEFAULTS.density,
            fontScale:       parsed.fontScale        ?? DEFAULTS.fontScale,
          };
          injectAccentVariables(next.accentColor);
          applyDensity(next.density);
          applyFontScale(next.fontScale);
          set(next);
        } catch (err) {
          console.error('[themeStore] Failed to import theme:', err);
        }
      },
    }),
    {
      name: 'mosaic-theme',
      // Re-apply side-effects after hydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        injectAccentVariables(state.accentColor);
        applyDensity(state.density);
        applyFontScale(state.fontScale);
      },
    }
  )
);
