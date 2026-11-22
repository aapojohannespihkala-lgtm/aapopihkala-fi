import test from 'node:test';
import assert from 'node:assert/strict';
import { projectNavCube, projectNavCubeEdgeAxes, projectNavCubeSilhouette, navCubeFacePrint, navCubeBasis, NAV_CUBE_GROUND_RINGS, NAV_CUBE_RING, NAV_CUBE_SUN, NAV_CUBE_HALF } from '../../src/scripts/privateModelNavigationCube.mjs';

const unit = (q) => { const n = Math.hypot(q.x, q.y, q.z, q.w); return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }; };
const keys = (faces) => faces.map((f) => f.key).sort();

test('navigation cube shows the faces turned toward the camera', () => {
  // Camera looking north (-Z world) sees the south face only.
  assert.deepEqual(keys(projectNavCube({ x: 0, y: 0, z: 0, w: 1 })), ['south']);
  // Plan view from above sees the top face only.
  assert.deepEqual(keys(projectNavCube({ x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 })), ['top']);
  // Default SE oblique camera sees top, east and south.
  const se = unit({ x: -0.2264, y: 0.371, z: 0.0938, w: 0.8957 });
  const faces = projectNavCube(se);
  assert.deepEqual(keys(faces), ['east', 'south', 'top']);
  assert.ok(faces.every((f, i) => i === 0 || faces[i - 1].facing <= f.facing), 'back to front');
  assert.equal(faces.find((f) => f.key === 'top').label, 'YLÄ');
});

test('map mode turns the side faces to map north, local mode keeps YLIS-G1 +Y', () => {
  const local = navCubeBasis('local');
  assert.deepEqual([local.north.x, local.north.z], [0, -1]);
  const map = navCubeBasis('map');
  const angle = Math.atan2(-map.north.x, -map.north.z) * 180 / Math.PI;
  assert.ok(Math.abs(Math.abs(angle) - 21.73) < 0.2, `angle ${angle}`);
  assert.deepEqual(keys(projectNavCube({ x: 0, y: 0, z: 0, w: 1 }, 'map')), ['south', 'west']);
});

test('navigation cube refuses a non-finite camera pose', () => {
  assert.throws(() => projectNavCube({ x: NaN, y: 0, z: 0, w: 1 }), /YLIS_NAV_CUBE/);
});

test('A-version arrows lie on full cube edges and point to positive frame axes', () => {
  const q = { x: 0, y: 0, z: 0, w: 1 };
  const axes = projectNavCubeEdgeAxes(q, 'local');
  assert.deepEqual(axes.map((a) => a.key), ['x', 'z']);
  const x = axes[0], z = axes[1];
  const lo = 46 - NAV_CUBE_HALF, hi = 46 + NAV_CUBE_HALF;
  assert.deepEqual([x.start.x, x.start.y, x.end.x, x.end.y], [lo, lo, hi, lo]);
  assert.deepEqual([z.start.x, z.start.y, z.end.x, z.end.y], [hi, hi, hi, lo]);
  for (const edge of axes) {
    assert.ok(edge.length > 2 * NAV_CUBE_HALF - 0.1);
    assert.ok(edge.head.startsWith(`${edge.end.x.toFixed(2)},${edge.end.y.toFixed(2)}`));
    assert.equal(edge.frame, 'local');
  }
});

test('oblique view has three positive axes on visible face edges, map frame rotates them', () => {
  const q = unit({ x: -0.2264, y: 0.371, z: 0.0938, w: 0.8957 });
  const local = projectNavCubeEdgeAxes(q, 'local');
  const map = projectNavCubeEdgeAxes(q, 'map');
  assert.deepEqual(local.map((a) => a.key), ['x','y','z']);
  assert.deepEqual(map.map((a) => a.key), ['x','y','z']);
  for (const frameEdges of [local, map]) {
    const faces = projectNavCube(q, frameEdges[0].frame);
    const vertices = faces.flatMap((face) => face.points.split(' ').map((v) => v.split(',').map(Number)));
    for (const edge of frameEdges) {
      assert.ok(edge.length > 2.5 && edge.length <= 2 * NAV_CUBE_HALF + 0.01);
      for (const point of [edge.start, edge.end]) {
        assert.ok(vertices.some(([x, y]) => Math.hypot(x - point.x, y - point.y) < 0.02),
          `${edge.key} endpoint must be a visible cube corner`);
      }
    }
  }
  assert.notEqual(local.find((e) => e.key === 'x').end.x.toFixed(2),
    map.find((e) => e.key === 'x').end.x.toFixed(2));
});

