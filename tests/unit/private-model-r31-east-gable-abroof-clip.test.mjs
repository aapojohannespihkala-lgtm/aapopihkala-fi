import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  R31_AB_ROOF_UNDERSIDE,
  R31_EAST_GABLE_FACE_LIFT_M,
  r31ABRoofUndersideY,
  clipR31EastGableAtABRoofUnderside,
  buildR31EastGableOverlay,
  loadR31EastGableOverlay,
  buildR31GableBoarding,
} from '../../src/scripts/privateModelR31Inspection.mjs';

const EPS = 3e-5;
const underside = (z) => r31ABRoofUndersideY(z);
const vertices = (geo) => {
  const p = geo.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p, i));
};
const assertBelowRoof = (geo) => {
  const verts = vertices(geo);
  assert.ok(verts.length > 0, 'roof clip must not erase the whole east facade');
  for (const p of verts) assert.ok(p.y <= underside(p.z) + EPS, `point above A/B roof: ${p.y} @ z=${p.z}`);
};

function k14Fixture() {
  // Taller-than-roof face across both A/B roof slopes; has UVs and indexed triangles.
  const source = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.65, 12.52), new THREE.MeshStandardMaterial({ color: '#aaaaaa' }));
  source.name = 'K14_A_GABLE_EXTERIOR_FACE';
  source.position.set(25.29, 5.58, -4.55);
  source.updateMatrixWorld(true);
  return source;
}

test('R31 A/B roof reference is one metre below C/D and has two pitched halfplanes', () => {
  assert.equal(R31_AB_ROOF_UNDERSIDE.ridgeY, 6.523845);
  assert.equal(R31_AB_ROOF_UNDERSIDE.ridgeZ, -4.58);
  assert.equal(R31_AB_ROOF_UNDERSIDE.slope, 0.25);
  assert.equal(underside(-4.58), 6.523845);
  assert.ok(Math.abs(underside(-4.58 + 2) - underside(-4.58 - 2)) < 1e-9);
});

test('clip is world-placed, cuts both slopes, retains UVs/material groups and never changes GLB source geometry', () => {
  const source = k14Fixture();
  const before = Float32Array.from(source.geometry.getAttribute('position').array);
  const original = source.geometry;
  const clipped = clipR31EastGableAtABRoofUnderside(THREE, original, source.matrixWorld);
  assertBelowRoof(clipped);
  const p = clipped.getAttribute('position');
  assert.ok(p.count >= 6);
  assert.equal(clipped.getAttribute('uv').count, p.count);
  assert.ok(clipped.groups.length > 0, 'BoxGeometry material groups must be preserved');
  assert.strictEqual(source.geometry, original);
  assert.deepEqual(Array.from(original.getAttribute('position').array), Array.from(before));
  assert.ok(vertices(clipped).some((v) => v.z < -4.58));
  assert.ok(vertices(clipped).some((v) => v.z > -4.58));
});

test('normal scene23 loading clips K14 source and downstream brown boarding to A/B underside', () => {
  const source = k14Fixture();
  const group = new THREE.Group();
  group.add(source);
  const scenes = Array.from({ length: 24 }, (_, i) => i === 23 ? group : new THREE.Group());
  const nodes = Array.from({ length: 3666 }, () => ({}));
  nodes[3665] = { name: source.name, mesh: 1258 };
  const assoc = new Map([[source, { nodes: 3665 }]]);
  const output = buildR31EastGableOverlay(THREE, { scenes, parser: { json: { nodes }, associations: assoc } });
  assert.equal(output?.children.length, 1);
  const face = output.children[0];
  assert.strictEqual(face.material, source.material);
  assert.notStrictEqual(face.geometry, source.geometry);
  assertBelowRoof(face.geometry);
  assert.equal(face.userData.clippedToRoofSourceNode, 13361);
  assert.ok(Math.abs(face.matrix.elements[12] - R31_EAST_GABLE_FACE_LIFT_M) < 1e-9);
  assert.ok(source.geometry.getAttribute('position').count > 0);
  const brown = buildR31GableBoarding(THREE, { eastFace: face }, new THREE.MeshBasicMaterial({ color: 0x3b2a22 }));
  assert.equal(brown.children.length, 1);
  assertBelowRoof(brown.children[0].geometry);
  assert.ok(vertices(brown.children[0].geometry).every((p) => p.y >= 5.28 - EPS));
});

test('JSON on-demand scene23 path uses same clipping and leaves source dependency untouched', async () => {
  const source = k14Fixture();
  const nodes = Array.from({ length: 5860 }, () => ({}));
  nodes[5859] = { children: [3665] };
  nodes[3665] = { name: source.name, mesh: 1258, translation: [25.29, 5.58, -4.55] };
  const scenes = Array.from({ length: 24 }, () => ({ nodes: [] }));
  scenes[23] = { nodes: [5859] };
  const data = {
    scenes: [], // force the JSON fallback rather than the preloaded THREE scene route
    parser: { json: { nodes, scenes }, getDependency: async (type, id) => {
      assert.equal(type, 'mesh');
      assert.equal(id, 1258);
      return source;
    } },
  };
  const before = Float32Array.from(source.geometry.getAttribute('position').array);
  const output = await loadR31EastGableOverlay(THREE, data);
  assert.equal(output?.children.length, 1);
  assertBelowRoof(output.children[0].geometry);
  assert.equal(output.children[0].userData.sourceNode, 3665);
  assert.equal(output.children[0].userData.currentClaim, false);
  assert.deepEqual(Array.from(source.geometry.getAttribute('position').array), Array.from(before));
});
