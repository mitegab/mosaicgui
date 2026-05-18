import { Button } from '../../components/ui/Button';
import { useQueryStore } from '../../store/queryStore';
import { useSchemaStore } from '../../store/schemaStore';
import { toast } from '../../store/toastStore';
import { cn } from '../../utils/cn';

export function StructuredQueryForm() {
  const nodes         = useQueryStore((s) => s.nodes);
  const updateNodeData = useQueryStore((s) => s.updateNodeData);
  const compileGraph  = useQueryStore((s) => s.compileGraph);
  const models        = useSchemaStore((s) => s.models);
  const modelNode     = nodes.find((n) => n.data.kind === 'model');
  const filterNodes   = nodes.filter((n) => n.data.kind === 'filter' || n.data.kind === 'condition');
  const outputNode    = nodes.find((n) => n.data.kind === 'output');
  const activeModel   = models.find((m) => m.name === modelNode?.data.model) ?? models[0];

  const inputCls = cn(
    'w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-input)]',
    'px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors',
    'focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-subtle)]',
    'placeholder:text-[var(--text-muted)]',
  );
  const selectCls = cn(inputCls, 'appearance-none cursor-pointer');

  return (
    <div className="grid h-full grid-cols-2 gap-3 overflow-auto p-3">
      {/* Model & Output */}
      <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Model & Output</h3>
          <span className="text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)]">
            {models.length} models
          </span>
        </div>

        {modelNode && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Source Model</label>
            <select
              className={selectCls}
              value={modelNode.data.model ?? ''}
              onChange={(e) => updateNodeData(modelNode.id, { model: e.target.value, label: e.target.value })}
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '2rem' }}
            >
              <option value="">Select model…</option>
              {models.map((m) => <option key={m.name}>{m.name}</option>)}
            </select>
          </div>
        )}

        {outputNode && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Output Fields</label>
            <input
              className={inputCls}
              value={(outputNode.data.fields ?? []).join(', ')}
              onChange={(e) => updateNodeData(outputNode.id, { fields: e.target.value.split(',').map((f) => f.trim()).filter(Boolean) })}
              placeholder="id, name, email, …"
            />
            <p className="text-[0.6875rem] text-[var(--text-muted)]">Comma-separated field names</p>
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => { compileGraph(); toast('success', 'Graph compiled', 'Form changes applied to DSL'); }}
        >
          Compile Changes
        </Button>
      </section>

      {/* Filters */}
      <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Filters</h3>
          <span className="text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)]">
            {filterNodes.length} active
          </span>
        </div>

        {filterNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] py-6 text-center">
            <p className="text-xs text-[var(--text-muted)]">No filter nodes</p>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">Add filter nodes in graph mode to edit here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filterNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-3 gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-code)] p-2">
                <select
                  value={node.data.field ?? ''}
                  onChange={(e) => updateNodeData(node.id, { field: e.target.value })}
                  className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                  <option value="">field</option>
                  {activeModel?.fields.map((f) => <option key={f.name}>{f.name}</option>)}
                </select>
                <select
                  value={node.data.operator ?? 'exact'}
                  onChange={(e) => updateNodeData(node.id, { operator: e.target.value as typeof node.data.operator })}
                  className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                  {['exact','contains','icontains','gt','gte','lt','lte','in','isnull'].map((op) => (
                    <option key={op}>{op}</option>
                  ))}
                </select>
                <input
                  value={String(node.data.value ?? '')}
                  onChange={(e) => updateNodeData(node.id, { value: e.target.value })}
                  className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
                  placeholder="value"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
