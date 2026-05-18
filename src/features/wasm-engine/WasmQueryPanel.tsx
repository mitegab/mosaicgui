import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, FlaskConical, Play, Plus, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import type { ConditionOperator } from '../../types/query';
import { loadDuckDb, queryLocalData } from './duckdbLoader';
import { clientFilter, clientSort } from './clientSideFilter';

type DuckDbStatus = 'idle' | 'loading' | 'ready' | 'fallback';
type TabId = 'sql' | 'filter';

interface FilterRow {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

const OPERATORS: ConditionOperator[] = ['exact', 'contains', 'icontains', 'gt', 'gte', 'lt', 'lte', 'in', 'isnull'];

function generateSampleData(count = 1000): Record<string, unknown>[] {
  const adjectives = ['Fast', 'Slow', 'Bright', 'Dark', 'Wild', 'Calm', 'Loud', 'Silent'];
  const nouns = ['River', 'Mountain', 'City', 'Forest', 'Ocean', 'Desert', 'Valley', 'Sky'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i + 1}`,
    published_at: new Date(Date.now() - Math.random() * 3.15e10).toISOString().split('T')[0],
    score: parseFloat((Math.random() * 100).toFixed(2)),
  }));
}

function MiniTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <div className="text-xs text-[var(--text-muted)] px-3 py-4 text-center">No results</div>;
  const cols = Object.keys(rows[0]);
  const visible = rows.slice(0, 50);
  return (
    <div className="overflow-auto max-h-60 text-xs">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[var(--bg-sidebar)] z-10">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-2 py-1.5 text-left font-semibold text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--bg-panel-hover)] border-b border-[var(--border)]/50">
              {cols.map((c) => (
                <td key={c} className="px-2 py-1 text-[var(--text-primary)] max-w-[160px] truncate" title={String(row[c] ?? '')}>
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div className="text-[0.65rem] text-[var(--text-muted)] px-3 py-1.5 border-t border-[var(--border)]">
          Showing 50 of {rows.length} rows
        </div>
      )}
    </div>
  );
}

export function WasmQueryPanel() {
  const [tab, setTab] = useState<TabId>('sql');
  const [dbStatus, setDbStatus] = useState<DuckDbStatus>('idle');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [sql, setSql] = useState('SELECT * FROM local_data WHERE score > 50 ORDER BY score DESC LIMIT 20');
  const [timing, setTiming] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-warm DuckDB on mount
  useEffect(() => {
    setDbStatus('loading');
    loadDuckDb()
      .then(() => setDbStatus('ready'))
      .catch(() => setDbStatus('fallback'));
  }, []);

  const handleLoadSample = () => {
    const rows = generateSampleData(1000);
    setData(rows);
    setResults([]);
    setError(null);
    setTiming(null);
  };

  const handleExecuteSql = useCallback(async () => {
    if (!data.length) {
      setError('No data loaded. Click "Load Sample Data" first.');
      return;
    }
    setError(null);
    const t0 = performance.now();
    try {
      const r = await queryLocalData(sql, data);
      setResults(r);
      setTiming(performance.now() - t0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResults([]);
    }
  }, [sql, data]);

  const handleRunFilters = useCallback(() => {
    if (!data.length) {
      setError('No data loaded. Click "Load Sample Data" first.');
      return;
    }
    setError(null);
    const t0 = performance.now();
    const qFilters = filters
      .filter((f) => f.field)
      .map((f) => ({ field: f.field, operator: f.operator, value: f.value }));
    let r = clientFilter(data, qFilters);
    r = clientSort(r, []);
    setResults(r);
    setTiming(performance.now() - t0);
  }, [filters, data]);

  const addFilter = () =>
    setFilters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: data.length ? Object.keys(data[0])[0] : '', operator: 'contains', value: '' },
    ]);

  const updateFilter = (id: string, patch: Partial<FilterRow>) =>
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id));

  const columns = data.length ? Object.keys(data[0]) : [];

  const statusBadge = {
    idle: null,
    loading: (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
        <Loader2 className="w-3 h-3 animate-spin" /> DuckDB Loading
      </span>
    ),
    ready: (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
        <CheckCircle2 className="w-3 h-3" /> DuckDB Ready
      </span>
    ),
    fallback: (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
        <AlertTriangle className="w-3 h-3" /> Fallback Mode
      </span>
    ),
  }[dbStatus];

  return (
    <Panel
      title="Client-Side Query Engine"
      action={
        <div className="flex items-center gap-2">
          {statusBadge}
          <Button size="xs" variant="secondary" onClick={handleLoadSample}>
            <FlaskConical className="w-3 h-3" /> Load Sample Data
          </Button>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)]">
        {(['sql', 'filter'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              tab === t
                ? 'border-[var(--brand)] text-[var(--brand)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {t === 'sql' ? (
              <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> DuckDB SQL</span>
            ) : (
              <span className="flex items-center gap-1.5"><FlaskConical className="w-3 h-3" /> Filter Builder</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Data info */}
        {data.length > 0 && (
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <Database className="w-3 h-3" />
            {data.length.toLocaleString()} rows loaded ·{' '}
            {columns.join(', ')}
          </div>
        )}

        {/* ─── SQL Tab ─────────────────────────────────────────────── */}
        {tab === 'sql' && (
          <>
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={4}
              spellCheck={false}
              className={cn(
                'w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-panel)]',
                'text-xs text-[var(--text-primary)] font-mono px-3 py-2 outline-none',
                'focus:ring-2 focus:ring-[var(--brand)]/40',
              )}
              placeholder="SELECT * FROM local_data LIMIT 10"
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleExecuteSql}>
                <Play className="w-3.5 h-3.5" /> Execute Locally
              </Button>
              {timing !== null && (
                <span className="text-xs text-[var(--text-muted)]">
                  {results.length} rows in {timing.toFixed(1)} ms
                </span>
              )}
            </div>
          </>
        )}

        {/* ─── Filter Builder Tab ───────────────────────────────────── */}
        {tab === 'filter' && (
          <>
            <div className="flex flex-col gap-2">
              {filters.map((f) => (
                <div key={f.id} className="flex items-center gap-2 flex-wrap">
                  {/* Field select */}
                  <select
                    value={f.field}
                    onChange={(e) => updateFilter(f.id, { field: e.target.value })}
                    className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
                  >
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                    {!columns.length && <option value="">--</option>}
                  </select>

                  {/* Operator select */}
                  <select
                    value={f.operator}
                    onChange={(e) => updateFilter(f.id, { operator: e.target.value as ConditionOperator })}
                    className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
                  >
                    {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>

                  {/* Value input */}
                  <input
                    value={f.value}
                    onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                    placeholder="value"
                    className="h-7 px-2 flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
                  />

                  <Button size="xs" variant="ghost" icon onClick={() => removeFilter(f.id)}>
                    <Trash2 className="w-3 h-3 text-danger-400" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button size="xs" variant="ghost" onClick={addFilter}>
                <Plus className="w-3 h-3" /> Add Filter
              </Button>
              <Button variant="primary" size="sm" onClick={handleRunFilters}>
                <Play className="w-3.5 h-3.5" /> Apply Filters
              </Button>
              {timing !== null && (
                <span className="text-xs text-[var(--text-muted)]">
                  {results.length} rows in {timing.toFixed(1)} ms
                </span>
              )}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-danger-500/10 border border-danger-500/30 text-xs text-danger-400">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="font-mono break-all">{error}</span>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <MiniTable rows={results} />
          </div>
        )}
      </div>
    </Panel>
  );
}
