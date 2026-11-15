import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_614_GLB_SHA256 as SHA, C80_614_GLB_BYTES as BYTES, C80_614_ZIP_DRIVE_ID as ZIP,
 C80_614_SCENES as SPECS, C80_614_COW_ALIASES as ALIASES, isC80614SourceScene,
} from '../../src/scripts/privateModelC80614SourceProfile.mjs';
import {resolveC80614SceneIndex,c80614ReviewProfile} from '../../src/scripts/privateModelC80614FloorRuntime.mjs';
import {isC80LayerSuccessorSha,resolveC80437SuccessorReceiptScene,resolveC80SuccessorTechnicalNode} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const ID='c80-614r4-owner-fixes-20261116';

test('C80 614 floor roles map to its own six scenes',()=>{
 assert.deepEqual([resolveC80614SceneIndex('1F'),resolveC80614SceneIndex('2F'),resolveC80614SceneIndex('BOTH'),
  resolveC80614SceneIndex('BOTH','ONE_OPEN'),resolveC80614SceneIndex('BOTH','STACKED'),resolveC80614SceneIndex('BOTH','CLOSED',true)],
  [608,609,610,611,612,613]);
 assert.equal(resolveC80614SceneIndex('2F','ONE_OPEN'),null);
 assert.deepEqual(Object.keys(SPECS).map(Number),[608,609,610,611,612,613]);
 assert.equal(isC80614SourceScene({},'0'.repeat(64),610,'BOTH'),false);
 assert.ok(isC80LayerSuccessorSha(SHA));
});

test('C80 614 viewer, inheritance, review, concealed routes and Worker wiring',()=>{
 const index=read('../../src/pages/private-model/index.astro');
 const tech=read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
 const concealed=read('../../src/scripts/privateModelConcealedTechnicalPresentation.mjs');
 const worker=read('../../worker/privateWorkTest.ts');
 const catalog=JSON.parse(read('../../.github/work-test-candidates.json'));
 assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_614_GLB_SHA256&&!c80614)throw new Error('C80_614_SOURCE_SCENE_MISMATCH')"));
 assert.ok(index.includes('if(c80614) gltf.scene=c80614[610];'));
 assert.ok(index.includes('(layersLoadedSha===C80_614_GLB_SHA256 && runtime?.isC80614)'));
 assert.ok(tech.includes('loadedSha === C80_614_GLB_SHA256 ? c80614ReviewProfile(json,loadedSha,sceneIndex)'));
 assert.ok(concealed.includes('C80_614_CONCEALED') && concealed.includes('path: [11728, 10060]'));
 assert.equal(catalog.candidates[ID].driveFileId,ZIP);
 assert.ok(worker.includes("id: '"+ID+"'") && worker.includes('expectedSize: '+BYTES) && worker.includes("expectedSha256: '"+SHA+"'"));
 assert.ok(worker.includes('C80_614_OWNER_FIXES2_WORK_TEST_CANDIDATE,'));
});

test('authentic 614 optional GLB: scenes, T-collector back, ghosts and flex dropped, aliases',
 {skip:!process.env.C80_614_GLB_PATH},()=>{
 const bytes=readFileSync(process.env.C80_614_GLB_PATH);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.ok(isC80614SourceScene(json,SHA,+i,spec.floor),'scene '+i);
  assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,+i),'receipt '+i);
 }
 assert.ok(json.scenes[608].nodes.includes(11728),'original T-collector root');
 assert.ok(json.scenes[608].nodes.includes(12402)&&!json.scenes[608].nodes.includes(12334),'stair block COW');
 assert.ok(resolveC80437SuccessorReceiptScene(json,SHA,608));
 const moved=structuredClone(json); moved.nodes[12403].mesh=21;
 assert.equal(isC80614SourceScene(moved,SHA,608,'1F'),true,'profile itself is structural');
 assert.ok(json.scenes[610].nodes.includes(12416)&&!json.scenes[609].nodes.includes(12416),'614 R4 1F ceiling');
 for(const [orig,cow] of [[10538,12413],[9798,12414],[12135,12415]]) assert.ok(json.scenes[610].nodes.includes(cow)&&!json.scenes[610].nodes.includes(orig),'R4 COW '+orig);
 for(const n of [6419,6420,6497,12044,12347,12360]) assert.ok(!json.scenes[610].nodes.includes(n),'dropped '+n);
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,610,11769+1)?.id,'technical-electrical','moved 1F SW-02 keeps identity');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,609,12398)?.id,'technical-ventilation','new WC exhaust is ventilation');
 assert.deepEqual(c80614ReviewProfile(json,SHA,610).floors,json.asset.extras.viewerFloorScenes);
 const forged=structuredClone(json);
 forged.nodes[12390].matrix[12]+=0.5;
 assert.equal(resolveC80SuccessorTechnicalNode(forged,SHA,608,11770),null,'altered COW node loses alias identity');
 const bad=structuredClone(json); bad.scenes[610].extras.asBuilt=true;
 assert.equal(isC80614SourceScene(bad,SHA,610,'BOTH'),false);
 assert.equal(Object.keys(ALIASES).length,24);
});
