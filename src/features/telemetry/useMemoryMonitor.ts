import { useState, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MemoryResult {
  usedMb: number;
  limitMb: number;
  percent: number;
  isWarning: boolean;  // true when percent > 80
}

// Chrome-specific memory API — not in standard TypeScript lib
interface ChromePerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
}

const FALLBACK: MemoryResult = {
  usedMb: 0,
  limitMb: 0,
  percent: 0,
  isWarning: false,
};

function readMemory(): MemoryResult {
  const mem = (performance as unknown as { memory?: ChromePerformanceMemory }).memory;
  if (!mem) return FALLBACK;

  const usedMb  = mem.usedJSHeapSize  / 1_048_576;   // bytes → MiB
  const limitMb = mem.jsHeapSizeLimit  / 1_048_576;
  const percent = limitMb > 0 ? Math.round((usedMb / limitMb) * 100) : 0;

  return {
    usedMb:    Math.round(usedMb),
    limitMb:   Math.round(limitMb),
    percent,
    isWarning: percent > 80,
  };
}

// ─── useMemoryMonitor ──────────────────────────────────────────────────────

export function useMemoryMonitor(): MemoryResult {
  const [result, setResult] = useState<MemoryResult>(readMemory);

  useEffect(() => {
    // Immediately read on mount; then poll every 2 s
    setResult(readMemory());
    const interval = setInterval(() => setResult(readMemory()), 2000);
    return () => clearInterval(interval);
  }, []);

  return result;
}
