import React, { useMemo, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { useExecutionStore } from '../../store/executionStore';

type AggregationFn = 'count' | 'sum' | 'avg';

interface PivotZone {
  rows: string[];
  columns: string[];
  values: string[];
}

function aggregate(items: Record<string, unknown>[], field: string, fn: AggregationFn): number {
  if (!items.length) return 0;
  if (fn === 'count') return items.length;
  const nums = items.map((r) => parseFloat(String(r[field] ?? 0))).filter((n) => !isNaN(n));
  if (!nums.length) return 0;
  if (fn === 'sum') return nums.reduce((a, b) => a + b, 0);
  if (fn === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length;
  return 0;
}

function DropZone({
  label,
  fields,
  onDrop,
  onRemove,
}: {
  label: string;
  fields: string[];
  onDrop: (field: string) => void;
  onRemove: (field: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const field = e.dataTransfer.getData('field');
        if (field) onDrop(field);
      }}
      className={cn(
        'min-h-[48px] rounded-lg border-2 border-dashed p-1.5 flex flex-wrap gap-1 transition-colors',
        over ? 'border-[var(--brand)] bg-[var(--brand-subtle)]' : 'border-[var(--border)] bg-[var(--bg-panel)]',
      )}
    >
      {!fields.length && (
        <span className="text-[0.65rem] text-[var(--text-muted)] px-1 self-center">
          Drop {label} here
        </span>
      )}
      {fields.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand)] text-xs font-medium"
        >
          {f}
          <button onClick={() => onRemove(f)} className="hover:text-danger-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function PivotTable() {
  const rows = useExecutionStore((s) => s.rows);
  const columns = rows.length ? Object.keys(rows[0]) : [];

  const [zone, setZone] = useState<PivotZone>({ rows: [], columns: [], values: [] });
  const [aggFn, setAggFn] = useState<AggregationFn>('count');
  const [dragField, setDragField] = useState<string | null>(null);

  const addToZone = (zoneKey: keyof PivotZone, field: string) => {
    setZone((prev) => {
      // Remove from all zones first
      const cleaned: PivotZone = {
        rows: prev.rows.filter((f) => f !== field),
        columns: prev.columns.filter((f) => f !== field),
        values: prev.values.filter((f) => f !== field),
      };
      return { ...cleaned, [zoneKey]: [...cleaned[zoneKey], field] };
    });
  };

  const removeFromZone = (zoneKey: keyof PivotZone, field: string) => {
    setZone((prev) => ({ ...prev, [zoneKey]: prev[zoneKey].filter((f) => f !== field) }));
  };

  // ─── Pivot computation ──────────────────────────────────────────────────────

  const pivotResult = useMemo(() => {
    const rowFields = zone.rows;
    const colFields = zone.columns;
    const valField = zone.values[0];

    if (!rowFields.length || !rows.length) return null;

    // Collect unique row keys and column keys
    const rowKeySet = new Set<string>();
    const colKeySet = new Set<string>();
    const grouped: Record<string, Record<string, Record<string, unknown>[]>> = {};

    rows.forEach((row) => {
      const rKey = rowFields.map((f) => String(row[f] ?? '')).join(' | ');
      const cKey = colFields.length ? colFields.map((f) => String(row[f] ?? '')).join(' | ') : '__total__';
      rowKeySet.add(rKey);
      colKeySet.add(cKey);
      if (!grouped[rKey]) grouped[rKey] = {};
      if (!grouped[rKey][cKey]) grouped[rKey][cKey] = [];
      grouped[rKey][cKey].push(row);
    });

    const rowKeys = [...rowKeySet].sort();
    const colKeys = [...colKeySet].sort();

    return { rowKeys, colKeys, grouped, valField };
  }, [rows, zone, aggFn]);

  const availableFields = columns.filter(
    (c) => !zone.rows.includes(c) && !zone.columns.includes(c) && !zone.values.includes(c),
  );

  const fmt = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(2));

  return (
    <Panel
      title="Pivot Table"
      action={
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-muted)]">Agg:</span>
          {(['count', 'sum', 'avg'] as AggregationFn[]).map((fn) => (
            <button
              key={fn}
              onClick={() => setAggFn(fn)}
              className={cn(
                'h-5 px-2 rounded text-[0.65rem] font-semibold transition-colors',
                aggFn === fn
                  ? 'bg-[var(--brand)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              {fn}
            </button>
          ))}
        </div>
      }
    >
      <div className="p-3 flex flex-col gap-3">
        {/* Field list + drop zones */}
        <div className="grid grid-cols-4 gap-2">
          {/* Available fields */}
          <div className="col-span-1 flex flex-col gap-1">
            <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Fields</p>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {availableFields.map((f) => (
                <div
                  key={f}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('field', f); setDragField(f); }}
                  onDragEnd={() => setDragField(null)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded cursor-grab active:cursor-grabbing',
                    'border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)]',
                    'hover:bg-[var(--bg-panel-hover)] transition-colors',
                    dragField === f && 'opacity-50',
                  )}
                >
                  <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
                  {f}
                </div>
              ))}
              {!availableFields.length && (
                <p className="text-[0.65rem] text-[var(--text-muted)] italic">All fields assigned</p>
              )}
            </div>
          </div>

          {/* Drop zones */}
          <div className="col-span-3 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Rows</p>
              <DropZone
                label="row fields"
                fields={zone.rows}
                onDrop={(f) => addToZone('rows', f)}
                onRemove={(f) => removeFromZone('rows', f)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Columns</p>
              <DropZone
                label="column fields"
                fields={zone.columns}
                onDrop={(f) => addToZone('columns', f)}
                onRemove={(f) => removeFromZone('columns', f)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Values</p>
              <DropZone
                label="value field"
                fields={zone.values}
                onDrop={(f) => addToZone('values', f)}
                onRemove={(f) => removeFromZone('values', f)}
              />
            </div>
          </div>
        </div>

        {/* Pivot grid */}
        {pivotResult ? (
          <div className="overflow-auto max-h-72 rounded-lg border border-[var(--border)] text-xs">
            <table className="border-collapse w-full">
              <thead className="sticky top-0 z-10 bg-[var(--bg-sidebar)]">
                <tr>
                  {/* Corner */}
                  <th className="px-2 py-1.5 border-b border-r border-[var(--border)] text-[var(--text-muted)] font-semibold whitespace-nowrap">
                    {zone.rows.join(' / ')}
                  </th>
                  {pivotResult.colKeys.map((ck) => (
                    <th
                      key={ck}
                      className="px-2 py-1.5 border-b border-r border-[var(--border)] font-semibold text-[var(--text-primary)] whitespace-nowrap"
                    >
                      {ck === '__total__' ? 'Total' : ck}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotResult.rowKeys.map((rk) => (
                  <tr key={rk} className="hover:bg-[var(--bg-panel-hover)] border-b border-[var(--border)]/40">
                    <td className="px-2 py-1 border-r border-[var(--border)] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {rk}
                    </td>
                    {pivotResult.colKeys.map((ck) => {
                      const items = pivotResult.grouped[rk]?.[ck] ?? [];
                      const val = pivotResult.valField
                        ? aggregate(items, pivotResult.valField, aggFn)
                        : items.length;
                      return (
                        <td
                          key={ck}
                          className="px-2 py-1 border-r border-[var(--border)]/40 text-right tabular-nums text-[var(--text-primary)]"
                        >
                          {items.length ? fmt(val) : <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] text-center py-6 rounded-lg border border-dashed border-[var(--border)]">
            {rows.length
              ? 'Drag at least one field into the Rows zone to build the pivot'
              : 'No data — run a query first'}
          </div>
        )}
      </div>
    </Panel>
  );
}
