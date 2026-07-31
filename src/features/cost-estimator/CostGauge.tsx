import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CostBreakdown } from './estimateCost';

interface CostGaugeProps {
  breakdown: CostBreakdown;
  /** Upper bound of the gauge scale. Auto-derived from the cost when omitted. */
  maxCost?: number;
}

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 84;
const STROKE = 16;

/** Converts a 0–180 gauge angle (0 = far left, 180 = far right) to a point on the arc. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle <= startAngle) return '';
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

type Zone = 'cheap' | 'moderate' | 'expensive';

const ZONE_COLOR: Record<Zone, string> = {
  cheap: '#4ade80',
  moderate: '#fbbf24',
  expensive: '#f87171',
};

const ZONE_LABEL: Record<Zone, string> = {
  cheap: 'Cheap',
  moderate: 'Moderate',
  expensive: 'Expensive',
};

export function CostGauge({ breakdown, maxCost }: CostGaugeProps) {
  const scaleMax = maxCost ?? Math.max(breakdown.totalCost * 1.35, 50);
  const pct = Math.min(1, scaleMax > 0 ? breakdown.totalCost / scaleMax : 0);
  const needleAngle = pct * 180;

  const zone: Zone = pct < 0.33 ? 'cheap' : pct < 0.66 ? 'moderate' : 'expensive';
  const zoneColor = ZONE_COLOR[zone];

  const needleTip = useMemo(() => polarToCartesian(CENTER, CENTER, RADIUS - 12, needleAngle), [needleAngle]);

  const breakdownData = useMemo(
    () => [
      {
        name: 'Cost',
        'Base scan': Number(breakdown.baseScanCost.toFixed(2)),
        Filters: Number(breakdown.filterCost.toFixed(2)),
        Joins: Number(breakdown.joinCost.toFixed(2)),
        Sort: Number(breakdown.sortCost.toFixed(2)),
      },
    ],
    [breakdown],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={SIZE} height={SIZE / 1.55} viewBox={`0 0 ${SIZE} ${SIZE / 1.55}`}>
        <path
          d={describeArc(CENTER, CENTER, RADIUS, 0, 60)}
          stroke={ZONE_COLOR.cheap}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          opacity={0.28}
        />
        <path
          d={describeArc(CENTER, CENTER, RADIUS, 60, 120)}
          stroke={ZONE_COLOR.moderate}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          opacity={0.28}
        />
        <path
          d={describeArc(CENTER, CENTER, RADIUS, 120, 180)}
          stroke={ZONE_COLOR.expensive}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          opacity={0.28}
        />
        <path
          d={describeArc(CENTER, CENTER, RADIUS, 0, needleAngle)}
          stroke={zoneColor}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        <motion.line
          x1={CENTER}
          y1={CENTER}
          animate={{ x2: needleTip.x, y2: needleTip.y }}
          initial={false}
          transition={{ type: 'spring', stiffness: 110, damping: 14 }}
          stroke="var(--text-primary)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER} r={6} fill="var(--text-primary)" />
      </svg>
      <div className="text-center -mt-3">
        <div className="text-2xl font-bold tabular-nums" style={{ color: zoneColor }}>
          {breakdown.totalCost.toFixed(1)}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: zoneColor }}>
          {ZONE_LABEL[zone]}
        </div>
      </div>

      <div className="w-full h-16 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdownData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Bar dataKey="Base scan" stackId="cost" fill="#60a5fa" radius={[6, 0, 0, 6]} />
            <Bar dataKey="Filters" stackId="cost" fill="#a78bfa" />
            <Bar dataKey="Joins" stackId="cost" fill="#fb923c" />
            <Bar dataKey="Sort" stackId="cost" fill="#f472b6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#60a5fa]" /> Base scan</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Filters</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fb923c]" /> Joins</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f472b6]" /> Sort</span>
      </div>
    </div>
  );
}
