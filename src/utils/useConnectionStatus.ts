import { useEffect, useState } from 'react';

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const start = performance.now();
      try {
        await fetch('/api/health/', { signal: AbortSignal.timeout(3000) });
        if (!cancelled) {
          setStatus('connected');
          setLatency(Math.round(performance.now() - start));
        }
      } catch {
        if (!cancelled) {
          setStatus('disconnected');
          setLatency(null);
        }
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { status, latency };
}
