import { useCallback, useRef, useState } from 'react';

export interface PanelLayout {
  leftWidth: number;    // px
  rightWidth: number;   // px
  bottomHeight: number; // px
}

export interface SavedLayout {
  id: string;
  name: string;
  layout: PanelLayout;
  savedAt: string;
}

const PRESETS: Record<string, PanelLayout> = {
  default:          { leftWidth: 320, rightWidth: 380, bottomHeight: 260 },
  'wide-canvas':    { leftWidth: 220, rightWidth: 300, bottomHeight: 180 },
  'inspector-focus':{ leftWidth: 280, rightWidth: 520, bottomHeight: 260 },
  compact:          { leftWidth: 240, rightWidth: 300, bottomHeight: 180 },
};

const STORAGE_KEY = 'mosaic-layouts';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadSaved(): SavedLayout[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useResizablePanels() {
  const [layout, setLayout] = useState<PanelLayout>(PRESETS.default);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(loadSaved);
  const isDragging = useRef(false);

  /* ── Left gutter ── */
  const leftGutterHandlers = useCallback(() => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startX = e.clientX;
      const startW = layout.leftWidth;

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        setLayout((prev) => ({
          ...prev,
          leftWidth: clamp(startW + ev.clientX - startX, 180, 600),
        }));
      };
      const onUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  }), [layout.leftWidth]);

  /* ── Right gutter ── */
  const rightGutterHandlers = useCallback(() => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startX = e.clientX;
      const startW = layout.rightWidth;

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        // Dragging right gutter left increases the right panel
        setLayout((prev) => ({
          ...prev,
          rightWidth: clamp(startW - (ev.clientX - startX), 200, 600),
        }));
      };
      const onUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  }), [layout.rightWidth]);

  /* ── Bottom gutter ── */
  const bottomGutterHandlers = useCallback(() => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startY = e.clientY;
      const startH = layout.bottomHeight;

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        setLayout((prev) => ({
          ...prev,
          bottomHeight: clamp(startH - (ev.clientY - startY), 100, 500),
        }));
      };
      const onUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  }), [layout.bottomHeight]);

  const saveLayout = useCallback(
    (name: string) => {
      const entry: SavedLayout = {
        id: crypto.randomUUID(),
        name,
        layout,
        savedAt: new Date().toISOString(),
      };
      const next = [entry, ...savedLayouts].slice(0, 10);
      setSavedLayouts(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [layout, savedLayouts],
  );

  const loadLayout = useCallback((saved: SavedLayout) => setLayout(saved.layout), []);

  const deleteLayout = useCallback(
    (id: string) => {
      const next = savedLayouts.filter((l) => l.id !== id);
      setSavedLayouts(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [savedLayouts],
  );

  const applyPreset = useCallback(
    (preset: keyof typeof PRESETS) => setLayout(PRESETS[preset]),
    [],
  );

  return {
    layout,
    leftGutterHandlers,
    rightGutterHandlers,
    bottomGutterHandlers,
    saveLayout,
    loadLayout,
    deleteLayout,
    savedLayouts,
    applyPreset,
    presetNames: Object.keys(PRESETS) as (keyof typeof PRESETS)[],
  };
}
