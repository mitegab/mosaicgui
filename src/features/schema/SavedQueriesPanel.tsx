import { useState } from 'react';
import { Bookmark, BookmarkCheck, Play, Tag, Trash2 } from 'lucide-react';
import { useSavedQueriesStore } from '../../store/savedQueriesStore';
import { useQueryStore } from '../../store/queryStore';
import { dslToGraph } from '../../engine/dslToGraph';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../store/toastStore';
import { cn } from '../../utils/cn';

export function SavedQueriesPanel() {
  const { saved, saveQuery, deleteQuery } = useSavedQueriesStore();
  const dsl     = useQueryStore((s) => s.dsl);
  const setDsl  = useQueryStore((s) => s.setDsl);
  const setNodes = useQueryStore((s) => s.setNodes);
  const setEdges = useQueryStore((s) => s.setEdges);
  const [name, setName] = useState('');

  function handleSave() {
    const n = name.trim() || `Query ${new Date().toLocaleTimeString()}`;
    saveQuery(n, dsl);
    setName('');
    toast('success', 'Query saved', `"${n}" bookmarked successfully`);
  }

  function handleLoad(id: string) {
    const q = saved.find((s) => s.id === id);
    if (!q) return;
    const graph = dslToGraph(q.dsl);
    setDsl(q.dsl);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    toast('info', 'Query loaded', `"${q.name}" restored to graph`);
  }

  function handleDelete(id: string) {
    const q = saved.find((s) => s.id === id);
    deleteQuery(id);
    toast('warning', 'Deleted', q ? `"${q.name}" removed` : 'Query removed');
  }

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Save current */}
      <div className="rounded-lg bg-white/5 border border-white/8 p-2.5 space-y-2">
        <p className="text-[0.6875rem] font-semibold text-white/50 uppercase tracking-wide">
          Save Current Query
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Query name…"
          className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-django-400/50 focus:bg-white/10 transition-colors"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full border-django-400/30 text-django-400 hover:bg-django-400/10"
          onClick={handleSave}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Bookmark Query
        </Button>
      </div>

      {/* Saved list */}
      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BookmarkCheck className="h-8 w-8 text-white/10" />
          <p className="text-xs text-white/30">No saved queries yet.<br />Bookmark your current query above.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-[0.6875rem] font-semibold text-white/50 uppercase tracking-wide px-1">
            {saved.length} saved
          </p>
          {saved.map((q) => (
            <div
              key={q.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-2.5 py-2.5 transition-colors',
                'hover:bg-white/5 border border-transparent hover:border-white/8',
              )}
            >
              <Bookmark className="h-3.5 w-3.5 text-django-400/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{q.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {q.dsl.model && (
                    <Badge variant="brand" className="text-[0.6rem]">
                      <Tag className="h-2.5 w-2.5" />
                      {q.dsl.model}
                    </Badge>
                  )}
                  <span className="text-[0.6rem] text-white/25">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="Load query"
                  onClick={() => handleLoad(q.id)}
                  className="p-1.5 rounded-md text-white/40 hover:text-django-400 hover:bg-django-400/10 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Delete"
                  onClick={() => handleDelete(q.id)}
                  className="p-1.5 rounded-md text-white/40 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
