import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { R32H_T12_NW_COW_SOURCE as S } from '../../src/scripts/privateModelR32HT12NorthwestCOW.mjs';
import { createR32HT12NorthwestWorkTestReceiver as create } from '../../src/scripts/privateModelR32HT12NorthwestReceiver.mjs';

// Synthetic Three scene with the ORIGINAL source index/bounds contract.
// These tests are not proof that production WebGL or 2026 physical host passed.
const sourcePositions = () => {
  const p = new Float32Array(S.vertexCount * 3);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = -0.18;
    p[i + 1] = i % 12 === 0 ? S.sourceMinY : i % 12 === 3 ? -0.29 : i % 12 === 6 ? -0.11 : S.sourceMaxY;
    p[i + 2] = -10.685;
  }
  p[0] = S.sourceBounds.minX; p[3] = S.sourceBounds.maxX;
  p[2] = S.sourceBounds.minZ; p[5] = S.sourceBounds.maxZ;
  return p;
};
const makeSource = (sceneIndex = 814) => {
  const json = {
    scenes: Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => ({ name: 'unbound', nodes: [] })),
    nodes: Array.from({ length: C80_R32H_SOURCE.nodeCount }, () => ({})),
    meshes: Array.from({ length: C80_R32H_SOURCE.meshCount }, () => ({})),
  };
  const view = sceneIndex === 815 ? C80_R32H_VIEWS.dService : C80_R32H_VIEWS.dNormal;
  json.scenes[sceneIndex] = { name: view.name, nodes: [13808] };
  json.nodes[13808] = { name: 'T12_GUTTERS_AND_DOWNSPOUTS', children: [S.nodeIndex] };
  json.nodes[S.nodeIndex] = { name: S.nodeName, mesh: S.meshIndex };
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(sourcePositions(), 3));
  geometry.setIndex([0, 1, 2]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = S.nodeName;
  mesh.userData = { sourceRole: 'T12', ModelStage: 'WORK_TEST_SOURCE', physicalZClaim: false };
  const group = new THREE.Group();
  group.add(mesh);
  const scene = new THREE.Group();
  scene.add(group);
  const associations = new Map([
    [group, { nodes: 13808 }],
    [mesh, { nodes: S.nodeIndex, meshes: S.meshIndex }],
  ]);
  const scenes = Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => null);
  scenes[sceneIndex] = scene;
  return {
    mesh, geometry, scene, json, associations,
    gltf: { scenes, parser: { json, associations } },
    receive: (sha = S.glbSha256, index = sceneIndex) =>
      create({ gltf: { scenes, parser: { json, associations } }, sourceSha256: sha, sceneIndex: index }),
  };
};

test('source-exact R32H NW COW preview replaces only geometry and restores original identity', () => {
  const f = makeSource();
  const before = new Float32Array(f.geometry.getAttribute('position').array);
  const baselineData = { ...f.mesh.userData };
  const baselineChildren = f.scene.children.length;
  const receiver = f.receive();
  assert.equal(receiver.status, 'WORK_TEST_PREVIEW_READY');
  assert.equal(receiver.available, true);
  assert.equal(receiver.sourceVerified, true);
  assert.equal(receiver.physicalHostVerified, false);
  assert.equal(receiver.asBuiltClaim, false);
  assert.equal(receiver.sceneIndex, 814);
  assert.equal(receiver.sourceNodeIndex, S.nodeIndex);
  assert.ok(Math.abs(receiver.riseY - 0.45721) < 0.002);
  assert.ok(receiver.shiftedVertices > 0 && receiver.shiftedVertices < S.vertexCount);
  assert.equal(receiver.setApplied(true), true);
  assert.equal(receiver.setApplied(true), true, 'idempotent activation');
  assert.notEqual(f.mesh.geometry, f.geometry, 'replace geometry reference, never source vertices');
  assert.equal(f.scene.children.length, baselineChildren, 'no second visible downpipe');
  assert.equal(f.mesh.userData.r32hNorthwestHostStatus, 'SOURCE_HOST_HOLD');
  assert.equal(f.mesh.userData.currentClaim, false);
  assert.equal(f.mesh.userData.asBuiltClaim, false);
  assert.equal(f.mesh.userData.physicalZClaim, false);
  const corrected = f.mesh.geometry.getAttribute('position').array;
  assert.ok(Math.abs(Math.min(...Array.from(corrected).filter((_, i) => i % 3 === 1)) - 0.129) < 0.002);
  assert.deepEqual(f.geometry.getAttribute('position').array, before, 'original source geometry immutable');
  assert.equal(receiver.setApplied(false), true);
  assert.equal(receiver.setApplied(false), true);
  assert.equal(f.mesh.geometry, f.geometry);
  assert.deepEqual(f.mesh.userData, baselineData, 'no stale preview/asBuilt metadata');
  assert.equal(receiver.setApplied(true), true);
  receiver.dispose();
  assert.equal(f.mesh.geometry, f.geometry);
  assert.deepEqual(f.geometry.getAttribute('position').array, before);
  assert.equal(receiver.setApplied(true), false, 'disposed receiver cannot reactivate');
  receiver.dispose();
});

