import { useMemo } from 'react';
import { Activity, Clock, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function PerformanceMonitor() {
  const history = useExecutionStore((s) => s.history);

  const summary = useMemo(() => {
    const times = history.map((e) => e.metrics?.executionTimeMs ?? 0).filter(Boolean);
    const slow   = history.filter((e) => (e.metrics?.executionTimeMs ?? 0) > 1000);
    const avg    = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const min    = times.length ? Math.min(...times) : 0;
    const max    = times.length ? Math.max(...times) : 0;
    const p95    = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] ?? 0 : 0;
    return { avg, min, max, p95, slow, total: history.length };
  }, [history]);

  const metrics = [
    { label: 'Avg latency',  value: formatMs(summary.avg),   icon: Activity,     variant: summary.avg > 1000 ? 'warning' : 'brand' as const },
    { label: 'p95 latency',  value: formatMs(summary.p95),   icon: TrendingUp,   variant: summary.p95 > 2000 ? 'danger'  : 'teal'  as const },
    { label: 'Fastest',      value: formatMs(summary.min),   icon: Zap,          variant: 'success' as const },
    { label: 'Slowest',      value: formatMs(summary.max),   icon: TrendingDown, variant: summary.max > 2000 ? 'danger'  : 'warning' as const },
    { label: 'Slow queries', value: String(summary.slow.length), icon: Clock,    variant: summary.slow.length > 0 ? 'warning' : 'brand' as const },
    { label: 'Total runs',   value: String(summary.total),   icon: Activity,     variant: 'default' as const },
  ];

  const chartHistory = history.slice(0, 30).reverse();
  const chartMax     = Math.max(...chartHistory.map((e) => e.metrics?.executionTimeMs ?? 0), 1);

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ label, value, icon: Icon, variant }) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)] truncate">{label}</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] tabular-nums">{value}</div>
            <Badge variant={variant as any} className="mt-1.5 text-[0.6rem]">{variant}</Badge>
          </div>
        ))}
      </div>

      {/* Latency sparkline */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[var(--text-primary)]">Latency Trend</p>
          <Badge variant="default">{chartHistory.length} runs</Badge>
        </div>
        {chartHistory.length === 0 ? (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">No data yet — run a query</p>
          </div>
        ) : (
          <div className="flex items-end gap-1 h-20 rounded-lg overflow-hidden p-2 bg-[var(--bg-code)] border border-[var(--border)]">
            {chartHistory.map((entry, i) => {
              const ms  = entry.metrics?.executionTimeMs ?? 0;
              const pct = Math.max(4, (ms / chartMax) * 100);
              const isSlow = ms > 1000;
              return (
                <div
                  key={entry.id}
                  className="flex-1 rounded-t transition-all duration-300"
                  title={`${entry.name}: ${ms}ms`}
                  style={{ height: `${pct}%` }}
                >
                  <div
                    className={cn(
                      'w-full h-full rounded-t',
                      isSlow
                        ? 'bg-warning-400/70 hover:bg-warning-400'
                        : 'bg-django-400/70 hover:bg-django-400',
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slow query list */}
      {summary.slow.length > 0 && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-500/8 p-3">
          <p className="text-xs font-semibold text-warning-400 mb-2">⚠ Slow Queries (&gt;1s)</p>
          <div className="space-y-1">
            {summary.slow.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] truncate max-w-[70%]">{e.name}</span>
                <Badge variant="warning">{formatMs(e.metrics?.executionTimeMs ?? 0)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
