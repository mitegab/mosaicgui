import { useState, useEffect, useRef } from 'react';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useFpsCounter } from './useFpsCounter';
import { useMemoryMonitor } from './useMemoryMonitor';
import { NetworkWaterfall } from './NetworkWaterfall';

// ─── FPS sparkline ─────────────────────────────────────────────────────────

const SPARKLINE_W  = 80;
const SPARKLINE_H  = 24;
const HISTORY_SIZE = 20;

function FpsSparkline({ history }: { history: number[] }) {
  if (history.length < 2) {
    return <svg width={SPARKLINE_W} height={SPARKLINE_H} className="opacity-40" />;
  }

  const max = Math.max(...history, 60);   // floor the scale at 60 fps
  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * SPARKLINE_W;
    const y = SPARKLINE_H - (v / max) * SPARKLINE_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const latest = history[history.length - 1] ?? 0;
  const lineColor =
    latest >= 60 ? '#34d399' :
    latest >= 30 ? '#fbbf24' :
    '#f87171';

  return (
    <svg
      width={SPARKLINE_W}
      height={SPARKLINE_H}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Dot at latest value */}
      {history.length > 0 && (
        <circle
          cx={SPARKLINE_W}
          cy={SPARKLINE_H - ((latest / max) * SPARKLINE_H)}
          r={2}
          fill={lineColor}
        />
      )}
    </svg>
  );
}

// ─── FPS display ───────────────────────────────────────────────────────────

function fpsTextColor(fps: number): string {
  if (fps >= 60) return 'text-emerald-400';
  if (fps >= 30) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Memory bar ────────────────────────────────────────────────────────────

function MemoryBar({ percent, isWarning }: { percent: number; isWarning: boolean }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isWarning ? 'bg-red-400' : percent > 60 ? 'bg-amber-400' : 'bg-emerald-400'
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-[0.6rem] font-mono text-white/40 w-8 text-right">{percent}%</span>
    </div>
  );
}

// ─── TelemetryHUD ──────────────────────────────────────────────────────────

export function TelemetryHUD() {
  const [visible, setVisible]         = useState(false);
  const [waterfallOpen, setWaterfall] = useState(false);

  const { fps }                          = useFpsCounter();
  const { usedMb, limitMb, percent, isWarning } = useMemoryMonitor();

  // Keep rolling history of FPS readings (last 20)
  const historyRef = useRef<number[]>([]);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  useEffect(() => {
    if (fps === 0) return;
    historyRef.current = [...historyRef.current.slice(-(HISTORY_SIZE - 1)), fps];
    setFpsHistory([...historyRef.current]);
  }, [fps]);

  return (
    <>
      {/* ── Toggle button (always visible) ─────────────────────────────── */}
      <button
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide telemetry HUD' : 'Show telemetry HUD'}
        aria-pressed={visible}
        title="Toggle telemetry HUD"
        style={{ position: 'fixed', top: 12, right: 12, zIndex: 9997 }}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg',
          'border border-white/10 backdrop-blur',
          'transition-all duration-150 text-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          visible
            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
            : 'bg-surface-900/80 text-white/30 hover:text-white/60 hover:bg-surface-800/80'
        )}
      >
        <Zap size={13} />
      </button>

      {/* ── HUD panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="telemetry-hud"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ position: 'fixed', top: 44, right: 12, zIndex: 9996, width: 260 }}
            className="rounded-xl overflow-hidden bg-surface-900/95 backdrop-blur border border-white/10 shadow-2xl text-white"
          >
            {/* ── Metrics section ────────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5 p-3 border-b border-white/8">
              {/* FPS row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] text-white/40 uppercase tracking-wider w-14">FPS</span>
                  <span
                    className={cn('text-base font-bold font-mono leading-none', fpsTextColor(fps))}
                    aria-label={`${fps} frames per second`}
                  >
                    {fps || '—'}
                  </span>
                </div>
                <FpsSparkline history={fpsHistory} />
              </div>

              {/* Memory row */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6rem] text-white/40 uppercase tracking-wider">Heap</span>
                  <span className="text-[0.65rem] font-mono text-white/50">
                    {limitMb > 0 ? `${usedMb} / ${limitMb} MiB` : 'N/A'}
                  </span>
                </div>
                <MemoryBar percent={percent} isWarning={isWarning} />
              </div>
            </div>

            {/* ── Network waterfall toggle ────────────────────────────────── */}
            <button
              onClick={() => setWaterfall((v) => !v)}
              aria-expanded={waterfallOpen}
              className="w-full flex items-center justify-between px-3 py-2 text-[0.65rem] text-white/40 hover:text-white/70 hover:bg-white/4 transition-colors"
            >
              <span className="uppercase tracking-wider font-semibold">Network Waterfall</span>
              {waterfallOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <AnimatePresence initial={false}>
              {waterfallOpen && (
                <motion.div
                  key="waterfall"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{    height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/8"
                >
                  <NetworkWaterfall />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