test('axis arrows reject unknown north frame and non-finite pose, without camera mutation', () => {
  const q = { x: 0, y: 0, z: 0, w: 1 }, prior = { ...q };
  assert.throws(() => projectNavCubeEdgeAxes(q, 'unknown'), /YLIS_NORTH_FRAME/);
  assert.throws(() => projectNavCubeEdgeAxes({ ...q, x: NaN }), /YLIS_NAV_CUBE/);
  assert.deepEqual(q, prior);
});
const applyMatrix = ([a, b, c, d, e, f], x, y) => ({ x: a * x + c * y + e, y: b * x + d * y + f });

test('17 ground rings: five interleaved rows, centered, owner sizes', () => {
  assert.equal(NAV_CUBE_GROUND_RINGS.length, 17);
  const rows = new Map();
  for (const { x, y } of NAV_CUBE_GROUND_RINGS) rows.set(y, [...(rows.get(y) ?? []), x]);
  assert.deepEqual([...rows.keys()], [-0.42, -0.21, 0, 0.21, 0.42]);
  assert.deepEqual([...rows.values()].map((r) => r.length), [3, 4, 3, 4, 3]);
  const sum = NAV_CUBE_GROUND_RINGS.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  assert.ok(Math.abs(sum.x) < 1e-9 && Math.abs(sum.y) < 1e-9, 'pattern centered');
  assert.equal(NAV_CUBE_RING.r, 0.06);
  assert.equal(NAV_CUBE_RING.stroke, 0.057);
  assert.equal(NAV_CUBE_SUN.stroke, 0.057);
});

test('face prints lie in the face plane and foreshorten with it', () => {
  const half = Math.SQRT1_2;
  // Plan view from above: the top face is square and its print is not skewed.
  const top = projectNavCube({ x: -half, y: 0, z: 0, w: half }).find((f) => f.key === 'top');
  const sun = navCubeFacePrint(top);
  assert.equal(sun.kind, 'sun');
  const [a, b, c, d] = top.matrix;
  assert.ok(Math.abs(Math.hypot(a, b) - NAV_CUBE_HALF) < 1e-6 && Math.abs(Math.hypot(c, d) - NAV_CUBE_HALF) < 1e-6);
  // Seen from above with north up, the print's up (face -y) points to screen up and east to screen right.
  const up = applyMatrix(top.matrix, 0, -1), right = applyMatrix(top.matrix, 1, 0);
  assert.ok(up.y < top.center.y && right.x > top.center.x);
  // Oblique SE view: corners of the print frame coincide with the face polygon.
  const se = { x: -0.2264, y: 0.371, z: 0.0938, w: 0.8957 };
  const n = Math.hypot(se.x, se.y, se.z, se.w); for (const k in se) se[k] /= n;
  for (const face of projectNavCube(se)) {
    const pts = face.points.split(' ').map((p) => p.split(',').map(Number));
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = applyMatrix(face.matrix, u, v);
      assert.ok(pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 0.02), `${face.key} corner`);
    }
    const print = navCubeFacePrint(face);
    assert.equal(print.kind, face.key === 'top' ? 'sun' : face.key === 'bottom' ? 'rings' : 'letter');
    assert.match(print.transform, /^matrix\(/);
  }
  // Side letters read correctly from outside: on the south face, print-right is east (+X screen in SE view).
  const south = projectNavCube(se).find((f) => f.key === 'south');
  assert.equal(navCubeFacePrint(south).text, 'S');
});

test('face prints hide when the face is almost edge-on', () => {
  const face = projectNavCube({ x: 0, y: 0, z: 0, w: 1 }).find((f) => f.key === 'south');
  assert.equal(navCubeFacePrint({ ...face, facing: 0.05 }), null);
  assert.equal(navCubeFacePrint({ ...face, matrix: [NaN, 0, 0, 1, 0, 0] }), null);
  assert.ok(navCubeFacePrint(face).opacity > 0.9);
});

