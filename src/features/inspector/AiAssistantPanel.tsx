import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { generateAiQuery } from '../../ai/aiQueryAssistant';
import { dslToGraph } from '../../engine/dslToGraph';
import { useQueryStore } from '../../store/queryStore';
import type { AiQueryRequest, AiQueryResponse } from '../../types/ai';

const modes: AiQueryRequest['mode'][] = ['generate', 'fix', 'optimize', 'sql-to-dsl', 'suggest-indexes'];

export function AiAssistantPanel() {
  const [prompt, setPrompt] = useState('find books published after 2020 with django in title');
  const [mode, setMode] = useState<AiQueryRequest['mode']>('generate');
  const [response, setResponse] = useState<AiQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const dsl = useQueryStore((state) => state.dsl);
  const setDsl = useQueryStore((state) => state.setDsl);
  const setNodes = useQueryStore((state) => state.setNodes);
  const setEdges = useQueryStore((state) => state.setEdges);

  const runAi = async () => {
    setLoading(true);
    const next = await generateAiQuery({ prompt, mode, currentDsl: dsl });
    setResponse(next);
    setLoading(false);
  };

  const apply = () => {
    if (!response?.dsl) return;
    const graph = dslToGraph(response.dsl);
    setDsl(response.dsl);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-surface-950 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><Bot className="h-4 w-4" /> AI Query Assistant</div>
        <select value={mode} onChange={(event) => setMode(event.target.value as AiQueryRequest['mode'])} className="mb-2 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm">
          {modes.map((item) => <option key={item}>{item}</option>)}
        </select>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="h-28 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm outline-none" />
        <div className="mt-3 flex gap-2">
          <Button variant="primary" onClick={runAi} disabled={loading}><Sparkles className="h-4 w-4" /> {loading ? 'Thinking…' : 'Generate'}</Button>
          <Button variant="ghost" onClick={apply} disabled={!response?.dsl}>Apply DSL → Graph</Button>
        </div>
      </div>
      {response && (
        <section className="rounded-xl border border-white/10 bg-surface-950 p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">Explanation</h3>
          <p className="text-sm text-slate-300">{response.explanation}</p>
          {response.dsl && <pre className="mt-3 max-h-72 overflow-auto rounded bg-surface-900 p-2 text-xs text-slate-300">{JSON.stringify(response.dsl, null, 2)}</pre>}
          {response.suggestedIndexes && <div className="mt-3 text-xs text-accent-300">Indexes: {response.suggestedIndexes.join(', ') || 'No filtered fields yet.'}</div>}
          {response.warnings?.map((warning) => <div key={warning} className="mt-2 text-xs text-amber-300">{warning}</div>)}
        </section>
      )}
    </div>
  );
}
