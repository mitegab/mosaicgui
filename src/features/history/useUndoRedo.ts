import { useEffect } from 'react';
import { create } from 'zustand';
import type { Command } from './commandTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 100;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface UndoRedoState {
  past: Command[];
  future: Command[];
  canUndo: boolean;
  canRedo: boolean;

  /** Add command to past, clear future, and execute it. */
  push: (command: Command) => void;
  /** Pop from past, call undo(), push to future. */
  undo: () => void;
  /** Pop from future, call execute(), push to past. */
  redo: () => void;
  /** Wipe all history. */
  clear: () => void;
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  push: (command) => {
    command.execute();
    set((state) => {
      const past = [...state.past, command].slice(-MAX_HISTORY);
      return { past, future: [], canUndo: past.length > 0, canRedo: false };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const command = past[past.length - 1];
    command.undo();

    const newPast = past.slice(0, -1);
    const newFuture = [command, ...future];
    set({
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: newFuture.length > 0,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const command = future[0];
    command.execute();

    const newFuture = future.slice(1);
    const newPast = [...past, command].slice(-MAX_HISTORY);
    set({
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: newFuture.length > 0,
    });
  },

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}));

// ---------------------------------------------------------------------------
// Convenience selector hook
// ---------------------------------------------------------------------------

export function useUndoRedo() {
  return useUndoRedoStore();
}

// ---------------------------------------------------------------------------
// Keyboard shortcut hook
// ---------------------------------------------------------------------------

export function useUndoRedoKeyboard(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      const store = useUndoRedoStore.getState();

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        store.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
