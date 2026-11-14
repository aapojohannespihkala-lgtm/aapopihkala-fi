import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_SUCC455_ROOM3_GLB_SHA256,C80_SUCC455_ROOM3_GLB_BYTES,
  C80_SUCC455_ROOM3_SCENES,C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND,
  C80_SUCC455_ROOM3_PUBLISH_ALLOWED,C80_SUCC455_ROOM3_HUMAN_REVIEW,
  C80_SUCC455_ROOM3_ZIP_DRIVE_ID,c80Succ455Room3RootFnv32,
  isC80Succ455Room3CofitSourceScene,resolveC80Succ455Room3CofitSceneIndex,
  c80Succ455Room3CofitSourceReceipt,
} from '../../src/scripts/privateModelC80Succ455Room3CofitSourceProfile.mjs';

const indices=[469,470,471,472,473,474,475];
test('seven 2F/BOTH photo-door scenes and explicit work-test rejection gates',()=>{
  assert.deepEqual(Object.keys(C80_SUCC455_ROOM3_SCENES).map(Number),indices);
  assert.equal(C80_SUCC455_ROOM3_ZIP_DRIVE_ID,'1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl');
  assert.equal(C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND,false);
  assert.equal(C80_SUCC455_ROOM3_PUBLISH_ALLOWED,false);
  assert.equal(C80_SUCC455_ROOM3_HUMAN_REVIEW,'NOT_RUN');
  assert.equal(new Set(Object.values(C80_SUCC455_ROOM3_SCENES).map(s=>s.rootFnv)).size,7);
  for(const [key,s] of Object.entries(C80_SUCC455_ROOM3_SCENES)){
    assert.equal(resolveC80Succ455Room3CofitSceneIndex(C80_SUCC455_ROOM3_GLB_SHA256,s.sourceScene,s.floor),+key);
    assert.ok(s.name.includes('_FROM_SCENE'+s.sourceScene+'_'));
  }
  assert.equal(resolveC80Succ455Room3CofitSceneIndex('0'.repeat(64),460,'2F'),null);
  assert.equal(resolveC80Succ455Room3CofitSceneIndex(C80_SUCC455_ROOM3_GLB_SHA256,467,'1F'),null);
  assert.equal(resolveC80Succ455Room3CofitSceneIndex(C80_SUCC455_ROOM3_GLB_SHA256,460,'BOTH'),null);
  assert.equal(c80Succ455Room3RootFnv32([1,2,3]),'56cf37ab');
  assert.equal(c80Succ455Room3RootFnv32([1,-1]),null);
});
test('no matching source without raw authentication and complete metadata',()=>{
  for(const id of indices){
    assert.equal(isC80Succ455Room3CofitSourceScene(null,C80_SUCC455_ROOM3_GLB_SHA256,id),false);
    assert.equal(isC80Succ455Room3CofitSourceScene({scenes:[]},C80_SUCC455_ROOM3_GLB_SHA256,id),false);
  }
  const result=c80Succ455Room3CofitSourceReceipt(null,C80_SUCC455_ROOM3_GLB_SHA256,469);
  assert.deepEqual(result,{exactSource:false,sourceLinksBound:false,publishAllowed:false,
    productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',current:false,asBuilt:false});
  assert.ok(Object.isFrozen(result));
});
// Supply only the original complete private GLB fixture. Do not commit it.
const fixture=process.env.C80_SUCC455_ROOM3_GLB_PATH;
test('authentic 54.9MB GLB verifies all seven roots, leaves and host gates',{skip:!fixture},()=>{
  const b=readFileSync(fixture);
  assert.equal(b.toString('ascii',0,4),'glTF');
  assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(b.length,C80_SUCC455_ROOM3_GLB_BYTES);
  const sha=createHash('sha256').update(b).digest('hex');
  assert.equal(sha,C80_SUCC455_ROOM3_GLB_SHA256);
  const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
  for(const [key,s] of Object.entries(C80_SUCC455_ROOM3_SCENES)){
    const i=+key,original=doc.scenes[i];
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i,s.floor),true,'scene '+i);
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,'0'.repeat(64),i),false);
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i,'1F'),false);
    doc.scenes[i]={...original,nodes:[...original.nodes].reverse()};
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i),false,'root order '+i);
    doc.scenes[i]={...original,extras:{...original.extras,sourceLinksBound:true}};
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i),false,'source links forged '+i);
    doc.scenes[i]={...original,extras:{...original.extras,sourceSUCC455GLBSHA256:'0'.repeat(64)}};
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i),false,'parent identity '+i);
    doc.scenes[i]={...original,extras:{...original.extras,oldDoorLeafHiddenInThisSceneOnly:8030}};
    assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,i),false,'door identity '+i);
    doc.scenes[i]=original;
  }
  const node=doc.nodes[12222];
  doc.nodes[12222]={...node,children:[...node.children,8028]};
  assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,470),false,'duplicate old door');
  doc.nodes[12222]=node;
  const wc=doc.nodes[12220];
  doc.nodes[12220]={...wc,children:wc.children.filter(x=>x!==8031)};
  assert.equal(isC80Succ455Room3CofitSourceScene(doc,sha,470),false,'WC lost');
  doc.nodes[12220]=wc;
  assert.equal(c80Succ455Room3CofitSourceReceipt(doc,sha,470).exactSource,true);
});
