import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene32SourceEvidence } from '../../src/data/scene32SourceScopeEvidence.mjs';
import { r5Lock, auditR5ForLoadedGlb } from '../../src/scripts/privateModelR5CompatibilityGate.mjs';
function fixture() {
  const old=Array.from({length:2024},(_,i)=>({
    sourceNodeIndex:i,sourceMeshIndex:i,objectKey:'old:n'+i,
    phaseScope:i<21?'HISTORICAL':'ACTIVE_IN_SELECTED_WORKTEST',
    r5Mapping:{targetScene:32,targetNodeIndex:i,targetMeshIndex:i,status:'R4C_IDENTICAL_WORLD_AND_CORE',originalR4CObjectKey:'old:n'+i}
  }));
  const added=scene32SourceEvidence().map(r=>({
    sourceNodeIndex:r.nodeIndex,sourceMeshIndex:r.nodeIndex,
    objectKey:'node@'+r5Lock.glb+':n'+r.nodeIndex,
    identityKind:'SCENE32_SHA_LOCKED_NEW_NODE',phaseScope:'ACTIVE_IN_SELECTED_WORKTEST',
    storeyScope:r.storeyScope,role:r.role,
    r5Mapping:{targetScene:32,targetNodeIndex:r.nodeIndex,targetMeshIndex:r.nodeIndex,sourceOldNodeIndex:null,
      status:r.unresolved?'SCENE32_NEW_SOURCE_GATE_STOREY_ROLE_HOLD':'SCENE32_NEW_SOURCE_GATE_READY'}
  }));
  for(const n of [2766,2835]) {const r=added.find(x=>x.sourceNodeIndex===n);
    r.r5Mapping.sourceOldNodeIndex=n===2766?2690:27;
    r.scopeEvidence=[{sourceNodeIndex:r.r5Mapping.sourceOldNodeIndex,gate:'READY'}];
  }
  const records=[...old,...added],manifest={
    version:'20261026_R5_CANDIDATE',stage:'SOURCE_ONLY_WORK_TEST_STAGING_HOLD',targetScene:32,
    publishReady:false,viewerReady:false,containsModelGLB:false,mutatesGeometry:false,scene32GLBExtrasModified:false,
    sourceGlbSha256:['r4c',r5Lock.glb],sourceZipSha256:['r4c',r5Lock.zip],
    activeScopeObjects:2166,copiedOriginalScopeObjects:2024,newScopeObjects:142,
    newSourceGated:134,newUnresolved:8,inactiveOriginalScopeObjects:75
  };
  return {records,manifest,loadedGlbSha256:r5Lock.glb,sidecarZipSha256:r5Lock.sidecar,
    loadedScene:32,retiredOldCount:75,activeNodeIndices:records.map(r=>r.sourceNodeIndex)};
}
const mustReject=(x,code)=>{const q=auditR5ForLoadedGlb(x);assert.equal(q.ok,false);
  assert.equal(q.canApply,false);assert.ok(q.errors.includes(code),q.errors.join(','));};
test('2166/2024/134/8 source gate PASS cannot auto-apply to viewer',()=>{
  const q=auditR5ForLoadedGlb(fixture());
  assert.deepEqual(q.errors,[]);assert.equal(q.ok,true);assert.equal(q.canApply,false);assert.equal(q.browserTested,false);
});
test('R4E metadata-only GLB SHA does NOT match R5 source GLB SHA',()=>{
  const x=fixture();x.loadedGlbSha256='2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680';
  mustReject(x,'SOURCE_GLB_SHA_MISMATCH');
});
test('reject incorrect sidecar, scene, manifest, retired count',()=>{
  for(const [edit,code] of [
    [x=>x.sidecarZipSha256='0'.repeat(64),'R5_ZIP_SHA_MISMATCH'],
    [x=>x.loadedScene=33,'SCENE_MISMATCH'],
    [x=>x.manifest.viewerReady=true,'MANIFEST_MISMATCH'],
    [x=>x.retiredOldCount=74,'RETIRED_COUNT_MISMATCH']]) {const x=fixture();edit(x);mustReject(x,code);}
});
test('all eight K14 UNKNOWN role/floor gates reject guessed classification',()=>{
  for(const n of [2762,2763,2764,2765,2784,2785,2786,2787]) {
    const x=fixture(), r=x.records.find(x=>x.sourceNodeIndex===n);
    r.role='CONTENT';r.storeyScope='2F';mustReject(x,'EIGHT_HOLD_BYPASS');
  }
});
test('missing/duplicate indices, invented keys, false provenance, or invalid 134/8 split reject',()=>{
  for(const [edit,code] of [
    [x=>x.records[1].r5Mapping.targetNodeIndex=0,'NODE_IDENTITY_INVALID'],
    [x=>x.records[2024].objectKey='invented','NEW_SOURCE_IDENTITY_INVALID'],
    [x=>x.records[1].objectKey=x.records[0].objectKey,'OBJECT_KEY_INVALID'],
    [x=>x.activeNodeIndices.pop(),'ACTIVE_NODE_SET_INVALID'],
    [x=>x.records[2024].r5Mapping.status='R4C_IDENTICAL_WORLD_AND_CORE','2024_134_8_MISMATCH'],
    [x=>x.records.find(r=>r.sourceNodeIndex===2835).r5Mapping.sourceOldNodeIndex=999,'SOURCE_PROVENANCE_INVALID']
  ]) {const x=fixture();edit(x);mustReject(x,code);}
});
