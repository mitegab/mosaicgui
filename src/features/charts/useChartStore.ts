import { create } from 'zustand';
import { useExecutionStore } from '../../store/executionStore';

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area';

const DEFAULT_PALETTE = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const PALETTES: string[][] = [
  ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'],
  ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#14b8a6'],
  ['#f97316', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'],
  ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#0ea5e9', '#d946ef'],
  ['#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#0f172a', '#020617'],
  ['#fde68a', '#fca5a5', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'],
];

export { PALETTES };

interface ChartState {
  chartType: ChartType;
  xField: string;
  yField: string;
  groupField: string | null;
  colorPalette: string[];
  activeFilters: string[];

  setChartType: (type: ChartType) => void;
  setXField: (field: string) => void;
  setYField: (field: string) => void;
  setGroupField: (field: string | null) => void;
  setColorPalette: (palette: string[]) => void;
  toggleFilter: (key: string) => void;
  clearFilters: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  chartType: 'bar',
  xField: '',
  yField: '',
  groupField: null,
  colorPalette: DEFAULT_PALETTE,
  activeFilters: [],

  setChartType: (chartType) => set({ chartType }),
  setXField: (xField) => set({ xField }),
  setYField: (yField) => set({ yField }),
  setGroupField: (groupField) => set({ groupField }),
  setColorPalette: (colorPalette) => set({ colorPalette }),
  toggleFilter: (key) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(key)
        ? state.activeFilters.filter((k) => k !== key)
        : [...state.activeFilters, key],
    })),
  clearFilters: () => set({ activeFilters: [] }),
}));

/**
 * Returns executionStore.rows filtered by activeFilters.
 * If a filter key matches a row's xField value, only those rows are included.
 * If no filters are active, all rows are returned.
 */
export function useDerivedChartData(): Record<string, unknown>[] {
  const rows = useExecutionStore((s) => s.rows);
  const { xField, activeFilters } = useChartStore();

  if (!activeFilters.length || !xField) return rows;
  return rows.filter((row) => activeFilters.includes(String(row[xField] ?? '')));
}
