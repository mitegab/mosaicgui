import type { QueryDsl } from './query';

export interface ExecutionMetric {
  executionTimeMs: number;
  rowsReturned: number;
  backendLatencyMs: number;
  cacheHit?: boolean;
}

export interface ExecutionPlanStep {
  id: string;
  label: string;
  detail?: string;
  durationMs?: number;
  children?: ExecutionPlanStep[];
}

export interface QueryExecutionResponse {
  rows: Record<string, unknown>[];
  metrics: ExecutionMetric;
  orm?: string;
  logs?: string[];
  executionPlan?: ExecutionPlanStep[];
}

export interface QueryHistoryEntry {
  id: string;
  name: string;
  dsl: QueryDsl;
  createdAt: string;
  metrics?: ExecutionMetric;
  bookmarked?: boolean;
}
