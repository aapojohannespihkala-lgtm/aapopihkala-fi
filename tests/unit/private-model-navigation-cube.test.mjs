import test from 'node:test';
import assert from 'node:assert/strict';
import { projectNavCube, navCubeBasis } from '../../src/scripts/privateModelNavigationCube.mjs';

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
