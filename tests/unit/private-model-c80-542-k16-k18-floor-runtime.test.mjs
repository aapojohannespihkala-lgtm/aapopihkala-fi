import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_WPD_K16K18_GLB_SHA256 as SHA,
 C80_WPD_K16K18_GLB_BYTES as BYTES,
 C80_WPD_K16K18_SCENES as SPECS,
} from '../../src/scripts/privateModelC80542K16K18SourceProfile.mjs';
import {
 C80_542_K16K18_ROLES as ROLES,
 resolveC80542K16K18SceneIndex as index,
 resolveC80542K16K18RenderedScenes as resolve,
 createC80542K16K18FloorRuntime as create,
 c80542K16K18AtomicMount as atomicMount,
} from '../../src/scripts/privateModelC80542K16K18FloorRuntime.mjs';

const roles=[
 [536,'1F','CLOSED',false],[537,'2F','CLOSED',false],
 [538,'BOTH','CLOSED',false],[539,'BOTH','ONE_OPEN',false],
 [540,'BOTH','STACKED',false],[541,'BOTH','CLOSED',true],
];
test('K16 K18: only six exact floor/glazing roles',()=>{
 assert.equal(ROLES['1F'],536);assert.equal(ROLES['2F'],537);
 assert.deepEqual(ROLES.BOTH,{CLOSED:538,ONE_OPEN:539,STACKED:540,CUTAWAY:541});
 for(const [i,f,g,c] of roles)assert.equal(index(f,g,c),i);
 assert.equal(Object.keys(SPECS).length,6);
});
test('K16 K18: wrong floor, cutaway, glazing or type fail closed',()=>{
 for(const [f,g,c] of [
  ['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['1F','CLOSED',true],['2F','CLOSED',true],
  ['BOTH','STACKED',true],['BOTH','ONE_OPEN',true],
  ['ROOF','CLOSED',false],['BOTH','OPEN',false],
  ['BOTH','CLOSED','true'],
 ])assert.equal(index(f,g,c),null);
 assert.equal(index('1F'),536);
 assert.equal(index('2F'),537);
 assert.equal(index('BOTH'),538);
});
test('K16 K18: missing SHA/JSON/scene and contract fail closed',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:Array(542)},'invalid'),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_542_K16K18_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_542_K16K18_SOURCE_SCENE_MISMATCH/);
});
test('K16 K18: atomic success and verified rollback on target exception',()=>{
 const previous={},target={};let mountedScene=previous;
 const good=atomicMount({previous,target,
  mount(x){mountedScene=x;},mounted(){return mountedScene;}});
 assert.equal(good.ok,true);assert.equal(mountedScene,target);
 mountedScene=previous;
 const fail=atomicMount({previous,target,
  mount(x){mountedScene=x;if(x===target)throw new Error('TARGET');},
  mounted(){return mountedScene;}});
 assert.equal(fail.ok,false);assert.equal(fail.restored,true);
 assert.match(fail.error.message,/TARGET/);
 assert.equal(mountedScene,previous);
});
test('K16 K18: wrong target/throwing read rolls back',()=>{
 const previous={},target={},foreign={};let current=previous;
 const wrong=atomicMount({previous,target,
  mount(x){current=x===target?foreign:x;},mounted(){return current;}});
 assert.equal(wrong.ok,false);assert.equal(wrong.restored,true);
 assert.match(wrong.error.message,/C80_542_K16K18_SCENE_MOUNT_MISMATCH/);
 assert.equal(current,previous);
 const thrown=atomicMount({previous,target,
  mount(x){current=x;},mounted(){if(current===target)throw new Error('READ');return current;}});
 assert.equal(thrown.ok,false);assert.equal(thrown.restored,true);
 assert.match(thrown.error.message,/READ/);
 assert.equal(current,previous);
});
test('K16 K18: failed rollback is reported as unverified, not mounted',()=>{
 const previous={},target={};let current=previous;
 const fail=atomicMount({previous,target,
  mount(x){current=x;throw new Error(x===target?'TARGET':'ROLLBACK');},
  mounted(){return current;}});
 assert.equal(fail.ok,false);assert.equal(fail.restored,false);
 assert.match(fail.error.message,/TARGET/);
 assert.match(fail.rollbackError.message,/ROLLBACK/);
 const mismatch=atomicMount({previous,target,
  mount(x){current={wrong:x};},mounted(){return current;}});
 assert.equal(mismatch.ok,false);assert.equal(mismatch.restored,false);
 assert.match(mismatch.rollbackError.message,/C80_542_K16K18_SCENE_ROLLBACK_MISMATCH/);
});

