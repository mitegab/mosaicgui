import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Lightbulb, Gauge } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { useQueryStore } from '../../store/queryStore';
import { useSchemaStore } from '../../store/schemaStore';
import { useExecutionStore } from '../../store/executionStore';
import { estimateQueryCost } from './estimateCost';
import { CostGauge } from './CostGauge';
import type { QueryDsl } from '../../types/query';

const DEFAULT_ROW_ESTIMATE = 5000;

const TIP_BY_WARNING: Record<string, string> = {
  'No indexed filter detected — consider adding an index':
    'Add a database index on the filtered field(s) to avoid a full table scan.',
  'Missing LIMIT clause': 'Add a LIMIT to cap the number of rows the database has to materialize.',
  'Cartesian join risk': 'Reduce the number of joined relations, or split this into smaller queries.',
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export function CostEstimatorPanel() {
  const dsl = useQueryStore((state) => state.dsl);
  const models = useSchemaStore((state) => state.models);
  const history = useExecutionStore((state) => state.history);

  // Cheap to serialize — the DSL objects are small — so this is a safe debounce key.
  const debouncedDslJson = useDebouncedValue(JSON.stringify(dsl), 300);
  const debouncedDsl = useMemo<QueryDsl>(() => JSON.parse(debouncedDslJson) as QueryDsl, [debouncedDslJson]);

  const rowEstimateFor = useMemo(() => {
    const byModel = new Map(models.map((model) => [model.name, model.rowEstimate ?? DEFAULT_ROW_ESTIMATE]));
    return (modelName: string) => byModel.get(modelName) ?? DEFAULT_ROW_ESTIMATE;
  }, [models]);

  const breakdown = useMemo(
    () => estimateQueryCost(debouncedDsl, rowEstimateFor(debouncedDsl.model)),
    [debouncedDsl, rowEstimateFor],
  );

  const averageHistoryCost = useMemo(() => {
    if (history.length === 0) return null;
    const total = history.reduce((sum, entry) => {
      const cost = estimateQueryCost(entry.dsl, rowEstimateFor(entry.dsl.model));
      return sum + cost.totalCost;
    }, 0);
    return total / history.length;
  }, [history, rowEstimateFor]);

  const comparisonNote = useMemo(() => {
    if (averageHistoryCost === null || averageHistoryCost <= 0) return null;
    const diffPct = ((averageHistoryCost - breakdown.totalCost) / averageHistoryCost) * 100;
    if (Math.abs(diffPct) < 1) return 'About as expensive as the average query in your history.';
    if (diffPct > 0) {
      return `${diffPct.toFixed(0)}% cheaper than the average query in your history.`;
    }
    return `${Math.abs(diffPct).toFixed(0)}% more expensive than the average query in your history.`;
  }, [averageHistoryCost, breakdown.totalCost]);

  const tips = useMemo(
    () => breakdown.warnings.map((warning) => TIP_BY_WARNING[warning] ?? warning),
    [breakdown.warnings],
  );

  return (
    <Panel title="Cost Estimator" subtitle="Heuristic execution cost, no live DB stats required" bodyClassName="p-4">
      <div className="flex flex-col gap-4">
        <CostGauge breakdown={breakdown} />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Estimated rows</div>
            <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
              {breakdown.estimatedRows.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Total cost units</div>
            <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
              {breakdown.totalCost.toFixed(1)}
            </div>
          </div>
        </div>

        {comparisonNote && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-subtle)] px-3 py-2 text-xs text-[var(--brand)]">
            <Gauge size={14} className="shrink-0" />
            <span>{comparisonNote}</span>
          </div>
        )}

        {breakdown.warnings.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {breakdown.warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 rounded-lg border border-warning-500/30 bg-warning-500/10 px-3 py-2 text-xs text-warning-400"
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {tips.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Lightbulb size={13} />
              What would make this cheaper?
            </div>
            <ul className="flex flex-col gap-1 text-xs text-[var(--text-secondary)] list-disc list-inside">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

export default CostEstimatorPanel;
