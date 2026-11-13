import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 V84FLOOR380_GLB_SHA256 as SHA, V84FLOOR380_GLB_BYTES as BYTES,
 V84FLOOR380_ZIP_SHA256, V84FLOOR380_DRIVE_ID,
 V84FLOOR380_SCENES as scenes,
 isV84Floor380SourceScene as valid,
 resolveV84Floor380SceneIndex as choose,
 v84Floor380RootFnv32 as fnv,
} from '../../src/scripts/privateModelV84Floor380SourceProfile.mjs';
const states=[[376,'CLOSED',false,'abb00df9'],
 [377,'ONE_OPEN',false,'b59f123b'],
 [378,'STACKED',false,'8402cc59'],
 [379,'CLOSED',true,'c14adfe2']];
test('Exact source SHA, original Drive ID and four authored BOTH variants',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,54081264);
 assert.match(V84FLOOR380_ZIP_SHA256,/^[0-9a-f]{64}$/);
 assert.equal(V84FLOOR380_DRIVE_ID,'1P6W3EVr1F6PzZXnd1MTudqbuHb5Kjnfp');
 assert.deepEqual(Object.keys(scenes).map(Number),states.map(x=>x[0]));
 for(const [i,g,c,fingerprint] of states){
   assert.equal(choose(SHA,'BOTH',g,c),i);
   assert.equal(scenes[i].fnv,fingerprint);
   assert.equal(scenes[i].roots,464);
   assert.match(scenes[i].name,/WALLTOP5MM_FLOOR_ZFIGHT_COFIT/);
 }
});
test('Reject wrong SHA and missing physical 1F, 2F or glazing-cutaway variants',()=>{
 for(const [sha,f,g,c] of [
  ['0'.repeat(64),'BOTH','CLOSED',false],
  [SHA,'1F','CLOSED',false],
  [SHA,'2F','CLOSED',false],
  [SHA,'BOTH','ONE_OPEN',true],
  [SHA,'BOTH','STACKED',true],
  [SHA,'BOTH','OPEN',false],
  [SHA,'BOTH','CLOSED','true'],
 ])assert.equal(choose(sha,f,g,c),null);
 assert.equal(valid({},SHA,376),false);
 assert.equal(valid({},SHA,369),false);
 assert.equal(valid({scenes:Array(380)},'0'.repeat(64),376),false);
});
test('Ordered exact root fingerprint fails closed',()=>{
 assert.equal(fnv([]),'811c9dc5');
 assert.notEqual(fnv([12108,12109]),fnv([12109,12108]));
 assert.equal(fnv([1,NaN]),null);
 assert.equal(fnv([-1]),null);
});
// Set YLIS_V84_FLOOR380_GLB only to a private, independently SHA-verified raw GLB.
// Never commit original GLB bytes to the GitHub repository.
test('Authentic 54 MB source-GLB validates four scenes and negative mutations',
 {skip:!process.env.YLIS_V84_FLOOR380_GLB},()=>{
  const data=readFileSync(process.env.YLIS_V84_FLOOR380_GLB);
  assert.equal(data.length,BYTES);
  assert.equal(createHash('sha256').update(data).digest('hex'),SHA);
  assert.equal(data.toString('ascii',0,4),'glTF');
  const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
  for(const [i,g,c] of states)assert.equal(valid(json,SHA,i,'BOTH',g,c),true,'scene '+i);
  assert.equal(valid(json,'0'.repeat(64),376),false);
  assert.equal(valid(json,SHA,376,'2F','CLOSED',false),false);
  assert.equal(valid(json,SHA,376,'BOTH','ONE_OPEN',false),false);
  assert.equal(valid(json,SHA,375),false);
  const old=json.scenes[376];
  const changed={...json,scenes:[...json.scenes]};
  changed.scenes[376]={...old,nodes:[...old.nodes]};
  changed.scenes[376].nodes[0]=12108;
  assert.equal(valid(changed,SHA,376),false);
  changed.scenes[376]={...old,extras:{...old.extras,
   ownerWallFloorCofit20261114:{...old.extras.ownerWallFloorCofit20261114,
   sourceLinksBound:true}}};
  assert.equal(valid(changed,SHA,376),false);
  const wrongNode={...json,nodes:[...json.nodes]};
  wrongNode.nodes[12109]={...json.nodes[12109],mesh:4556};
  assert.equal(valid(wrongNode,SHA,376),false);
 });
