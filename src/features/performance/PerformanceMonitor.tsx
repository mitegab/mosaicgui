import { useMemo } from 'react';
import { useExecutionStore } from '../../store/executionStore';

export function PerformanceMonitor() {
  const history = useExecutionStore((state) => state.history);
  const summary = useMemo(() => {
    const executionTimes = history.map((entry) => entry.metrics?.executionTimeMs ?? 0).filter(Boolean);
    const slowQueries = history.filter((entry) => (entry.metrics?.executionTimeMs ?? 0) > 1_000);
    const average = executionTimes.length ? Math.round(executionTimes.reduce((sum, value) => sum + value, 0) / executionTimes.length) : 0;
    return { average, slowQueries };
  }, [history]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Average latency" value={`${summary.average}ms`} />
        <Metric label="Slow queries" value={String(summary.slowQueries.length)} />
        <Metric label="History size" value={String(history.length)} />
        <Metric label="Cache hit rate" value="backend-dependent" />
      </div>
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <h3 className="mb-2 text-sm font-semibold text-white">Latency Trend</h3>
        <div className="flex h-32 items-end gap-1">
          {history.slice(0, 24).reverse().map((entry) => (
            <div key={entry.id} className="flex-1 rounded-t bg-accent-500/70" title={entry.name} style={{ height: `${Math.max(8, Math.min(100, (entry.metrics?.executionTimeMs ?? 0) / 10))}%` }} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-950 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
