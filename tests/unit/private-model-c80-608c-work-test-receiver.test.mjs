import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_608C_GLB_SHA256 as SHA, C80_608C_GLB_BYTES as BYTES, C80_608C_ZIP_DRIVE_ID as ZIP,
 C80_608C_SCENES as SPECS, C80_608C_COW_ALIASES as ALIASES, isC80608CSourceScene,
} from '../../src/scripts/privateModelC80608CSourceProfile.mjs';
import {resolveC80608CSceneIndex,c80608CReviewProfile} from '../../src/scripts/privateModelC80608CFloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-608c-owner-fixes-20261115';

test('C80 608C floor roles map to its own six scenes',()=>{
 assert.deepEqual([resolveC80608CSceneIndex('1F'),resolveC80608CSceneIndex('2F'),resolveC80608CSceneIndex('BOTH'),
  resolveC80608CSceneIndex('BOTH','ONE_OPEN'),resolveC80608CSceneIndex('BOTH','STACKED'),resolveC80608CSceneIndex('BOTH','CLOSED',true)],
  [602,603,604,605,606,607]);
 assert.equal(resolveC80608CSceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.keys(SPECS).map(Number),[602,603,604,605,606,607]);
 assert.equal(isC80608CSourceScene({},'0'.repeat(64),604,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
});

test('C80 608C viewer, inheritance, review and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_608C_GLB_SHA256&&!c80608c)throw new Error('C80_608C_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80608c) gltf.scene=c80608c[604];'));
 assert.ok(index.includes('(layersLoadedSha===C80_608C_GLB_SHA256 && runtime?.isC80608C)'));
 assert.ok(index.includes('applyD2FFloorDepthBias(root);'));
 assert.ok(tech.includes('loadedSha === C80_608C_GLB_SHA256 ? c80608CReviewProfile(json,loadedSha,sceneIndex)'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_608C_OWNER_FIXES_WORK_TEST_CANDIDATE,'));
});

test('authentic 608C optional GLB: scenes, COW aliases keep receipt identity, 10060 gone',
 {skip:!process.env.C80_608C_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_608C_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80608CSourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
 }
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,604,10062)?.id,'technical-ventilation','T-collector siblings keep identity via alias');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,604,10060),null,'removed T-collector is not inherited');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,604,11767)?.id,'technical-electrical','moved switch keeps electrical identity');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,603,12359)?.id,'technical-ventilation','new KSO125 duct is ventilation');
 assert.ok(c80608CReviewProfile(json,SHA,604).roots[604].some(r=>r.node===12347));
 assert.deepEqual(c80608CReviewProfile(json,SHA,604).floors,json.asset.extras.viewerFloorScenes);
 const forged=structuredClone(json);
 forged.nodes[12348].matrix[12]+=0.5;
 assert.equal(resolveC80SuccessorTechnicalNode(forged,SHA,602,11767),null,'altered COW node loses alias identity');
 const bad=structuredClone(json); bad.scenes[604].extras.asBuilt=true;
 assert.equal(isC80608CSourceScene(bad,SHA,604,'BOTH'),false);
 assert.equal(Object.keys(ALIASES).length,5);
});
