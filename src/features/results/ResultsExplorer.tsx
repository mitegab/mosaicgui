import { useCallback, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Download, FileJson, GripVertical, Table2 } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useExecutionStore } from '../../store/executionStore';
import { useUiStore } from '../../store/uiStore';
import { toast } from '../../store/toastStore';
import { cn } from '../../utils/cn';

const MIN_COL_WIDTH = 80;
const DEFAULT_COL_WIDTH = 160;

export function ResultsExplorer() {
  const [jsonMode, setJsonMode]       = useState(false);
  const [expandedRow, setExpandedRow] = useState<Record<string, unknown> | null>(null);
  const [colWidths, setColWidths]     = useState<Record<string, number>>({});

  const rows    = useExecutionStore((s) => s.rows);
  const metrics = useExecutionStore((s) => s.metrics);
  const error   = useExecutionStore((s) => s.error);
  const { toggleBottomPanel } = useUiStore();

  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).slice(0, 50),
    [rows],
  );

  /* ── Column resize ─────────────────────────────────────────────── */
  const dragRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

  const startResize = useCallback((col: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startW = colWidths[col] ?? DEFAULT_COL_WIDTH;
    dragRef.current = { col, startX: e.clientX, startW };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = ev.clientX - dragRef.current.startX;
      setColWidths((prev) => ({
        ...prev,
        [dragRef.current!.col]: Math.max(MIN_COL_WIDTH, dragRef.current!.startW + delta),
      }));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const colW = (col: string) => colWidths[col] ?? DEFAULT_COL_WIDTH;
  const totalW = columns.reduce((sum, col) => sum + colW(col), 0);

  function handleExport(format: 'csv' | 'json') {
    exportRows(rows, format);
    toast('success', `Exported as ${format.toUpperCase()}`, `${rows.length} rows downloaded`);
  }

  const metricsNode = metrics && (
    <div className="flex items-center gap-2">
      <Badge variant="brand" dot>{metrics.rowsReturned} rows</Badge>
      <Badge variant={metrics.executionTimeMs > 1000 ? 'warning' : 'teal'}>
        {metrics.executionTimeMs}ms
      </Badge>
      {metrics.cacheHit && <Badge variant="success">cache hit</Badge>}
    </div>
  );

  return (
    <Panel
      title="Results Explorer"
      className="h-full"
      action={
        <div className="flex items-center gap-1.5">
          {metricsNode}
          <Button variant="ghost" size="xs" onClick={() => setJsonMode((v) => !v)}>
            {jsonMode ? <Table2 className="h-3.5 w-3.5" /> : <FileJson className="h-3.5 w-3.5" />}
            {jsonMode ? 'Grid' : 'JSON'}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleExport(jsonMode ? 'json' : 'csv')}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <button
            onClick={toggleBottomPanel}
            title="Collapse results"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors text-[0.6rem] font-mono"
          >
            ▼
          </button>
        </div>
      }
      bodyClassName="grid grid-cols-[minmax(0,1fr)_280px] h-full"
    >
      {/* Main results area */}
      <div className="min-h-0 overflow-hidden flex flex-col p-2">
        {error && (
          <div className="mb-2 shrink-0 flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/8 px-3 py-2.5 text-xs text-danger-400">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full rounded-lg border border-dashed border-[var(--border-strong)] text-center p-6">
            <Table2 className="h-10 w-10 text-[var(--border-strong)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">No results yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Run a query to see tabular data, JSON, and export options
              </p>
            </div>
            <kbd className="kbd">⌘↵ to run</kbd>
          </div>
        ) : jsonMode ? (
          <pre className="flex-1 overflow-auto rounded-lg bg-[var(--bg-code)] border border-[var(--border)] p-3 text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
            {JSON.stringify(rows, null, 2)}
          </pre>
        ) : (
          <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border)]">
            {/* Header */}
            <div
              className="flex bg-[var(--bg-code)] border-b border-[var(--border)] sticky top-0 z-10"
              style={{ width: totalW }}
            >
              {columns.map((col) => (
                <div
                  key={col}
                  className="relative shrink-0 px-3 py-2 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wide select-none border-r border-[var(--border)] last:border-r-0"
                  style={{ width: colW(col) }}
                >
                  <span className="truncate block">{col}</span>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 h-full w-3 cursor-col-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
                    onMouseDown={(e) => startResize(col, e)}
                  >
                    <GripVertical className="h-3 w-3 text-[var(--text-muted)]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="overflow-auto h-[calc(100%-33px)]">
              <List
                height={195}
                itemCount={rows.length}
                itemSize={34}
                width={totalW || '100%'}
              >
                {({ index, style }) => (
                  <div
                    style={{ ...style, width: totalW, display: 'flex' }}
                    className={cn(
                      'cursor-pointer border-b border-[var(--border)] transition-colors',
                      index % 2 === 0 ? 'bg-[var(--bg-panel)]' : 'bg-[var(--bg-panel-hover)]',
                      'hover:bg-[var(--brand-subtle)]',
                      expandedRow === rows[index] && 'bg-[var(--brand-subtle)] ring-1 ring-inset ring-[var(--brand-border)]',
                    )}
                    onClick={() => setExpandedRow(expandedRow === rows[index] ? null : rows[index])}
                  >
                    {columns.map((col) => (
                      <div
                        key={col}
                        className="shrink-0 px-3 flex items-center text-xs text-[var(--text-secondary)] border-r border-[var(--border)] last:border-r-0 overflow-hidden"
                        style={{ width: colW(col) }}
                      >
                        <span className="truncate">{String(rows[index][col] ?? '')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </List>
            </div>
          </div>
        )}
      </div>

      {/* Row drawer */}
      <aside className="min-h-0 overflow-auto border-l border-[var(--border)] p-3 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] shrink-0">Row Inspector</h3>
        {expandedRow ? (
          <pre className="flex-1 text-[0.6875rem] font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto rounded-lg bg-[var(--bg-code)] border border-[var(--border)] p-2.5">
            {JSON.stringify(expandedRow, null, 2)}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 flex-1 text-center">
            <Table2 className="h-7 w-7 text-[var(--border-strong)]" />
            <p className="text-xs text-[var(--text-muted)]">Click a row to inspect full JSON payload</p>
          </div>
        )}
      </aside>
    </Panel>
  );
}

function exportRows(rows: Record<string, unknown>[], format: 'csv' | 'json') {
  const content = format === 'json' ? JSON.stringify(rows, null, 2) : toCsv(rows);
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mosaic-results.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return [cols.join(','), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
}
