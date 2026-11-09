import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V35_LILLANGEN_SHA256 as SHA,
  V35_LILLANGEN_PARTS,
  V35_LILLANGEN_DONOR_SHA256,
  resolveV35LillangenSourceMesh,
} from '../../src/scripts/privateModelV35LillangenMirrorSourceProfile.mjs';

// Source identity is exact to original V35: this 2015 proxy is not CURRENT.
export const buildV35MirrorSourceWitness = () => {
  const nodes = new Array(9334).fill(null);
  nodes[5835] = {
    name: 'C80_018_MIRROR_LILLANGEN60_2015_GLB_WORLD_FROM_2015_ROOM_HOST',
    children: [5818], extras: { current: false, asBuilt: false },
  };
  nodes[5818] = {
    name: 'C80_018_MIRROR_LILLANGEN60_2015_world',
    children: Array.from({ length: 16 }, (_, i) => 5819+i),
    extras: { donorSha256: V35_LILLANGEN_DONOR_SHA256,
      geometryLevel: 'SOURCE_ONLY_PRODUCT_2015_PLUS_VISUAL_PROXY' },
  };
  for (const part of V35_LILLANGEN_PARTS) nodes[part.nodeIndex] = {
    name: part.name, mesh: part.meshIndex,
    extras: { current: false, asBuilt: false,
      donorSha256: V35_LILLANGEN_DONOR_SHA256 },
  };
  const scenes = new Array(199).fill(null);
  scenes[197] = { name: 'C80R2_V35_D2F_WORK_TEST_HOST_HOLD_20261102', nodes: [5835] };
  scenes[198] = { name: 'C80R2_V35_BOTH_WORK_TEST_HOST_HOLD_20261102', nodes: [5835] };
  return { nodes, scenes, meshes: new Array(3284).fill(null) };
};
const view = (json, sceneIndex, nodeIndex, overrides={}) =>
  resolveV35LillangenSourceMesh({
    glbJson:json, expectedSourceSha256:SHA, loadedSourceSha256:SHA,
    sceneIndex, floor:sceneIndex===197?'2F':'BOTH',
    nodeIndex, nodePath:[5835,5818,nodeIndex], ...overrides,
  });

for (const sceneIndex of [197,198]) {
  test('V35 LILLANGEN scene '+sceneIndex+' binds only 15 physical meshes', () => {
    const json=buildV35MirrorSourceWitness();
    let physical=0;
    for (const part of V35_LILLANGEN_PARTS) {
      const r=view(json,sceneIndex,part.nodeIndex);
      if (!part.physicalPart) { assert.equal(r,null); continue; }
      physical++;
      assert.equal(r?.id,'architecture-fixtures');
      assert.equal(r?.sourceMeshIndex,part.meshIndex);
      assert.deepEqual(r?.sourceNodePath,[5835,5818,part.nodeIndex]);
      assert.equal(r?.bindingKind,'EXACT_V35_SOURCE_ONLY_PRODUCT_2015');
      assert.equal(r?.status,'WORK_TEST_HOST_HOLD_NONCURRENT_NOT_AS_BUILT');
    }
    assert.equal(physical,15);
  });
}

test('V35 LILLANGEN wrong SHA, scene, identity, history and root fail closed', () => {
  const json=buildV35MirrorSourceWitness();
  assert.equal(view(json,197,5819)?.id,'architecture-fixtures');
  for (const bad of ['bad','0'.repeat(64),null,undefined]) {
    assert.equal(view(json,197,5819,{expectedSourceSha256:bad}),null);
    assert.equal(view(json,197,5819,{loadedSourceSha256:bad}),null);
  }
  for (const bad of [
    {floor:'BOTH'}, {sceneIndex:199}, {nodePath:[5818,5819]},
    {nodePath:[5835,5820,5819]}, {nodeIndex:5826},
  ]) assert.equal(view(json,197,5819,bad),null);
  for (const mutate of [
    j=>{j.scenes[197].name='OTHER';},
    j=>{j.scenes[197].nodes=[];},
    j=>{j.nodes[5835].children=[];},
    j=>{j.nodes[5818].children=[5819];},
    j=>{j.nodes[5818].extras.geometryLevel='CURRENT';},
    j=>{j.nodes[5835].extras.current=true;},
    j=>{j.nodes[5835].extras.asBuilt=true;},
    j=>{j.nodes[5819].extras.current=true;},
    j=>{j.nodes[5819].extras.asBuilt=true;},
    j=>{j.nodes[5819].mesh=9999;},
    j=>{j.nodes[5819].name='NOT_CABINET';},
  ]) {
    const changed=structuredClone(json);
    mutate(changed);
    assert.equal(view(changed,197,5819),null);
  }
});
