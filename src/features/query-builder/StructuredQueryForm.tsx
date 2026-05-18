import { Button } from '../../components/ui/Button';
import { useQueryStore } from '../../store/queryStore';
import { useSchemaStore } from '../../store/schemaStore';

export function StructuredQueryForm() {
  const nodes = useQueryStore((state) => state.nodes);
  const updateNodeData = useQueryStore((state) => state.updateNodeData);
  const compileGraph = useQueryStore((state) => state.compileGraph);
  const models = useSchemaStore((state) => state.models);
  const modelNode = nodes.find((node) => node.data.kind === 'model');
  const filterNodes = nodes.filter((node) => node.data.kind === 'filter' || node.data.kind === 'condition');
  const outputNode = nodes.find((node) => node.data.kind === 'output');
  const activeModel = models.find((model) => model.name === modelNode?.data.model) ?? models[0];

  return (
    <div className="grid h-full grid-cols-2 gap-4 overflow-auto p-4">
      <section className="space-y-3 rounded-xl border border-white/10 bg-surface-950 p-4">
        <h3 className="font-semibold text-white">Model & Output</h3>
        {modelNode && (
          <select className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm" value={modelNode.data.model ?? ''} onChange={(event) => updateNodeData(modelNode.id, { model: event.target.value, label: event.target.value })}>
            <option value="">Select model</option>
            {models.map((model) => <option key={model.name}>{model.name}</option>)}
          </select>
        )}
        {outputNode && (
          <input className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm" value={(outputNode.data.fields ?? []).join(', ')} onChange={(event) => updateNodeData(outputNode.id, { fields: event.target.value.split(',').map((field) => field.trim()).filter(Boolean) })} placeholder="Output fields" />
        )}
        <Button variant="primary" onClick={() => compileGraph()}>Compile form changes</Button>
      </section>
      <section className="space-y-3 rounded-xl border border-white/10 bg-surface-950 p-4">
        <h3 className="font-semibold text-white">Filters</h3>
        {filterNodes.length === 0 && <p className="text-sm text-slate-500">Add filter nodes in graph mode to edit them here.</p>}
        {filterNodes.map((node) => (
          <div key={node.id} className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-surface-900 p-2">
            <select value={node.data.field ?? ''} onChange={(event) => updateNodeData(node.id, { field: event.target.value })} className="rounded bg-surface-950 px-2 py-2 text-xs">
              <option value="">field</option>
              {activeModel?.fields.map((field) => <option key={field.name}>{field.name}</option>)}
            </select>
            <select value={node.data.operator ?? 'exact'} onChange={(event) => updateNodeData(node.id, { operator: event.target.value as typeof node.data.operator })} className="rounded bg-surface-950 px-2 py-2 text-xs">
              {['exact', 'contains', 'icontains', 'gt', 'gte', 'lt', 'lte', 'in', 'isnull'].map((operator) => <option key={operator}>{operator}</option>)}
            </select>
            <input value={String(node.data.value ?? '')} onChange={(event) => updateNodeData(node.id, { value: event.target.value })} className="rounded bg-surface-950 px-2 py-2 text-xs" placeholder="value" />
          </div>
        ))}
      </section>
    </div>
  );
}
