import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  C80_R31_9E0B_WORK_TEST_ID as ID,
  C80_R31_9E0B_SOURCE as SOURCE,
  C80_R31_9E0B_VIEWS as VIEWS,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import {isAuthenticatedC80R31LayerSession as allow} from '../../src/scripts/privateModelC80R31LayerGate.mjs';

const makeProof=()=>{
  const root={name:'verified R31 D normal'},gltf={
    scenes:Array(SOURCE.sceneCount),scene:root,
  };
  gltf.scenes[VIEWS.dNormal.sceneIndex]=root;
  return {gltf,sha:SOURCE.glbSha256,session:{
    r31ViewsVerified:true,candidateId:ID,contract:SOURCE,gltf,
    defaultRoot:root,sceneIndex:VIEWS.dNormal.sceneIndex,
    authenticatedSha:SOURCE.glbSha256,
  }};
};
test('R31 layer handoff accepts only already authenticated 769..772 four-view source',()=>{
  const {gltf,sha,session}=makeProof();
  assert.equal(allow(gltf,sha,session),true);
  assert.deepEqual(Object.keys(VIEWS),['dNormal','dService','upperNormal','upperService']);
  assert.equal(VIEWS.dNormal.sceneIndex,769);
  assert.equal(VIEWS.upperService.sceneIndex,772);
});
test('stale R22, forged candidate, copied contract or wrong SHA all fail closed',()=>{
  const {gltf,sha,session}=makeProof();
  assert.equal(allow(gltf,'0'.repeat(64),session),false);
  assert.equal(allow(gltf,sha,{...session,candidateId:'R22'}),false);
  assert.equal(allow(gltf,sha,{...session,candidateId:'c80-r31-r300-sc759-sc760-work-test'}),false);
  assert.equal(allow(gltf,sha,{...session,contract:{...SOURCE}}),false);
  assert.equal(allow(gltf,sha,{...session,authenticatedSha:'0'.repeat(64)}),false);
  assert.equal(allow(gltf,sha,{...session,r31ViewsVerified:false}),false);
  assert.equal(allow(gltf,sha,null),false);
});
test('scene swaps, stale glTF object and unreviewed mounted root fail closed',()=>{
  const {gltf,sha,session}=makeProof();
  assert.equal(allow({...gltf},sha,session),false);
  assert.equal(allow(gltf,sha,{...session,gltf:{...gltf}}),false);
  assert.equal(allow(gltf,sha,{...session,defaultRoot:{}}),false);
  assert.equal(allow(gltf,sha,{...session,sceneIndex:VIEWS.dService.sceneIndex}),false);
  assert.equal(allow({...gltf,scene:{}},sha,session),false);
  const hidden=gltf.scenes[VIEWS.dNormal.sceneIndex];
  gltf.scenes[VIEWS.dNormal.sceneIndex]={};
  assert.equal(allow(gltf,sha,session),false);
  gltf.scenes[VIEWS.dNormal.sceneIndex]=hidden;
  gltf.scenes.pop();
  assert.equal(allow(gltf,sha,session),false);
});
test('actual viewer forwards only post-review source proof to R31 Layers owner',()=>{
  const s=readFileSync('src/pages/private-model/index.astro','utf8');
  assert.match(s,/isAuthenticatedC80R31LayerSession\(gltf, layersLoadedSha, session\)/);
  assert.match(s,/r31LayerSourceSha = r31LayersVerified\s*\?\s*layersLoadedSha/);
  assert.match(s,/r31ViewsVerified:\s*true/);
  assert.match(s,/applyLoadedModel\(gltf, 'work-test', `WORK_TEST: \$\{candidate\.label\}`, null, null, r31LayersProof\)/);
  assert.match(s,/layersEnabled = r31LayerSourceSha !== null/);
});
