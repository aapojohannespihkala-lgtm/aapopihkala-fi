import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_578_GLB_SHA256 as SHA,C80_578_GLB_BYTES as BYTES,
 C80_578_SCENES as SPECS}
 from '../../src/scripts/privateModelC80578All5PureSavoSourceProfile.mjs';
import {
 C80_578_VIEWER_ROLES as ROLES,
 resolveC80578SceneIndex as index,
 resolveC80578Scenes as resolve,
 createC80578All5FloorRuntime as create,
 c80578AtomicMount as atomicMount,
} from '../../src/scripts/privateModelC80578All5FloorRuntime.mjs';

const roles=[
 [572,'1F','CLOSED',false],[573,'2F','CLOSED',false],
 [574,'BOTH','CLOSED',false],[575,'BOTH','ONE_OPEN',false],
 [576,'BOTH','STACKED',false],[577,'BOTH','CLOSED',true],
];
test('578 scene-role contract is 1F/2F and four BOTH modes',()=>{
 assert.equal(ROLES['1F'],572);
 assert.equal(ROLES['2F'],573);
 assert.deepEqual(ROLES.BOTH,{CLOSED:574,ONE_OPEN:575,STACKED:576,CUTAWAY:577});
 for(const [i,f,g,c] of roles)assert.equal(index(f,g,c),i);
 assert.equal(Object.keys(SPECS).length,6);
});
test('unsupported glazing, cutaway, floor, type fail closed',()=>{
 for(const [f,g,c] of [
  ['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['2F','CLOSED',true],['1F','CLOSED',true],
  ['BOTH','STACKED',true],['BOTH','ONE_OPEN',true],
  ['BOTH','OPEN',false],['ROOF','CLOSED',false],
  ['BOTH','CLOSED','true'],
 ])assert.equal(index(f,g,c),null);
 assert.equal(index('BOTH'),574);
 assert.equal(index('1F'),572);
 assert.equal(index('2F'),573);
});
test('invalid source, SHA, partial GLTFLoader, or mount contract fail closed',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:new Array(578)},'bad'),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_578_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_578_SOURCE_SCENE_MISMATCH/);
});
test('atomic mount: commit only on verified target; rollback on callback throw',()=>{
 const before={name:'previous'},next={name:'next'};
 let current=before,calls=0;
 const ok=atomicMount({previous:before,target:next,
  mount(scene){current=scene;calls++;},mounted(){return current;}});
 assert.equal(ok.ok,true);
 assert.equal(current,next);
 current=before;
 const failure=atomicMount({previous:before,target:next,
  mount(scene){current=scene;calls++;
   if(scene===next)throw new Error('PARTIAL_MOUNT');},
  mounted(){return current;}});
 assert.equal(failure.ok,false);
 assert.equal(failure.restored,true);
 assert.match(failure.error.message,/PARTIAL_MOUNT/);
 assert.equal(current,before);
 assert.equal(calls,3);
});
test('atomic mount: wrong mounted scene or mounted() throw always rolls back',()=>{
 const before={name:'before'},next={name:'next'},foreign={name:'foreign'};
 let current=before;
 const wrong=atomicMount({previous:before,target:next,
  mount(scene){current=scene===next?foreign:scene;},mounted(){return current;}});
 assert.equal(wrong.ok,false);
 assert.equal(wrong.restored,true);
 assert.match(wrong.error.message,/C80_578_SCENE_MOUNT_MISMATCH/);
 assert.equal(current,before);
 const throws=atomicMount({previous:before,target:next,
  mount(scene){current=scene;},
  mounted(){if(current===next)throw new Error('READ_MOUNT_FAILED');return current;}});
 assert.equal(throws.ok,false);
 assert.equal(throws.restored,true);
 assert.match(throws.error.message,/READ_MOUNT_FAILED/);
 assert.equal(current,before);
});
test('atomic mount: rollback failure is explicitly unverified, never a success',()=>{
 const before={name:'before'},next={name:'next'};
 let current=before;
 const failure=atomicMount({previous:before,target:next,
  mount(scene){current=scene;throw new Error(scene===next?'TARGET_FAILED':'ROLLBACK_FAILED');},
  mounted(){return current;}});
 assert.equal(failure.ok,false);
 assert.equal(failure.restored,false);
 assert.match(failure.error.message,/TARGET_FAILED/);
 assert.match(failure.rollbackError.message,/ROLLBACK_FAILED/);
 const mismatch=atomicMount({previous:before,target:next,
  mount(scene){current={untrusted:scene};},
  mounted(){return current;}});
 assert.equal(mismatch.ok,false);
 assert.equal(mismatch.restored,false);
 assert.match(mismatch.rollbackError.message,/C80_578_SCENE_ROLLBACK_MISMATCH/);
});
/* This fixture intentionally uses original GLB JSON, not synthesized metadata.
 * Three.GLTFLoader itself remains a separate production WebGL gate.
 */
