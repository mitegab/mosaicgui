import { useRef, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bookmark, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CanvasBookmark {
  id: string;
  name: string;
  x: number;
  y: number;
  zoom: number;
  color: string;
  createdAt: number;
}

interface CanvasBookmarkState {
  bookmarks: CanvasBookmark[];
  addBookmark: (name: string, viewport: { x: number; y: number; zoom: number }) => void;
  removeBookmark: (id: string) => void;
  jumpTo: (bookmark: CanvasBookmark, setViewport: (vp: { x: number; y: number; zoom: number }, opts?: { duration: number }) => void) => void;
}

// ─── Colour palette cycling ───────────────────────────────────────────────────

const COLORS = [
  '#a78bfa', // violet
  '#34d399', // emerald
  '#60a5fa', // blue
  '#f59e0b', // amber
  '#f472b6', // pink
  '#38bdf8', // sky
  '#fb923c', // orange
];

let colorIdx = 0;
function nextColor() {
  return COLORS[colorIdx++ % COLORS.length];
}

// ─── Zustand store (persisted to localStorage) ────────────────────────────────

export const useCanvasBookmarks = create<CanvasBookmarkState>()(
  persist(
    (set) => ({
      bookmarks: [],

      addBookmark: (name, viewport) =>
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              id: `bm-${Date.now()}`,
              name,
              x: viewport.x,
              y: viewport.y,
              zoom: viewport.zoom,
              color: nextColor(),
              createdAt: Date.now(),
            },
          ],
        })),

      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((bm) => bm.id !== id),
        })),

      jumpTo: (bookmark, setViewport) => {
        setViewport({ x: bookmark.x, y: bookmark.y, zoom: bookmark.zoom }, { duration: 500 });
      },
    }),
    { name: 'mosaic-canvas-bookmarks' },
  ),
);

// ─── CanvasBookmarkBar ────────────────────────────────────────────────────────

interface CanvasBookmarkBarProps {
  /** Called when the user clicks a bookmark pill */
  onJump: (bookmark: CanvasBookmark) => void;
  /** Provides the current viewport so we can save it */
  getCurrentViewport: () => { x: number; y: number; zoom: number };
}

export function CanvasBookmarkBar({ onJump, getCurrentViewport }: CanvasBookmarkBarProps) {
  const { bookmarks, addBookmark, removeBookmark } = useCanvasBookmarks();
  const [isAdding, setIsAdding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    setIsAdding(true);
    setNameInput('');
    // Focus the input on next tick
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleConfirm() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      addBookmark(trimmed, getCurrentViewport());
    }
    setIsAdding(false);
    setNameInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNameInput('');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-surface-900/90 px-2 py-1.5 backdrop-blur">
      <Bookmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />

      {bookmarks.map((bm) => (
        <span
          key={bm.id}
          className="group flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-surface-800 px-2 py-0.5 text-xs text-slate-200 hover:bg-surface-700"
          onClick={() => onJump(bm)}
          onContextMenu={(e) => {
            e.preventDefault();
            removeBookmark(bm.id);
          }}
          title={`Jump to "${bm.name}" (right-click to remove)`}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: bm.color }}
          />
          {bm.name}
          <button
            className="ml-0.5 hidden rounded-full p-0.5 hover:bg-white/10 group-hover:block"
            onClick={(e) => {
              e.stopPropagation();
              removeBookmark(bm.id);
            }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {isAdding ? (
        <input
          ref={inputRef}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={handleKeyDown}
          placeholder="Bookmark name…"
          className="h-6 w-32 rounded-lg border border-accent-400/40 bg-surface-800 px-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-accent-400"
        />
      ) : (
        <button
          onClick={handleAdd}
          className="rounded-lg border border-dashed border-white/20 bg-transparent px-2 py-0.5 text-xs text-slate-400 hover:border-white/40 hover:text-slate-200"
        >
          + Bookmark view
        </button>
      )}
    </div>
  );
}
