import test from 'node:test';
import assert from 'node:assert/strict';
import {
 C80_602_GLB_SHA256 as SHA,
 C80_602_SCENES as SPECS,
} from '../../src/scripts/privateModelC80602All5K04SourceProfile.mjs';
import {
 C80_602_VIEWER_ROLES as ROLES,
 resolveC80602SceneIndex as index,
 resolveC80602RenderedScenes as resolve,
 createC80602FloorRuntime as create,
 c80602AtomicMount as atomicMount,
} from '../../src/scripts/privateModelC80602All5K04FloorRuntime.mjs';
import {makeC80602Fixture} from './private-model-c80-602-all5-k04-source-profile.test.mjs';

const roles=[
 [596,'1F','CLOSED',false],[597,'2F','CLOSED',false],
 [598,'BOTH','CLOSED',false],[599,'BOTH','ONE_OPEN',false],
 [600,'BOTH','STACKED',false],[601,'BOTH','CLOSED',true],
];
test('C80 602 roles have six valid scene-floor-glazing combinations',()=>{
 assert.equal(ROLES['1F'],596);assert.equal(ROLES['2F'],597);
 assert.deepEqual(ROLES.BOTH,{CLOSED:598,ONE_OPEN:599,STACKED:600,CUTAWAY:601});
 for(const [i,f,g,c] of roles)assert.equal(index(f,g,c),i);
 for(const [f,g,c] of [
  ['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['1F','CLOSED',true],['2F','CLOSED',true],
  ['BOTH','ONE_OPEN',true],['BOTH','STACKED',true],
  ['BOTH','OPEN',false],['ROOF','CLOSED',false],
  ['BOTH','CLOSED','true']
 ])assert.equal(index(f,g,c),null);
 assert.equal(index('BOTH'),598);
});
test('C80 602 rejects wrong SHA, incomplete glTF and missing mount functions',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:Array(602)},'bad'),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_602_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_602_SOURCE_SCENE_MISMATCH/);
});
test('C80 602 atomic mount verifies target and rolls back thrown mount',()=>{
 const previous={},target={};let current=previous;
 const good=atomicMount;
 const ok=good({previous,target,mount(x){current=x;},mounted(){return current;}});
 assert.equal(ok.ok,true);
 current=previous;
 const failed=good({previous,target,
  mount(x){current=x;if(x===target)throw new Error('TARGET_PARTIAL');},
  mounted(){return current;}});
 assert.equal(failed.ok,false);assert.equal(failed.restored,true);
 assert.match(failed.error.message,/TARGET_PARTIAL/);
 assert.equal(current,previous);
});
test('C80 602 wrong target and thrown mounted read return safe rollback',()=>{
 const previous={},target={},foreign={};let current=previous;
 const bad=atomicMount({previous,target,
  mount(x){current=x===target?foreign:x;},mounted(){return current;}});
 assert.equal(bad.ok,false);assert.equal(bad.restored,true);
 assert.match(bad.error.message,/C80_602_SCENE_MOUNT_MISMATCH/);
 assert.equal(current,previous);
 const read=atomicMount({previous,target,
  mount(x){current=x;},
  mounted(){if(current===target)throw new Error('READ_ERROR');return current;}});
 assert.equal(read.ok,false);assert.equal(read.restored,true);
 assert.equal(current,previous);
});
test('C80 602 atomic unverified rollback cannot be misreported as safe',()=>{
 const previous={},target={};let current=previous;
 const fail=atomicMount({previous,target,
  mount(x){current=x;throw new Error(x===target?'TARGET_FAIL':'ROLLBACK_FAIL');},
  mounted(){return current;}});
 assert.equal(fail.ok,false);assert.equal(fail.restored,false);
 assert.match(fail.rollbackError.message,/ROLLBACK_FAIL/);
 const bad=atomicMount({previous,target,
  mount(x){current={forged:x};},mounted(){return current;}});
 assert.equal(bad.ok,false);assert.equal(bad.restored,false);
 assert.match(bad.rollbackError.message,/C80_602_SCENE_ROLLBACK_MISMATCH/);
});
// Lightweight, source-root-derived Object3D hierarchy. This does not
// substitute for original full-size Three.GLTFLoader or production WebGL.
function fixture(j){
 const node=(id,d=0)=>{
  if(d>256)throw new Error('unsafe source nesting');
  const def=j.nodes[id];if(!def)throw new Error('missing node');
  return {name:def.name??'',isMesh:Number.isInteger(def.mesh),
   children:(def.children??[]).map(x=>node(x,d+1))};
 };
 const scenes=j.scenes.map(s=>({name:s.name,children:[]}));
 for(const i of Object.keys(SPECS).map(Number)){
  scenes[i]={name:j.scenes[i].name,
   children:j.scenes[i].nodes.map(id=>node(id)),
   traverse(fn){const walk=x=>{fn(x);for(const v of x.children)walk(v);};
    for(const root of this.children)walk(root);}};
 }
 return {parser:{json:j,associations:new Map()},scenes};
}
test('C80 602 source-root-derived scene switching, HOLD and tree protection',()=>{
 const j=makeC80602Fixture(),gltf=fixture(j),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[598];
 const r=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 assert.equal(r.defaultScene,current);
 assert.equal(r.sourceLinksStatus,'NOT_BOUND');
 assert.equal(r.physicalHostStatus,'NOT_VERIFIED');
 assert.equal(r.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(r.productionWebGLStatus,'NOT_RUN');
 for(const [i,f,g,c] of roles){
  assert.equal(r.restore(),true);
  assert.ok(r.apply(f,g));
  if(c)assert.ok(r.setCutaway(true));
  assert.equal(r.sceneIndex,i);assert.equal(r.selectedScene,current);
 }
 assert.equal(r.restore(),true);
 assert.ok(r.apply('2F'));
 assert.equal(r.sceneIndex,597);
 assert.equal(r.setGlazing('ONE_OPEN'),null);
 assert.equal(r.setCutaway(true),null);
 assert.ok(r.apply('BOTH'));
 assert.ok(r.setGlazing('STACKED'));
 assert.equal(r.sceneIndex,600);
 assert.equal(r.setCutaway(true),null);
 current={foreign:true};
 assert.equal(r.apply('1F'),null);
 assert.equal(r.restore(),false);
 current=scenes[600];
 assert.equal(r.restore(),true);
 const root=scenes[597].children[0],old=root.name;
 root.name='FORGED_NODE';
 // For source nodes without an original JSON name the root-name test alone
 // cannot bind provenance. A pinned Object3D identity mutation must block.
 root.children.push({name:'forged',children:[]});
 assert.equal(r.apply('2F'),null);
 root.children.pop();root.name=old;
 r.dispose();assert.equal(r.apply('1F'),null);
});
test('C80 602 source-root-derived mount failure quarantine is permanent',()=>{
 const j=makeC80602Fixture(),gltf=fixture(j),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[598],failRestore=false;
 const r=create({gltf,sha:SHA,
  mount(x){current=x;
   if(x===scenes[597])throw new Error('TARGET_FAIL');
   if(failRestore&&x===scenes[598])throw new Error('ROLLBACK_FAIL');},
  mounted(){return current;}});
 assert.throws(()=>r.apply('2F'),/TARGET_FAIL/);
 assert.equal(current,scenes[598]);assert.equal(r.sceneIndex,598);
 failRestore=true;
 assert.throws(()=>r.apply('2F'),/C80_602_ROLLBACK_UNVERIFIED/);
 assert.equal(r.available,false);assert.equal(r.quarantined,true);
 assert.equal(r.selectedScene,null);assert.equal(r.sceneIndex,null);
 assert.equal(r.apply('1F'),null);assert.equal(r.restore(),false);
});
