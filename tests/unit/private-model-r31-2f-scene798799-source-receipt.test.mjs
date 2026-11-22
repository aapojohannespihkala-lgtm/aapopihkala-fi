import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  R31_2F_798799 as C,R31_2F_798799_ROOTS as ROOTS,
  r31TwoFloorRootsFnv32 as fnv,isR31TwoFloor798799Source as valid,
  r31TwoFloor798799Receipt as receipt
} from '../../src/scripts/privateModelR31TwoFloor798799SourceReceipt.mjs';
function fixture(index){
  const v=C.views[index];
  const nodes=Array.from({length:C.nodeCount},()=>({}));
  for(const sw of C.switchRoots){
    // Use safe synthetic leaves distinct from the source root IDs.
    const child=sw.leaves.map((_,i)=>13000+sw.active%100*2+i);
    nodes[sw.active]={children:child,extras:{stableID:sw.stableID,
      floor:'D2F',current:false,asBuilt:false}};
    child.forEach((id,i)=>nodes[id]={mesh:sw.leaves[i]});
  }
  nodes[13482]={children:[13477,13478,13479,13480,13481],
    extras:{presentationOnly:true,sourceLinksBound:false,
      exactPhysicalPositionVerified:false,current:false,asBuilt:false}};
  const scenes=Array.from({length:C.sceneCount},()=>({nodes:[]}));
  scenes[index]={
    name:'Ylisrinne_C80_R31_2F_K3_SW01_SW02_SW03_SW04_SW05_H18116_COFIT_'+
      (index===798?'NORMAL':'SERVICE')+'_WORK_TEST_HOST_HOLD__scene'+index,
    nodes:[...ROOTS[index]],
    extras:{
      stage:'WORK_TEST_HOST_HOLD',floor:'2F',sceneRole:v.role,plexyState:v.plexy,
      sourceParentSceneIndex:v.parent,sourceParentGLBSHA256:C.donorGlbSha256,
      sourceParentZipID:C.donorZipDriveId,currentBaseSceneIndex:797,
      currentBaseGLBSHA256:C.baseGlbSha256,currentBaseZipID:C.baseZipDriveId,
      baseGlbSha256:C.originalR31GlbSha256,
      cofit:'EXISTING_2F_ROOTS_SW01_TO_SW05_SOURCE_EXACT_NO_DUPLICATE',
      sourceLinksForOutputSHA:'NOT_BOUND',sourceLinksOutputSHA:'NOT_BOUND',
      sourceLinksOutputShaBound:false,current:false,asBuilt:false,canonical:false,
      physicalHostVerified:false,newGeometry:false,productionWebGL:'NOT_RUN',
      humanReview:'NOT_RUN',switchInstallationNotVerified:true,
      H18116SourceRoleRoot:13482,
      source2FOnlyRootsPreserved:[10976,11727,12242,13505],
      replaceOnlyLegacy2FSwitchRoots:Object.fromEntries(C.switchRoots.map(x=>[x.legacy,x.active]))
    }
  };
  return {asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,
    asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},scene:C.defaultScene,scenes,nodes,
    meshes:Array(C.meshCount),materials:Array(C.materialCount),
    accessors:Array(C.accessorCount),bufferViews:Array(C.bufferViewCount)};
}
const ok=(j,i)=>valid(j,C.glbSha256,i,C.views[i].role,'2F');
test('authenticated 2F 798 NORMAL / 799 SERVICE identities, five source switches',()=>{
 for(const i of [798,799]){
   const j=fixture(i),v=C.views[i];
   assert.equal(ROOTS[i].length,v.rootCount);
   assert.equal(fnv(ROOTS[i]),v.rootFnv);
   assert.equal(ok(j,i),true);
   for(const sw of C.switchRoots){
     const out=receipt(j,C.glbSha256,i,v.role,'2F',sw.stableID);
     assert.equal(out.exactSource,true);assert.equal(out.componentActive,true);
     assert.equal(out.rootNode,sw.active);assert.equal(out.publishAllowed,false);
     assert.equal(out.sourceLinksBound,false);assert.equal(out.humanReview,'NOT_RUN');
   }
   assert.equal(receipt(j,C.glbSha256,i,v.role,'2F','D2F-SW-99').componentActive,false);
 }
 assert.equal(ROOTS[798].includes(11625),true);
 assert.equal(ROOTS[799].includes(11625),false);
});
test('wrong SHA, scene, floor, role, original and donor versions reject',()=>{
 const j=fixture(798);
 for(const sha of ['',C.baseGlbSha256,C.donorGlbSha256,C.zipSha256,'0'.repeat(64)])
   assert.equal(valid(j,sha,798,'2F_NORMAL','2F'),false);
 assert.equal(valid(j,C.glbSha256,799,'2F_NORMAL','2F'),false);
 assert.equal(valid(j,C.glbSha256,798,'2F_SERVICE','2F'),false);
 assert.equal(valid(j,C.glbSha256,798,'2F_NORMAL','BOTH'),false);
});
test('fail-closed roots, parent, pleksi, stage, links, host and switch mesh mutations',()=>{
 const mods=[
  j=>j.scene=798,
  j=>j.asset.extras.current=true,
  j=>j.asset.extras.Canonical=true,
  j=>j.scenes.length--,
  j=>j.nodes.pop(),
  j=>j.scenes[798].name='wrong __scene798',
  j=>j.scenes[798].nodes.reverse(),
  j=>j.scenes[798].nodes.push(j.scenes[798].nodes[0]),
  j=>j.scenes[798].nodes.splice(j.scenes[798].nodes.indexOf(13510),1,13242),
  j=>j.scenes[798].extras.sourceParentSceneIndex=775,
  j=>j.scenes[798].extras.plexyState='PLEX_OFF',
  j=>j.scenes[798].extras.sourceLinksOutputShaBound=true,
  j=>j.scenes[798].extras.sourceLinksOutputSHA=C.glbSha256,
  j=>j.scenes[798].extras.physicalHostVerified=true,
  j=>j.scenes[798].extras.switchInstallationNotVerified=false,
  j=>j.scenes[798].extras.current=true,
  j=>j.scenes[798].extras.baseGlbSha256='wrong',
  j=>j.scenes[798].extras.replaceOnlyLegacy2FSwitchRoots[13242]=13242,
  j=>j.nodes[13510].extras.stableID='D2F-SW-02',
  j=>j.nodes[j.nodes[13510].children[0]].mesh=100,
  j=>j.nodes[13482].extras.exactPhysicalPositionVerified=true
 ];
 for(const mod of mods){const j=fixture(798);mod(j);assert.equal(ok(j,798),false);}
 for(const x of [null,[-1],[1.5],[Number.MAX_SAFE_INTEGER+1]])
   assert.equal(fnv(x),null);
});
const original=process.env.R31_2F_798799_ORIGINAL_GLB;
test('optional byte-authenticated original GLB readback',{skip:!original},()=>{
 const bytes=readFileSync(original);
 assert.equal(bytes.length,C.glbBytes);
 const sha=createHash('sha256').update(bytes).digest('hex');
 assert.equal(sha,C.glbSha256);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(bytes.toString('ascii',16,20),'JSON');
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 for(const i of [798,799])
   assert.equal(valid(json,sha,i,C.views[i].role,'2F'),true,'source scene '+i);
});
