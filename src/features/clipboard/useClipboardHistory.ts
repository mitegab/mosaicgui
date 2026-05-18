import React, { useCallback, useEffect, useState } from 'react';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { copyToClipboard } from './clipboardUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClipboardEntryType = 'text' | 'json' | 'dsn' | 'tsv';

export interface ClipboardItem {
  id: string;
  content: string;
  type: ClipboardEntryType;
  copiedAt: string; // ISO 8601
}

const STORAGE_KEY = 'mosaic_clipboard_history';
const MAX_ITEMS = 10;

// ─── Session-storage helpers ─────────────────────────────────────────────────

function loadHistory(): ClipboardItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClipboardItem[];
  } catch {
    return [];
  }
}

function saveHistory(items: ClipboardItem[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useClipboardHistory() {
  const [history, setHistory] = useState<ClipboardItem[]>(loadHistory);

  // Persist on every change
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addEntry = useCallback((content: string, type: ClipboardEntryType) => {
    const entry: ClipboardItem = {
      id: crypto.randomUUID(),
      content,
      type,
      copiedAt: new Date().toISOString(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_ITEMS));
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, clear };
}

// ─── ClipboardHistoryPanel ────────────────────────────────────────────────────

interface ClipboardHistoryPanelProps {
  className?: string;
}

/**
 * Renders a compact panel listing the last 10 clipboard entries.
 * Each entry has a "Restore" button that re-copies the content.
 *
 * NOTE: This is a plain function component exported from the same file.
 * Import it as: import { ClipboardHistoryPanel } from './useClipboardHistory'
 */
export function ClipboardHistoryPanel({ className }: ClipboardHistoryPanelProps) {
  const { history, addEntry, clear } = useClipboardHistory();

  const handleRestore = async (item: ClipboardItem) => {
    await copyToClipboard(item.content).catch(() => {});
    // Re-add it as a fresh copy so it appears at the top
    addEntry(item.content, item.type);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const typeBadgeClass: Record<ClipboardEntryType, string> = {
    text: 'bg-slate-500/20 text-slate-400',
    json: 'bg-amber-500/20 text-amber-400',
    dsn: 'bg-purple-500/20 text-purple-400',
    tsv: 'bg-cyan-500/20 text-cyan-400',
  };

  // Return JSX — we call React.createElement so this file doesn't need .tsx extension
  // but we'll use JSX syntax since this project uses TSX anyway via TypeScript
  return React.createElement(
    'div',
    {
      className: cn(
        'flex flex-col rounded-[10px] border border-[var(--border)] bg-[var(--bg-panel)] shadow-card overflow-hidden',
        className,
      ),
    },
    // Header
    React.createElement(
      'header',
      { className: 'flex items-center justify-between h-11 px-3.5 border-b border-[var(--border)]' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--text-primary)]' },
        React.createElement(Clock, { className: 'w-3.5 h-3.5 text-[var(--text-muted)]' }),
        'Clipboard History',
      ),
      history.length > 0 &&
        React.createElement(
          'button',
          {
            onClick: clear,
            title: 'Clear history',
            className: 'flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-danger-400 transition-colors',
          },
          React.createElement(Trash2, { className: 'w-3 h-3' }),
          'Clear',
        ),
    ),
    // Body
    React.createElement(
      'div',
      { className: 'flex flex-col divide-y divide-[var(--border)] max-h-80 overflow-y-auto' },
      history.length === 0
        ? React.createElement(
            'div',
            { className: 'flex items-center justify-center h-16 text-xs text-[var(--text-muted)]' },
            'No clipboard history yet',
          )
        : history.map((item) =>
            React.createElement(
              'div',
              { key: item.id, className: 'flex items-start gap-2 px-3 py-2 hover:bg-[var(--bg-panel-hover)] group' },
              // Type badge + content preview
              React.createElement(
                'div',
                { className: 'flex-1 min-w-0 flex flex-col gap-0.5' },
                React.createElement(
                  'div',
                  { className: 'flex items-center gap-1.5' },
                  React.createElement(
                    'span',
                    {
                      className: cn(
                        'text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-full',
                        typeBadgeClass[item.type],
                      ),
                    },
                    item.type,
                  ),
                  React.createElement(
                    'span',
                    { className: 'text-[0.65rem] text-[var(--text-muted)]' },
                    formatTime(item.copiedAt),
                  ),
                ),
                React.createElement(
                  'p',
                  {
                    className: 'text-xs text-[var(--text-primary)] font-mono truncate',
                    title: item.content,
                  },
                  item.content,
                ),
              ),
              // Restore button
              React.createElement(
                'button',
                {
                  onClick: () => handleRestore(item),
                  title: 'Re-copy to clipboard',
                  className:
                    'shrink-0 flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors opacity-0 group-hover:opacity-100',
                },
                React.createElement(RotateCcw, { className: 'w-3 h-3' }),
                'Restore',
              ),
            ),
          ),
    ),
  );
}
