import { useRef } from 'react';
import { executeQuery } from '../../api/queryApi';
import { useExecutionStore } from '../../store/executionStore';
import { useQueryStore } from '../../store/queryStore';

export function useExecuteQuery() {
  const controllerRef = useRef<AbortController | null>(null);
  const compileGraph = useQueryStore((state) => state.compileGraph);
  const { setRunning, setResult, setError, addHistory } = useExecutionStore();

  const run = async () => {
    const dsl = compileGraph();
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);

    try {
      const response = await executeQuery(dsl, controller.signal);
      setResult(response);
      addHistory({ id: crypto.randomUUID(), name: `${dsl.model || 'Untitled'} query`, dsl, createdAt: new Date().toISOString(), metrics: response.metrics });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setError('Query execution cancelled.');
      } else {
        setError(error instanceof Error ? error.message : 'Query execution failed.');
      }
    }
  };

  const stop = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setRunning(false);
  };

  return { run, stop };
}
