import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { C80_500_GLB_SHA256, C80_500_GLB_BYTES, resolveC80500ABCSceneIndex } from '../../src/scripts/privateModelC80500WW1974ABCSourceProfile.mjs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
test('C80 500 exact source locks its own 496 BOTH scene and keeps 495 gate',()=>{
  const index=read('../../src/pages/private-model/index.astro');
  assert.ok(index.includes("import {C80_500_GLB_SHA256,resolveC80500ABCScenes}"));
  assert.ok(index.includes("loadedModelSha256(gltf) === C80_500_GLB_SHA256"));
  assert.ok(index.includes("createC80500ABCFloorRuntime({gltf,sha:loadedModelSha256(gltf)"));
  assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_500_GLB_SHA256&&!c80500)throw new Error('C80_500_SOURCE_SCENE_MISMATCH')"));
  assert.ok(index.includes("if(c80500) gltf.scene=c80500[496];"));
  assert.ok(index.includes("else if(c80495) gltf.scene=c80495[489];"));
  assert.equal(resolveC80500ABCSceneIndex('1F'),495);
  assert.equal(resolveC80500ABCSceneIndex('2F'),488);
  assert.equal(resolveC80500ABCSceneIndex('BOTH'),496);
  assert.equal(resolveC80500ABCSceneIndex('BOTH','CLOSED',true),499);
});
test('500 glazing cutaway and ABC technical review route only on source match',()=>{
  const index=read('../../src/pages/private-model/index.astro');
  const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  assert.ok(index.includes('runtime?.isC80500WWABC'));
  assert.ok(index.includes('C80_500_GLB_SHA256&&runtime?.isC80500WWABC'));
  assert.ok(tech.includes('loadedSha === C80_500_GLB_SHA256 ? c80500ABCReviewProfile(json,loadedSha,sceneIndex)'));
  assert.ok(read('../../src/scripts/privateModelC80500WW1974ABCFloorRuntime.mjs').includes('C80_500_ABC_ROOT'));
});
test('500 WORK_TEST catalog Worker and original Drive ZIP match immutable SHA',()=>{
  const id='c80-500-ww1974-abc-l100-20261115';
  const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
  const worker=read('../../worker/privateWorkTest.ts');
  assert.equal(catalog.candidates[id].driveFileId,'1iEXtY9cL8BGGVIUzvU1vs2KpeQctiJum');
  assert.ok(worker.includes("id: '"+id+"'"));
  assert.ok(worker.includes('expectedSize: '+C80_500_GLB_BYTES));
  assert.ok(worker.includes("expectedSha256: '"+C80_500_GLB_SHA256+"'"));
  assert.ok(worker.includes('C80_500_WW1974_ABC_WORK_TEST_CANDIDATE,'));
  assert.ok(worker.includes('WORK_TEST/HOST_HOLD'));
});
