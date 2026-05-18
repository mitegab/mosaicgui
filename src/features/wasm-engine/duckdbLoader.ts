// Lazy-loads @duckdb/duckdb-wasm and provides singleton access

interface DuckDbInstance {
  db: unknown;
  conn: unknown;
}

let cached: DuckDbInstance | null = null;
let loadPromise: Promise<DuckDbInstance> | null = null;

/**
 * Lazy-load DuckDB WASM and return a singleton {db, conn}.
 * Throws with a descriptive error if loading fails.
 */
export async function loadDuckDb(): Promise<DuckDbInstance> {
  if (cached) return cached;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Dynamic import so the heavy WASM bundle is not in the main chunk
      const duckdb = await import('@duckdb/duckdb-wasm');

      // Choose the best available bundle
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

      // selectBundle picks EH (exception-handling) if the browser supports it, else MVP
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' }),
      );
      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(worker_url);

      const conn = await (db as any).connect();

      cached = { db, conn };
      return cached;
    } catch (err) {
      loadPromise = null; // allow retry
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `DuckDB WASM failed to load: ${msg}. ` +
          'This may happen if the page is served without cross-origin isolation headers ' +
          '(COOP/COEP) required for SharedArrayBuffer.',
      );
    }
  })();

  return loadPromise;
}

/**
 * Loads `data` into an in-memory DuckDB table called `local_data`,
 * executes `sql`, and returns the result rows as plain objects.
 *
 * Falls back to a plain-JS filter if DuckDB cannot be loaded.
 */
export async function queryLocalData(
  sql: string,
  data: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  try {
    const { conn } = await loadDuckDb();
    const c = conn as any;

    // Drop previous table if it exists
    await c.query('DROP TABLE IF EXISTS local_data');

    if (!data.length) return [];

    // Build CREATE TABLE from the first row's keys
    const columns = Object.keys(data[0]);
    const colDefs = columns.map((col) => {
      const sample = data.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
      let type = 'VARCHAR';
      if (typeof sample === 'number') type = Number.isInteger(sample) ? 'BIGINT' : 'DOUBLE';
      else if (typeof sample === 'boolean') type = 'BOOLEAN';
      return `"${col}" ${type}`;
    });
    await c.query(`CREATE TABLE local_data (${colDefs.join(', ')})`);

    // Bulk insert via JSON
    const jsonRows = JSON.stringify(data);
    await c.query(
      `INSERT INTO local_data SELECT * FROM read_json_auto('data:application/json,${encodeURIComponent(jsonRows)}')`,
    );

    const result = await c.query(sql);
    const rows: Record<string, unknown>[] = [];
    const schema = result.schema.fields.map((f: { name: string }) => f.name);
    for (let i = 0; i < result.numRows; i++) {
      const row: Record<string, unknown> = {};
      schema.forEach((field: string, j: number) => {
        row[field] = result.getChildAt(j)?.get(i) ?? null;
      });
      rows.push(row);
    }
    return rows;
  } catch {
    // Graceful fallback: basic JS filter/sort
    return fallbackQuery(sql, data);
  }
}

/**
 * Minimal JS fallback — handles simple SELECT * FROM local_data WHERE/LIMIT/ORDER BY
 */
function fallbackQuery(sql: string, data: Record<string, unknown>[]): Record<string, unknown>[] {
  let rows = [...data];

  // ORDER BY
  const orderMatch = sql.match(/ORDER BY\s+([^\s,]+)\s*(ASC|DESC)?/i);
  if (orderMatch) {
    const field = orderMatch[1].replace(/['"]/g, '');
    const dir = (orderMatch[2] ?? 'ASC').toUpperCase();
    rows.sort((a, b) => {
      const av = String(a[field] ?? '');
      const bv = String(b[field] ?? '');
      return dir === 'ASC' ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
    });
  }

  // LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
    const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
    rows = rows.slice(offset, offset + parseInt(limitMatch[1], 10));
  }

  return rows;
}
