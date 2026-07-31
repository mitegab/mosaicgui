export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Checks whether a straight line from (x1,y1) to (x2,y2) passes
 * through the padded bounding box of the given obstacle.
 */
function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rect,
  padding = 24,
): boolean {
  const left = rect.x - padding;
  const right = rect.x + (rect.width ?? 208) + padding;
  const top = rect.y - padding;
  const bottom = rect.y + (rect.height ?? 80) + padding;

  // Clamp-based intersection test (Liang–Barsky simplified)
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;

  const checks = [
    [-dx, -(left - x1)],
    [dx, right - x1],
    [-dy, -(top - y1)],
    [dy, bottom - y1],
  ] as [number, number][];

  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) tMin = Math.max(tMin, t);
      else tMax = Math.min(tMax, t);
    }
    if (tMin > tMax) return false;
  }
  return true;
}

/**
 * Detect which nodes are obstacles (neither source nor target).
 */
export function detectObstacles(
  sourceId: string,
  targetId: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number }>,
): Rect[] {
  return nodes
    .filter((n) => n.id !== sourceId && n.id !== targetId)
    .map((n) => ({
      x: n.position.x,
      y: n.position.y,
      width: n.width ?? 208,
      height: n.height ?? 80,
    }));
}

/**
 * Compute an SVG path that avoids obstacles.
 * Falls back to a standard cubic bezier when no obstacle is hit.
 */
export function computeSmartPath(
  source: Rect,
  target: Rect,
  obstacles: Rect[],
): string {
  const sx = source.x + (source.width ?? 208);
  const sy = source.y + (source.height ?? 80) / 2;
  const tx = target.x;
  const ty = target.y + (target.height ?? 80) / 2;

  const directBlocked = obstacles.some((obs) =>
    lineIntersectsRect(sx, sy, tx, ty, obs),
  );

  if (!directBlocked) {
    // Standard bezier
    const cx = (sx + tx) / 2;
    return `M ${sx} ${sy} C ${cx} ${sy} ${cx} ${ty} ${tx} ${ty}`;
  }

  // Route around: go up by the tallest obstacle, then across
  const clearanceY = Math.min(
    ...obstacles.map((o) => o.y - 40),
    sy - 80,
    ty - 80,
  );

  return [
    `M ${sx} ${sy}`,
    `C ${sx + 60} ${sy} ${sx + 60} ${clearanceY} ${(sx + tx) / 2} ${clearanceY}`,
    `C ${(sx + tx) / 2 + 40} ${clearanceY} ${tx - 60} ${clearanceY} ${tx} ${ty}`,
  ].join(' ');
}
