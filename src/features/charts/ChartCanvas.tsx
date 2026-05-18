import React, { useMemo, useRef } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useChartStore, useDerivedChartData } from './useChartStore';
import { Panel } from '../../components/ui/Panel';
import { ChartToolbar } from './ChartToolbar';

const CHART_HEIGHT = 300;

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-[var(--text-muted)]">
      <BarChart2 className="w-10 h-10 opacity-30" />
      <p className="text-sm">No data — run a query or load sample data first</p>
      <p className="text-xs opacity-60">Then pick X and Y fields in the toolbar above</p>
    </div>
  );
}

export function ChartCanvas() {
  const { chartType, xField, yField, colorPalette, toggleFilter } = useChartStore();
  const data = useDerivedChartData();
  const containerRef = useRef<HTMLDivElement>(null);

  // Build chart data from rows
  const chartData = useMemo(() => {
    if (!xField || !yField || !data.length) return [];
    return data.slice(0, 200).map((row) => ({
      x: row[xField] ?? '',
      y: typeof row[yField] === 'number' ? row[yField] : parseFloat(String(row[yField] ?? 0)) || 0,
      _xRaw: String(row[xField] ?? ''),
    }));
  }, [data, xField, yField]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!xField || !data.length) return [];
    const counts: Record<string, number> = {};
    data.slice(0, 200).forEach((row) => {
      const key = String(row[xField] ?? 'null');
      counts[key] = (counts[key] ?? 0) + (yField ? (parseFloat(String(row[yField] ?? 0)) || 0) : 1);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data, xField, yField]);

  const hasData = chartData.length > 0 || pieData.length > 0;
  const color0 = colorPalette[0] ?? '#8b5cf6';

  const handleBarClick = (payload: Record<string, unknown> | null) => {
    if (payload && payload._xRaw) toggleFilter(String(payload._xRaw));
  };

  const handlePieClick = (payload: { name: string } | null) => {
    if (payload?.name) toggleFilter(payload.name);
  };

  return (
    <Panel title="Chart Builder" bodyClassName="flex flex-col">
      <ChartToolbar chartContainerRef={containerRef} />
      <div ref={containerRef} className="p-3">
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={chartData} onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0]?.payload)}>
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="y" fill={color0} isAnimationActive animationDuration={500} cursor="pointer">
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={colorPalette[i % colorPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={chartData}>
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke={color0}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === 'area' && (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke={color0}
                    fill={color0 + '33'}
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'pie' && (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    isAnimationActive
                    animationDuration={500}
                    onClick={(_, __, e) => handlePieClick((e as { payload?: { name: string } })?.payload ?? null)}
                    cursor="pointer"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={colorPalette[i % colorPalette.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {chartType === 'scatter' && (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <ScatterChart>
                  <XAxis dataKey="x" name={xField} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name={yField} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={chartData} fill={color0} isAnimationActive animationDuration={500} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
