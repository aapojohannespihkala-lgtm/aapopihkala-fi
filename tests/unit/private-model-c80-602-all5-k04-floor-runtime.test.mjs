import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {
 C80602_GLB_SHA256 as SHA,
 C80602_SCENES as SPECS,
} from '../../src/scripts/privateModelC80602K04CofitSourceProfile.mjs';
import {
 C80_602_VIEWER_ROLES as ROLES,
 resolveC80602SceneIndex as index,
 resolveC80602RenderedScenes as resolve,
 createC80602FloorRuntime as create,
 c80602AtomicMount as atomicMount,
} from '../../src/scripts/privateModelC80602All5K04FloorRuntime.mjs';


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

// Real private GLB cannot be committed to CI. This opt-in local fixture proves
// the source contract on complete authenticated JSON and mock Object3D paths,
// but does not establish a production browser/WebGL pass.
const original=process.env.C80_602_K04_GLB_PATH;
function syntheticLoader(json){
 const build=(id,depth=0)=>{
  if(depth>256)throw new Error('SOURCE_NODE_DEPTH');
  const def=json.nodes[id];if(!def)throw new Error('SOURCE_NODE_INVALID');
  return {name:def.name??'',isMesh:Number.isInteger(def.mesh),
   children:(def.children??[]).map(x=>build(x,depth+1))};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 for(const i of Object.keys(SPECS).map(Number)){
  scenes[i]={name:json.scenes[i].name,
   children:json.scenes[i].nodes.map(id=>build(id)),
   traverse(fn){const go=x=>{fn(x);x.children.forEach(go);};
     this.children.forEach(go);}};
 }
 return {parser:{json,associations:new Map()},scenes};
}
test('C80 602 authentic original GLB: six real source trees and atomic floor swaps',
 {skip:!original},()=>{
 const bytes=readFileSync(original);
 assert.equal(bytes.length,56765356);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const gltf=syntheticLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[598];
 const r=create({gltf,sha:SHA,mount(x){current=x;},mounted(){return current;}});
 assert.equal(r.defaultScene,scenes[598]);
 assert.equal(r.sourceLinksStatus,'NOT_BOUND');
 assert.equal(r.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(r.physicalHostStatus,'NOT_VERIFIED');
 assert.equal(r.productionWebGLStatus,'NOT_RUN');
 for(const [i,f,g,cutaway] of roles){
  assert.equal(r.restore(),true);
  assert.ok(r.apply(f,g));
  if(cutaway)assert.ok(r.setCutaway(true));
  assert.equal(r.sceneIndex,i);
  assert.equal(r.selectedScene,current);
 }
 assert.equal(r.restore(),true);
 const child=scenes[597].children[0];
 child.children.push({name:'FORGED',children:[]});
 assert.equal(r.apply('2F'),null);
 child.children.pop();
 assert.equal(r.apply('2F')?.exceptions.length,0);
 r.dispose();assert.equal(r.apply('1F'),null);
});
test('C80 602 authenticated model: failed rollback quarantines runtime',
 {skip:!original},()=>{
 const bytes=readFileSync(original);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const gltf=syntheticLoader(json),scenes=resolve(gltf,SHA);
 assert.ok(scenes);
 let current=scenes[598],block=false;
 const r=create({gltf,sha:SHA,
  mount(x){current=x;if(x===scenes[597])throw new Error('TARGET_FAIL');
   if(block&&x===scenes[598])throw new Error('ROLLBACK_FAIL');},
  mounted(){return current;}});
 assert.throws(()=>r.apply('2F'),/TARGET_FAIL/);
 assert.equal(current,scenes[598]);
 block=true;assert.throws(()=>r.apply('2F'),/C80_602_ROLLBACK_UNVERIFIED/);
 assert.equal(r.quarantined,true);assert.equal(r.available,false);
 assert.equal(r.selectedScene,null);assert.equal(r.restore(),false);
});
