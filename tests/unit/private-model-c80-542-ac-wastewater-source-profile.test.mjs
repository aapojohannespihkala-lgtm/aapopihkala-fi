import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_542_AC_GLB_SHA256 as SHA,C80_542_AC_GLB_BYTES as BYTES,
 C80_542_AC_ZIP_SHA256 as ZIP,C80_542_AC_ZIP_DRIVE_ID as DRIVE,
 C80_542_AC_PARENT_SHA256 as PARENT,C80_542_AC_SCENES as SCENES,
 isC80542ACBranchEvidence as evidence,
 isC80542ACSourceScene as valid,
 c80542ACSourceReceipt as receipt,
} from '../../src/scripts/privateModelC80542ACWastewaterSourceProfile.mjs';

const file=process.env.C80_542_AC_GLB_PATH;
const glb=file?readFileSync(file):null;
const sha=glb?createHash('sha256').update(glb).digest('hex'):null;
const json=glb&&glb.toString('ascii',0,4)==='glTF'
 ? JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString('utf8')):null;
function fixture(){
 const nodes=new Array(12262).fill(null);
 nodes[12226]={mesh:4602};
 nodes[12257]={name:'M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD',
  children:[12225,12226,12255,12256]};
 nodes[12261]={name:'M5_WW74_C80_542_WITH_A_C_CONCEPTUAL_L100_BRANCHES_WORK_TEST_HOST_HOLD',
  children:[12225,12226,12255,12256,12258,12259,12260],extras:{
  stage:'WORK_TEST_HOST_HOLD',WORK_TEST:true,m5System:'VIEMARI',sourceGLBSHA256:PARENT,
  sourceParentIndex:12257,newAtoCBranches:3,oldRootStillExists:true,
  oldSiteNode12227ExcludedFromNewScenes:true,g3SourceMarkersAreNotPipeEndpoints:true,
  sourceXYIsWorkAssumption:true,preserveD1FSourceBranch:true,
  streetJunctionStillOpenUnverified:true,physicalBoreOrRoutingVerified:false,
  physicalRouteVerified:false,sourceLinksBound:false,current:false,asBuilt:false}};
 for(let k=0;k<3;k++){
  const x=[24.6,18.9,12.5][k];
  nodes[12258+k]={name:`WW_1974_${'ABC'[k]}_APPROX_L100_STACK_TO_L150_WORK_TEST_HOST_HOLD`,
   mesh:4622+k,extras:{
    m5System:'VIEMARI',stage:'WORK_TEST_HOST_HOLD',WORK_TEST:true,workAssumption:true,
    represents:'CONCEPTUAL_GRAVITY_BRANCH_NOT_BUILT_ASSET',
    sourceGLBSHA256:PARENT,sourceDrawingDriveId:'1bwpgeIPlH5ehpkYOBihbZQmo5_2dnTL-',
    sourceG3SheetDriveId:'1HxWKdDjjc6iYmd50pemgjrYy93-jeTXvhWbTl0FcuxI',
    '1974SourceRasterAnchor':`G3_KVV_1974_V12_WW_1F_STACK_ANCHOR_00${k+1}`,
    g3CoordinateBasis:'TIFF_RASTER_TOPLEFT_PT_600DPI_NO_TRANSFORM',
    sourceMarkerIsNotPhysicalPipeLocation:true,planRouteNotSurveyed:true,
    mainSourceNodeIndex:12226,mainSourceMeshIndex:4602,
    nominalStackXYModelWorldM:[x,5],mainCenterlineConnectionWorkTest:[x,-1,-3.59],
    nominalHorizontalLengthM:1.4,nominalHorizontalFallM:0.04,
    current:false,asBuilt:false,sourceLinksBound:false,physicalRouteVerified:false,
    physicalStack:false,physicalOpeningClaim:false,physicalMainJunctionBoreVerified:false}};
 }
 return {nodes};
}
test('542 source contract pins six distinct glTF scenes and forbids publication',()=>{
 assert.match(SHA,/^[a-f0-9]{64}$/);
 assert.match(ZIP,/^[a-f0-9]{64}$/);
 assert.equal(BYTES,55699316);
 assert.equal(DRIVE,'1IDzYbJzKxBuhM1fbZ6l7H0Hv4osnbWdS');
 assert.deepEqual(Object.keys(SCENES),['536','537','538','539','540','541']);
 for(const [id,role] of Object.entries(SCENES)){
  assert.equal(role.parent,Number(id)-6);
  assert.equal(role.branches,id!=='537');
 }
 assert.equal(valid({},SHA,538,'BOTH'),false);
 assert.equal(valid({},PARENT,538,'BOTH'),false);
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),538,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,538,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalRoutingVerified:false,physicalJunctionBoreVerified:false,
  actualStacksVerified:false,crossSourceDatumVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('542 actual conceptual three-branch evidence is fail-closed',()=>{
 const j=fixture();assert.equal(evidence(j),true);
 const mutate=(obj,key,value)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(evidence(j),false,'reject '+key);}
  finally{obj[key]=old;}
 };
 mutate(j.nodes[12261].extras,'sourceGLBSHA256',SHA);
 mutate(j.nodes[12261].extras,'physicalRouteVerified',true);
 mutate(j.nodes[12261].extras,'newAtoCBranches',2);
 mutate(j.nodes[12261],'children',[12225,12226,12255,12256,12258,12259]);
 mutate(j.nodes[12258].extras,'physicalStack',true);
 mutate(j.nodes[12259].extras,'mainSourceMeshIndex',4603);
 mutate(j.nodes[12260].extras,'sourceMarkerIsNotPhysicalPipeLocation',false);
 mutate(j.nodes[12260].extras,'sourceLinksBound',true);
 mutate(j.nodes[12258].extras,'nominalHorizontalFallM',0);
 assert.equal(evidence(j),true,'exact evidence restored');
});
test('542 authenticated original 55MB GLB: scene 536..541 source roots and provenance',
 {skip:!json},()=>{
 assert.equal(glb.length,BYTES);
 assert.equal(sha,SHA);
 assert.equal(evidence(json),true);
 for(const [k,role] of Object.entries(SCENES)){
  const i=Number(k);
  assert.equal(valid(json,sha,i,role.floor),true,'authentic scene '+i);
  assert.equal(valid(json,PARENT,i,role.floor),false,'cross SHA rejected '+i);
  assert.equal(valid(json,sha,i,'OTHER'),false,'wrong floor rejected '+i);
 }
});
test('542 authentic scene mutation rejects forged physical approval and root swap',
 {skip:!json},()=>{
 const mutate=(obj,key,value,id=538)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(valid(json,sha,id,SCENES[id].floor),false,'reject '+key);}
  finally{obj[key]=old;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[538].extras,'physicalABCStackLocationVerified',true);
 mutate(json.scenes[538].extras,'sourceLinksBound',true);
 mutate(json.scenes[538].nodes,467,12257);
 mutate(json.scenes[537].extras,'ABCBranchesActive',true,537);
 mutate(json.nodes[12260].extras,'physicalOpeningClaim',true);
 mutate(json.nodes[12261].extras,'streetJunctionStillOpenUnverified',false);
 assert.equal(valid(json,sha,536,'1F'),true);
 assert.equal(valid(json,sha,537,'2F'),true);
 assert.equal(valid(json,sha,538,'BOTH'),true);
});
