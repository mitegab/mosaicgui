import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Save, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { SavedLayout } from './useResizablePanels';

interface LayoutManagerProps {
  savedLayouts: SavedLayout[];
  presetNames: string[];
  onLoad: (layout: SavedLayout) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onApplyPreset: (name: string) => void;
  onClose: () => void;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function LayoutManager({
  savedLayouts,
  presetNames,
  onLoad,
  onSave,
  onDelete,
  onApplyPreset,
  onClose,
}: LayoutManagerProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-72 rounded-xl border border-white/10 bg-surface-900 p-4 shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <LayoutGrid className="h-4 w-4 text-accent-300" /> Workspace Layouts
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preset buttons */}
      <div className="mb-3 space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {presetNames.map((preset) => (
            <button
              key={preset}
              onClick={() => onApplyPreset(preset)}
              className="rounded-lg border border-white/10 bg-surface-800 px-2.5 py-1 text-xs capitalize text-slate-200 hover:bg-surface-700 transition"
            >
              {preset.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Save current */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">Save current</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onSave(name.trim()); setName(''); } }}
            placeholder="Layout name…"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-surface-950 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-accent-500 transition"
          />
          <Button
            variant="primary"
            className="px-2.5 py-1.5 text-xs"
            disabled={!name.trim()}
            onClick={() => { onSave(name.trim()); setName(''); }}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Saved layouts */}
      {savedLayouts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Saved</p>
          {savedLayouts.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-950 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{saved.name}</p>
                <p className="text-[10px] text-slate-500">{relativeTime(saved.savedAt)}</p>
              </div>
              <button
                onClick={() => onLoad(saved)}
                className="rounded px-2 py-0.5 text-[10px] text-accent-300 hover:bg-accent-500/20 transition"
              >
                Load
              </button>
              <button
                onClick={() => onDelete(saved.id)}
                className="rounded p-1 text-slate-500 hover:text-rose-300 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
