import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  H24_VISUAL_REMOVED_SOURCE as S, h24RootsFnv32 as fnv,
  isH24VisualRemovedSceneSource as valid,
  h24VisualRemovedReceipt as receipt,
} from '../../src/scripts/privateModelKp011H24Scene791792SourceReceipt.mjs';

// The ORIGINAL authenticated ZIP's scene789 source-root array, compressed.
// No private GLB or source media is committed to GitHub.
const roots789 = JSON.parse(inflateSync(Buffer.from('eNotlstxACEMQxvaA7YBQy2Z9N9GpEcuGnZBxvgj+Nmzxhc5Y303z/hOz63vNZeHh+HWcA2G7WEy1FzNrcUVwpU5vz1X+/vMr7fWCg7Gw8ZDi8769l3ANrThGK5gj2/vCkOKvMLAqAxTtkKOyWIyZR9l5+zOTwu9qz4F3lpmNVEylkOfm2OWtrFJMdqgrY8cFRy5OOznSEMZpsGBGdvQBg6UCRY4wefWBht8K7XhcfBqXpbc8/W6054zstGDuXiJeGNMh5YNtt3h72GaDqJzTYPOvxVWgT8PC/M7xxnbd9gyduT0OYudnK/Uznf4iGPYYSXzu3E5x7hexQGIgSIbw8HTkL/1MqqAlJIp4G/IeMmCwD8vZVH91dZ5Y6xd4AQXuMEG35pr7AEGmCDchttwG27DbbgN98A9cA/cA/fAPXAP3AP3wD1wL9wL98K9cC/cC/fCvXDfua65ewwwQAI2CpzgAjfY4AHhBtyAG3ADbsANuAE34AbcgJtwE27CTbgJN+Em3ISbcBNuwS24BbfgFtyCW3ALbsEtuBPuhDvhTrgT7oQ74U64E+6Eu+AuuAvugqsa7JSbql59R6mQhY6XkJob/HG8hO6H5ZOH2yByOB9hrRLS65wzyG6Q1yAflT5VEOuMQFMc5UydsEv6kZYOnYiW81ElcHKu1IOCbehvyY5HxyN9spsWLv+8nwpvGawb2wtV1jLpWZX2cfMpNmlgZO3UOQSSxaVMC47B8mFFPGWJkx/b/bPvtUc24PBJyLSun5KTrnYbunOuG+e6b67bpq9iIFgGPttwDFdQRKU8o5Y6I61AKiQBR9FnqObPQczCuhiWsFD4r2ekkNYKi03J2L3W/qtg31b89O94VIZpSEfNlaS7xBGsRV8t+m3Rb4t++/9Pr256ddOr+9UQ1cbKzRrvoRqgphs1adSk+/2Z4AI3SNhQk0ZNGjVp1KRRk0ZNGjVp1KRRk0YD6ZmkZ5KeSXom6RndW5PxpJ5B97AODE6q2nEQUuevCyYr3VEOEEhHcPu6XYxvfKntAbp0nSwjtb3Reaut8ID2Kq22Qu+77L+Q7rCCBAoS9HPQw/V83vTm5j4IbvxJf3U+TND+v5Jc7tla+WrLlom8/tjywebxjrXwnBqI8xDL1worfOMECzQrmt47b02jDBfkpcI1vbim2VGISrgGdOvZh3vJGuuHtSmDDA4rbA58S27xcD3oFbBB1vgWEV5UiPUX6WDN9OmEXhPkIshFkIv4zwX5YsekWtLZF5K7yX/qJ3mcJa+qQrUKHatgrycAk92ffNHPs3gFFBe8s1xvd1Rb5rnB+0WAriFWZD+5P1RuZB+bi3fYPO+lx5uGs69BnAezlyw8lR7EfPFeZD33fXLr1DvdvnjFLrn471uhrJ3a1zkVog/kouxb1ZtFN/xWcnMk+HxmzItnXmZ9W9caVKOrSOhZq6zHzZhZ38FCZvP8/gHMODHy', 'base64')).toString('utf8'));
const roots790 = roots789.filter(n => n !== S.plexi);
const parents = { 789: roots789, 790: roots790 };
function fixture(sceneIndex) {
  const v = Object.values(S.views).find(x => x.index === sceneIndex);
  const source = parents[v.parent];
  const scenes = Array.from({ length:S.scenes },()=>({nodes:[]}));
  scenes[v.parent] = { nodes:[...source], extras:{role:v.role} };
  scenes[sceneIndex] = {
    name:v.name, nodes:source.filter(n=>n!==S.removedDoorRoot),
    extras:{
      stage:'WORK_TEST_HOST_HOLD', nonCurrent:true,
      sourceZipDriveID:S.originalZipDriveId, sourceZipSHA256:S.originalZipSha256,
      sourceGLBSHA256:S.originalGlbSha256, sourceSceneIndex:v.parent,
      removedVisualOnlyRoot:S.removedDoorRoot, removedLeaves:[S.doorLeaf,S.knobLeaf],
      retainedHatchFrameNode:S.frame,
      noNewGeometry:true, noAssumedSwingHingeOrRemovalPath:true,
      physicalServiceAccessVerified:false, sourceLinksOutputSHA:'NOT_BOUND',
      productionWebGLVerified:false, humanReview:false,
    }
  };
  const nodes = Array.from({length:S.nodes},()=>({}));
  nodes[S.removedDoorRoot] = { children:[S.doorLeaf,S.knobLeaf],
    extras:{ownerPhotoDriveId:'16vATBxFzEd1270VKv4wvxCRHYu3O8O5l',
      closedVisualOnly:true, doorSwingAndRemovalNotTested:true,
      realHostAndServiceClearanceHold:true} };
  nodes[S.doorLeaf]={mesh:4775};
  nodes[S.knobLeaf]={mesh:4776};
  nodes[S.frame]={mesh:S.frameMesh,
    extras:{hostStatus:'HOST_HOLD',physicalLocationMeasured:false}};
  nodes[S.wcRoot]={children:[S.wcBowl]};
  nodes[S.wcBowl]={mesh:S.wcBowlMesh};
  return {
    asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,
      HUMAN_REVIEW:'NOT_RUN',canonical:false}},
    scene:S.defaultScene,scenes,nodes,meshes:Array(S.meshes),
    materials:Array(S.materials),accessors:Array(S.accessors),
    bufferViews:Array(S.bufferViews),
  };
}
const good=(j,i)=>valid(j,S.glbSha256,i,i===791?'NORMAL':'SERVICE','D1F');

