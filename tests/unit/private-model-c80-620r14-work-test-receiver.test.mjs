import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R14_GLB_SHA256 as SHA, C80_620R14_GLB_BYTES as BYTES, C80_620R14_ZIP_DRIVE_ID as ZIP,
 C80_620R14_SCENES as SPECS, C80_620R14_COW_ALIASES as ALIASES, C80_620R14_REMOVED_ROOTS as REMOVED,
 C80_620R14_ADDED_ROOTS as ADDED, isC80620R14SourceScene,
} from '../../src/scripts/privateModelC80620R14SourceProfile.mjs';
import {C80_620R13_GLB_SHA256,C80_620R13_COW_ALIASES} from '../../src/scripts/privateModelC80620R13SourceProfile.mjs';
import {resolveC80620R14SceneIndex,c80620R14ReviewProfile} from '../../src/scripts/privateModelC80620R14FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
import {collectElectricalPoints} from '../../src/scripts/privateModelElectricalChecklist.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r14-owner-checklist-electrical-20261117';

test('C80 620R14 floor roles map to its own six scenes on top of 620R13',()=>{
 assert.deepEqual([resolveC80620R14SceneIndex('1F'),resolveC80620R14SceneIndex('2F'),resolveC80620R14SceneIndex('BOTH'),
  resolveC80620R14SceneIndex('BOTH','ONE_OPEN'),resolveC80620R14SceneIndex('BOTH','STACKED'),resolveC80620R14SceneIndex('BOTH','CLOSED',true)],
  [638,639,640,641,642,643]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[632,633,634,635,636,637]);
 assert.equal(isC80620R14SourceScene({},'0'.repeat(64),640,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R13_GLB_SHA256);
 assert.equal(ALIASES,C80_620R13_COW_ALIASES,'no node is replaced');
});

test('C80 620R14 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R14_GLB_SHA256&&!c80620r14)throw new Error('C80_620R14_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r14) gltf.scene=c80620r14[640];') && index.includes('else if(c80620r13) gltf.scene=c80620r13[634];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R14_GLB_SHA256 && runtime?.isC80620R14)'));
 assert.ok(tech.includes('loadedSha === C80_620R14_GLB_SHA256 ? c80620R14ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R14_OWNER_CHECKLIST_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R13_OWNER_REVIEW_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R14 optional GLB: soffit duplicate out, cord and owner sockets in 2F/BOTH, checklist IDs',
 {skip:!process.env.C80_620R14_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R14_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R14SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const roots=json.scenes[+i].nodes,prior=json.scenes[spec.parent].nodes;
  const expected=prior.filter(n=>!REMOVED.includes(n));
  assert.deepEqual(roots,spec.floor==='1F'?expected:[...expected,...ADDED],'roots of '+i);
 }
 assert.ok(json.scenes[634].nodes.includes(2661),'620R13 scenes keep the soffit light');
 const review=c80620R14ReviewProfile(json,SHA,640).roots[640].map(r=>r.node);
 for(const n of ADDED) assert.ok(review.includes(n),'review root '+n);
 // The new sockets get checklist IDs from their names.
 const names=ADDED.map(n=>json.nodes[n].name);
 const root={name:'scene',parent:null,children:[],traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}};
 for(const name of names) root.children.push({name,isMesh:true,parent:root,children:[],traverse(fn){fn(this);}});
 const ids=collectElectricalPoints(root,()=>({min:{x:0,y:0,z:0},max:{x:0,y:0,z:0}})).map(i=>i.id);
 assert.deepEqual(ids.sort(),['2F-PARVEKE-JOHTO','2F-PR-JAAKAAPPI','2F-PR-PEILIKAAPPI']);
 const bad=structuredClone(json); bad.scenes[640].nodes.push(2661);
 assert.equal(isC80620R14SourceScene(bad,SHA,640,'BOTH'),false,'the soffit duplicate cannot return');
});
