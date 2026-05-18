import { apiPost } from './http';
import type { QueryDsl } from '../types/query';
import type { QueryExecutionResponse } from '../types/execution';

export async function validateQuery(dsl: QueryDsl, signal?: AbortSignal) {
  return apiPost<{ valid: boolean; errors?: string[] }, QueryDsl>('/api/validate-query/', dsl, signal);
}

export async function executeQuery(dsl: QueryDsl, signal?: AbortSignal): Promise<QueryExecutionResponse> {
  const startedAt = performance.now();
  const response = await apiPost<Partial<QueryExecutionResponse> & { results?: Record<string, unknown>[]; data?: Record<string, unknown>[] }, QueryDsl>(
    '/api/query/',
    dsl,
    signal,
  );
  const rows = response.rows ?? response.results ?? response.data ?? [];
  return {
    rows,
    metrics: response.metrics ?? {
      executionTimeMs: Math.round(performance.now() - startedAt),
      backendLatencyMs: Math.round(performance.now() - startedAt),
      rowsReturned: rows.length,
    },
    orm: response.orm,
    logs: response.logs,
    executionPlan: response.executionPlan,
  };
}
