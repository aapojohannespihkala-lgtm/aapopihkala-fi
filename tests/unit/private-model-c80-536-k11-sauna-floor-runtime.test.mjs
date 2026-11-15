import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_K11_GLB_SHA256 as SHA,C80_K11_GLB_BYTES as BYTES,
 C80_K11_SCENES as SPECS} from '../../src/scripts/privateModelC80536K11SaunaSourceProfile.mjs';
import {
 C80_K11_VIEWER_ROLES as ROLES,resolveC80K11SceneIndex as index,
 resolveC80K11RenderedScenes as resolve,
 createC80K11FloorRuntime as create,c80K11AtomicMount as atomicMount,
} from '../../src/scripts/privateModelC80536K11SaunaFloorRuntime.mjs';

const roles=[
 [530,'1F','CLOSED',false],[531,'2F','CLOSED',false],
 [532,'BOTH','CLOSED',false],[533,'BOTH','ONE_OPEN',false],
 [534,'BOTH','STACKED',false],[535,'BOTH','CLOSED',true],
];
test('K11 only authenticated 1F, 2F and four BOTH roles',()=>{
 assert.equal(ROLES['1F'],530);assert.equal(ROLES['2F'],531);
 assert.deepEqual(ROLES.BOTH,{CLOSED:532,ONE_OPEN:533,STACKED:534,CUTAWAY:535});
 for(const [n,f,g,c] of roles)assert.equal(index(f,g,c),n);
 assert.equal(Object.keys(SPECS).length,6);
});
test('K11 invalid floor, state and unsupported combinations never resolve',()=>{
 for(const [f,g,c] of [
  ['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['1F','CLOSED',true],['2F','CLOSED',true],
  ['BOTH','ONE_OPEN',true],['BOTH','STACKED',true],
  ['BOTH','OPEN',false],['ROOF','CLOSED',false],
  ['BOTH','CLOSED','true'],
 ])assert.equal(index(f,g,c),null);
 assert.equal(index('BOTH'),532);
 assert.equal(index('1F'),530);
 assert.equal(index('2F'),531);
});
test('K11 missing SHA/GLTFLoader and invalid mount contract fail closed',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:new Array(536)},'wrong'),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_K11_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_K11_SOURCE_SCENE_MISMATCH/);
});
test('K11 atomic mount commits only verified target, restores on throw',()=>{
 const before={name:'before'},target={name:'target'};
 let current=before;
 const ok=atomicMount({previous:before,target,
  mount(x){current=x;},mounted(){return current;}});
 assert.equal(ok.ok,true);assert.equal(current,target);
 current=before;
 const fail=atomicMount({previous:before,target,
  mount(x){current=x;if(x===target)throw new Error('partial mount');},
  mounted(){return current;}});
 assert.equal(fail.ok,false);assert.equal(fail.restored,true);
 assert.match(fail.error.message,/partial mount/);
 assert.equal(current,before);
});
test('K11 atomic mount restores wrong target or mounted-read exceptions',()=>{
 const before={},target={},foreign={};let current=before;
 const wrong=atomicMount({previous:before,target,
  mount(x){current=x===target?foreign:x;},mounted(){return current;}});
 assert.equal(wrong.ok,false);assert.equal(wrong.restored,true);
 assert.match(wrong.error.message,/C80_K11_SCENE_MOUNT_MISMATCH/);
 assert.equal(current,before);
 const err=atomicMount({previous:before,target,
  mount(x){current=x;},mounted(){if(current===target)throw new Error('read failed');return current;}});
 assert.equal(err.ok,false);assert.equal(err.restored,true);
 assert.match(err.error.message,/read failed/);
 assert.equal(current,before);
});
test('K11 rollback failure is never treated as verified success',()=>{
 const before={},target={};let current=before;
 const fail=atomicMount({previous:before,target,
  mount(x){current=x;throw new Error(x===target?'TARGET':'ROLLBACK');},
  mounted(){return current;}});
 assert.equal(fail.ok,false);assert.equal(fail.restored,false);
 assert.match(fail.error.message,/TARGET/);
 assert.match(fail.rollbackError.message,/ROLLBACK/);
 const mismatch=atomicMount({previous:before,target,
  mount(x){current={forged:x};},mounted(){return current;}});
 assert.equal(mismatch.ok,false);assert.equal(mismatch.restored,false);
 assert.match(mismatch.rollbackError.message,/C80_K11_SCENE_ROLLBACK_MISMATCH/);
});

