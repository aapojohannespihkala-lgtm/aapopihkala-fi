import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
 K3_COMBINED_787788_SOURCE as S,
 isK3CombinedScene787788Source as valid,
 k3CombinedScene787788SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3CombinedScene787788SourceReceipt.mjs';
const OLD = [11625, 13522, 13519, 13525, 13507, 13510, 13513, 13516, 13246, 11779];
function fixture() {
 const scenes = Array.from({length:S.sceneCount}, () => ({nodes:[]}));
 const nodes = Array.from({length:S.nodeCount}, () => ({}));
 for (const [role,v] of Object.entries(S.views)) {
   const roots = OLD.filter(x=>v.plexi||x!==11625);
   scenes[v.parent] = {nodes:[...roots]};
   scenes[v.index] = {
     name:'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_'+role+'_WORK_TEST_HOST_HOLD__scene'+v.index,
     nodes:[...roots, S.newRoot],
     extras:{
       stage:'WORK_TEST_HOST_HOLD',role,sourceParentScene:v.parent,
       normalServiceRole:role,sourceOriginalGLBSHA256:S.baseOriginalGlbSHA256,
       donorOriginalGLBSHA256:S.donorOriginalGlbSHA256,
       donorSourceScene:v.donorScene,newD1FSW04Root:S.newRoot,
       newD1FSW04Children:[...S.newChildren],current:false,asBuilt:false,
       humanReview:false,productionWebGLVerified:false,sourceLinksBoundToOutputSHA:false
     }
   };
 }
 for(const [id,index] of Object.entries(S.existingSwitchRoots)) {
   nodes[index]={extras:{stableID:id,floor:id.slice(0,3),current:false,asBuilt:false}};
 }
 nodes[S.newRoot] = {
   name:'K3_D1F_SW04_SOURCE_EXACT_87MM_WHITE_COFIT_787788_WORK_TEST_HOST_HOLD',
   children:[...S.newChildren],
   extras:{
     stableID:'D1F-SW-04',floor:'D1F',stage:'WORK_TEST_HOST_HOLD',
     cofitBaseOriginalGLBSHA256:S.baseOriginalGlbSHA256,
     cofitDonorOriginalGLBSHA256:S.donorOriginalGlbSHA256,
     sourceOwnerMarkerNode:11779,activeHostNodeID:13495,
     activeHostMeshID:5165,activeHostPrimitive:1,activeHostTriangle:34,
     activeHostPlaneZ_m:-5.032,proxyFrameOuter_m:0.087,
     proxyVisibleRocker_m:0.069,hostHold:true,
     sourceLinksBoundToOutputSHA:false,installedSKUNotVerified:true,
     physicalHostNotVerified:true,electricalCircuitNotVerified:true,
     current:false,asBuilt:false,productionWebGLVerified:false,humanReview:false,
   },
 };
 nodes[13529]={mesh:5183};nodes[13530]={mesh:5184};nodes[13495]={mesh:5165};
 return {asset:{version:'2.0',extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
 scene:S.defaultScene,scenes,nodes,meshes:Array(S.meshCount).fill(null),
 materials:Array(S.materialCount).fill(null),
 accessors:Array(S.accessorCount).fill(null),bufferViews:Array(S.bufferViewCount).fill(null)};
}
const ok=(j,v,sha=S.glbSHA256)=>valid(j,sha,v.index,v===S.views.NORMAL?'NORMAL':'SERVICE','BOTH');
test('K3 combined 787/788: exact SHA and both COW scenes accepted as source only',()=>{
 for(const v of Object.values(S.views)) {
  const j=fixture();assert.equal(ok(j,v),true);
  const r=receipt(j,S.glbSHA256,v.index,v===S.views.NORMAL?'NORMAL':'SERVICE','BOTH');
  assert.equal(r.exactSource,true);
  for(const flag of ['sourceLinksBound','viewerRegistered','publishAllowed','productionWebGLVerified','current','asBuilt','installedProductVerified','physicalHostVerified','electricalCircuitVerified'])assert.equal(r[flag],false);
  assert.equal(r.humanReview,'NOT_RUN');
 }
});
test('refuse wrong version, role, parent graph, provenance or physical approval',()=>{
 for(const v of Object.values(S.views)){
  const j=fixture(); const check=()=>ok(j,v);
  assert.equal(check(),true);
  for(const sha of [S.baseOriginalGlbSHA256,S.donorOriginalGlbSHA256,'0'.repeat(64),'bad'])
   assert.equal(ok(j,v,sha),false);
  assert.equal(valid(j,S.glbSHA256,v.index,'bad','BOTH'),false);
  assert.equal(valid(j,S.glbSHA256,v.index,v===S.views.NORMAL?'NORMAL':'SERVICE','D1F'),false);
  const mutate=(o,k,value)=>{const prev=o[k];o[k]=value;try{assert.equal(check(),false,k);}finally{o[k]=prev;}};
  mutate(j,'scene',787);
  mutate(j.asset.extras,'ModelStage','CURRENT');
  mutate(j.asset.extras,'HUMAN_REVIEW','APPROVED');
  mutate(j.scenes[v.index],'name','forged__scene'+v.index);
  mutate(j.scenes[v.index].extras,'sourceOriginalGLBSHA256','0'.repeat(64));
  mutate(j.scenes[v.index].extras,'donorOriginalGLBSHA256','bad');
  mutate(j.scenes[v.index].extras,'donorSourceScene',785);
  mutate(j.scenes[v.index].extras,'sourceLinksBoundToOutputSHA',true);
  mutate(j.scenes[v.index].extras,'productionWebGLVerified',true);
  j.scenes[v.index].nodes.pop();assert.equal(check(),false);j.scenes[v.index].nodes.push(S.newRoot);
  mutate(j.nodes[S.newRoot],'children',[13529]);
  mutate(j.nodes[S.newRoot].extras,'stableID','D2F-SW-04');
  mutate(j.nodes[S.newRoot].extras,'activeHostTriangle',33);
  mutate(j.nodes[S.newRoot].extras,'installedSKUNotVerified',false);
  mutate(j.nodes[S.newRoot].extras,'sourceLinksBoundToOutputSHA',true);
  mutate(j.nodes[S.existingSwitchRoots['D2F-SW-02']].extras,'stableID','D2F-SW-01');
  mutate(j.nodes[13529],'mesh',5184);
  mutate(j.nodes[13495],'mesh',0);
  assert.equal(check(),true);
 }
});
test('null source cannot be used for publishing',()=>{
 const r=receipt(null,S.glbSHA256,787,'NORMAL','BOTH');
 assert.equal(r.exactSource,false);assert.equal(r.publishAllowed,false);assert.equal(r.viewerRegistered,false);
});
const raw=process.env.C80_R31_K3_COMBINED_SCENE787788_GLB_PATH;
test('optional ORIGINAL RAW GLB bytes, SHA and normal/service source identity',{skip:!raw},()=>{
 const b=readFileSync(raw);assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);assert.equal(b.length,S.glbBytes);
 const sha=createHash('sha256').update(b).digest('hex');assert.equal(sha,S.glbSHA256);
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [role,v] of Object.entries(S.views)){
  assert.equal(valid(j,sha,v.index,role,'BOTH'),true);
  assert.equal(receipt(j,sha,v.index,role,'BOTH').publishAllowed,false);
 }
});
