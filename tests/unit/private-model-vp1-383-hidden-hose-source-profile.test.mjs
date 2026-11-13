import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  VP1_383_GLB_SHA256 as SHA,
  VP1_383_GLB_SIZE as BYTES,
  VP1_383_SCENES as scenes,
  VP1_383_DEFAULT_SCENE as DEFAULT,
  VP1_383_ZIP_SHA256,
  VP1_383_DRIVE_ID,
  isVP1383SourceScene as valid,
  resolveVP1383SourceSceneIndex as choose,
  vp1383RootFnv32 as fnv,
} from '../../src/scripts/privateModelVP1383HiddenHoseSourceProfile.mjs';
const states=[
  [378,'1F','CLOSED',false,12117],
  [379,'BOTH','CLOSED',false,12119],
  [380,'BOTH','ONE_OPEN',false,12119],
  [381,'BOTH','STACKED',false,12119],
  [382,'BOTH','CLOSED',true,12119],
];
test('VP1 corrected source identity and exactly five authored internal scenes',()=>{
  assert.match(SHA,/^[0-9a-f]{64}$/);
  assert.equal(BYTES,54131280);
  assert.equal(DEFAULT,292);
  assert.match(VP1_383_ZIP_SHA256,/^[0-9a-f]{64}$/);
  assert.equal(VP1_383_DRIVE_ID,'19o8_cvPhKym17pO_UybYKHEQ83PKBoFm');
  assert.deepEqual(Object.keys(scenes).map(Number),states.map(s=>s[0]));
  for(const [i,f,g,c,root] of states){
    assert.equal(choose(SHA,f,g,c),i);
    assert.equal(scenes[i].vp1Root,root);
    assert.match(scenes[i].name,/VP1_NO_VISIBLE_OUTDOOR_HOSE/);
    assert.match(scenes[i].rootFnv,/^[0-9a-f]{8}$/);
  }
});
test('unknown SHA, fictional floors or un-authored glazings and cutaways fail closed',()=>{
  for(const [sha,floor,glazing,cutaway] of [
    ['0'.repeat(64),'BOTH','CLOSED',false],
    [SHA,'2F','CLOSED',false],
    [SHA,'1F','ONE_OPEN',false],
    [SHA,'1F','STACKED',false],
    [SHA,'1F','CLOSED',true],
    [SHA,'BOTH','ONE_OPEN',true],
    [SHA,'BOTH','STACKED',true],
    [SHA,'BOTH','OPEN',false],
    [SHA,'WHOLE','CLOSED',false],
    [SHA,'BOTH','CLOSED','true'],
  ])assert.equal(choose(sha,floor,glazing,cutaway),null);
  assert.equal(valid({},SHA,379),false);
  assert.equal(valid({scenes:Array(383)},'0'.repeat(64),379),false);
});
test('FNV root fingerprint rejects invalid or unordered source roots',()=>{
  assert.equal(fnv([]),'811c9dc5');
  assert.notEqual(fnv([12119,9003]),fnv([9003,12119]));
  assert.equal(fnv([1,NaN]),null);
  assert.equal(fnv([-1]),null);
});
// Optional direct raw-GLB fixture: intentionally not downloaded by CI.
// The test requires an independently verified inner GLB supplied as a path.
test('authentic entire VP1 source GLB validates five scenes',
  {skip:!process.env.YLIS_VP1_383_GLB},()=>{
    const data=readFileSync(process.env.YLIS_VP1_383_GLB);
    assert.equal(data.length,BYTES);
    assert.equal(createHash('sha256').update(data).digest('hex'),SHA);
    const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
    for(const [i,f,g,c] of states)assert.equal(valid(json,SHA,i,f,g,c),true,'scene '+i);
    assert.equal(valid(json,SHA,377),false);
    assert.equal(valid(json,'0'.repeat(64),379),false);
    assert.equal(valid(json,SHA,379,'2F','CLOSED',false),false);
  });
