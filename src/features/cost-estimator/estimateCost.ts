import type { ConditionOperator, QueryDsl } from '../../types/query';

export interface CostBreakdown {
  baseScanCost: number;
  filterCost: number;
  joinCost: number;
  sortCost: number;
  totalCost: number;
  estimatedRows: number;
  warnings: string[];
}

/**
 * Heuristic selectivity factor per operator — the fraction of rows that
 * survive a filter using that operator. Lower = more selective.
 */
const SELECTIVITY: Partial<Record<ConditionOperator, number>> = {
  icontains: 0.3,
  contains: 0.3,
  exact: 0.05,
  gt: 0.4,
  gte: 0.4,
  lt: 0.4,
  lte: 0.4,
  in: 0.2,
  isnull: 0.5,
};

const DEFAULT_SELECTIVITY = 0.5;

/**
 * Pure, deterministic heuristic cost estimator. Does not touch a real
 * database — it derives a "cost unit" score purely from the shape of the
 * DSL and a rough row-count estimate for the target model.
 */
export function estimateQueryCost(dsl: QueryDsl, modelRowEstimate: number): CostBreakdown {
  const safeRowEstimate = Math.max(0, modelRowEstimate || 0);

  const baseScanCost = safeRowEstimate * 0.001;

  // Selectivity narrows down the number of rows the plan expects to touch.
  let estimatedRows = safeRowEstimate;
  for (const filter of dsl.filters) {
    const selectivity = SELECTIVITY[filter.operator] ?? DEFAULT_SELECTIVITY;
    estimatedRows *= selectivity;
  }
  estimatedRows = Math.max(0, Math.round(estimatedRows));

  const filterCost = dsl.filters.length * 2;

  const joinCost = dsl.relations.length * safeRowEstimate * 0.0005;

  const sortCost =
    dsl.orderBy && dsl.orderBy.length > 0
      ? estimatedRows * Math.log2(Math.max(2, estimatedRows)) * 0.0001
      : 0;

  const totalCost = baseScanCost + filterCost + joinCost + sortCost;

  const warnings: string[] = [];
  if (dsl.filters.length > 0 && estimatedRows > 10000) {
    warnings.push('No indexed filter detected — consider adding an index');
  }
  if (!dsl.limit) {
    warnings.push('Missing LIMIT clause');
  }
  if (dsl.relations.length > 2) {
    warnings.push('Cartesian join risk');
  }

  return {
    baseScanCost,
    filterCost,
    joinCost,
    sortCost,
    totalCost,
    estimatedRows,
    warnings,
  };
}
