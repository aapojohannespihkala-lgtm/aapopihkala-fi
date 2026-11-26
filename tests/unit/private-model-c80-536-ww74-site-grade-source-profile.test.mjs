import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_536_WW74_GLB_SHA256 as SHA,C80_536_WW74_GLB_BYTES as BYTES,
 C80_536_WW74_PARENT_GLB_SHA256 as PARENT,
 C80_536_WW74_ZIP_DRIVE_ID,C80_536_WW74_SCENES as SCENES,
 isC80536WW74GradeEvidence as evidence,
 isC80536WW74SourceScene as valid,c80536WW74Receipt as receipt,
} from '../../src/scripts/privateModelC80536WW74SiteGradeSourceProfile.mjs';

const filename=process.env.C80_536_WW74_GLB_PATH;
const binary=filename?readFileSync(filename):null;
const sha=binary?createHash('sha256').update(binary).digest('hex'):null;
const json=binary&&binary.toString('ascii',0,4)==='glTF'
 ? JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString('utf8')):null;

function gradeFixture(){
 const nodes=new Array(12258).fill(null);
 nodes[12228]={name:'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD',
  children:[12225,12226,12227]};
 nodes[12227]={name:'WW74_SITE150_SOURCE_EXACT_TO_STREET_DRAIN_WORK_TEST_HOST_HOLD',mesh:4603};
 nodes[12257]={name:'M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD',
  children:[12225,12226,12255,12256],extras:{
   sourceParentNode:12228,oldSiteNode12227ExcludedFromNewScenes:true,
   oldRootStillExists:true,openEnds:1,m5System:'VIEMARI',stage:'WORK_TEST_HOST_HOLD',
   sourceGLBSHA256:PARENT,current:false,asBuilt:false,sourceLinksBound:false,
   physicalRouteVerified:false}};
 nodes[12255]={name:'WW74_SITE150_1974_1815_TO_1790_TRANSLATED_WORK_TEST_HOST_HOLD',
  mesh:4603,translation:[0,-2.4,0],extras:{
   sourceNode:12227,sourceMesh:4603,sourceGeometryPositionIndexExact:true,
   sourceGLBSHA256:PARENT,transformOnlyVerticalShiftM:-2.4,
   referenceLevelLocalZ0M:21.75,crossSourceDatum:'UNVERIFIED',
   '1974UpstreamDesignInvertM':18.15,'1974StreetDesignInvertM':17.9,
   streetConnection:'NOT_PHYSICALLY_VERIFIED',workAssumption:true,
   m5System:'VIEMARI',current:false,asBuilt:false,
   sourceLinksBound:false,physicalRouteVerified:false}};
 nodes[12256]={name:'WW74_BUILDING_END_VERTICAL_DROP_2400MM_WORK_ASSUMPTION_NO_WELL_HOST',
  mesh:4621,extras:{
   sourceNode:12226,centerlineDropM:2.4,sourceGLBSHA256:PARENT,
   physicalWellOrDropChamber:'NOT_VERIFIED',workAssumption:true,
   m5System:'VIEMARI',current:false,asBuilt:false,sourceLinksBound:false}};
 return {nodes};
}
test('536 original SHA and floor roles are independent of ZIP filename',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55668584);
 assert.equal(C80_536_WW74_ZIP_DRIVE_ID,'1lv2GPTEfZcpCpCWFUuLLwkyt_Su8OQbV');
 assert.deepEqual(Object.keys(SCENES),['530','531','532','533','534','535']);
 assert.equal(SCENES[531].floor,'2F');
 assert.equal(SCENES[531].designRoute,false);
 for(const [id,role] of Object.entries(SCENES))assert.equal(role.parent,Number(id)-6);
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.equal(valid({},PARENT,532,'BOTH'),false);
 assert.equal(valid({},SHA,536,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),532,'BOTH'),false);
 assert.equal(evidence({}),false);
 assert.deepEqual(receipt({},SHA,532,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',historicalDesignOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalWellVerified:false,streetTieInVerified:false,
  crossSourceVerticalDatumVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',
 });
});
test('design-level sewer hypothesis preserves negative provenance and fails closed',()=>{
 const source=gradeFixture();assert.equal(evidence(source),true);
 const mutate=(obj,key,value)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(evidence(source),false,'reject '+key);}
  finally{obj[key]=old;}
 };
 mutate(source.nodes[12257].extras,'physicalRouteVerified',true);
 mutate(source.nodes[12257].extras,'sourceLinksBound',true);
 mutate(source.nodes[12257],'children',[12225,12226,12227,12256]);
 mutate(source.nodes[12255].extras,'crossSourceDatum','N2000_VERIFIED');
 mutate(source.nodes[12255].extras,'sourceGLBSHA256',SHA);
 mutate(source.nodes[12255].extras,'1974StreetDesignInvertM',17.1);
 mutate(source.nodes[12255],'translation',[0,-1.2,0]);
 mutate(source.nodes[12256].extras,'physicalWellOrDropChamber','CURRENT');
 mutate(source.nodes[12256].extras,'centerlineDropM',0);
 assert.equal(evidence(source),true,'exact original evidence restored');
});
test('authenticated 55MB glTF exact source 1F/2F/BOTH scene parent & receipt',
 {skip:!json},()=>{
 assert.equal(binary.length,BYTES);
 assert.equal(sha,SHA);
 assert.equal(evidence(json),true);
 for(const [key,role] of Object.entries(SCENES)){
  const id=Number(key);
  assert.equal(valid(json,sha,id,role.floor),true,'auth source scene '+id);
  assert.equal(valid(json,PARENT,id,role.floor),false,'cross SHA must fail');
  assert.equal(valid(json,sha,id,'INVALID'),false,'wrong floor');
 }
});
test('authentic source mutation: old route, false physical approval and wrong floor fail',
 {skip:!json},()=>{
 const mutate=(obj,key,value,id=532)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(valid(json,sha,id,SCENES[id].floor),false,'reject '+key+' scene '+id);}
  finally{obj[key]=old;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[532].nodes,467,12228);
 mutate(json.scenes[532].extras,'sourceScene',525);
 mutate(json.scenes[532].extras,'physicalStreetConnectionVerified',true);
 mutate(json.scenes[531].extras,'newSewerInThisScene',true,531);
 mutate(json.nodes[12257].extras,'sourceLinksBound',true);
 mutate(json.nodes[12255],'translation',[0,0,0]);
 mutate(json.nodes[12255].extras,'crossSourceDatum','VERIFIED');
 mutate(json.nodes[12256].extras,'physicalWellOrDropChamber','VERIFIED');
 assert.equal(valid(json,sha,532,'BOTH'),true);
 assert.equal(valid(json,sha,531,'2F'),true);
});
