import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  V84_FLOORZ380_DRIVE_ID,V84_FLOORZ380_ZIP_SHA256,V84_FLOORZ380_GLB_SHA256 as SHA,
  V84_FLOORZ380_GLB_BYTES as BYTES,V84_FLOORZ380_COUNTS,V84_FLOORZ380_SCENES,
  resolveV84FloorZ380SceneIndex as choose,isV84FloorZ380SourceScene as valid,
  v84FloorZ380RootsFnv32 as fnv,
} from '../../src/scripts/privateModelV84FloorZ380SourceProfile.mjs';
const scenes=[[376,'CLOSED',false],[377,'ONE_OPEN',false],[378,'STACKED',false],[379,'CLOSED',true]];
test('composite original Drive SHA and exactly four authored internal scenes',()=>{
  assert.equal(V84_FLOORZ380_DRIVE_ID,'1P6W3EVr1F6PzZXnd1MTudqbuHb5Kjnfp');
  assert.equal(V84_FLOORZ380_ZIP_SHA256,'2710c548fff5e441dcd341566c99290513ffc0803b66f9efc0025da53a765112');
  assert.equal(BYTES,54081264);
  assert.deepEqual(V84_FLOORZ380_COUNTS,{scenes:380,nodes:12110,meshes:4558,accessors:10206});
  assert.deepEqual(Object.keys(V84_FLOORZ380_SCENES).map(Number),scenes.map(x=>x[0]));
  for(const [i,g,c] of scenes){
    assert.equal(choose(SHA,'BOTH',g,c),i);
    assert.match(V84_FLOORZ380_SCENES[i].fnv,/^[0-9a-f]{8}$/);
  }
});
test('wrong SHA, absent 1F or 2F, unsupported mode, cutaway fail closed',()=>{
  for(const [sha,f,g,c] of [
    ['0'.repeat(64),'BOTH','CLOSED',false],[SHA,'1F','CLOSED',false],[SHA,'2F','CLOSED',false],
    [SHA,'BOTH','ONE_OPEN',true],[SHA,'BOTH','STACKED',true],[SHA,'BOTH','OPEN',false],
    [SHA,'BOTH','CLOSED','true'],
  ])assert.equal(choose(sha,f,g,c),null);
  assert.equal(valid({},SHA,376),false);
  assert.equal(valid({},SHA,362),false);
  assert.equal(valid({scenes:Array(380)},'0'.repeat(64),376),false);
});
test('ordered root FNV and structurally invalid root IDs',()=>{
  assert.equal(fnv([]),'811c9dc5');
  assert.notEqual(fnv([12108,12109]),fnv([12109,12108]));
  assert.equal(fnv([1,NaN]),null);
  assert.equal(fnv([-1]),null);
});
test('exact original inner GLB 4 scenes, old wall exclusion and no false source promotion',
 {skip:!process.env.YLIS_V84_FLOORZ380_GLB},()=>{
  const b=readFileSync(process.env.YLIS_V84_FLOORZ380_GLB);
  assert.equal(b.length,BYTES);
  assert.equal(createHash('sha256').update(b).digest('hex'),SHA);
  const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
  for(const [i,g,c] of scenes){
    assert.equal(valid(gltf,SHA,i,'BOTH',g,c),true,'source scene '+i);
    assert.equal(valid(gltf,SHA,i,'2F',g,c),false);
  }
  assert.equal(valid(gltf,SHA,375),false);
  assert.equal(valid(gltf,'0'.repeat(64),376),false);
  const changed=structuredClone(gltf);
  changed.scenes[376].extras.ownerWallFloorCofit20261114.sourceLinksBound=true;
  assert.equal(valid(changed,SHA,376),false);
  changed.scenes[376].extras.ownerWallFloorCofit20261114.sourceLinksBound=false;
  changed.scenes[376].nodes[0]=9913;
  assert.equal(valid(changed,SHA,376),false);
  changed.scenes[376].nodes[0]=gltf.scenes[376].nodes[0];
  changed.nodes[12109].extras.floorZFightFix.oldUpperCapTriangles=[24];
  assert.equal(valid(changed,SHA,376),false);
 });
