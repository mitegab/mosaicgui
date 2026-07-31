import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';
import { detectAnomalies } from './detectAnomalies';
import { cn } from '../../utils/cn';

export function AnomalyAlertBanner() {
  const history = useExecutionStore((state) => state.history);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const chronological = useMemo(() => [...history].reverse(), [history]);
  const anomalies = useMemo(() => detectAnomalies(chronological, 'executionTimeMs'), [chronological]);

  const mostRecent = history[0];
  const mostRecentAnomaly = mostRecent ? anomalies.find((a) => a.entryId === mostRecent.id) : undefined;

  const shouldShow = Boolean(mostRecentAnomaly?.isAnomaly) && dismissedId !== mostRecent?.id;

  return (
    <AnimatePresence initial={false}>
      {shouldShow && mostRecentAnomaly && mostRecent && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div className="rounded-lg border border-warning-500/30 bg-warning-500/10 px-3 py-2 mb-3">
            <div className="flex items-center gap-2">
              {mostRecentAnomaly.value >= mostRecentAnomaly.mean ? (
                <TrendingUp size={15} className="text-warning-400 shrink-0" />
              ) : (
                <TrendingDown size={15} className="text-warning-400 shrink-0" />
              )}
              <p className="text-xs text-warning-400 flex-1">
                <strong>{mostRecent.name}</strong> ran unusually{' '}
                {mostRecentAnomaly.value >= mostRecentAnomaly.mean ? 'slow' : 'fast'} (z-score{' '}
                {mostRecentAnomaly.zScore.toFixed(2)})
              </p>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-medium text-warning-400 hover:underline shrink-0"
              >
                View details
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <button
                type="button"
                onClick={() => setDismissedId(mostRecent.id)}
                className="shrink-0 text-warning-400/70 hover:text-warning-400"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn('overflow-hidden text-[11px] text-warning-400/90 mt-2 pt-2 border-t border-warning-500/20')}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="opacity-60">This run</div>
                      <div className="font-semibold tabular-nums">{Math.round(mostRecentAnomaly.value)}ms</div>
                    </div>
                    <div>
                      <div className="opacity-60">Historical mean</div>
                      <div className="font-semibold tabular-nums">{Math.round(mostRecentAnomaly.mean)}ms</div>
                    </div>
                    <div>
                      <div className="opacity-60">Std deviation</div>
                      <div className="font-semibold tabular-nums">{Math.round(mostRecentAnomaly.stdDev)}ms</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnomalyAlertBanner;
