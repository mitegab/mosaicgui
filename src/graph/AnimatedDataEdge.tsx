import { memo, useId } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { useExecutionStore } from '../store/executionStore';

function AnimatedDataEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const uid = useId().replace(/:/g, '');
  const isRunning = useExecutionStore((state) => state.isRunning);
  const { deleteElements } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeColor = selected ? '#c4b5fd' : '#a78bfa';
  const glowFilter = selected ? `drop-shadow(0 0 6px #a78bfa)` : undefined;

  return (
    <>
      <defs>
        {/* Reusable path for animateMotion */}
        <path id={`edge-path-${uid}`} d={edgePath} fill="none" />
      </defs>

      {/* Base edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2.5 : 1.8,
          filter: glowFilter,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Animated particles when query is running */}
      {isRunning && (
        <g>
          {[0, 0.4, 0.8].map((delay, i) => (
            <circle key={i} r={3.5} fill="#a78bfa" opacity={0.9}>
              <animateMotion
                dur="1.6s"
                repeatCount="indefinite"
                begin={`${delay}s`}
              >
                <mpath href={`#edge-path-${uid}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur="1.6s"
                repeatCount="indefinite"
                begin={`${delay}s`}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Delete button on select */}
      {selected && (
        <EdgeLabelRenderer>
          <button
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
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

export const AnimatedDataEdge = memo(AnimatedDataEdgeComponent);
