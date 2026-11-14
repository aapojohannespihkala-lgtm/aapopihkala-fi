import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 SUCC455_GLB_SHA256,SUCC455_GLB_BYTES,SUCC455_ZIP_DRIVE_ID,
 SUCC455_PUBLISH_ALLOWED,SUCC455_SOURCE_LINKS_BOUND,SUCC455_SCENES,
 succ455RootsFnv32,isSucc455LedScene,resolveSucc455SceneIndex,getSucc455SourceReceipt
} from '../../src/scripts/privateModelC80Succ455LedSourceProfile.mjs';
const scenes=[460,461,462,463,464,465,466,467,468];
test('nine opt-in scenes require SHA + parent/floor, never publish',()=>{
 assert.deepEqual(Object.keys(SUCC455_SCENES).map(Number),scenes);
 assert.equal(SUCC455_ZIP_DRIVE_ID,'1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE');
 assert.equal(SUCC455_PUBLISH_ALLOWED,false);
 assert.equal(SUCC455_SOURCE_LINKS_BOUND,false);
 assert.equal(succ455RootsFnv32([1,2,3]),'56cf37ab');
 assert.equal(succ455RootsFnv32([1,-1]),null);
 for(const [id,s] of Object.entries(SUCC455_SCENES))
  assert.equal(resolveSucc455SceneIndex(SUCC455_GLB_SHA256,s.parent,s.floor),Number(id));
 assert.equal(resolveSucc455SceneIndex('0'.repeat(64),453,'2F'),null);
 assert.equal(resolveSucc455SceneIndex(SUCC455_GLB_SHA256,453,'BOTH'),null);
});
test('missing fixture and wrong SHA fail closed',()=>{
 for(const id of scenes){
  assert.equal(isSucc455LedScene(null,SUCC455_GLB_SHA256,id),false);
  assert.equal(isSucc455LedScene({scenes:[{}]},'wrong',id),false);
 }
 assert.deepEqual(getSucc455SourceReceipt(null,SUCC455_GLB_SHA256,460),{
  exactSource:false,sourceOnly:true,sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
});
const fixture=process.env.C80_SUCC455_GLB_PATH;
test('authentic original GLB verifies 9 scenes, LED spacings and fail-closed mutations',
 {skip:!fixture},()=>{
 const b=readFileSync(fixture);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,SUCC455_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),SUCC455_GLB_SHA256);
 const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [id,spec] of Object.entries(SUCC455_SCENES)){
  const i=Number(id),original=g.scenes[i];
  assert.equal(isSucc455LedScene(g,SUCC455_GLB_SHA256,i,spec.floor),true,`scene ${i}`);
  assert.equal(isSucc455LedScene(g,'0'.repeat(64),i),false,`SHA ${i}`);
  g.scenes[i]={...original,nodes:[...original.nodes].reverse()};
  assert.equal(isSucc455LedScene(g,SUCC455_GLB_SHA256,i),false,`roots reordered ${i}`);
  g.scenes[i]={...original,extras:{...original.extras,plan2015SpacingCorrection:{
   ...original.extras.plan2015SpacingCorrection,sourceLinksBound:true}}};
  assert.equal(isSucc455LedScene(g,SUCC455_GLB_SHA256,i),false,`source links unsafe ${i}`);
  g.scenes[i]=original;
 }
 const originalPosition=g.nodes[12175].translation;
 g.nodes[12175]={...g.nodes[12175],translation:[...originalPosition.slice(0,2),-2.55]};
 assert.equal(isSucc455LedScene(g,SUCC455_GLB_SHA256,460),false,'false 2F spacing');
 g.nodes[12175]={...g.nodes[12175],translation:originalPosition};
 const original1F=g.nodes[12181].translation;
 g.nodes[12181]={...g.nodes[12181],translation:[4.04,...original1F.slice(1)]};
 assert.equal(isSucc455LedScene(g,SUCC455_GLB_SHA256,467),false,'false 1F spacing');
 g.nodes[12181]={...g.nodes[12181],translation:original1F};
 assert.equal(getSucc455SourceReceipt(g,SUCC455_GLB_SHA256,461).exactSource,true);
});
