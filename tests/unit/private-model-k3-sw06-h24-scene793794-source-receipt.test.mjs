import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_SW06_H24_SCENE793794 as S,
  k3SW06H24RootsFnv32 as fnv,
  isK3SW06H24Scene793794Source as valid,
  k3SW06H24SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3SW06H24Scene793794SourceReceipt.mjs';

// Exact, compact source root indices from the authenticated original scene791.
// The service 792 array is scene791 minus n11625, verified from the same GLB.
// These are data-only indices: no private GLB, textures or media in GitHub.
const parentNormal = JSON.parse(inflateSync(Buffer.from('eNotlstxACEMQxvaA7YBQy2Z9N9GpEcuGnZBxvgj+Nmzxhc5Y303z/hOz63vNZeHh+HWcA2G7WEy1FzNrcUVwpU5vz1X+/vMr7fWCg7Gw8ZDi8769l3ANrThGK5gj2/vCkOKvMLAqAxTtkKOyWIyZR9l5+zOTwu9qz4F3lpmNVEylkOfm2OWtrFJMdqgrY8cFRy5OOznSEMZpsGBGdvQBg6UCRY4wefWBht8K7XhcfBqXpbc8/W6054zstGDuXiJeGNMh5YNtt3h72GaDqJzTYPOvxVWgT8PC/M7xxnbd9gyduT0OYudnK/Uznf4iGPYYSXzu3E5x7hexQGIgSIbw8HTkL/1MqqAlJIp4G/IeMmCwD8vZVH91dZ5Y6xd4AQXuMEG35pr7AEGmCDchttwG27DbbgN98A9cA/cA/fAPXAP3AP3wD1wL9wL98K9cC/cC/fCvXDfua65ewwwQAI2CpzgAjfY4AHhBtyAG3ADbsANuAE34AbcgJtwE27CTbgJN+Em3ISbcBNuwS24BbfgFtyCW3ALbsEtuBPuhDvhTrgT7oQ74U64E+6Eu+AuuAvugqsa7JSbql59R6mQhY6XkJob/HG8hO6H5ZOH2yByOB9hrRLS65wzyG6Q1yAflT5VEOuMQFMc5UydsEv6kZYOnYiW81ElcHKu1IOCbehvyY5HxyN9spsWLv+8nwpvGawb2wtV1jLpWZX2cfMpNmlgZO3UOQSSxaVMC47B8mFFPGWJkx/b/bPvtUc24PBJyLSun5KTrnYbunOuG+e6b67bpq9iIFgGPttwDFdQRKU8o5Y6I61AKiQBR9FnqObPQczCuhiWsFD4r2ekkNYKi03J2L3W/qtg31b89O94VIZpSEfNlaS7xBGsRV8t+m3Rb4t++/9Pr256ddOr+9UQ1cbKzRrvoRqgphs1adSk+/2Z4AI3SNhQk0ZNGjVp1KRRk0ZNGjVp1KRRk0YD6ZmkZ5KeSXom6RndW5PxpJ5B97AODE6q2nEQUuevCyYr3VEOEEhHcPu6XYxvfKntAbp0nSwjtb3Reaut8ID2Kq22Qu+77L+Q7rCCBAoS9HPQw/V83vTm5j4IbvxJf3U+TND+v5Jc7tla+WrLlom8/tjywebxjrXwnBqI8xDL1worfOMECzQrmt47b02jDBfkpcI1vbim2VGISrgGdOvZh3vJGuuHtSmDDA4rbA58S27xcD3oFbBB1vgWEV5UiPUX6WDN9OmEXhPkIshFkIv4zwX5YsekWtLZF5K7yX/qJ3mcJa+qQrUKHatgrycAk92ffNHPs3gFFBe8s1xvd1Rb5rnB+0WAriFWZD+5P1RuZB+bi3fYPO+lx5uGs69BnAezlyw8lR7EfPFeZD33fb1z7Ys/2E/fB8Iyun8L/ReiDGSh7FXVm0Ux/EpyWyT4vGXMW2deZn1P1xrUoetH6Fnrq8fNmFnfvkJm8/z+AaYuMMg=', 'base64')).toString('utf8'));
const parentService = parentNormal.filter(n => n !== S.plexi);
function fixture(index) {
  const v = Object.values(S.views).find(x => x.index === index);
  const roots = v.plexi ? parentNormal : parentService;
  const scenes = Array.from({length:S.sceneCount},()=>({nodes:[]}));
  scenes[v.parent] = {name:v.parentName,nodes:[...roots],
    extras:{stage:'WORK_TEST_HOST_HOLD'}};
  scenes[index] = {
    name:v.name, nodes:roots.map(n => n === S.oldMarker ? S.newMarker : n),
    extras: {
      stage:'WORK_TEST_HOST_HOLD',nonCurrent:true,
      sourceZipDriveID:S.ancestorZipDriveId,
      sourceZipSHA256:S.ancestorZipSha256,
      sourceGLBSHA256:S.ancestorGlbSha256,
      sourceSceneIndex:v.plexi ? 789 : 790,
      removedVisualOnlyRoot:S.hatchDoor,removedLeaves:[12630,12631],
      retainedHatchFrameNode:S.hatchFrame,
      noNewGeometry:true,noAssumedSwingHingeOrRemovalPath:true,
      physicalServiceAccessVerified:false,sourceLinksOutputSHA:'NOT_BOUND',
      productionWebGLVerified:false,humanReview:false,
      sourceH24ZipDriveId:S.h24ZipDriveId,
      sourceH24GLBSHA256:S.h24GlbSha256,
      sourceParentSceneIndex:v.parent,
      sw06SemanticMarkerPatch:{
        sourceParentSceneIndex:v.parent,
        originalMarkerNode:S.oldMarker,newMarkerNode:S.newMarker,
        historicalSourceSwitchNodeInactive:S.historicalInactiveSwitch,
        wrongDrainNodeInOldScene:S.wrongDrain,
        activeVisualSwitchNode:S.activeSwitch,
        sourceReceiptPR:'https://github.com/aapojohannespihkala-lgtm/aapopihkala-fi/pull/2172',
        physicalHostVerified:false,electricalCircuitVerified:false,
        sourceLinksOutputSHABound:false,
      },
    },
  };
  const nodes = Array.from({length:S.nodeCount},()=>({}));
  const markerExtras = {
    stableID:'D1F-SW-06',existingSourceSwitchNode:S.historicalInactiveSwitch,
    remapSourceGLBNodeId:S.wrongDrain,modelAlreadyContainsGeometry:true,
    physicalWallHost:'HOLD_UNVERIFIED',electricalCircuit:'NOT_VERIFIED',
    current:false,asBuilt:false,stage:'OWNER_2026_SOURCE_WORK_TEST_HOST_HOLD',
  };
  nodes[S.oldMarker] = {name:'D1F-SW-06_MARKER',extras:markerExtras};
  nodes[S.newMarker] = {name:'D1F-SW-06_MARKER',extras:{
    ...markerExtras,remapSourceGLBNodeId:S.activeSwitch}};
  nodes[S.activeSwitch] = {mesh:2447};
  nodes[S.hatchFrame] = {mesh:S.hatchFrameMesh,
    extras:{hostStatus:'HOST_HOLD',physicalLocationMeasured:false}};
  nodes[S.wcRoot]={children:[S.wcBowl]};
  nodes[S.wcBowl]={mesh:S.wcBowlMesh};
  return {
    asset:{extras:{ModelStage:'WORK_TEST',canonical:false,
      current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:S.defaultScene,scenes,nodes,
    meshes:Array(S.meshCount),materials:Array(S.materialCount),
    accessors:Array(S.accessorCount),bufferViews:Array(S.bufferViewCount),
  };
}
const good=(json,index)=>valid(json,S.glbSha256,index,index===793?'NORMAL':'SERVICE','D1F');

test('source-root parity, semantic replacement and both NORMAL/SERVICE views',()=>{
  assert.equal(parentNormal.length,499);
  assert.equal(fnv(parentNormal),S.views.normal.parentFnv);
  assert.equal(fnv(parentService),S.views.service.parentFnv);
  for(const v of Object.values(S.views)){
    const j=fixture(v.index);
    assert.equal(fnv(j.scenes[v.index].nodes),v.fnv);
    assert.equal(good(j,v.index),true);
    assert.deepEqual(receipt(j,S.glbSha256,v.index,v.role,'D1F'),{
      exactSource:true,stage:'WORK_TEST_HOST_HOLD',
      sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
      physicalHostVerified:false,electricalCircuitVerified:false,
      physicalServiceAccessVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN'});
    const before=j.scenes[v.parent].nodes,after=j.scenes[v.index].nodes;
    assert.deepEqual(after,before.map(n=>n===S.oldMarker?S.newMarker:n));
    assert.equal(before.filter(n=>n===S.oldMarker).length,1);
    assert.equal(after.filter(n=>n===S.newMarker).length,1);
    assert.equal(after.includes(S.hatchDoor),false);
    assert.equal(after.includes(S.plexi),v.plexi);
  }
});
test('reject wrong SHA, scene, role, floor, count, identity and future stage',()=>{
  const j=fixture(793);
  for(const sha of ['0'.repeat(64),S.h24GlbSha256,undefined])
    assert.equal(valid(j,sha,793,'NORMAL','D1F'),false);
  assert.equal(valid(j,S.glbSha256,793,'SERVICE','D1F'),false);
  assert.equal(valid(j,S.glbSha256,793,'NORMAL','D2F'),false);
  assert.equal(valid(j,S.glbSha256,794,'SERVICE','D1F'),false);
  for(const mutate of [
    x=>x.scene=793,x=>x.asset.extras.current=true,
    x=>x.asset.extras.asBuilt=true,x=>x.asset.extras.HUMAN_REVIEW='PASS',
    x=>x.scenes.length=794,x=>x.nodes.length=13534,
    x=>x.meshes.length++,x=>x.scenes[793].name='wrong',
  ]){const x=fixture(793);mutate(x);assert.equal(good(x,793),false);}
});
test('reject broken root/order, H24 door, frame, WC and service plexi',()=>{
  for(const mutate of [
    x=>x.scenes[793].nodes.reverse(),
    x=>x.scenes[793].nodes.push(S.hatchDoor),
    x=>x.scenes[793].nodes[0]=S.oldMarker,
    x=>x.scenes[793].nodes.splice(x.scenes[793].nodes.indexOf(S.hatchFrame),1),
    x=>x.scenes[793].nodes.splice(x.scenes[793].nodes.indexOf(S.wcRoot),1),
    x=>x.scenes[791].nodes.reverse(),
    x=>x.nodes[S.wcBowl].mesh=0,
    x=>x.nodes[S.hatchFrame].mesh=0,
    x=>x.nodes[S.activeSwitch].mesh=0,
  ]){const x=fixture(793);mutate(x);assert.equal(good(x,793),false);}
  const j=fixture(794);j.scenes[794].nodes.push(S.plexi);
  assert.equal(good(j,794),false);
});
test('reject reintroduced drain, unbound links becoming authoritative and physical approval',()=>{
  for(const mutate of [
    x=>x.nodes[S.newMarker].extras.remapSourceGLBNodeId=S.wrongDrain,
    x=>x.nodes[S.oldMarker].extras.remapSourceGLBNodeId=S.activeSwitch,
    x=>x.nodes[S.newMarker].extras.stableID='D1F-SW-05',
    x=>x.nodes[S.newMarker].mesh=0,
    x=>x.scenes[793].extras.sw06SemanticMarkerPatch.activeVisualSwitchNode=S.wrongDrain,
    x=>x.scenes[793].extras.sw06SemanticMarkerPatch.sourceParentSceneIndex=792,
    x=>x.scenes[793].extras.sw06SemanticMarkerPatch.electricalCircuitVerified=true,
    x=>x.scenes[793].extras.sourceH24GLBSHA256='wrong',
    x=>x.scenes[793].extras.sourceLinksOutputSHA=S.glbSha256,
    x=>x.scenes[793].extras.physicalServiceAccessVerified=true,
    x=>x.nodes[S.hatchFrame].extras.physicalLocationMeasured=true,
  ]){const x=fixture(793);mutate(x);assert.equal(good(x,793),false);}
  assert.equal(receipt(fixture(793),'bad',793,'NORMAL','D1F').publishAllowed,false);
});
test('root fingerprint rejects malformed values',()=>{
  for(const a of [null,[-1,2],[1,1.5],[Number.MAX_SAFE_INTEGER+1]])
    assert.equal(fnv(a),null);
});
const real=process.env.K3_SW06_H24_SCENE793794_ORIGINAL_GLB;
test('optional raw original GLB SHA and scene validation', {skip:!real},()=>{
  const bytes=readFileSync(real);
  assert.equal(bytes.length,S.glbBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),S.glbSha256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const len=bytes.readUInt32LE(12);
  const json=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
  for(const v of Object.values(S.views))
    assert.equal(valid(json,S.glbSha256,v.index,v.role,'D1F'),true);
});
