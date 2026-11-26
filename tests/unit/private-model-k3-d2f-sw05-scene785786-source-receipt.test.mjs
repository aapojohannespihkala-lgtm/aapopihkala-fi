import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_D2F_SW05_785786_SOURCE as SPEC,
  isK3D2fSw05Scene785786Source as valid,
  k3D2fSw05Scene785786SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3D2fSw05Scene785786SourceReceipt.mjs';

// Synthetic regression fixture only. The optional test below uses actual RAW GLB.
function fixture() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  for (const [stableID, id] of Object.entries(SPEC.activeEarlier)) {
    nodes[id] = { extras: { stableID, current: false, asBuilt: false } };
  }
  for (const view of Object.values(SPEC.views)) {
    const original = [
      13246, 13239, ...Object.values(SPEC.activeEarlier), 452,
      ...(view.plexi ? [11625] : []),
    ];
    scenes[view.parentScene] = { nodes: original };
    scenes[view.sceneIndex] = {
      name: 'Ylisrinne_C80_R31_K3_D2F_SW05_WHITE_87MM_' +
        view.role + '_WORK_TEST_HOST_HOLD__scene' + view.sceneIndex,
      nodes: original.map(id => id === SPEC.sourceRoot ? SPEC.newRoot : id),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD', current: false, asBuilt: false,
        humanReview: false, productionWebGLVerified: false,
        sourceBaseScene: view.parentScene,
        sourceBaseGLBSHA256: SPEC.parentGlbSha256,
        sourceParentScene: view.earlierRootScene,
        sourceLinksBoundToOutputSHA: false,
        role: view.role, normalServiceRole: view.role,
        oldD2FSW05RootDisabled: SPEC.sourceRoot,
        newD2FSW05Root: SPEC.newRoot,
      },
    };
  }
  nodes[SPEC.newRoot] = {
    name: 'K3_D2F_SW05_WHITE_87x87MM_WORLD_WALL_REFERENCE_WORK_TEST_HOST_HOLD',
    children: [...SPEC.children],
    extras: {
      stableID: 'D2F-SW-05', floor: 'D2F', stage: 'WORK_TEST_HOST_HOLD',
      current: false, asBuilt: false,
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      sourceOriginalRoot: SPEC.sourceRoot,
      sourceWallActiveNode: SPEC.hostNode, sourceWallMesh: SPEC.hostMesh,
      sourceWallPrimitive: 3, sourceWallTriangleIndices: [0, 1],
      targetGLTFWorld_XYZ_WORK_TEST: [2.37, 3.85, -7.335],
      sourceLinksOutputSHA: 'NOT_BOUND',
      physicalXYZ: 'NOT_VERIFIED',
      physicalInstallationNotVerified: true, humanReview: 'NOT_RUN',
    },
  };
  nodes[SPEC.children[0]] = { mesh: SPEC.meshes[0] };
  nodes[SPEC.children[1]] = { mesh: SPEC.meshes[1] };
  nodes[SPEC.hostNode] = { mesh: SPEC.hostMesh };
  return {
    asset: { version: '2.0', extras: {
      ModelStage: 'WORK_TEST', current: false, asBuilt: false,
      HUMAN_REVIEW: 'NOT_RUN',
    } },
    scene: SPEC.defaultScene, scenes, nodes,
    meshes: Array(SPEC.meshCount).fill(null),
    materials: Array(SPEC.materialCount).fill(null),
    accessors: Array(SPEC.accessorCount).fill(null),
    bufferViews: Array(SPEC.bufferViewCount).fill(null),
  };
}
const check = (j, v, sha = SPEC.glbSha256) =>
  valid(j, sha, v.sceneIndex, v.role, 'D2F');

test('source-exact D2F SW05 scene785/786 receipt is fail-closed and never a publish gate', () => {
  for (const key of ['zipSha256', 'glbSha256', 'parentGlbSha256']) {
    assert.match(SPEC[key], /^[a-f0-9]{64}$/);
  }
  const j = fixture();
  for (const view of Object.values(SPEC.views)) {
    assert.equal(check(j, view), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, view.sceneIndex, view.role, 'D2F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, publishAllowed: false,
      viewerRegistered: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false, installedProductVerified: false,
    });
  }
});

test('forged SHA, parent, scene, root, host and current claims are rejected', () => {
  const j = fixture();
  for (const v of Object.values(SPEC.views)) {
    const badSha = [
      SPEC.parentGlbSha256,
      'e16bb80f8bee2eeeeecdf1d3de1e5c2f392b224ea77fb164e208ea37dc4d3a8f',
      '0'.repeat(64), 'xyz',
    ];
    for (const sha of badSha) assert.equal(check(j, v, sha), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D1F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.parentScene, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, 'SERVICE' === v.role ? 'NORMAL' : 'SERVICE', 'D2F'), false);
    const mutate = (object, key, next) => {
      const prior = object[key];
      object[key] = next;
      try { assert.equal(check(j, v), false, String(key)); }
      finally { object[key] = prior; }
    };
    mutate(j, 'scene', 787);
    mutate(j.asset.extras, 'ModelStage', 'CURRENT');
    mutate(j.asset.extras, 'HUMAN_REVIEW', 'APPROVED');
    mutate(j.scenes[v.sceneIndex], 'name', 'forged__scene' + v.sceneIndex);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceBaseGLBSHA256', 'bad');
    mutate(j.scenes[v.sceneIndex].extras, 'sourceBaseScene', 781);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(j.scenes[v.sceneIndex].extras, 'productionWebGLVerified', true);
    mutate(j.scenes[v.sceneIndex].nodes, 0, 123456);
    mutate(j.scenes[v.parentScene].nodes, 0, 123456);
    mutate(j.nodes[SPEC.newRoot], 'children', [SPEC.children[0]]);
    mutate(j.nodes[SPEC.newRoot].extras, 'stableID', 'D2F-SW-04');
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceOriginalGLBSHA256', 'bad');
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceWallTriangleIndices', [2, 3]);
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceLinksOutputSHA', 'BOUND');
    mutate(j.nodes[SPEC.newRoot].extras, 'physicalInstallationNotVerified', false);
    mutate(j.nodes[SPEC.hostNode], 'mesh', 1);
    mutate(j.nodes[SPEC.children[0]], 'mesh', 1);
    mutate(j.nodes[SPEC.activeEarlier['D2F-SW-02']].extras, 'stableID', 'D2F-SW-01');
    assert.equal(check(j, v), true);
  }
});

test('unverified content never grants viewer, publication or physical approval', () => {
  const v = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F');
  assert.equal(r.exactSource, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

// RUN LOCALLY ONLY with authenticated bytes, CI may skip when Drive GLB absent.
const originalGlbPath = process.env.C80_R31_K3_D2F_SW05_SCENE785786_GLB_PATH;
test('optional original RAW GLB bytes, SHA and both active scenes',
  { skip: !originalGlbPath }, () => {
    const bytes = readFileSync(originalGlbPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.length, SPEC.glbBytes);
    assert.equal(bytes.readUInt32LE(8), SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    assert.equal(json.nodes[SPEC.newRoot]?.extras?.stableID, 'D2F-SW-05');
    for (const v of Object.values(SPEC.views)) {
      assert.equal(check(json, v, sha), true);
      assert.equal(check(json, v, SPEC.parentGlbSha256), false);
      assert.equal(receipt(json, sha, v.sceneIndex, v.role, 'D2F').publishAllowed, false);
    }
  });