const original=process.env.C80_542_K16K18_GLB_PATH;
function fixture(json){
 const node=(i,d=0)=>{
  if(d>256)throw new Error('source nesting too deep');
  const s=json.nodes[i];
  if(!s)throw new Error('invalid source node');
  return {name:s.name??'',isMesh:Number.isInteger(s.mesh),
   children:(s.children??[]).map(n=>node(n,d+1))};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 for(const i of Object.keys(SPECS).map(Number)){
  scenes[i]={name:json.scenes[i].name,
   children:json.scenes[i].nodes.map(n=>node(n)),
   traverse(fn){
    const walk=x=>{fn(x);for(const child of x.children)walk(child);};
    for(const root of this.children)walk(root);
   }};
 }
 return {parser:{json,associations:new Map()},scenes};
}
test('K16 K18 authentic GLB: six pinned scene trees, switching and HOLD',
 {skip:!original},()=>{
 const bin=readFileSync(original);
 assert.equal(bin.length,BYTES);
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=fixture(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[538];
 const r=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 assert.equal(r.defaultScene,current);
 assert.equal(r.sourceLinksStatus,'NOT_BOUND');
 assert.equal(r.productionWebGLStatus,'NOT_RUN');
 assert.equal(r.physicalHostStatus,'NOT_VERIFIED');
 assert.equal(r.publicationStatus,'NOT_AUTHORIZED');
 for(const [i,f,g,c] of roles){
  assert.equal(r.restore(),true);
  assert.ok(r.apply(f,g));
  if(c)assert.ok(r.setCutaway(true));
  assert.equal(r.sceneIndex,i);assert.equal(r.selectedScene,current);
  assert.equal(r.floor,f);
 }
 assert.equal(r.restore(),true);
 assert.ok(r.apply('1F'));
 assert.equal(r.sceneIndex,536);
 assert.equal(r.setGlazing('STACKED'),null);
 assert.equal(r.setCutaway(true),null);
 assert.ok(r.apply('BOTH'));
 assert.ok(r.setGlazing('ONE_OPEN'));
 assert.equal(r.sceneIndex,539);
 assert.ok(r.setGlazing('CLOSED'));
 assert.ok(r.setCutaway(true));
 assert.equal(r.sceneIndex,541);
 assert.equal(r.setGlazing('STACKED'),null);
 assert.ok(r.setCutaway(false));
 current={foreign:true};
 assert.equal(r.apply('2F'),null);
 assert.equal(r.restore(),false);
 current=scenes[538];
 assert.equal(r.restore(),true);
 gltf.scenes[536].children[0].name='UNTRUSTED';
 assert.equal(r.apply('1F'),null);
 r.dispose();assert.equal(r.apply('1F'),null);
});
test('K16 K18 authentic GLB: failure quarantine and no subsequent mounts',
 {skip:!original},()=>{
 const bin=readFileSync(original);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=fixture(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[538],blockRollback=false,calls=0;
 const r=create({gltf,sha:SHA,
  mount(x){calls++;current=x;
   if(x===scenes[537])throw new Error('TARGET_FAIL');
   if(blockRollback&&x===scenes[538])throw new Error('ROLLBACK_FAIL');},
  mounted(){return current;}});
 assert.throws(()=>r.apply('2F'),/TARGET_FAIL/);
 assert.equal(r.sceneIndex,538);
 assert.equal(r.quarantined,false);
 assert.equal(current,scenes[538]);
 blockRollback=true;
 assert.throws(()=>r.apply('2F'),/C80_542_K16K18_ROLLBACK_UNVERIFIED/);
 assert.equal(r.quarantined,true);
 assert.equal(r.available,false);
 assert.equal(r.sceneIndex,null);assert.equal(r.selectedScene,null);
 const before=calls;
 assert.equal(r.apply('1F'),null);
 assert.equal(r.restore(),false);
 assert.equal(calls,before);
});
