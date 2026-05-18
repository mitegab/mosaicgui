import { Panel } from '../../components/ui/Panel';
import { useUiStore } from '../../store/uiStore';

export function QueryWorkspace() {
  const { workspaceMode, setWorkspaceMode } = useUiStore();

  return (
    <Panel
      title="Visual Query Graph Builder"
      action={
        <div className="flex rounded-lg border border-white/10 bg-surface-950 p-1">
          {(['graph', 'form'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setWorkspaceMode(mode)}
              className={`rounded-md px-3 py-1 text-xs capitalize ${workspaceMode === mode ? 'bg-accent-500 text-white' : 'text-slate-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      }
      bodyClassName="h-full p-4"
      className="h-full"
    >
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-950/70 text-slate-400">
        {workspaceMode === 'graph' ? 'React Flow query graph canvas' : 'Structured form query builder'}
      </div>
    </Panel>
  );
}
