import { useEffect, useMemo, useState } from "react";
import { Database, Hash, History, Zap, Search, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  useFuzzySearchIndex,
  searchIndex,
  type SearchableCategory,
  type ScoredSearchableItem,
} from "./useFuzzySearchIndex";

// ─── Score thresholds ───────────────────────────────────────────────────────

const DISPLAY_THRESHOLD = 0.4;
const DID_YOU_MEAN_MIN = 0.25;
const DID_YOU_MEAN_MAX = 0.4;
const DEBOUNCE_MS = 150;

const CATEGORY_ICON: Record<SearchableCategory, typeof Database> = {
  model: Database,
  field: Hash,
  query: History,
  action: Zap,
};

const CATEGORY_LABEL: Record<SearchableCategory, string> = {
  model: "Model",
  field: "Field",
  query: "Query",
  action: "Action",
};

// ─── Longest common substring highlighting ─────────────────────────────────
// Simple heuristic used purely for visual highlighting: find the longest
// run of characters shared (contiguously) between the query and the
// candidate label, then bold that run within the rendered label. This is
// not meant to reconstruct the full fuzzy alignment — just to give the
// user a quick visual anchor for *why* a result matched.

function longestCommonSubstringRange(
  query: string,
  candidate: string,
): { start: number; length: number } {
  const a = query.toLowerCase();
  const b = candidate.toLowerCase();

  if (!a || !b) return { start: 0, length: 0 };

  let best = { aEnd: 0, bEnd: 0, length: 0 };
  let prevRow = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        currentRow[j] = prevRow[j - 1] + 1;
        if (currentRow[j] > best.length) {
          best = { aEnd: i, bEnd: j, length: currentRow[j] };
        }
      }
    }
    prevRow = currentRow;
  }

  return { start: best.bEnd - best.length, length: best.length };
}

function HighlightedLabel({ query, label }: { query: string; label: string }) {
  if (!query.trim()) return <>{label}</>;

  const { start, length } = longestCommonSubstringRange(query, label);
  if (length === 0) return <>{label}</>;

  const before = label.slice(0, start);
  const match = label.slice(start, start + length);
  const after = label.slice(start + length);

  return (
    <>
      {before}
      <strong className="font-bold text-accent-400">{match}</strong>
      {after}
    </>
  );
}

// ─── Debounce hook ──────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FuzzySearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const index = useFuzzySearchIndex();

  const allResults = useMemo(
    () => searchIndex(index, debouncedQuery),
    [index, debouncedQuery],
  );

  const visibleResults = useMemo(
    () =>
      allResults.filter((item) => item.score >= DISPLAY_THRESHOLD).slice(0, 8),
    [allResults],
  );

  const didYouMean: ScoredSearchableItem | null = useMemo(() => {
    if (visibleResults.length > 0 || !debouncedQuery.trim()) return null;
    const candidate = allResults[0];
    if (
      candidate &&
      candidate.score >= DID_YOU_MEAN_MIN &&
      candidate.score < DID_YOU_MEAN_MAX
    ) {
      return candidate;
    }
    return null;
  }, [allResults, visibleResults, debouncedQuery]);

  const showDropdown = debouncedQuery.trim().length > 0;

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search models, fields, queries, actions…"
          className="input pl-8 text-sm"
          spellCheck={false}
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] shadow-card-lg animate-fade-in">
          {visibleResults.length > 0 ? (
            <ul className="divide-y divide-[var(--border)]">
              {visibleResults.map((item) => {
                const Icon = CATEGORY_ICON[item.category];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-panel-hover)]"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm text-[var(--text-primary)]">
                            <HighlightedLabel
                              query={debouncedQuery}
                              label={item.label}
                            />
                          </span>
                          <span className="shrink-0 rounded-full bg-[var(--brand-subtle)] px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--brand)]">
                            {CATEGORY_LABEL[item.category]}
                          </span>
                        </span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-[var(--text-muted)]">
                            {item.subtitle}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[0.625rem] tabular-nums text-[var(--text-muted)]">
                        {Math.round(item.score * 100)}%
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">No matches</p>
              {didYouMean ? (
                <button
                  type="button"
                  onClick={() => setQuery(didYouMean.label)}
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                    "text-accent-400 hover:bg-[var(--brand-subtle)]",
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  Did you mean “{didYouMean.label}”?
                </button>
              ) : (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Try a different spelling or shorter term.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
