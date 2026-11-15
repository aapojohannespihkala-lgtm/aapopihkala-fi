import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_530_V27_GLB_SHA256 as SHA,C80_530_V27_GLB_BYTES as BYTES,
 C80_530_V27_ZIP_DRIVE_ID,C80_530_V27_PARENT_GLB_SHA256 as PARENT,
 C80_530_V27_DONOR_GLB_SHA256 as DONOR,
 C80_530_V27_SCENES as SPECS,c80530Fnv32 as hash,
 isC80530V27TerrainEvidence as terrain,
 isC80530V27SourceScene as valid,c80530V27Receipt as receipt,
} from '../../src/scripts/privateModelC80530V27SourceProfile.mjs';

const filename=process.env.C80_530_V27_GLB_PATH;
const data=filename?readFileSync(filename):null;
const sha=data?createHash('sha256').update(data).digest('hex'):null;
const json=data&&data.toString('ascii',0,4)==='glTF'
 ? JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8')):null;

test('530 identity is an independent 524 successor, six exact glTF scenes',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55645812);
 assert.equal(C80_530_V27_ZIP_DRIVE_ID,'1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s');
 assert.match(PARENT,/^[0-9a-f]{64}$/);
 assert.match(DONOR,/^[0-9a-f]{64}$/);
 assert.deepEqual(Object.keys(SPECS),['524','525','526','527','528','529']);
 assert.equal(SPECS[525].floor,'2F');
 assert.equal(SPECS[525].clip,false);
 for(const [key,s] of Object.entries(SPECS))assert.equal(s.parent,Number(key)-6);
 assert.equal(hash([12254,-1]),null);
 assert.equal(hash({}),null);
});
test('unauthenticated or other-version inputs never authorize new sourceLinks',()=>{
 assert.equal(valid({},SHA,526,'BOTH'),false);
 assert.equal(valid({},PARENT,526,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),526,'BOTH'),false);
 assert.equal(valid({},SHA,530,'BOTH'),false);
 assert.equal(terrain({}),false);
 assert.deepEqual(receipt({},SHA,526,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',presentationOnly:true,
  current:false,asBuilt:false,sourceLinksBound:false,publishAllowed:false,
  physicalTerrainSurveyVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('authentic 55MB GLB verifies 1F/BOTH root substitution and untouched 2F',
 {skip:!json},()=>{
 assert.equal(data.length,BYTES);
 assert.equal(sha,SHA);
 assert.equal(json.scenes.length,530);
 assert.equal(terrain(json),true);
 for(const [key,spec] of Object.entries(SPECS)){
  const id=Number(key);
  assert.equal(valid(json,sha,id,spec.floor),true,'scene '+id);
  assert.equal(valid(json,sha,id,'INVALID'),false,'wrong floor '+id);
  assert.equal(valid(json,PARENT,id,spec.floor),false,'parent SHA prohibited '+id);
  const active=json.scenes[id].nodes,old=json.scenes[spec.parent].nodes;
  assert.equal(hash(active),spec.rootHash);
  const replaced=active.filter((n,i)=>n!==old[i]);
  assert.deepEqual(replaced,spec.clip?[12254]:[]);
  assert.equal(active.includes(12251),true,'existing D rain ghost retained');
 }
});
test('tampered 530 scene roots and physical-approval metadata reject source',
 {skip:!json},()=>{
 const mutate=(target,key,value,i=526)=>{
  const prior=target[key];target[key]=value;
  try{assert.equal(valid(json,sha,i,SPECS[i].floor),false,'reject '+key+' scene'+i);}
  finally{target[key]=prior;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[526].nodes,107,9008);
 mutate(json.scenes[526].extras,'v27ClipApplied',false);
 mutate(json.scenes[525].extras,'v27ClipApplied',true,525);
 mutate(json.scenes[526].extras,'newSourceLinksBound',true);
 mutate(json.scenes[526].extras,'physicalDownspoutNodeCountAdded',1);
 mutate(json.nodes[12254],'children',[9007,8755,5145,5148,5154,5167,5180,7318,12253]);
 mutate(json.nodes[12254].extras,'terrainElevationDelta_m',0.35);
 mutate(json.nodes[12254].extras,'physicalFoundationClaim',true);
 mutate(json.nodes[12253].extras,'physicalTerrainSurveyVerified',true);
 mutate(json.nodes[12252].extras,'physicalStructureApproved',true);
 mutate(json.meshes[4619].extras,'sourceDonorSHA256',PARENT);
 assert.equal(valid(json,sha,526,'BOTH'),true);
 assert.equal(valid(json,sha,525,'2F'),true);
});
