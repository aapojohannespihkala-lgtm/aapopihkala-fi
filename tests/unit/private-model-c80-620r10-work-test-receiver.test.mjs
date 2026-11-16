import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_620R10_GLB_SHA256 as SHA, C80_620R10_GLB_BYTES as BYTES, C80_620R10_ZIP_DRIVE_ID as ZIP,
 C80_620R10_SCENES as SPECS, C80_620R10_COW_ALIASES as ALIASES, isC80620R10SourceScene,
} from '../../src/scripts/privateModelC80620R10SourceProfile.mjs';
import {C80_614_GLB_SHA256} from '../../src/scripts/privateModelC80614SourceProfile.mjs';
import {resolveC80620R10SceneIndex,c80620R10ReviewProfile} from '../../src/scripts/privateModelC80620R10FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-620r10-high-donor-j1j2-k10k14-g2s09-k05-k13-20261116';

test('C80 620R10 floor roles map to its own six scenes on top of 614 R10',()=>{
 assert.deepEqual([resolveC80620R10SceneIndex('1F'),resolveC80620R10SceneIndex('2F'),resolveC80620R10SceneIndex('BOTH'),
  resolveC80620R10SceneIndex('BOTH','ONE_OPEN'),resolveC80620R10SceneIndex('BOTH','STACKED'),resolveC80620R10SceneIndex('BOTH','CLOSED',true)],
  [614,615,616,617,618,619]);
 assert.equal(resolveC80620R10SceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[608,609,610,611,612,613]);
 assert.equal(isC80620R10SourceScene({},'0'.repeat(64),616,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
 assert.notEqual(SHA,C80_614_GLB_SHA256);
});

test('C80 620R10 viewer, inheritance, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_620R10_GLB_SHA256&&!c80620r10)throw new Error('C80_620R10_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80620r10) gltf.scene=c80620r10[616];'));
 assert.ok(index.includes('(layersLoadedSha===C80_620R10_GLB_SHA256 && runtime?.isC80620R10)'));
 assert.ok(tech.includes('loadedSha === C80_620R10_GLB_SHA256 ? c80620R10ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('C80_620R10_CONCEALED') && concealed.includes('path: [12467, 10060]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_620R10_HIGH_DONOR_WORK_TEST_CANDIDATE,'));
});

test('authentic 620R10 optional GLB: 614 R10 exact, donor roles, aliases',
 {skip:!process.env.C80_620R10_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_620R10_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R10SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
  // The 614 R10 stair, hall, ceiling and walls are carried unchanged.
  for(const n of [12431,12432,12433,12434,12435]) assert.ok(json.scenes[+i].nodes.includes(n),'R10 '+n+' in '+i);
 }
 for(const n of [12430,12436,12438,12441,12444]) assert.ok(json.scenes[614].nodes.includes(n)&&!json.scenes[615].nodes.includes(n),'1F-only '+n);
 for(const [o,n] of [[11305,12445],[11728,12467],[12329,12471],[12361,12469]])
  assert.ok(json.scenes[616].nodes.includes(n)&&!json.scenes[616].nodes.includes(o),'1F COW '+o);
 for(const [o,n] of [[11642,12466],[12053,12462],[12056,12465],[12396,12475]])
  assert.ok(json.scenes[615].nodes.includes(n)&&!json.scenes[615].nodes.includes(o),'2F COW '+o);
 for(const n of [9195,9196]) assert.ok(!json.scenes[616].nodes.includes(n),'K05 lever side '+n+' dropped');
 assert.ok(json.nodes[12467].children.includes(10060),'T-collector kept');
 assert.ok(json.nodes[12471].children.includes(12470),'K13 IV enclosure');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,616,10060)?.id!==undefined,true,'T-collector keeps receipt identity');
 assert.deepEqual(c80620R10ReviewProfile(json,SHA,616).floors,json.asset.extras.viewerFloorScenes);
 const moved=structuredClone(json); moved.nodes[12445].mesh=21;
 assert.equal(isC80620R10SourceScene(moved,SHA,614,'1F'),true,'profile itself is structural');
 const bad=structuredClone(json); bad.scenes[616].extras.asBuilt=true;
 assert.equal(isC80620R10SourceScene(bad,SHA,616,'BOTH'),false);
 const swapped=structuredClone(json); swapped.scenes[616].nodes.push(9195);
 assert.equal(isC80620R10SourceScene(swapped,SHA,616,'BOTH'),false);
 const forged=structuredClone(json); forged.nodes[12467].name='X';
 assert.equal(resolveC80SuccessorTechnicalNode(forged,SHA,616,10060),null,'renamed COW root loses alias identity');
 assert.equal(Object.keys(ALIASES).length,41+28);
});
