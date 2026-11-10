import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_BOTH346_SOURCE_SHA256 as SHA,
  V93_BOTH346_SCENE_COUNT as COUNT,
  V93_BOTH346_FLOORS as FLOORS,
  V93_BOTH346_BUILDING_PARTS as PARTS,
  V93_BOTH346_BUILDING_SCENES as SCENES,
  V93_BOTH346_TECHNICAL_REVIEW_ROOTS as REVIEW,
  V93_BOTH346_SOURCE_ROOT_FNV as SOURCE_FNV,
  V93_BOTH346_1F_NEW_ROOTS as ONE_F,
  V93_BOTH346_2F_ROOTS as TWO_F,
} from '../../src/scripts/privateModelC80R2V93D1F2FCoFitScene346LayerSourceProfile.mjs';
import {
  IVB_MJ01_SERVICE_SOURCE_SHA256 as BASE_SHA,
  IVB_MJ01_SERVICE_BUILDING_SCENES as BASE_SCENES,
  IVB_MJ01_SERVICE_BUILDING_PARTS as BASE_PARTS,
  IVB_MJ01_SERVICE_FLOORS as BASE_FLOORS,
} from '../../src/scripts/privateModelC80R2V93IVBMJ01ServiceCutawayLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnv = a => {
  let v = 2166136261;
  for (const x of a) v = Math.imul(v ^ x, 16777619) >>> 0;
  return v.toString(16).padStart(8,'0');
};

test('V93 scene346 is source exact, append-only and not an as-built claim', () => {
  assert.equal(SHA,'3a43dd443502e25171ff8284f0cc067c69c6d769fd151b61b416ca69698712ac');
  assert.notEqual(SHA,BASE_SHA);
  assert.equal(COUNT,347);
  assert.equal(FLOORS,BASE_FLOORS);
  assert.equal(PARTS,BASE_PARTS);
  for (const k of [295,296,297,298,299,300,301,302,336,337,338,339,340,341,342,343,344,345])
    assert.equal(SCENES[k],BASE_SCENES[k]);
  assert.equal(SCENES[346].floor,'BOTH');
  assert.equal(SCENES[346].name,
    'V93_D1F_OWNER_SAFE_PR0607_D2FWC_IVB47K_MJ01_REV2_BOTH_1F2F_COFIT_WORK_TEST_HOST_HOLD_20261110');
});

test('real scene346 ordered-root FNV, one owner-safe 1F and one IV/MJ01 2F set', () => {
  const roots = SCENES[346].rootNodes;
  assert.equal(roots.length,411);
  assert.equal(new Set(roots).size,roots.length);
  assert.equal(fnv(roots),SOURCE_FNV);
  assert.equal(SOURCE_FNV,'65960bbc');
  for (const n of [...ONE_F,...TWO_F]) assert.equal(roots.filter(x=>x===n).length,1);
  for (const n of [11322,11326,11328,11329,10156,10157,10158,10159,10122,11647,11656,11668])
    assert.equal(roots.includes(n),false);
  assert.ok(Object.isFrozen(roots));
  const review = REVIEW[346];
  for(const entry of review) {
    assert.equal(roots.includes(entry.node),true);
    assert.ok(entry.name.length>8);
  }
  assert.equal(new Set(review.map(x=>x.node)).size,review.length);
});

test('wrong ancestor SHA must fail closed for new scene346', () => {
  for (const wrongSha of [BASE_SHA,'556f0e775424845f59632ed2e4c27f8ba62441f8ae4549468b74b22fd957f6f0']) {
    const out = resolveBuildingPartLayerBindings({
      gltf:{}, expectedSourceSha256:SHA, loadedSourceSha256:wrongSha,
      sceneIndex:346, activeSceneRoot:null, area:'D', floor:'BOTH'
    });
    assert.equal(out.sourceVerified,false);
    assert.deepEqual(out.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
  }
});
