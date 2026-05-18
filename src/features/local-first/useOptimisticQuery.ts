import { useRef, useState, useCallback } from 'react';
import { useExecutionStore } from '../../store/executionStore';
import { useOfflineStore } from '../../store/offlineStore';
import { syncQueue } from './syncQueue';
import type { QueryDsl } from '../../types/query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OptimisticQueryResult {
  /** Execute a DSL query with optimistic UI update. */
  execute: (dsl: QueryDsl, apiCall: (dsl: QueryDsl) => Promise<import('../../types/execution').QueryExecutionResponse>) => Promise<void>;
  /** True while awaiting real data from the server. */
  isOptimistic: boolean;
  /** Rolls back to the rows that existed before the last optimistic update. */
  rollback: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOptimisticQuery(): OptimisticQueryResult {
  const executionStore = useExecutionStore();
  const offlineStore = useOfflineStore();

  /** Snapshot of rows taken just before the optimistic update. */
  const previousRowsRef = useRef<Record<string, unknown>[]>([]);
  const [isOptimistic, setIsOptimistic] = useState(false);

  // -------------------------------------------------------------------------
  // rollback
  // -------------------------------------------------------------------------

  const rollback = useCallback(() => {
    executionStore.setResult({
      rows: previousRowsRef.current,
      metrics: undefined as unknown as import('../../types/execution').ExecutionMetric,
      orm: '',
      logs: [],
      executionPlan: [],
    });
    setIsOptimistic(false);
  }, [executionStore]);

  // -------------------------------------------------------------------------
  // execute
  // -------------------------------------------------------------------------

  const execute = useCallback(
    async (
      dsl: QueryDsl,
      apiCall: (dsl: QueryDsl) => Promise<import('../../types/execution').QueryExecutionResponse>
    ) => {
      // 1. Snapshot current rows so we can roll back
      previousRowsRef.current = useExecutionStore.getState().rows;

      // 2. Apply optimistic "loading skeleton" — empty rows, running flag
      executionStore.setRunning(true);
      setIsOptimistic(true);

      // Emit a fake empty result as skeleton placeholder
      executionStore.setResult({
        rows: [],
        metrics: undefined as unknown as import('../../types/execution').ExecutionMetric,
        orm: '',
        logs: ['⏳ Optimistic — awaiting server response…'],
        executionPlan: [],
      });
      executionStore.setRunning(true); // Re-flag because setResult clears isRunning

      offlineStore.setStatus('syncing');

      try {
        // 3. Perform the real API call
        const response = await apiCall(dsl);

        // 4. Replace the skeleton with real data
        executionStore.setResult(response);
        setIsOptimistic(false);

        offlineStore.setStatus('saved');
        offlineStore.setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        // 5. On failure: rollback and enqueue for later retry
        rollback();
        offlineStore.setStatus('error');

        const pendingOp = {
          id: crypto.randomUUID(),
          type: 'EXECUTE_QUERY' as const,
          payload: dsl,
          createdAt: new Date().toISOString(),
          retries: 0,
        };

        syncQueue.enqueue(pendingOp);
        offlineStore.addPendingOp(pendingOp);

        executionStore.setError(
          err instanceof Error ? err.message : 'Query execution failed — queued for retry'
        );
      }
    },
    [executionStore, offlineStore, rollback]
  );

  return { execute, isOptimistic, rollback };
}
