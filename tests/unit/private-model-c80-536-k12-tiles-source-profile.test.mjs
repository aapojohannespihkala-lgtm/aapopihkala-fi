import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_536_K12_GLB_SHA256 as SHA,
 C80_536_K12_GLB_BYTES as BYTES,
 C80_536_K12_ZIP_SHA256 as ZIP,
 C80_536_K12_ZIP_DRIVE_ID as DRIVE,
 C80_536_K12_PARENT_GLB_SHA256 as PARENT,
 C80_536_K12_SCENES as SCENES,
 c80536K12Fnv32 as fnv,
 isC80536K12SourceScene as valid,
 c80536K12Receipt as receipt,
} from '../../src/scripts/privateModelC80536K12TilesSourceProfile.mjs';
const path=process.env.C80_536_K12_GLB_PATH;
const data=path?readFileSync(path):null;
const sha=data?createHash('sha256').update(data).digest('hex'):null;
const json=data&&data.toString('ascii',0,4)==='glTF'?
 JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8')):null;
test('K12 source receipt requires exact C80 536 and never approves building state',()=>{
 assert.match(SHA,/^[a-f0-9]{64}$/);
 assert.match(ZIP,/^[a-f0-9]{64}$/);
 assert.equal(BYTES,55670424);
 assert.equal(DRIVE,'1JjbWUBS7iMQnkUkgtLYrTHBD5KvbxS4m');
 assert.deepEqual(Object.keys(SCENES),['530','531','532','533','534','535']);
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.equal(valid({},PARENT,532,'BOTH'),false);
 assert.equal(valid({},SHA,529,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,532,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  photoWorkAssumption:true,saunaProductList2015Only:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalTileInstallationVerified:false,groutMeasured:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('K12 floor scenes have exact 1F/BOTH roles; 2F unchanged',()=>{
 for(const [k,v] of Object.entries(SCENES)){
  assert.equal(v.parent,Number(k)-6);
  assert.equal(v.tilesActive,k!=='531');
  assert.equal(v.floor,k==='530'?'1F':k==='531'?'2F':'BOTH');
 }
 assert.equal(fnv([1,2,3]),'56cf37ab');
});
test('K12 authenticated G2b GLB SHA/scene/parent/mesh evidence',{skip:!json},()=>{
 assert.equal(data.length,BYTES);
 assert.equal(sha,SHA);
 for(const [k,v] of Object.entries(SCENES)){
  assert.equal(valid(json,sha,Number(k),v.floor),true,'scene '+k);
  assert.equal(valid(json,sha,Number(k),'wrong floor'),false);
 }
});
test('K12 original rejects node swaps, approval spoof and wrong scenes',{skip:!json},()=>{
 const change=(o,key,value,i=532)=>{
  const prev=o[key];o[key]=value;
  try{assert.equal(valid(json,sha,i,SCENES[i].floor),false,'reject '+key);}
  finally{o[key]=prev;}
 };
 change(json.asset.extras,'current',true);
 change(json.scenes[532].nodes,0,11613);
 change(json.scenes[532].extras,'KPHPhotoWorkAssumption',false);
 change(json.nodes[12257].extras,'sourceLinksBound',true);
 change(json.nodes[12255].extras,'physicalTileInstallationVerified',true);
 change(json.nodes[12256].extras,'sourceNodeIndex',1714);
 change(json.nodes[12257].children,45,1714);
 assert.equal(valid(json,sha,530,'1F'),true);
 assert.equal(valid(json,sha,531,'2F'),true);
 assert.equal(valid(json,sha,532,'BOTH'),true);
});
