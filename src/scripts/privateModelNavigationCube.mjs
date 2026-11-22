/**
 * Navigation cube for the Ylisrinne orientation gizmo (owner request 22.11.2026).
 * The cube turns with the active camera. Owner decision 22.11.2026 (SOL-CLAUDE-
 * NAVCUBE-17): every face carries a print in the face plane, foreshortened with
 * the face: a sun (circle + eight short rays) on top, 17 open rings on the
 * bottom, N/S/E/W letters on the compass faces. Air/Earth glyphs are retired.
 * In map mode (EPSG:3879, ETRS-GK25) the side faces follow map north instead of
 * the building's YLIS-G1 +Y. The cube never moves the camera or the model; a
 * click on it only switches the north frame (existing toggle button).
 * Visual-only, WORK_TEST; no current/as-built assertion.
 */
import { northWorldDirection } from './privateModelNavigationNorthFrameToggle.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const NAV_CUBE_CENTER = 46;
export const NAV_CUBE_HALF = 15;
const VISIBLE_MIN = 0.02;
const LABEL_MIN = 0.3;
const PRINT_MIN = 0.12;
export const NAV_CUBE_PRINT_COLOR = '#e8eff2';

const finite = (value) => typeof value === 'number' && Number.isFinite(value);

function inverseRotate(v, q) {
  const x = -q.x, y = -q.y, z = -q.z, w = q.w;
  const ix = w * v.x + y * v.z - z * v.y;
  const iy = w * v.y + z * v.x - x * v.z;
  const iz = w * v.z + x * v.y - y * v.x;
  const iw = -x * v.x - y * v.y - z * v.z;
  return {
    x: ix * w + iw * -x + iy * -z - iz * -y,
    y: iy * w + iw * -y + iz * -x - ix * -z,
    z: iz * w + iw * -z + ix * -y - iy * -x,
  };
}

/** World (THREE, Y up) basis of the cube for 'local' or 'map' north. */
export function navCubeBasis(frame) {
  const n = northWorldDirection(frame);
  const north = { x: n.x, y: 0, z: n.z };
  // east = north x up (right-handed, Y up)
  const east = { x: -north.z, y: 0, z: north.x };
  const up = { x: 0, y: 1, z: 0 };
  return { north, east, up };
}

const scale = (v, k) => ({ x: v.x * k, y: v.y * k, z: v.z * k });
const add = (...vs) => vs.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y, z: a.z + v.z }), { x: 0, y: 0, z: 0 });

/**
 * Pure projection: returns the faces turned toward the camera, back to front,
 * each with its 2D polygon (SVG units), label point and facing (0..1).
 */
export function projectNavCube(quaternion, frame = 'local') {
  if (!quaternion || !['x', 'y', 'z', 'w'].every((k) => finite(quaternion[k]))) {
    throw new Error('YLIS_NAV_CUBE: finite camera quaternion required');
  }
  const { north, east, up } = navCubeBasis(frame);
  const s = NAV_CUBE_HALF;
  // `u` is the print's up direction on the face seen from outside.
  const faces = [
    { key: 'top', label: 'YLÄ', n: up, a: east, b: north, u: north },
    { key: 'bottom', label: 'ALA', n: scale(up, -1), a: east, b: north, u: north },
    { key: 'north', label: 'N', n: north, a: east, b: up, u: up },
    { key: 'south', label: 'S', n: scale(north, -1), a: east, b: up, u: up },
    { key: 'east', label: 'E', n: east, a: north, b: up, u: up },
    { key: 'west', label: 'W', n: scale(east, -1), a: north, b: up, u: up },
  ];
  const cross = (p, q) => ({ x: p.y * q.z - p.z * q.y, y: p.z * q.x - p.x * q.z, z: p.x * q.y - p.y * q.x });
  const toScreen = (p) => {
    const v = inverseRotate(p, quaternion);
    return { x: NAV_CUBE_CENTER + v.x, y: NAV_CUBE_CENTER - v.y };
  };
  const out = [];
  for (const f of faces) {
    const facing = inverseRotate(f.n, quaternion).z;
    if (facing <= VISIBLE_MIN) continue;
    const c = scale(f.n, s);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) =>
      toScreen(add(c, scale(f.a, i * s), scale(f.b, j * s))));
    // Face-plane print frame: x to the right and y downward as seen from
    // outside the face, in units of half an edge (SVG matrix a b c d e f).
    const center = toScreen(c);
    const right = cross(f.u, f.n);
    const r = toScreen(add(c, scale(right, s)));
    const d = toScreen(add(c, scale(f.u, -s)));
    const matrix = [r.x - center.x, r.y - center.y, d.x - center.x, d.y - center.y, center.x, center.y];
    out.push(Object.freeze({
      key: f.key,
      label: f.label,
      facing: Math.min(1, facing),
      points: corners.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      center,
      matrix: Object.freeze(matrix),
      showLabel: facing >= LABEL_MIN,
    }));
  }
  out.sort((p, q) => p.facing - q.facing);
  return Object.freeze(out);
}

