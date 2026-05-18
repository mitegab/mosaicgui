import { useRef } from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useThemeStore, type DensityMode } from '../../store/themeStore';
import { ThemePreview } from './ThemePreview';

// ─── Preset swatches ───────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: 'Purple',  value: '#7c3aed' },
  { label: 'Cyan',    value: '#0891b2' },
  { label: 'Rose',    value: '#e11d48' },
  { label: 'Amber',   value: '#d97706' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Pink',    value: '#db2777' },
  { label: 'Indigo',  value: '#4338ca' },
  { label: 'Sky',     value: '#0284c7' },
] as const;

const BG_PRESETS = [
  { label: 'Near-black', value: '#0d0d0f' },
  { label: 'Void',       value: '#050507' },
  { label: 'Slate',      value: '#0f172a' },
  { label: 'Dark grey',  value: '#111111' },
  { label: 'Navy',       value: '#0a0e1a' },
  { label: 'Charcoal',   value: '#1a1a1a' },
  { label: 'Onyx',       value: '#0c0c0c' },
  { label: 'Ink',        value: '#13131a' },
] as const;

const DENSITY_OPTIONS: { value: DensityMode; label: string; desc: string }[] = [
  { value: 'compact',     label: 'Compact',     desc: 'Dense, small padding' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing' },
  { value: 'spacious',    label: 'Spacious',    desc: 'Airy, large padding' },
];

const FONT_SCALE_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3];

// ─── Sub-components ────────────────────────────────────────────────────────

interface SwatchRowProps {
  presets: ReadonlyArray<{ label: string; value: string }>;
  current: string;
  onSelect: (v: string) => void;
  inputId: string;
  label: string;
}

function SwatchRow({ presets, current, onSelect, inputId, label }: SwatchRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="text-xs text-white/50 select-none">
          {label}
        </label>
        {/* Native color picker */}
        <div className="relative w-7 h-7 rounded-md overflow-hidden border border-white/20 cursor-pointer shrink-0">
          <input
            id={inputId}
            type="color"
            value={current}
            onChange={(e) => onSelect(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
          />
          <div
            className="absolute inset-0 rounded-md"
            style={{ background: current }}
            aria-hidden="true"
          />
        </div>
        <span className="text-[0.65rem] font-mono text-white/30 ml-auto">{current}</span>
      </div>
      {/* Swatches */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => onSelect(p.value)}
            title={p.label}
            aria-label={`${label}: ${p.label}`}
            className={cn(
              'w-5 h-5 rounded-full border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              current === p.value ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-surface-900' : 'border-white/20'
            )}
            style={{ background: p.value }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ThemeBuilder ──────────────────────────────────────────────────────────

export function ThemeBuilder() {
  const {
    accentColor,
    backgroundColor,
    density,
    fontScale,
    setAccentColor,
    setBackgroundColor,
    setDensity,
    setFontScale,
    resetToDefaults,
    exportTheme,
    importTheme,
  } = useThemeStore();

  const importRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => importRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') importTheme(text);
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-white/80 select-none">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white tracking-tight">Theme Builder</h2>
        <button
          onClick={resetToDefaults}
          title="Reset to defaults"
          className="flex items-center gap-1 text-[0.7rem] text-white/40 hover:text-white/70 transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      {/* ── Live preview ────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <ThemePreview />
      </div>

      {/* ── Accent colour ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2.5">
        <span className="text-[0.7rem] font-semibold text-white/40 uppercase tracking-wider">Accent Colour</span>
        <SwatchRow
          presets={ACCENT_PRESETS}
          current={accentColor}
          onSelect={setAccentColor}
          inputId="accent-color-picker"
          label="Accent"
        />
      </section>

      <div className="h-px bg-white/5" />

      {/* ── Background colour ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-2.5">
        <span className="text-[0.7rem] font-semibold text-white/40 uppercase tracking-wider">Background Colour</span>
        <SwatchRow
          presets={BG_PRESETS}
          current={backgroundColor}
          onSelect={setBackgroundColor}
          inputId="bg-color-picker"
          label="Background"
        />
      </section>

      <div className="h-px bg-white/5" />

      {/* ── Density ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2.5">
        <span className="text-[0.7rem] font-semibold text-white/40 uppercase tracking-wider">Density</span>
        <div className="flex gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDensity(opt.value)}
              aria-pressed={density === opt.value}
              title={opt.desc}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                density === opt.value
                  ? 'border-[var(--color-accent,#7c3aed)] bg-[var(--color-accent,#7c3aed)]/20 text-white'
                  : 'border-white/10 bg-surface-800 text-white/50 hover:border-white/20 hover:text-white/70'
              )}
            >
              {/* Visual padding preview dots */}
              <div
                className="flex justify-center mb-1"
                style={{ gap: opt.value === 'compact' ? 2 : opt.value === 'comfortable' ? 4 : 8 }}
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-current opacity-60" />
                ))}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="h-px bg-white/5" />

      {/* ── Font scale ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] font-semibold text-white/40 uppercase tracking-wider">Font Scale</span>
          <span className="text-xs font-mono text-white/60">{Math.round(fontScale * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.3}
          step={0.1}
          value={fontScale}
          onChange={(e) => setFontScale(parseFloat(e.target.value))}
          aria-label="Font scale"
          className="w-full accent-[var(--color-accent,#7c3aed)] cursor-pointer"
        />
        {/* Step markers */}
        <div className="flex justify-between px-0.5">
          {FONT_SCALE_STEPS.map((s) => (
            <button
              key={s}
              onClick={() => setFontScale(s)}
              className={cn(
                'text-[0.6rem] transition-colors',
                Math.abs(fontScale - s) < 0.01 ? 'text-[var(--color-accent,#7c3aed)]' : 'text-white/20 hover:text-white/50'
              )}
            >
              {Math.round(s * 100)}
            </button>
          ))}
        </div>
      </section>

      <div className="h-px bg-white/5" />

      {/* ── Import / Export ─────────────────────────────────────────────── */}
      <section className="flex gap-2">
        <button
          onClick={exportTheme}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium',
            'bg-surface-800 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-all'
          )}
        >
          <Download size={12} />
          Export JSON
        </button>
        <button
          onClick={handleImportClick}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium',
            'bg-surface-800 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-all'
          )}
        >
          <Upload size={12} />
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
          aria-hidden="true"
        />
      </section>
    </div>
  );
}
