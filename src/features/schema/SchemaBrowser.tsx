import { Search, Star } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';

export function SchemaBrowser() {
  return (
    <Panel title="Schema Browser" bodyClassName="p-4 space-y-4">
      <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-950 px-3 py-2 text-sm text-slate-400">
        <Search className="h-4 w-4" />
        <input className="w-full bg-transparent text-slate-100 outline-none" placeholder="Search models and fields" />
      </label>
      <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
        Connect `/api/models/` to populate searchable model trees, favorites, field metadata, and relationship previews.
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Star className="h-4 w-4" /> Favorites and pinned schema models are persisted in `schemaStore`.
      </div>
    </Panel>
  );
}
