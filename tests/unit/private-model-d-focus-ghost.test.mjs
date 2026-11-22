import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { createDFocusGhost, dFootprintFromScope, footprintOverlap, dStoreyFootprint, D_STOREY_SPLIT_Y, D_FOOTPRINT_FALLBACK } from '../../src/scripts/privateModelDFocusGhost.ts';

const meshAt = (x, z, sx = 1, sz = 1, scope) => {
  const m = new Mesh(new BoxGeometry(sx, 1, sz), new MeshStandardMaterial());
  m.position.set(x, 0.5, z);
  if (scope) m.userData.ylisViewScope = scope;
  return m;
};
const F = { x0: 0, x1: 6, z0: -10, z1: 5 };

test('overlap fraction of a horizontal box against the D footprint', () => {
  assert.equal(footprintOverlap(new Box3(new Vector3(1, 0, -1), new Vector3(2, 1, 0)), F), 1);
  assert.equal(footprintOverlap(new Box3(new Vector3(10, 0, -1), new Vector3(12, 1, 0)), F), 0);
  assert.ok(Math.abs(footprintOverlap(new Box3(new Vector3(-6, 0, -1), new Vector3(6, 1, 0)), F) - 0.5) < 1e-9);
});

test('inside stays, outside turns faint and unpickable, crossing meshes split; restore is exact', () => {
  const root = new Group();
  const inside = meshAt(3, 0), outside = meshAt(20, 0), across = meshAt(6, 0, 10, 1);
  root.add(inside, outside, across);
  const originals = [inside, outside, across].map((m) => m.material);
  const ghost = createDFocusGhost(0.1);
  const counts = ghost.apply(root, F);
  assert.deepEqual(counts, { inside: 1, outside: 1, split: 1 });
  assert.equal(inside.material, originals[0]);
  assert.ok(outside.material.transparent && outside.material.opacity <= 0.1 && outside.material.depthWrite === false);
  assert.equal(outside.userData.viewerSuppressEdgeOverlay, true);
  const hits = []; outside.raycast({}, hits); assert.equal(hits.length, 0);
  assert.equal(across.material.clippingPlanes.length, 4);
  assert.equal(across.children.length, 1);
  assert.equal(across.children[0].material.clipIntersection, true);
  ghost.restore();
  assert.deepEqual([inside, outside, across].map((m) => m.material), originals);
  assert.equal(across.children.length, 0);
  assert.equal('viewerSuppressEdgeOverlay' in outside.userData, false);
  assert.equal(ghost.active, false);
});

test('footprint comes from the D scope, with a fallback for missing or implausible scope', () => {
  const root = new Group();
  const d = { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' };
  root.add(meshAt(0.5, -10, 1, 1, d), meshAt(6, 5, 1, 1, d), meshAt(30, 0));
  const f = dFootprintFromScope(root, 0);
  assert.deepEqual([f.x0, f.x1, f.z0, f.z1], [0, 6.5, -10.5, 5.5]);
  assert.deepEqual(dFootprintFromScope(new Group()), D_FOOTPRINT_FALLBACK);
});

test('outside meshes share one faint material; small crossing meshes are classified by their centre', () => {
  const root = new Group();
  const far1 = meshAt(20, 0), far2 = meshAt(30, 0);
  far2.material = new MeshStandardMaterial({ color: 0xff0000 });
  const smallEdge = meshAt(6.2, 0, 1, 1); // centre outside x1 = 6
  const smallIn = meshAt(5.8, 0, 1, 1); // centre inside
  root.add(far1, far2, smallEdge, smallIn);
  const ghost = createDFocusGhost(0.1);
  const counts = ghost.apply(root, F);
  assert.deepEqual(counts, { inside: 1, outside: 3, split: 0 });
  assert.equal(far1.material, far2.material, 'one shared ghost material');
  assert.equal(smallEdge.material, far1.material);
  ghost.restore();
});

test('storey focus: 1F below the split, 2F above; a two-storey wall is split by height', () => {
  const f1 = dStoreyFootprint(F, '1F'), f2 = dStoreyFootprint(F, '2F');
  assert.equal(f1.y1, D_STOREY_SPLIT_Y);
  assert.ok(f2.y0 < D_STOREY_SPLIT_Y && f2.y1 === undefined);
  const root = new Group();
  const wall = new Mesh(new BoxGeometry(5, 5.3, 0.2), new MeshStandardMaterial());
  wall.position.set(3, 2.65, -5);
  const upper = meshAt(3, -5); upper.position.y = 4;
  root.add(wall, upper);
  const ghost = createDFocusGhost(0.1);
  const counts = ghost.apply(root, f1);
  assert.deepEqual(counts, { inside: 0, outside: 1, split: 1 });
  assert.equal(wall.material.clippingPlanes.length, 5);
  ghost.restore();
});
