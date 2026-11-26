import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R11_GLB_SHA256 as SHA, C80_620R11_GLB_BYTES as BYTES, C80_620R11_ZIP_DRIVE_ID as ZIP,
 C80_620R11_SCENES as SPECS, C80_620R11_COW_ALIASES as ALIASES, C80_620R11_ROOT_REPLACEMENTS as REPL,
 isC80620R11SourceScene,
} from '../../src/scripts/privateModelC80620R11SourceProfile.mjs';
import {C80_620R10_GLB_SHA256,C80_620R10_COW_ALIASES} from '../../src/scripts/privateModelC80620R10SourceProfile.mjs';
import {resolveC80620R11SceneIndex,c80620R11ReviewProfile} from '../../src/scripts/privateModelC80620R11FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r11-clearance-k13-k10-k11-20261117';

test('C80 620R11 floor roles map to its own six scenes on top of 620R10',()=>{
 assert.deepEqual([resolveC80620R11SceneIndex('1F'),resolveC80620R11SceneIndex('2F'),resolveC80620R11SceneIndex('BOTH'),
  resolveC80620R11SceneIndex('BOTH','ONE_OPEN'),resolveC80620R11SceneIndex('BOTH','STACKED'),resolveC80620R11SceneIndex('BOTH','CLOSED',true)],
  [620,621,622,623,624,625]);
 assert.equal(resolveC80620R11SceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[614,615,616,617,618,619]);
 assert.equal(isC80620R11SourceScene({},'0'.repeat(64),622,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_620R10_GLB_SHA256);
 // Only the K13 controls root alias moves; every other 620R10 alias is kept.
 assert.equal(Object.keys(ALIASES).length,Object.keys(C80_620R10_COW_ALIASES).length);
 assert.equal(ALIASES[12471],undefined);
 assert.equal(ALIASES[12479].orig,C80_620R10_COW_ALIASES[12471].orig);
});

test('C80 620R11 viewer, inheritance, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R11_GLB_SHA256&&!c80620r11)throw new Error('C80_620R11_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r11) gltf.scene=c80620r11[622];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R11_GLB_SHA256 && runtime?.isC80620R11)'));
 assert.ok(tech.includes('loadedSha === C80_620R11_GLB_SHA256 ? c80620R11ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('is620R11 || loadedSha === C80_620R10_GLB_SHA256') && concealed.includes('path: [12467, 10060]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.match(ZIP,/^[A-Za-z0-9_-]{10,128}$/);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_620R11_CLEARANCE_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R11 optional GLB: 620R10 exact roots, three COW fixes, aliases',
 {skip:!process.env.C80_620R11_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R11_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R11SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  const roots=json.scenes[+i].nodes,prior=json.scenes[spec.parent].nodes;
  assert.deepEqual(roots,prior.map(n=>REPL[n]??n),'roots of '+i);
  for(const [o,n] of Object.entries(REPL))
   assert.equal(roots.includes(n),spec.floor!=='2F','fix root '+n+' in '+i),assert.ok(!roots.includes(+o),'old root '+o+' in '+i);
 }
 assert.ok(json.nodes[12467].children.includes(10060),'T-collector kept');
 assert.ok(json.nodes[12479].children.includes(12478)&&!json.nodes[12479].children.includes(12470),'split K13 IV enclosure');
 assert.deepEqual(json.nodes[12479].children.filter(n=>n!==12478),json.nodes[12471].children.filter(n=>n!==12470));
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,622,10060)?.id!==undefined,true,'T-collector keeps receipt identity');
 assert.deepEqual(c80620R11ReviewProfile(json,SHA,622).floors,json.asset.extras.viewerFloorScenes);
 const bad=structuredClone(json); bad.scenes[622].extras.asBuilt=true;
 assert.equal(isC80620R11SourceScene(bad,SHA,622,'BOTH'),false);
 const swapped=structuredClone(json); swapped.scenes[622].nodes.push(12445);
 assert.equal(isC80620R11SourceScene(swapped,SHA,622,'BOTH'),false);
 const moved=structuredClone(json); moved.nodes[12477].translation=[0,0,0];
 assert.equal(isC80620R11SourceScene(moved,SHA,620,'1F'),false,'valve drop is pinned');
});
