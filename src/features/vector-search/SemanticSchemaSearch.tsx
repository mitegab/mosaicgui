import { FormEvent, useState } from 'react';
import { Database, Info, Search, Sparkles } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { useSchemaStore } from '../../store/schemaStore';
import { semanticSearch, useSemanticIndex, type SemanticSearchResult } from './useSemanticIndex';

export function SemanticSchemaSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[] | null>(null);
  const [confirmedModel, setConfirmedModel] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const index = useSemanticIndex();
  const selectModel = useSchemaStore((state) => state.selectModel);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResults(semanticSearch(query, index, 5));
  }

  function handleExplore(modelName: string) {
    selectModel?.(modelName);
    setConfirmedModel(modelName);
    window.setTimeout(() => {
      setConfirmedModel((current) => (current === modelName ? null : current));
    }, 2000);
  }

  return (
    <Panel
      title="Semantic Schema Search"
      subtitle="Find models by meaning, not just exact spelling"
      action={
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-primary)]"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {showInfo && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-64 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-2.5 text-xs text-[var(--text-secondary)] shadow-card-lg animate-fade-in">
              Powered by local trigram-hash embeddings — works offline, no external AI calls.
            </div>
          )}
        </div>
      }
    >
      <div className="p-3.5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. find something about users and their orders"
              className="input pl-8 text-sm"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            <Sparkles className="h-3.5 w-3.5" />
            Search
          </Button>
        </form>

        <div className="mt-3.5 space-y-2.5">
          {results === null && (
            <p className="text-xs text-[var(--text-muted)]">
              Describe what you're looking for in plain language — the engine ranks schema models by
              semantic-ish similarity using local embeddings.
            </p>
          )}

          {results !== null && results.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">No models in the schema index yet.</p>
          )}

          {results?.map(({ model, similarity }) => {
            const percentage = Math.max(0, Math.min(100, Math.round(similarity * 100)));
            return (
              <div
                key={model.name}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="h-3.5 w-3.5 shrink-0 text-accent-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{model.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {model.appLabel ?? model.tableName ?? `${model.fields.length} fields`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-accent-400">
                    {percentage}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-accent-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <Button size="xs" variant="outline" onClick={() => handleExplore(model.name)}>
                    Explore in Schema Browser
                  </Button>
                  {confirmedModel === model.name && (
                    <span className={cn('text-xs font-medium text-[var(--brand)] animate-fade-in')}>
                      Opened “{model.name}” in Schema Browser
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