/** Independent distance check against the eight-vertex convex silhouette. */
function exteriorClearance(point, hull) {
  let inside = true, closest = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    if (dx * (point.y - a.y) - dy * (point.x - a.x) < -1e-7) inside = false;
    const t = Math.max(0, Math.min(1,
      ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(dx * dx + dy * dy, 1e-8)));
    closest = Math.min(closest, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return inside ? -closest : closest;
}

test('owner rule: every X/Y/Z glyph stays entirely outside silhouette for both north frames and rotating cameras', () => {
  const q0 = { x: 0, y: 0, z: 0, w: 1 };
  const poses = [
    q0,
    { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    unit({ x: -0.2264, y: 0.371, z: 0.0938, w: 0.8957 }),
    ...Array.from({ length: 48 }, (_, i) => unit({
      x: Math.sin(i * 0.37) * 0.7,
      y: Math.cos(i * 0.29) * 0.8,
      z: Math.sin(i * 0.43) * 0.45,
      w: 0.4 + Math.cos(i * 0.19) * 0.48,
    })),
  ];
  for (const frame of ['local', 'map']) for (const [i, q] of poses.entries()) {
    const hull = projectNavCubeSilhouette(q, frame);
    const arrows = projectNavCubeEdgeAxes(q, frame);
    assert.ok(hull.length >= 3 && hull.length <= 6, frame + ' pose ' + i + ' convex hull');
    const labels = [];
    for (const axis of arrows) {
      const { x, y } = axis.label;
      assert.ok(x >= 5 && x <= 87 && y >= 5 && y <= 87,
        frame + '/' + i + '/' + axis.key + ' glyph within SVG bounds');
      // 7px uppercase text + 1.25px outline fits inside 6.25px radius.
      assert.ok(exteriorClearance(axis.label, hull) >= 6.20,
        frame + '/' + i + '/' + axis.key + ' glyph must clear entire cube');
      // Owner 22.11.2026 15.14: letters stay on their arrow lines; 9 units
      // between centres still keeps two outlined 7px glyphs apart.
      assert.ok(labels.every(p => Math.hypot(p.x - x, p.y - y) >= 8.9),
        frame + '/' + i + '/' + axis.key + ' distinct labels');
      labels.push(axis.label);
      // Preserve +axis arrow direction: the first polygon vertex is the
      // projected positive endpoint, never a text-position surrogate.
      assert.equal(axis.head.split(' ')[0],
        axis.end.x.toFixed(2) + ',' + axis.end.y.toFixed(2));
      const dx = axis.end.x - axis.start.x, dy = axis.end.y - axis.start.y;
      assert.ok(Math.hypot(dx, dy) > 2.5);
    }
  }
  assert.deepEqual(q0, { x: 0, y: 0, z: 0, w: 1 }, 'never modify camera quaternion');
});

test('positive axis arrowhead remains on cube edge while letter is outside in a head-on view', () => {
  const q = { x: 0, y: 0, z: 0, w: 1 };
  const silhouette = projectNavCubeSilhouette(q, 'local');
  const edges = projectNavCubeEdgeAxes(q, 'local');
  for (const edge of edges) {
    assert.ok(exteriorClearance(edge.label, silhouette) > 6);
    // The arrowhead endpoint remains at the original 30px cube edge.
    assert.equal(edge.length, 2 * NAV_CUBE_HALF);
  }
  const x = edges.find(e => e.key === 'x');
  const z = edges.find(e => e.key === 'z');
  assert.ok(x.label.x > x.end.x, '+X letter after the positive tip');
  assert.ok(z.label.y < z.end.y, '+Z letter after the positive tip');
});

test('owner 22.11.2026 15.14: letter centre on the arrow line beyond the +tip, wholly outside the cube', () => {
  const deg = Math.PI / 180;
  const qFrom = (yaw, pitch) => {
    const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2), cp = Math.cos(pitch / 2), sp = Math.sin(pitch / 2);
    return unit({ x: cy * sp, y: sy * cp, z: -sy * sp, w: cy * cp });
  };
  const poses = {
    oblique: qFrom(-40 * deg, -30 * deg), side: qFrom(0, 0), side90: qFrom(90 * deg, 0),
    upperOblique: qFrom(30 * deg, -60 * deg), lowerOblique: qFrom(-35 * deg, 50 * deg),
  };
  for (const [name, q] of Object.entries(poses)) for (const frame of ['local', 'map']) {
    const hull = projectNavCubeSilhouette(q, frame);
    const arrows = projectNavCubeEdgeAxes(q, frame);
    assert.ok(arrows.length >= 2, `${name}/${frame} arrows`);
    for (const a of arrows) {
      const dx = a.end.x - a.start.x, dy = a.end.y - a.start.y, len = Math.hypot(dx, dy);
      const off = Math.abs((a.label.x - a.end.x) * dy - (a.label.y - a.end.y) * dx) / len;
      const along = ((a.label.x - a.end.x) * dx + (a.label.y - a.end.y) * dy) / len;
      assert.ok(off < 1e-6, `${name}/${frame}/${a.key} on the arrow line`);
      assert.ok(along > 0, `${name}/${frame}/${a.key} beyond the positive tip`);
      assert.ok(exteriorClearance(a.label, hull) >= 6.2, `${name}/${frame}/${a.key} wholly outside`);
    }
  }
});
