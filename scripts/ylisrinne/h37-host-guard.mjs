/**
 * Ylisrinne H37: conservative preflight for declared GLB-world centerlines.
 *
 * IMPORTANT: This is a geometry PRECHECK, NOT a GLB-verified H37 release gate.
 * Host AABBs must describe verified SOLID hosts, never a loose bounding box
 * enclosing an irregular mesh. Centerlines must be independently bound to
 * exact GLB nodes/SHA before a model is accepted. Uncertain = FAIL.
 *
 * Usage: node scripts/ylisrinne/h37-host-guard.mjs path/to/host-input.json
 */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const EPS = 1e-8;
const MAX_STEP_M = 0.02;
const MAX_SAMPLES_PER_EDGE = 200000;
export const MAX_HOST_DISTANCE_M = 0.1;

function point3(value, label) {
  if (!Array.isArray(value) || value.length !== 3 ||
      value.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    throw new Error(`${label} must be three finite metre coordinates`);
  }
  return value;
}

function box(value, label) {
  if (!value || typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error(`${label} requires a nonempty id`);
  }
  const min = point3(value.min, `${label}.min`);
  const max = point3(value.max, `${label}.max`);
  if (min.some((v, i) => v >= max[i])) {
    throw new Error(`${label} requires min strictly below max on every axis`);
  }
  return { id: value.id, min, max };
}

const pointDistance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const interpolate = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Distance to a box's *surface*, not its filled volume. */
export function distanceToBoxSurface(p, b) {
  const outside = p.map((v, i) => Math.max(b.min[i] - v, 0, v - b.max[i]));
  if (outside.some((v) => v > 0)) return Math.hypot(...outside);
  return Math.min(...p.flatMap((v, i) => [v - b.min[i], b.max[i] - v]));
}

/** Exact closed-segment intersection with a closed solid AABB, in t=[0,1]. */
export function boxInterval(a, b, bounds) {
  let start = 0;
  let end = 1;
  for (let i = 0; i < 3; i++) {
    const delta = b[i] - a[i];
    if (Math.abs(delta) < EPS) {
      if (a[i] < bounds.min[i] || a[i] > bounds.max[i]) return null;
      continue;
    }
    const t0 = (bounds.min[i] - a[i]) / delta;
    const t1 = (bounds.max[i] - a[i]) / delta;
    start = Math.max(start, Math.min(t0, t1));
    end = Math.min(end, Math.max(t0, t1));
    if (end + EPS < start) return null;
  }
  return end + EPS < start ? null : [start, end];
}

function coveredBySolid(a, b, solids, requiredInterval = [0, 1]) {
  const overlaps = solids.map((h) => boxInterval(a, b, h)).filter(Boolean)
    .map(([s, e]) => [Math.max(requiredInterval[0], s), Math.min(requiredInterval[1], e)])
    .filter(([s, e]) => e + EPS >= s)
    .sort((x, y) => x[0] - y[0]);
  let cursor = requiredInterval[0];
  for (const [s, e] of overlaps) {
    if (s > cursor + EPS) return false;
    cursor = Math.max(cursor, e);
    if (cursor >= requiredInterval[1] - EPS) return true;
  }
  return cursor >= requiredInterval[1] - EPS;
}

function roomIsTraversed(a, b, room, solids) {
  // A line crossing the open ROOM VOLUME without a solid host is forbidden.
  // Ignore isolated contact at a boundary plane (zero-length interval).
  const interval = boxInterval(a, b, room);
  if (!interval || interval[1] - interval[0] <= EPS) return false;
  // When the whole room-volume section is physically inside certified solid
  // geometry it is not a floating traversal (e.g. an internal wall).
  return !coveredBySolid(a, b, solids, interval);
}

