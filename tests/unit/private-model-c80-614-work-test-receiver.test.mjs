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
const ID='c80-614r10-posts-flush-walls-20261116';

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
 assert.ok(json.scenes[610].nodes.includes(12430)&&!json.scenes[609].nodes.includes(12430),'1F ceiling');
 assert.ok(json.scenes[608].nodes.includes(12441)&&!json.scenes[609].nodes.includes(12441),'R10 hall wall-base joints');
 for(const [o,n] of [[9365,12438],[6376,12439]]) assert.ok(json.scenes[610].nodes.includes(n)&&!json.scenes[610].nodes.includes(o),'R10 wall '+o);
 assert.ok(json.scenes[609].nodes.includes(12440)&&!json.scenes[609].nodes.includes(6432),'R10 west 2F wall');
 // R9: separate 700-opening jambs/head dropped (opening in the wall itself), walls 7221/10794 share the stairwell edge.
 for(const n of [12332,12333,12135]) assert.ok(!json.scenes[610].nodes.includes(n),'R9 dropped '+n);
 assert.ok(json.scenes[608].nodes.includes(12436)&&!json.scenes[608].nodes.includes(7221),'R9 wall 7221');
 assert.ok(json.scenes[609].nodes.includes(12437)&&json.scenes[610].nodes.includes(12437)&&!json.scenes[610].nodes.includes(10794),'R9 wall 10794');
 // R7: hall south wall pieces, 2F low wall end, KPH lever mirrored, VH lever mirrored.
 for(const [o,n] of [[9375,12416],[9393,12417],[12130,12418],[12111,12419],[12331,12421],[9209,12422],[9216,12429]])
  assert.ok(json.scenes[608].nodes.includes(n)&&!json.scenes[608].nodes.includes(o),'R7 '+o);
 assert.ok(json.scenes[609].nodes.includes(9764)&&json.scenes[609].nodes.includes(9763),'R8 low wall/cap untouched');
 assert.deepEqual(json.nodes[12409].scale,[1,1,-1]); assert.deepEqual(json.nodes[12422].scale,[-1,1,1]);
 // R6: entry boxout 5 cm in front of the door wall, panel/casing/switch, reveals and front door moved with it.
 for(const [o,n] of [[7993,12410],[7999,12411],[7994,12412],[7995,12413],[7996,12414],[9175,12415]])
  assert.ok(json.scenes[608].nodes.includes(n)&&!json.scenes[608].nodes.includes(o),'R6 entry '+o);
 assert.equal(json.nodes[12412].translation[0],0.094);
 // R5: one rebuilt stair in every new scene, no old/duplicate stair roots.
 for(const s of [608,609,610,611,612,613]){
  for(const n of [12431,12432,12433,12434,12435]) assert.ok(json.scenes[s].nodes.includes(n),'R10 stair '+n+' in '+s);
  for(const n of [9798,10532,10533,10534,10536,10537,10538,10553,10554]) assert.ok(!json.scenes[s].nodes.includes(n),'old stair '+n+' dropped in '+s);
 }
 const treads=json.nodes[12431].extras;
 assert.equal(treads.treads,14); assert.equal(treads.goingM,0.29); assert.equal(treads.topGoingM,0.27);
 assert.equal(treads.boardThicknessM,0.04); assert.equal(treads.nosingM,0.02); assert.equal(treads.topDropToFloorM,0.2);
 const rail=json.nodes[12434].extras;
 assert.deepEqual(rail.handrailSectionM,[0.028,0.15]); assert.equal(rail.postsOutsideTreadEnds,true); assert.equal(rail.whiteRailsFullLength,true);
 assert.equal(rail.posts.bottom[1],2.464); assert.equal(rail.posts.bottom[2],6.03);
 assert.deepEqual(rail.bevelledPostTops,['bottom','turnNorth','turnSouth']); assert.equal(rail.upperRailsEndX,2.449); assert.equal(rail.handrailOnPostSides,true); assert.deepEqual(rail.handrailY.lower,[6.002,6.03]); assert.deepEqual(rail.postTopsFlushWithHandrail,['bottom','turnNorth','turnSouth']); assert.deepEqual(rail.turnHandrailX,[0.966,0.994]); assert.equal(rail.posts.top[1],2.424); assert.equal(rail.posts.top[3],6.325);
 for(const n of [6419,6420,6497,12044,12347,12360]) assert.ok(!json.scenes[610].nodes.includes(n),'dropped '+n);
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,610,11769+1)?.id,'technical-electrical','moved 1F SW-02 keeps identity');
 assert.equal(resolveC80SuccessorTechnicalNode(json,SHA,609,12398)?.id,'technical-ventilation','new WC exhaust is ventilation');
 assert.deepEqual(c80614ReviewProfile(json,SHA,610).floors,json.asset.extras.viewerFloorScenes);
 const forged=structuredClone(json);
 forged.nodes[12390].matrix[12]+=0.5;
 assert.equal(resolveC80SuccessorTechnicalNode(forged,SHA,608,11770),null,'altered COW node loses alias identity');
 const bad=structuredClone(json); bad.scenes[610].extras.asBuilt=true;
 assert.equal(isC80614SourceScene(bad,SHA,610,'BOTH'),false);
 assert.equal(Object.keys(ALIASES).length,43);
});
