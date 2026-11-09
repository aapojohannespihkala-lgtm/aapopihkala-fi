import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V90_H20_SOURCE_SHA256, V90_H20_PARENT_SHA256, V90_H20_SCENE_COUNT,
  V90_H20_FLOORS, V90_H20_OPTIN_SCENES, V90_H20_ROOT,
  V90_H20_BUILDING_PARTS, V90_H20_BUILDING_SCENES,
  V90_H20_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V90H20LayerSourceProfile.mjs';
import {
  V90_SOURCE_SHA256, V90_FLOORS, V90_BUILDING_PARTS,
  V90_BUILDING_SCENES, V90_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V90LayerSourceProfile.mjs';
import { resolveTechnicalReviewRoots } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

const SHA = '73d2ffc1dd1d25717b1889bef05c307c02e598f09cc5a2986b93f8fe9992b3e7';
const ROOT = 'H20_D1F_WC_UPPERHATCH_MANIFOLD_WORK_TEST_HOST_HOLD_ROOT';

test('V90 H20 is exact SHA 300-scene opt-in, not the V90 main model', () => {
  assert.equal(V90_H20_SOURCE_SHA256, SHA);
  assert.equal(V90_H20_PARENT_SHA256, V90_SOURCE_SHA256);
  assert.equal(V90_H20_SCENE_COUNT, 300);
  assert.notEqual(V90_H20_SOURCE_SHA256, V90_SOURCE_SHA256);
  assert.deepEqual(V90_H20_FLOORS, { '1F': 295, '2F': 296, BOTH: 297 });
  assert.strictEqual(V90_H20_FLOORS, V90_FLOORS);
  assert.deepEqual(V90_H20_OPTIN_SCENES, { '1F': 298, BOTH: 299 });
  assert.equal(V90_H20_ROOT.node, 11432);
  assert.equal(V90_H20_ROOT.name, ROOT);
  assert.strictEqual(V90_H20_BUILDING_PARTS, V90_BUILDING_PARTS);
});

test('opt-in keeps all V90 building scenes and adds H20 to 1F/BOTH only', () => {
  for (const index of [295, 296, 297]) {
    assert.strictEqual(V90_H20_BUILDING_SCENES[index], V90_BUILDING_SCENES[index]);
  }
  for (const [index, old] of [[298, 295], [299, 297]]) {
    const scene = V90_H20_BUILDING_SCENES[index];
    const baseline = V90_BUILDING_SCENES[old];
    assert.equal(scene.floor, baseline.floor);
    assert.deepEqual(scene.rootNodes, [...baseline.rootNodes, 11432]);
    assert.strictEqual(scene.paths, baseline.paths);
    assert.equal(scene.rootNodes.filter(x => x === 11432).length, 1);
    assert.match(scene.name, /^V90_H20_VM20_MANIFOLD_(1F|BOTH)_OPTIN_SOURCE_EXACT_WORK_TEST_HOST_HOLD$/);
    assert.deepEqual(V90_H20_TECHNICAL_REVIEW_ROOTS[index],
      [...V90_TECHNICAL_REVIEW_ROOTS[old], { node: 11432, name: ROOT }]);
  }
  assert.ok(!V90_H20_BUILDING_SCENES[296].rootNodes.includes(11432));
});

const gltfFixture = (index, opts = {}) => {
  const rootProfiles = V90_H20_TECHNICAL_REVIEW_ROOTS[index];
  const scene = { children: [] };
  const nodes = [];
  const associations = new Map();
  for (const {node, name} of rootProfiles) {
    const object = {name, parent:scene};
    scene.children.push(object);
    nodes[node] = {name};
    associations.set(object, {nodes:node});
  }
  const scenes = Array.from({length:V90_H20_SCENE_COUNT}, () => ({ name: 'other', nodes: [] }));
  scenes[index] = {
    name: V90_H20_BUILDING_SCENES[index].name,
    nodes: [...V90_H20_BUILDING_SCENES[index].rootNodes],
  };
  const extras = {
    current:false, asBuilt:false,
    viewerFloorScenes: { '1F':295, '2F':296, BOTH:297 },
  };
  Object.assign(extras,opts.extras || {});
  return { gltf:{parser:{json:{scenes,nodes,asset:{extras}},associations},scenes:Object.assign([],{[index]:scene})},scene };
};

test('technical review accepts exact 298/299 roots and rejects wrong SHA or floor contract', () => {
  for (const index of [298, 299]) {
    const {gltf,scene} = gltfFixture(index);
    const roots=resolveTechnicalReviewRoots(gltf,scene,index,SHA,SHA);
    assert.ok(Array.isArray(roots));
    assert.equal(roots.length,V90_H20_TECHNICAL_REVIEW_ROOTS[index].length);
    assert.ok(roots.some(x=>x.name===ROOT));
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,V90_SOURCE_SHA256,SHA),null);
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,SHA,'0'.repeat(64)),null);
    gltf.parser.json.asset.extras.current = true;
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,SHA,SHA),null);
  }
  const {gltf,scene}=gltfFixture(298,{extras:{viewerFloorScenes:{'1F':298,'2F':296,BOTH:299}}});
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,298,SHA,SHA),null);
});

test('technical review rejects a missing H20 source root and wrong opt-in scene membership', () => {
  const {gltf,scene}=gltfFixture(299);
  const roots = gltf.parser.json.scenes[299].nodes;
  roots.pop();
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,299,SHA,SHA),null);
  const {gltf:gltf2,scene:scene2}=gltfFixture(298);
  const h20 = scene2.children.find(x=>x.name===ROOT);
  scene2.children.splice(scene2.children.indexOf(h20),1);
  assert.equal(resolveTechnicalReviewRoots(gltf2,scene2,298,SHA,SHA),null);
});

test('unchanged V90 floor scenes keep their exact technical roots on the H20 source', () => {
  for (const floor of ['1F', '2F', 'BOTH']) {
    const index = V90_H20_FLOORS[floor];
    assert.strictEqual(V90_H20_TECHNICAL_REVIEW_ROOTS[index],
      V90_TECHNICAL_REVIEW_ROOTS[index]);
    assert.ok(V90_H20_BUILDING_SCENES[index].rootNodes.every(
      node => V90_BUILDING_SCENES[index].rootNodes.includes(node)));
    assert.ok(!V90_H20_BUILDING_SCENES[index].rootNodes.includes(V90_H20_ROOT.node),
      'the H20 work assumption must stay opt-in');
  }
});
