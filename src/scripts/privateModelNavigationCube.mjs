/**
 * Navigation cube for the Ylisrinne orientation gizmo (owner request 22.11.2026).
 * The cube turns with the active camera and labels its faces YLÄ/ALA/N/S/E/W.
 * In map mode (EPSG:3879, ETRS-GK25) the side faces follow map north instead of
 * the building's YLIS-G1 +Y. The cube never moves the camera or the model; a
 * click on it only switches the north frame (existing toggle button).
 * Visual-only, WORK_TEST; no current/as-built assertion.
 */
import { northWorldDirection } from './privateModelNavigationNorthFrameToggle.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const NAV_CUBE_CENTER = 46;
export const NAV_CUBE_HALF = 12.5;
const VISIBLE_MIN = 0.02;
const LABEL_MIN = 0.3;

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
  const faces = [
    { key: 'top', label: 'YLÄ', n: up, a: east, b: north },
    { key: 'bottom', label: 'ALA', n: scale(up, -1), a: east, b: north },
    { key: 'north', label: 'N', n: north, a: east, b: up },
    { key: 'south', label: 'S', n: scale(north, -1), a: east, b: up },
    { key: 'east', label: 'E', n: east, a: north, b: up },
    { key: 'west', label: 'W', n: scale(east, -1), a: north, b: up },
  ];
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
    out.push(Object.freeze({
      key: f.key,
      label: f.label,
      facing: Math.min(1, facing),
      points: corners.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      center: toScreen(c),
      showLabel: facing >= LABEL_MIN,
    }));
  }
  out.sort((p, q) => p.facing - q.facing);
  return Object.freeze(out);
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
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const awayX = midpoint.x - NAV_CUBE_CENTER;
    const awayY = midpoint.y - NAV_CUBE_CENTER;
    const awayLength = Math.max(Math.hypot(awayX, awayY), 1);
    const label = {
      x: start.x + dx * 0.72 + awayX / awayLength * 4,
      y: start.y + dy * 0.72 + awayY / awayLength * 4,
    };
    out.push(Object.freeze({ key: axes[axis].key, start, end,
      lineEnd: { x: base.x - ux * 0.6, y: base.y - uy * 0.6 },
      head: head.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
      label, length, frame }));
  }
  return Object.freeze(out);
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
  const slots = new Map();
  for (const key of ['top', 'bottom', 'north', 'south', 'east', 'west']) {
    const poly = doc.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('class', `nav-cube-face nav-cube-face-${key}`);
    poly.dataset.face = key;
    const text = doc.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'nav-cube-label');
    text.dataset.face = key;
    slots.set(key, { poly, text });
  }
  let signature = '';
  const render = (quaternion, frame = 'local') => {
    const next = `${frame}|${['x', 'y', 'z', 'w'].map((k) => Number(quaternion?.[k]).toFixed(5)).join('|')}`;
    if (next === signature) return false;
    const faces = projectNavCube(quaternion, frame);
    signature = next;
    group.replaceChildren();
    for (const face of faces) {
      const { poly, text } = slots.get(face.key);
      poly.setAttribute('points', face.points);
      poly.style.fillOpacity = (0.25 + 0.55 * face.facing).toFixed(3);
      group.append(poly);
      if (face.showLabel) {
        text.textContent = face.label;
        text.setAttribute('x', face.center.x.toFixed(2));
        text.setAttribute('y', face.center.y.toFixed(2));
        text.style.opacity = Math.min(1, (face.facing - 0.2) * 1.6).toFixed(3);
        group.append(text);
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
      root.dataset.navCubeAxisFrame = frame;
    }
    return true;
  };
  return { group, render };
}
