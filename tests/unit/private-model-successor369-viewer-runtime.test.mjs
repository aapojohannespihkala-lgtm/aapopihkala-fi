import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  SUCCESSOR_R1_SHA256 as SHA,
  SUCCESSOR_R1_SCENES as scenes,
} from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import {
  resolveSuccessor369SceneIndex as choose,
  normalizeSuccessor369Options as normalize,
  resolveSuccessor369Scenes,
  createSuccessor369FloorRuntime,
} from '../../src/scripts/privateModelSuccessor369FloorRuntime.mjs';

const states=[
 ['1F','CLOSED',false,360],
 ['2F','CLOSED',false,361],
 ['BOTH','CLOSED',false,362],
 ['2F','ONE_OPEN',false,363],
 ['BOTH','ONE_OPEN',false,364],
 ['2F','STACKED',false,365],
 ['BOTH','STACKED',false,366],
 ['1F','CLOSED',true,367],
 ['BOTH','CLOSED',true,368],
];
test('all nine actual source scenes are selectable by strict SHA, floor, glazing and cutaway',()=>{
 assert.deepEqual(Object.keys(scenes).map(Number),states.map(x=>x[3]));
 for(const [floor,glazing,cutaway,id] of states){
  assert.equal(choose(SHA,floor,glazing,cutaway),id);
  assert.equal(scenes[id].floor,floor);
  assert.equal(scenes[id].glazing,glazing);
  assert.equal(scenes[id].cutaway,cutaway);
 }
});
test('unknown SHA, illegal floor, nonexistent 1F opening or 2F cutaway fail closed',()=>{
 for(const params of [
  ['0'.repeat(64),'BOTH','CLOSED',false],
  [SHA,'1F','ONE_OPEN',false],
  [SHA,'1F','STACKED',false],
  [SHA,'2F','CLOSED',true],
  [SHA,'2F','ONE_OPEN',true],
  [SHA,'BOTH','ONE_OPEN',true],
  [SHA,'BOTH','STACKED',true],
  [SHA,'BOTH','OPEN',false],
  [SHA,'BUILDING','CLOSED',false],
  [SHA,'BOTH','CLOSED','true'],
 ]){
  assert.equal(choose(...params),null);
 }
 assert.equal(resolveSuccessor369Scenes({},SHA),null);
 assert.equal(resolveSuccessor369Scenes({scenes:Array(369)},SHA),null);
});
test('viewer transition normalization is explicit, no invented 1F or cutaway scenes',()=>{
 assert.deepEqual(normalize('1F','ONE_OPEN',true),{floor:'1F',glazing:'CLOSED',cutaway:true});
 assert.deepEqual(normalize('2F','CLOSED',true),{floor:'2F',glazing:'CLOSED',cutaway:false});
 assert.deepEqual(normalize('BOTH','STACKED',true),{floor:'BOTH',glazing:'STACKED',cutaway:false});
 assert.deepEqual(normalize('BOTH','CLOSED',true),{floor:'BOTH',glazing:'CLOSED',cutaway:true});
 assert.equal(normalize('BOTH','INVALID',false),null);
 assert.equal(normalize('2F','CLOSED','yes'),null);
});
test('existing C80 M6263 SHA is not accepted as the successor',()=>{
 assert.equal(choose('8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5','BOTH','CLOSED',false),null);
 assert.equal(choose('ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b','BOTH','CLOSED',false),null);
});
test('UI receiver uses exact opt-in root scene and keeps older M6263 path',()=>{
 const text=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
 assert.match(text,/resolveSuccessor369Scenes\(gltf,loadedModelSha256\(gltf\)\)/);
 assert.match(text,/createSuccessor369FloorRuntime\(/);
 assert.match(text,/SUCCESSOR_R1_SHA256/);
 assert.match(text,/TATE4_MJ6263_SOURCE_SHA256/);
 assert.match(text,/PK1-huoltoleikkaus/);
});
// Not part of CI without an independently SHA-verified real GLB source.
// This uses real glTF internal scenes, never ZIP __sceneN filenames.
test('full original GLB 9/9 scene lifecycle and mount', {skip:!process.env.YLIS_SUCC369_GLB},()=>{
 const data=readFileSync(process.env.YLIS_SUCC369_GLB);
 assert.equal(createHash('sha256').update(data).digest('hex'),SHA);
 const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
 const gltf={scenes:json.scenes.map(s=>({
  name:s.name,
  children:(s.nodes??[]).map(i=>({name:json.nodes[i].name})),
  traverse(fn){for(const node of this.children)fn(node);},
 })),parser:{json}};
 let mounted=gltf.scenes[362];
 const runtime=createSuccessor369FloorRuntime({gltf,sha:SHA,mount:s=>{mounted=s;},mounted:()=>mounted});
 for(const [floor,glazing,cutaway,id] of states){
  runtime.restore();
  assert.ok(runtime.apply(floor,glazing));
  if(cutaway)assert.ok(runtime.setCutaway(true));
  assert.equal(runtime.sceneIndex,id);
  assert.equal(mounted,gltf.scenes[id]);
 }
 runtime.restore();
 assert.equal(runtime.sceneIndex,362);
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
});
