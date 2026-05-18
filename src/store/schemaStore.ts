import { create } from 'zustand';
import type { SchemaField, SchemaModel } from '../types/schema';

interface SchemaState {
  models: SchemaModel[];
  selectedModel?: string;
  selectedField?: SchemaField;
  favorites: string[];
  pinnedModels: string[];
  setModels: (models: SchemaModel[]) => void;
  selectModel: (model?: string) => void;
  selectField: (field?: SchemaField) => void;
  toggleFavorite: (model: string) => void;
  togglePinnedModel: (model: string) => void;
}

export const useSchemaStore = create<SchemaState>((set) => ({
  models: [],
  favorites: [],
  pinnedModels: [],
  setModels: (models) => set({ models }),
  selectModel: (selectedModel) => set({ selectedModel }),
  selectField: (selectedField) => set({ selectedField }),
  toggleFavorite: (model) =>
    set((state) => ({
      favorites: state.favorites.includes(model) ? state.favorites.filter((item) => item !== model) : [...state.favorites, model],
    })),
  togglePinnedModel: (model) =>
    set((state) => ({
      pinnedModels: state.pinnedModels.includes(model)
        ? state.pinnedModels.filter((item) => item !== model)
        : [...state.pinnedModels, model],
    })),
}));