test('same source scene815 permitted, but source scene816, wrong SHA and name fail closed', () => {
  const service = makeSource(815);
  const r = service.receive();
  assert.equal(r.status, 'WORK_TEST_PREVIEW_READY');
  r.dispose();
  assert.equal(service.receive('wrong-sha').status, 'OUT_OF_EXACT_SOURCE_SCOPE');
  assert.equal(service.receive(S.glbSha256, 816).status, 'OUT_OF_EXACT_SOURCE_SCOPE');
  service.json.scenes[815].name = 'renamed like R32H';
  assert.equal(service.receive().status, 'OUT_OF_EXACT_SOURCE_SCOPE');
});

test('requires glTF scene roots, exact node name+mesh and unique parser association', () => {
  const f = makeSource();
  f.json.nodes[S.nodeIndex].mesh = S.meshIndex + 1;
  assert.equal(f.receive().status, 'SOURCE_NODE_OR_SCENE_MISMATCH');
  f.json.nodes[S.nodeIndex].mesh = S.meshIndex;
  f.json.scenes[814].nodes = [1];
  assert.equal(f.receive().status, 'SOURCE_NODE_OR_SCENE_MISMATCH');
  f.json.scenes[814].nodes = [13808];
  f.associations.set(f.mesh, { nodes: S.nodeIndex, meshes: S.meshIndex + 1 });
  assert.equal(f.receive().status, 'MESH_BINDING_OR_WORLD_MISMATCH');
  f.associations.set(f.mesh, { nodes: S.nodeIndex, meshes: S.meshIndex });
  const duplicate = f.mesh.clone();
  f.scene.add(duplicate);
  f.associations.set(duplicate, { nodes: S.nodeIndex, meshes: S.meshIndex });
  assert.equal(f.receive().status, 'MESH_BINDING_OR_WORLD_MISMATCH');
  f.scene.remove(duplicate);
  f.mesh.position.y = 1;
  assert.equal(f.receive().status, 'MESH_BINDING_OR_WORLD_MISMATCH', 'non-identity world transform');
});

test('source COW rejects geometry mismatch, and never replaces another renderer owner', () => {
  const f = makeSource();
  const a = f.mesh.geometry.getAttribute('position').array;
  a[0] += 0.10;
  assert.equal(f.receive().status, 'SOURCE_MESH_BOUNDS_MISMATCH');
  a[0] -= 0.10;
  const receiver = f.receive();
  assert.equal(receiver.available, true);
  const foreign = f.geometry.clone();
  f.mesh.geometry = foreign;
  assert.equal(receiver.setApplied(true), false);
  assert.equal(f.mesh.geometry, foreign, 'no overwrite of another geometry owner');
  f.mesh.geometry = f.geometry;
  assert.equal(receiver.setApplied(true), true);
  receiver.dispose();
  assert.equal(f.mesh.geometry, f.geometry);
});
