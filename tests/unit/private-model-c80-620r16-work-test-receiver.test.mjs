import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R16_GLB_SHA256 as SHA, C80_620R16_GLB_BYTES as BYTES, C80_620R16_ZIP_DRIVE_ID as ZIP,
 C80_620R16_SCENES as SPECS, C80_620R16_COW_ALIASES as ALIASES, C80_620R16_ROOT_REPLACEMENTS as REPL,
 C80_620R16_REMOVED_ROOTS as REMOVED, C80_620R16_BATH_CEILING_ROOT as BATH, isC80620R16SourceScene,
} from '../../src/scripts/privateModelC80620R16SourceProfile.mjs';
import {C80_620R15_GLB_SHA256,C80_620R15_COW_ALIASES} from '../../src/scripts/privateModelC80620R15SourceProfile.mjs';
import {resolveC80620R16SceneIndex,c80620R16ReviewProfile} from '../../src/scripts/privateModelC80620R16FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80437SuccessorBuildingNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r16-bath-ceiling-kso125-20261117';

test('C80 620R16 floor roles map to its own six scenes on top of 620R15',()=>{
 assert.deepEqual([resolveC80620R16SceneIndex('1F'),resolveC80620R16SceneIndex('2F'),resolveC80620R16SceneIndex('BOTH'),
  resolveC80620R16SceneIndex('BOTH','ONE_OPEN'),resolveC80620R16SceneIndex('BOTH','STACKED'),resolveC80620R16SceneIndex('BOTH','CLOSED',true)],
  [650,651,652,653,654,655]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[644,645,646,647,648,649]);
 assert.equal(isC80620R16SourceScene({},'0'.repeat(64),652,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R15_GLB_SHA256);
 for(const n of Object.keys(C80_620R15_COW_ALIASES)) assert.ok(n in ALIASES,'lost alias '+n);
 assert.equal(ALIASES[12518].orig,C80_620R15_COW_ALIASES[12501].orig);
 assert.equal(ALIASES[12517].orig,C80_620R15_COW_ALIASES[12500].orig);
 assert.ok(!(BATH in ALIASES),'the bathroom ceiling is deliberately unbound like the 1F ceiling');
});

test('C80 620R16 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R16_GLB_SHA256&&!c80620r16)throw new Error('C80_620R16_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r16) gltf.scene=c80620r16[652];') && index.includes('else if(c80620r15) gltf.scene=c80620r15[646];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R16_GLB_SHA256 && runtime?.isC80620R16)'));
 assert.ok(tech.includes('loadedSha === C80_620R16_GLB_SHA256 ? c80620R16ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R16_BATH_CEILING_KSO125_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R15_OWNER_REVIEW_LATE_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R16 optional GLB: unbound bathroom ceiling, one exhaust duct, old twin-T legs gone',
 {skip:!process.env.C80_620R16_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R16_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R16SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const prior=json.scenes[spec.parent].nodes.filter(n=>!REMOVED.includes(n)).map(n=>REPL[n]??n);
  assert.deepEqual(json.scenes[+i].nodes,prior,'roots of '+i);
  assert.ok(!json.scenes[+i].nodes.includes(12400),'twin-T legs out of '+i);
 }
 assert.ok(json.scenes[646].nodes.includes(12400),'620R15 scenes keep their own data');
 assert.equal(resolveC80437SuccessorBuildingNode(json,SHA,652,BATH,[BATH]),null,'bathroom ceiling is not in the hidden-by-default ceiling layer');
 const review=c80620R16ReviewProfile(json,SHA,652).roots[652].map(r=>r.node);
 assert.ok(review.includes(12518),'exhaust root stays in the technical review');
 const bad=structuredClone(json); bad.scenes[652].nodes.push(12400);
 assert.equal(isC80620R16SourceScene(bad,SHA,652,'BOTH'),false,'the twin-T legs cannot return');
});
