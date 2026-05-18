import { dslToGraph } from '../../engine/dslToGraph';
import type { QueryDsl, QueryGraphEdge, QueryGraphNode } from '../../types/query';

// ─── Write helpers ───────────────────────────────────────────────────────────

/**
 * Copy text to clipboard.
 * Uses navigator.clipboard.writeText with an execCommand fallback for
 * older environments / non-HTTPS contexts.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

// ─── Read helpers ────────────────────────────────────────────────────────────

/**
 * Read text from clipboard.
 * Uses navigator.clipboard.readText with a prompt-based fallback.
 */
export async function readFromClipboard(): Promise<string> {
  if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    return navigator.clipboard.readText();
  }
  // Fallback: prompt (works in some environments)
  return prompt('Paste content here:') ?? '';
}

// ─── Format converters ───────────────────────────────────────────────────────

/**
 * Converts rows to a GitHub-flavoured Markdown table.
 */
export function rowsToMarkdownTable(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = `| ${cols.join(' | ')} |`;
  const separator = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${cols.map((c) => String(row[c] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)
    .join('\n');
  return `${header}\n${separator}\n${body}`;
}

/**
 * Converts rows to TSV (tab-separated values).
 * First row is the header.  Compatible with pasting into Excel / Sheets.
 */
export function rowsToTsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = cols.join('\t');
  const body = rows
    .map((row) =>
      cols.map((c) => String(row[c] ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'),
    )
    .join('\n');
  return `${header}\n${body}`;
}

/**
 * Parses a TSV string into rows.
 * The first row is treated as the header.
 */
export function parseTsvToRows(tsv: string): Record<string, unknown>[] {
  const lines = tsv.split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const cells = line.split('\t');
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

// ─── DSL parser ──────────────────────────────────────────────────────────────

/**
 * Parses a JSON string as a QueryDsl and converts it to graph nodes/edges.
 * Returns null if the string is not valid JSON or does not look like a QueryDsl.
 */
export function parseJsonToQueryGraph(
  json: string,
): { nodes: QueryGraphNode[]; edges: QueryGraphEdge[] } | null {
  try {
    const parsed = JSON.parse(json) as Partial<QueryDsl>;
    // Minimal validation: must have model field and filters array
    if (typeof parsed.model !== 'string') return null;
    if (!Array.isArray(parsed.filters)) return null;

    const dsl: QueryDsl = {
      model: parsed.model,
      filters: parsed.filters ?? [],
      relations: parsed.relations ?? [],
      output: parsed.output ?? [],
      limit: parsed.limit ?? 10,
      offset: parsed.offset,
      orderBy: parsed.orderBy,
    };

    return dslToGraph(dsl);
  } catch {
    return null;
  }
}
