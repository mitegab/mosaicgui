import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { AlertOctagon } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';
import { detectAnomalies } from './detectAnomalies';

interface ChartPoint {
  id: string;
  index: number;
  label: string;
  executionTimeMs: number;
  isAnomaly: boolean;
  zScore: number;
  lower: number;
  upper: number;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AnomalyDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload?.isAnomaly) return null;
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r={4}
        fill="none"
        stroke="#f87171"
        strokeWidth={2}
        initial={{ r: 4, opacity: 0.8 }}
        animate={{ r: [4, 11, 4], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
      />
      <circle cx={cx} cy={cy} r={4} fill="#f87171" stroke="var(--bg-panel)" strokeWidth={1.5} />
    </g>
  );
}

export function AnomalyTimeline() {
  const history = useExecutionStore((state) => state.history);

  const chronological = useMemo(() => [...history].reverse(), [history]);
  const anomalies = useMemo(() => detectAnomalies(chronological, 'executionTimeMs'), [chronological]);

  const mean = anomalies[0]?.mean ?? 0;
  const stdDev = anomalies[0]?.stdDev ?? 0;

  const data: ChartPoint[] = useMemo(
    () =>
      chronological.map((entry, index) => {
        const anomaly = anomalies[index];
        return {
          id: entry.id,
          index,
          label: formatTime(entry.createdAt),
          executionTimeMs: entry.metrics?.executionTimeMs ?? 0,
          isAnomaly: anomaly?.isAnomaly ?? false,
          zScore: anomaly?.zScore ?? 0,
          lower: Math.max(0, mean - 2 * stdDev),
          upper: mean + 2 * stdDev,
        };
      }),
    [chronological, anomalies, mean, stdDev],
  );

  const flagged = useMemo(() => anomalies.filter((a) => a.isAnomaly), [anomalies]);

  if (chronological.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-[var(--text-muted)]">
        <AlertOctagon className="w-8 h-8 opacity-30" />
        <p className="text-xs">Run at least 3 queries to unlock anomaly detection</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip
              formatter={(value: number, name: string) => [`${Math.round(value)}ms`, name]}
              contentStyle={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#60a5fa"
              fillOpacity={0.08}
              isAnimationActive={false}
              name="Normal range"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="var(--bg-panel)"
              fillOpacity={1}
              isAnimationActive={false}
              legendType="none"
              name="_lowerMask"
            />
            <ReferenceLine y={mean} stroke="#60a5fa" strokeDasharray="4 4" label={{ value: 'mean', fontSize: 10, fill: '#60a5fa' }} />
            <Line
              type="monotone"
              dataKey="executionTimeMs"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={<AnomalyDot />}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={400}
              name="Execution time"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1.5">
        {flagged.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No anomalies detected in recent execution history.</p>
        ) : (
          flagged.map((anomaly) => {
            const entry = chronological.find((item) => item.id === anomaly.entryId);
            const pctDiff = anomaly.mean > 0 ? ((anomaly.value - anomaly.mean) / anomaly.mean) * 100 : 0;
            const direction = pctDiff >= 0 ? 'longer' : 'faster';
            return (
              <div
                key={anomaly.entryId}
                className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs text-danger-400"
              >
                <AlertOctagon size={13} className="shrink-0 mt-0.5" />
                <span>
                  <strong>{entry?.name ?? 'Query'}</strong> took {Math.abs(pctDiff).toFixed(0)}% {direction} than usual
                  {' '}(z={anomaly.zScore.toFixed(2)}).
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AnomalyTimeline;
