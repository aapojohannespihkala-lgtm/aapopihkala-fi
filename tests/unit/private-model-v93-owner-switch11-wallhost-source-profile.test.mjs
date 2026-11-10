import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_SWITCH11_WALLHOST_SOURCE_SHA256 as SHA,
  V93_SWITCH11_WALLHOST_SCENE_COUNT as COUNT,
  V93_SWITCH11_WALLHOST_FLOORS as FLOORS,
  V93_SWITCH11_WALLHOST_OPTIN as OPTIN,
  V93_SWITCH11_WALLHOST_BUILDING_PARTS as PARTS,
  V93_SWITCH11_WALLHOST_BUILDING_SCENES as SCENES,
  V93_SWITCH11_WALLHOST_ORDERED_ROOT_FNV as FNV,
  V93_SWITCH11_WALLHOST_ROOTS as ROOTS,
  V93_SWITCH11_WALLHOST_COUNTS as COUNTS,
  V93_SWITCH11_WALLHOST_TECHNICAL_REVIEW_ROOTS as REVIEW,
} from '../../src/scripts/privateModelC80R2V93OwnerSwitch11WallhostSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnv=(nodes)=>{let h=2166136261;for(const n of nodes)h=Math.imul(h^n,16777619)>>>0;return h.toString(16).padStart(8,'0');};

test('V93 2026 owner green switch wallhost is strict new-SHA opt-in without physical part inheritance',()=>{
  assert.equal(SHA,'0651e0b895749913b2237e4db19b70db7942b2eb7925a661163b932de688b9d3');
  assert.equal(COUNT,341);
  assert.deepEqual(FLOORS,{'1F':295,'2F':296,BOTH:297});
  assert.deepEqual(OPTIN,{'1F':339,'2F':337,BOTH:340});
  assert.deepEqual(PARTS,{});
  assert.deepEqual(Object.keys(SCENES),['337','339','340']);
});

test('exact source roots from GLB and isolated SW03/SW04 old/new wall-host nodes',()=>{
  for(const idx of [337,339,340]){
    const spec=SCENES[idx];
    assert.match(spec.name,/WORK_TEST_HOST_HOLD$/);
    assert.equal(fnv(spec.rootNodes),FNV[idx]);
    assert.equal(new Set(spec.rootNodes).size,spec.rootNodes.length);
    assert.ok(Object.isFrozen(spec.rootNodes));
    assert.equal(REVIEW[idx].length,COUNTS[idx].total);
    for(const {node,name} of REVIEW[idx]){
      assert.ok(spec.rootNodes.includes(node));
      assert.equal(typeof name,'string');
    }
    assert.ok(!spec.rootNodes.includes(ROOTS.SW03_HISTORICAL));
    assert.ok(!spec.rootNodes.includes(ROOTS.SW04_HISTORICAL));
  }
  assert.deepEqual(COUNTS[339],{'1F':6,'2F':0,total:6});
  assert.deepEqual(COUNTS[337],{'1F':0,'2F':5,total:5});
  assert.deepEqual(COUNTS[340],{'1F':6,'2F':5,total:11});
  assert.ok(SCENES[339].rootNodes.includes(ROOTS.SW03_WALL));
  assert.ok(SCENES[339].rootNodes.includes(ROOTS.SW04_WALL));
  assert.ok(SCENES[340].rootNodes.includes(ROOTS.SW03_WALL));
  assert.ok(SCENES[340].rootNodes.includes(ROOTS.SW04_WALL));
  assert.ok(!SCENES[337].rootNodes.includes(ROOTS.SW03_WALL));
  assert.ok(SCENES[339].rootNodes.includes(ROOTS.SW05_HOST_HOLD));
  assert.ok(SCENES[339].rootNodes.includes(ROOTS.SW06_EXISTING_LINK));
  assert.equal(REVIEW[340].filter(x=>x.node===ROOTS.SW06_EXISTING_LINK).length,1);
});

test('legacy owner green ZIP SHA and unrelated marker SHA fail closed',()=>{
  for(const idx of [337,339,340]){
    for(const loadedSourceSha256 of [
      '2ef8b907f7a6fe0b2f08f2a8a0cc68c8aa22f15410c0a46618bab64d9d8cfd35',
      '34cf59f8a6bba21bd6c2a087acbfd7bdef22a84c8ff0fa4b7ffc4ce3cc5331d4',
    ]){
      const r=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,
        loadedSourceSha256,sceneIndex:idx,activeSceneRoot:null,area:'D',floor:SCENES[idx].floor});
      assert.equal(r.sourceVerified,false);
      assert.deepEqual(r.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
    }
  }
});
