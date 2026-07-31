import { useMemo } from 'react';
import { useSchemaStore } from '../../store/schemaStore';
import { useExecutionStore } from '../../store/executionStore';
import { fuzzyMatch } from './levenshtein';

// ─── Types ─────────────────────────────────────────────────────────────────

export type SearchableCategory = 'model' | 'field' | 'query' | 'action';

export interface SearchableItem {
  id: string;
  label: string;
  category: SearchableCategory;
  subtitle?: string;
}

export interface ScoredSearchableItem extends SearchableItem {
  score: number;
}

// ─── Static app actions ────────────────────────────────────────────────────
// A representative set of command-palette-style actions that a user might
// look for by fuzzy name, independent of any live application state.

const STATIC_ACTIONS: SearchableItem[] = [
  { id: 'action-run-query', label: 'Run Query', category: 'action', subtitle: 'Execute the compiled query against the schema' },
  { id: 'action-compile-graph', label: 'Compile Graph', category: 'action', subtitle: 'Turn the visual graph into a query DSL' },
  { id: 'action-open-dsl-studio', label: 'Open DSL Studio', category: 'action', subtitle: 'Edit the raw query DSL directly' },
  { id: 'action-open-schema-browser', label: 'Open Schema Browser', category: 'action', subtitle: 'Browse models and fields' },
  { id: 'action-export-results', label: 'Export Results', category: 'action', subtitle: 'Download query results as CSV/JSON' },
  { id: 'action-save-query', label: 'Save Query', category: 'action', subtitle: 'Bookmark the current query for later' },
  { id: 'action-toggle-theme', label: 'Toggle Dark Mode', category: 'action', subtitle: 'Switch between light and dark themes' },
  { id: 'action-open-history', label: 'Open Query History', category: 'action', subtitle: 'View previously executed queries' },
  { id: 'action-create-workspace', label: 'Create Workspace', category: 'action', subtitle: 'Start a new tenant workspace' },
  { id: 'action-manage-secrets', label: 'Manage API Keys', category: 'action', subtitle: 'Open the secrets vault' },
];

// ─── Index builder ──────────────────────────────────────────────────────────

/**
 * Builds a flat, searchable index combining schema models, schema fields,
 * saved query-history entries, and static app actions. Recomputed whenever
 * the underlying stores change.
 */
export function useFuzzySearchIndex(): SearchableItem[] {
  const models = useSchemaStore((state) => state.models);
  const history = useExecutionStore((state) => state.history);

  return useMemo(() => {
    const items: SearchableItem[] = [];

    for (const model of models) {
      items.push({
        id: `model-${model.name}`,
        label: model.name,
        category: 'model',
        subtitle: model.appLabel ?? model.tableName,
      });

      for (const field of model.fields) {
        items.push({
          id: `field-${model.name}-${field.name}`,
          label: field.name,
          category: 'field',
          subtitle: `${model.name} · ${field.type}`,
        });
      }
    }

    for (const entry of history) {
      items.push({
        id: `query-${entry.id}`,
        label: entry.name,
        category: 'query',
        subtitle: entry.dsl.model ? `Model: ${entry.dsl.model}` : 'Query history',
      });
    }

    items.push(...STATIC_ACTIONS);

    return items;
  }, [models, history]);
}

// ─── Search ─────────────────────────────────────────────────────────────────

/**
 * Fuzzily searches an index of `SearchableItem`s against `query`, matching
 * on `label` primarily and `subtitle` secondarily (weighted down since a
 * subtitle match is a weaker signal than a direct label match).
 */
export function searchIndex(items: SearchableItem[], query: string): ScoredSearchableItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const SUBTITLE_WEIGHT = 0.7;
  const scored = new Map<string, ScoredSearchableItem>();

  const labelMatches = fuzzyMatch(trimmed, items.map((item) => item.label), 0);
  const labelScoreByCandidate = new Map(labelMatches.map((m) => [m.candidate, m.score]));

  for (const item of items) {
    const labelScore = labelScoreByCandidate.get(item.label) ?? 0;
    const subtitleScore = item.subtitle
      ? fuzzyMatch(trimmed, [item.subtitle], 0)[0]?.score ?? 0
      : 0;

    const score = Math.max(labelScore, subtitleScore * SUBTITLE_WEIGHT);

    const existing = scored.get(item.id);
    if (!existing || existing.score < score) {
      scored.set(item.id, { ...item, score });
    }
  }

  return Array.from(scored.values())
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}
