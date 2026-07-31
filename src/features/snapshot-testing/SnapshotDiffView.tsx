import { useMemo, useState } from 'react';
import { Check, X, PlayCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useExecutionStore } from '../../store/executionStore';
import { useSnapshotStore } from './useSnapshotStore';
import { cn } from '../../utils/cn';

interface SnapshotDiffViewProps {
  snapshotId: string;
}

function extractColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  for (const row of rows.slice(0, 20)) {
    Object.keys(row).forEach((key) => columns.add(key));
  }
  return [...columns].sort();
}

export function SnapshotDiffView({ snapshotId }: SnapshotDiffViewProps) {
  const snapshot = useSnapshotStore((state) => state.snapshots.find((s) => s.id === snapshotId));
  const result = useSnapshotStore((state) => state.results[snapshotId]);
  const runRegression = useSnapshotStore((state) => state.runRegression);
  const currentRows = useExecutionStore((state) => state.rows);
  const [isRunning, setIsRunning] = useState(false);

  const currentColumns = useMemo(() => extractColumns(currentRows), [currentRows]);

  if (!snapshot) {
    return <div className="text-xs text-[var(--text-muted)] p-3">Snapshot not found.</div>;
  }

  const columnsAdded = currentColumns.filter((c) => !snapshot.columnsAtCapture.includes(c));
  const columnsRemoved = snapshot.columnsAtCapture.filter((c) => !currentColumns.includes(c));

  const handleRun = () => {
    setIsRunning(true);
    runRegression(snapshot.id, currentRows);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Snapshot (captured)</div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{snapshot.rowCountAtCapture} rows</div>
          <div className="flex flex-wrap gap-1">
            {snapshot.columnsAtCapture.map((col) => (
              <span
                key={col}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-mono',
                  columnsRemoved.includes(col)
                    ? 'bg-danger-500/15 text-danger-400 line-through'
                    : 'bg-[var(--border)] text-[var(--text-secondary)]',
                )}
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Current</div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{currentRows.length} rows</div>
          <div className="flex flex-wrap gap-1">
            {currentColumns.map((col) => (
              <span
                key={col}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-mono',
                  columnsAdded.includes(col)
                    ? 'bg-success-500/15 text-success-400'
                    : 'bg-[var(--border)] text-[var(--text-secondary)]',
                )}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        {result && !result.hashChanged ? (
          <Check size={14} className="text-success-400" />
        ) : (
          <X size={14} className="text-danger-400" />
        )}
        <span>
          Sample row hash {result ? (result.hashChanged ? 'changed' : 'matches') : 'not yet compared'}
          {result && <span className="font-mono ml-1 opacity-60">({snapshot.sampleRowsHash})</span>}
        </span>
      </div>

      <Button variant="primary" size="sm" onClick={handleRun} loading={isRunning}>
        <PlayCircle size={14} />
        Run Regression Test
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-xs flex items-start gap-2',
            result.passed
              ? 'border-success-500/30 bg-success-500/10 text-success-400'
              : 'border-danger-500/30 bg-danger-500/10 text-danger-400',
          )}
        >
          <span className={cn('badge shrink-0', result.passed ? 'bg-success-500/20' : 'bg-danger-500/20')}>
            {result.passed ? 'PASS' : 'FAIL'}
          </span>
          <span>{result.diffSummary}</span>
        </div>
      )}
    </div>
  );
}

export default SnapshotDiffView;
