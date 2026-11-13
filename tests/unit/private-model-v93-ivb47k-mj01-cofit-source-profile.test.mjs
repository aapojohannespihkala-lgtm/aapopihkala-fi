import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IVB47K_MJ01_SOURCE_SHA256 as SHA, IVB47K_MJ01_SOURCE_SCENE_COUNT as COUNT,
  IVB47K_MJ01_OPTIN_SCENES as OPTIN, IVB47K_MJ01_BUILDING_SCENES as SCENES,
  IVB47K_MJ01_BUILDING_PARTS as PARTS, IVB47K_MJ01_FLOORS as FLOORS,
  IVB47K_MJ01_TECHNICAL_REVIEW_ROOTS as REVIEW,
  IVB47K_MJ01_FORK_ROOT as IV, IVB47K_MJ01_FLOOR_WC_ROOT as WC,
  IVB47K_MJ01_OLD_HIGH_TRI_ROOT as HIGH, IVB47K_MJ01_OLD_PARALLEL_ROOT as TWIN,
} from '../../src/scripts/privateModelC80R2V93IVB47KMJ01CoFitLayerSourceProfile.mjs';
import {
  IV125_LOWTRI_SOURCE_SHA256 as PARENT_SHA,
  IV125_LOWTRI_BUILDING_SCENES as PARENT_SCENES,
  IV125_LOWTRI_BUILDING_PARTS as PARENT_PARTS,
  IV125_LOWTRI_FLOORS as PARENT_FLOORS,
} from '../../src/scripts/privateModelC80R2V93IV125LowtriLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const orderedRootsHash = roots => {
  let hash=2166136261;
  for (const node of roots) hash=Math.imul(hash ^ node,16777619)>>>0;
  return hash.toString(16).padStart(8,'0');
};

test('owner-preferred combined source uses exact 344-scene GLB, does not replace old sources',()=>{
  assert.equal(SHA,'d526e9c452c336416fdd6e8f670cb7a0289490738845e71e3dc60934cac3e79a');
  assert.notEqual(SHA,PARENT_SHA);
  assert.equal(COUNT,344);
  assert.deepEqual(OPTIN,{NORMAL_2F:340,MAINTENANCE_2F:341,BOTH:342,FOCUS:343});
  assert.equal(PARTS,PARENT_PARTS);
  assert.equal(FLOORS,PARENT_FLOORS);
  for(const index of [295,296,297,298,299,300,301,302,336,337,338,339])
    assert.equal(SCENES[index],PARENT_SCENES[index]);
});

test('RAW GLB scene 340-343 ordered roots and source-linked MJ01 share one lowtri IV',()=>{
  const cases=[
    [340,336,'2F',160,'6f1bd76f',11667,true],
    [341,337,'2F',159,'e4be1440',11667,false],
    [342,338,'BOTH',398,'9313bd89',11668,true],
    [343,339,'2F',9,'7fd5924e',null,false],
  ];
  for(const [index,prior,floor,count,hash,tech,plexi] of cases){
    const scene=SCENES[index],roots=scene.rootNodes,review=REVIEW[index];
    assert.equal(scene.floor,floor);
    assert.equal(roots.length,count);
    assert.equal(orderedRootsHash(roots),hash);
    assert.equal(roots.filter(n=>n===IV).length,1);
    assert.equal(roots.filter(n=>n===WC).length,1);
    for(const old of [HIGH,TWIN,11645,11646,11653,11654,5839,5840,5841,5887,5888])
      assert.equal(roots.includes(old),false);
    assert.equal(roots.includes(11587),plexi);
    if(tech!==null){
      assert.equal(roots.filter(n=>n===tech).length,1);
      assert.equal(roots.length,PARENT_SCENES[prior].rootNodes.length+1);
    }else{
      for(const outlet of [11637,11638,11639,11640,11641,11642])
        assert.equal(roots.includes(outlet),true);
    }
    assert.ok(review.some(root=>root.node===IV));
    assert.ok(review.some(root=>root.node===WC));
    assert.ok(Object.isFrozen(roots));
    assert.match(scene.name,/WORK_TEST_HOST_HOLD$/);
  }
});

test('wrong ancestor GLB SHA is not a substitute for exact combined source',()=>{
  for(const index of [340,341,342,343]){
    const wrong=resolveBuildingPartLayerBindings({
      gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:PARENT_SHA,
      sceneIndex:index,activeSceneRoot:null,area:'D',floor:index===342?'BOTH':'2F',
    });
    assert.equal(wrong.sourceVerified,false);
    assert.deepEqual(wrong.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
  }
});
