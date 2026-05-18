import { lazy, Suspense } from 'react';
import { BarChart2, GitGraph } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { useUiStore } from '../../store/uiStore';
import { StructuredQueryForm } from './StructuredQueryForm';
import { cn } from '../../utils/cn';

const QueryGraphCanvas = lazy(() =>
  import('../../flows/query/QueryGraphCanvas').then((m) => ({ default: m.QueryGraphCanvas })),
);

export function QueryWorkspace() {
  const { workspaceMode, setWorkspaceMode } = useUiStore();

  return (
    <Panel
      title="Visual Query Builder"
      subtitle={workspaceMode === 'graph' ? 'Drag & drop node graph' : 'Structured form editor'}
      action={
        <div className="flex rounded-lg border border-[var(--border-strong)] bg-[var(--bg-code)] p-0.5 gap-0.5">
          {([
            { mode: 'graph' as const, icon: GitGraph,  label: 'Graph' },
            { mode: 'form'  as const, icon: BarChart2, label: 'Form'  },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setWorkspaceMode(mode)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                workspaceMode === mode
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      }
      bodyClassName="h-full"
      className="h-full"
    >
      {workspaceMode === 'graph' ? (
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Loading graph engine…</p>
            </div>
          }
        >
          <QueryGraphCanvas />
        </Suspense>
      ) : (
        <StructuredQueryForm />
      )}
    </Panel>
  );
}
