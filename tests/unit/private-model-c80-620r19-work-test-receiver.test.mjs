import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R19_GLB_SHA256 as SHA, C80_620R19_GLB_BYTES as BYTES, C80_620R19_ZIP_DRIVE_ID as ZIP,
 C80_620R19_SCENES as SPECS, C80_620R19_COW_ALIASES as ALIASES, C80_620R19_ROOT_REPLACEMENTS as REPL,
 C80_620R19_ILP4_ROOT as ILP4, isC80620R19SourceScene,
} from '../../src/scripts/privateModelC80620R19SourceProfile.mjs';
import {C80_620R18_GLB_SHA256,C80_620R18_COW_ALIASES} from '../../src/scripts/privateModelC80620R18SourceProfile.mjs';
import {resolveC80620R19SceneIndex,c80620R19ReviewProfile} from '../../src/scripts/privateModelC80620R19FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r19-ilp4-pa2-lstep-donors-20261118';

test('C80 620R19 floor roles map to its own six scenes on top of 620R18',()=>{
 assert.deepEqual([resolveC80620R19SceneIndex('1F'),resolveC80620R19SceneIndex('2F'),resolveC80620R19SceneIndex('BOTH'),
  resolveC80620R19SceneIndex('BOTH','ONE_OPEN'),resolveC80620R19SceneIndex('BOTH','STACKED'),resolveC80620R19SceneIndex('BOTH','CLOSED',true)],
  [668,669,670,671,672,673]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[662,663,664,665,666,667]);
 assert.equal(isC80620R19SourceScene({},'0'.repeat(64),670,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R18_GLB_SHA256);
 for(const [k,v] of Object.entries(C80_620R18_COW_ALIASES))assert.deepEqual(ALIASES[k],v,'parent alias '+k);
 assert.deepEqual([12542,12543,12544].map(n=>ALIASES[n]?.orig),[12158,12159,12160]);
 assert.equal(ALIASES[12542].mesh,4707);
 assert.ok(!(ILP4 in ALIASES));
 assert.deepEqual(REPL,{12483:12541,12160:12544,8747:12545,8749:12546,8751:12547,8753:12548});
});

test('C80 620R19 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R19_GLB_SHA256&&!c80620r19)throw new Error('C80_620R19_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r19) gltf.scene=c80620r19[670];') && index.includes('else if(c80620r18) gltf.scene=c80620r18[664];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R19_GLB_SHA256 && runtime?.isC80620R19)'));
 assert.ok(tech.includes('loadedSha === C80_620R19_GLB_SHA256 ? c80620R19ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R19 || is620R18 || is620R17 || is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R19_ILP4_PA2_LSTEP_DONORS_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R18_BATH_ROOM_HEIGHT_2350_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R19 optional GLB: four-leg stand, PA2 1F hot riser keeps its water binding, L-step west wall',{skip:!process.env.C80_620R19_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R19_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R19SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  assert.deepEqual(json.scenes[+i].nodes,json.scenes[spec.parent].nodes.map(n=>REPL[n]??n),'roots of '+i);
 }
 assert.ok(c80620R19ReviewProfile(json,SHA,670).roots[670].length>0);
 // 1F: the moved PA2 hot riser leaf still resolves as a technical water node through its COW aliases.
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,668,12542)?.id,'technical-water');
 assert.ok(json.scenes[668].nodes.includes(12544)&&!json.scenes[668].nodes.includes(12160));
 assert.equal(json.nodes[ILP4].children.length,2);
 assert.deepEqual([12545,12546,12547,12548].map(n=>json.nodes[n].extras.westEndWorkingZ),[0,0,0,0]);
 assert.ok(!json.scenes[669].nodes.some(n=>n>=12535),'2F unchanged');
});
