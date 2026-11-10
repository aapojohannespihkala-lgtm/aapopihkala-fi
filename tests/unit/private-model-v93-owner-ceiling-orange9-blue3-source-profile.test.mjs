import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_OWNER_CEILING_SOURCE_SHA256 as SHA,
  V93_OWNER_CEILING_SCENE_COUNT as COUNT,
  V93_OWNER_CEILING_FLOORS as FLOORS,
  V93_OWNER_CEILING_OPTIN as OPTIN,
  V93_OWNER_CEILING_BUILDING_PARTS as PARTS,
  V93_OWNER_CEILING_BUILDING_SCENES as SCENES,
  V93_OWNER_CEILING_ORDERED_ROOT_FNV as FNV,
  V93_OWNER_CEILING_ROOTS as ROOTS,
  V93_OWNER_CEILING_COUNTS as COUNTS,
  V93_OWNER_CEILING_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93OwnerCeilingLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnv=nodes=>{let h=2166136261;for(const n of nodes)h=Math.imul(h^n,16777619)>>>0;return h.toString(16).padStart(8,'0');};

test('owner orange9/blue3 source is an isolated exact-SHA opt-in only',()=>{
  assert.equal(SHA,'34cf59f8a6bba21bd6c2a087acbfd7bdef22a84c8ff0fa4b7ffc4ce3cc5331d4');
  assert.equal(COUNT,331);
  assert.deepEqual(FLOORS,{'1F':295,'2F':296,BOTH:297});
  assert.deepEqual(OPTIN,{'1F':328,'2F':329,BOTH:330});
  assert.deepEqual(PARTS,{});
  assert.deepEqual(Object.keys(SCENES),['328','329','330']);
});
test('owner approximate socket and smoke markers have exact independent roots',()=>{
  for(const idx of [328,329,330]){
    assert.equal(fnv(SCENES[idx].rootNodes),FNV[idx]);
    assert.equal(SCENES[idx].rootNodes.length,idx===330?16:8);
    assert.ok(Object.isFrozen(SCENES[idx].rootNodes));
    assert.equal(new Set(SCENES[idx].rootNodes).size,SCENES[idx].rootNodes.length);
    assert.ok(SCENES[idx].name.includes('WORK_TEST_HOST_HOLD'));
    for(const {node} of REVIEW[idx]) assert.ok(SCENES[idx].rootNodes.includes(node));
  }
  assert.deepEqual(COUNTS[328],{sockets:1,smokes:1});
  assert.deepEqual(COUNTS[329],{sockets:8,smokes:2});
  assert.deepEqual(COUNTS[330],{sockets:9,smokes:3});
  assert.ok(SCENES[328].rootNodes.includes(ROOTS.SOCKET1));
  assert.ok(!SCENES[328].rootNodes.includes(ROOTS.SOCKET2));
  assert.ok(SCENES[329].rootNodes.includes(ROOTS.SOCKET2));
  assert.ok(!SCENES[329].rootNodes.includes(ROOTS.SOCKET1));
  assert.ok(SCENES[330].rootNodes.includes(ROOTS.LED1));
  assert.ok(SCENES[330].rootNodes.includes(ROOTS.LED2));
  assert.ok(SCENES[330].rootNodes.includes(ROOTS.KITCHEN_EXISTING));
});
test('wrong SHA and unrelated source cannot inherit owner ceiling classification',()=>{
  for(const idx of [328,329,330]){
    const floor=SCENES[idx].floor;
    for(const loadedSourceSha256 of [
      '2791ede06c7b50c9cffe27c64fc17a3d975b981c03850067eb5d814ba9e79944',
      '3a43dd443502e25171ff8284f0cc067c69c6d769fd151b61b416ca69698712ac',
    ]){
      const r=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,
        loadedSourceSha256,sceneIndex:idx,activeSceneRoot:null,area:'D',floor});
      assert.equal(r.sourceVerified,false);
      assert.deepEqual(r.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
    }
  }
});
