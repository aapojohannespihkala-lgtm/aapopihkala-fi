import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_524_RAIN_GLB_SHA256 as SHA,C80_524_RAIN_GLB_BYTES as BYTES,
 C80_524_RAIN_SCENES as SPECS}
 from '../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs';
import {C80_524_RAIN_VIEWER_ROLES as ROLES,
 resolveC80524RainSceneIndex as index,
 resolveC80524RainScenes as resolve,
 createC80524RainFloorRuntime as create}
 from '../../src/scripts/privateModelC80524RainZonesFloorRuntime.mjs';

const modes=[
 [518,'1F','CLOSED',false],[519,'2F','CLOSED',false],
 [520,'BOTH','CLOSED',false],[521,'BOTH','ONE_OPEN',false],
 [522,'BOTH','STACKED',false],[523,'BOTH','CLOSED',true],
];
test('C80 524 exact six 1F/2F/BOTH modes, cutaway and invalid roles',()=>{
 assert.equal(ROLES['1F'],518);
 assert.equal(ROLES.BOTH.CUTAWAY,523);
 assert.equal(Object.keys(SPECS).length,6);
 for(const [scene,f,g,c] of modes)assert.equal(index(f,g,c),scene);
 for(const args of [['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['2F','CLOSED',true],['BOTH','ONE_OPEN',true],['BOTH','NOPE',false],
  ['BOTH','CLOSED','true'],['ROOF','CLOSED',false]])
  assert.equal(index(...args),null,'reject '+args);
});
test('unknown source SHA, missing GLB or invalid mount contract fail closed',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),/MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),/SOURCE_SCENE_MISMATCH/);
});
const fixture=process.env.C80_524_RAIN_GLB_PATH;
function sourceFixture(){
 const buf=readFileSync(fixture);
 assert.equal(buf.length,BYTES);
 assert.equal(createHash('sha256').update(buf).digest('hex'),SHA);
 const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({name:s.name,
  traverse(fn){for(const n of s.nodes)fn({isMesh:Number.isInteger(json.nodes[n]?.mesh)});}}));
 return {json,scenes,gltf:{parser:{json},scenes}};
}
test('authentic 55MB GLB mounts exact 6 source scenes and resets scene modes',
 {skip:!fixture},()=>{
 const {gltf,scenes}=sourceFixture();
 const accepted=resolve(gltf,SHA);
 assert.ok(accepted);
 let current=accepted[520];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.equal(runtime.defaultScene,current);
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.downspoutPhysicalRouteStatus,'NOT_VERIFIED');
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 for(const [scene,f,g,c] of modes){
  assert.equal(runtime.restore(),true);
  if(c){assert.ok(runtime.setCutaway(true));}
  else if(f==='BOTH'&&g!=='CLOSED'){assert.ok(runtime.setGlazing(g));}
  else assert.ok(runtime.apply(f));
  assert.equal(runtime.sceneIndex,scene);
  assert.equal(runtime.selectedScene,current);
  assert.equal(runtime.floor,f);
  assert.equal(runtime.glazing,g);
  assert.equal(runtime.cutaway,c);
  assert.ok(runtime.active||f==='BOTH');
 }
 assert.equal(runtime.restore(),true);
 assert.equal(runtime.active,false);
 assert.ok(runtime.apply('2F'));
 assert.ok(runtime.apply('1F'));
 assert.ok(runtime.apply('BOTH'));
 assert.equal(runtime.sceneIndex,520);
 assert.ok(runtime.setCutaway(true));
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 assert.ok(runtime.setCutaway(false));
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 assert.equal(runtime.sceneIndex,521);
 current=null;
 assert.equal(runtime.apply('BOTH'),null);
 current=accepted[521];
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 assert.equal(accepted[518],scenes[518]);
});
test('authenticated 524 source metadata rechecked before every mount and restore',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=sourceFixture();
 let current=scenes[520];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 const e=json.scenes[519].extras,old=e.productionWebGLVerified;
 e.productionWebGLVerified=true;
 assert.equal(runtime.apply('2F'),null);
 assert.equal(current,scenes[520]);
 e.productionWebGLVerified=old;
 assert.ok(runtime.apply('2F'));
 assert.equal(runtime.sceneIndex,519);
 const original=json.scenes[520].extras.floorProfile;
 json.scenes[520].extras.floorProfile='2F';
 assert.equal(runtime.restore(),false);
 assert.equal(current,scenes[519]);
 json.scenes[520].extras.floorProfile=original;
 assert.equal(runtime.restore(),true);
 const prev=json.nodes[12249].extras.physicalRouteClaim;
 json.nodes[12249].extras.physicalRouteClaim=true;
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 json.nodes[12249].extras.physicalRouteClaim=prev;
 assert.ok(runtime.apply('1F'));
 current=scenes[520];
 assert.equal(runtime.apply('2F'),null,'external scene swap invalidates mounted-scene contract');
});
