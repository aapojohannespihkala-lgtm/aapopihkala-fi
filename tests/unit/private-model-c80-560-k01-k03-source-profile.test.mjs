import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_560_GLB_SHA256 as SHA,C80_560_GLB_BYTES as BYTES,
 C80_560_ZIP_SHA256 as ZIP,C80_560_ZIP_DRIVE_ID as DRIVE,
 C80_560_PARENT_GLB_SHA256 as PARENT,C80_560_SCENES as SCENES,
 isC80560K01K03Evidence as evidence,
 isC80560K01K03SourceScene as valid,
 c80560K01K03Receipt as receipt,
} from '../../src/scripts/privateModelC80560K01K03SourceProfile.mjs';

const filename=process.env.C80_560_K01K03_GLB_PATH;
const data=filename?readFileSync(filename):null;
const sha=data?createHash('sha256').update(data).digest('hex'):null;
const json=data&&data.toString('ascii',0,4)==='glTF'
 ?JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8')):null;
const fixture=()=>{
 const nodes=new Array(12262).fill(null);
 nodes[12255]={mesh:4618,extras:{m5System:'SADEVESI',presentationOnly:true,
  sourceLinksBound:false,physicalRouteClaim:false,current:false,asBuilt:false}};
 nodes[12256]=structuredClone(nodes[12255]);
 nodes[12257]={name:'WPA_K01_D_GABLE_TWO_PRESENCE_ZONES_SW_OWNER_LOCATION_CORRECTED_ROOT_WORK_TEST_HOST_HOLD',
  children:[12255,12256],extras:{m5System:'SADEVESI',stage:'WORK_TEST_HOST_HOLD',
  presentationOnly:true,currentGeometryClaim:false,physicalRouteClaim:false,
  sourceLinksBound:false,asBuiltClaim:false}};
 nodes[12258]={name:'C80_548_K03_D2F_WC_KSO125_WALL_VISUAL_ROOT_WORK_TEST_HOST_HOLD',
  children:[12259,12260,12261],extras:{m5System:'IV',sourceMode:'WORK_TEST_VISUAL_ONLY',
  ownerPointYLIS_G1_LOCAL_XYZ:[5,5.45,5.2],ownerWallFacingNormalYLIS_G1:'Nx-1',
  sourcePlanFileId:'1gb4mEwhOgxIkgxH9kXOecUxjs8eN7XF9',sourcePlanMark:'KSO-125 2F WC',
  sourceGLBSHA256:PARENT,sourceGLBZIPFileID:'1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s',
  physicalDuctConnectionVerified:false,realWallOpeningVerified:false,
  diameterAndSKUVerified:false,sourceLinksBound:false,CURRENT:false,asBuilt:false}};
 for(let i=0;i<3;i++)nodes[12259+i]={mesh:460+i,
  matrix:[0,0,-1,0,0,1,0,0,1,0,0,0,2.69,0.859775,-3.02,1],
  extras:{m5System:'IV',sourceMeshReusedUnmodified:true,
   physicalDuctConnectionVerified:false,realOpeningVerified:false,
   current:false,asBuilt:false}};
 return {nodes};
};
test('560 K01/K03 contract pins original source and fails closed',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.match(ZIP,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55711820);
 assert.equal(DRIVE,'1_By3tITRJUuKTFmtUlP2EaWbLY2MuJS5');
 assert.deepEqual(Object.keys(SCENES),['530','531','532','533','534','535']);
 for(const [i,s] of Object.entries(SCENES)){
  assert.equal(s.parent,Number(i)-6);
  assert.equal(s.k03Active,i!=='530');
 }
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.equal(valid({},PARENT,532,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),532,'BOTH'),false);
 assert.equal(valid({},SHA,526,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,532,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalDownspoutVerified:false,physicalDuctConnectionVerified:false,
  exactKSO125SKUVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('560 independent K01 and K03 source evidence rejects silent physical approval',()=>{
 const j=fixture();
 assert.equal(evidence(j),true);
 const mutate=(obj,key,v)=>{
  const old=obj[key];obj[key]=v;
  try{assert.equal(evidence(j),false,'reject '+key);}
  finally{obj[key]=old;}
 };
 mutate(j.nodes[12257],'children',[12255]);
 mutate(j.nodes[12257].extras,'physicalRouteClaim',true);
 mutate(j.nodes[12255].extras,'sourceLinksBound',true);
 mutate(j.nodes[12258].extras,'diameterAndSKUVerified',true);
 mutate(j.nodes[12258].extras,'sourceGLBSHA256',SHA);
 mutate(j.nodes[12259],'mesh',999);
 mutate(j.nodes[12260].extras,'realOpeningVerified',true);
 mutate(j.nodes[12261],'matrix',[1]);
 assert.equal(evidence(j),true,'restored source evidence');
});
test('560 authentic original GLB source scenes 530-535 including 1F K03 exclusion',
 {skip:!json},()=>{
 assert.equal(data.length,BYTES);
 assert.equal(sha,SHA);
 assert.equal(evidence(json),true);
 for(const [key,spec] of Object.entries(SCENES)){
  const id=Number(key);
  assert.equal(valid(json,sha,id,spec.floor),true,'authentic scene '+id);
  assert.equal(valid(json,sha,id,'OTHER'),false,'wrong floor '+id);
  assert.equal(valid(json,PARENT,id,spec.floor),false,'cross SHA '+id);
 }
});
test('560 authentic source disallows root hijack, K03 in 1F and physical gate spoof',
 {skip:!json},()=>{
 const mutate=(obj,key,v,id=532)=>{
  const old=obj[key];obj[key]=v;
  try{assert.equal(valid(json,sha,id,SCENES[id].floor),false,'reject '+key);}
  finally{obj[key]=old;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[532].nodes,476,12251);
 mutate(json.scenes[530].nodes,293,12258,530);
 mutate(json.scenes[532].extras,'newSourceLinksBound',true);
 mutate(json.nodes[12258].extras,'physicalDuctConnectionVerified',true);
 mutate(json.nodes[12257].extras,'physicalRouteClaim',true);
 mutate(json.nodes[12259],'mesh',4599);
 assert.equal(valid(json,sha,530,'1F'),true);
 assert.equal(valid(json,sha,531,'2F'),true);
 assert.equal(valid(json,sha,532,'BOTH'),true);
});
