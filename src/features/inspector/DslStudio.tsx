import { useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Braces, Check, Clipboard, Diff, WandSparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { dslToGraph } from '../../engine/dslToGraph';
import { validateDsl } from '../../engine/dslSchema';
import { useQueryStore } from '../../store/queryStore';
import { useUiStore } from '../../store/uiStore';
import { toast } from '../../store/toastStore';
import type { QueryDsl } from '../../types/query';
import { cn } from '../../utils/cn';

export function DslStudio() {
  const dsl        = useQueryStore((s) => s.dsl);
  const setDsl     = useQueryStore((s) => s.setDsl);
  const setNodes   = useQueryStore((s) => s.setNodes);
  const setEdges   = useQueryStore((s) => s.setEdges);
  const compileGraph = useQueryStore((s) => s.compileGraph);
  const darkMode   = useUiStore((s) => s.darkMode);
  const [draft, setDraft]       = useState(() => JSON.stringify(dsl, null, 2));
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied]     = useState(false);

  const parsed = useMemo(() => {
    try { return validateDsl(JSON.parse(draft) as unknown); }
    catch (err) {
      return { success: false as const, error: { issues: [{ path: [], message: err instanceof Error ? err.message : 'Invalid JSON' }] } };
    }
  }, [draft]);

  const diagnostics = parsed.success ? [] : parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`);

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    toast('success', 'Copied to clipboard', 'DSL JSON copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => { const n = compileGraph(); setDraft(JSON.stringify(n, null, 2)); toast('info', 'Synced', 'Graph compiled → DSL'); }}>
          <Braces className="h-3.5 w-3.5" /> UI → DSL
        </Button>
        <Button variant="ghost" size="sm" disabled={!parsed.success} onClick={() => { if (!parsed.success) return; setDsl(parsed.data as QueryDsl); toast('success', 'DSL applied'); }}>
          <WandSparkles className="h-3.5 w-3.5" /> Apply DSL
        </Button>
        <Button variant="ghost" size="sm" disabled={!parsed.success} onClick={() => { if (!parsed.success) return; const g = dslToGraph(parsed.data as QueryDsl); setDsl(parsed.data as QueryDsl); setNodes(g.nodes); setEdges(g.edges); toast('success', 'Graph generated', 'DSL → Visual graph updated'); }}>
          DSL → Graph
        </Button>
        <Button variant="ghost" size="sm" disabled={!parsed.success} onClick={() => parsed.success && setDraft(JSON.stringify(parsed.data, null, 2))}>
          Format
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowDiff((v) => !v)}>
          <Diff className="h-3.5 w-3.5" /> Diff
        </Button>
        <div className="ml-auto">
          <Button variant={copied ? 'success' : 'ghost'} size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={parsed.success ? 'success' : 'danger'} dot>
          {parsed.success ? 'Valid DSL' : `${diagnostics.length} error${diagnostics.length !== 1 ? 's' : ''}`}
        </Badge>
        {dsl.model && <Badge variant="brand">{dsl.model}</Badge>}
      </div>

      {diagnostics.length > 0 && (
        <div className="shrink-0 rounded-lg border border-danger-500/30 bg-danger-500/8 p-3 space-y-1">
          {diagnostics.map((d: string) => <div key={d} className="text-xs font-mono text-danger-400">{d}</div>)}
        </div>
      )}

      {showDiff && (
        <div className="shrink-0 grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-code)] p-2.5">
          <div>
            <p className="mb-1.5 text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)]">Compiled DSL</p>
            <pre className="max-h-36 overflow-auto text-[0.6875rem] font-mono text-[var(--text-secondary)]">{JSON.stringify(dsl, null, 2)}</pre>
          </div>
          <div>
            <p className="mb-1.5 text-[0.6rem] uppercase tracking-wide text-[var(--text-muted)]">Editor Draft</p>
            <pre className="max-h-36 overflow-auto text-[0.6875rem] font-mono text-[var(--text-secondary)]">{draft}</pre>
          </div>
        </div>
      )}

      <div className={cn('flex-1 min-h-0 overflow-hidden rounded-lg border', parsed.success ? 'border-[var(--border)]' : 'border-danger-500/30')}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={draft}
          theme={darkMode ? 'vs-dark' : 'light'}
          options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", wordWrap: 'on', tabSize: 2, scrollBeyondLastLine: false, padding: { top: 8, bottom: 8 } }}
          onChange={(v) => setDraft(v ?? '')}
          beforeMount={(monaco) => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
              validate: true,
              schemas: [{ uri: 'mosaic://query-dsl.schema.json', fileMatch: ['*'], schema: { type: 'object', required: ['model','filters','relations','output','limit'], properties: { model: { type: 'string' }, filters: { type: 'array' }, relations: { type: 'array' }, output: { type: 'array', items: { type: 'string' } }, limit: { type: 'number', minimum: 1 } } } }],
            });
          }}
        />
      </div>
    </div>
  );
}
