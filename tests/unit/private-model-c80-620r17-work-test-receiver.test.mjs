import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R17_GLB_SHA256 as SHA, C80_620R17_GLB_BYTES as BYTES, C80_620R17_ZIP_DRIVE_ID as ZIP,
 C80_620R17_SCENES as SPECS, C80_620R17_COW_ALIASES as ALIASES, C80_620R17_ROOT_REPLACEMENTS as REPL,
 C80_620R17_BATH_CEILING_ROOT as BATH, isC80620R17SourceScene,
} from '../../src/scripts/privateModelC80620R17SourceProfile.mjs';
import {C80_620R16_GLB_SHA256,C80_620R16_COW_ALIASES} from '../../src/scripts/privateModelC80620R16SourceProfile.mjs';
import {resolveC80620R17SceneIndex,c80620R17ReviewProfile} from '../../src/scripts/privateModelC80620R17FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80437SuccessorBuildingNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r17-bath-ceiling-no-hole-20261117';

test('C80 620R17 floor roles map to its own six scenes on top of 620R16',()=>{
 assert.deepEqual([resolveC80620R17SceneIndex('1F'),resolveC80620R17SceneIndex('2F'),resolveC80620R17SceneIndex('BOTH'),
  resolveC80620R17SceneIndex('BOTH','ONE_OPEN'),resolveC80620R17SceneIndex('BOTH','STACKED'),resolveC80620R17SceneIndex('BOTH','CLOSED',true)],
  [656,657,658,659,660,661]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[650,651,652,653,654,655]);
 assert.equal(isC80620R17SourceScene({},'0'.repeat(64),658,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R16_GLB_SHA256);
 assert.equal(ALIASES,C80_620R16_COW_ALIASES);
 assert.ok(!(BATH in ALIASES));
});

test('C80 620R17 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R17_GLB_SHA256&&!c80620r17)throw new Error('C80_620R17_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r17) gltf.scene=c80620r17[658];') && index.includes('else if(c80620r16) gltf.scene=c80620r16[652];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R17_GLB_SHA256 && runtime?.isC80620R17)'));
 assert.ok(tech.includes('loadedSha === C80_620R17_GLB_SHA256 ? c80620R17ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R17 || is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R17_BATH_CEILING_NO_HOLE_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R16_BATH_CEILING_KSO125_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R17 optional GLB: ceiling without the notch, still unbound',{skip:!process.env.C80_620R17_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R17_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R17SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  assert.deepEqual(json.scenes[+i].nodes,json.scenes[spec.parent].nodes.map(n=>REPL[n]??n),'roots of '+i);
 }
 assert.equal(resolveC80437SuccessorBuildingNode(json,SHA,658,BATH,[BATH]),null);
 assert.ok(c80620R17ReviewProfile(json,SHA,658).roots[658].length>0);
 assert.ok(Math.abs(json.nodes[BATH].extras.areaM2-6.293)<0.01,'ceiling area includes the former notch');
});
