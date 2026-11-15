import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_530_V27_GLB_SHA256 as SHA,C80_530_V27_GLB_BYTES as BYTES,
 C80_530_V27_SCENES as SPECS,
} from '../../src/scripts/privateModelC80530V27SourceProfile.mjs';
import {
 C80_530_V27_VIEWER_ROLES as ROLES,
 resolveC80530V27SceneIndex as index,resolveC80530V27Scenes as resolve,
 createC80530V27FloorRuntime as create,c80530V27ReviewProfile as review,
} from '../../src/scripts/privateModelC80530V27FloorRuntime.mjs';

const modes=[
 [524,'1F','CLOSED',false],[525,'2F','CLOSED',false],
 [526,'BOTH','CLOSED',false],[527,'BOTH','ONE_OPEN',false],
 [528,'BOTH','STACKED',false],[529,'BOTH','CLOSED',true],
];
test('six authentic floor modes and unsupported 1F/2F glazing fail closed',()=>{
 assert.equal(ROLES['1F'],524);
 assert.equal(ROLES['2F'],525);
 assert.equal(ROLES.BOTH.CUTAWAY,529);
 for(const [scene,f,g,c] of modes)assert.equal(index(f,g,c),scene);
 for(const args of [['1F','ONE_OPEN',false],['2F','STACKED',false],
  ['2F','CLOSED',true],['BOTH','ONE_OPEN',true],['BOTH','WRONG',false],
  ['BOTH','CLOSED','true'],['UNKNOWN','CLOSED',false]])
  assert.equal(index(...args),null);
 assert.equal(Object.keys(SPECS).length,6);
});
test('untrusted source and missing mount callbacks reject adapter',()=>{
 assert.equal(resolve(null,SHA),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},SHA),null);
 assert.equal(review({},SHA,526),null);
 assert.equal(review({},'0'.repeat(64),526),null);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:null,mounted:()=>null}),/C80_530_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:null,sha:SHA,mount:()=>{},mounted:()=>null}),/C80_530_SOURCE_SCENE_MISMATCH/);
});
const fixture=process.env.C80_530_V27_GLB_PATH;
function load(){
 const bytes=readFileSync(fixture);
 assert.equal(bytes.length,BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({name:s.name,
  traverse(fn){for(const n of s.nodes)fn({isMesh:Number.isInteger(json.nodes[n]?.mesh)});}}));
 return {json,scenes,gltf:{parser:{json},scenes}};
}
test('real C80 530 GLB mounts six scene roles, terrain stays outside MEP review',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=load(),accepted=resolve(gltf,SHA);
 assert.ok(accepted);
 let current=accepted[526];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 assert.equal(runtime.defaultScene,current);
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.terrainPhysicalHostStatus,'NOT_VERIFIED');
 assert.equal(runtime.sourceLinksStatus,'NOT_BOUND');
 for(const [scene,f,g,c] of modes){
  assert.equal(runtime.restore(),true);
  const result=c?runtime.setCutaway(true):f==='BOTH'&&g!=='CLOSED'?
    runtime.setGlazing(g):runtime.apply(f);
  assert.ok(result,'real scene '+scene);
  assert.equal(runtime.sceneIndex,scene);
  assert.equal(runtime.selectedScene,current);
  assert.equal(runtime.floor,f);
  assert.equal(runtime.glazing,g);
  assert.equal(runtime.cutaway,c);
  const profile=review(json,SHA,scene);
  assert.ok(profile);
  assert.ok(profile.roots[scene].length>0);
  for(const forbidden of [9008,12251,12252,12253,12254])
   assert.equal(profile.roots[scene].some(r=>r.node===forbidden),false,'terrain/ghost not MEP');
  assert.equal(profile.physicalTerrainSurveyVerified,false);
  assert.equal(profile.publicationAllowed,false);
 }
 assert.equal(runtime.restore(),true);
 assert.ok(runtime.apply('2F'));
 assert.ok(runtime.apply('1F'));
 assert.ok(runtime.apply('BOTH'));
 assert.ok(runtime.setCutaway(true));
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 assert.ok(runtime.setCutaway(false));
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 current=null;
 assert.equal(runtime.apply('1F'),null);
 current=scenes[527];
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
});
test('mutated live source prevents transition and restore despite creation-time success',
 {skip:!fixture},()=>{
 const {json,gltf,scenes}=load();
 let current=scenes[526];
 const runtime=create({gltf,sha:SHA,mount(next){current=next;},mounted(){return current;}});
 const old=json.scenes[525].extras.v27ClipApplied;
 json.scenes[525].extras.v27ClipApplied=true;
 assert.equal(runtime.apply('2F'),null);
 assert.equal(current,scenes[526]);
 json.scenes[525].extras.v27ClipApplied=old;
 assert.ok(runtime.apply('2F'));
 const oldRoot=json.scenes[526].nodes[107];
 json.scenes[526].nodes[107]=9008;
 assert.equal(runtime.restore(),false);
 assert.equal(current,scenes[525]);
 json.scenes[526].nodes[107]=oldRoot;
 assert.equal(runtime.restore(),true);
 const v=json.nodes[12254].extras.physicalFoundationClaim;
 json.nodes[12254].extras.physicalFoundationClaim=true;
 assert.equal(runtime.apply('1F'),null);
 assert.equal(runtime.restore(),false);
 json.nodes[12254].extras.physicalFoundationClaim=v;
 assert.ok(runtime.apply('1F'));
 current=scenes[526];
 assert.equal(runtime.apply('2F'),null,'external scene mount must be noticed');
});
