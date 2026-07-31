import { useMemo, useState } from 'react';
import { AlertTriangle, Network } from 'lucide-react';
import { useSchemaStore } from '../../store/schemaStore';
import { useExecutionStore } from '../../store/executionStore';
import { buildQueryLineage, buildSchemaLineage } from './buildLineageGraph';

function bfsTransitiveModels(startModel: string, edges: { source: string; target: string }[]): Set<string> {
  const adjacency = new Map<string, Set<string>>();
  const addEdge = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  };
  for (const edge of edges) {
    addEdge(edge.source, edge.target);
    addEdge(edge.target, edge.source);
  }

  const startId = `model:${startModel}`;
  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  visited.delete(startId);
  return new Set([...visited].filter((id) => id.startsWith('model:')).map((id) => id.slice('model:'.length)));
}

export function LineageImpactPanel() {
  const models = useSchemaStore((state) => state.models);
  const history = useExecutionStore((state) => state.history);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const activeModel = selectedModel || models[0]?.name || '';

  const schemaGraph = useMemo(() => buildSchemaLineage(models), [models]);
  const queryGraph = useMemo(() => buildQueryLineage(history, models), [history, models]);

  const transitiveModels = useMemo(
    () => (activeModel ? bfsTransitiveModels(activeModel, schemaGraph.edges) : new Set<string>()),
    [activeModel, schemaGraph.edges],
  );

  const touchingQueries = useMemo(() => {
    if (!activeModel) return [];
    const modelNodeId = `model:${activeModel}`;
    const queryIds = new Set(
      queryGraph.edges.filter((edge) => edge.target === modelNodeId).map((edge) => edge.source),
    );
    return queryGraph.nodes.filter((node) => node.type === 'query' && queryIds.has(node.id));
  }, [activeModel, queryGraph]);

  if (models.length === 0) {
    return <div className="text-xs text-[var(--text-muted)] p-3">Load a schema to run impact analysis.</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex items-center gap-2">
        <Network size={14} className="text-[var(--brand)]" />
        <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="lineage-impact-model">
          Analyze impact of changing:
        </label>
      </div>
      <select
        id="lineage-impact-model"
        className="select"
        value={activeModel}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Queries affected</div>
          <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{touchingQueries.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Connected models</div>
          <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">{transitiveModels.size}</div>
        </div>
      </div>

      {touchingQueries.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-500/30 bg-warning-500/10 px-3 py-2 text-xs text-warning-400">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Changing <strong>{activeModel}</strong> may affect {touchingQueries.length} quer
            {touchingQueries.length === 1 ? 'y' : 'ies'} in your recent history.
          </span>
        </div>
      )}

      {transitiveModels.size > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Transitively connected models</div>
          <div className="flex flex-wrap gap-1.5">
            {[...transitiveModels].map((name) => (
              <span
                key={name}
                className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[11px] text-teal-400"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {touchingQueries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Affected queries</div>
          <ul className="flex flex-col gap-1 text-xs text-[var(--text-secondary)] list-disc list-inside">
            {touchingQueries.map((query) => (
              <li key={query.id}>{query.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LineageImpactPanel;
