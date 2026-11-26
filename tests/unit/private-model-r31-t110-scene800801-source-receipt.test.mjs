import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {R31_T110_800801 as C, r31T110RootFnv32 as fnv,
  isR31T110Scene800801Source as valid,
  r31T110Scene800801Receipt as receipt
} from '../../src/scripts/privateModelR31T110Scene800801SourceReceipt.mjs';
// Exact 798 source-root order, reused in the synthetic 2F/800/801 fixture.
// Original source SHA is locked in the gate; no private geometry is embedded.
const SOURCE_798 = '7356 2658 6431 12440 13164 7361 7366 7367 5323 7368 5327 5629 13165 7369 5835 5836 9263 7370 6435 7371 8003 6472 6473 6474 6475 6476 6517 6518 6519 6831 6832 6564 6565 6994 7372 6653 6729 6730 12437 10795 9573 9574 9575 9576 7904 7905 7906 7907 7908 7909 7932 12136 7979 8024 8025 8026 9264 8199 8895 12106 9197 9198 9199 9200 9257 9332 9911 9912 9761 9338 9763 9764 9762 13141 10976 13505 10555 10556 10557 10558 10559 10560 10561 10562 10656 10657 10659 10763 12633 10771 10772 10773 10774 10775 10776 10777 10778 10779 10780 10781 10782 10783 10784 10785 10786 10787 12635 12636 12637 12638 12639 12144 12634 11304 11319 11339 11340 11341 11342 11343 11344 11345 11346 11347 11348 13227 13228 13229 13230 13231 12264 12265 12266 12267 12268 12269 12270 12271 11535 11536 11624 11625 11645 11648 13319 11662 11677 12157 13491 11727 11721 11722 11723 13510 13513 13516 13507 13531 12358 11858 11891 11907 11574 12622 12051 12137 12165 12166 12167 12168 12242 12244 12246 12248 12315 12312 12316 12431 12432 12433 12434 12435 12643 12623 12624 12625 12626 13488 13494 12503 12504 12497 12505 13247 12695 13482 13252 13253 13309 13325 13499 13500 13502 13506'.split(' ').map(Number);
const SOURCE_799 = SOURCE_798.filter(id => id !== 11625);
const OLD_CHILDREN = [13234,10070,10072,10074,10076,10078,10080,10082,10084,10086,10088,10090,10092,10094,10096,10098,10100,10102,13232,13233,13503,10146,13504,10153,10155,13310,13286,11317,13311,11366,11620,11621,11622];
const clone = value => JSON.parse(JSON.stringify(value));
function fixture(index) {
  const view=C.views[index], src = index===800 ? SOURCE_798 : SOURCE_799;
  const out=src.map(id=>id===13505 ? 13535 : id);
  const scenes=Array.from({length:C.sceneCount},()=>({nodes:[]}));
  scenes[view.from]={nodes:[...src]};
  scenes[index]={name:'Ylisrinne_R31_T110_D2F_2F_'+
    (index===800?'NORMAL':'SERVICE')+'_SOURCE_DEDUP_WORK_TEST_HOST_HOLD__scene'+index,
    nodes:out,
    extras:{stage:'WORK_TEST_HOST_HOLD',floor:'2F',sceneRole:view.role,
      plexyState:view.plexy,sourceScene:view.from,sourceRoot:13505,newRoot:13535,
      excludedDuplicateNode:10146,retainedSourceNode:12241,
      cofit:'EXISTING_2F_ROOTS_SW01_TO_SW05_SOURCE_EXACT_NO_DUPLICATE',
      sourceLinksForOutputSHA:'NOT_BOUND',sourceLinksOutputSHA:'NOT_BOUND',
      sourceLinksOutputShaBound:false,sourceLinksBoundForOutputSHA:false,
      physicalHostVerified:false,newGeometry:false,current:false,
      asBuilt:false,canonical:false,productionWebGL:'NOT_RUN',humanReview:'NOT_RUN'}};
  const nodes=Array.from({length:C.nodeCount},()=>({}));
  const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0.2209994888305662,0,0,1];
  nodes[13505]={children:[...OLD_CHILDREN]};
  nodes[13535]={children:OLD_CHILDREN.filter(x=>x!==10146),
    extras:{stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false}};
  nodes[10146]={mesh:3701,matrix:[...matrix],extras:{m5System:'VESI'}};
  nodes[12241]={mesh:3701,matrix:[...matrix],extras:{m5System:'VIEMARI'}};
  nodes[12242]={children:[12240,12241]};
  nodes[12240]={mesh:4611,extras:{m5System:'VIEMARI',asBuilt:false}};
  return {asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,
    asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},scene:C.defaultScene,scenes,nodes,
    meshes:Array(C.meshCount),materials:Array(C.materialCount),
    accessors:Array(C.accessorCount),bufferViews:Array(C.bufferViewCount)};
}
const ok=(j,i)=>valid(j,C.glbSha256,i,C.views[i].role,'2F');
test('authenticated 800 NORMAL and 801 SERVICE preserve all roots except one duplicate',()=>{
  for(const i of [800,801]){
    const j=fixture(i),v=C.views[i];
    assert.equal(fnv(j.scenes[v.from].nodes),v.sourceFnv);
    assert.equal(fnv(j.scenes[i].nodes),v.outputFnv);
    assert.equal(ok(j,i),true,'2F source scene '+i);
    const p=receipt(j,C.glbSha256,i,v.role,'2F');
    assert.equal(p.exactSource,true);assert.equal(p.sourceScene,v.from);
    assert.equal(p.redundantMeshInstancesRemoved,1);
    assert.equal(p.publishAllowed,false);assert.equal(p.sourceLinksBound,false);
    assert.equal(p.physicalRoofHostVerified,false);
    assert.equal(p.humanReview,'NOT_RUN');
  }
});
test('incorrect SHA, floor, role, scene or source profile fail closed',()=>{
  const j=fixture(800);
  for(const sha of [null,'',C.zipSha256,C.sourceGlbSha256,'a'.repeat(64)])
    assert.equal(valid(j,sha,800,'2F_NORMAL','2F'),false);
  assert.equal(valid(j,C.glbSha256,801,'2F_NORMAL','2F'),false);
  assert.equal(valid(j,C.glbSha256,800,'2F_NORMAL','BOTH'),false);
  assert.equal(valid(j,C.glbSha256,800,'2F_SERVICE','2F'),false);
  assert.equal(valid(j,C.glbSha256,798,'2F_NORMAL','2F'),false);
});
test('graph, mesh identity, retained sewer role, roof vent and hold flags fail closed',()=>{
  const mutations=[
    j=>j.scene=800,
    j=>j.asset.extras.current=true,
    j=>j.asset.extras.HUMAN_REVIEW='PASS',
    j=>j.scenes.pop(),
    j=>j.nodes.pop(),
    j=>j.scenes[800].name='wrong __scene800',
    j=>j.scenes[800].nodes.reverse(),
    j=>j.scenes[800].nodes.splice(j.scenes[800].nodes.indexOf(13535),1,13505),
    j=>j.scenes[798].nodes.splice(j.scenes[798].nodes.indexOf(13505),1,13535),
    j=>j.scenes[800].extras.sourceScene=799,
    j=>j.scenes[800].extras.plexyState='PLEX_OFF',
    j=>j.scenes[800].extras.sourceLinksBoundForOutputSHA=true,
    j=>j.scenes[800].extras.sourceLinksOutputShaBound=true,
    j=>j.scenes[800].extras.physicalHostVerified=true,
    j=>j.scenes[800].extras.productionWebGL='PASS',
    j=>j.scenes[800].extras.current=true,
    j=>j.nodes[13535].children.push(10146),
    j=>j.nodes[13535].children.reverse(),
    j=>j.nodes[10146].mesh=3702,
    j=>j.nodes[12241].extras.m5System='VESI',
    j=>j.nodes[12241].matrix[12]=0.1,
    j=>j.nodes[12242].children.pop(),
    j=>j.nodes[12240].mesh=3701
  ];
  for(const change of mutations){
    const j=fixture(800);change(j);
    assert.equal(ok(j,800),false,'mutation rejected: '+change.toString());
  }
  for(const ids of [null,[-1],[1.2],[Number.MAX_SAFE_INTEGER+1]])
    assert.equal(fnv(ids),null);
});
const original=process.env.R31_T110_SCENE800801_ORIGINAL_GLB;
test('optional raw-byte authenticated R31 T110 original ZIP inner GLB source gate',
  {skip:!original},()=>{
  const bytes=readFileSync(original),sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length,C.glbBytes);assert.equal(sha,C.glbSha256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  for(const i of [800,801])assert.equal(valid(j,sha,i,C.views[i].role,'2F'),true);
});