test('original roots and source-exact role-pair with visual-only single door removal',()=>{
  for(const v of Object.values(S.views)){
    const j=fixture(v.index);
    assert.equal(j.scenes[v.parent].nodes.length,v.parentRoots);
    assert.equal(j.scenes[v.index].nodes.length,v.roots);
    assert.equal(fnv(j.scenes[v.parent].nodes),v.parentFnv);
    assert.equal(fnv(j.scenes[v.index].nodes),v.fnv);
    assert.equal(good(j,v.index),true);
    assert.deepEqual(receipt(j,S.glbSha256,v.index,v.role,'D1F'),{
      exactSource:true,stage:'WORK_TEST_HOST_HOLD',
      sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
      productionWebGLVerified:false,humanReview:'NOT_RUN',
      physicalServiceAccessVerified:false});
  }
  assert.deepEqual(roots789.filter(n=>n!==12632),fixture(791).scenes[791].nodes);
  assert.equal(roots789.filter(n=>n===12632).length,1);
});
test('rejects wrong original SHA, floor, scene and normal/service role',()=>{
  const j=fixture(791);
  for(const sha of [S.originalGlbSha256,'0'.repeat(64),undefined])
    assert.equal(valid(j,sha,791,'NORMAL','D1F'),false);
  assert.equal(valid(j,S.glbSha256,791,'SERVICE','D1F'),false);
  assert.equal(valid(j,S.glbSha256,791,'NORMAL','D2F'),false);
  assert.equal(valid(j,S.glbSha256,792,'SERVICE','D1F'),false);
});
test('rejects accidental removal of frame, WC, switches, changed order and plexi',()=>{
  for(const tamper of [
    j=>j.scenes[791].nodes.splice(j.scenes[791].nodes.indexOf(S.frame),1),
    j=>j.scenes[791].nodes.splice(j.scenes[791].nodes.indexOf(S.wcRoot),1),
    j=>j.scenes[791].nodes.splice(j.scenes[791].nodes.indexOf(S.switches[0]),1),
    j=>j.scenes[791].nodes.reverse(),
    j=>j.scenes[791].nodes.push(S.removedDoorRoot),
    j=>j.scenes[791].nodes.splice(j.scenes[791].nodes.indexOf(S.plexi),1),
    j=>j.scenes[789].nodes.pop(),
  ]){const j=fixture(791);tamper(j);assert.equal(good(j,791),false);}
  const j=fixture(792);j.scenes[792].nodes.push(S.plexi);
  assert.equal(good(j,792),false);
});
test('rejects source metadata, physical claims and reintroduced door',()=>{
  for(const tamper of [
    j=>j.scenes[791].extras.sourceGLBSHA256='bad',
    j=>j.scenes[791].extras.sourceSceneIndex=790,
    j=>j.scenes[791].extras.sourceLinksOutputSHA=S.glbSha256,
    j=>j.scenes[791].extras.physicalServiceAccessVerified=true,
    j=>j.scenes[791].extras.noAssumedSwingHingeOrRemovalPath=false,
    j=>j.scenes[791].extras.productionWebGLVerified=true,
    j=>j.asset.extras.current=true,
    j=>j.nodes[S.frame].mesh=0,
    j=>j.nodes[S.wcBowl].mesh=0,
    j=>j.nodes[S.removedDoorRoot].children=[S.doorLeaf],
  ]){const j=fixture(791);tamper(j);assert.equal(good(j,791),false);}
  assert.equal(receipt(fixture(791),'invalid',791,'NORMAL','D1F').publishAllowed,false);
});
test('invalid roots rejected',()=>{for(const r of [null,[1,-2],[1,1.5],[Number.MAX_SAFE_INTEGER+1]])assert.equal(fnv(r),null);});

const realPath=process.env.H24_SCENE791792_ORIGINAL_GLB;
test('optional authenticated private original GLB, never used as a GitHub fixture',
  {skip:!realPath},()=>{
    const b=readFileSync(realPath);
    assert.equal(b.length,S.glbBytes);
    assert.equal(createHash('sha256').update(b).digest('hex'),S.glbSha256);
    assert.equal(b.toString('ascii',0,4),'glTF');
    const length=b.readUInt32LE(12),type=b.toString('ascii',16,20);
    assert.equal(type,'JSON');
    const json=JSON.parse(b.subarray(20,20+length).toString('utf8'));
    for(const v of Object.values(S.views))
      assert.equal(valid(json,S.glbSha256,v.index,v.role,'D1F'),true);
  });
