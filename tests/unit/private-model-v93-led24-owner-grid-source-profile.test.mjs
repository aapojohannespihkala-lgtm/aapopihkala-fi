import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V93_LED24_GRID_SOURCE_SHA256 as SHA,
  V93_LED24_GRID_SCENE_COUNT as COUNT,
  V93_LED24_GRID_FLOORS as FLOORS,
  V93_LED24_GRID_OPTIN as OPTIN,
  V93_LED24_GRID_BUILDING_PARTS as PARTS,
  V93_LED24_GRID_BUILDING_SCENES as SCENES,
  V93_LED24_GRID_TECHNICAL_REVIEW_ROOTS as REVIEW,
  V93_LED24_GRID_ORDERED_ROOT_FNV as SOURCE_FNV,
  V93_LED24_GRID_MARKER_ROOTS as MARKERS,
} from '../../src/scripts/privateModelC80R2V93LED24GridLayerSourceProfile.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const fnv = ids => {
  let h=2166136261;
  for (const n of ids) h=Math.imul(h ^ n,16777619)>>>0;
  return h.toString(16).padStart(8,'0');
};

test('owner-accepted LED24 grid is a separate, fail-closed source profile', () => {
  assert.equal(SHA,'2791ede06c7b50c9cffe27c64fc17a3d975b981c03850067eb5d814ba9e79944');
  assert.equal(COUNT,328);
  assert.deepEqual(OPTIN,{'1F':325,'2F':326,BOTH:327});
  assert.deepEqual(FLOORS,{'1F':295,'2F':296,BOTH:297});
  assert.deepEqual(PARTS,{}); // no inherited as-built/building source identity
  assert.deepEqual(Object.keys(SCENES),['325','326','327']);
  assert.deepEqual(Object.values(SCENES).map(s=>s.floor),['1F','2F','BOTH']);
});

test('original GLB ordered scene roots and 18+6 LED root separation are exact', () => {
  for(const sceneIndex of [325,326,327]) {
    const roots=SCENES[sceneIndex].rootNodes;
    assert.ok(Object.isFrozen(roots));
    assert.equal(roots.length,sceneIndex===327?12:6);
    assert.equal(new Set(roots).size,roots.length);
    assert.equal(fnv(roots),SOURCE_FNV[sceneIndex]);
    for(const {node,name} of REVIEW[sceneIndex]) {
      assert.equal(roots.filter(x=>x===node).length,1);
      assert.ok(name.endsWith('_ROOT') || name.endsWith('_WORK_TEST_HOST_HOLD'));
    }
    assert.ok(SCENES[sceneIndex].name.includes('GRID_APPROVED_'));
    assert.ok(SCENES[sceneIndex].name.includes('WORK_TEST_HOST_HOLD'));
  }
  assert.equal(SCENES[325].rootNodes.includes(MARKERS['1F']),true);
  assert.equal(SCENES[325].rootNodes.includes(MARKERS['2F']),false);
  assert.equal(SCENES[326].rootNodes.includes(MARKERS['2F']),true);
  assert.equal(SCENES[326].rootNodes.includes(MARKERS['1F']),false);
  assert.equal(SCENES[326].rootNodes.includes(MARKERS.KITCHEN_EXISTING),true);
  assert.equal(SCENES[327].rootNodes.includes(MARKERS['1F']),true);
  assert.equal(SCENES[327].rootNodes.includes(MARKERS['2F']),true);
  assert.equal(SCENES[327].rootNodes.includes(MARKERS.KITCHEN_EXISTING),true);
});

test('unknown ancestor and wrong GLB SHA cannot inherit LED grid source classification', () => {
  for(const [floor,sceneIndex] of [['1F',325],['2F',326],['BOTH',327]]) {
    for(const loadedSourceSha256 of [
      '16681e74e967fdc9930673258de9f2e09e136006d156501fe9349118885988bc',
      '3a43dd443502e25171ff8284f0cc067c69c6d769fd151b61b416ca69698712ac',
    ]) {
      const result=resolveBuildingPartLayerBindings({
        gltf:{}, expectedSourceSha256:SHA, loadedSourceSha256,
        sceneIndex,activeSceneRoot:null,area:'D',floor,
      });
      assert.equal(result.sourceVerified,false);
      assert.deepEqual(result.excluded.map(x=>x.reason),['SOURCE_SHA_MISMATCH']);
    }
  }
});
