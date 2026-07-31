import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QueryDsl } from '../../types/query';

export interface QuerySnapshot {
  id: string;
  name: string;
  dsl: QueryDsl;
  rowCountAtCapture: number;
  sampleRowsHash: string;
  capturedAt: string;
  columnsAtCapture: string[];
}

export interface RegressionResult {
  passed: boolean;
  rowCountDelta: number;
  columnsAdded: string[];
  columnsRemoved: string[];
  hashChanged: boolean;
  diffSummary: string;
}

/** Deterministic djb2 string hash — no external crypto dependency required. */
export function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // Force unsigned 32-bit representation, hex-encoded.
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function extractColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  for (const row of rows.slice(0, 20)) {
    Object.keys(row).forEach((key) => columns.add(key));
  }
  return [...columns].sort();
}

function hashSample(rows: Record<string, unknown>[]): string {
  return djb2Hash(JSON.stringify(rows.slice(0, 20)));
}

interface SnapshotState {
  snapshots: QuerySnapshot[];
  results: Record<string, RegressionResult>;
  captureSnapshot: (name: string, dsl: QueryDsl, rows: Record<string, unknown>[]) => QuerySnapshot;
  runRegression: (snapshotId: string, currentRows: Record<string, unknown>[]) => RegressionResult | null;
  deleteSnapshot: (id: string) => void;
}

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      results: {},

      captureSnapshot: (name, dsl, rows) => {
        const snapshot: QuerySnapshot = {
          id: crypto.randomUUID(),
          name,
          dsl,
          rowCountAtCapture: rows.length,
          sampleRowsHash: hashSample(rows),
          columnsAtCapture: extractColumns(rows),
          capturedAt: new Date().toISOString(),
        };
        set((state) => ({ snapshots: [snapshot, ...state.snapshots] }));
        return snapshot;
      },

      runRegression: (snapshotId, currentRows) => {
        const snapshot = get().snapshots.find((s) => s.id === snapshotId);
        if (!snapshot) return null;

        const currentColumns = extractColumns(currentRows);
        const currentHash = hashSample(currentRows);

        const columnsAdded = currentColumns.filter((c) => !snapshot.columnsAtCapture.includes(c));
        const columnsRemoved = snapshot.columnsAtCapture.filter((c) => !currentColumns.includes(c));
        const rowCountDelta = currentRows.length - snapshot.rowCountAtCapture;
        const hashChanged = currentHash !== snapshot.sampleRowsHash;

        const passed = rowCountDelta === 0 && columnsAdded.length === 0 && columnsRemoved.length === 0 && !hashChanged;

        const parts: string[] = [];
        if (rowCountDelta !== 0) {
          parts.push(`row count ${rowCountDelta > 0 ? '+' : ''}${rowCountDelta}`);
        }
        if (columnsAdded.length > 0) parts.push(`${columnsAdded.length} column(s) added`);
        if (columnsRemoved.length > 0) parts.push(`${columnsRemoved.length} column(s) removed`);
        if (hashChanged && parts.length === 0) parts.push('sample row content changed');

        const diffSummary = passed ? 'No differences detected — output matches the snapshot.' : `Differences: ${parts.join(', ')}.`;

        const result: RegressionResult = { passed, rowCountDelta, columnsAdded, columnsRemoved, hashChanged, diffSummary };
        set((state) => ({ results: { ...state.results, [snapshotId]: result } }));
        return result;
      },

      deleteSnapshot: (id) =>
        set((state) => {
          const { [id]: _removed, ...remainingResults } = state.results;
          return {
            snapshots: state.snapshots.filter((s) => s.id !== id),
            results: remainingResults,
          };
        }),
    }),
    {
      name: 'mosaic-query-snapshots',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
