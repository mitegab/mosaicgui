import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VariableSizeGrid } from 'react-window';
import { Pin, PinOff, ArrowUp, ArrowDown, Copy, ClipboardPaste, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { useGridState } from './useGridState';
import GridCell, { GridCellData } from './GridCell';

const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 34;
const ROW_NUM_WIDTH = 52;
const DEFAULT_COL_WIDTH = 160;

interface SortState {
  field: string;
  dir: 'asc' | 'desc';
}

interface SpreadsheetGridProps {
  rows: Record<string, unknown>[];
  height?: number;
}

export function SpreadsheetGrid({ rows: externalRows, height = 480 }: SpreadsheetGridProps) {
  const {
    selectedCells,
    focusedCell,
    frozenColumns,
    columnWidths,
    selectCell,
    selectRange,
    toggleFreezeColumn,
    resizeColumn,
    clearSelection,
    selectAll,
    navigateCell,
  } = useGridState();

  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>(externalRows);
  const [sort, setSort] = useState<SortState | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const gridRef = useRef<VariableSizeGrid>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset variable size grid cache on column width changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.resetAfterColumnIndex(0);
    }
  }, [columnWidths]);

  // Sync external rows
  useEffect(() => {
    setLocalRows(externalRows);
    setIsModified(false);
  }, [externalRows]);

  const columns = useMemo(() => {
    if (!localRows.length) return [];
    return Object.keys(localRows[0]);
  }, [localRows]);

  // Sorted rows
  const displayRows = useMemo(() => {
    if (!sort) return localRows;
    return [...localRows].sort((a, b) => {
      const av = a[sort.field];
      const bv = b[sort.field];
      const av2 = av === null || av === undefined ? '' : av;
      const bv2 = bv === null || bv === undefined ? '' : bv;
      const cmp = String(av2).localeCompare(String(bv2), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [localRows, sort]);

  const handleSort = (field: string) => {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  };

  // Resize drag state
  const resizeDrag = useRef<{ col: number; startX: number; startWidth: number } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = columnWidths[colIdx] ?? DEFAULT_COL_WIDTH;
    resizeDrag.current = { col: colIdx, startX: e.clientX, startWidth };

    const onMove = (me: MouseEvent) => {
      if (!resizeDrag.current) return;
      const delta = me.clientX - resizeDrag.current.startX;
      resizeColumn(resizeDrag.current.col, resizeDrag.current.startWidth + delta);
    };
    const onUp = () => {
      resizeDrag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Cell interactions
  const handleCellClick = useCallback(
    (row: number, col: number, shiftKey: boolean) => {
      if (shiftKey && focusedCell) {
        selectRange(focusedCell.row, focusedCell.col, row, col);
      } else {
        selectCell(row, col);
      }
    },
    [focusedCell, selectCell, selectRange],
  );

  const handleCellDoubleClick = useCallback((_row: number, _col: number) => {
    // editing handled inside GridCell
  }, []);

  const handleCellEdit = useCallback(
    (rowIdx: number, colIdx: number, value: string) => {
      const col = columns[colIdx];
      setLocalRows((prev) => {
        const next = [...prev];
        next[rowIdx] = { ...next[rowIdx], [col]: value };
        return next;
      });
      setIsModified(true);
    },
    [columns],
  );

  // Clipboard helpers
  const showFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 1800);
  };

  const getSelectedValues = useCallback((): string[][] => {
    if (!selectedCells.size) return [];
    const keys = [...selectedCells].map((k) => {
      const [r, c] = k.split('-').map(Number);
      return { r, c };
    });
    const minR = Math.min(...keys.map((k) => k.r));
    const maxR = Math.max(...keys.map((k) => k.r));
    const minC = Math.min(...keys.map((k) => k.c));
    const maxC = Math.max(...keys.map((k) => k.c));
    const result: string[][] = [];
    for (let r = minR; r <= maxR; r++) {
      const row: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        const cell = displayRows[r]?.[columns[c]];
        row.push(cell === null || cell === undefined ? '' : String(cell));
      }
      result.push(row);
    }
    return result;
  }, [selectedCells, displayRows, columns]);

  const copyAsTsv = useCallback(() => {
    const vals = getSelectedValues();
    if (!vals.length) return;
    const tsv = vals.map((r) => r.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv).catch(() => {});
    showFeedback('Copied as TSV');
  }, [getSelectedValues]);

  const copyAsFullCsv = useCallback(() => {
    const header = columns.join(',');
    const body = displayRows
      .map((row) =>
        columns
          .map((c) => {
            const v = String(row[c] ?? '');
            return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(','),
      )
      .join('\n');
    navigator.clipboard.writeText(`${header}\n${body}`).catch(() => {});
    showFeedback('Copied as CSV');
  }, [columns, displayRows]);

  const copyAsJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(displayRows, null, 2)).catch(() => {});
    showFeedback('Copied as JSON');
  }, [displayRows]);

  const copyAsMarkdown = useCallback(() => {
    if (!columns.length) return;
    const header = `| ${columns.join(' | ')} |`;
    const sep = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = displayRows
      .map((row) => `| ${columns.map((c) => String(row[c] ?? '')).join(' | ')} |`)
      .join('\n');
    navigator.clipboard.writeText(`${header}\n${sep}\n${body}`).catch(() => {});
    showFeedback('Copied as Markdown');
  }, [columns, displayRows]);

  const pasteTsv = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!focusedCell) return;
      const lines = text.split('\n').filter(Boolean);
      const parsed = lines.map((l) => l.split('\t'));
      setLocalRows((prev) => {
        const next = [...prev];
        parsed.forEach((pasteRow, ri) => {
          const rowIdx = focusedCell.row + ri;
          if (rowIdx >= next.length) return;
          pasteRow.forEach((val, ci) => {
            const colIdx = focusedCell.col + ci;
            const col = columns[colIdx];
            if (!col) return;
            next[rowIdx] = { ...next[rowIdx], [col]: val };
          });
        });
        return next;
      });
      setIsModified(true);
      showFeedback('Pasted from clipboard');
    } catch {
      // ignore permission errors
    }
  }, [focusedCell, columns]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          selectAll(displayRows.length, columns.length);
        } else if (e.key === 'c') {
          e.preventDefault();
          copyAsTsv();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteTsv();
        }
        return;
      }
      const arrowMap: Record<string, Parameters<typeof navigateCell>[0]> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        Tab: 'right',
      };
      if (e.key in arrowMap) {
        e.preventDefault();
        navigateCell(arrowMap[e.key], displayRows.length, columns.length);
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [columns.length, displayRows.length, navigateCell, selectAll, clearSelection, copyAsTsv, pasteTsv]);

  // Scroll focused cell into view
  useEffect(() => {
    if (focusedCell && gridRef.current) {
      gridRef.current.scrollToItem({ rowIndex: focusedCell.row, columnIndex: focusedCell.col, align: 'smart' });
    }
  }, [focusedCell]);

  const totalWidth = ROW_NUM_WIDTH + columns.reduce((sum, _, i) => sum + (columnWidths[i] ?? DEFAULT_COL_WIDTH), 0);

  const itemData: GridCellData = useMemo(
    () => ({
      rows: displayRows,
      columns,
      selectedCells,
      focusedCell,
      frozenColumns,
      onCellClick: handleCellClick,
      onCellDoubleClick: handleCellDoubleClick,
      onCellEdit: handleCellEdit,
    }),
    [displayRows, columns, selectedCells, focusedCell, frozenColumns, handleCellClick, handleCellDoubleClick, handleCellEdit],
  );

  if (!columns.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-[var(--text-muted)]">
        <AlertCircle className="w-6 h-6 opacity-50" />
        <span className="text-sm">No data to display</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button size="xs" variant="ghost" onClick={copyAsFullCsv}>
          <Copy className="w-3 h-3" /> Copy as CSV
        </Button>
        <Button size="xs" variant="ghost" onClick={copyAsTsv}>
          <Copy className="w-3 h-3" /> Copy as TSV
        </Button>
        <Button size="xs" variant="ghost" onClick={copyAsMarkdown}>
          <Copy className="w-3 h-3" /> Copy as Markdown
        </Button>
        <Button size="xs" variant="ghost" onClick={copyAsJson}>
          <Copy className="w-3 h-3" /> Copy as JSON
        </Button>
        {isModified && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
            Modified
          </span>
        )}
        {copyFeedback && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium animate-fade-in">
            {copyFeedback}
          </span>
        )}
      </div>

      {/* Grid container */}
      <div
        ref={containerRef}
        tabIndex={0}
        className="outline-none rounded-lg border border-[var(--border)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--brand)]/40"
      >
        {/* Column headers */}
        <div
          className="flex border-b border-[var(--border)] bg-[var(--bg-sidebar)] sticky top-0 z-20 overflow-hidden"
          style={{ height: HEADER_HEIGHT, minWidth: totalWidth }}
        >
          {/* Row number header */}
          <div
            className="shrink-0 flex items-center justify-center text-[0.65rem] font-semibold text-[var(--text-muted)] border-r border-[var(--border)]"
            style={{ width: ROW_NUM_WIDTH }}
          >
            #
          </div>
          {columns.map((col, idx) => {
            const w = columnWidths[idx] ?? DEFAULT_COL_WIDTH;
            const isSorted = sort?.field === col;
            const isFrz = frozenColumns.has(idx);
            return (
              <div
                key={col}
                className={cn(
                  'relative flex items-center gap-1 px-2 text-xs font-semibold border-r border-[var(--border)] select-none shrink-0',
                  'text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)] cursor-pointer',
                  isFrz && 'bg-[var(--brand-subtle)]',
                )}
                style={{ width: w, height: HEADER_HEIGHT }}
                onClick={() => handleSort(col)}
              >
                <span className="truncate flex-1">{col}</span>
                {isSorted && (
                  sort.dir === 'asc' ? (
                    <ArrowUp className="w-3 h-3 text-[var(--brand)] shrink-0" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-[var(--brand)] shrink-0" />
                  )
                )}
                {/* Freeze button */}
                <button
                  title={isFrz ? 'Unfreeze column' : 'Freeze column'}
                  onClick={(e) => { e.stopPropagation(); toggleFreezeColumn(idx); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--brand)]"
                >
                  {isFrz ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[var(--brand)]/50 z-10"
                  onMouseDown={(e) => handleResizeMouseDown(e, idx)}
                />
              </div>
            );
          })}
        </div>

        {/* Virtualized rows */}
        <div className="relative">
          <VariableSizeGrid
            ref={gridRef}
            columnCount={columns.length}
            columnWidth={(idx: number) => columnWidths[idx] ?? DEFAULT_COL_WIDTH}
            rowCount={displayRows.length}
            rowHeight={() => ROW_HEIGHT}
            height={height - HEADER_HEIGHT}
            width={Math.min(totalWidth, 9999)}
            itemData={itemData}
            overscanRowCount={8}
            overscanColumnCount={4}
          >
            {({ rowIndex, columnIndex, style }) => (
              <div style={{ ...style, display: 'flex' }}>
                {/* Row number */}
                {columnIndex === 0 && (
                  <div
                    className="flex items-center justify-center text-[0.65rem] text-[var(--text-muted)] border-r border-b border-[var(--border)] bg-[var(--bg-sidebar)] shrink-0 select-none"
                    style={{
                      position: 'absolute',
                      left: style.left as number - ROW_NUM_WIDTH,
                      width: ROW_NUM_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  >
                    {rowIndex + 1}
                  </div>
                )}
                <GridCell
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  style={{ width: style.width, height: style.height, position: 'absolute', left: style.left, top: style.top }}
                  data={itemData}
                />
              </div>
            )}
          </VariableSizeGrid>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-[var(--border)] bg-[var(--bg-sidebar)] text-[0.65rem] text-[var(--text-muted)]">
          <span>{displayRows.length.toLocaleString()} rows × {columns.length} columns</span>
          <span className="flex items-center gap-1">
            <ClipboardPaste className="w-3 h-3" />
            Ctrl+C copy · Ctrl+V paste · Arrow keys navigate
          </span>
        </div>
      </div>
    </div>
  );
}
