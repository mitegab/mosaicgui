import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { useExecuteQuery } from '../features/query-builder/useExecuteQuery';

export function useKeyboardShortcuts() {
  const { toggleLeftSidebar, toggleBottomPanel, toggleDarkMode, setCommandPaletteOpen } = useUiStore();
  const { run, stop } = useExecuteQuery();
  const isRunning = false; // will be overridden in component context if needed

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Global shortcuts (work everywhere)
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Shortcuts that skip when typing in inputs
      if (isEditing) return;

      if (meta && e.key === 'Enter') {
        e.preventDefault();
        run();
        return;
      }
      if (e.key === '\\') {
        e.preventDefault();
        toggleLeftSidebar();
        return;
      }
      if (e.key === '`') {
        e.preventDefault();
        toggleBottomPanel();
        return;
      }
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDarkMode();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [run, stop, isRunning, toggleLeftSidebar, toggleBottomPanel, toggleDarkMode, setCommandPaletteOpen]);
}
