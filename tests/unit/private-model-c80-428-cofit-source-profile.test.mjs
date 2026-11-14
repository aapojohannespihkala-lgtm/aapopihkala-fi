// Original 54 MB GLB is a local-only fixture, never checked in or mirrored here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_428_GLB_SHA256,C80_428_GLB_BYTES,C80_428_SCENES,c80428RootFnv32,
 isC80428SourceScene,resolveC80428SceneIndex} from '../../src/scripts/privateModelC80428CofitSourceProfile.mjs';
const ids=[419,420,421,422,423,424,425,426,427];
test('nine exact source-only scene roles and guarded selector',()=>{
 assert.deepEqual(Object.keys(C80_428_SCENES).map(Number),ids);
 assert.equal(c80428RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80428RootFnv32([1,-1]),null);
 for(const i of ids){const s=C80_428_SCENES[i];
  assert.equal(resolveC80428SceneIndex(C80_428_GLB_SHA256,s.floor,s.glazing,s.cutaway),i);}
 assert.equal(resolveC80428SceneIndex('wrong','BOTH'),null);
 assert.equal(resolveC80428SceneIndex(C80_428_GLB_SHA256,'1F','ONE_OPEN'),null);
 assert.equal(resolveC80428SceneIndex(C80_428_GLB_SHA256,'2F','CLOSED',true),null);
});
test('malformed GLB metadata and wrong SHA fail closed',()=>{
 for(const i of ids){
  assert.equal(isC80428SourceScene(null,C80_428_GLB_SHA256,i),false);
  assert.equal(isC80428SourceScene({scenes:[]},C80_428_GLB_SHA256,i),false);
  assert.equal(isC80428SourceScene({scenes:[{}]},'wrong',i),false);
 }
});
const path=process.env.C80_428_GLB_PATH;
test('authentic SHA/GLB all nine scenes, roles, source roots and negative mutations',{skip:!path},()=>{
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,C80_428_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),C80_428_GLB_SHA256);
 const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const i of ids){
  const s=C80_428_SCENES[i],old=g.scenes[i],parent=g.scenes[s.parentScene];
  assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,i,s.floor,s.glazing,s.cutaway),true,'scene '+i);
  assert.equal(isC80428SourceScene(g,'0'.repeat(64),i),false);
  g.scenes[i]={...old,nodes:old.nodes.slice().reverse()};
  assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,i),false);
  g.scenes[i]={...old,extras:{...old.extras,sourceLinksBindingVerified:true}};
  assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,i),false);
  g.scenes[i]={...old,extras:{...old.extras,rejectedHigh3Excluded:false}};
  assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,i),false);
  g.scenes[i]=old;
  g.scenes[s.parentScene]={...parent,nodes:parent.nodes.slice().reverse()};
  assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,i),false);
  g.scenes[s.parentScene]=parent;
 }
 let old=g.nodes[12156].mesh;
 g.nodes[12156].mesh=0;
 assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,421),false);
 g.nodes[12156].mesh=old;
 old=g.nodes[12157].children;
 g.nodes[12157].children=[12112,12156];
 assert.equal(isC80428SourceScene(g,C80_428_GLB_SHA256,421),false);
 g.nodes[12157].children=old;
});