/** Project the complete cube silhouette, including faces seen edge-on. */
export function projectNavCubeSilhouette(quaternion, frame = 'local') {
  // Keep the same input checks as the rendered faces.
  projectNavCube(quaternion, frame);
  const { north, east, up } = navCubeBasis(frame);
  const points = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const world = add(scale(east, x * NAV_CUBE_HALF),
      scale(north, y * NAV_CUBE_HALF), scale(up, z * NAV_CUBE_HALF));
    const v = inverseRotate(world, quaternion);
    points.push({ x: NAV_CUBE_CENTER + v.x, y: NAV_CUBE_CENTER - v.y });
  }
  const unique = [...new Map(points.map(p =>
    [p.x.toFixed(7) + ',' + p.y.toFixed(7), p])).values()]
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [], upper = [];
  for (const p of unique) {
    while (lower.length >= 2 &&
        cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = unique.length - 1; i >= 0; i--) {
    const p = unique[i];
    while (upper.length >= 2 &&
        cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return Object.freeze([...lower.slice(0, -1), ...upper.slice(0, -1)]
    .map(p => Object.freeze(p)));
}

const normalized2d = (x, y) => {
  const n = Math.hypot(x, y);
  return n > 1e-8 ? { x: x / n, y: y / n } : null;
};

/** Positive outside value = distance from convex silhouette, negative = inside. */
function signedSilhouetteClearance(point, hull) {
  if (hull.length < 3) return -Infinity;
  let inside = true;
  let distance = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    if (dx * (point.y - a.y) - dy * (point.x - a.x) < -1e-7) inside = false;
    const t = Math.max(0, Math.min(1,
      ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(dx * dx + dy * dy, 1e-10)));
    distance = Math.min(distance, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return inside ? -distance : distance;
}

/**
 * Place the entire 7px letter with its outline outside the actual projected
 * cube, preferably beyond the positive arrow tip. The normal/radial fallback
 * avoids putting an axis name on a face when the tip is inside the silhouette.
 * No camera/model transforms are changed.
 */
function outsideAxisLabel(tip, axisDirection, hull, placed) {
  const radial = normalized2d(tip.x - NAV_CUBE_CENTER, tip.y - NAV_CUBE_CENTER);
  const d = axisDirection;
  const directions = [
    { unit: d, from: 5, to: 24 },
    { unit: radial && normalized2d(d.x + radial.x * 0.7, d.y + radial.y * 0.7), from: 5, to: 34 },
    { unit: radial, from: 5, to: 34 },
    { unit: normalized2d(-d.y, d.x), from: 5, to: 36 },
    { unit: normalized2d(d.y, -d.x), from: 5, to: 36 },
    { unit: d, from: 25, to: 56 },
  ];
  const safe = point =>
    point.x >= 8 && point.x <= 84 && point.y >= 8 && point.y <= 84 &&
    signedSilhouetteClearance(point, hull) >= 6.25 &&
    placed.every(p => Math.hypot(p.x - point.x, p.y - point.y) >= 11);
  for (const { unit, from, to } of directions) {
    if (!unit) continue;
    for (let distance = from; distance <= to; distance += 1) {
      const p = { x: tip.x + unit.x * distance, y: tip.y + unit.y * distance };
      if (safe(p)) return p;
    }
  }
  // A 36px ring is outside even the most oblique 30px cube silhouette.
  // Keep fallback letters within the 92px SVG viewport and apart.
  for (let i = 0; i < 144; i++) {
    const theta = (i * Math.PI) / 72;
    const p = { x: NAV_CUBE_CENTER + 36 * Math.cos(theta),
      y: NAV_CUBE_CENTER + 36 * Math.sin(theta) };
    if (safe(p)) return p;
  }
  throw new Error('YLIS_NAV_CUBE: no collision-free external axis label');
}

/**
 * Three positive coordinate-frame axes drawn along actual visible cube edges.
 * Each arrow spans a full edge: the two fixed coordinates select the camera-
 * facing faces, while the selected coordinate runs from -half to +half.
 * Map X/Y follow EPSG:3879 east/north, local X/Y follow YLIS-G1; Z is up.
 * End-on projected edges are omitted instead of showing a false direction.
 */
export function projectNavCubeEdgeAxes(quaternion, frame = 'local') {
  // Use the same finite quaternion / known-frame contract as the face renderer.
  projectNavCube(quaternion, frame);
  const { north, east, up } = navCubeBasis(frame);
  const axes = [{ key: 'x', world: east }, { key: 'y', world: north }, { key: 'z', world: up }];
  const facing = axes.map(({ world }) =>
    inverseRotate(world, quaternion).z >= 0 ? 1 : -1);
  const screen = (point) => {
    const v = inverseRotate(point, quaternion);
    return { x: NAV_CUBE_CENTER + v.x, y: NAV_CUBE_CENTER - v.y };
  };
  const out = [];
  const silhouette = projectNavCubeSilhouette(quaternion, frame);
  const placedLabels = [];
  for (let axis = 0; axis < axes.length; axis++) {
    const edgePoint = (sign) => screen(add(...axes.map(({ world }, i) =>
      scale(world, NAV_CUBE_HALF * (i === axis ? sign : facing[i])))));
    const start = edgePoint(-1), end = edgePoint(1);
    const dx = end.x - start.x, dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 2.5) continue;
    const ux = dx / length, uy = dy / length;
    const base = { x: end.x - ux * 3.4, y: end.y - uy * 3.4 };
    const normal = { x: -uy * 1.8, y: ux * 1.8 };
    const head = [end, { x: base.x + normal.x, y: base.y + normal.y },
      { x: base.x - normal.x, y: base.y - normal.y }];
    // The arrowhead remains at the +axis endpoint. Only the text travels
    // beyond the silhouette (or to a nearby exterior side if necessary).
    const label = outsideAxisLabel(end, { x: ux, y: uy }, silhouette, placedLabels);
    placedLabels.push(label);
    out.push(Object.freeze({ key: axes[axis].key, start, end,
      lineEnd: { x: base.x - ux * 0.6, y: base.y - uy * 0.6 },
      head: head.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      label, length, frame }));
  }
  return Object.freeze(out);
}
/** Sun on top: circle and eight short rays (face units, half an edge = 1). */
export const NAV_CUBE_SUN = Object.freeze({ r: 0.2, rayFrom: 0.31, rayTo: 0.47, stroke: 0.057 });
/** Bottom: 17 open rings in five interleaved rows (owner decision 22.11.2026). */
export const NAV_CUBE_GROUND_RINGS = Object.freeze([-0.42, -0.21, 0, 0.21, 0.42].flatMap((y, row) =>
  (row % 2 === 0 ? [-0.27, 0, 0.27] : [-0.40, -0.135, 0.135, 0.40]).map((x) => Object.freeze({ x, y }))));
export const NAV_CUBE_RING = Object.freeze({ r: 0.06, stroke: 0.057 });

/**
 * Print description for a projected face: 'sun', 'rings' or 'letter', with the
 * SVG transform that maps face units into the gizmo. Null when nearly edge-on.
 */
export function navCubeFacePrint(face) {
  if (!face || !Array.isArray(face.matrix) || face.matrix.length !== 6 ||
      !face.matrix.every(finite) || !finite(face.facing) || face.facing < PRINT_MIN) return null;
  const kind = face.key === 'top' ? 'sun' : face.key === 'bottom' ? 'rings' : 'letter';
  return Object.freeze({
    kind,
    text: kind === 'letter' ? face.label : null,
    transform: `matrix(${face.matrix.map((n) => n.toFixed(4)).join(' ')})`,
    opacity: Math.min(1, (face.facing - PRINT_MIN) * 2.2),
  });
}

/** Mount the cube behind the existing axes in the gizmo SVG. */
export function mountNavigationCube({ svg, root }) {
  const doc = svg?.ownerDocument;
  if (!doc?.createElementNS || !svg.insertBefore) throw new Error('YLIS_NAV_CUBE: svg required');
  const group = doc.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'nav-cube');
  group.dataset.navCube = 'faces';
  svg.insertBefore(group, svg.firstChild);
  // A-version replaces the old center-origin rays with positive X/Y/Z
  // arrows on actual cube edges. Keep legacy SVG IDs/geometry available for
  // existing navigator contracts and the optional north-frame overlay.
  for (const old of svg.querySelectorAll?.(
    '.orientation-axis, .orientation-axis-tip, .orientation-axis-label, .orientation-origin') ?? []) {
    old.style.opacity = '0';
  }
  const edgeArrows = doc.createElementNS(SVG_NS, 'g');
  edgeArrows.setAttribute('class', 'nav-cube-edge-axes');
  const arrowSlots = new Map();
  const arrowColors = { x: '#e99a9a', y: '#9cd4ab', z: '#95c3e1' };
  for (const key of ['x', 'y', 'z']) {
    const line = doc.createElementNS(SVG_NS, 'line');
    line.setAttribute('data-cube-edge-axis', key);
    line.setAttribute('stroke', arrowColors[key]);
    line.setAttribute('stroke-width', '1.6');
    line.setAttribute('stroke-linecap', 'round');
    const head = doc.createElementNS(SVG_NS, 'polygon');
    head.setAttribute('data-cube-edge-head', key);
    head.setAttribute('fill', arrowColors[key]);
    const label = doc.createElementNS(SVG_NS, 'text');
    label.setAttribute('data-cube-edge-label', key);
    label.setAttribute('fill', arrowColors[key]);
    label.setAttribute('stroke', '#27333d');
    label.setAttribute('stroke-width', '1.25');
    label.setAttribute('paint-order', 'stroke');
    label.setAttribute('font-size', '7');
    label.setAttribute('font-weight', '800');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.style.pointerEvents = 'none';
    label.textContent = key.toUpperCase();
    arrowSlots.set(key, { line, head, label });
  }
  // Face prints, built once in face units; only their transforms change.
  const prints = new Map();
  const ink = (el) => {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', NAV_CUBE_PRINT_COLOR);
    el.setAttribute('stroke-linecap', 'round');
    return el;
  };
  {
    const sun = doc.createElementNS(SVG_NS, 'g');
    sun.setAttribute('data-cube-print', 'sun');
    sun.setAttribute('stroke-width', String(NAV_CUBE_SUN.stroke));
    const disc = ink(doc.createElementNS(SVG_NS, 'circle'));
    disc.setAttribute('r', String(NAV_CUBE_SUN.r));
    sun.append(disc);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const ray = ink(doc.createElementNS(SVG_NS, 'line'));
      ray.setAttribute('x1', (Math.cos(angle) * NAV_CUBE_SUN.rayFrom).toFixed(4));
      ray.setAttribute('y1', (Math.sin(angle) * NAV_CUBE_SUN.rayFrom).toFixed(4));
      ray.setAttribute('x2', (Math.cos(angle) * NAV_CUBE_SUN.rayTo).toFixed(4));
      ray.setAttribute('y2', (Math.sin(angle) * NAV_CUBE_SUN.rayTo).toFixed(4));
      sun.append(ray);
    }
    prints.set('top', sun);
    const rings = doc.createElementNS(SVG_NS, 'g');
    rings.setAttribute('data-cube-print', 'rings');
    rings.setAttribute('stroke-width', String(NAV_CUBE_RING.stroke));
    for (const { x, y } of NAV_CUBE_GROUND_RINGS) {
      const ring = ink(doc.createElementNS(SVG_NS, 'circle'));
      ring.setAttribute('cx', String(x));
      ring.setAttribute('cy', String(y));
      ring.setAttribute('r', String(NAV_CUBE_RING.r));
      rings.append(ring);
    }
    prints.set('bottom', rings);
    for (const key of ['north', 'south', 'east', 'west']) {
      const letter = doc.createElementNS(SVG_NS, 'text');
      letter.setAttribute('data-cube-print', 'letter');
      letter.setAttribute('class', 'nav-cube-label');
      letter.dataset.face = key;
      letter.setAttribute('x', '0');
      letter.setAttribute('y', '0.04');
      letter.setAttribute('font-size', '0.78');
      letter.setAttribute('font-weight', '800');
      letter.setAttribute('text-anchor', 'middle');
      letter.setAttribute('dominant-baseline', 'central');
      letter.setAttribute('fill', NAV_CUBE_PRINT_COLOR);
      letter.style.pointerEvents = 'none';
      prints.set(key, letter);
    }
  }
  const slots = new Map();
  for (const key of ['top', 'bottom', 'north', 'south', 'east', 'west']) {
    const poly = doc.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('class', `nav-cube-face nav-cube-face-${key}`);
    poly.dataset.face = key;
    slots.set(key, { poly });
  }
  let signature = '';
  const render = (quaternion, frame = 'local') => {
    const next = `${frame}|${['x', 'y', 'z', 'w'].map((k) => Number(quaternion?.[k]).toFixed(5)).join('|')}`;
    if (next === signature) return false;
    const faces = projectNavCube(quaternion, frame);
    signature = next;
    group.replaceChildren();
    const printed = [];
    for (const face of faces) {
      const { poly } = slots.get(face.key);
      poly.setAttribute('points', face.points);
      poly.style.fillOpacity = (0.72 + 0.28 * face.facing).toFixed(3);
      group.append(poly);
      const print = navCubeFacePrint(face);
      if (print) {
        const el = prints.get(face.key);
        if (print.kind === 'letter') el.textContent = print.text;
        el.setAttribute('transform', print.transform);
        el.style.opacity = print.opacity.toFixed(3);
        group.append(el);
        printed.push(face.key);
      }
    }
    const axes = projectNavCubeEdgeAxes(quaternion, frame);
    edgeArrows.replaceChildren();
    for (const axis of axes) {
      const { line, head, label } = arrowSlots.get(axis.key);
      line.setAttribute('x1', axis.start.x.toFixed(2));
      line.setAttribute('y1', axis.start.y.toFixed(2));
      line.setAttribute('x2', axis.lineEnd.x.toFixed(2));
      line.setAttribute('y2', axis.lineEnd.y.toFixed(2));
      head.setAttribute('points', axis.head);
      label.setAttribute('x', axis.label.x.toFixed(2));
      label.setAttribute('y', axis.label.y.toFixed(2));
      edgeArrows.append(line, head, label);
    }
    group.append(edgeArrows);
    if (root) {
      root.dataset.navCube = 'ready';
      root.dataset.navCubeFrame = frame;
      root.dataset.navCubeFaces = faces.map((f) => f.key).join(',');
      root.dataset.navCubeAxes = axes.map((axis) => axis.key).join(',');
      root.dataset.navCubePrints = printed.join(',');
      root.dataset.navCubeAxisFrame = frame;
    }
    return true;
  };
  return { group, render };
}
