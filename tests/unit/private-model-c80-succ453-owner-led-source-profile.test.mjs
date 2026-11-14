// SUCC453 read-only source receipt. The original 54.7MB GLB is not committed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SUCC453_SCENES,C80_SUCC453_GLB_SHA256,C80_SUCC453_GLB_BYTES,
 C80_SUCC453_SOURCE_LINKS_BOUND,C80_SUCC453_PUBLISH_ALLOWED,
 C80_SUCC453_WC_INDEX_METADATA_HOLD,c80Succ453RootFnv32,
 resolveC80Succ453OwnerLedSourceSceneIndex,isC80Succ453OwnerLedSourceScene,
 c80Succ453SourceReceipt
} from '../../src/scripts/privateModelC80Succ453OwnerLedSourceProfile.mjs';
const ids=[446,447,448,449,450,451,452];
test('seven exact immutable source roles and fail-closed status',()=>{
 assert.deepEqual(Object.keys(C80_SUCC453_SCENES).map(Number),ids);
 assert.equal(new Set(Object.values(C80_SUCC453_SCENES).map(v=>v.rootFnv)).size,7);
 assert.equal(C80_SUCC453_SOURCE_LINKS_BOUND,false);
 assert.equal(C80_SUCC453_PUBLISH_ALLOWED,false);
 assert.deepEqual(C80_SUCC453_WC_INDEX_METADATA_HOLD.actual,[12169,12170]);
 assert.deepEqual(C80_SUCC453_WC_INDEX_METADATA_HOLD.claimed,[12168,12169]);
 for(const [id,v] of Object.entries(C80_SUCC453_SCENES)){
   assert.equal(resolveC80Succ453OwnerLedSourceSceneIndex(C80_SUCC453_GLB_SHA256,v.parentScene,v.floor),Number(id));
 }
 assert.equal(c80Succ453RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80Succ453RootFnv32([1,-1]),null);
 assert.equal(resolveC80Succ453OwnerLedSourceSceneIndex('not-authenticated',438,'2F'),null);
 assert.equal(resolveC80Succ453OwnerLedSourceSceneIndex(C80_SUCC453_GLB_SHA256,438,'1F'),null);
});
test('missing data and unauthenticated binary digest reject',()=>{
 for(const i of ids){
   assert.equal(isC80Succ453OwnerLedSourceScene(null,C80_SUCC453_GLB_SHA256,i),false);
   assert.equal(isC80Succ453OwnerLedSourceScene({scenes:[]},C80_SUCC453_GLB_SHA256,i),false);
   assert.equal(isC80Succ453OwnerLedSourceScene({scenes:[]},'0'.repeat(64),i),false);
 }
 const r=c80Succ453SourceReceipt(null,C80_SUCC453_GLB_SHA256,446);
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
});
const path=process.env.C80_SUCC453_GLB_PATH;
test('authentic SUCC453 glTF all seven roles plus negative mutations',{skip:!path},()=>{
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.length,C80_SUCC453_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),C80_SUCC453_GLB_SHA256);
 const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [id,sp] of Object.entries(C80_SUCC453_SCENES)){
  const i=Number(id),s=doc.scenes[i];
  assert.equal(isC80Succ453OwnerLedSourceScene(doc,C80_SUCC453_GLB_SHA256,i,sp.floor),true,'valid scene '+i);
  assert.equal(isC80Succ453OwnerLedSourceScene(doc,'0'.repeat(64),i),false);
  doc.scenes[i]={...s,nodes:s.nodes.slice().reverse()};
  assert.equal(isC80Succ453OwnerLedSourceScene(doc,C80_SUCC453_GLB_SHA256,i),false,'root drift '+i);
  doc.scenes[i]={...s,extras:{...s.extras,sourceLinks:'BOUND'}};
  assert.equal(isC80Succ453OwnerLedSourceScene(doc,C80_SUCC453_GLB_SHA256,i),false,'invalid sourceLinks '+i);
  doc.scenes[i]=s;
 }
 const root=doc.nodes[12171];
 assert.deepEqual(root.children.slice(-2),[12169,12170]);
 assert.deepEqual(root.extras.new2FWCNodes,[12168,12169]); // known wrong source metadata
 doc.nodes[12171]={...root,children:[...root.children.slice(0,-1),12168]};
 assert.equal(isC80Succ453OwnerLedSourceScene(doc,C80_SUCC453_GLB_SHA256,446),false);
 doc.nodes[12171]=root;
 const receipt=c80Succ453SourceReceipt(doc,C80_SUCC453_GLB_SHA256,447);
 assert.equal(receipt.exactSource,true);
 assert.equal(receipt.publishAllowed,false);
 assert.deepEqual(receipt.metadataHolds,['WC_ROOT_EXTRA_INDEX_PAIR_MISMATCH_12171']);
});
