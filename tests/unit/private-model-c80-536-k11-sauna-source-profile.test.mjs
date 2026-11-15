import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_K11_GLB_SHA256 as GLB_SHA,C80_K11_GLB_BYTES as BYTES,
 C80_K11_ZIP_SHA256 as ZIP_SHA,C80_K11_ZIP_DRIVE_ID as DRIVE,
 C80_K11_PARENT_GLB_SHA256 as PARENT,C80_K11_SCENES as SCENES,
 c80K11Fnv32 as fnv,isC80K11SaunaSourceScene as valid,
 c80K11SaunaReceipt as receipt,
} from '../../src/scripts/privateModelC80536K11SaunaSourceProfile.mjs';
const path=process.env.C80_K11_GLB_PATH;
const raw=path?readFileSync(path):null;
const hash=raw?createHash('sha256').update(raw).digest('hex'):null;
const json=raw&&raw.subarray(0,4).toString()==='glTF'?
 JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString('utf8')):null;
test('K11 source is separately SHA locked with fail-closed output',()=>{
 assert.match(GLB_SHA,/^[a-f0-9]{64}$/);assert.match(ZIP_SHA,/^[a-f0-9]{64}$/);
 assert.equal(BYTES,55711372);assert.equal(DRIVE,'1HdCxGon2IiSQQUWQp0aT7fO3XWdobbIj');
 assert.equal(valid({},GLB_SHA,532,'BOTH'),false);
 assert.equal(valid({},PARENT,532,'BOTH'),false);
 assert.equal(valid({},GLB_SHA,529,'BOTH'),false);
 assert.deepEqual(receipt({},GLB_SHA,532,'BOTH'),{
  exactSource:false,sourceOnly:true,stage:'WORK_TEST_HOST_HOLD',
  photoDerivedBoardWidth:true,physicallyMeasured:false,sourceLinksBound:false,
  publishAllowed:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
  current:false,asBuilt:false});
});
test('K11 scene map preserves 2F and changes only one 1F/BOTH root',()=>{
 assert.deepEqual(Object.keys(SCENES),['530','531','532','533','534','535']);
 for(const [id,p] of Object.entries(SCENES)){
  assert.equal(p.parentScene,Number(id)-6);
  assert.equal(p.wideDeckActive,id!=='531');
  assert.equal(p.floor,id==='530'?'1F':id==='531'?'2F':'BOTH');
 }
 assert.equal(fnv([1,2,3]),'56cf37ab');
});
test('K11 authenticated original complete GLB scenes and source parents', {skip:!json},()=>{
 assert.equal(raw.length,BYTES);assert.equal(hash,GLB_SHA);
 for(const [index,p] of Object.entries(SCENES)){
  assert.equal(valid(json,hash,Number(index),p.floor),true,'scene '+index);
  assert.equal(valid(json,hash,Number(index),'WRONG'),false);
 }
});
test('K11 authentic receipt rejects altered scene, mesh, source and approval flags',{skip:!json},()=>{
 const mutate=(obj,key,invalid)=>{
  const prev=obj[key];obj[key]=invalid;
  try{assert.equal(valid(json,hash,532,'BOTH'),false,'reject '+key);}
  finally{obj[key]=prev;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[532].nodes,224,11305);
 mutate(json.scenes[532].extras,'sourceLinksBound',true);
 mutate(json.nodes[12255].extras,'physicalInstallVerified',true);
 mutate(json.nodes[12255].extras,'heaterHoleDiameterM',0.4);
 mutate(json.meshes[4621].primitives[0],'material',586);
 mutate(json.meshes[4621].extras,'boardCount',17);
});
