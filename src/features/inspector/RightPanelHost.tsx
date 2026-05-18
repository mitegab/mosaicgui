import { Panel } from '../../components/ui/Panel';
import { useUiStore } from '../../store/uiStore';
import { useQueryStore } from '../../store/queryStore';

export function RightPanelHost() {
  const rightPanel = useUiStore((state) => state.rightPanel);
  const dsl = useQueryStore((state) => state.dsl);

  return (
    <Panel title={rightPanelLabel(rightPanel)} className="h-full" bodyClassName="p-4 overflow-auto">
      {rightPanel === 'dsl' && <pre className="text-xs text-slate-300">{JSON.stringify(dsl, null, 2)}</pre>}
      {rightPanel !== 'dsl' && (
        <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
          {rightPanelLabel(rightPanel)} module is scaffolded and wired into the shell.
        </div>
      )}
    </Panel>
  );
}

function rightPanelLabel(panel: string) {
  switch (panel) {
    case 'inspector':
      return 'Query Inspector';
    case 'ai':
      return 'AI Query Assistant';
    case 'performance':
      return 'Performance Monitor';
    default:
      return 'Monaco DSL Studio';
  }
}
