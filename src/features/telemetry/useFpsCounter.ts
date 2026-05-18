import { useState, useEffect, useRef } from 'react';

// ─── useFpsCounter ─────────────────────────────────────────────────────────
//
// Uses requestAnimationFrame to count how many frames fire within each
// one-second window, then exposes the result.  State updates are throttled
// to once per second so callers don't re-render on every frame.

export interface FpsResult {
  fps: number;
  isLow: boolean;   // true when fps < 30
}

export function useFpsCounter(): FpsResult {
  const [fps, setFps] = useState(0);

  // Track frame count and the timestamp of the last "tick" (once/sec update)
  const frameCountRef = useRef(0);
  const lastTickRef   = useRef<number>(performance.now());
  const rafIdRef      = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    function tick(now: number) {
      if (!mounted) return;

      frameCountRef.current += 1;
      const elapsed = now - lastTickRef.current;

      // Publish once per second
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTickRef.current   = now;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { fps, isLow: fps > 0 && fps < 30 };
}
