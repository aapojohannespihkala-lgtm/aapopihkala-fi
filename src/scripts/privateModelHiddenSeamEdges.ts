// Presentation-only filter for the unified edge overlay (owner review 17.11,
// item 12). Builder meshes are often separate boxes that touch each other:
// e.g. the K17 low wall is three boxes (V62 long wall, V83 corner fill, V62
// short wall) and the stairwell north face is the 1F wall box under the 2F
// wall box. Their touching faces produce "seam" lines in the middle of what
// looks like one continuous surface. The source GLB is never edited.
//
// Two rules, both per edge contribution of one triangle of one mesh:
//  1. CONTACT: the triangle lies against an opposite-facing coplanar face of
//     another mesh just inside the edge -> the face is hidden, it adds nothing.
//  2. CONTINUED: just outside the edge, the same surface (same plane, same
//     facing, same look) continues in another mesh -> this mesh's lines at
//     that edge are seams; all of this mesh's contributions to the edge drop.
// Only axis-aligned faces are tested; sloped geometry is left unchanged.

export type Vec3 = Readonly<{ x: number; y: number; z: number }>;

const PLANE_EPS = 0.0003; // 0.3 mm plane tolerance
const PROBE = 0.002; // 2 mm probe across/into the edge
const CELL = 0.25; // m, in-plane bucket size
const AXIS_MIN = 0.9999;

type Face = { owner: number; look: string; u0: number; v0: number; u1: number; v1: number; u2: number; v2: number; d: number };

const axisOf = (n: Vec3): [number, number] | null => {
  const c = [n.x, n.y, n.z];
  let axis = 0;
  for (let i = 1; i < 3; i += 1) if (Math.abs(c[i]) > Math.abs(c[axis])) axis = i;
  if (Math.abs(c[axis]) < AXIS_MIN) return null;
  return [axis, c[axis] > 0 ? 1 : -1];
};
const coord = (p: Vec3, i: number) => (i === 0 ? p.x : i === 1 ? p.y : p.z);
const inPlaneAxes = (axis: number): [number, number] => (axis === 0 ? [1, 2] : axis === 1 ? [0, 2] : [0, 1]);

export function createCoplanarFaceIndex() {
  const planes = new Map<number, Map<number, Face[]>>();
  // Numeric keys: plane = slot*1e7 + quantized offset; cell = u*65536 + v (offset to stay positive).
  const planeKey = (axis: number, sign: number, q: number) => (axis * 2 + (sign > 0 ? 1 : 0)) * 1e7 + q;
  const cellKey = (i: number, j: number) => (i + 32768) * 65536 + (j + 32768);
  let faceCount = 0;

  const add = (owner: number, look: string, a: Vec3, b: Vec3, c: Vec3, normal: Vec3) => {
    const ax = axisOf(normal);
    if (!ax) return;
    const [axis, sign] = ax;
    const [u, v] = inPlaneAxes(axis);
    const d = coord(a, axis);
    const face: Face = {
      owner, look, d,
      u0: coord(a, u), v0: coord(a, v), u1: coord(b, u), v1: coord(b, v), u2: coord(c, u), v2: coord(c, v),
    };
    const key = planeKey(axis, sign, Math.round(d / PLANE_EPS));
    let cells = planes.get(key);
    if (!cells) { cells = new Map(); planes.set(key, cells); }
    const minU = Math.floor(Math.min(face.u0, face.u1, face.u2) / CELL);
    const maxU = Math.floor(Math.max(face.u0, face.u1, face.u2) / CELL);
    const minV = Math.floor(Math.min(face.v0, face.v1, face.v2) / CELL);
    const maxV = Math.floor(Math.max(face.v0, face.v1, face.v2) / CELL);
    // Very large faces (floors, ceilings) cover many cells; cap the fan-out.
    if ((maxU - minU + 1) * (maxV - minV + 1) > 4096) return;
    for (let i = minU; i <= maxU; i += 1) {
      for (let j = minV; j <= maxV; j += 1) {
        const ck = cellKey(i, j);
        const list = cells.get(ck);
        if (list) list.push(face); else cells.set(ck, [face]);
      }
    }
    faceCount += 1;
  };

  const inside = (pu: number, pv: number, f: Face) => {
    const s = (au: number, av: number, bu: number, bv: number) => (pu - bu) * (av - bv) - (au - bu) * (pv - bv);
    const d1 = s(f.u0, f.v0, f.u1, f.v1), d2 = s(f.u1, f.v1, f.u2, f.v2), d3 = s(f.u2, f.v2, f.u0, f.v0);
    const neg = d1 < -1e-12 || d2 < -1e-12 || d3 < -1e-12;
    const pos = d1 > 1e-12 || d2 > 1e-12 || d3 > 1e-12;
    return !(neg && pos);
  };

  /** True when another owner's face on (axis, sign) contains the point (pd along axis, pu, pv in plane). */
  const hit = (owner: number, axis: number, sign: number, pd: number, pu: number, pv: number, look: string | null) => {
    const ck = cellKey(Math.floor(pu / CELL), Math.floor(pv / CELL));
    const k0 = Math.round(pd / PLANE_EPS);
    for (let dk = -1; dk <= 1; dk += 1) {
      const list = planes.get(planeKey(axis, sign, k0 + dk))?.get(ck);
      if (!list) continue;
      for (const f of list) {
        if (f.owner === owner || Math.abs(f.d - pd) > PLANE_EPS) continue;
        if (look !== null && f.look !== look) continue;
        if (inside(pu, pv, f)) return true;
      }
    }
    return false;
  };

  return {
    add,
    get faceCount() { return faceCount; },
    /**
     * Classifies one triangle edge. `inward` points from the edge into the
     * triangle (unit, in the triangle plane).
     */
    classify(owner: number, look: string, a: Vec3, b: Vec3, normal: Vec3, inward: Vec3): 'CONTACT' | 'CONTINUED' | null {
      const ax = axisOf(normal);
      if (!ax || planes.size === 0) return null;
      const [axis, sign] = ax;
      const [u, v] = inPlaneAxes(axis);
      const pd = (coord(a, axis) + coord(b, axis)) / 2;
      const mu = (coord(a, u) + coord(b, u)) / 2, mv = (coord(a, v) + coord(b, v)) / 2;
      const iu = coord(inward, u) * PROBE, iv = coord(inward, v) * PROBE;
      if (hit(owner, axis, -sign, pd, mu + iu, mv + iv, null)) return 'CONTACT';
      if (hit(owner, axis, sign, pd, mu - iu, mv - iv, look)) return 'CONTINUED';
      return null;
    },
  };
}

/** Look key: faces of one continuous surface share color, texture and opacity. */
export function surfaceLookKey(material: any): string {
  const m = Array.isArray(material) ? material[0] : material;
  if (!m) return 'none';
  const color = typeof m.color?.getHexString === 'function' ? m.color.getHexString() : '';
  const map = m.map?.source?.uuid ?? m.map?.uuid ?? '';
  return color + '|' + map + '|' + (m.transparent ? Number(m.opacity ?? 1).toFixed(2) : '1');
}