// Authentic complete GLB JSON drives this optional, fixture-required integration
// test. The mocked Object3D is NOT proof of actual production browser WebGL.
const path=process.env.C80_K11_GLB_PATH;
function mockLoader(json){
 const node=(id,depth=0)=>{
  if(depth>256)throw new Error('bad source depth');
  const def=json.nodes[id];if(!def)throw new Error('missing node '+id);
  return {name:def.name||'',isMesh:Number.isInteger(def.mesh),
   children:(def.children||[]).map(n=>node(n,depth+1))};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 for(const i of Object.keys(SPECS).map(Number)){
  scenes[i]={name:json.scenes[i].name,
   children:json.scenes[i].nodes.map(id=>node(id)),
   traverse(fn){const walk=x=>{fn(x);for(const y of x.children)walk(y);};
    for(const root of this.children)walk(root);},
  };
 }
 return {parser:{json,associations:new Map()},scenes};
}
test('K11 authenticated original scene graphs, scene switching and HOLD gates',
 {skip:!path},()=>{
 const bin=readFileSync(path);
 assert.equal(bin.length,BYTES);
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=mockLoader(json),scenes=resolve(gltf,SHA);assert.ok(scenes);
 let current=scenes[532];
 const r=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 assert.equal(r.defaultScene,current);
 assert.equal(r.sourceLinksStatus,'NOT_BOUND');
 assert.equal(r.productionWebGLStatus,'NOT_RUN');
 assert.equal(r.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(r.physicalInstallStatus,'NOT_VERIFIED');
 for(const [i,f,g,c] of roles){
  assert.equal(r.restore(),true);
  assert.ok(r.apply(f,g));
  if(c)assert.ok(r.setCutaway(true));
  assert.equal(r.sceneIndex,i);assert.equal(r.selectedScene,current);
 }
 assert.equal(r.restore(),true);
 assert.ok(r.apply('1F'));
 assert.equal(r.sceneIndex,530);
 assert.equal(r.setCutaway(true),null);
 assert.equal(r.setGlazing('ONE_OPEN'),null);
 assert.ok(r.apply('BOTH'));
 assert.equal(r.sceneIndex,532);
 assert.ok(r.setGlazing('STACKED'));
 assert.equal(r.sceneIndex,534);
 assert.equal(r.setCutaway(true),null);
 current={otherModel:true};
 assert.equal(r.apply('2F'),null);
 assert.equal(r.restore(),false);
 current=scenes[534];
 assert.equal(r.restore(),true);
 const old=gltf.scenes[530].children[0].name;
 gltf.scenes[530].children[0].name='IMPOSTOR';
 assert.equal(r.apply('1F'),null);
 gltf.scenes[530].children[0].name=old;
 r.dispose();assert.equal(r.apply('1F'),null);
 assert.equal(r.restore(),false);
});
test('K11 original GLB failed mounted target restores state, rollback loss quarantines',
 {skip:!path},()=>{
 const bin=readFileSync(path);
 const json=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString('utf8'));
 const gltf=mockLoader(json),scenes=resolve(gltf,SHA);assert.ok(scenes);
 let current=scenes[532],broken=false,failRollback=false;
 const r=create({gltf,sha:SHA,
  mount(x){current=x;if(x===scenes[531])throw new Error('TARGET_FAIL');
   if(failRollback&&x===scenes[532])throw new Error('ROLLBACK_FAIL');},
  mounted(){return current;}});
 assert.throws(()=>r.apply('2F'),/TARGET_FAIL/);
 assert.equal(current,scenes[532]);
 assert.equal(r.sceneIndex,532);assert.equal(r.quarantined,false);
 failRollback=true;
 assert.throws(()=>r.apply('2F'),/C80_K11_ROLLBACK_UNVERIFIED/);
 assert.equal(r.quarantined,true);assert.equal(r.available,false);
 assert.equal(r.selectedScene,null);assert.equal(r.apply('1F'),null);
});
