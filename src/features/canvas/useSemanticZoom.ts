import { useViewport } from '@xyflow/react';

// Returns the current semantic zoom level
export type ZoomLevel = 'detail' | 'normal' | 'overview';

export function useSemanticZoom(): ZoomLevel {
  const { zoom } = useViewport();
  if (zoom < 0.4) return 'overview';
  if (zoom < 0.75) return 'normal';
  return 'detail';
}

// A hook that tracks viewport and exposes pan/zoom state
export function useCanvasViewport() {
  const { x, y, zoom } = useViewport();
  return {
    zoom,
    pan: { x, y },
    zoomLevel: zoom < 0.4 ? 'overview' : zoom < 0.75 ? 'normal' : 'detail',
    isOverview: zoom < 0.4,
    isDetail: zoom >= 0.75,
  };
}
