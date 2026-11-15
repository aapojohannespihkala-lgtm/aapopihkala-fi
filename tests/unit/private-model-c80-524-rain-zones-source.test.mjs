import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_524_RAIN_GLB_SHA256 as SHA,C80_524_RAIN_GLB_BYTES as BYTES,
 C80_524_RAIN_ZIP_DRIVE_ID,C80_524_RAIN_SCENES as SCENES,
 C80_524_RAIN_PARENT_GLB_SHA256 as PARENT,C80_524_RAIN_DONOR_GLB_SHA256 as DONOR,
 c80524RootsFnv32,isC80524RainZoneEvidence,isC80524RainSourceScene as valid,
 c80524RainReceipt as receipt,
} from '../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs';

const fixture=process.env.C80_524_RAIN_GLB_PATH;
const source=fixture?readFileSync(fixture):null;
const authenticatedSha=source?createHash('sha256').update(source).digest('hex'):null;
const json=source&&source.toString('ascii',0,4)==='glTF'
 ? JSON.parse(source.subarray(20,20+source.readUInt32LE(12)).toString('utf8')):null;

test('exact source identity, scene lineage and no CURRENT/production claims',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55468056);
 assert.equal(C80_524_RAIN_ZIP_DRIVE_ID,'1M5ToN7C_tKnhGwLH8D3fMNueMqbjKQZ8');
 assert.deepEqual(Object.keys(SCENES),['518','519','520','521','522','523']);
 for(const [key,s] of Object.entries(SCENES))assert.equal(s.parent,Number(key)-6);
 assert.equal(SCENES[518].floor,'1F');
 assert.equal(SCENES[519].floor,'2F');
 assert.equal(SCENES[520].floor,'BOTH');
 assert.equal(c80524RootsFnv32([1,-1]),null);
 assert.equal(valid({},SHA,520,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),520,'BOTH'),false);
 assert.equal(valid({},SHA,524,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,520,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',presentationOnly:true,
  sourceLinksBound:false,publishAllowed:false,physicalDownspoutVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
 });
});

test('real authenticated C80 524 GLB: 1F, 2F and four BOTH source scenes',{skip:!json},()=>{
 assert.equal(source.length,BYTES);
 assert.equal(authenticatedSha,SHA);
 assert.equal(json.scenes.length,524);
 for(const [key,s] of Object.entries(SCENES)){
  const id=Number(key);
  assert.equal(valid(json,authenticatedSha,id,s.floor),true,'scene '+id);
  assert.equal(valid(json,'0'.repeat(64),id,s.floor),false,'wrong sha '+id);
  assert.equal(valid(json,authenticatedSha,id,'UNRELATED'),false,'wrong floor '+id);
 }
});

test('real fixture rejects fake approval, changed parent roots or added physical route',{skip:!json},()=>{
 const mutate=(object,key,next,scene=520)=>{
  const before=object[key];object[key]=next;
  try{assert.equal(valid(json,authenticatedSha,scene,SCENES[scene].floor),false,'tampered '+key);}
  finally{object[key]=before;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[520].nodes,0,12250);
 mutate(json.scenes[520].extras,'sourceBaseScene',512);
 mutate(json.scenes[520].extras,'sourceLinksBound',true);
 mutate(json.scenes[520].extras,'productionWebGLVerified',true);
 mutate(json.scenes[520].extras,'physicalDownspoutNodeCountAdded',1);
 mutate(json.nodes[12251].extras,'sourcePresenceCoverage','5/5');
 mutate(json.nodes[12251],'children',[12249,12250,1126]);
 mutate(json.nodes[12249].extras,'sourceDonorNode',1126);
 mutate(json.nodes[12249].extras,'physicalRouteClaim',true);
 mutate(json.nodes[12249].extras,'asBuiltClaim',true);
 mutate(json.nodes[12249],'translation',[-0.14,0.3,3.865]);
 mutate(json.meshes[4618].extras,'physicalRouteClaim',true);
 assert.equal(valid(json,authenticatedSha,520,'BOTH'),true);
 assert.equal(isC80524RainZoneEvidence(json.nodes[12251],json.nodes[12249],json.nodes[12250]),true);
});
