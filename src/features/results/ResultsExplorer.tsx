import { Panel } from '../../components/ui/Panel';

export function ResultsExplorer() {
  return (
    <Panel title="Results Explorer" className="h-full" bodyClassName="p-4">
      <div className="grid h-full place-items-center rounded-lg border border-dashed border-white/10 text-sm text-slate-400">
        Query results grid, row drawer, JSON view, exports, and virtualization mount here.
      </div>
    </Panel>
  );
}
