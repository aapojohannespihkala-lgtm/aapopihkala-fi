import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IV125_LOWTRI_SOURCE_SHA256 as SHA, IV125_LOWTRI_SOURCE_SCENE_COUNT as COUNT,
  IV125_LOWTRI_FLOORS as FLOORS, IV125_LOWTRI_BUILDING_PARTS as PARTS,
  IV125_LOWTRI_BUILDING_SCENES as SCENES, IV125_LOWTRI_OPTIN_SCENES as OPTIN,
  IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS as REVIEW, IV125_LOWTRI_FORK_ROOT as ROOT,
  IV125_LOWTRI_OLD_HIGH_TRI_ROOT as OLD, IV125_LOWTRI_OLD_PARALLEL_ROOT as TWIN,
  IV125_LOWTRI_PA1_WASTE_ROOT as PA1,
} from '../../src/scripts/privateModelC80R2V93IV125LowtriLayerSourceProfile.mjs';
import {
  V93_H35H38_SOURCE_SHA256 as BASE_SHA,
  V93_H35H38_BUILDING_SCENES as BASE_SCENES,
  V93_H35H38_BUILDING_PARTS as BASE_PARTS,
} from '../../src/scripts/privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnvRoots = roots => {
  let hash = 2166136261;
  for (const node of roots) hash = Math.imul(hash ^ node, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
};

test('source identity is exact SHA, 340 scenes and opt-in 336-339, default C70/292 unchanged', () => {
  assert.equal(SHA, '556f0e775424845f59632ed2e4c27f8ba62441f8ae4549468b74b22fd957f6f0');
  assert.notEqual(SHA, BASE_SHA);
  assert.equal(COUNT, 340);
  assert.deepEqual(OPTIN, { NORMAL_2F:336, MAINTENANCE_2F:337, BOTH:338, FOCUS:339 });
  assert.deepEqual(FLOORS, {'1F':295,'2F':296,BOTH:297});
  assert.equal(PARTS, BASE_PARTS);
  for(const i of [295,296,297,298,299,300,301,302]) assert.equal(SCENES[i], BASE_SCENES[i]);
});

test('each new scene matches RAW GLB ordered roots and keeps one low-triangle fork, no superseded trunks', () => {
  const verified = [
    [336,'2F',159,'a56ccc51',true,11653],
    [337,'2F',158,'346ca5bc',false,11653],
    [338,'BOTH',397,'4fb92927',true,11654],
    [339,'2F',8,'6eb460a8',false,null],
  ];
  for (const [i,floor,length,hash,plexi,technical] of verified) {
    const scene=SCENES[i],roots=scene.rootNodes;
    assert.equal(scene.floor,floor);
    assert.equal(roots.length,length);
    assert.equal(fnvRoots(roots),hash);
    assert.equal(roots.filter(n=>n===ROOT).length,1);
    for(const obsolete of [OLD,TWIN,11645,11646,5839,5840,5841,5887,5888])
      assert.equal(roots.includes(obsolete),false);
    assert.equal(roots.includes(11587),plexi);
    if(technical !== null) {
      assert.equal(roots.includes(technical),true);
      assert.equal(roots.includes(PA1),true);
    } else {
      assert.equal(roots.includes(11637),true);
      assert.equal(roots.includes(11640),true);
      assert.equal(roots.includes(PA1),false);
    }
    assert.equal(REVIEW[i].some(r=>r.node===ROOT),true);
    assert.equal(Object.isFrozen(roots),true);
    assert.match(scene.name,/WORK_TEST_HOST_HOLD$/);
  }
});

test('wrong GLB SHA fails closed at existing building part source-identity gate', () => {
  for (const index of [336,337,338,339]) {
    const wrong=resolveBuildingPartLayerBindings({
      gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:BASE_SHA,
      sceneIndex:index,activeSceneRoot:null,area:'D',floor:index===338?'BOTH':'2F',
    });
    assert.equal(wrong.sourceVerified,false);
    assert.deepEqual(wrong.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
  }
});