function edgeSurfaceCheck(a, b, hosts, distanceLimitM) {
  const length = pointDistance(a, b);
  if (length <= EPS) return { ok: false, reason: 'ZERO_LENGTH_EDGE' };
  const samples = Math.ceil(length / MAX_STEP_M);
  if (samples > MAX_SAMPLES_PER_EDGE) return { ok: false, reason: 'EDGE_TOO_LONG_TO_VERIFY' };
  let worst = 0;
  for (let i = 0; i <= samples; i++) {
    const p = interpolate(a, b, i / samples);
    const nearest = Math.min(...hosts.map((h) => distanceToBoxSurface(p, h)));
    worst = Math.max(worst, nearest);
    if (nearest > distanceLimitM + EPS) return { ok: false, reason: 'AWAY_FROM_HOST', worstM: nearest };
  }
  // Surface distance is 1-Lipschitz. Worst between samples is at most
  // sampled maximum + half spacing, so failure is conservative.
  const certifiedUpperBoundM = worst + length / (2 * samples);
  if (certifiedUpperBoundM > distanceLimitM + EPS) {
    return { ok: false, reason: 'DISTANCE_NOT_CERTIFIED', worstM: certifiedUpperBoundM };
  }
  return { ok: true, upperBoundM: certifiedUpperBoundM };
}

export function evaluateH37Precheck(input) {
  if (!input || input.coordinateSystem !== 'GLB_WORLD' || input.units !== 'm') {
    throw new Error('Explicit coordinateSystem=GLB_WORLD and units=m required');
  }
  if (!Array.isArray(input.hosts) || !input.hosts.length) {
    throw new Error('At least one verified solid host is required');
  }
  if (!Array.isArray(input.rooms) || !input.rooms.length) {
    throw new Error('At least one room volume is required (no empty-room bypass)');
  }
  if (!Array.isArray(input.segments) || !input.segments.length) {
    throw new Error('At least one segment is required');
  }
  const hosts = input.hosts.map((h, i) => {
    if (h.solidVerified !== true) throw new Error(`hosts[${i}].solidVerified=true required`);
    return box(h, `hosts[${i}]`);
  });
  const rooms = input.rooms.map((r, i) => box(r, `rooms[${i}]`));
  const ids = new Set();
  const results = input.segments.map((s, index) => {
    if (!s || typeof s.id !== 'string' || !s.id.trim() || ids.has(s.id)) {
      throw new Error(`segments[${index}] requires a unique id`);
    }
    ids.add(s.id);
    if (s.kind !== 'pipe' && s.kind !== 'cable') {
      throw new Error(`segments[${index}].kind must be pipe or cable`);
    }
    if (!Array.isArray(s.centerline) || s.centerline.length < 2) {
      throw new Error(`segments[${index}].centerline needs >=2 points`);
    }
    const points = s.centerline.map((p, j) => point3(p, `segments[${index}].centerline[${j}]`));
    const reasons = new Set();
    let maxCertifiedDistanceM = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (pointDistance(a, b) <= EPS) { reasons.add('ZERO_LENGTH_EDGE'); continue; }
      if (s.kind === 'cable') {
        if (!coveredBySolid(a, b, hosts)) reasons.add('CABLE_OUTSIDE_SOLID_HOST');
      } else {
        const dist = edgeSurfaceCheck(a, b, hosts, MAX_HOST_DISTANCE_M);
        if (!dist.ok) reasons.add(dist.reason);
        else maxCertifiedDistanceM = Math.max(maxCertifiedDistanceM, dist.upperBoundM);
      }
      if (rooms.some((room) => roomIsTraversed(a, b, room, hosts))) {
        reasons.add('UNHOSTED_ROOM_TRAVERSAL');
      }
    }
    return { id: s.id, kind: s.kind, ok: reasons.size === 0,
      reasons: [...reasons].sort(), maxCertifiedDistanceM };
  });
  return {
    check: 'H37_GEOMETRY_PRECHECK_ONLY',
    fullGlbVerification: false,
    sourceBinding: 'NOT_VERIFIED',
    status: results.every((r) => r.ok) ? 'PRECHECK_PASS_NOT_RELEASE' : 'FAIL',
    thresholdM: MAX_HOST_DISTANCE_M,
    results,
    limitations: [
      'Inputs are declared, not extracted from a verified GLB',
      'Host solids must be source-verified; an enclosing mesh bounding box is unsafe',
      'V90/V91 source geometry and complete room volumes remain mandatory for H37 release',
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node h37-host-guard.mjs input.json');
    process.exitCode = 2;
  } else {
    try {
      const result = evaluateH37Precheck(JSON.parse(await readFile(path, 'utf8')));
      console.log(JSON.stringify(result, null, 2));
      if (result.status === 'FAIL') process.exitCode = 1;
    } catch (error) {
      console.error(`H37 invalid input: ${error.message}`);
      process.exitCode = 2;
    }
  }
}
