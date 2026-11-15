import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_T110_512_GLB_SHA256 as SHA,C80_T110_512_GLB_BYTES as BYTES,
 C80_T110_512_SCENES as SPECS}
 from '../../src/scripts/privateModelC80T110Roof512SourceProfile.mjs';
import {C80_T110_512_VIEWER_ROLES as ROLES,
 resolveC80T110Roof512SceneIndex as index,
 resolveC80T110Roof512Scenes as resolve,
 createC80T110Roof512FloorRuntime as create,
 c80T110Roof512ReviewProfile as review}
 from '../../src/scripts/privateModelC80T110Roof512FloorRuntime.mjs';
const modes=[[505,'2F','CLOSED',false],[506,'2F','ONE_OPEN',false],
 [507,'2F','STACKED',false],[508,'BOTH','CLOSED',false],
 [509,'BOTH','ONE_OPEN',false],[510,'BOTH','STACKED',false],
 [511,'BOTH','CLOSED',true]];
test('exact 2F/BOTH seven roles; unsupported 1F and wrong modes fail closed',()=>{
 assert.deepEqual(ROLES['2F'],{CLOSED:505,ONE_OPEN:506,STACKED:507});
 for(const [id,f,g,c] of modes)assert.equal(index(f,g,c),id);
 assert.equal(index('1F','CLOSED'),null);
 assert.equal(index('2F','CLOSED',true),null);
 assert.equal(index('BOTH','ONE_OPEN',true),null);
 assert.equal(index('BOTH','INVALID'),null);
 assert.equal(index('BOTH','CLOSED','true'),null);
 assert.equal(Object.keys(SPECS).length,7);
});
test('invalid source, SHA and mount contract reject preview',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(review({},SHA,508),null);
 assert.equal(review({},'wrong',508),null);
 assert.equal(review({},SHA,500),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),
  /C80_T110_512_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),
  /C80_T110_512_SOURCE_SCENE_MISMATCH/);
});
const fixture=process.env.C80_T110_512_GLB_PATH;
test('authentic source: scene transitions, MEP review excludes H24, roof HOLD',
 {skip:!fixture},()=>{
 const buf=readFileSync(fixture);
 assert.equal(buf.length,BYTES);
 assert.equal(createHash('sha256').update(buf).digest('hex'),SHA);
 const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({name:s.name,
  children:s.nodes.map(n=>({name:json.nodes[n]?.name})),
  traverse(fn){this.children.forEach(fn);}}));
 const gltf={parser:{json},scenes},accepted=resolve(gltf,SHA);
 assert.ok(accepted);
 let current=accepted[508];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.equal(runtime.defaultScene,current);
 assert.equal(runtime.supportsFirstFloor,false);
 assert.equal(runtime.roofHostStatus,'NOT_VERIFIED');
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.apply('1F'),null);
 for(const [id,f,g,c] of modes){
  assert.equal(runtime.restore(),true);
  assert.ok(runtime.apply(f,g));
  if(c)assert.ok(runtime.setCutaway(true));
  assert.equal(runtime.sceneIndex,id);
  assert.equal(runtime.selectedScene,current);
  assert.equal(runtime.floor,f);
  assert.equal(runtime.glazing,g);
  const p=review(json,SHA,id);
  assert.ok(p);
  assert.ok(p.roots[id].some(r=>r.node===SPECS[id].root));
  assert.ok(!p.roots[id].some(r=>r.node===12238));
  assert.equal(p.physicalRoofOpeningVerified,false);
  assert.equal(p.publicationAllowed,false);
 }
 runtime.restore();
 assert.ok(runtime.setCutaway(true));
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 runtime.restore();
 current=null;
 assert.equal(runtime.apply('BOTH'),null);
 current=accepted[508];
 runtime.dispose();
 assert.equal(runtime.apply('BOTH'),null);
 assert.equal(runtime.restore(),false);
});
test('source guard rechecks live metadata after construction',
 {skip:!fixture},()=>{
 const buf=readFileSync(fixture);
 const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({name:s.name}));
 let current=scenes[508];
 const runtime=create({gltf:{parser:{json},scenes},sha:SHA,
  mount(next){current=next;},mounted(){return current;}});
 const old=json.scenes[505].extras.productionWebGLVerified;
 json.scenes[505].extras.productionWebGLVerified=true;
 assert.equal(runtime.apply('2F'),null);
 json.scenes[505].extras.productionWebGLVerified=old;
 assert.ok(runtime.apply('2F'));
 // A stale or mutated destination is never remounted by restore().
 const oldDefault=json.scenes[508].extras.productionWebGLVerified;
 json.scenes[508].extras.productionWebGLVerified=true;
 assert.equal(runtime.restore(),false);
 assert.equal(current,scenes[505]);
 json.scenes[508].extras.productionWebGLVerified=oldDefault;
 assert.equal(runtime.restore(),true);
 assert.equal(current,scenes[508]);
 runtime.dispose();
});
