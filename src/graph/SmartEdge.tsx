import { memo } from 'react';
import { EdgeLabelRenderer, EdgeProps, useReactFlow } from '@xyflow/react';
import { computeSmartPath, detectObstacles } from './edgeRouter';

function SmartEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
  selected,
  markerEnd,
}: EdgeProps) {
  const { getNodes, deleteElements } = useReactFlow();
  const nodes = getNodes();

  const obstacles = detectObstacles(source, target, nodes);

  const sourceRect = { x: sourceX - 4, y: sourceY - 40, width: 8, height: 80 };
  const targetRect = { x: targetX - 4, y: targetY - 40, width: 8, height: 80 };

  let pathD: string;
  try {
    pathD = computeSmartPath(sourceRect, targetRect, obstacles);
  } catch {
    // Fallback to simple straight bezier
    const cx = (sourceX + targetX) / 2;
    pathD = `M ${sourceX} ${sourceY} C ${cx} ${sourceY} ${cx} ${targetY} ${targetX} ${targetY}`;
  }

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const strokeColor = selected ? '#c4b5fd' : '#7c3aed';

  return (
    <>
      {/* Invisible wider hit area */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="nopan"
      />
      {/* Visible edge */}
      <path
        id={id}
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 2.5 : 1.8}
        strokeDasharray={selected ? undefined : undefined}
        markerEnd={markerEnd}
        style={{
          filter: selected ? 'drop-shadow(0 0 5px #a78bfa)' : undefined,
          transition: 'stroke 0.15s',
        }}
      />

      {/* Delete button when selected */}
      {selected && (
        <EdgeLabelRenderer>
          <button
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex h-5 w-5 items-center justify-center rounded-full border border-rose-400/50 bg-surface-900 text-[10px] text-rose-300 shadow transition hover:bg-rose-900"
            onClick={() => deleteElements({ edges: [{ id }] })}
            aria-label="Remove edge"
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const SmartEdge = memo(SmartEdgeComponent);
