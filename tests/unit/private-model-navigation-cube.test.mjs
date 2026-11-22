import test from 'node:test';
import assert from 'node:assert/strict';
import { projectNavCube, projectNavCubeEdgeAxes, navCubeBasis } from '../../src/scripts/privateModelNavigationCube.mjs';

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
  assert.deepEqual([x.start.x, x.start.y, x.end.x, x.end.y], [33.5, 33.5, 58.5, 33.5]);
  assert.deepEqual([z.start.x, z.start.y, z.end.x, z.end.y], [58.5, 58.5, 58.5, 33.5]);
  for (const edge of axes) {
    assert.ok(edge.length > 24.9);
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
      assert.ok(edge.length > 2.5 && edge.length <= 25.01);
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