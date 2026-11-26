import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R12_GLB_SHA256 as SHA, C80_620R12_GLB_BYTES as BYTES, C80_620R12_ZIP_DRIVE_ID as ZIP,
 C80_620R12_SCENES as SPECS, C80_620R12_COW_ALIASES as ALIASES, C80_620R12_ROOT_REPLACEMENTS as REPL,
 C80_620R12_REMOVED_ROOTS as REMOVED, C80_620R12_K10_VALVE_ROOT as VALVE, isC80620R12SourceScene,
} from '../../src/scripts/privateModelC80620R12SourceProfile.mjs';
import {C80_620R11_GLB_SHA256,C80_620R11_COW_ALIASES} from '../../src/scripts/privateModelC80620R11SourceProfile.mjs';
import {resolveC80620R12SceneIndex,c80620R12ReviewProfile} from '../../src/scripts/privateModelC80620R12FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r12-k10-duct-ilp-grounded-20261117';

test('C80 620R12 floor roles map to its own six scenes on top of 620R11',()=>{
 assert.deepEqual([resolveC80620R12SceneIndex('1F'),resolveC80620R12SceneIndex('2F'),resolveC80620R12SceneIndex('BOTH'),
  resolveC80620R12SceneIndex('BOTH','ONE_OPEN'),resolveC80620R12SceneIndex('BOTH','STACKED'),resolveC80620R12SceneIndex('BOTH','CLOSED',true)],
  [626,627,628,629,630,631]);
 assert.equal(resolveC80620R12SceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[620,621,622,623,624,625]);
 assert.equal(isC80620R12SourceScene({},'0'.repeat(64),628,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R11_GLB_SHA256);
 // The regrouped outdoor unit root has no receipt identity; the moved duct keeps that of n12096.
 assert.equal(ALIASES[12469],undefined);
 assert.equal(ALIASES[12483],undefined);
 assert.deepEqual({orig:ALIASES[12480].orig,mesh:ALIASES[12480].mesh},{orig:12096,mesh:4688});
 assert.equal(Object.keys(ALIASES).length,Object.keys(C80_620R11_COW_ALIASES).length);
});

test('C80 620R12 viewer, inheritance, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R12_GLB_SHA256&&!c80620r12)throw new Error('C80_620R12_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r12) gltf.scene=c80620r12[628];') && index.includes('else if(c80620r11) gltf.scene=c80620r11[622];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R12_GLB_SHA256 && runtime?.isC80620R12)'));
 assert.ok(tech.includes('loadedSha === C80_620R12_GLB_SHA256 ? c80620R12ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256') && concealed.includes('path: [12467, 10060]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R12_OWNER_REVIEW_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R11_CLEARANCE_WORK_TEST_CANDIDATE,'),
  'the newest candidate is listed first and 620R11 stays available');
});

test('authentic 620R12 optional GLB: 620R11 exact roots, duct at the valve, one valve, grounded outdoor unit',
 {skip:!process.env.C80_620R12_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R12_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R12SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const roots=json.scenes[+i].nodes,prior=json.scenes[spec.parent].nodes;
  assert.deepEqual(roots,prior.filter(n=>!REMOVED.includes(n)).map(n=>REPL[n]??n),'roots of '+i);
  for(const [o,n] of Object.entries(REPL))
   assert.equal(roots.includes(n),spec.floor!=='2F','fix root '+n+' in '+i),assert.ok(!roots.includes(+o),'old root '+o+' in '+i);
  assert.ok(!roots.includes(12092),'duplicate valve in '+i);
  assert.equal(roots.includes(VALVE),spec.floor!=='2F','owner-point valve in '+i);
 }
 // Old scenes still carry the old roots: 620R11 stays viewable from the same file chain.
 assert.ok(json.scenes[622].nodes.includes(12092)&&json.scenes[622].nodes.includes(12096)&&json.scenes[622].nodes.includes(12469));
 // The moved duct keeps the ventilation identity of n12096; the valve joins the same layer.
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,628,12480)?.id,'technical-ventilation');
 for(const n of json.nodes[VALVE].children)
  assert.deepEqual([resolveC80SuccessorTechnicalNode(json,SHA,628,n)?.id,resolveC80SuccessorTechnicalNode(json,SHA,628,n)?.storey],['technical-ventilation','1F']);
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,628,10060)?.id!==undefined,true,'T-collector keeps receipt identity');
 const review=c80620R12ReviewProfile(json,SHA,628);
 assert.deepEqual(review.floors,json.asset.extras.viewerFloorScenes);
 const reviewRoots=review.roots[628].map(r=>r.node);
 assert.ok(reviewRoots.includes(12480)&&reviewRoots.includes(VALVE)&&!reviewRoots.includes(12092)&&!reviewRoots.includes(12096));
 assert.equal(c80620R12ReviewProfile(json,SHA,627).roots[627].some(r=>r.node===VALVE),false);
 const bad=structuredClone(json); bad.scenes[628].extras.asBuilt=true;
 assert.equal(isC80620R12SourceScene(bad,SHA,628,'BOTH'),false);
 const swapped=structuredClone(json); swapped.scenes[628].nodes.push(12092);
 assert.equal(isC80620R12SourceScene(swapped,SHA,628,'BOTH'),false,'the duplicate valve cannot return');
 const lifted=structuredClone(json); lifted.nodes[12482].translation=[0,0,0];
 assert.equal(isC80620R12SourceScene(lifted,SHA,626,'1F'),false,'the feet drop is pinned');
 const mesh=structuredClone(json); mesh.nodes[12480].mesh=4548;
 assert.equal(isC80620R12SourceScene(mesh,SHA,628,'BOTH'),false,'the moved duct mesh is pinned');
});
