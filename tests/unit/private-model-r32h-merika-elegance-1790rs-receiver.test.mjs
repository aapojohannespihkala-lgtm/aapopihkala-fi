import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { R32H_T12_NW_COW_SOURCE as S } from '../../src/scripts/privateModelR32HT12NorthwestCOW.mjs';
import { R32H_ELEGANCE_1790RS_NW_FIT_SOURCE as D } from '../../src/scripts/privateModelR32HMerikaElegance1790RSFitGuard.mjs';
import { createR32HMerikaElegance1790RSNWReceiver as create } from '../../src/scripts/privateModelR32HMerikaElegance1790RSReceiver.mjs';

// Small synthetic Three fixtures derived from exact original SHA-bound indexes.
// Not a production GLB/physical-installation acceptance test.
const positions = () => {
  const p = new Float32Array(S.vertexCount * 3);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = -0.18;
    p[i + 1] = i % 12 === 0 ? S.sourceMinY : i % 12 === 3 ? -0.29
      : i % 12 === 6 ? -0.11 : S.sourceMaxY;
    p[i + 2] = -10.685;
  }
  p[0] = S.sourceBounds.minX; p[3] = S.sourceBounds.maxX;
  p[2] = S.sourceBounds.minZ; p[5] = S.sourceBounds.maxZ;
  return p;
};
function makeOriginal(sceneIndex = 814) {
  const json = {
    scenes: Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => ({ name: 'other', nodes: [] })),
    nodes: Array.from({ length: C80_R32H_SOURCE.nodeCount }, () => ({})),
    meshes: Array.from({ length: C80_R32H_SOURCE.meshCount }, () => ({})),
  };
  const view = sceneIndex === 815 ? C80_R32H_VIEWS.dService : C80_R32H_VIEWS.dNormal;
  json.scenes[sceneIndex] = { name: view.name, nodes: [13808] };
  json.nodes[13808] = { name: 'T12_GUTTERS_AND_DOWNSPOUTS', children: [S.nodeIndex] };
  json.nodes[S.nodeIndex] = { name: S.nodeName, mesh: S.meshIndex };
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions(), 3));
  geometry.setIndex([0, 1, 2]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = S.nodeName;
  mesh.userData = { originalProperty: 42, ModelStage: 'WORK_TEST_SOURCE' };
  const group = new THREE.Group(); group.name = 'T12_GUTTERS_AND_DOWNSPOUTS';
  group.add(mesh);
  const scene = new THREE.Group(); scene.add(group);
  const associations = new Map([
    [group, { nodes: 13808 }],
    [mesh, { nodes: S.nodeIndex, meshes: S.meshIndex }],
  ]);
  const scenes = Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => null);
  scenes[sceneIndex] = scene;
  return { mesh, scene, geometry, associations,
    gltf: { scenes, parser: { json, associations } },
  };
}
const nwMatrix = [
  -1, 0, -1.2246467991473532e-16, 0,
   0, 1, 0, 0,
   1.2246467991473532e-16, 0, -1, 0,
  -0.35, -0.087, -10.685, 1,
];
function makeDonor() {
  const nodes = Array.from({ length: 28 }, () => ({}));
  nodes[0] = { name: 'world', children: Array.from({ length: 27 }, (_, i) => i + 1) };
  nodes[7] = {
    name: 'RK_NW_ELEGANCE_1790RS_WORK_TEST__02_perforated_grate_TRUE_80_HOLES_WORK_TEST',
    mesh: 6, matrix: nwMatrix.slice(),
  };
  nodes[9] = {
    name: 'RK_NW_ELEGANCE_1790RS_WORK_TEST__01_sloped_upper_splash_basket_OPEN',
    mesh: 8, matrix: nwMatrix.slice(),
  };
  const meshes = Array.from({ length: 27 }, () => ({}));
  meshes[6] = { primitives: [{ attributes: { POSITION: 11 } }] };
  const accessors = Array.from({ length: 12 }, () => ({}));
  accessors[11] = { count: 2944, min: [-0.153, 0.25, -0.153],
    max: [0.153, 0.25, 0.153] };
  return {
    scenes: [new THREE.Group()],
    parser: { json: { scenes: [{ nodes: [0] }], nodes, meshes, accessors } },
  };
}
const params = (orig, donor, changes = {}) => ({
  gltf: orig.gltf, sourceSha256: S.glbSha256, sceneIndex: 814,
  siteGltf: donor, siteSourceSha256: D.siteGlbSha256,
  siteZipSha256: D.siteZipSha256, explicitPreviewOptIn: true,
  ...changes,
});
const minY = (geo) => {
  const arr = geo.getAttribute('position').array;
  let result = Infinity;
  for (let i = 1; i < arr.length; i += 3) result = Math.min(result, arr[i]);
  return result;
};
for (const sceneIndex of [814, 815]) {
  test('source scene ' + sceneIndex + ' Elegance opt-in is reversible +0.183m with no duplicate pipe', () => {
    const original = makeOriginal(sceneIndex);
    const donor = makeDonor();
    const baseline = original.mesh.geometry;
    const baselinePositions = new Float32Array(baseline.getAttribute('position').array);
    const baselineData = { ...original.mesh.userData };
    const children = original.scene.children.length;
    const r = create(params(original, donor, { sceneIndex }));
    assert.equal(r.available, true);
    assert.equal(r.status, 'WORK_TEST_ELEGANCE_PREVIEW_READY');
    assert.equal(r.sourceVerified, true);
    assert.equal(r.physicalHostVerified, false);
    assert.equal(r.asBuiltClaim, false);
    assert.equal(r.donorSourceGlbSha256, D.siteGlbSha256);
    assert.ok(Math.abs(r.candidateGapM - 0.020) < 0.002);
    assert.equal(r.setApplied(true), true);
    assert.notEqual(original.mesh.geometry, baseline);
    assert.ok(Math.abs(minY(original.mesh.geometry) - 0.183) < 0.002);
    assert.equal(original.scene.children.length, children);
    assert.equal(original.mesh.userData.physicalZClaim, false);
    assert.equal(original.mesh.userData.r32hEleganceGrateWorldY, 0.163);
    assert.equal(original.mesh.userData.currentClaim, false);
    assert.equal(original.mesh.userData.asBuiltClaim, false);
    assert.equal(r.setApplied(false), true);
    assert.equal(original.mesh.geometry, baseline);
    assert.deepEqual(original.mesh.userData, baselineData);
    assert.deepEqual(baseline.getAttribute('position').array, baselinePositions);
    assert.equal(r.setApplied(true), true);
    r.dispose();
    assert.equal(original.mesh.geometry, baseline);
    assert.deepEqual(original.mesh.userData, baselineData);
    assert.equal(r.setApplied(true), false);
  });
}
test('no explicit opt-in cannot prepare any replacement geometry', () => {
  const o = makeOriginal(), d = makeDonor();
  const r = create(params(o, d, { explicitPreviewOptIn: false }));
  assert.equal(r.status, 'EXPLICIT_OPT_IN_REQUIRED');
  assert.equal(r.available, false);
  assert.equal(o.mesh.geometry, o.geometry);
});
for (const [name, patch] of [
  ['wrong source SHA', { sourceSha256: 'bad' }],
  ['wrong site SHA', { siteSourceSha256: 'bad' }],
  ['wrong site ZIP', { siteZipSha256: 'bad' }],
  ['wrong R32H scene', { sceneIndex: 816 }],
]) {
  test(name + ' fails closed', () => {
    const o = makeOriginal(), d = makeDonor();
    const r = create(params(o, d, patch));
    assert.equal(r.available, false);
    assert.equal(r.setApplied(true), false);
    assert.equal(o.mesh.geometry, o.geometry);
  });
}
test('donor actual node matrix and local grate Y must yield WORLD +0.163m', () => {
  const original = makeOriginal(), donor = makeDonor();
  assert.equal(donor.parser.json.nodes[7].matrix[13], -0.087);
  assert.equal(donor.parser.json.accessors[11].min[1], 0.25);
  assert.equal(Math.round((0.25 - 0.087) * 1000), 163);
  donor.parser.json.nodes[7].matrix[13] = -0.066;
  assert.equal(create(params(original, donor)).status, 'DONOR_SOURCE_OR_WORLD_HOST_MISMATCH');
});
test('donor wrong mesh/count/name/parent or basket world transform fails closed', () => {
  for (const change of [
    d => { d.parser.json.nodes[7].mesh = 5; },
    d => { d.parser.json.meshes[6].primitives[0].attributes.POSITION = 10; },
    d => { d.parser.json.accessors[11].count = 2943; },
    d => { d.parser.json.nodes[7].name = 'RK_NE_WRONG'; },
    d => { d.parser.json.nodes[0].children = [1, 2]; },
    d => { d.parser.json.nodes[9].matrix[12] += .1; },
  ]) {
    const o = makeOriginal(), d = makeDonor();
    change(d);
    assert.equal(create(params(o, d)).status, 'DONOR_SOURCE_OR_WORLD_HOST_MISMATCH');
  }
});
test('source mesh binding absent may use unique exact name/parent but wrong/conflicting fails', () => {
  const o = makeOriginal(), d = makeDonor();
  o.associations.delete(o.mesh);
  assert.equal(create(params(o, d)).available, true);
  const extra = o.mesh.clone(); o.scene.children[0].add(extra);
  assert.equal(create(params(o, d)).status, 'MESH_BINDING_OR_WORLD_MISMATCH');
  o.scene.children[0].remove(extra);
  o.mesh.name = 'fake';
  assert.equal(create(params(o, d)).status, 'MESH_BINDING_OR_WORLD_MISMATCH');
});
test('a second geometry owner cannot be overwritten and source mismatch fails closed', () => {
  const o = makeOriginal(), d = makeDonor(), r = create(params(o, d));
  assert.equal(r.available, true);
  const other = o.geometry.clone(); o.mesh.geometry = other;
  assert.equal(r.setApplied(true), false);
  assert.equal(o.mesh.geometry, other);
  o.mesh.geometry = o.geometry;
  assert.equal(r.setApplied(true), true);
  r.dispose();
  assert.equal(o.mesh.geometry, o.geometry);
  o.mesh.geometry.getAttribute('position').array[0] += .05;
  assert.equal(create(params(o, d)).status, 'LEGACY_COW_SOURCE_GUARD_FAILED');
});
