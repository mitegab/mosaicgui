import { openDB, type IDBPDatabase } from 'idb';
import type { QueryDsl } from '../../types/query';

// ---------------------------------------------------------------------------
// DB Configuration
// ---------------------------------------------------------------------------

const DB_NAME = 'mosaic-local-db';
const DB_VERSION = 1;

const MAX_RESULTS_ENTRIES = 20;

interface MosaicDB {
  queries: {
    key: string;
    value: SavedQuery;
    indexes: { createdAt: string };
  };
  results: {
    key: string;
    value: SavedResults;
  };
  'schema-cache': {
    key: string;
    value: SchemaCache;
  };
}

export interface SavedQuery {
  id: string;
  name: string;
  dsl: QueryDsl;
  graph: {
    nodes: unknown[];
    edges: unknown[];
  };
  createdAt: string;
}

interface SavedResults {
  queryId: string;
  rows: Record<string, unknown>[];
  savedAt: string;
}

interface SchemaCache {
  id: string;
  models: unknown[];
  cachedAt: string;
}

// ---------------------------------------------------------------------------
// DB initialisation (lazy singleton)
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<MosaicDB>> | null = null;

function getDb(): Promise<IDBPDatabase<MosaicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MosaicDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // queries store
        if (!db.objectStoreNames.contains('queries')) {
          const queryStore = db.createObjectStore('queries', { keyPath: 'id' });
          queryStore.createIndex('createdAt', 'createdAt');
        }
        // results store
        if (!db.objectStoreNames.contains('results')) {
          db.createObjectStore('results', { keyPath: 'queryId' });
        }
        // schema-cache store
        if (!db.objectStoreNames.contains('schema-cache')) {
          db.createObjectStore('schema-cache', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Query operations
// ---------------------------------------------------------------------------

export async function saveQuery(
  query: SavedQuery
): Promise<void> {
  const db = await getDb();
  await db.put('queries', query);
}

export async function loadQuery(id: string): Promise<SavedQuery | undefined> {
  const db = await getDb();
  return db.get('queries', id);
}

export async function listQueries(): Promise<SavedQuery[]> {
  const db = await getDb();
  // Return newest first using the createdAt index
  const all = await db.getAllFromIndex('queries', 'createdAt');
  return all.reverse();
}

export async function deleteQuery(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['queries', 'results'], 'readwrite');
  await Promise.all([
    tx.objectStore('queries').delete(id),
    tx.objectStore('results').delete(id),
    tx.done,
  ]);
}

// ---------------------------------------------------------------------------
// Results operations (LRU — capped at MAX_RESULTS_ENTRIES)
// ---------------------------------------------------------------------------

export async function saveResults(
  queryId: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('results', 'readwrite');
  const store = tx.objectStore('results');

  // Enforce LRU cap
  const all = await store.getAll();
  if (all.length >= MAX_RESULTS_ENTRIES) {
    // Sort by savedAt ascending (oldest first) and remove excess
    const sorted = [...all].sort((a, b) =>
      a.savedAt.localeCompare(b.savedAt)
    );
    const toDelete = sorted.slice(0, all.length - MAX_RESULTS_ENTRIES + 1);
    for (const entry of toDelete) {
      await store.delete(entry.queryId);
    }
  }

  await store.put({ queryId, rows, savedAt: new Date().toISOString() });
  await tx.done;
}

export async function loadResults(
  queryId: string
): Promise<Record<string, unknown>[] | null> {
  const db = await getDb();
  const entry = await db.get('results', queryId);
  return entry ? entry.rows : null;
}

// ---------------------------------------------------------------------------
// Schema cache operations
// ---------------------------------------------------------------------------

const SCHEMA_CACHE_KEY = 'singleton';

export async function saveSchemaCache(models: unknown[]): Promise<void> {
  const db = await getDb();
  await db.put('schema-cache', {
    id: SCHEMA_CACHE_KEY,
    models,
    cachedAt: new Date().toISOString(),
  });
}

export async function loadSchemaCache(): Promise<unknown[] | null> {
  const db = await getDb();
  const entry = await db.get('schema-cache', SCHEMA_CACHE_KEY);
  return entry ? entry.models : null;
}
