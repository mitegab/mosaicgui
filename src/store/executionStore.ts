import { create } from 'zustand';
import type { ExecutionMetric, ExecutionPlanStep, QueryExecutionResponse, QueryHistoryEntry } from '../types/execution';

interface ExecutionState {
  isRunning: boolean;
  rows: Record<string, unknown>[];
  metrics?: ExecutionMetric;
  orm?: string;
  logs: string[];
  executionPlan: ExecutionPlanStep[];
  history: QueryHistoryEntry[];
  error?: string;
  setRunning: (running: boolean) => void;
  setResult: (response: QueryExecutionResponse) => void;
  setError: (error?: string) => void;
  addHistory: (entry: QueryHistoryEntry) => void;
  toggleBookmark: (entryId: string) => void;
  clearHistory: () => void;
  clearResults: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  isRunning: false,
  rows: [],
  logs: [],
  executionPlan: [],
  history: [],
  setRunning: (isRunning) => set({ isRunning }),
  setResult: (response) =>
    set({
      rows: response.rows,
      metrics: response.metrics,
      orm: response.orm,
      logs: response.logs ?? [],
      executionPlan: response.executionPlan ?? [],
      error: undefined,
      isRunning: false,
    }),
  setError: (error) => set({ error, isRunning: false }),
  addHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 100) })),
  toggleBookmark: (entryId) =>
    set((state) => ({
      history: state.history.map((entry) => (entry.id === entryId ? { ...entry, bookmarked: !entry.bookmarked } : entry)),
    })),
  clearHistory: () => set({ history: [] }),
  clearResults: () => set({ rows: [], metrics: undefined, orm: undefined, logs: [], executionPlan: [], error: undefined }),
}));
