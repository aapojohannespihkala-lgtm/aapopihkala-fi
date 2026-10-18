import test from 'node:test';
import assert from 'node:assert/strict';
import {
  M5A_R1125_NUMBERED_CANDIDATE_ID as ID,
  M5A_R1125_NUMBERED_REVIEW_ID as REVIEW,
  M5A_R1125_NUMBERED_SOURCE as SOURCE,
  M5A_R1125_NUMBERED_SOURCE_IDS as IDS,
  isM5AR1125NumberedScene64Requested,
  verifyM5AR1125Scene64Structure,
  loadM5AR1125NumberedScene64Review,
} from '../src/scripts/privateModelM5AR1125NumberedScene64Review.mjs';

const path='/private-model/work-test/'+ID+'.glb';
const valid = () => {
  const g={asset:{version:'2.0'},scene:64,scenes:Array.from({length:65},()=>({})),
    nodes:Array.from({length:1222},()=>({})),meshes:Array.from({length:661},()=>({}))};
  const original=Array.from({length:19},(_,i)=>i+5);
  g.scenes[63]={nodes:original};
  g.scenes[64]={
    name:'M5A_R1125_SCENE64_SEVEN_SOURCE_INDEX_NUMBERS_PLUS_EXACT_SCENE63_WORK_TEST_Y_UP',
    nodes:[...original,1126],
    extras:{HUMAN_REVIEW:'NOT_RUN',publishToCURRENT:false,Canonical:false,
      asBuiltClaim:false,originalSourceTargetsCount:13,sourceNumberLabelsCount:7,sourceG2Ids:[...IDS]},
  };
  const lengths=[9,15,15,13,15,15,13];
  let pos=120,children=[];
  for(let i=0;i<7;i++){
    const prefix='R1125_INDEX_0'+(i+1)+'_'+IDS[i]+'_';
    for(let k=0;k<lengths[i];k++){
      const n=pos++;children.push(n);
      g.nodes[n]={name:prefix+(k===0?'PLATE':k===lengths[i]-1?'ROD':'DIGIT_'+k)};
    }
  }
  g.nodes[1126]={name:'M5A_R1125_SOURCE_INDEX_NUMBERS_1_7_PRESENTATION_ONLY_Y_UP',
    children,extras:{presentationOnly:true,HUMAN_REVIEW:'NOT_RUN',sourceAnchorG2Ids:[...IDS]}};
  return g;
};

test('structural source contract requires original scene63 plus exactly seven labeled route indices',()=>{
  const g=valid();
  assert.equal(g.nodes[1126].children.length,95);
  assert.equal(verifyM5AR1125Scene64Structure(g).addedNumerals,7);
  g.scenes[64].nodes.pop();
  assert.throws(()=>verifyM5AR1125Scene64Structure(g),/scene64-roots/);
});
test('reject promotion, source ID drift and missing index geometry',()=>{
  const g=valid();
  g.scenes[64].extras.HUMAN_REVIEW='PASS';
  assert.throws(()=>verifyM5AR1125Scene64Structure(g),/promotion-or-source-semantics/);
  g.scenes[64].extras.HUMAN_REVIEW='NOT_RUN';
  g.scenes[64].extras.sourceG2Ids[3]='UNKNOWN';
  assert.throws(()=>verifyM5AR1125Scene64Structure(g),/promotion-or-source-semantics/);
  g.scenes[64].extras.sourceG2Ids[3]=IDS[3];
  const i=g.nodes[1126].children.find(i=>g.nodes[i].name.endsWith('PLATE'));
  g.nodes[i].name='BAD_PLATE';
  assert.throws(()=>verifyM5AR1125Scene64Structure(g),/source-index-geometry-1/);
});
test('wrong review, candidate or URL fails before fetching',async()=>{
  assert.equal(isM5AR1125NumberedScene64Requested('?review='+REVIEW),true);
  assert.equal(isM5AR1125NumberedScene64Requested('?review=old-review'),false);
  let fetched=0;
  const props={candidate:{id:ID,path},search:'?review='+REVIEW,
    loader:{parseAsync:async()=>{}},origin:'https://aapopihkala.fi',
    fetcher:async()=>{fetched++;throw Error('should-not-fetch');}};
  for(const alt of [
    {candidate:{id:'incorrect',path}},
    {search:'?review=legacy-review'},
    {candidate:{id:ID,path:'/private-model/model.glb'}},
  ]) await assert.rejects(loadM5AR1125NumberedScene64Review({...props,...alt}),/candidate-review-identity/);
  assert.equal(fetched,0);
});
test('truncated data never reaches GLTFLoader',async()=>{
  let parsed=0;
  const origin='https://aapopihkala.fi';
  await assert.rejects(loadM5AR1125NumberedScene64Review({
    candidate:{id:ID,path},search:'?review='+REVIEW,origin,
    loader:{parseAsync:async()=>{parsed++}},
    fetcher:async()=>({status:200,redirected:false,url:origin+path,
      arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}),
  }),/source-size-or-sha/);
  assert.equal(parsed,0);
});
test('exact bytes, hash and separate formal review gates',()=>{
  assert.equal(SOURCE.bytes,3179132);
  assert.equal(SOURCE.reviewScene,64);
  assert.equal(SOURCE.originalScene,63);
  assert.match(SOURCE.sha256,/^[0-9a-f]{64}$/);
});
