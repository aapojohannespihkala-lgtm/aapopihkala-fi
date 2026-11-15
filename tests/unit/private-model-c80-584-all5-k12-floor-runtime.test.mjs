import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_584_GLB_SHA256 as SHA,C80_584_GLB_BYTES as BYTES,
 C80_584_SCENES as SPECS,
} from '../../src/scripts/privateModelC80584All5K12TileSourceProfile.mjs';
import {
 C80_584_VIEWER_ROLES as ROLES,
 resolveC80584SceneIndex as index,
 resolveC80584Scenes as resolve,
 createC80584All5K12FloorRuntime as create,
 c80584AtomicMount as atomic,
} from '../../src/scripts/privateModelC80584All5K12FloorRuntime.mjs';

const roles=[
 [578,'1F','CLOSED',false],[579,'2F','CLOSED',false],
 [580,'BOTH','CLOSED',false],[581,'BOTH','ONE_OPEN',false],
 [582,'BOTH','STACKED',false],[583,'BOTH','CLOSED',true],
];
test('C80 584 exactly six opt-in 1F/2F/BOTH and K12 floor semantics',()=>{
 assert.equal(ROLES['1F'],578);assert.equal(ROLES['2F'],579);
 assert.deepEqual(ROLES.BOTH,{CLOSED:580,ONE_OPEN:581,STACKED:582,CUTAWAY:583});
 for(const [i,f,g,c] of roles){
  assert.equal(index(f,g,c),i);
  assert.equal(SPECS[i].tiles,i!==579);
  assert.equal(SPECS[i].parent,i-6);
 }
});
test('invalid floor/glazing/cutaway and wrong SHA fail closed',()=>{
 for(const [f,g,c] of [
  ['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['1F','CLOSED',true],['2F','CLOSED',true],
  ['BOTH','STACKED',true],['BOTH','ONE_OPEN',true],
  ['BOTH','OPEN',false],['OTHER','CLOSED',false],
  ['BOTH','CLOSED','true'],
 ])assert.equal(index(f,g,c),null);
 assert.equal(index('BOTH'),580);
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:Array(584)},'wrong-sha'),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_584_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_584_SOURCE_SCENE_MISMATCH/);
});
test('atomic mount commits only verified target and rolls back on throw',()=>{
 const old={name:'old'},next={name:'next'};
 let current=old;
 assert.equal(atomic({previous:old,target:next,
  mount(x){current=x;},mounted(){return current;}}).ok,true);
 assert.equal(current,next);
 current=old;
 let calls=0;
 const failure=atomic({previous:old,target:next,mount(x){
  current=x;calls++;if(x===next)throw new Error('PARTIAL_MOUNT');
 },mounted(){return current;}});
 assert.equal(failure.ok,false);assert.equal(failure.restored,true);
 assert.equal(current,old);assert.equal(calls,2);
 assert.match(failure.error.message,/PARTIAL_MOUNT/);
});
test('atomic mount rejects false mounted confirmation and quarantines bad rollback',()=>{
 const old={name:'old'},next={name:'next'},foreign={name:'foreign'};
 let current=old;
 const mismatch=atomic({previous:old,target:next,
  mount(x){current=x===next?foreign:x;},mounted(){return current;}});
 assert.equal(mismatch.ok,false);assert.equal(mismatch.restored,true);
 assert.match(mismatch.error.message,/SCENE_MOUNT_MISMATCH/);
 assert.equal(current,old);
 const bad=atomic({previous:old,target:next,
  mount(x){current=x;throw new Error(x===next?'TARGET':'ROLLBACK');},
  mounted(){return current;}});
 assert.equal(bad.ok,false);assert.equal(bad.restored,false);
 assert.match(bad.rollbackError.message,/ROLLBACK/);
 const wrong=atomic({previous:old,target:next,
  mount(x){current={wrong:x};},mounted(){return current;}});
 assert.equal(wrong.restored,false);
 assert.match(wrong.rollbackError.message,/SCENE_ROLLBACK_MISMATCH/);
});

const file=process.env.C80_584_ALL5_K12_GLB_PATH;
function sourceLoader(json){
 const graph=(id,depth=0)=>{
  if(depth>256)throw new Error('cycle');
  const node=json.nodes[id];
  if(!node)throw new Error('invalid glTF node');
  return {name:node.name||'',isMesh:Number.isInteger(node.mesh),
   children:(node.children||[]).map(n=>graph(n,depth+1))};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 for(const spec of Object.values(SPECS)){
  const i=spec.scene;
  scenes[i]={name:json.scenes[i].name,
   children:json.scenes[i].nodes.map(graph),
   traverse(fn){const go=x=>{fn(x);x.children.forEach(go);};this.children.forEach(go);}
  };
 }
 return {parser:{json,associations:new Map()},scenes};
}
function original(){
 const bin=readFileSync(file);
 assert.equal(bin.length,BYTES);
 assert.equal(bin.toString('ascii',0,4),'glTF');
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 return JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
}
test('optional authentic GLB: six mounted source graphs preserve K12 1F/BOTH only',
 {skip:!file},()=>{
 const json=original(),gltf=sourceLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[580];
 const runtime=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 assert.equal(runtime.productionWebGLStatus,'NOT_RUN');
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.k12PhotoAsBuiltStatus,'WORK_ASSUMPTION_ONLY');
 for(const [i,f,g,c] of roles){
  assert.equal(runtime.restore(),true);
  assert.ok(runtime.apply(f,g));
  if(c)assert.ok(runtime.setCutaway(true));
  assert.equal(runtime.sceneIndex,i);
  assert.equal(runtime.selectedScene,current);
 }
 assert.ok(runtime.apply('1F'));
 assert.equal(runtime.sceneIndex,578);
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 assert.equal(runtime.setCutaway(true),null);
 assert.ok(runtime.apply('BOTH'));
 current={foreign:true};
 assert.equal(runtime.apply('2F'),null);
 assert.equal(runtime.restore(),false);
 current=scenes[580];
 runtime.dispose();
 assert.equal(runtime.restore(),false);
});
test('optional authentic GLB: metadata mutations and partial mounts cannot silently swap',
 {skip:!file},()=>{
 const json=original(),gltf=sourceLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[580],mode='fail-target';
 const runtime=create({gltf,sha:SHA,mount(scene){
  current=scene;
  if(mode==='fail-target'&&scene===scenes[581])throw new Error('PARTIAL_TARGET');
  if(mode==='fail-rollback'&&scene===scenes[580])throw new Error('PARTIAL_ROLLBACK');
  if(mode==='fail-all')throw new Error('UNRECOVERABLE');
 },mounted(){return current;}});
 assert.throws(()=>runtime.setGlazing('ONE_OPEN'),/PARTIAL_TARGET/);
 assert.equal(runtime.sceneIndex,580);
 assert.equal(current,scenes[580]);
 mode='normal';
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 assert.equal(runtime.sceneIndex,581);
 mode='fail-rollback';
 assert.throws(()=>runtime.restore(),/PARTIAL_ROLLBACK/);
 assert.equal(runtime.sceneIndex,581);
 assert.equal(current,scenes[581]);
 mode='fail-all';
 assert.throws(()=>runtime.restore(),/SCENE_ROLLBACK_FAILED/);
 assert.equal(runtime.quarantined,true);
 assert.equal(runtime.available,false);
 assert.equal(runtime.selectedScene,null);
 assert.equal(runtime.apply('2F'),null);
 const broken=original();
 broken.scenes[580].extras.CURRENT='APPROVED';
 assert.equal(resolve(sourceLoader(broken),SHA),null);
});
