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

/** Mount the cube behind the existing axes in the gizmo SVG. */
export function mountNavigationCube({ svg, root }) {
  const doc = svg?.ownerDocument;
  if (!doc?.createElementNS || !svg.insertBefore) throw new Error('YLIS_NAV_CUBE: svg required');
  const group = doc.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'nav-cube');
  group.dataset.navCube = 'faces';
  svg.insertBefore(group, svg.firstChild);
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
    if (root) {
      root.dataset.navCube = 'ready';
      root.dataset.navCubeFrame = frame;
      root.dataset.navCubeFaces = faces.map((f) => f.key).join(',');
    }
    return true;
  };
  return { group, render };
}
