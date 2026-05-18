import { memo } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { AlertTriangle, Braces, Database, Filter, GitBranch, Layers, Repeat, SquareStack } from 'lucide-react';
import type { QueryNodeData, QueryNodeKind } from '../../types/query';
import { cn } from '../../utils/cn';

const iconByKind: Record<QueryNodeKind, typeof Database> = {
  model: Database,
  filter: Filter,
  condition: GitBranch,
  logic: Braces,
  output: SquareStack,
  group: Layers,
  subquery: Repeat,
};

const colorByKind: Record<QueryNodeKind, string> = {
  model: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  filter: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
  condition: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  logic: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  output: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  group: 'border-slate-400/40 bg-slate-500/10 text-slate-200',
  subquery: 'border-pink-400/40 bg-pink-500/10 text-pink-200',
};

function QueryNodeComponent({ data, selected }: NodeProps<QueryNodeData>) {
  const Icon = iconByKind[data.kind];
  const hasError = data.errors?.some((issue) => issue.severity === 'error');
  const hasWarning = data.errors?.some((issue) => issue.severity === 'warning');

  return (
    <div
      className={cn(
        'min-w-52 rounded-xl border bg-surface-900 shadow-2xl transition',
        colorByKind[data.kind],
        selected && 'ring-2 ring-accent-300',
        hasError && 'border-rose-400 ring-2 ring-rose-500/30',
      )}
    >
      <Handle type="target" position={Position.Left} className="!border-surface-950 !bg-accent-300" />
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Icon className="h-4 w-4" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{data.label}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-70">{data.kind}</div>
        </div>
        {(hasError || hasWarning) && <AlertTriangle className={cn('h-4 w-4', hasError ? 'text-rose-300' : 'text-amber-300')} />}
      </div>
      {!data.collapsed && (
        <div className="space-y-1 px-3 py-2 text-xs text-slate-300">
          {data.model && <div>Model: {data.model}</div>}
          {data.field && <div>Field: {data.field}</div>}
          {data.operator && <div>Operator: {data.operator}</div>}
          {data.value !== undefined && data.value !== '' && <div>Value: {String(data.value)}</div>}
          {data.logic && <div>Logic: {data.logic}</div>}
          {data.fields && data.fields.length > 0 && <div>Fields: {data.fields.join(', ')}</div>}
          {data.errors?.map((issue) => (
            <div key={`${issue.nodeId}-${issue.message}`} className={cn(issue.severity === 'error' ? 'text-rose-300' : 'text-amber-300')}>
              {issue.message}
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!border-surface-950 !bg-accent-300" />
    </div>
  );
}

export const QueryNode = memo(QueryNodeComponent);
