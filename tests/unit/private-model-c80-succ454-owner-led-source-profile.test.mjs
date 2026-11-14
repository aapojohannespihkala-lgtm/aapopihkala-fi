// Source-only SUCC454 exact original fixture is optional and never committed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 SUCC454_GLB_SHA256,SUCC454_GLB_BYTES,SUCC454_ZIP_DRIVE_ID,
 SUCC454_SOURCE_ONLY,SUCC454_SOURCE_LINKS_BOUND,SUCC454_PUBLISH_ALLOWED,
 SUCC454_SCENES,succ454RootsFnv32,isSucc454OwnerLedScene,
 resolveSucc454SceneIndex,getSucc454SourceReceipt
} from '../../src/scripts/privateModelC80Succ454OwnerLedSourceProfile.mjs';
const ids=[453,454,455,456,457,458,459];
test('seven scene roles are SHA and parent-root locked, no sourceLinks publication',()=>{
 assert.deepEqual(Object.keys(SUCC454_SCENES).map(Number),ids);
 assert.equal(new Set(Object.values(SUCC454_SCENES).map(v=>v.fnv)).size,7);
 assert.equal(SUCC454_ZIP_DRIVE_ID,'1baPZkajTH1s8uVqD05lQQGM32MN9lsgt');
 assert.equal(SUCC454_SOURCE_ONLY,true);
 assert.equal(SUCC454_SOURCE_LINKS_BOUND,false);
 assert.equal(SUCC454_PUBLISH_ALLOWED,false);
 assert.equal(succ454RootsFnv32([1,2,3]),'56cf37ab');
 assert.equal(succ454RootsFnv32([1,-1]),null);
 for(const [id,s] of Object.entries(SUCC454_SCENES))
  assert.equal(resolveSucc454SceneIndex(SUCC454_GLB_SHA256,s.parent,s.floor),Number(id));
 assert.equal(resolveSucc454SceneIndex('0'.repeat(64),446,'2F'),null);
 assert.equal(resolveSucc454SceneIndex(SUCC454_GLB_SHA256,446,'1F'),null);
});
test('wrong digest and absent payload always fail closed',()=>{
 for(const i of ids){
  assert.equal(isSucc454OwnerLedScene(null,SUCC454_GLB_SHA256,i),false);
  assert.equal(isSucc454OwnerLedScene({scenes:[{}]},'wrong',i),false);
 }
 const r=getSucc454SourceReceipt(null,SUCC454_GLB_SHA256,453);
 assert.deepEqual([r.exactSource,r.publishAllowed,r.sourceLinksBound,r.productionWebGLVerified,r.current,r.asBuilt],
                  [false,false,false,false,false,false]);
});
const fixture=process.env.C80_SUCC454_GLB_PATH;
test('real authenticated GLB, every scene, WC metadata, negative corruptions',{skip:!fixture},()=>{
 const b=readFileSync(fixture);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,SUCC454_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),SUCC454_GLB_SHA256);
 const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 assert.equal(gltf.nodes[12171].extras.new2FWCNodes[0],12168);
 assert.deepEqual(gltf.nodes[12172].extras.new2FWCNodes,[12169,12170]);
 assert.deepEqual(gltf.nodes[12172].children,gltf.nodes[12171].children);
 for(const [id,s] of Object.entries(SUCC454_SCENES)){
  const i=Number(id),before=gltf.scenes[i];
  assert.equal(isSucc454OwnerLedScene(gltf,SUCC454_GLB_SHA256,i,s.floor),true,'scene '+i);
  assert.equal(isSucc454OwnerLedScene(gltf,'0'.repeat(64),i),false,'SHA '+i);
  gltf.scenes[i]={...before,nodes:[...before.nodes].reverse()};
  assert.equal(isSucc454OwnerLedScene(gltf,SUCC454_GLB_SHA256,i),false,'root reorder '+i);
  gltf.scenes[i]={...before,extras:{...before.extras,sourceLinks:'BOUND'}};
  assert.equal(isSucc454OwnerLedScene(gltf,SUCC454_GLB_SHA256,i),false,'sourceLinks unsafe '+i);
  gltf.scenes[i]=before;
 }
 const wc=gltf.nodes[12172];
 gltf.nodes[12172]={...wc,extras:{...wc.extras,new2FWCNodes:[12168,12169]}};
 assert.equal(isSucc454OwnerLedScene(gltf,SUCC454_GLB_SHA256,454),false,'stale WC metadata');
 gltf.nodes[12172]={...wc,children:[...wc.children.slice(0,-1),12168]};
 assert.equal(isSucc454OwnerLedScene(gltf,SUCC454_GLB_SHA256,453),false,'wrong WC child');
 gltf.nodes[12172]=wc;
 const r=getSucc454SourceReceipt(gltf,SUCC454_GLB_SHA256,453);
 assert.equal(r.exactSource,true);
 assert.equal(r.publishAllowed,false);
});
