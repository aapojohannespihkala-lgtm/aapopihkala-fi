import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { C80_524_RAIN_GLB_SHA256, C80_524_RAIN_GLB_BYTES } from '../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs';
import { resolveC80524RainSceneIndex, c80524RainReviewProfile } from '../../src/scripts/privateModelC80524RainZonesFloorRuntime.mjs';
import { isC80LayerSuccessorSha, resolveC80437SuccessorReceiptScene, resolveC80437SuccessorTechnicalNode, resolveC80SuccessorNewTechnicalNode } from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('C80 524 opens its own BOTH scene 520 before the 500 gate', () => {
  const index = read('../../src/pages/private-model/index.astro');
  assert.ok(index.includes("loadedModelSha256(gltf) === C80_524_RAIN_GLB_SHA256"));
  assert.ok(index.includes("createC80524RainFloorRuntime({gltf,sha:loadedModelSha256(gltf)"));
  assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_524_RAIN_GLB_SHA256&&!c80524)throw new Error('C80_524_SOURCE_SCENE_MISMATCH')"));
  assert.ok(index.includes("if(c80524) gltf.scene=c80524[520];\n            else if(c80500) gltf.scene=c80500[496];"));
  assert.equal(resolveC80524RainSceneIndex('1F'), 518);
  assert.equal(resolveC80524RainSceneIndex('2F'), 519);
  assert.equal(resolveC80524RainSceneIndex('BOTH'), 520);
  assert.equal(resolveC80524RainSceneIndex('BOTH', 'CLOSED', true), 523);
});

test('524 glazing, cutaway, Sisältö allowlist and technical review route on source match', () => {
  const index = read('../../src/pages/private-model/index.astro');
  const tech = read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  assert.ok(index.includes('(layersLoadedSha===C80_524_RAIN_GLB_SHA256 && runtime?.isC80524Rain)'));
  assert.ok(index.includes('(layersLoadedSha===C80_524_RAIN_GLB_SHA256&&runtime?.isC80524Rain)'));
  assert.match(index.match(/const verifiedChainSourceSha =([\s\S]*?)\? layersLoadedSha : null;/)[1], /layersLoadedSha === C80_524_RAIN_GLB_SHA256 \|\|/);
  assert.ok(tech.includes('loadedSha === C80_524_RAIN_GLB_SHA256 ? c80524RainReviewProfile(json,loadedSha,sceneIndex)'));
  assert.ok(isC80LayerSuccessorSha(C80_524_RAIN_GLB_SHA256));
});

test('524 WORK_TEST catalog, Worker and original Drive ZIP match the immutable SHA', () => {
  const id = 'c80-524-rain-zones-t110-kvv-20261115';
  const catalog = JSON.parse(read('../../.github/work-test-candidates.json'));
  const worker = read('../../worker/privateWorkTest.ts');
  assert.equal(catalog.candidates[id].driveFileId, '1M5ToN7C_tKnhGwLH8D3fMNueMqbjKQZ8');
  assert.ok(worker.includes("id: '" + id + "'"));
  assert.ok(worker.includes('expectedSize: ' + C80_524_RAIN_GLB_BYTES));
  assert.ok(worker.includes("expectedSha256: '" + C80_524_RAIN_GLB_SHA256 + "'"));
  assert.ok(worker.includes('C80_524_RAIN_ZONES_WORK_TEST_CANDIDATE,'));
});

test('real C80 524 GLB: Sisältö inherits, new MEP roots map, rain zones stay out of review', { skip: !process.env.C80_524_GLB_PATH }, () => {
  const bytes = readFileSync(process.env.C80_524_GLB_PATH);
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
  const sha = C80_524_RAIN_GLB_SHA256;
  const scene = resolveC80437SuccessorReceiptScene(json, sha, 520);
  assert.ok(scene);
  const ok = Object.keys(scene.technical).filter(n => resolveC80437SuccessorTechnicalNode(json, sha, 520, +n)).length;
  assert.ok(ok / Object.keys(scene.technical).length > 0.9);
  assert.equal(resolveC80SuccessorNewTechnicalNode(json, sha, 520, 12243)?.id, 'technical-water');
  assert.equal(resolveC80SuccessorNewTechnicalNode(json, sha, 520, 12239)?.id, 'technical-drainage');
  const roots = c80524RainReviewProfile(json, sha, 520).roots[520].map(r => r.node);
  assert.ok(roots.includes(12243) && roots.includes(12239) && roots.includes(12237));
  assert.ok(!roots.includes(12251) && !roots.includes(12238));
});
