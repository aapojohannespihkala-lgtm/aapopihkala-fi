import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_SW05_DOORWALL_SOURCE_SHA256 as SHA,
  V93_SW05_DOORWALL_SCENE_COUNT as COUNT,
  V93_SW05_DOORWALL_FLOORS as FLOORS,
  V93_SW05_DOORWALL_OPTIN as OPTIN,
  V93_SW05_DOORWALL_BUILDING_PARTS as PARTS,
  V93_SW05_DOORWALL_BUILDING_SCENES as SCENES,
  V93_SW05_DOORWALL_ORDERED_ROOT_FNV as FNV,
  V93_SW05_DOORWALL_ROOTS as ROOTS,
  V93_SW05_DOORWALL_COUNTS as COUNTS,
  V93_SW05_DOORWALL_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93SW05DoorwallLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
const fnv=a=>{let h=2166136261;for(const n of a)h=Math.imul(h^n,16777619)>>>0;return h.toString(16).padStart(8,'0');};
test('SW05 new source is SHA locked, 343 scenes, default retained and opt-in 339/341/342',()=>{
 assert.equal(SHA,'6d55716143dde6909216a670b049c503da292c84704ad3e8320e2cb4e96ba050');
 assert.equal(COUNT,343);
 assert.deepEqual(FLOORS,{'1F':295,'2F':296,BOTH:297});
 assert.deepEqual(OPTIN,{'1F':339,'2F':341,BOTH:342});
 assert.deepEqual(PARTS,{});
 assert.deepEqual(Object.keys(SCENES),['339','341','342']);
 // Independent exact-source expectations, not just a self-consistency check
 // between the mutable root list and its mutable FNV table.
 assert.deepEqual(FNV,{'339':'0476e130','341':'e3408577','342':'954e05ea'});
 assert.deepEqual(COUNTS[339],{'1F':6,'2F':0,total:6});
 assert.deepEqual(COUNTS[341],{'1F':0,'2F':5,total:5});
 assert.deepEqual(COUNTS[342],{'1F':6,'2F':5,total:11});
});
test('exact source root identity, new SW05 single active, history excluded',()=>{
 for(const idx of [339,341,342]){
  const spec=SCENES[idx];
  assert.match(spec.name,/WORK_TEST_HOST_HOLD$/);
  assert.equal(fnv(spec.rootNodes),FNV[idx]);
  assert.equal(new Set(spec.rootNodes).size,spec.rootNodes.length);
  assert.equal(REVIEW[idx].length,COUNTS[idx].total);
  for(const root of REVIEW[idx])assert.ok(spec.rootNodes.includes(root.node));
  assert.ok(!spec.rootNodes.includes(ROOTS.SW03_HISTORICAL));
  assert.ok(!spec.rootNodes.includes(ROOTS.SW04_HISTORICAL));
 }
 assert.ok(SCENES[341].rootNodes.includes(ROOTS.SW2_05_WALL));
 assert.ok(SCENES[342].rootNodes.includes(ROOTS.SW2_05_WALL));
 assert.ok(!SCENES[341].rootNodes.includes(ROOTS.SW2_05_HISTORICAL));
 assert.ok(!SCENES[342].rootNodes.includes(ROOTS.SW2_05_HISTORICAL));
 assert.ok(!SCENES[339].rootNodes.includes(ROOTS.SW2_05_WALL));
 assert.ok(SCENES[341].rootNodes.includes(ROOTS.SW2_05_D2F_WALL_HOST));
 assert.ok(SCENES[342].rootNodes.includes(ROOTS.SW2_05_BOTH_WALL_HOST));
 assert.equal(REVIEW[342].filter(x=>x.node===ROOTS.SW2_05_WALL).length,1);
});
test('previous source SHA or mismatched GLB must fail closed',()=>{
 for(const idx of [339,341,342]){
  for(const wrong of ['0651e0b895749913b2237e4db19b70db7942b2eb7925a661163b932de688b9d3',
       '2ef8b907f7a6fe0b2f08f2a8a0cc68c8aa22f15410c0a46618bab64d9d8cfd35']){
    const r=resolveBuildingPartLayerBindings({
      gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:wrong,
      sceneIndex:idx,activeSceneRoot:null,area:'D',floor:SCENES[idx].floor,
    });
    assert.equal(r.sourceVerified,false);
    assert.deepEqual(r.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
  }
 }
});

test('valid SW05 SHA cannot bypass scene, scope or missing glTF source-map gates',()=>{
 for(const idx of [339,341,342]){
  const scene={traverse:()=>{}};
  const scenes=Array(COUNT).fill(null);
  scenes[idx]=scene;
  // Deliberately incomplete synthetic source: a hash label is not a source map.
  const gltf={scenes,parser:{json:{nodes:[],scenes:Array(COUNT).fill(null)},associations:new Map()}};
  const common={gltf,expectedSourceSha256:SHA,loadedSourceSha256:SHA,
   sceneIndex:idx,area:'D',floor:SCENES[idx].floor};
  for(const [label,params,reason] of [
   ['wrong scene object',{...common,activeSceneRoot:{}},'SCENE_MISMATCH'],
   ['missing source node map',{...common,activeSceneRoot:scene},'MISSING_GLTF_SOURCE_MAP'],
   ['invalid area',{...common,activeSceneRoot:scene,area:'UNVERIFIED'},'UNKNOWN_SCOPE'],
  ]){
   const result=resolveBuildingPartLayerBindings(params);
   assert.equal(result.sourceVerified,false,`${idx}: ${label}`);
   assert.equal(result.bindings.length,0,`${idx}: ${label}`);
   assert.deepEqual(result.excluded.map(x=>x.reason),[reason],`${idx}: ${label}`);
  }
 }
});
