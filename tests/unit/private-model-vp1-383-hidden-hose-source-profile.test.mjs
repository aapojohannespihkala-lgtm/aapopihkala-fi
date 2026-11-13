import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  normalizeVP1383Options as normalizeRuntime,
  resolveVP1383Scenes as resolveRuntimeScenes,
  createVP1383FloorRuntime,
} from '../../src/scripts/privateModelVP1383FloorRuntime.mjs';
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

test('VP1 runtime normalizes only authored 1F and BOTH scene options',()=>{
  assert.deepEqual(normalizeRuntime('1F','ONE_OPEN',true),
    {floor:'1F',glazing:'CLOSED',cutaway:false});
  assert.deepEqual(normalizeRuntime('BOTH','ONE_OPEN',true),
    {floor:'BOTH',glazing:'ONE_OPEN',cutaway:false});
  assert.deepEqual(normalizeRuntime('BOTH','CLOSED',true),
    {floor:'BOTH',glazing:'CLOSED',cutaway:true});
  assert.equal(normalizeRuntime('2F','CLOSED',false),null);
  assert.equal(normalizeRuntime('BOTH','OPEN',false),null);
  assert.equal(normalizeRuntime('BOTH','CLOSED','true'),null);
});
test('VP1 runtime refuses wrong SHA, incomplete glTF or invalid mount callbacks',()=>{
  assert.equal(resolveRuntimeScenes({scenes:Array(383)},SHA),null);
  assert.equal(resolveRuntimeScenes({},SHA),null);
  assert.equal(resolveRuntimeScenes({parser:{json:{scenes:Array(383)}},
    scenes:Array(383)},'0'.repeat(64)),null);
  assert.throws(()=>createVP1383FloorRuntime({
    gltf:{},sha:SHA,mount:()=>{},mounted:()=>null,
  }),/VP1_383_SOURCE_SCENE_MISMATCH/);
  assert.throws(()=>createVP1383FloorRuntime({gltf:{},sha:SHA}),
    /VP1_383_RUNTIME_CALLBACKS_REQUIRED/);
});
// Uses the entire SHA-verified original private GLB in a local-only fixture.
// CI still has a deterministic fail-closed branch without storing private GLB.
test('VP1 original real-GLB runtime mounts and restores all five internal scenes',
  {skip:!process.env.YLIS_VP1_383_GLB},()=>{
    const data=readFileSync(process.env.YLIS_VP1_383_GLB);
    assert.equal(data.length,BYTES);
    assert.equal(createHash('sha256').update(data).digest('hex'),SHA);
    const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
    const gltf={scenes:json.scenes.map(s=>({
      name:s.name,
      children:(s.nodes??[]).map(i=>({name:json.nodes[i].name})),
      traverse(fn){for(const c of this.children)fn(c);},
    })),parser:{json}};
    const scenes=resolveRuntimeScenes(gltf,SHA);
    assert.ok(scenes);
    assert.deepEqual(Object.keys(scenes).map(Number),states.map(s=>s[0]));
    let mounted=gltf.scenes[379];
    const runtime=createVP1383FloorRuntime({
      gltf,sha:SHA,mount:s=>{mounted=s;},mounted:()=>mounted,
    });
    assert.equal(runtime.defaultScene,gltf.scenes[379]);
    assert.equal(runtime.sceneIndex,379);
    assert.equal(runtime.apply('2F'),null);
    assert.ok(runtime.apply('1F'));
    assert.equal(runtime.sceneIndex,378);
    assert.equal(runtime.setCutaway(true),null);
    assert.ok(runtime.apply('BOTH'));
    assert.equal(runtime.sceneIndex,379);
    assert.ok(runtime.setGlazing('ONE_OPEN'));
    assert.equal(runtime.sceneIndex,380);
    assert.equal(runtime.setCutaway(true),null);
    assert.ok(runtime.setGlazing('STACKED'));
    assert.equal(runtime.sceneIndex,381);
    assert.ok(runtime.setGlazing('CLOSED'));
    assert.ok(runtime.setCutaway(true));
    assert.equal(runtime.sceneIndex,382);
    runtime.restore();
    assert.equal(runtime.sceneIndex,379);
    assert.equal(mounted,gltf.scenes[379]);
    assert.equal(runtime.active,false);
    runtime.dispose();
    assert.equal(runtime.apply('BOTH'),null);
  });
