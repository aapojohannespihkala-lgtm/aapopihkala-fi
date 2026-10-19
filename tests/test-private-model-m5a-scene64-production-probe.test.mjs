import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Scene64ProofFailure,verifyScene64OriginalNodeKeys,
  verifyScene64PixelProjection,
  verifyScene64FrameTriplet,verifyScene64OriginalGlb,
} from '../.github/scripts/private-model-m5a-scene64-production-probe.mjs';
import {M5A_R1125_NUMBERED_SOURCE_IDS as ids} from
  '../src/scripts/privateModelM5AR1125NumberedScene64Review.mjs';

const sourceKeys=Array.from({length:13},(_,i)=>'original:SOURCE_'+i);
const originalFixture=()=>{
  const nodes=Array.from({length:1222},()=>({}));
  nodes[1125]={name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',
    children:Array.from({length:13},(_,i)=>i)};
  for(let i=0;i<13;i++)nodes[i]={name:'SOURCE_'+i};
  const scenes=Array.from({length:65},()=>({nodes:[]}));
  scenes[64]={nodes:Array.from({length:20},(_,i)=>i===17?1125:i)};
  return {asset:{version:'2.0'},scene:64,nodes,scenes,
    meshes:Array.from({length:661},()=>({}))};
};
const projection=()=>({
  sourceSceneIndex:64,sourceTargetCount:20,
  originalCount:13,numberCount:7,
  originalGlbDigestVerifiedByLoader:true,
  productionPixelsVerified:false,humanReview:'NOT_RUN',
  centers:[
    ...Array.from({length:13},(_,i)=>({
      key:'original:SOURCE_'+i,kind:'original',
      u:0.08+i*0.04,v:0.2,onScreen:true,
    })),
    ...ids.map((id,i)=>({
      key:'number:'+id,kind:'number',
      u:0.1+i*0.1,v:0.7,onScreen:true,
    })),
  ],
});
const frames=()=>{
  const width=256,height=256;
  const make=()=>({width,height,rgba:new Uint8Array(width*height*4)});
  const before=make(),hidden=make(),restored=make();
  for(let y=124;y<132;y++)for(let x=124;x<132;x++){
    const off=(y*width+x)*4;
    hidden.rgba[off]=190;
  }
  return {before,hidden,restored,center:{
    key:'original:SOURCE_0',kind:'original',
    u:0.5,v:0.5,onScreen:true}};
};

