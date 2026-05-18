import React, { useRef } from 'react';
import { BarChart2, LineChart, PieChart, ScatterChart, AreaChart, Download, Image } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { useExecutionStore } from '../../store/executionStore';
import { useChartStore, PALETTES, ChartType } from './useChartStore';

const CHART_TYPES: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: 'bar', icon: <BarChart2 className="w-4 h-4" />, label: 'Bar' },
  { type: 'line', icon: <LineChart className="w-4 h-4" />, label: 'Line' },
  { type: 'pie', icon: <PieChart className="w-4 h-4" />, label: 'Pie' },
  { type: 'scatter', icon: <ScatterChart className="w-4 h-4" />, label: 'Scatter' },
  { type: 'area', icon: <AreaChart className="w-4 h-4" />, label: 'Area' },
];

interface ChartToolbarProps {
  chartContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChartToolbar({ chartContainerRef }: ChartToolbarProps) {
  const rows = useExecutionStore((s) => s.rows);
  const { chartType, xField, yField, groupField, colorPalette, setChartType, setXField, setYField, setGroupField, setColorPalette } =
    useChartStore();

  const columns = rows.length ? Object.keys(rows[0]) : [];

  // ─── Export helpers ────────────────────────────────────────────

  const exportAsSvg = () => {
    const container = chartContainerRef?.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPng = () => {
    const container = chartContainerRef?.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const { width, height } = svg.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#1e1e2e'; // dark bg
    ctx.fillRect(0, 0, width, height);

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const img = new window.Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const pngUrl = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'chart.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = url;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
      {/* Chart type selector */}
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5 bg-[var(--bg-sidebar)]">
        {CHART_TYPES.map(({ type, icon, label }) => (
          <button
            key={type}
            title={label}
            onClick={() => setChartType(type)}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
              chartType === type
                ? 'bg-[var(--brand)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
            )}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Field selectors */}
      {columns.length > 0 && (
        <>
          <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            X
            <select
              value={xField}
              onChange={(e) => setXField(e.target.value)}
              className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="">— none —</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            Y
            <select
              value={yField}
              onChange={(e) => setYField(e.target.value)}
              className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="">— none —</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            Group
            <select
              value={groupField ?? ''}
              onChange={(e) => setGroupField(e.target.value || null)}
              className="h-7 px-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-panel)] text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="">— none —</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </>
      )}

      {/* Palette picker */}
      <div className="flex items-center gap-1">
        {PALETTES.map((palette, pi) => (
          <button
            key={pi}
            title={`Palette ${pi + 1}`}
            onClick={() => setColorPalette(palette)}
            className={cn(
              'flex gap-0.5 p-0.5 rounded border transition-colors',
              JSON.stringify(palette) === JSON.stringify(colorPalette)
                ? 'border-[var(--brand)]'
                : 'border-transparent hover:border-[var(--border)]',
            )}
          >
            {palette.slice(0, 3).map((color) => (
              <span key={color} className="w-2.5 h-4 rounded-sm" style={{ backgroundColor: color }} />
            ))}
          </button>
        ))}
      </div>

      {/* Export buttons */}
      <div className="ml-auto flex items-center gap-1.5">
        <Button size="xs" variant="ghost" onClick={exportAsSvg} title="Export as SVG">
          <Download className="w-3 h-3" /> SVG
        </Button>
        <Button size="xs" variant="ghost" onClick={exportAsPng} title="Export as PNG">
          <Image className="w-3 h-3" /> PNG
        </Button>
      </div>
    </div>
  );
}