const file=process.env.C80_578_ALL5_GLB_PATH;
function mockLoader(json){
 const node=(id,depth=0)=>{
  if(depth>256)throw new Error('source node cycle/depth');
  const def=json.nodes[id];
  if(!def)throw new Error('bad source node');
  return {name:def.name||'',isMesh:Number.isInteger(def.mesh),
   children:(def.children||[]).map(n=>node(n,depth+1))};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 for(const i of Object.keys(SPECS).map(Number)){
  scenes[i]={
   name:json.scenes[i].name,
   children:json.scenes[i].nodes.map(id=>node(id)),
   traverse(fn){const go=o=>{fn(o);o.children.forEach(go);};this.children.forEach(go);},
  };
 }
 return {parser:{json,associations:new Map()},scenes};
}
test('original GLB: six real source scene graphs, mount switches and HOLD',
 {skip:!file},()=>{
 const bin=readFileSync(file);
 assert.equal(bin.length,BYTES);
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=mockLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[574],calls=0;
 const r=create({gltf,sha:SHA,mount(x){current=x;calls++;},mounted(){return current;}});
 assert.equal(r.defaultScene,current);
 assert.equal(r.floorSceneSource,'C80_578_ALL5_SOURCE_ONLY');
 assert.equal(r.sourceLinksStatus,'NOT_BOUND');
 assert.equal(r.productionWebGLStatus,'NOT_RUN');
 assert.equal(r.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(r.physicalHostStatus,'NOT_VERIFIED');
 for(const [i,f,g,c] of roles){
  assert.equal(r.restore(),true);
  assert.ok(r.apply(f,g));
  if(c)assert.ok(r.setCutaway(true));
  assert.equal(r.sceneIndex,i);
  assert.equal(r.selectedScene,current);
  assert.equal(r.floor,f);
 }
 r.restore();
 r.setGlazing('STACKED');
 assert.equal(r.sceneIndex,576);
 assert.ok(r.apply('1F'));
 assert.equal(r.glazing,'CLOSED');
 assert.equal(r.sceneIndex,572);
 assert.equal(r.setCutaway(true),null);
 assert.equal(r.setGlazing('STACKED'),null);
 assert.ok(r.apply('BOTH'));
 assert.equal(r.sceneIndex,574);
 assert.ok(r.setCutaway(true));
 assert.equal(r.setGlazing('ONE_OPEN'),null);
 assert.ok(r.setCutaway(false));
 current={name:'different viewer model'};
 assert.equal(r.apply('2F'),null);
 assert.equal(r.restore(),false);
 current=scenes[574];
 r.dispose();
 assert.equal(r.apply('2F'),null);
 assert.equal(r.restore(),false);
 assert.ok(calls>6);
});
test('original GLB: malicious metadata and live rendered tree mutations reject swaps',
 {skip:!file},()=>{
 const bin=readFileSync(file);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=mockLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[574];
 const r=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 const old=json.scenes[575].extras.current;
 json.scenes[575].extras.current=true;
 assert.equal(r.setGlazing('ONE_OPEN'),null);
 json.scenes[575].extras.current=old;
 assert.ok(r.setGlazing('ONE_OPEN'));
 assert.equal(r.restore(),true);
 scenes[573].children[0].position={x:0.2,y:0,z:0};
 assert.equal(r.apply('2F'),null);
 delete scenes[573].children[0].position;
 scenes[574].children[0].name='IMPOSTOR_ROOT';
 assert.equal(r.apply('2F'),null);
 assert.equal(r.restore(),false);
});
test('original GLB: rollback preserves sceneIndex and unrecoverable mount quarantines',
 {skip:!file},()=>{
 const bin=readFileSync(file);
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=mockLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[574],mode='throw-target';
 const runtime=create({gltf,sha:SHA,mount(scene){
  current=scene;
  if(mode==='throw-target'&&scene===scenes[575])
   throw new Error('PARTIAL_VIEWER_MOUNT');
  if(mode==='throw-restore'&&scene===scenes[574])
   throw new Error('RESTORE_VIEWER_MOUNT');
  if(mode==='throw-all')throw new Error('UNRECOVERABLE_MOUNT');
 },mounted(){return current;}});
 assert.throws(()=>runtime.setGlazing('ONE_OPEN'),/PARTIAL_VIEWER_MOUNT/);
 assert.equal(current,scenes[574]);
 assert.equal(runtime.sceneIndex,574);
 assert.equal(runtime.quarantined,false);
 assert.equal(runtime.available,true);
 mode='normal';
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 assert.equal(runtime.sceneIndex,575);
 mode='throw-restore';
 assert.throws(()=>runtime.restore(),/RESTORE_VIEWER_MOUNT/);
 assert.equal(current,scenes[575]);
 assert.equal(runtime.sceneIndex,575);
 mode='throw-all';
 assert.throws(()=>runtime.restore(),/C80_578_SCENE_ROLLBACK_FAILED/);
 assert.equal(runtime.quarantined,true);
 assert.equal(runtime.available,false);
 assert.equal(runtime.selectedScene,null);
 assert.equal(runtime.sceneIndex,null);
 assert.equal(runtime.active,false);
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
});
