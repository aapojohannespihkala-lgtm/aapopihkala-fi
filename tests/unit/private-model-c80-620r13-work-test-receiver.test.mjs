import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R13_GLB_SHA256 as SHA, C80_620R13_GLB_BYTES as BYTES, C80_620R13_ZIP_DRIVE_ID as ZIP,
 C80_620R13_SCENES as SPECS, C80_620R13_COW_ALIASES as ALIASES, C80_620R13_ROOT_REPLACEMENTS as REPL,
 C80_620R13_REMOVED_ROOTS as REMOVED, C80_620R13_ADDED_ROOTS as ADDED, C80_620R13_CLOSET_VALVE_ROOT as CLOSET_VALVE,
 C80_620R13_K10_VALVE_ROOT as VALVE, isC80620R13SourceScene,
} from '../../src/scripts/privateModelC80620R13SourceProfile.mjs';
import {C80_620R12_GLB_SHA256,C80_620R12_COW_ALIASES} from '../../src/scripts/privateModelC80620R12SourceProfile.mjs';
import {resolveC80620R13SceneIndex,c80620R13ReviewProfile} from '../../src/scripts/privateModelC80620R13FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r13-owner-review-evening-20261117';

test('C80 620R13 floor roles map to its own six scenes on top of 620R12',()=>{
 assert.deepEqual([resolveC80620R13SceneIndex('1F'),resolveC80620R13SceneIndex('2F'),resolveC80620R13SceneIndex('BOTH'),
  resolveC80620R13SceneIndex('BOTH','ONE_OPEN'),resolveC80620R13SceneIndex('BOTH','STACKED'),resolveC80620R13SceneIndex('BOTH','CLOSED',true)],
  [632,633,634,635,636,637]);
 assert.equal(resolveC80620R13SceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[626,627,628,629,630,631]);
 assert.equal(isC80620R13SourceScene({},'0'.repeat(64),634,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R12_GLB_SHA256);
 // Each replaced COW root keeps the receipt identity of the root it replaces.
 for(const [o,n] of Object.entries(REPL)){
  assert.equal(ALIASES[o],undefined,'old alias '+o);
  assert.equal(ALIASES[n].orig,C80_620R12_COW_ALIASES[o].orig,'alias '+n);
 }
 assert.equal(Object.keys(ALIASES).length,Object.keys(C80_620R12_COW_ALIASES).length);
});

test('C80 620R13 viewer, inheritance, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R13_GLB_SHA256&&!c80620r13)throw new Error('C80_620R13_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r13) gltf.scene=c80620r13[634];') && index.includes('else if(c80620r12) gltf.scene=c80620r12[628];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R13_GLB_SHA256 && runtime?.isC80620R13)'));
 assert.ok(tech.includes('loadedSha === C80_620R13_GLB_SHA256 ? c80620R13ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R13 || is620R12 || is620R11 || loadedSha === C80_620R10_GLB_SHA256') && concealed.includes('path: [12467, 10060]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{25,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.indexOf('C80_620R13_OWNER_REVIEW_WORK_TEST_CANDIDATE,')<worker.indexOf('C80_620R12_OWNER_REVIEW_WORK_TEST_CANDIDATE,'),
  'the newest candidate is listed first and 620R12 stays available');
});

test('authentic 620R13 optional GLB: 620R12 exact roots, owner-review fixes, receipt and review roots',
 {skip:!process.env.C80_620R13_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R13_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R13SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const roots=json.scenes[+i].nodes,prior=json.scenes[spec.parent].nodes;
  const expected=prior.filter(n=>!REMOVED.includes(n)).map(n=>REPL[n]??n);
  assert.deepEqual(roots,spec.floor==='2F'?expected:[...expected,...ADDED],'roots of '+i);
  assert.ok(!roots.includes(6421),'sauna ghost in '+i);
 }
 // Old scenes keep their roots: 620R12 stays viewable from the same file chain.
 assert.ok(json.scenes[628].nodes.includes(6421)&&json.scenes[628].nodes.includes(12479)&&json.scenes[628].nodes.includes(12480));
 // The duct keeps the ventilation identity; the closet valve shares the K10 head and its layer.
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,634,12486)?.id,'technical-ventilation');
 for(const n of json.nodes[VALVE].children)
  assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,634,n)?.id,'technical-ventilation');
 assert.deepEqual(json.nodes[CLOSET_VALVE].children,[VALVE]);
 const review=c80620R13ReviewProfile(json,SHA,634);
 assert.deepEqual(review.floors,json.asset.extras.viewerFloorScenes);
 const reviewRoots=review.roots[634].map(r=>r.node);
 for(const n of [12486,VALVE,CLOSET_VALVE,12487]) assert.ok(reviewRoots.includes(n),'review root '+n);
 const bad=structuredClone(json); bad.scenes[634].extras.asBuilt=true;
 assert.equal(isC80620R13SourceScene(bad,SHA,634,'BOTH'),false);
 const ghost=structuredClone(json); ghost.scenes[634].nodes.push(6421);
 assert.equal(isC80620R13SourceScene(ghost,SHA,634,'BOTH'),false,'the sauna ghost cannot return');
 const clear=structuredClone(json); clear.materials[759].alphaMode='BLEND';
 assert.equal(isC80620R13SourceScene(clear,SHA,632,'1F'),false,'the opaque enclosure is pinned');
});
