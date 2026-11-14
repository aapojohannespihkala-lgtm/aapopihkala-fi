import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyC80PartIdentity as verify } from '../../src/scripts/privateModelC80CrossShaPartIdentity.mjs';

const DOOR_SHA = '94727a3c93817b753f62a1e54a4fc7adc87f72f5587534701d5bfec7201f2a28';
const COFIT_SHA = 'ed91f792d8f21cc42c4488febd8772276fa3cc42649bd54b560a17823c50e4b8';
function parseAuthenticatedGlb(filename, expectedHash) {
  const bytes = readFileSync(filename);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
}
const donorInfo = (gltf, sceneIndex, nodeIndex, nodePath) => ({
  glbSha256: DOOR_SHA, sceneIndex, sceneName: gltf.scenes[sceneIndex].name,
  nodeIndex, nodeName: gltf.nodes[nodeIndex].name,
  meshIndex: gltf.nodes[nodeIndex].mesh, nodePath,
});
const currentInfo = (gltf, sceneIndex, nodeIndex, nodePath) => ({
  glbSha256: COFIT_SHA, sceneIndex, sceneName: gltf.scenes[sceneIndex].name,
  nodeIndex, nodeName: gltf.nodes[nodeIndex].name,
  meshIndex: gltf.nodes[nodeIndex].mesh, nodePath,
});

test('same numeric index across two SHA sources cannot be mistaken for same part', () => {
  const donor = {scenes:[{name:'donor',nodes:[0]}],nodes:[{children:[1]},{name:'door',mesh:0}],meshes:[{}]};
  const target = {scenes:[{name:'target',nodes:[0]}],nodes:[{children:[1]},{name:'wall',mesh:0}],meshes:[{}]};
  const d={glbSha256:DOOR_SHA,sceneIndex:0,sceneName:'donor',nodeIndex:1,nodeName:'door',meshIndex:0,nodePath:[0,1]};
  const t={...d,glbSha256:COFIT_SHA,sceneName:'target',nodeName:'wall'};
  assert.equal(verify({gltf:donor,verifiedGlbSha256:DOOR_SHA,identity:d}).sourceIdentityVerified,true);
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:d}).reason,'CROSS_SHA_OR_UNVERIFIED_SOURCE');
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:{...d,glbSha256:COFIT_SHA}}).reason,'SCENE_IDENTITY_MISMATCH');
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:t}).sourceIdentityVerified,true);
});

test('explicit successor reindexing requires a NEW exact path and cannot inherit donor node IDs', () => {
  const target={scenes:[{name:'new-scope',nodes:[0]}],nodes:[{children:[2]},{name:'old',mesh:0},{name:'door',mesh:0}],meshes:[{}]};
  const fresh={glbSha256:COFIT_SHA,sceneIndex:0,sceneName:'new-scope',nodeIndex:2,nodeName:'door',meshIndex:0,nodePath:[0,2]};
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:fresh}).sourceIdentityVerified,true);
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:{...fresh,nodeIndex:1}}).reason,'NODE_NAME_OR_MESH_MISMATCH');
  assert.equal(verify({gltf:target,verifiedGlbSha256:COFIT_SHA,identity:{...fresh,nodePath:[0,1]}}).reason,'NODE_NOT_EXACTLY_REACHABLE_FROM_SCENE');
});

test('missing scene, mesh, path and name never imply a physical host or source-card permission', () => {
  const gltf={scenes:[{name:'test',nodes:[0]}],nodes:[{name:'test',mesh:0}],meshes:[{}]};
  const id={glbSha256:COFIT_SHA,sceneIndex:0,sceneName:'test',nodeIndex:0,nodeName:'test',meshIndex:0,nodePath:[0]};
  const ok=verify({gltf,verifiedGlbSha256:COFIT_SHA,identity:id});
  assert.equal(ok.sourceIdentityVerified,true);
  assert.equal(ok.canRelinkSourceCard,false);
  assert.equal(ok.canMutateGLB,false);
  for(const change of [{sceneIndex:1},{meshIndex:8},{nodePath:[8]},{nodeName:''}]) {
    assert.equal(verify({gltf,verifiedGlbSha256:COFIT_SHA,identity:{...id,...change}}).sourceIdentityVerified,false);
  }
});

const donorFile=process.env.YLISRINNE_ROOM3_GLB;
const currentFile=process.env.YLISRINNE_SUCC437_GLB;
test('real source: ROOM3 door leaf, handle and latch differ from SUCC437 walltop, floor and PA2', {skip:!donorFile||!currentFile}, () => {
  const d=parseAuthenticatedGlb(donorFile,DOOR_SHA);
  const c=parseAuthenticatedGlb(currentFile,COFIT_SHA);
  assert.equal(d.scenes.length,412); assert.equal(c.scenes.length,437);
  for (const [idx,path,scene] of [
    [12144,[12171,12170,12169,12168,12144],410],
    [12145,[12171,12170,12169,12168,12145],411],
    [12158,[12171,12170,12169,12168,12158],410]
  ]) {
    const expected=donorInfo(d,scene,idx,path);
    assert.equal(verify({gltf:d,verifiedGlbSha256:DOOR_SHA,identity:expected}).sourceIdentityVerified,true);
    assert.equal(verify({gltf:c,verifiedGlbSha256:COFIT_SHA,identity:expected}).reason,'CROSS_SHA_OR_UNVERIFIED_SOURCE');
    assert.notEqual(d.nodes[idx].name,c.nodes[idx].name);
  }
  for (const [idx,path,scene] of [
    [12144,[12144],429], [12145,[12145],430],
    [12158,[12160,12159,12158],428]
  ]) {
    const expected=currentInfo(c,scene,idx,path);
    assert.equal(verify({gltf:c,verifiedGlbSha256:COFIT_SHA,identity:expected}).sourceIdentityVerified,true);
    const forbidden={...expected,nodeName:d.nodes[idx].name,meshIndex:d.nodes[idx].mesh};
    assert.equal(verify({gltf:c,verifiedGlbSha256:COFIT_SHA,identity:forbidden}).reason,'NODE_NAME_OR_MESH_MISMATCH');
  }
});
