import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R18_GLB_SHA256 as SHA, C80_620R18_GLB_BYTES as BYTES, C80_620R18_ZIP_DRIVE_ID as ZIP,
 C80_620R18_SCENES as SPECS, C80_620R18_COW_ALIASES as ALIASES, C80_620R18_ROOT_REPLACEMENTS as REPL,
 C80_620R18_BATH_CEILING_ROOT as BATH, isC80620R18SourceScene,
} from '../../src/scripts/privateModelC80620R18SourceProfile.mjs';
import {C80_620R17_GLB_SHA256,C80_620R17_COW_ALIASES} from '../../src/scripts/privateModelC80620R17SourceProfile.mjs';
import {resolveC80620R18SceneIndex,c80620R18ReviewProfile} from '../../src/scripts/privateModelC80620R18FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80437SuccessorBuildingNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r18-bath-room-height-2350-20261118';

test('C80 620R18 floor roles map to its own six scenes on top of 620R17',()=>{
 assert.deepEqual([resolveC80620R18SceneIndex('1F'),resolveC80620R18SceneIndex('2F'),resolveC80620R18SceneIndex('BOTH'),
  resolveC80620R18SceneIndex('BOTH','ONE_OPEN'),resolveC80620R18SceneIndex('BOTH','STACKED'),resolveC80620R18SceneIndex('BOTH','CLOSED',true)],
  [662,663,664,665,666,667]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[656,657,658,659,660,661]);
 assert.equal(isC80620R18SourceScene({},'0'.repeat(64),664,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R17_GLB_SHA256);
 for(const [k,v] of Object.entries(C80_620R17_COW_ALIASES))assert.deepEqual(ALIASES[k],v,'parent alias '+k);
 assert.deepEqual([12522,12523,12524,12525,12526,12527,12528,12529,12530,12531,12532,12533,12534].map(n=>ALIASES[n]?.orig),
  [11918,11924,11930,11936,11942,12278,12279,12298,1708,1709,1710,1711,12329]);
 assert.ok(!(BATH in ALIASES));
 assert.deepEqual(REPL,{12520:12521,11918:12522,11924:12523,11930:12524,11936:12525,11942:12526,12298:12529,12485:12534});
});

test('C80 620R18 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R18_GLB_SHA256&&!c80620r18)throw new Error('C80_620R18_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r18) gltf.scene=c80620r18[664];') && index.includes('else if(c80620r17) gltf.scene=c80620r17[658];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R18_GLB_SHA256 && runtime?.isC80620R18)'));
 assert.ok(tech.includes('loadedSha === C80_620R18_GLB_SHA256 ? c80620R18ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R18 || is620R17 || is620R16 || is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R18_BATH_ROOM_HEIGHT_2350_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R17_BATH_CEILING_NO_HOLE_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R18 optional GLB: ceiling at room height 2350 mm, lights and valve with it',{skip:!process.env.C80_620R18_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R18_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R18SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  assert.deepEqual(json.scenes[+i].nodes,json.scenes[spec.parent].nodes.map(n=>REPL[n]??n),'roots of '+i);
 }
 assert.equal(resolveC80437SuccessorBuildingNode(json,SHA,664,BATH,[BATH]),null);
 assert.ok(c80620R18ReviewProfile(json,SHA,664).roots[664].length>0);
 assert.equal(json.nodes[BATH].extras.z,2.43);
 assert.equal(json.nodes[BATH].extras.roomHeightM_OWNER_APPROX,2.35);
 assert.equal(json.nodes[BATH].extras.floorZ,0.08);
 for(const n of [12522,12523,12524,12525,12526])assert.equal(json.nodes[n].translation[1],2.421,'light '+n);
 assert.equal(json.nodes[12530].matrix,undefined);
 assert.ok(!json.nodes[12534].children.includes(1745)&&json.nodes[12534].children.includes(12530));
});
