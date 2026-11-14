import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 C80_500_GLB_SHA256,C80_500_GLB_BYTES,C80_500_ABC_ROOT,
 C80_500_L150_ROOT,C80_500_SAVO_ROOT,
 resolveC80500ABCScenes,
} from '../../src/scripts/privateModelC80500WW1974ABCSourceProfile.mjs';
import {
 createC80500ABCFloorRuntime,c80500ABCReviewProfile,
} from '../../src/scripts/privateModelC80500WW1974ABCFloorRuntime.mjs';

const roles=[[495,'1F','CLOSED',false],[488,'2F','CLOSED',false],
 [496,'BOTH','CLOSED',false],[490,'2F','ONE_OPEN',false],
 [497,'BOTH','ONE_OPEN',false],[492,'2F','STACKED',false],
 [498,'BOTH','STACKED',false],[499,'BOTH','CLOSED',true]];

test('500 floor runtime fails closed on absent source, wrong SHA and invalid callbacks',()=>{
 assert.throws(()=>createC80500ABCFloorRuntime({
   gltf:null,sha:C80_500_GLB_SHA256,mount:()=>{},mounted:()=>null
 }),/C80_500_SOURCE_SCENE_MISMATCH/);
 assert.throws(()=>createC80500ABCFloorRuntime({
   gltf:null,sha:C80_500_GLB_SHA256,mount:null,mounted:()=>null
 }),/C80_500_MOUNT_CONTRACT/);
 assert.equal(c80500ABCReviewProfile({},C80_500_GLB_SHA256,496),null);
 assert.equal(c80500ABCReviewProfile({},'wrong',496),null);
});

const fixture=process.env.C80_500_GLB_PATH;
test('authentic 55MB GLB: eight role transitions, strict technical roots and no stale mount',
  {skip:!fixture},()=>{
 const bytes=readFileSync(fixture);
 assert.equal(bytes.length,C80_500_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),C80_500_GLB_SHA256);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map(s=>({
   name:s.name,
   children:s.nodes.map(n=>({name:json.nodes[n]?.name})),
   traverse(fn){for(const child of this.children)fn(child);}
 }));
 const gltf={parser:{json},scenes};
 const accepted=resolveC80500ABCScenes(gltf,C80_500_GLB_SHA256);
 assert.ok(accepted);
 let current=accepted[496];
 const runtime=createC80500ABCFloorRuntime({
   gltf,sha:C80_500_GLB_SHA256,mount(next){current=next;},mounted(){return current;}
 });
 assert.equal(runtime.defaultScene,accepted[496]);
 assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
 assert.equal(runtime.stairStatus,'HOST_HOLD');
 assert.equal(runtime.isC80500WWABC,true);
 for(const [index,floor,glazing,cutaway] of roles){
   runtime.restore();
   assert.ok(runtime.apply(floor,glazing));
   if(cutaway)assert.ok(runtime.setCutaway(true));
   assert.equal(runtime.sceneIndex,index);
   assert.equal(runtime.selectedScene,current);
   assert.equal(runtime.floor,floor);
   const roots=json.scenes[index].nodes;
   assert.equal(roots.includes(C80_500_ABC_ROOT),floor!=='2F');
   assert.equal(roots.includes(C80_500_L150_ROOT),floor!=='2F');
   assert.equal(roots.includes(C80_500_SAVO_ROOT),floor!=='1F');
   const technical=c80500ABCReviewProfile(json,C80_500_GLB_SHA256,index);
   assert.ok(technical);
   assert.equal(technical.count,500);
   assert.equal(technical.scenes[index].name,json.scenes[index].name);
   const highlighted=technical.roots[index].map(x=>x.node);
   if(floor!=='2F')assert.ok(highlighted.includes(C80_500_ABC_ROOT));
   assert.ok(highlighted.includes(floor==='1F'?12224:C80_500_SAVO_ROOT));
 }
 runtime.restore();
 assert.equal(runtime.setGlazing('UNKNOWN'),null);
 assert.equal(runtime.setCutaway(true)?.exceptions.length,0);
 assert.equal(runtime.setGlazing('ONE_OPEN'),null);
 runtime.restore();
 current=null;
 assert.equal(runtime.apply('BOTH'),null);
 current=accepted[496];
 runtime.dispose();
 assert.equal(runtime.apply('BOTH'),null);
 assert.equal(runtime.setCutaway(true),null);
 assert.equal(c80500ABCReviewProfile(json,'wrong',496),null);
 assert.equal(c80500ABCReviewProfile(json,C80_500_GLB_SHA256,-1),null);
});
