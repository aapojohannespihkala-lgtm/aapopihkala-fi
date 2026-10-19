import test from 'node:test';
import assert from 'node:assert/strict';
import {
  D1F_SCENE150_CANDIDATE_ID as ID, D1F_SCENE150_REVIEW_ID as REVIEW,
  D1F_SCENE150_SOURCE as SOURCE, isD1FScene150ReviewRequested,
  verifyD1FScene150Structure, loadD1FScene150Review,
} from '../src/scripts/privateModelD1FScene150Review.mjs';

const path='/private-model/work-test/'+ID+'.glb';
function valid() {
  const g={asset:{version:'2.0'}, scene:150,
    scenes:Array.from({length:152},()=>({})),
    nodes:Array.from({length:2772},()=>({})),
    meshes:Array.from({length:1036},()=>({}))};
  const safety={CURRENT:false,canonical:false,asBuilt:false,
    publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN',safetyApproved:false};
  g.scenes[149]={nodes:[2731,2615,2640,2653,2707,2725]};
  g.scenes[150]={name:'D1F_SCENE150_PHOTO_K2_OAK_U_GLASS_TWO_HANDLES_WORK_TEST',
    nodes:[2770,2615,2640,2653,2707,2771],
    extras:{...safety,sourceScene:148,tileOverlayEnabled:false}};
  g.scenes[151]={name:'D1F_SCENE151_OPTIONAL_TILES_PHOTO_K2_GLASS_TWO_HANDLES_WORK_TEST',
    nodes:[2770,2615,2640,2653,2707,2725,2771],
    extras:{...safety,sourceScene:149,tileOverlayEnabled:true,
      exactTileSizeOrSplitKnown:false}};
  g.nodes[2770]={name:'SCENE150_ROOM_K2_PHOTO_RELATION',
    children:Array.from({length:63},(_,i)=>2300+i),
    extras:{glassLegacyNode2464OmittedNewSceneOnly:true,
      assumedK2OffsetMm:35,assumedOffsetMeasured:false}};
  g.nodes[2771]={name:'TWO_HANDLE_SOURCE_EXACT_GLASS_REPLACEMENT',
    children:[2732],extras:{exactUserConfirmedTwoHandles:true,
      handlePositionsMeasured:false}};
  const kids=Array.from({length:37},(_,i)=>2733+i);
  g.nodes[2732]={name:'world',children:kids};
  kids.forEach((n,i)=>g.nodes[n]={name:i<3?'GLASS_'+i:
    i<20?'A_LEFT__PART_'+i:'B_RIGHT__PART_'+i});
  return g;
}
test('exact scene150 source and separate unmeasured scene151',()=>{
  const g=valid();
  assert.equal(verifyD1FScene150Structure(g).sceneIndex,150);
  assert.equal(verifyD1FScene150Structure(g).optionalTileSceneIndex,151);
  g.scenes[150].nodes.push(2725);
  assert.throws(()=>verifyD1FScene150Structure(g),/scene-roots/);
});
test('reject fake CURRENT, safety and optional tile measured claims',()=>{
  const g=valid();
  g.scenes[150].extras.HUMAN_REVIEW='PASS';
  assert.throws(()=>verifyD1FScene150Structure(g),/approval-or-source/);
  g.scenes[150].extras.HUMAN_REVIEW='NOT_RUN';
  g.scenes[151].extras.exactTileSizeOrSplitKnown=true;
  assert.throws(()=>verifyD1FScene150Structure(g),/tile-provenance/);
});
test('reject old glass duplicate, wrong two handle count and false K2 measurement',()=>{
  const g=valid();
  g.nodes[2770].children[0]=2464;
  assert.throws(()=>verifyD1FScene150Structure(g),/glass-or-k2-source/);
  g.nodes[2770].children[0]=2300;
  g.nodes[2770].extras.assumedOffsetMeasured=true;
  assert.throws(()=>verifyD1FScene150Structure(g),/glass-or-k2-source/);
  g.nodes[2770].extras.assumedOffsetMeasured=false;
  g.nodes[2733].name='B_RIGHT__PART_0';
  assert.throws(()=>verifyD1FScene150Structure(g),/two-handle-geometries/);
});
test('review and candidate mismatch fail before any network access',async()=>{
  const origin='https://aapopihkala.fi';
  let count=0;
  const args={candidate:{id:ID,path},search:'?review='+REVIEW,
    origin,loader:{parseAsync:async()=>{}},
    fetcher:async()=>{count++;throw Error('network-not-expected')}};
  assert.equal(isD1FScene150ReviewRequested('?review='+REVIEW),true);
  assert.equal(isD1FScene150ReviewRequested('?review=scene143-review'),false);
  for(const item of [
    {candidate:{id:'old-scene143',path}},
    {candidate:{id:ID,path:'/private-model/model.glb'}},
    {search:'?review=scene143'},
  ]) await assert.rejects(loadD1FScene150Review({...args,...item}),/candidate-review-id/);
  assert.equal(count,0);
});
test('truncated source and redirected response fail before GLTFLoader',async()=>{
  const origin='https://aapopihkala.fi';let parsed=0;
  const args={candidate:{id:ID,path},search:'?review='+REVIEW,origin,
    loader:{parseAsync:async()=>{parsed++}},
    fetcher:async()=>({status:200,redirected:false,url:origin+path,
      arrayBuffer:async()=>new Uint8Array([103,108,84,70]).buffer})};
  await assert.rejects(loadD1FScene150Review(args),/source-size-or-sha/);
  await assert.rejects(loadD1FScene150Review({...args,
    fetcher:async()=>({status:200,redirected:true,url:origin+path})}),
    /untrusted-response/);
  assert.equal(parsed,0);
});
test('source identity is fixed, no pixel or current promotion',()=>{
  assert.equal(SOURCE.bytes,9628072);
  assert.match(SOURCE.sha256,/^[0-9a-f]{64}$/);
  assert.equal(SOURCE.sceneCount,152);
  assert.equal(SOURCE.reviewScene,150);
});
