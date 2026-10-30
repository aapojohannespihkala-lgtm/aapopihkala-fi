// C80-044: conservative, presentation-only suppression for split coplanar mesh seams.
// Only the HI20 2F/BOTH viewer opt-in calls this helper. Source GLB is never edited.
export type BoundaryPoint = Readonly<{ x: number; y: number; z: number }>;
export type CoplanarBoundaryEdge = Readonly<{
  a: BoundaryPoint;
  b: BoundaryPoint;
  normal: BoundaryPoint;
}>;

type AxisEdge = {
  id: number;
  start: number;
  end: number;
  normal: BoundaryPoint;
  inward: BoundaryPoint;
};

const SCALE = 10000; // 0.1 mm, consistent with the viewer world-vertex key.
const EPS = 1.5 / SCALE;

const dot = (a: BoundaryPoint, b: BoundaryPoint) =>
  a.x * b.x + a.y * b.y + a.z * b.z;

const unit = (p: BoundaryPoint): BoundaryPoint | null => {
  const length = Math.hypot(p.x, p.y, p.z);
  return length > 1e-12
    ? { x: p.x / length, y: p.y / length, z: p.z / length }
    : null;
};

function axisEdge(edge: CoplanarBoundaryEdge, id: number): [string, AxisEdge] | null {
  const a = [edge.a.x, edge.a.y, edge.a.z];
  const b = [edge.b.x, edge.b.y, edge.b.z];
  const delta = a.map((value, index) => b[index] - value);
  const axis = delta.reduce((best, value, index) =>
    Math.abs(value) > Math.abs(delta[best]) ? index : best, 0);
  if (Math.abs(delta[axis]) <= EPS) return null;
  if (delta.some((value, index) => index !== axis && Math.abs(value) > EPS)) {
    return null; // Sloped/non-axis geometry is deliberately unchanged.
  }
  const direction = unit({
    x: delta[0], y: delta[1], z: delta[2],
  });
  const normal = unit(edge.normal);
  if (!direction || !normal) return null;
  // Triangle winding determines which side of a boundary has the face.
  const inward = unit({
    x: normal.y * direction.z - normal.z * direction.y,
    y: normal.z * direction.x - normal.x * direction.z,
    z: normal.x * direction.y - normal.y * direction.x,
  });
  if (!inward) return null;
  const fixed = [0, 1, 2]
    .filter((index) => index !== axis)
    .map((index) => Math.round((a[index] + b[index]) * SCALE / 2));
  return [
    axis + ':' + fixed.join(':'),
    { id, start: Math.min(a[axis], b[axis]), end: Math.max(a[axis], b[axis]), normal, inward },
  ];
}

/**
 * Returns the indices of boundary edges that are completely covered by
 * oppositely-sided, near-coplanar collinear boundary edges, including a
 * long edge covered by two shorter T-junction edges.
 *
 * Never suppresses a partially covered boundary, an actual corner, a
 * genuinely exposed opening edge or non-axis-aligned geometry.
 */
export function findCoplanarTJunctionBoundaryIndexes(
  boundaries: readonly CoplanarBoundaryEdge[],
  creaseAngleDegrees = 8,
): Set<number> {
  const creaseCos = Math.cos(creaseAngleDegrees * Math.PI / 180);
  const byLine = new Map<string, AxisEdge[]>();
  for (let i = 0; i < boundaries.length; i += 1) {
    const record = axisEdge(boundaries[i], i);
    if (!record) continue;
    const [key, segment] = record;
    const group = byLine.get(key) ?? [];
    group.push(segment);
    byLine.set(key, group);
  }

  const suppressed = new Set<number>();
  for (const group of byLine.values()) {
    if (group.length < 2 || group.length > 256) continue;
    for (const edge of group) {
      const opposite = group.filter((other) =>
        other.id !== edge.id &&
        Math.abs(dot(edge.normal, other.normal)) >= creaseCos &&
        dot(edge.inward, other.inward) <= -creaseCos,
      ).sort((a, b) => a.start - b.start);

      let covered = edge.start;
      for (const other of opposite) {
        if (other.start > covered + EPS) break;
        if (other.end > covered) covered = other.end;
        if (covered >= edge.end - EPS) {
          suppressed.add(edge.id);
          break;
        }
      }
    }
  }
  return suppressed;
}
