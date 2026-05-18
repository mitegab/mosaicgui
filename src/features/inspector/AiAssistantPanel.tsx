import { useState } from 'react';
import { Bot, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { generateAiQuery } from '../../ai/aiQueryAssistant';
import { dslToGraph } from '../../engine/dslToGraph';
import { useQueryStore } from '../../store/queryStore';
import { toast } from '../../store/toastStore';
import type { AiQueryRequest, AiQueryResponse } from '../../types/ai';
import { cn } from '../../utils/cn';

const modes: { value: AiQueryRequest['mode']; label: string; desc: string }[] = [
  { value: 'generate',       label: 'Generate',       desc: 'Natural language → DSL' },
  { value: 'fix',            label: 'Fix',             desc: 'Fix broken DSL' },
  { value: 'optimize',       label: 'Optimize',        desc: 'Optimize query' },
  { value: 'sql-to-dsl',     label: 'SQL → DSL',       desc: 'Convert raw SQL' },
  { value: 'suggest-indexes', label: 'Indexes',        desc: 'Suggest DB indexes' },
];

export function AiAssistantPanel() {
  const [prompt, setPrompt]     = useState('find books published after 2020 with django in title');
  const [mode, setMode]         = useState<AiQueryRequest['mode']>('generate');
  const [response, setResponse] = useState<AiQueryResponse | null>(null);
  const [loading, setLoading]   = useState(false);

  const dsl      = useQueryStore((s) => s.dsl);
  const setDsl   = useQueryStore((s) => s.setDsl);
  const setNodes = useQueryStore((s) => s.setNodes);
  const setEdges = useQueryStore((s) => s.setEdges);

  async function runAi() {
    setLoading(true);
    try {
      const result = await generateAiQuery({ prompt, mode, currentDsl: dsl });
      setResponse(result);
      toast('success', 'AI response ready', `Mode: ${mode}`);
    } catch {
      toast('error', 'AI request failed', 'Check your connection');
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!response?.dsl) return;
    const graph = dslToGraph(response.dsl);
    setDsl(response.dsl);
    setNodes(graph.nodes);
    setEdges(graph.edges);
    toast('success', 'Applied to graph', 'AI DSL loaded into visual builder');
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'rounded-lg px-2 py-2 text-left transition-all text-[0.6875rem]',
              mode === m.value
                ? 'bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)]'
                : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]',
            )}
          >
            <div className="font-semibold">{m.label}</div>
            <div className="text-[0.6rem] opacity-70 mt-0.5 leading-tight">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-code)] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
          <Bot className="h-3.5 w-3.5 text-[var(--brand)]" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">Prompt</span>
          <Badge variant="brand" className="ml-auto">{mode}</Badge>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none leading-relaxed"
          placeholder="Describe your query in plain English…"
        />
      </div>

      <div className="flex gap-2 shrink-0">
        <Button variant="primary" size="sm" onClick={runAi} loading={loading} className="flex-1">
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Thinking…' : 'Generate'}
        </Button>
        <Button variant="outline" size="sm" onClick={apply} disabled={!response?.dsl}>
          <Wand2 className="h-3.5 w-3.5" /> Apply
        </Button>
      </div>

      {/* Response */}
      {response && (
        <div className="flex-1 overflow-auto space-y-3 animate-slide-in-up">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-3">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1.5">Explanation</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{response.explanation}</p>
          </div>

          {response.dsl && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-code)] overflow-hidden">
              <p className="px-3 py-2 text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border)]">Generated DSL</p>
              <pre className="px-3 py-2.5 text-[0.6875rem] font-mono text-[var(--text-secondary)] max-h-48 overflow-auto leading-relaxed">
                {JSON.stringify(response.dsl, null, 2)}
              </pre>
            </div>
          )}

          {response.suggestedIndexes && (
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--brand-subtle)] p-3">
              <p className="text-xs font-semibold text-[var(--brand)] mb-1.5">Suggested Indexes</p>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                {response.suggestedIndexes.join(', ') || 'No filtered fields yet.'}
              </p>
            </div>
          )}

          {response.warnings?.map((w) => (
            <div key={w} className="rounded-lg border border-warning-500/30 bg-warning-500/8 px-3 py-2 text-xs text-warning-400">
              ⚠ {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
