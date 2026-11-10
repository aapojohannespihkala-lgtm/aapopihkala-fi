import test from 'node:test';
import assert from 'node:assert/strict';
import {
  D1F_SAFE_SOURCE_SHA256 as SHA,
  D1F_SAFE_SOURCE_SCENE_COUNT as COUNT,
  D1F_SAFE_FLOORS as FLOORS,
  D1F_SAFE_BUILDING_PARTS as PARTS,
  D1F_SAFE_BUILDING_SCENES as SCENES,
  D1F_SAFE_OPTIN_SCENES as OPTIN,
  D1F_SAFE_OWNER_REJECTED_ROOTS as REJECTED,
  D1F_SAFE_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93D1FOwnerSafeLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as BASE_SHA,
  V93_H35H38_BUILDING_PARTS as BASE_PARTS,
  V93_H35H38_BUILDING_SCENES as BASE_SCENES,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => roots.reduce((h,n)=>Math.imul(h^n,16777619)>>>0,2166136261).toString(16).padStart(8,'0');

test('source is exact SHA, 338 scenes, owner-safe 1F336/BOTH337; unchanged C70/default',()=>{
  assert.equal(SHA,'c552d62cfda9a238eb801993ce94e6974ab913d9f0f34931b08d7302d1b4acea');
  assert.notEqual(SHA,BASE_SHA);
  assert.equal(COUNT,338);
  assert.deepEqual(OPTIN,{'1F':336,BOTH:337});
  assert.deepEqual(FLOORS,{'1F':295,'2F':296,BOTH:297});
  assert.equal(PARTS,BASE_PARTS);
  for(const i of [295,296,297,298,299,300,301,302]) assert.equal(SCENES[i],BASE_SCENES[i]);
  for(const i of [331,332,333,334,335]) assert.equal(SCENES[i],undefined);
});

test('RAW GLB owner-safe ordered scene roots and no rejected KSO/duct or SK1',()=>{
 const cases=[[336,'1F',251,'5c4c949a'],[337,'BOTH',404,'4b46b70d']];
 for(const [i,floor,n,h]of cases){
  const scene=SCENES[i],roots=scene.rootNodes;
  assert.equal(scene.floor,floor);
  assert.equal(roots.length,n);
  assert.equal(fnvRoots(roots),h);
  assert.equal(new Set(roots).size,n);
  assert.match(scene.name,/V91_OWNER_SAFE_KSO_PLATE_ONLY/);
  assert.equal(Object.isFrozen(roots),true);
  for(const forbidden of REJECTED) assert.equal(roots.includes(forbidden),false);
  for(const expected of [11612,11613,11614,11615,11616,11435]) assert.equal(roots.filter(x=>x===expected).length,1);
  assert.ok(REVIEW[i].every(({node,name})=>roots.includes(node)&&typeof name==='string'));
 }
});

test('wrong GLB source SHA remains fail-closed at building binding identity gate',()=>{
 for(const sceneIndex of [336,337]) {
  const result=resolveBuildingPartLayerBindings({
    gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:BASE_SHA,sceneIndex,
    activeSceneRoot:null,area:'D',floor:sceneIndex===337?'BOTH':'1F',
  });
  assert.equal(result.sourceVerified,false);
  assert.deepEqual(result.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
 }
});
