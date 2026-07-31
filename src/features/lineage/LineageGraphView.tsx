import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useSchemaStore } from '../../store/schemaStore';
import { useExecutionStore } from '../../store/executionStore';
import { buildQueryLineage, type LineageEdge, type LineageNode } from './buildLineageGraph';
import { cn } from '../../utils/cn';

const SIZE = 560;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 220;
const INNER_RADIUS = 110;

interface PositionedNode extends LineageNode {
  x: number;
  y: number;
}

function ringPositions(count: number, radius: number): { x: number; y: number }[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
  });
}

function curvePath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  // Pull the control point toward the canvas center so lines curve inward.
  const ctrlX = midX + (CENTER - midX) * 0.35;
  const ctrlY = midY + (CENTER - midY) * 0.35;
  return `M ${a.x} ${a.y} Q ${ctrlX} ${ctrlY} ${b.x} ${b.y}`;
}

export function LineageGraphView() {
  const models = useSchemaStore((state) => state.models);
  const history = useExecutionStore((state) => state.history);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const graph = useMemo(() => buildQueryLineage(history, models), [history, models]);

  const positioned = useMemo<PositionedNode[]>(() => {
    const modelNodes = graph.nodes.filter((n) => n.type === 'model');
    const queryNodes = graph.nodes.filter((n) => n.type === 'query');
    const outerPositions = ringPositions(modelNodes.length, OUTER_RADIUS);
    const innerPositions = ringPositions(queryNodes.length, INNER_RADIUS);
    return [
      ...modelNodes.map((node, i) => ({ ...node, ...outerPositions[i] })),
      ...queryNodes.map((node, i) => ({ ...node, ...innerPositions[i] })),
    ];
  }, [graph.nodes]);

  const nodeById = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const visibleNodeIds = useMemo(() => {
    if (!selectedModelId) return null;
    const neighbors = new Set<string>([selectedModelId]);
    for (const edge of graph.edges) {
      if (edge.source === selectedModelId) neighbors.add(edge.target);
      if (edge.target === selectedModelId) neighbors.add(edge.source);
    }
    return neighbors;
  }, [selectedModelId, graph.edges]);

  const visibleEdges = useMemo(() => {
    if (!visibleNodeIds) return graph.edges;
    return graph.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [graph.edges, visibleNodeIds]);

  const visibleNodes = useMemo(() => {
    if (!visibleNodeIds) return positioned;
    return positioned.filter((node) => visibleNodeIds.has(node.id));
  }, [positioned, visibleNodeIds]);

  const isEdgeHighlighted = (edge: LineageEdge) =>
    hoveredId !== null && (edge.source === hoveredId || edge.target === hoveredId);
  const isEdgeDimmed = (edge: LineageEdge) =>
    hoveredId !== null && edge.source !== hoveredId && edge.target !== hoveredId;

  if (models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-[var(--text-muted)]">
        Load a schema to visualize lineage.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {selectedModelId && (
        <button
          type="button"
          onClick={() => setSelectedModelId(null)}
          className="self-start flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:underline"
        >
          <RotateCcw size={12} />
          Reset view
        </button>
      )}
      <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-h-[560px]">
        <g>
          {visibleEdges.map((edge, i) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            const highlighted = isEdgeHighlighted(edge);
            const dimmed = isEdgeDimmed(edge);
            return (
              <path
                key={`${edge.source}-${edge.target}-${i}`}
                d={curvePath(source, target)}
                fill="none"
                stroke={source.type === 'query' || target.type === 'query' ? '#c084fc' : '#22d3ee'}
                strokeWidth={highlighted ? 2.5 : 1.2}
                opacity={dimmed ? 0.12 : highlighted ? 0.9 : 0.35}
                className="transition-all duration-150"
              />
            );
          })}
        </g>

        {visibleNodes.map((node, i) => {
          const isModel = node.type === 'model';
          const dimmed = hoveredId !== null && hoveredId !== node.id && !graph.edges.some(
            (e) => (e.source === hoveredId && e.target === node.id) || (e.target === hoveredId && e.source === node.id),
          );
          const width = isModel ? 96 : 88;
          const height = 30;
          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: dimmed ? 0.35 : 1, scale: 1 }}
              transition={{ delay: i * 0.025, duration: 0.25 }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => isModel && setSelectedModelId((current) => (current === node.id ? null : node.id))}
              className={cn(isModel && 'cursor-pointer')}
            >
              <rect
                x={node.x - width / 2}
                y={node.y - height / 2}
                width={width}
                height={height}
                rx={isModel ? 8 : height / 2}
                fill={isModel ? 'rgba(34,211,238,0.16)' : 'rgba(192,132,252,0.16)'}
                stroke={isModel ? '#22d3ee' : '#c084fc'}
                strokeWidth={selectedModelId === node.id ? 2.5 : 1.25}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={isModel ? 600 : 500}
                fill="var(--text-primary)"
              >
                {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Cyan = models · Purple = recent queries · Hover to trace connections, click a model to isolate it.
      </p>
    </div>
  );
}

export default LineageGraphView;
