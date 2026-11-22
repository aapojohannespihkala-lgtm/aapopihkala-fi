import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R15_GLB_SHA256 as SHA, C80_620R15_GLB_BYTES as BYTES, C80_620R15_ZIP_DRIVE_ID as ZIP,
 C80_620R15_SCENES as SPECS, C80_620R15_COW_ALIASES as ALIASES, C80_620R15_ROOT_REPLACEMENTS as REPL,
 C80_620R15_ADDED_1F_ROOTS as ADD1F, C80_620R15_ADDED_2F_ROOTS as ADD2F, isC80620R15SourceScene,
} from '../../src/scripts/privateModelC80620R15SourceProfile.mjs';
import {C80_620R14_GLB_SHA256,C80_620R14_COW_ALIASES} from '../../src/scripts/privateModelC80620R14SourceProfile.mjs';
import {resolveC80620R15SceneIndex,c80620R15ReviewProfile} from '../../src/scripts/privateModelC80620R15FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
import {collectElectricalPoints} from '../../src/scripts/privateModelElectricalChecklist.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r15-owner-review-late-20261117';

test('C80 620R15 floor roles map to its own six scenes on top of 620R14',()=>{
 assert.deepEqual([resolveC80620R15SceneIndex('1F'),resolveC80620R15SceneIndex('2F'),resolveC80620R15SceneIndex('BOTH'),
  resolveC80620R15SceneIndex('BOTH','ONE_OPEN'),resolveC80620R15SceneIndex('BOTH','STACKED'),resolveC80620R15SceneIndex('BOTH','CLOSED',true)],
  [644,645,646,647,648,649]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[638,639,640,641,642,643]);
 assert.equal(isC80620R15SourceScene({},'0'.repeat(64),646,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R14_GLB_SHA256);
 // Unchanged 620R14 aliases are carried; COW copies of aliased roots keep the original identity.
 for(const [n,a] of Object.entries(C80_620R14_COW_ALIASES)) if(!(n in ALIASES)) assert.fail('lost alias '+n);
 assert.equal(ALIASES[12501].orig,C80_620R14_COW_ALIASES[12397].orig);
 assert.equal(ALIASES[12502].orig,C80_620R14_COW_ALIASES[12401].orig);
});

test('C80 620R15 viewer, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R15_GLB_SHA256&&!c80620r15)throw new Error('C80_620R15_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r15) gltf.scene=c80620r15[646];') && index.includes('else if(c80620r14) gltf.scene=c80620r14[640];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R15_GLB_SHA256 && runtime?.isC80620R15)'));
 assert.ok(tech.includes('loadedSha === C80_620R15_GLB_SHA256 ? c80620R15ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R15 || is620R14 || is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R15_OWNER_REVIEW_LATE_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R14_OWNER_CHECKLIST_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R15 optional GLB: COW roots, added light and conduit, checklist IDs',
 {skip:!process.env.C80_620R15_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R15_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R15SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const prior=json.scenes[spec.parent].nodes.map(n=>REPL[n]??n);
  assert.deepEqual(json.scenes[+i].nodes,[...prior,...(spec.floor!=='2F'?ADD1F:[]),...(spec.floor!=='1F'?ADD2F:[])],'roots of '+i);
 }
 assert.ok(json.scenes[640].nodes.includes(11316),'620R14 scenes keep their own bathroom ceiling');
 const review=c80620R15ReviewProfile(json,SHA,646).roots[646].map(r=>r.node);
 for(const n of [12503,12504,12505,12511]) assert.ok(review.includes(n),'review root '+n);
 const names=[12503,12504,12507,12508,12509,12511].map(n=>json.nodes[n].name);
 const root={name:'scene',parent:null,children:[],traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}};
 for(const name of names) root.children.push({name,isMesh:true,parent:root,children:[],traverse(fn){fn(this);}});
 const ids=collectElectricalPoints(root,()=>({min:{x:0,y:0,z:0},max:{x:0,y:0,z:0}})).map(i=>i.id);
 assert.deepEqual(ids.sort(),['1F-PR-10','1F-PR-11','1F-PR-14','1F-VALAISIN-VAATEHUONE','2F-PARVEKE-JOHTO','2F-PR-PEILIKAAPPI']);
 const bad=structuredClone(json); bad.nodes[12514].children.push(12068);
 assert.equal(isC80620R15SourceScene(bad,SHA,646,'BOTH'),false,'the VP1 valve cannot return');
});
