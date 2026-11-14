// SUCC455 source-only guard. Original 54.8MB GLB is loaded only when fixture is supplied.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SUCC455_SCENES,C80_SUCC455_GLB_SHA256,C80_SUCC455_GLB_BYTES,
 C80_SUCC455_ZIP_DRIVE_ID,C80_SUCC455_SOURCE_LINKS_BOUND,
 C80_SUCC455_PUBLISH_ALLOWED,C80_SUCC455_PRODUCTION_WEBGL_VERIFIED,
 C80_SUCC455_HUMAN_REVIEW,c80Succ455RootFnv32,
 isC80Succ455LedSpacingSourceScene,resolveC80Succ455LedSpacingSceneIndex,
 c80Succ455LedSpacingSourceReceipt
} from '../../src/scripts/privateModelC80Succ455LedSpacingSourceProfile.mjs';

const sceneIds=[460,461,462,463,464,465,466,467,468];
test('exact nine source roles and fail-closed publish gate',()=>{
 assert.deepEqual(Object.keys(C80_SUCC455_SCENES).map(Number),sceneIds);
 assert.equal(C80_SUCC455_ZIP_DRIVE_ID,'1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE');
 assert.equal(C80_SUCC455_SOURCE_LINKS_BOUND,false);
 assert.equal(C80_SUCC455_PUBLISH_ALLOWED,false);
 assert.equal(C80_SUCC455_PRODUCTION_WEBGL_VERIFIED,false);
 assert.equal(C80_SUCC455_HUMAN_REVIEW,'NOT_RUN');
 assert.equal(new Set(Object.values(C80_SUCC455_SCENES).map(s=>s.rootFnv)).size,9);
 for(const [id,s] of Object.entries(C80_SUCC455_SCENES)){
   assert.equal(resolveC80Succ455LedSpacingSceneIndex(C80_SUCC455_GLB_SHA256,s.parentScene,s.floor),Number(id));
   assert.ok(s.name.includes('_FROM_SCENE'+s.parentScene+'_'));
 }
 assert.equal(c80Succ455RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80Succ455RootFnv32([1,-1]),null);
 assert.equal(resolveC80Succ455LedSpacingSceneIndex('0'.repeat(64),453,'2F'),null);
 assert.equal(resolveC80Succ455LedSpacingSceneIndex(C80_SUCC455_GLB_SHA256,453,'1F'),null);
});
test('unauthenticated or incomplete source rejects',()=>{
 for(const id of sceneIds){
   assert.equal(isC80Succ455LedSpacingSourceScene(null,C80_SUCC455_GLB_SHA256,id),false);
   assert.equal(isC80Succ455LedSpacingSourceScene({scenes:[]},C80_SUCC455_GLB_SHA256,id),false);
   assert.equal(isC80Succ455LedSpacingSourceScene({scenes:[]},'0'.repeat(64),id),false);
 }
 const receipt=c80Succ455LedSpacingSourceReceipt(null,C80_SUCC455_GLB_SHA256,460);
 assert.deepEqual(receipt,{exactSource:false,sourceLinksBound:false,publishAllowed:false,
   productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
 assert.ok(Object.isFrozen(receipt));
});
const fixture=process.env.C80_SUCC455_GLB_PATH;
test('authentic SUCC455 nine scenes and negative source/geometry mutations',{skip:!fixture},()=>{
 const b=readFileSync(fixture);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,C80_SUCC455_GLB_BYTES);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(sha,C80_SUCC455_GLB_SHA256);
 const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [key,spec] of Object.entries(C80_SUCC455_SCENES)){
   const id=Number(key),s=doc.scenes[id];
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,id,spec.floor),true,'authentic scene '+key);
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,'0'.repeat(64),id,spec.floor),false);
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,id,'incorrect-floor'),false);
   doc.scenes[id]={...s,nodes:[...s.nodes].reverse()};
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,id),false,'root-order drift '+key);
   doc.scenes[id]={...s,extras:{...s.extras,sourceLinksBindingVerified:true}};
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,id),false,'bound without approval '+key);
   doc.scenes[id]={...s,extras:{...s.extras,plan2015SpacingCorrection:{
     ...s.extras.plan2015SpacingCorrection,spacing2Fmm:900
   }}};
   assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,id),false,'wrong plan spacing '+key);
   doc.scenes[id]=s;
 }
 const n2=doc.nodes[12177];
 doc.nodes[12177]={...n2,translation:[n2.translation[0],n2.translation[1],-3.5]};
 assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,461),false,'2F light moved');
 doc.nodes[12177]=n2;
 const n1=doc.nodes[12193];
 doc.nodes[12193]={...n1,children:n1.children.filter(id=>id!==12191)};
 assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,467),false,'1F light omitted');
 doc.nodes[12193]=n1;
 const wc=doc.nodes[12194];
 doc.nodes[12194]={...wc,extras:{...wc.extras,new2FWCNodes:[12168,12169]}};
 assert.equal(isC80Succ455LedSpacingSourceScene(doc,sha,460),false,'stale WC metadata');
 doc.nodes[12194]=wc;
 assert.equal(c80Succ455LedSpacingSourceReceipt(doc,sha,461).exactSource,true);
});
