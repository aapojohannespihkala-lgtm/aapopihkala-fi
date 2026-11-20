import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  FLOOR_ZFIGHT_DRIVE_ID,FLOOR_ZFIGHT_ZIP_SHA256,
  FLOOR_ZFIGHT_GLB_SHA256 as SHA,FLOOR_ZFIGHT_GLB_BYTES as BYTES,
  FLOOR_ZFIGHT_PARENT_GLB_SHA256,FLOOR_ZFIGHT_DEFAULT_SCENE,
  FLOOR_ZFIGHT_COUNTS,FLOOR_ZFIGHT_SCENES,
  floorZfightRootsFnv32 as fnv,resolveFloorZfightSceneIndex as choose,
  isFloorZfightSourceScene as validate,
} from '../../src/scripts/privateModelFloorZfightSourceProfile.mjs';
const expected=[[369,'CLOSED',false,362],[370,'ONE_OPEN',false,364],
                [371,'STACKED',false,366],[372,'CLOSED',true,368]];
test('floor cap source identity and scene selection are exact',()=>{
  assert.equal(FLOOR_ZFIGHT_DRIVE_ID,'183YkkoV6_9bU-i3U2SbtdKAb8H5v7HCG');
  assert.match(FLOOR_ZFIGHT_ZIP_SHA256,/^[0-9a-f]{64}$/);
  assert.match(FLOOR_ZFIGHT_PARENT_GLB_SHA256,/^[0-9a-f]{64}$/);
  assert.equal(BYTES,54044948);
  assert.equal(FLOOR_ZFIGHT_DEFAULT_SCENE,292);
  assert.deepEqual(FLOOR_ZFIGHT_COUNTS,{scenes:373,nodes:12109,meshes:4557});
  assert.deepEqual(Object.keys(FLOOR_ZFIGHT_SCENES).map(Number),expected.map(x=>x[0]));
  for(const [i,g,c,source] of expected){
    assert.equal(choose(SHA,'BOTH',g,c),i);
    assert.equal(FLOOR_ZFIGHT_SCENES[i].sourceScene,source);
    assert.match(FLOOR_ZFIGHT_SCENES[i].rootFnv,/^[0-9a-f]{8}$/);
    assert.match(FLOOR_ZFIGHT_SCENES[i].name,/FLOOR_ZFIGHT_FIX_OPTIN$/);
  }
});
test('non-matching SHA or unauthored floor/glazing/cutaway fails closed',()=>{
  for(const [sha,f,g,c] of [
    ['0'.repeat(64),'BOTH','CLOSED',false],
    [SHA,'2F','CLOSED',false],[SHA,'1F','CLOSED',false],
    [SHA,'BOTH','ONE_OPEN',true],[SHA,'BOTH','STACKED',true],
    [SHA,'BOTH','GLASS_OPEN',false],[SHA,'BOTH','CLOSED','true'],
  ])assert.equal(choose(sha,f,g,c),null);
  assert.equal(validate({},SHA,369),false);
  assert.equal(validate({scenes:Array(373)},'0'.repeat(64),369),false);
  assert.equal(validate({},SHA,362),false);
});
test('root fingerprint checks ordering and input validity',()=>{
  assert.equal(fnv([]),'811c9dc5');
  assert.notEqual(fnv([9913,12108]),fnv([12108,9913]));
  assert.equal(fnv([-1]),null);
  assert.equal(fnv([1,NaN]),null);
});
// The private raw GLB is NOT downloaded into GitHub CI. The optional test runs
// against an independently SHA-verified local GLB when available.
test('real GLB: all four repaired scenes and negative role/identity gates',
  {skip:!process.env.YLIS_FLOOR_ZFIGHT_GLB},()=>{
    const bytes=readFileSync(process.env.YLIS_FLOOR_ZFIGHT_GLB);
    assert.equal(bytes.length,BYTES);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
    const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    for(const [i,g,c] of expected){
      assert.equal(validate(json,SHA,i,'BOTH',g,c),true,'valid scene '+i);
      assert.equal(validate(json,SHA,i,'2F',g,c),false,'wrong floor '+i);
    }
    assert.equal(validate(json,SHA,362),false);
    assert.equal(validate(json,'0'.repeat(64),369),false);
    const broken=structuredClone(json);
    broken.scenes[369].extras.floorZFightFix.sourceLinksBindingVerified=true;
    assert.equal(validate(broken,SHA,369),false);
    broken.scenes[369].extras.floorZFightFix.sourceLinksBindingVerified=false;
    broken.scenes[369].nodes[0]=9913;
    assert.equal(validate(broken,SHA,369),false);
  });
