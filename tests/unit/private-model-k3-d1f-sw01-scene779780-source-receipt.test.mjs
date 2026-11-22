import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_D1F_SW01_SOURCE as S,
  isK3D1fSw01Scene779780Source as valid,
  k3D1fSw01Scene779780SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3D1fSw01Scene779780SourceReceipt.mjs';

const normalOld = [11625, 13237, 13238, 13239, 13242, 13243, 13245, 13495];
const serviceOld = normalOld.filter(id => id !== 11625);
function synthetic() {
  const scenes = Array.from({ length: S.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: S.nodeCount }, () => ({}));
  for (const v of Object.values(S.views)) {
    const before = v.plexi ? normalOld : serviceOld;
    scenes[v.parentScene] = { nodes: [...before] };
    scenes[v.sceneIndex] = {
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_87MM_PLAN_HOST_CORRECTION_BOTH_' +
        (v.plexi ? 'NORMAL' : 'SERVICE') + '_WORK_TEST_HOST_HOLD__scene' + v.sceneIndex,
      nodes: before.map(id => id === S.oldRoot ? S.newRoot : id),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD',
        sourceGLBSHA256: S.parentGlbSha256,
        sourceRootOFF: S.oldRoot, newRootON: S.newRoot,
        sourceLinksNewSHABound: false, viewerPublished: false,
        current: false, asBuilt: false,
      },
    };
  }
  for (const [identity, index] of Object.entries(S.retainedMarkerRoots))
    nodes[index] = { extras: { stableID: identity, current: false, asBuilt: false } };
  nodes[S.oldRoot] = { extras: { stableID: 'D1F-SW-01' } };
  nodes[S.newRoot] = {
    name: 'K3_D1F_SW01_WHITE_EXXACT_STYLE_87MM_WORLDHOST_WORK_TEST_HOST_HOLD',
    children: [...S.leaves],
    extras: {
      stableID: 'D1F-SW-01', floor: 'D1F',
      sourceOriginalZipDriveID: S.parentZipDriveId,
      sourceOriginalGLBSHA256: S.parentGlbSha256,
      previousSourceRoot: S.oldRoot, previousSourceLeaves: [13199, 13200],
      activeWallNode: S.hostNode, activeWallMesh: S.hostMesh,
      activeWallTriangle: S.hostTriangle, activeWallPlaneX_M: 3.788,
      hostHold: true, workTest: true, physicalWallInstallationNotVerified: true,
      sourceLinksOutputSHABound: false, productionWebGLVerified: false,
      humanReview: false, current: false, asBuilt: false,
    },
  };
  nodes[S.leaves[0]] = { mesh: S.leafMeshes[0] };
  nodes[S.leaves[1]] = { mesh: S.leafMeshes[1] };
  nodes[S.hostNode] = { mesh: S.hostMesh };
  return {
    asset: { version: '2.0', extras: {
      ModelStage: 'WORK_TEST', HUMAN_REVIEW: 'NOT_RUN',
      current: false, asBuilt: false,
    } },
    scene: S.defaultScene, scenes, nodes,
    meshes: Array(S.meshCount).fill(null),
    materials: Array(S.materialCount).fill(null),
    accessors: Array(S.accessorCount).fill(null),
    bufferViews: Array(S.bufferViewCount).fill(null),
  };
}
const check = (j, v, sha = S.glbSha256) =>
  valid(j, sha, v.sceneIndex, v.role, 'D1F');

test('exact authenticated independent 1F SW01 scene779/780 donor is SOURCE_ONLY', () => {
  assert.match(S.glbSha256, /^[a-f0-9]{64}$/);
  assert.match(S.zipSha256, /^[a-f0-9]{64}$/);
  assert.notEqual(S.glbSha256, S.parentGlbSha256);
  const j = synthetic();
  for (const v of Object.values(S.views)) {
    assert.equal(check(j, v), true);
    assert.deepEqual(receipt(j, S.glbSha256, v.sceneIndex, v.role, 'D1F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, viewerRegistered: false, publishAllowed: false,
      productionWebGLVerified: false, humanReview: 'NOT_RUN',
      current: false, asBuilt: false, physicalHostVerified: false,
      installedProductVerified: false,
    });
  }
});

test('2F SW03 same-number scenes, wrong SHA, parent, role and identity fail closed', () => {
  for (const v of Object.values(S.views)) {
    const j = synthetic();
    assert.equal(check(j, v), true);
    for (const sha of [
      'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3e',
      '9a33adeed011d7605cb84cf7897a0fa64206ce9f7405d44542b7bf8a3f984ec8',
      S.parentGlbSha256, '0'.repeat(64), 'bad',
    ]) assert.equal(check(j, v, sha), false);
    assert.equal(valid(j, S.glbSha256, v.sceneIndex, v.role, 'D2F'), false);
    assert.equal(valid(j, S.glbSha256, v.parentScene, v.role, 'D1F'), false);
    assert.equal(valid(j, S.glbSha256, v.sceneIndex, 'D2F_SW03_NORMAL', 'D1F'), false);
    const mutate = (target, key, bad) => {
      const was = target[key]; target[key] = bad;
      try { assert.equal(check(j, v), false, String(key)); }
      finally { target[key] = was; }
    };
    mutate(j, 'scene', 769);
    mutate(j.asset.extras, 'ModelStage', 'CURRENT');
    mutate(j.asset.extras, 'asBuilt', true);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceGLBSHA256', 'legacy');
    mutate(j.scenes[v.sceneIndex].extras, 'sourceRootOFF', 13242);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceLinksNewSHABound', true);
    mutate(j.scenes[v.sceneIndex].extras, 'viewerPublished', true);
    mutate(j.scenes[v.sceneIndex].nodes, 0, 99999);
    mutate(j.scenes[v.parentScene].nodes, 0, 99999);
    mutate(j.nodes[S.newRoot], 'children', [13517]);
    mutate(j.nodes[S.newRoot].extras, 'stableID', 'D2F-SW-03');
    mutate(j.nodes[S.newRoot].extras, 'sourceOriginalGLBSHA256', 'legacy');
    mutate(j.nodes[S.newRoot].extras, 'activeWallTriangle', 18);
    mutate(j.nodes[S.newRoot].extras, 'physicalWallInstallationNotVerified', false);
    mutate(j.nodes[S.retainedMarkerRoots['D1F-SW-02']].extras, 'stableID', 'D1F-SW-01');
    mutate(j.nodes[S.hostNode], 'mesh', 1);
    mutate(j.nodes[S.leaves[0]], 'mesh', 1);
    assert.equal(check(j, v), true);
  }
});

test('bad input never authorizes viewer, publishing, CURRENT or as-built', () => {
  const v = S.views.normal;
  const r = receipt(null, S.glbSha256, v.sceneIndex, v.role, 'D1F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

const originalPath = process.env.C80_R31_K3_D1F_SW01_SCENE779780_GLB_PATH;
test('optional original SHA-authenticated 1F SW01 GLB bytes and N/S root parity',
  { skip: !originalPath }, () => {
    const bytes = readFileSync(originalPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, S.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, S.glbSha256);
    const j = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    for (const v of Object.values(S.views)) {
      assert.equal(check(j, v, sha), true);
      assert.equal(check(j, v,
        'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3e'), false);
    }
  });
