import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';
import { useQueryStore } from '../../store/queryStore';
import { dslToGraph } from '../../engine/dslToGraph';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../store/toastStore';
import { cn } from '../../utils/cn';

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)   return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function QueryHistoryPanel() {
  const history      = useExecutionStore((s) => s.history);
  const clearHistory = useExecutionStore((s) => s.clearHistory);
  const setDsl       = useQueryStore((s) => s.setDsl);
  const setNodes     = useQueryStore((s) => s.setNodes);
  const setEdges     = useQueryStore((s) => s.setEdges);

  function handleRerun(id: string) {
    const entry = history.find((e) => e.id === id);
    if (!entry?.dsl) return;
    const graph = dslToGraph(entry.dsl);
    setDsl(entry.dsl);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    toast('info', 'Query loaded', `"${entry.name}" restored to graph`);
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-32 text-center px-3">
        <Clock className="h-8 w-8 text-white/10" />
        <p className="text-xs text-white/30">No query history yet.<br />Run a query to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[0.6875rem] text-white/30">{history.length} entries</span>
        <Button
          variant="ghost"
          size="xs"
          className="text-white/30 hover:text-danger-400 hover:bg-danger-500/10"
          onClick={() => { clearHistory(); toast('info', 'History cleared'); }}
        >
          <Trash2 className="h-3 w-3" /> Clear
        </Button>
      </div>

      {history.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            'group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors',
            'hover:bg-white/5 border border-transparent hover:border-white/8',
          )}
        >
          <Clock className="h-3.5 w-3.5 text-white/20 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{entry.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[0.6rem] text-white/30">{timeAgo(entry.createdAt)}</span>
              {entry.metrics && (
                <Badge variant={entry.metrics.executionTimeMs > 1000 ? 'warning' : 'teal'} className="text-[0.6rem]">
                  {formatMs(entry.metrics.executionTimeMs)}
                </Badge>
              )}
              {entry.metrics && (
                <span className="text-[0.6rem] text-white/25">
                  {entry.metrics.rowsReturned} rows
                </span>
              )}
              {entry.bookmarked && <Badge variant="brand" className="text-[0.6rem]">★ saved</Badge>}
            </div>
          </div>
          <button
            title="Re-run this query"
            onClick={() => handleRerun(entry.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-white/40 hover:text-django-400 hover:bg-django-400/10 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
