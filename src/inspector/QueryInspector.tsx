import { GitBranch, ScrollText, TerminalSquare } from 'lucide-react';
import { useExecutionStore } from '../store/executionStore';
import { useQueryStore } from '../store/queryStore';
import type { ExecutionPlanStep } from '../types/execution';

export function QueryInspector() {
  const dsl = useQueryStore((state) => state.dsl);
  const nodes = useQueryStore((state) => state.nodes);
  const edges = useQueryStore((state) => state.edges);
  const orm = useExecutionStore((state) => state.orm);
  const logs = useExecutionStore((state) => state.logs);
  const executionPlan = useExecutionStore((state) => state.executionPlan);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><ScrollText className="h-4 w-4" /> Generated DSL</div>
        <pre className="max-h-56 overflow-auto text-xs text-slate-300">{JSON.stringify(dsl, null, 2)}</pre>
      </section>
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><TerminalSquare className="h-4 w-4" /> ORM Equivalent</div>
        <pre className="text-xs text-slate-300">{orm ?? 'Backend did not return ORM equivalent yet.'}</pre>
      </section>
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><GitBranch className="h-4 w-4" /> Query Breakdown Tree</div>
        <div className="space-y-1 text-xs text-slate-300">
          <div>{nodes.length} nodes · {edges.length} edges</div>
          {nodes.map((node) => <div key={node.id} className="rounded bg-white/5 px-2 py-1">{node.data.kind}: {node.data.label}</div>)}
        </div>
      </section>
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 text-sm font-semibold text-white">Execution Plan</div>
        {executionPlan.length > 0 ? executionPlan.map((step) => <PlanStep key={step.id} step={step} />) : <p className="text-sm text-slate-500">Execution plan will appear when backend provides it.</p>}
      </section>
      <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 text-sm font-semibold text-white">Backend Logs</div>
        {logs.length > 0 ? logs.map((line, index) => <div key={`${line}-${index}`} className="font-mono text-xs text-slate-300">{line}</div>) : <p className="text-sm text-slate-500">No logs returned.</p>}
      </section>
    </div>
  );
}

function PlanStep({ step }: { step: ExecutionPlanStep }) {
  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-surface-900 p-2 text-xs text-slate-300">
      <div className="flex justify-between font-semibold text-slate-100"><span>{step.label}</span><span>{step.durationMs ? `${step.durationMs}ms` : ''}</span></div>
      {step.detail && <p className="mt-1 text-slate-500">{step.detail}</p>}
      {step.children && <div className="mt-2 border-l border-white/10 pl-2">{step.children.map((child) => <PlanStep key={child.id} step={child} />)}</div>}
    </div>
  );
}
