import type { QueryHistoryEntry } from '../../types/execution';

export type AnomalyMetric = 'executionTimeMs' | 'rowsReturned';

export interface AnomalyResult {
  entryId: string;
  metric: AnomalyMetric;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  isAnomaly: boolean;
}

function metricValue(entry: QueryHistoryEntry, metric: AnomalyMetric): number {
  return entry.metrics?.[metric] ?? 0;
}

/**
 * Flags statistically anomalous entries in query execution history using a
 * simple population z-score over the requested metric.
 */
export function detectAnomalies(
  history: QueryHistoryEntry[],
  metric: AnomalyMetric,
  threshold = 2.5,
): AnomalyResult[] {
  if (history.length < 3) return [];

  const values = history.map((entry) => metricValue(entry, metric));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return history.map((entry, index) => {
    const value = values[index];
    const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
    return {
      entryId: entry.id,
      metric,
      value,
      mean,
      stdDev,
      zScore,
      isAnomaly: Math.abs(zScore) > threshold,
    };
  });
}

/** Simple trailing simple-moving-average, used to smooth a trend line. */
export function movingAverage(values: number[], window: number): number[] {
  if (window <= 1) return [...values];
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    result.push(avg);
  }
  return result;
}
