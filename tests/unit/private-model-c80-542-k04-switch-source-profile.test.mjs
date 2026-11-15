import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 K04_GLB_SHA256 as SHA,K04_GLB_BYTES as BYTES,K04_ZIP_SHA256 as ZIP,
 K04_ZIP_DRIVE_ID as DRIVE,K04_PARENT_SHA256 as PARENT,
 K04_SCENES as SCENES,k04Fnv32 as fnv,
 isK04RootReplacement as roots,isK04SwitchEvidence as evidence,
 isK04SwitchSourceScene as valid,k04SwitchReceipt as receipt,
} from '../../src/scripts/privateModelC80542K04SwitchSourceProfile.mjs';

test('one original GLB, six source scene scopes, WORK_TEST-only receipt',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.match(ZIP,/^[0-9a-f]{64}$/);
 assert.match(PARENT,/^[0-9a-f]{64}$/);
 assert.equal(DRIVE,'1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c');
 assert.equal(BYTES,55769792);
 assert.deepEqual(Object.keys(SCENES),['536','537','538','539','540','541']);
 for(const [id,s] of Object.entries(SCENES)){
  assert.equal(s.parent,Number(id)-6);
  assert.equal(s.floor,id==='536'?'1F':id==='537'?'2F':'BOTH');
  assert.equal(s.hasSwitches,id!=='536');
 }
 assert.equal(fnv([1,2,3]),'56cf37ab');
 assert.equal(fnv([-1]),null);
 assert.equal(valid({},SHA,538,'BOTH'),false);
 assert.equal(valid({},PARENT,538,'BOTH'),false);
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,538,'BOTH'),{
  exactSource:false,sourceOnly:true,stage:'WORK_TEST_HOST_HOLD',
  current:false,asBuilt:false,sourceLinksBound:false,
  physicalHostVerified:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('roots: preserve 1F and replace three legacy switches only in 2F/BOTH',()=>{
 const p=[7,11830,8,11833,9,11836,12257,10];
 const n=[7,12260,8,12263,9,12266,12257,10];
 assert.equal(roots(n,p,true),true);
 assert.equal(roots(p,p,true),false);
 assert.equal(roots([...n,11830],p,true),false);
 assert.equal(roots([...n,12266],p,true),false);
 assert.equal(roots([7,8,9],[7,8,9],false),true);
 assert.equal(roots([7,8,12257],[7,8,12257],false),false);
});
function makeEvidence(){
 const nodes=Array.from({length:12267},()=>({}));
 nodes[12257]={name:'K04_SW04_D2F_JAMB_WORK_TEST_HOST_ROOT',
   children:[12255,12256],extras:{current:false,asBuilt:false,
    physicalWallHost:'HOLD_UNVERIFIED',physicalPositionVerified:false,
    productSkuVerified:false,sourceLinksBoundToNewGlbSha:false}};
 const places=[[5.41,3.85,-4.997],[5.9,3.85,-7.217],[5.097,3.85,-6.98]];
 for(let j=0;j<3;j++){
  const id=12258+j*3,old=[11830,11833,11836][j],n='D2F-SW-0'+(j+1);
  nodes[id+2]={name:'K04_WALLHOST_'+n+'_ROOT_WORK_TEST_HOST_HOLD',
   children:[id,id+1],
   extras:{stableID:n,sourceNodeId:old,stage:'WORK_TEST_HOST_HOLD_NOT_ASBUILT',
    physicalWallHost:'HOLD_UNVERIFIED',sourceLinksBoundToNewGLBSHA:false,
    physicalPositionVerified:false,productSkuVerified:false,
    current:false,asBuilt:false}};
  for(const [offset,part,mesh] of [[0,'PLATE',4495],[1,'ROCKER',4496]]){
   nodes[id+offset]={name:'K04_WALLHOST_'+n+'_'+part+'_SOURCE_MESH_COW_WORK_TEST',
    mesh,translation:[...places[j]],
    extras:{sourceNodeId:old+offset+1,sourceParentGLBSHA256:PARENT,
     sourceParentDriveId:'1aTCGnm0f9QfZ3FMznYKcLYgUCStWEK-4',
     physicalPositionVerified:false,productSkuVerified:false,
     sourceLinksBoundToNewGLBSHA:false,current:false,asBuilt:false}};
  }
 }
 return {nodes,meshes:Array.from({length:4621},()=>({}))};
}
test('switch clone/source evidence rejects changed host and rewritten approvals',()=>{
 const g=makeEvidence();
 assert.equal(evidence(g),true);
 const original=g.nodes[12258].translation;
 g.nodes[12258].translation=[5.41,3.85,-4.8];
 assert.equal(evidence(g),false);
 g.nodes[12258].translation=original;
 g.nodes[12260].extras.asBuilt=true;
 assert.equal(evidence(g),false);
 g.nodes[12260].extras.asBuilt=false;
 delete g.nodes[12258].extras.physicalPositionVerified;
 assert.equal(evidence(g),false,'missing plate physical verification must not be accepted');
 g.nodes[12258].extras.physicalPositionVerified=false;
 g.nodes[12259].extras.physicalPositionVerified=true;
 assert.equal(evidence(g),false,'false physical approval on rocker must not be accepted');
 g.nodes[12259].extras.physicalPositionVerified=false;
 delete g.nodes[12260].extras.productSkuVerified;
 assert.equal(evidence(g),false,'missing switch SKU verification status must not be accepted');
 g.nodes[12260].extras.productSkuVerified=false;
 g.nodes[12257].extras.physicalWallHost='VERIFIED';
 assert.equal(evidence(g),false,'inherited SW04 host must stay unverified');
 g.nodes[12257].extras.physicalWallHost='HOLD_UNVERIFIED';
 delete g.nodes[12257].extras.sourceLinksBoundToNewGlbSha;
 assert.equal(evidence(g),false,'inherited SW04 sourceLinks must stay unbound');
 g.nodes[12257].extras.sourceLinksBoundToNewGlbSha=false;
 assert.equal(evidence(g),true,'restored original WORK_TEST metadata must pass');
 g.nodes[12266].extras.sourceLinksBoundToNewGLBSHA=true;
 assert.equal(evidence(g),false);
 g.nodes[12266].extras.sourceLinksBoundToNewGLBSHA=false;
 g.nodes[12263].children=[12261,11835];
 assert.equal(evidence(g),false);
});
const fixture=process.env.C80_K04_GLB_PATH;
test('authentic source GLB: six scene roots, old/new DFS, and fail-closed tampering',
 {skip:!fixture},()=>{
 const d=readFileSync(fixture);
 assert.equal(d.length,BYTES);
 assert.equal(d.toString('ascii',0,4),'glTF');
 assert.equal(d.readUInt32LE(8),d.length);
 assert.equal(createHash('sha256').update(d).digest('hex'),SHA);
 const size=d.readUInt32LE(12);
 const json=JSON.parse(d.subarray(20,20+size).toString('utf8'));
 assert.equal(evidence(json),true);
 for(let scene=536;scene<=541;scene++){
  const floor=SCENES[scene].floor;
  assert.equal(valid(json,SHA,scene,floor),true,'authentic scene '+scene);
  assert.equal(valid(json,PARENT,scene,floor),false);
  assert.equal(valid(json,SHA,scene,'wrong'),false);
 }
 const fake=structuredClone(json);
 fake.scenes[538].nodes[fake.scenes[538].nodes.indexOf(12260)]=11830;
 assert.equal(valid(fake,SHA,538,'BOTH'),false);
 const forged=structuredClone(json);
 forged.nodes[12261].translation[2]=-6.81;
 assert.equal(valid(forged,SHA,538,'BOTH'),false);
 const approved=structuredClone(json);
 approved.scenes[538].extras.sourceLinksBoundToNewGLBSHA=true;
 assert.equal(valid(approved,SHA,538,'BOTH'),false);
});