test('all 13 authentic object keys plus seven exact numbered G2 identities',()=>{
  const out=verifyScene64PixelProjection(projection(),sourceKeys);
  assert.equal(out.length,20);
  assert.deepEqual(out.filter(c=>c.kind==='number')
    .map(c=>c.key.slice(7)),ids);
});
test('projection source identity, duplicates, off-frame and promotion fail closed',()=>{
  for(const mutate of [
    p=>{p.sourceSceneIndex=63;},
    p=>{p.originalGlbDigestVerifiedByLoader=false;},
    p=>{p.productionPixelsVerified=true;},
    p=>{p.humanReview='PASS';},
    p=>{p.centers[1].key=p.centers[0].key;},
    p=>{p.centers[0].u=1.1;},
    p=>{p.centers[0].onScreen=false;},
    p=>{p.centers[19].key='number:INVENTED';},
    p=>{p.centers.pop();},
  ]){
    const p=projection();mutate(p);
    assert.throws(()=>verifyScene64PixelProjection(p,sourceKeys),Scene64ProofFailure);
  }
});
test('13 original identities come from authentic GLB node hierarchy, never count alone',()=>{
  assert.deepEqual(verifyScene64OriginalNodeKeys(originalFixture()),sourceKeys);
  const fake=projection();
  fake.centers[0].key='original:FORGED_SOURCE_WITH_VALID_PREFIX';
  assert.equal(fake.centers.length,20);
  assert.throws(()=>verifyScene64PixelProjection(fake,sourceKeys),
    Scene64ProofFailure);
  assert.throws(()=>verifyScene64PixelProjection(projection()),
    Scene64ProofFailure);
  for(const mutate of [
    g=>{g.scenes[64].nodes[17]=1124;},
    g=>{g.nodes[1125].children[0]=g.nodes[1125].children[1];},
    g=>{g.nodes[0].name=g.nodes[1].name;},
    g=>{g.nodes[1125].children=[0,1];},
  ]){
    const g=originalFixture();mutate(g);
    assert.throws(()=>verifyScene64OriginalNodeKeys(g),
      Scene64ProofFailure);
  }
});
test('real-frame comparator requires visible original delta and exact restoration',()=>{
  const f=frames(),out=verifyScene64FrameTriplet(f);
  assert.equal(out.changedPixels,64);
  assert.equal(out.projectedRoiChangedPixels,64);
  assert.equal(out.restorationChangedPixels,0);
  assert.equal(out.productionProvenanceVerified,false);
  assert.equal(out.humanReview,'NOT_RUN');
});
test('unchanged, corrupt, oversized, off-target or un-restored frames cannot pass',()=>{
  const variants=[
    f=>{f.hidden.rgba.fill(0);},
    f=>{f.restored.rgba.set(f.hidden.rgba);},
    f=>{f.center.u=0.05;},
    f=>{f.center.onScreen=false;},
    f=>{f.hidden.rgba=new Uint8Array(10);},
    f=>{f.before.width=9000;},
    f=>{f.minChangedPixels=2;},
  ];
  for(const mutate of variants){
    const f=frames();mutate(f);
    assert.throws(()=>verifyScene64FrameTriplet(f),Scene64ProofFailure);
  }
});
test('restoration rejects subtle residual screenshot drift below hide threshold',()=>{
  const f=frames();
  for(let y=124;y<132;y++)for(let x=124;x<132;x++){
    f.restored.rgba[(y*256+x)*4]=10;
  }
  assert.throws(()=>verifyScene64FrameTriplet(f),
    error=>error instanceof Scene64ProofFailure &&
      error.code==='ORIGINAL_OBJECT_PIXEL_DELTA');
});

test('a fake original GLB magic/length never authenticates source',()=>{
  assert.throws(()=>verifyScene64OriginalGlb(Buffer.alloc(64)),Scene64ProofFailure);
  const input=Buffer.alloc(3179132);
  input.writeUInt32LE(0x46546c67,0);
  input.writeUInt32LE(2,4);
  input.writeUInt32LE(input.length,8);
  assert.throws(()=>verifyScene64OriginalGlb(input),Scene64ProofFailure);
});

test('mass unrelated screen changes outside projected source cannot fake a target',()=>{
  const f=frames();
  // The genuine 64-pixel source target stays hidden in its projected ROI,
  // but 18000 other pixels are changed well outside that center ROI.
  for(let pixel=0;pixel<18000;pixel++)f.hidden.rgba[pixel*4]=190;
  assert.throws(()=>verifyScene64FrameTriplet(f),
    error=>error instanceof Scene64ProofFailure &&
      error.code==='ORIGINAL_OBJECT_PIXEL_DELTA');
});
test('off-ROI hard ceiling rejects the first pixel beyond its exact bound',()=>{
  const good=frames();
  for(let pixel=0;pixel<768;pixel++)good.hidden.rgba[pixel*4]=190;
  const technical=verifyScene64FrameTriplet(good);
  assert.equal(technical.projectedRoiChangedPixels,64);
  assert.equal(technical.offRoiChangedPixels,768);
  assert.equal(technical.offRoiHardCeiling,768);
  const bad=frames();
  for(let pixel=0;pixel<769;pixel++)bad.hidden.rgba[pixel*4]=190;
  assert.throws(()=>verifyScene64FrameTriplet(bad),
    error=>error instanceof Scene64ProofFailure &&
      error.code==='ORIGINAL_OBJECT_PIXEL_DELTA');
});
