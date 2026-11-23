import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import {
  R32H_T12_NW_COW_SOURCE as S,
  planR32HT12NorthwestWorkTestCOW,
} from '../../src/scripts/privateModelR32HT12NorthwestCOW.mjs';
import {
  R32H_NW_PHOTO_SPOUT_SOURCE as D,
  createR32HMerikaNWPhotoSpoutReceiver as create,
} from '../../src/scripts/privateModelR32HMerikaNWPhotoSpoutReceiver.mjs';

const sourcePosition = () => {
  const p = new Float32Array(S.vertexCount * 3);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = -0.18;
    p[i + 1] = i % 12 === 0 ? S.sourceMinY :
      i % 12 === 3 ? -0.29 : i % 12 === 6 ? -0.11 : S.sourceMaxY;
    p[i + 2] = -10.685;
  }
  p[0] = S.sourceBounds.minX; p[3] = S.sourceBounds.maxX;
  p[2] = S.sourceBounds.minZ; p[5] = S.sourceBounds.maxZ;
  return p;
};
function original(sceneIndex = 814) {
  const json = {
    scenes: Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => ({
      name: 'irrelevant', nodes: [],
    })),
    nodes: Array.from({ length: C80_R32H_SOURCE.nodeCount }, () => ({})),
    meshes: Array.from({ length: C80_R32H_SOURCE.meshCount }, () => ({})),
  };
  const v = sceneIndex === 815 ? C80_R32H_VIEWS.dService : C80_R32H_VIEWS.dNormal;
  json.scenes[sceneIndex] = { name: v.name, nodes: [13808] };
  json.nodes[13808] = {
    name: 'T12_GUTTERS_AND_DOWNSPOUTS', children: [S.nodeIndex],
  };
  json.nodes[S.nodeIndex] = { name: S.nodeName, mesh: S.meshIndex };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(sourcePosition(), 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
  mesh.name = S.nodeName;
  mesh.userData = { ModelStage: 'SOURCE_TEST', owner: 'R32H' };
  const parent = new THREE.Group();
  parent.name = 'T12_GUTTERS_AND_DOWNSPOUTS'; parent.add(mesh);
  const scene = new THREE.Group(); scene.add(parent);
  const associations = new Map([
    [parent, { nodes: 13808 }],
    [mesh, { meshes: S.meshIndex, nodes: S.nodeIndex }],
  ]);
  const scenes = Array.from({ length: C80_R32H_SOURCE.sceneCount }, () => null);
  scenes[sceneIndex] = scene;
  return { mesh, geo, scene, associations, gltf: {
    scenes, parser: { json, associations },
  } };
}
function expectedPhotoPosition(array, sceneIndex = 814) {
  const legacy = planR32HT12NorthwestWorkTestCOW({
    glbSha256: S.glbSha256, sceneIndex,
    nodeIndex: S.nodeIndex, meshIndex: S.meshIndex, nodeName: S.nodeName,
    worldMatrixIsIdentity: true, positions: array,
  });
  assert.equal(legacy.status, 'WORK_TEST_COW');
  const out = new Float32Array(legacy.positions);
  for (let i = 0; i < out.length; i += 3) {
    const y = array[i + 1];
    const fy = y <= S.lowerBandY ? 1 : y >= S.upperBandY ? 0 :
      (S.upperBandY - y) / (S.upperBandY - S.lowerBandY);
    out[i + 1] += .054 * fy;
    const yc = out[i + 1];
    const fx = yc <= .45 ? 1 : yc >= 1 ? 0 : (1 - yc) / .55;
    out[i] -= .055 * fx;
  }
  return out;
}
const grateMat = [
  -1, 0, -1.2246467991473532e-16, 0,
  0, 1, 0, 0,
  1.2246467991473532e-16, 0, -1, 0,
  -.35, -.087, -10.685, 1,
];
const hoodMat = [
  6.123233995736766e-17, 0, -1, 0,
  0, 1, 0, 0,
  1, 0, 6.123233995736766e-17, 0,
  -.35, -.087, -10.685, 1,
];
function donor(originalGeometry, sceneIndex = 814) {
  const nodes = Array.from({ length: 29 }, () => ({}));
  nodes[0] = {
    name: 'world', children: Array.from({ length: 27 }, (_, i) => i + 1),
  };
  nodes[7] = { mesh: 6, matrix: grateMat.slice() };
  nodes[9] = { mesh: 8, matrix: hoodMat.slice() };
  nodes[28] = {
    name: 'R32H_T12_NW_PHOTO_CONSTRAINED_SPOUT_WORK_TEST',
    mesh: 27,
    extras: {
      lowerElbowBendAwayFromWallM: -.055,
      bendFadeEndsAtWorldY: 1,
      wallDirection: '+X',
      asBuilt: false,
    },
  };
  const meshes = Array.from({ length: 28 }, () => ({}));
  meshes[27] = {
    primitives: [{ attributes: { POSITION: 15 }, mode: 4 }],
    extras: {
      sourceR32HGlbSha256: S.glbSha256,
      sourceNode: S.nodeIndex,
      sourceMesh: S.meshIndex,
      originalUnchanged: true,
    },
  };
  const accessors = Array.from({ length: 16 }, () => ({}));
  accessors[15] = {
    componentType: 5126, count: 360, type: 'VEC3',
    min: [-.3962628245353699, .18299999833106995, -11.640000343322754],
    max: [-.03999998793005943, 5.679999828338623, -10.635000228881836],
  };
  const p = expectedPhotoPosition(originalGeometry.getAttribute('position').array, sceneIndex);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = nodes[28].name;
  const scene = new THREE.Group(); scene.add(mesh);
  const associations = new Map([[mesh, { meshes: 27, nodes: 28 }]]);
  return { mesh, scene, associations,
    gltf: { scenes: [scene], parser: { json: {
      scenes: [{ nodes: [0, 28] }], nodes, meshes, accessors,
    }, associations } },
  };
}
const args = (o, d, sceneIndex = 814, more = {}) => ({
  gltf: o.gltf, originalSha256: S.glbSha256, sceneIndex,
  previewGltf: d.gltf, previewSha256: D.donorPreviewSha256,
  previewZipSha256: D.donorZipSha256, explicitPreviewOptIn: true,
  ...more,
});
function minY(a) {
  let low = Infinity;
  for (let i = 1; i < a.length; i += 3) low = Math.min(low, a[i]);
  return low;
}
test('full source SHA, donor ID, preserved model provenance and owner condition', () => {
  assert.equal(D.originalSha256, S.glbSha256);
  assert.equal(D.donorPreviewSha256, '157639b10fe5b6bd7d0eec1a8f9a7c579dc0abd752248f8b661b3a7390f0150e');
  assert.equal(D.donorZipSha256, '69ade893d4332692c0ebfa8a56c2eda74baf7d1a5fdce286e393e5665650299c');
  assert.equal(D.wallLipSourceSha256, '437ecc3798edf48b9eb5cbe384f93fc69a5461d92daa1a7bf181bcc7737ca61b');
  assert.equal(D.donorDriveId, '1L8sY0AalrSnQ7xsCwcbF91RRpfry_85l');
  assert.equal(D.bendShiftX, -.055);
  assert.equal(D.pipeLowerY - D.grateY, .01999999999999999);
});
for (const index of [814, 815]) {
  test('R32H scene ' + index + ': exact P7 55mm COW restores source mesh and all metadata', () => {
    const o = original(index), d = donor(o.geo, index);
    const baselineData = { ...o.mesh.userData };
    const baselineArray = new Float32Array(o.geo.getAttribute('position').array);
    const baselineChildren = o.scene.children.length;
    const r = create(args(o, d, index));
    assert.equal(r.status, 'WORK_TEST_NW_PHOTO_SPOUT_READY');
    assert.equal(r.available, true);
    assert.equal(r.approvedForViewer, false);
    assert.equal(r.approvedForPublication, false);
    assert.equal(r.asBuiltClaim, false);
    assert.equal(r.sourceVerified, true);
    assert.ok(Math.abs(r.candidateLipY - .183) < .0005);
    assert.ok(Math.abs(r.candidateGapM - .020) < .0005);
    assert.equal(r.lowerElbowShiftX, -.055);
    assert.equal(r.setApplied(true), true);
    assert.notEqual(o.mesh.geometry, o.geo);
    const newA = o.mesh.geometry.getAttribute('position').array;
    const donorA = d.mesh.geometry.getAttribute('position').array;
    assert.deepEqual(newA, donorA);
    assert.ok(Math.abs(minY(newA) - .183) < .0005);
    assert.equal(o.scene.children.length, baselineChildren);
    assert.equal(o.mesh.userData.physicalZClaim, false);
    assert.equal(o.mesh.userData.asBuiltClaim, false);
    assert.equal(o.mesh.userData.currentClaim, false);
    assert.equal(r.setApplied(false), true);
    assert.equal(o.mesh.geometry, o.geo);
    assert.deepEqual(o.mesh.userData, baselineData);
    assert.deepEqual(o.geo.getAttribute('position').array, baselineArray);
    assert.equal(r.setApplied(true), true);
    r.dispose();
    assert.equal(o.mesh.geometry, o.geo);
    assert.deepEqual(o.mesh.userData, baselineData);
    assert.equal(r.setApplied(true), false);
  });
}
test('explicit opt-in false forbids any donor geometry swap', () => {
  const o = original(), d = donor(o.geo);
  const r = create(args(o, d, 814, { explicitPreviewOptIn: false }));
  assert.equal(r.available, false);
  assert.equal(r.status, 'EXPLICIT_OPT_IN_REQUIRED');
  assert.equal(r.setApplied(true), false);
  assert.equal(o.mesh.geometry, o.geo);
});
for (const [name,patch,reason] of [
  ['wrong R32H SHA',{originalSha256:'other'},'ORIGINAL_SHA_SCENE_OR_COUNTS_MISMATCH'],
  ['wrong preview GLB SHA',{previewSha256:'other'},'DONOR_SHA_MISMATCH'],
  ['wrong preview ZIP SHA',{previewZipSha256:'other'},'DONOR_SHA_MISMATCH'],
  ['R32H 2F scene',{sceneIndex:816},'ORIGINAL_SHA_SCENE_OR_COUNTS_MISMATCH'],
  ['R32H nonexistent scene',{sceneIndex:818},'ORIGINAL_SHA_SCENE_OR_COUNTS_MISMATCH'],
]) {
  test(name + ' fails closed', () => {
    const o = original(), d = donor(o.geo);
    const r = create(args(o, d, 814, patch));
    assert.equal(r.status, reason);
    assert.equal(r.available, false);
    assert.equal(o.mesh.geometry, o.geo);
  });
}
test('wrong hood orientation, grate position and 28th node identity fail closed', () => {
  for (const edit of [
    d => { d.gltf.parser.json.nodes[9].matrix[2] = 1; },
    d => { d.gltf.parser.json.nodes[7].matrix[12] = -.28; },
    d => { d.gltf.parser.json.nodes[28].mesh = 26; },
    d => { d.gltf.parser.json.nodes[28].name = 'INDETERMINATE_PIPE'; },
    d => { d.gltf.parser.json.nodes[28].extras.asBuilt = true; },
    d => { d.gltf.parser.json.nodes[0].children.pop(); },
    d => { d.gltf.parser.json.scenes[0].nodes = [0]; },
    d => { d.gltf.parser.json.accessors[15].count = 359; },
    d => { d.gltf.parser.json.meshes[27].extras.sourceMesh = 0; },
  ]) {
    const o = original(), d = donor(o.geo); edit(d);
    assert.equal(create(args(o,d)).status,'DONOR_STRUCTURE_OR_WALL_LIP_MISMATCH');
    assert.equal(o.mesh.geometry, o.geo);
  }
});
test('preview pipe cannot silently drift even with correct metadata', () => {
  const o = original(), d = donor(o.geo);
  d.mesh.geometry.getAttribute('position').array[0] += .01;
  const r = create(args(o,d));
  assert.equal(r.status,'SOURCE_TO_PREVIEW_VERTEX_MISMATCH');
  assert.equal(o.mesh.geometry, o.geo);
});
test('ambiguous preview pipe and conflicting GLTFLoader association are rejected', () => {
  const o = original(), d = donor(o.geo);
  const clone = d.mesh.clone(); d.scene.add(clone);
  assert.equal(create(args(o,d)).status,'DONOR_STRUCTURE_OR_WALL_LIP_MISMATCH');
  d.scene.remove(clone);
  d.associations.set(d.mesh,{meshes:26});
  assert.equal(create(args(o,d)).status,'DONOR_STRUCTURE_OR_WALL_LIP_MISMATCH');
});
test('source mutation and an alien geometry owner fail closed', () => {
  const o = original(), d = donor(o.geo);
  o.geo.getAttribute('position').array[0] += .025;
  assert.equal(create(args(o,d)).status,'ORIGINAL_GEOMETRY_GUARD_FAILED');
  o.geo.getAttribute('position').array[0] -= .025;
  const r = create(args(o,d));
  assert.equal(r.status,'WORK_TEST_NW_PHOTO_SPOUT_READY');
  const alien = o.geo.clone(); o.mesh.geometry=alien;
  assert.equal(r.setApplied(true),false);
  assert.equal(o.mesh.geometry,alien);
  o.mesh.geometry=o.geo;
  assert.equal(r.setApplied(true),true);
  r.dispose();
  assert.equal(o.mesh.geometry,o.geo);
});
test('absent mesh-association fallback only for unique exact original name and parent', () => {
  const o=original(), d=donor(o.geo);
  o.associations.delete(o.mesh);
  assert.equal(create(args(o,d)).available,true);
  o.mesh.name='NOT_NW';
  assert.equal(create(args(o,d)).status,'ORIGINAL_MESH_BINDING_OR_WORLD_MISMATCH');
});
