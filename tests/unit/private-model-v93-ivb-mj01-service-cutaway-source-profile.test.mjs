import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IVB_MJ01_SERVICE_SOURCE_SHA256 as SHA,
  IVB_MJ01_SERVICE_SCENE_COUNT as COUNT,
  IVB_MJ01_SERVICE_BUILDING_PARTS as PARTS,
  IVB_MJ01_SERVICE_BUILDING_SCENES as SCENES,
  IVB_MJ01_SERVICE_FLOORS as FLOORS,
  IVB_MJ01_SERVICE_OPTIN_SCENES as OPTIN,
  IVB_MJ01_SERVICE_TECHNICAL_REVIEW_ROOTS as REVIEW,
  IVB_MJ01_SERVICE_FORK_ROOT as FORK,
  IVB_MJ01_SERVICE_FLOOR_WC_ROOT as WATER,
  IVB_MJ01_SERVICE_OWNER_OUTLETS as OUTLETS,
  IVB_MJ01_SERVICE_ROOM_HOSTS as HOSTS,
} from '../../src/scripts/privateModelC80R2V93IVBMJ01ServiceCutawayLayerSourceProfile.mjs';
import {
  IVB47K_MJ01_SOURCE_SHA256 as BASE_SHA,
  IVB47K_MJ01_BUILDING_PARTS as BASE_PARTS,
  IVB47K_MJ01_BUILDING_SCENES as BASE_SCENES,
  IVB47K_MJ01_FLOORS as BASE_FLOORS,
} from '../../src/scripts/privateModelC80R2V93IVB47KMJ01CoFitLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let h=2166136261;
  for(const n of roots) h=Math.imul(h^n,16777619)>>>0;
  return h.toString(16).padStart(8,'0');
};

test('V93 service cutaway is a distinct exact 346-scene, noncurrent GLB profile',()=>{
  assert.equal(SHA,'bbf0f48a8a1c3bfb224227913e63bcaac68de0ae9a1717651f8f7e0cc836f97c');
  assert.notEqual(SHA,BASE_SHA);
  assert.equal(COUNT,346);
  assert.deepEqual(OPTIN,{CEILING_2F:344,CUTAWAY_2F:345});
  assert.equal(PARTS,BASE_PARTS);
  assert.equal(FLOORS,BASE_FLOORS);
  for(const i of [295,296,297,298,299,300,301,302,336,337,338,339,340,341,342,343])
    assert.equal(SCENES[i],BASE_SCENES[i]);
});

test('real GLB room-service scene ordered root signatures and no obsolete ducts',()=>{
  for(const [i,expectedCount,expectedHash,roof] of [
    [344,15,'dd67f08c',true],
    [345,14,'347002ed',false],
  ]) {
    const scene=SCENES[i],root=scene.rootNodes;
    assert.equal(scene.floor,'2F');
    assert.equal(root.length,expectedCount);
    assert.equal(fnvRoots(root),expectedHash);
    assert.equal(root.filter(n=>n===FORK).length,1);
    assert.equal(root.filter(n=>n===WATER).length,1);
    assert.deepEqual(root.slice(0,8),[...OUTLETS,FORK,WATER]);
    for(const n of OUTLETS) assert.equal(root.filter(x=>x===n).length,1);
    for(const n of HOSTS.filter(n=>roof || n!==8003))
      assert.equal(root.filter(x=>x===n).length,1);
    assert.equal(root.includes(8003),roof);
    for(const n of [10122,11645,11646,11647,11656,11653,11654])
      assert.equal(root.includes(n),false);
    assert.deepEqual(REVIEW[i].map(x=>x.node).sort((a,b)=>a-b),[FORK,WATER].sort((a,b)=>a-b));
    assert.ok(Object.isFrozen(root));
    assert.match(scene.name,/WORK_TEST_HOST_HOLD$/);
  }
});

test('incorrect ancestor SHA cannot unlock scene 344 or 345',()=>{
  for(const index of [344,345]) {
    const r=resolveBuildingPartLayerBindings({
      gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:BASE_SHA,
      sceneIndex:index,activeSceneRoot:null,area:'D',floor:'2F',
    });
    assert.equal(r.sourceVerified,false);
    assert.deepEqual(r.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
  }
});
