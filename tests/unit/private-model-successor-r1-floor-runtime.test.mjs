import test from 'node:test';
import assert from 'node:assert/strict';
import {SUCCESSOR_R1_SHA256,SUCCESSOR_R1_SCENES} from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import {successorR1IndexFor,selectSuccessorR1Scene,resolveSuccessorR1Scenes,createSuccessorR1FloorRuntime} from '../../src/scripts/privateModelSuccessorR1FloorRuntime.mjs';

test('nine exact internally numbered successor variants, no guessed 1F glazing/cutaway',()=>{
 const expected=[
  ['1F','CLOSED',false,360],['2F','CLOSED',false,361],
  ['BOTH','CLOSED',false,362],['2F','ONE_OPEN',false,363],
  ['BOTH','ONE_OPEN',false,364],['2F','STACKED',false,365],
  ['BOTH','STACKED',false,366],['1F','CLOSED',true,367],
  ['BOTH','CLOSED',true,368],
 ];
 assert.deepEqual(expected.map(x=>x[3]),Object.keys(SUCCESSOR_R1_SCENES).map(Number));
 for(const [floor,glazing,cutaway,i] of expected){
  assert.equal(successorR1IndexFor(floor,glazing,cutaway),i);
  const s=SUCCESSOR_R1_SCENES[i];
  assert.deepEqual([s.floor,s.glazing,s.cutaway],[floor,glazing,cutaway]);
 }
 for(const [floor,glazing,cutaway] of [
  ['1F','ONE_OPEN',false],['1F','STACKED',false],
  ['2F','CLOSED',true],['2F','ONE_OPEN',true],['2F','STACKED',true],
  ['BOTH','ONE_OPEN',true],['BOTH','STACKED',true],
  ['1F','CLOSED','true'],['NO_FLOOR','CLOSED',false]]){
  assert.equal(successorR1IndexFor(floor,glazing,cutaway),null);
 }
});
test('source-selection cannot be tricked into accepting unverified JSON or SHA',()=>{
 const fake={asset:{extras:{Canonical:false}},scene:292,scenes:Array.from({length:369},()=>({})),nodes:[],meshes:[]};
 for(const i of [360,361,362,363,364,365,366,367,368]){
  const s=SUCCESSOR_R1_SCENES[i];
  assert.deepEqual(selectSuccessorR1Scene({json:fake,sha:'f'.repeat(64),floor:s.floor,glazing:s.glazing,cutaway:s.cutaway}),{ok:false,reason:'SUCC_R1_SOURCE_MISMATCH'});
  assert.deepEqual(selectSuccessorR1Scene({json:fake,sha:SUCCESSOR_R1_SHA256,floor:s.floor,glazing:s.glazing,cutaway:s.cutaway}),{ok:false,reason:'SUCC_R1_SOURCE_MISMATCH'});
 }
 assert.deepEqual(selectSuccessorR1Scene({json:fake,sha:SUCCESSOR_R1_SHA256,floor:'2F',glazing:'CLOSED',cutaway:true}),{ok:false,reason:'SUCC_R1_UNSUPPORTED_COMBINATION'});
 assert.deepEqual(selectSuccessorR1Scene({json:fake,sha:SUCCESSOR_R1_SHA256,floor:'',glazing:'CLOSED'}),{ok:false,reason:'SUCC_R1_INVALID_SELECTION'});
});
test('no inherited M6263 source or old scene can masquerade as new source',()=>{
 const mock={parser:{json:{scene:292,scenes:Array.from({length:369},()=>({}))}},scenes:Array.from({length:369},()=>({children:[]}))};
 assert.equal(resolveSuccessorR1Scenes(mock,'8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5'),null);
 assert.equal(resolveSuccessorR1Scenes(mock,SUCCESSOR_R1_SHA256),null);
 assert.throws(()=>createSuccessorR1FloorRuntime({gltf:mock,sha:SUCCESSOR_R1_SHA256,mount:()=>{},mounted:()=>{}}),/SUCC_R1_SOURCE_SCENE_MISMATCH/);
 assert.throws(()=>createSuccessorR1FloorRuntime({gltf:mock,sha:SUCCESSOR_R1_SHA256,mount:()=>{}}),/SUCC_R1_MOUNT_API_MISSING/);
});
