import type { QueryGraphNode, QueryNodeKind } from '../../types/query';
import { Button } from '../../components/ui/Button';
import { useSchemaStore } from '../../store/schemaStore';

interface NodeInspectorProps {
  node?: QueryGraphNode;
  onChange: (nodeId: string, data: Partial<QueryGraphNode['data']>) => void;
}

const kinds: QueryNodeKind[] = ['model', 'filter', 'condition', 'logic', 'output', 'group', 'subquery'];

export function NodeInspector({ node, onChange }: NodeInspectorProps) {
  const models = useSchemaStore((state) => state.models);
  const activeModel = models.find((model) => model.name === node?.data.model) ?? models[0];

  if (!node) {
    return <div className="rounded-lg border border-dashed border-white/10 p-3 text-sm text-slate-500">Select a graph node to edit model, filters, conditions, logic, output fields, or grouping.</div>;
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-surface-950 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Node Inspector</h3>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => onChange(node.id, { collapsed: !node.data.collapsed })}>
          {node.data.collapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>
      <input className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.label} onChange={(event) => onChange(node.id, { label: event.target.value })} />
      <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.kind} onChange={(event) => onChange(node.id, { kind: event.target.value as QueryNodeKind })}>
        {kinds.map((kind) => <option key={kind}>{kind}</option>)}
      </select>
      {node.data.kind === 'model' && (
        <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.model ?? ''} onChange={(event) => onChange(node.id, { model: event.target.value, label: event.target.value || 'Model' })}>
          <option value="">Select model</option>
          {models.map((model) => <option key={model.name}>{model.name}</option>)}
        </select>
      )}
      {(node.data.kind === 'filter' || node.data.kind === 'condition') && (
        <>
          <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.field ?? ''} onChange={(event) => onChange(node.id, { field: event.target.value })}>
            <option value="">Select field</option>
            {activeModel?.fields.map((field) => <option key={field.name}>{field.name}</option>)}
          </select>
          <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.operator ?? 'exact'} onChange={(event) => onChange(node.id, { operator: event.target.value as QueryGraphNode['data']['operator'] })}>
            {['exact', 'contains', 'icontains', 'gt', 'gte', 'lt', 'lte', 'in', 'isnull'].map((operator) => <option key={operator}>{operator}</option>)}
          </select>
          <input className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={String(node.data.value ?? '')} onChange={(event) => onChange(node.id, { value: event.target.value })} placeholder="Filter value" />
        </>
      )}
      {node.data.kind === 'logic' && (
        <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={node.data.logic ?? 'AND'} onChange={(event) => onChange(node.id, { logic: event.target.value as QueryGraphNode['data']['logic'] })}>
          <option>AND</option>
          <option>OR</option>
        </select>
      )}
      {node.data.kind === 'output' && (
        <input className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" value={(node.data.fields ?? []).join(', ')} onChange={(event) => onChange(node.id, { fields: event.target.value.split(',').map((field) => field.trim()).filter(Boolean) })} placeholder="id, title, author.name" />
      )}
      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={Boolean(node.data.reusable)} onChange={(event) => onChange(node.id, { reusable: event.target.checked })} />
        Reusable node template
      </label>
    </div>
  );
}
