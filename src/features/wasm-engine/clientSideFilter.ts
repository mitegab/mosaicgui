import type { QueryDsl, QueryFilter } from '../../types/query';

// ─── Individual filter operator ──────────────────────────────────────────────

function matchesFilter(row: Record<string, unknown>, filter: QueryFilter): boolean {
  const raw = row[filter.field];
  const value = filter.value;

  switch (filter.operator) {
    case 'exact':
      return String(raw ?? '') === String(value ?? '');

    case 'contains':
      return String(raw ?? '').includes(String(value ?? ''));

    case 'icontains':
      return String(raw ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());

    case 'gt':
      return Number(raw) > Number(value);

    case 'gte':
      return Number(raw) >= Number(value);

    case 'lt':
      return Number(raw) < Number(value);

    case 'lte':
      return Number(raw) <= Number(value);

    case 'in': {
      const list = Array.isArray(value)
        ? value.map(String)
        : String(value ?? '')
            .split(',')
            .map((s) => s.trim());
      return list.includes(String(raw ?? ''));
    }

    case 'isnull':
      return value ? raw === null || raw === undefined : raw !== null && raw !== undefined;

    default:
      return true;
  }
}

// ─── Public exports ───────────────────────────────────────────────────────────

/**
 * Filter rows against an array of QueryFilter descriptors.
 * Filters with logic 'OR' are treated as OR within consecutive OR groups;
 * everything else is AND.
 */
export function clientFilter(
  rows: Record<string, unknown>[],
  filters: QueryFilter[],
): Record<string, unknown>[] {
  if (!filters.length) return rows;

  return rows.filter((row) => {
    // Group consecutive OR filters; AND is the default combinator
    let result = true;
    let orBuffer: QueryFilter[] = [];

    const flushOr = (): boolean => {
      if (!orBuffer.length) return true;
      const r = orBuffer.some((f) => matchesFilter(row, f));
      orBuffer = [];
      return r;
    };

    for (let i = 0; i < filters.length; i++) {
      const f = filters[i];
      const nextLogic = filters[i + 1]?.logic;

      if (f.logic === 'OR' || nextLogic === 'OR') {
        orBuffer.push(f);
      } else {
        if (orBuffer.length) {
          orBuffer.push(f);
          result = result && flushOr();
        } else {
          result = result && matchesFilter(row, f);
        }
      }

      if (!result) return false;
    }

    if (orBuffer.length) result = result && flushOr();
    return result;
  });
}

/**
 * Sort rows by a list of field specifiers.
 * "field"  → ascending
 * "-field" → descending
 */
export function clientSort(
  rows: Record<string, unknown>[],
  orderBy: string[],
): Record<string, unknown>[] {
  if (!orderBy.length) return rows;

  return [...rows].sort((a, b) => {
    for (const spec of orderBy) {
      const desc = spec.startsWith('-');
      const field = desc ? spec.slice(1) : spec;
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
}

/**
 * Paginate rows: return `limit` items starting at `offset`.
 */
export function clientPaginate(
  rows: Record<string, unknown>[],
  limit: number,
  offset: number,
): Record<string, unknown>[] {
  if (limit <= 0) return rows.slice(offset);
  return rows.slice(offset, offset + limit);
}

/**
 * Run all three operations (filter → sort → paginate) from a QueryDsl.
 */
export function processLocally(
  rows: Record<string, unknown>[],
  dsl: QueryDsl,
): Record<string, unknown>[] {
  let result = clientFilter(rows, dsl.filters ?? []);
  result = clientSort(result, dsl.orderBy ?? []);
  result = clientPaginate(result, dsl.limit ?? 0, dsl.offset ?? 0);

  // Field projection if output is specified
  if (dsl.output && dsl.output.length > 0) {
    result = result.map((row) => {
      const projected: Record<string, unknown> = {};
      for (const field of dsl.output) {
        if (field in row) projected[field] = row[field];
      }
      return projected;
    });
  }

  return result;
}
