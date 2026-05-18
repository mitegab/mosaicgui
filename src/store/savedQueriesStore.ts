import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QueryDsl } from '../types/query';

export interface SavedQuery {
  id: string;
  name: string;
  dsl: QueryDsl;
  createdAt: number;
  tags?: string[];
}

interface SavedQueriesState {
  saved: SavedQuery[];
  saveQuery: (name: string, dsl: QueryDsl, tags?: string[]) => void;
  deleteQuery: (id: string) => void;
  renameQuery: (id: string, name: string) => void;
}

export const useSavedQueriesStore = create<SavedQueriesState>()(
  persist(
    (set) => ({
      saved: [],
      saveQuery: (name, dsl, tags) =>
        set((state) => ({
          saved: [
            {
              id: crypto.randomUUID(),
              name,
              dsl,
              createdAt: Date.now(),
              tags,
            },
            ...state.saved,
          ],
        })),
      deleteQuery: (id) =>
        set((state) => ({ saved: state.saved.filter((q) => q.id !== id) })),
      renameQuery: (id, name) =>
        set((state) => ({
          saved: state.saved.map((q) => (q.id === id ? { ...q, name } : q)),
        })),
    }),
    { name: 'mosaic-saved-queries' }
  )
);
