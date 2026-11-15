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


// Required CI: the real 55 MB GLB fixture is optional, so keep this compact
// positive -> tampered -> rejected -> restored fixture always enabled.
function syntheticC80500Source() {
 const j={
  scene:292,scenes:Array.from({length:500},()=>({name:'UNUSED',nodes:[]})),
  nodes:Array.from({length:12238},()=>({})),
  meshes:Array.from({length:4611},()=>({})),
  materials:Array.from({length:739},()=>({})),
 };
 j.nodes[12228]={name:'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST_HOST_HOLD',
  children:[12225,12226,12227]};
 j.nodes[12230]={name:'SAVO_MJ83_OWNERPHOTO_CORRECTED_KEYPAD_ROOT_WORK_TEST_HOST_HOLD',
  children:[12229]};
 j.nodes[12237]={name:'M5_WW1974_APT_ABC_L100_THREE_BRANCHES_TO_L150_WORK_TEST_HOST_HOLD',
  children:[12231,12232,12233,12234,12235,12236],
  extras:{current:false,asBuilt:false,sourceLinksBound:false,originalMainRoot:12228}};
 const apt=['A','A','B','B','C','C'];
 for(let k=0;k<6;k++)j.nodes[12231+k]={
  name:'WW1974_'+apt[k]+'_L100_DRAIN_WORK_TEST_HOST_HOLD',
  mesh:4605+k,extras:{current:false,asBuilt:false,sourceLinksBound:false}};
 for(const [i,roots] of [[483,[12228]],[489,[12228,12230]],[491,[12228,12230]],
   [493,[12228,12230]],[494,[12228,12230]]]){
  j.scenes[i]={name:'PARENT_SCENE_'+i,nodes:roots};
 }
 for(const i of [488,490,492]){
  j.scenes[i]={name:'C80_495_WW74_L150_SAVO_OWNERPHOTO_UV_COFIT_2F_'+i,
   nodes:[12230],extras:{stage:'WORK_TEST_HOST_HOLD',
    cofitSavoPhotoUV:true,sourceLinksBoundForNewSHA:false}};
 }
 for(const [i,prior] of [[495,483],[496,489],[497,491],[498,493],[499,494]]){
  j.scenes[i]={name:'C80_WW1974_ABC_L100_TO_L150_FROM_SCENE_'+prior+'_WORK_TEST_HOST_HOLD',
   nodes:[...j.scenes[prior].nodes,12237],
   extras:{stage:'WORK_TEST_HOST_HOLD',asBuilt:false,
    ww1974AbcBranches:{WORK_TEST:true,current:false,asBuilt:false,
     mainRoot:12228,newRoot:12237,parentSourceScene:prior}}};
 }
 const rendered=j.scenes.map(s=>({name:s.name,
  children:s.nodes.map(n=>({name:j.nodes[n]?.name||''})),
  traverse(fn){for(const child of this.children)fn(child);}}));
 return {json:j,gltf:{parser:{json:j},scenes:rendered}};
}

test('500 floor runtime refuses stale source mesh, scene metadata and rendered roots during restore',()=>{
 const {json,gltf}=syntheticC80500Source();
 let mounted=gltf.scenes[496], mounts=0;
 const runtime=createC80500ABCFloorRuntime({
  gltf,sha:C80_500_GLB_SHA256,mount(next){mounted=next;mounts++;},
  mounted(){return mounted;},
 });
 assert.equal(runtime.apply('2F')?.exceptions.length,0);
 assert.equal(runtime.sceneIndex,488);
 const baselineMounts=mounts;
 json.nodes[12231].mesh=17;
 assert.equal(runtime.apply('BOTH'),null,'tampered source mesh cannot mount');
 runtime.restore();
 assert.equal(mounts,baselineMounts,'restore cannot mount stale 496');
 assert.equal(runtime.sceneIndex,488,'failed restore does not claim BOTH');
 json.nodes[12231].mesh=4605;
 runtime.restore();
 assert.equal(runtime.sceneIndex,496,'source restoration permits restore');
 assert.equal(mounted,gltf.scenes[496]);

 assert.ok(runtime.apply('2F'));
 const before=mounts;
 json.scenes[496].extras.ww1974AbcBranches.newRoot=0;
 runtime.restore();
 assert.equal(mounts,before,'wrong root receipt blocks restore');
 json.scenes[496].extras.ww1974AbcBranches.newRoot=12237;
 runtime.restore();
 assert.equal(runtime.sceneIndex,496);

 assert.ok(runtime.apply('2F'));
 gltf.scenes[490].children[0].name='ROOM3_DONOR_WRONG_RENDER_ROOT';
 assert.equal(runtime.setGlazing('ONE_OPEN'),null,'rendered node mismatch blocks scene swap');
 assert.equal(runtime.sceneIndex,488);
 gltf.scenes[490].children[0].name=json.nodes[12230].name;
 assert.ok(runtime.setGlazing('ONE_OPEN'));
 assert.equal(runtime.sceneIndex,490);
 runtime.dispose();
 assert.equal(runtime.apply('BOTH'),null);
});
