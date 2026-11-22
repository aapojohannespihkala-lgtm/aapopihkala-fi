import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  H18116_SCENE773774 as S,
  h18116RootsFnv32 as fnv,
  isH18116Scene773774Source as valid,
  h18116SourceReceipt as receipt,
} from '../../src/scripts/privateModelH18116Scene773774SourceReceipt.mjs';

// Only source-root indices from the SHA-verified ORIGINAL GLB, no private media.
const parentNormal = JSON.parse(inflateSync(Buffer.from(
  'eNol00uWxSAIBNANZSAgv7W80/vfRleVk3uMUURCfh1Zn1fOVzfsM7/3fBZW9+soI0X6y/DgaDjCY/lqYXJyv5xIUt96cWEfhuTbtm/OCTy2E40uSVJfpTUZsl8NMgFYnMgDYN0uM2KASgRonF4dhxlHf3Z689tEbHCJHpH7nkuS6LHJkAU4xdyCb3qRp1+SRFfBoy1eDOJjIUKsbZMhizXngMRcINiuGcGoUT/MDUdBLnFW7aLUBw8YJ1Kzk/ks2XLk0jrSJCKc0srSytIanmEofXDcJl2+mStTllTZeqQizJHaO9o72jvaO9o72juts1KWfDMjl6W6V2NocSS+LQzJNoMmXYbUypuyZEtEDkfj0Tdm/zlbALJ1+bFoypItRzIr7yN5bjJ/yFPKr+RM3SdPeTkXa27Firmx5nGXEZr5wDd2GcyHN4JvfGVKZhX8sjZPxWFTIpNWxRjHT5r6UifqRqYbWb0Z3YinuOL7i+zMGcVI6bL0i+jXVq9fdgi8Ul/wqnP8+XLQvLM/74zuy/k8IbV3W+N3L319/iJh6mpPVSBZgTj8UsGYiLPq+SNd1t8/AzDknA==', 'base64'
)).toString('utf8'));
const parentService = parentNormal.filter(n => n !== S.plexi);
function fixture(index) {
  const v = Object.values(S.views).find(x=>x.index===index);
  const roots = index === 773 ? parentNormal : parentService;
  const originalExtras = {
    stage:'WORK_TEST_HOST_HOLD',sourceDriveId:S.inheritedSourceId,
    sourceGLBSHA256:S.inheritedSourceSha,source2FSceneIndex:768,
    donorBOTHNormalSceneIndex:769,donorBOTHServiceSceneIndex:770,
    sourceRootMapping:{'12466':13488,'11713':13491},
    newCopperRoot:13494,plexyRoot:S.plexi,
    plexyState:v.plexi?'PLEX_ON':'PLEX_OFF',r300SKU:'NOT_VERIFIED',
    copper:'2026_PHOTO_BASED_WORK_ASSUMPTION',rk141to3:'HISTORICAL_SCHEMATIC_2015',
    L12:'VIEMARI_SOURCE_REVIEW',sourceLinksForOutputSHA:'NOT_BOUND',
    productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',current:false,asBuilt:false,
    note:'Old R200/P02 source roots replaced by existing R300/P02 and copper source-root from BOTH, no physical 2026 as-built assertion.',
  };
  const scenes=Array.from({length:S.scenes},()=>({nodes:[]}));
  scenes[v.parent]={name:v.parentName,nodes:[...roots],extras:{...originalExtras}};
  scenes[index]={name:v.name,
    nodes:roots.map(x=>x===S.oldRoot?S.livingRoot:x),extras:{...originalExtras}};
  scenes[v.otherReference]={nodes:[S.livingRoot,5,7]};
  const nodes=Array.from({length:S.nodes},()=>({}));
  nodes[S.oldRoot]={name:'K5_R21_2F_KITCHEN_WEST_WALL_ONE_SOCKET_ROOT_SOURCE_EXACT_PIN_WORK_TEST',
    children:[...S.oldLeaves]};
  nodes[S.livingRoot]={
    name:'H18116_D2F_PINK_LIVING_EXPLICIT_RECLASSIFIED_VISUAL_ROOT_HOST_HOLD',
    children:[...S.livingLeaves],
    extras:{stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,
      sourceLinksBound:false,sourceOriginalR31Root:S.oldRoot,
      identityStatus:'SEPARATE_PHYSICAL_OUTLET_FROM_K5_2026_PHOTOS',
      placementStatus:'VISUAL_REVIEW_PIN_NOT_FIELD_MEASURED',
      ownerPhotoSources:[
        'https://drive.google.com/file/d/1XPnew716nqFVCiSDm2UAcbDSv1snHBrF/view',
        'https://drive.google.com/file/d/1-ViH0fJYYDfArna19BdSrrySs6VFP_eW/view',
      ],exactPhysicalPositionVerified:false,sourceLinksOutputSHABound:false,
      humanReview:'NOT_RUN',presentationOnly:true},
  };
  for(let i=0;i<5;i++){
    const m=[1,0,0,0,0,1,0,0,0,0,1,0,i,0,0,1];
    nodes[S.oldLeaves[i]]={mesh:S.meshesPerLeaf[i],matrix:[...m]};
    nodes[S.livingLeaves[i]]={mesh:S.meshesPerLeaf[i],matrix:[...m],
      extras:{current:false,asBuilt:false}};
  }
  return {
    asset:{extras:{ModelStage:'WORK_TEST',canonical:false,current:false,
      asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:S.defaultScene,scenes,nodes,meshes:Array(S.meshes),
    materials:Array(S.materials),accessors:Array(S.accessors),
    bufferViews:Array(S.bufferViews),
  };
}
const good=(j,i)=>valid(j,S.glbSha256,i,i===773?'NORMAL':'SERVICE','D2F');
test('ORIGINAL scene parent root arrays and sole root replacement in both views',()=>{
  assert.equal(parentNormal.length,204);
  assert.equal(parentService.length,203);
  for(const v of Object.values(S.views)) {
    const j=fixture(v.index), before=j.scenes[v.parent].nodes, after=j.scenes[v.index].nodes;
    assert.equal(fnv(before),v.parentFnv);
    assert.equal(fnv(after),v.targetFnv);
    assert.equal(good(j,v.index),true);
    assert.deepEqual(after,before.map(x=>x===S.oldRoot?S.livingRoot:x));
    assert.equal(before.filter(x=>x===S.oldRoot).length,1);
    assert.equal(after.filter(x=>x===S.livingRoot).length,1);
    assert.deepEqual(receipt(j,S.glbSha256,v.index,v.role,'D2F'),{
      exactSource:true,stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,
      publishAllowed:false,current:false,asBuilt:false,
      physicalPlacementVerified:false,productionWebGLVerified:false,
      humanReview:'NOT_RUN',
    });
  }
});
test('wrong GLB SHA, role, floor, scene and provenance all reject',()=>{
  const j=fixture(773);
  for(const sha of ['0'.repeat(64),S.sourceGlbSha256,undefined])
    assert.equal(valid(j,sha,773,'NORMAL','D2F'),false);
  assert.equal(valid(j,S.glbSha256,773,'SERVICE','D2F'),false);
  assert.equal(valid(j,S.glbSha256,773,'NORMAL','D1F'),false);
  assert.equal(valid(j,S.glbSha256,774,'SERVICE','D2F'),false);
  for(const mutate of [
    x=>x.asset.extras.canonical=true,
    x=>x.asset.extras.asBuilt=true,
    x=>x.asset.extras.HUMAN_REVIEW='PASS',
    x=>x.scene=773,x=>x.scenes.length=774,
    x=>x.nodes.length=13506,x=>x.meshes.length++,
    x=>x.scenes[773].name='wrong',
    x=>x.scenes[773].extras.sourceGLBSHA256='different',
    x=>x.scenes[773].extras.sourceLinksForOutputSHA=S.glbSha256,
    x=>x.scenes[773].extras.productionWebGL='PASS',
    x=>x.scenes[773].extras.plexyState='PLEX_OFF',
    x=>x.scenes[771].name='wrong parent',
  ]) {const x=fixture(773);mutate(x);assert.equal(good(x,773),false);}
});
test('root order and unique identity, five unchanged meshes and matrices',()=>{
  for(const mutate of [
    x=>x.scenes[773].nodes.reverse(),
    x=>x.scenes[773].nodes[0]=S.oldRoot,
    x=>x.scenes[773].nodes.push(S.livingRoot),
    x=>x.scenes[771].nodes.reverse(),
    x=>x.scenes[769].nodes=[S.oldRoot],
    x=>x.nodes[S.livingRoot].children[0]=9999,
    x=>x.nodes[S.livingRoot].extras.identityStatus='K5',
    x=>x.nodes[S.livingRoot].extras.sourceLinksOutputSHABound=true,
    x=>x.nodes[S.livingLeaves[1]].mesh=0,
    x=>x.nodes[S.livingLeaves[3]].matrix[0]=0,
  ]) {const x=fixture(773);mutate(x);assert.equal(good(x,773),false);}
  const s=fixture(774);s.scenes[774].nodes.push(S.plexi);
  assert.equal(good(s,774),false);
  assert.equal(receipt(fixture(773),'wrong',773,'NORMAL','D2F').publishAllowed,false);
});
test('root fingerprint rejects malformed indices',()=>{
  for(const a of [null,[-1],['1'],[1.5],[Number.MAX_SAFE_INTEGER+1]])
    assert.equal(fnv(a),null);
});
const original=process.env.H18116_SCENE773774_ORIGINAL_GLB;
test('optional complete ORIGINAL GLB bytes: SHA + both source-role scenes',
  {skip:!original},()=>{
    const bytes=readFileSync(original);
    assert.equal(bytes.length,S.glbBytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),S.glbSha256);
    assert.equal(bytes.toString('ascii',0,4),'glTF');
    assert.equal(bytes.toString('ascii',16,20),'JSON');
    const len=bytes.readUInt32LE(12);
    const json=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
    for(const v of Object.values(S.views))
      assert.equal(valid(json,S.glbSha256,v.index,v.role,'D2F'),true);
  });
