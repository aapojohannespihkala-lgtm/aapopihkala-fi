// Source-only profile regression. Optional original binary fixture is never committed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_410_GLB_SHA256,C80_410_GLB_BYTES,C80_410_SCENES,c80410RootFnv32,
        resolveC80410SceneIndex,isC80410SourceScene} from '../../src/scripts/privateModelC80410SourceProfile.mjs';
const ids=[401,402,403,404,405,406,407,408,409];
test('nine SHA-locked original source scene roles',()=>{
 assert.deepEqual(Object.keys(C80_410_SCENES).map(Number),ids);
 assert.equal(new Set(Object.values(C80_410_SCENES).map(x=>x.rootFnv)).size,9);
 assert.equal(c80410RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80410RootFnv32([1,-1]),null);
 for(const [id,s] of Object.entries(C80_410_SCENES))
   assert.equal(resolveC80410SceneIndex(C80_410_GLB_SHA256,s.floor,s.glazing,s.cutaway),Number(id));
 assert.equal(resolveC80410SceneIndex('wrong','BOTH'),null);
 assert.equal(resolveC80410SceneIndex(C80_410_GLB_SHA256,'1F','ONE_OPEN'),null);
 assert.equal(resolveC80410SceneIndex(C80_410_GLB_SHA256,'2F','CLOSED',true),null);
});
test('missing source and wrong digest fail closed',()=>{
 for(const i of ids){
   assert.equal(isC80410SourceScene(null,C80_410_GLB_SHA256,i),false);
   assert.equal(isC80410SourceScene({scenes:[]},C80_410_GLB_SHA256,i),false);
   assert.equal(isC80410SourceScene({scenes:[{}]},'wrong',i),false);
 }
});
const path=process.env.C80_410_GLB_PATH;
test('authenticated original GLB all nine scenes and negative mutations',{skip:!path},()=>{
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,C80_410_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),C80_410_GLB_SHA256);
 const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [id,s] of Object.entries(C80_410_SCENES)){
   const i=Number(id),old=gltf.scenes[i];
   assert.equal(isC80410SourceScene(gltf,C80_410_GLB_SHA256,i,s.floor,s.glazing,s.cutaway),true,'valid '+i);
   assert.equal(isC80410SourceScene(gltf,'0'.repeat(64),i),false);
   gltf.scenes[i]={...old,nodes:old.nodes.slice().reverse()};
   assert.equal(isC80410SourceScene(gltf,C80_410_GLB_SHA256,i),false);
   gltf.scenes[i]={...old,extras:{...old.extras,sourceLinksBindingVerified:true}};
   assert.equal(isC80410SourceScene(gltf,C80_410_GLB_SHA256,i),false);
   gltf.scenes[i]=old;
 }
 const old=gltf.nodes[12138].mesh;
 gltf.nodes[12138].mesh=0;
 assert.equal(isC80410SourceScene(gltf,C80_410_GLB_SHA256,403),false);
 gltf.nodes[12138].mesh=old;
});
import './private-model-c80-437-viewer.test.mjs';
