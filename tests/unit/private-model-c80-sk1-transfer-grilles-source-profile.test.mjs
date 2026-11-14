// SK1 source-only guard. No binary fixture is committed to Git.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SK1_SCENES,C80_SK1_GLB_SHA256,C80_SK1_GLB_BYTES,
 C80_SK1_SOURCE_LINKS_BOUND,C80_SK1_PUBLISH_ALLOWED,
 C80_SK1_HUMAN_REVIEW,c80Sk1RootFnv32,
 resolveC80Sk1TransferGrillesSceneIndex,isC80Sk1TransferGrillesSourceScene,
 c80Sk1TransferGrillesSourceReceipt
} from '../../src/scripts/privateModelC80Sk1TransferGrillesSourceProfile.mjs';

test('SK1: two exact 1F/BOTH source roles, never publication',()=>{
 assert.deepEqual(Object.keys(C80_SK1_SCENES).map(Number),[469,470]);
 assert.equal(C80_SK1_SOURCE_LINKS_BOUND,false);
 assert.equal(C80_SK1_PUBLISH_ALLOWED,false);
 assert.equal(C80_SK1_HUMAN_REVIEW,'NOT_RUN');
 for(const [id,s] of Object.entries(C80_SK1_SCENES)){
   assert.equal(resolveC80Sk1TransferGrillesSceneIndex(C80_SK1_GLB_SHA256,s.parentScene,s.floor),Number(id));
   assert.equal(s.roots.length,2);
 }
 assert.equal(c80Sk1RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80Sk1RootFnv32([1,-1]),null);
 assert.equal(resolveC80Sk1TransferGrillesSceneIndex('0'.repeat(64),467,'1F'),null);
 assert.equal(resolveC80Sk1TransferGrillesSceneIndex(C80_SK1_GLB_SHA256,467,'2F'),null);
 assert.equal(resolveC80Sk1TransferGrillesSceneIndex(C80_SK1_GLB_SHA256,461,'1F'),null);
});
test('SK1: missing and unauthenticated sources fail closed',()=>{
 for(const index of [469,470]){
   assert.equal(isC80Sk1TransferGrillesSourceScene(null,C80_SK1_GLB_SHA256,index),false);
   assert.equal(isC80Sk1TransferGrillesSourceScene({scenes:[]},C80_SK1_GLB_SHA256,index),false);
   assert.equal(isC80Sk1TransferGrillesSourceScene({scenes:[]},'0'.repeat(64),index),false);
 }
 const receipt=c80Sk1TransferGrillesSourceReceipt(null,C80_SK1_GLB_SHA256,469);
 assert.equal(receipt.exactSource,false);
 assert.equal(receipt.publishAllowed,false);
 assert.equal(receipt.physicalHostVerified,false);
 assert.ok(Object.isFrozen(receipt));
});
const fixture=process.env.C80_SK1_GLB_PATH;
test('SK1: authentic original GLB two scenes and negative mutations',{skip:!fixture},()=>{
 const b=readFileSync(fixture);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,C80_SK1_GLB_BYTES);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(sha,C80_SK1_GLB_SHA256);
 const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [k,spec] of Object.entries(C80_SK1_SCENES)){
   const index=Number(k),s=gltf.scenes[index];
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,index,spec.floor),true,'authentic scene '+k);
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,'0'.repeat(64),index),false);
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,index,'incorrect'),false);
   gltf.scenes[index]={...s,nodes:[...s.nodes].reverse()};
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,index),false,'root order drift '+k);
   gltf.scenes[index]={...s,extras:{...s.extras,sourceLinksBindingVerified:true}};
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,index),false,'misleading bound '+k);
   gltf.scenes[index]={...s,extras:{...s.extras,G2S04_SK1_20261114:{...s.extras.G2S04_SK1_20261114,physicalXYZVerified:true}}};
   assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,index),false,'false host claim '+k);
   gltf.scenes[index]=s;
 }
 const node=gltf.nodes[10156];
 gltf.nodes[10156]={...node,mesh:3707};
 assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,469),false,'wrong grille mesh');
 gltf.nodes[10156]=node;
 const node2=gltf.nodes[10159];
 gltf.nodes[10159]={...node2,extras:{...node2.extras,hostHold:false}};
 assert.equal(isC80Sk1TransferGrillesSourceScene(gltf,sha,470),false,'unsafe host claim');
 gltf.nodes[10159]=node2;
 assert.equal(c80Sk1TransferGrillesSourceReceipt(gltf,sha,469).exactSource,true);
 assert.equal(c80Sk1TransferGrillesSourceReceipt(gltf,sha,470).exactSource,true);
});
