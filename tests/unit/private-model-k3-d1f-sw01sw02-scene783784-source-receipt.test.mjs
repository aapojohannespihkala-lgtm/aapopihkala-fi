import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  K3_D1F_SW01SW02_783784_SOURCE as SPEC,
  isK3D1fSw01Sw02Scene783784Source as valid,
  k3D1fSw01Sw02Scene783784SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3D1fSw01Sw02Scene783784SourceReceipt.mjs';

// Small synthetic fixture, NOT the original model. Private authenticated bytes
// are optionally exercised by the separate test at the end of this file.
const baseNormal = [11625, 13237, 13519, 13239, 13507, 13510, 13513, 13516, 7777];
const baseService = baseNormal.filter(id => id !== 11625);
function synthetic() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  for (const v of Object.values(SPEC.views)) {
    const before = v.plexi ? baseNormal : baseService;
    scenes[v.sourceBaseScene] = { nodes: [...before] };
    scenes[v.sceneIndex] = {
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_SW02_PLUS_D2F_SWITCHES_' +
        v.role + '_WORK_TEST_HOST_HOLD__scene' + v.sceneIndex,
      nodes: before.map(id => id === SPEC.sourceRoot ? SPEC.newRoot : id).reverse(),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD',
        sourceBaseScene: v.sourceBaseScene,
        sourceDonorScene: v.sourceDonorScene,
        sourceBaseGLBSHA256: SPEC.baseGlbSha256,
        sourceDonorGLBSHA256: SPEC.donorGlbSha256,
        sourceDonorGLBRootRemap: [13516, SPEC.newRoot],
        visualRootD1FSW01: SPEC.newRoot,
        visualRootD1FSW02: SPEC.sw02Root,
        originalD1FSW01RootDisabled: SPEC.sourceRoot,
        normalServiceRole: v.role,
        sourceCombinedOriginalGLBSHA256: SPEC.original2fGlbSha256,
        sourceLinksBoundToOutputSHA: false,
        current: false, asBuilt: false,
        humanReview: false, productionWebGLVerified: false,
      },
    };
  }
  nodes[SPEC.newRoot] = {
    name: 'K3_D1F_SW01_WHITE_EXXACT_STYLE_87MM_WORLDHOST_WORK_TEST_HOST_HOLD_COFIT_783784',
    children: [13523, 13524],
    extras: {
      stableID: 'D1F-SW-01', floor: 'D1F',
      previousSourceRoot: SPEC.sourceRoot,
      activeWallNode: 13495, activeWallMesh: 5165,
      activeWallPrimitive: 0, activeWallTriangle: 19,
      hostHold: true,
      cofitSourceDonorZipDriveID: SPEC.donorZipDriveId,
      cofitSourceDonorGLBSHA256: SPEC.donorGlbSha256,
      cofitSourceBaseZipDriveID: SPEC.baseZipDriveId,
      cofitSourceBaseGLBSHA256: SPEC.baseGlbSha256,
      cofitRemapOldRootToNewRoot: [13516, SPEC.newRoot],
      sourceLinksOutputSHABound: false,
      cofitSourceLinksOutputSHA: 'NOT_BOUND',
      current: false, asBuilt: false,
      productionWebGLVerified: false, humanReview: false,
    },
  };
  nodes[13523] = { mesh: 5179 };
  nodes[13524] = { mesh: 5180 };
  nodes[SPEC.sw02Root] = {
    extras: { stableID: 'D1F-SW-02', floor: 'D1F', hostHold: true, current: false, asBuilt: false },
  };
  for (const [identity, index] of Object.entries(SPEC.activeD2f)) {
    nodes[index] = {
      extras: { stableID: identity, floor: 'D2F', hostHold: true, current: false, asBuilt: false },
    };
  }
  return {
    asset: { version: '2.0', extras: {
      ModelStage: 'WORK_TEST', HUMAN_REVIEW: 'NOT_RUN',
      current: false, asBuilt: false,
    } },
    scene: SPEC.defaultScene,
    scenes, nodes,
    meshes: Array(SPEC.meshCount).fill(null),
    materials: Array(SPEC.materialCount).fill(null),
    accessors: Array(SPEC.accessorCount).fill(null),
    bufferViews: Array(SPEC.bufferViewCount).fill(null),
  };
}
const check = (j, v, sha = SPEC.glbSha256) =>
  valid(j, sha, v.sceneIndex, v.role, 'D1F');

test('integrated K3 1F SW01+SW02 accepts only authenticated scene783/784', () => {
  for (const key of ['zipSha256', 'glbSha256', 'baseGlbSha256', 'donorGlbSha256']) {
    assert.match(SPEC[key], /^[a-f0-9]{64}$/);
  }
  const j = synthetic();
  for (const v of Object.values(SPEC.views)) {
    assert.equal(check(j, v), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D1F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, viewerRegistered: false, publishAllowed: false,
      productionWebGLVerified: false, humanReview: 'NOT_RUN',
      current: false, asBuilt: false,
      installedProductVerified: false, physicalHostVerified: false,
      electricalCircuitVerified: false,
    });
  }
});

test('stale donor, wrong source or mutable production flags always fail closed', () => {
  for (const v of Object.values(SPEC.views)) {
    const j = synthetic();
    const ok = () => check(j, v);
    assert.equal(ok(), true);
    for (const sha of [SPEC.baseGlbSha256, SPEC.donorGlbSha256,
      SPEC.original2fGlbSha256, '0'.repeat(64), 'invalid']) {
      assert.equal(check(j, v, sha), false);
    }
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sourceBaseScene, v.role, 'D1F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, 'WRONG', 'D1F'), false);
    const mutation = (obj, field, value) => {
      const before = obj[field];
      obj[field] = value;
      try { assert.equal(ok(), false, field); }
      finally { obj[field] = before; }
    };
    mutation(j, 'scene', 0);
    mutation(j.asset.extras, 'ModelStage', 'CURRENT');
    mutation(j.asset.extras, 'asBuilt', true);
    mutation(j.asset.extras, 'HUMAN_REVIEW', 'APPROVED');
    mutation(j.scenes[v.sceneIndex], 'name', 'wrong__scene' + v.sceneIndex);
    mutation(j.scenes[v.sceneIndex].extras, 'sourceBaseGLBSHA256', 'wrong');
    mutation(j.scenes[v.sceneIndex].extras, 'sourceDonorGLBSHA256', 'wrong');
    mutation(j.scenes[v.sceneIndex].extras, 'sourceDonorGLBRootRemap', [13516, 13516]);
    mutation(j.scenes[v.sceneIndex].extras, 'sourceLinksBoundToOutputSHA', true);
    mutation(j.scenes[v.sceneIndex].extras, 'productionWebGLVerified', true);
    mutation(j.scenes[v.sceneIndex].nodes, 0, 99999);
    mutation(j.scenes[v.sourceBaseScene].nodes, 0, 99999);
    mutation(j.nodes[SPEC.newRoot], 'children', [13523]);
    mutation(j.nodes[SPEC.newRoot].extras, 'stableID', 'D2F-SW-01');
    mutation(j.nodes[SPEC.newRoot].extras, 'cofitSourceDonorGLBSHA256', 'wrong');
    mutation(j.nodes[SPEC.newRoot].extras, 'sourceLinksOutputSHABound', true);
    mutation(j.nodes[SPEC.sw02Root].extras, 'stableID', 'D1F-SW-01');
    mutation(j.nodes[SPEC.activeD2f['D2F-SW-02']].extras, 'stableID', 'D2F-SW-01');
    mutation(j.nodes[13523], 'mesh', 5178);
    assert.equal(ok(), true);
  }
});

test('invalid original never enables publication, source-links or viewer', () => {
  const v = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D1F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.sourceLinksBound, false);
  assert.equal(r.current, false);
});

const originalGlbPath = process.env.C80_R31_K3_D1F_SW01SW02_SCENE783784_GLB_PATH;
test('optional authentic full GLB byte SHA, two scenes and distinct stableIDs',
  { skip: !originalGlbPath }, () => {
    const bytes = readFileSync(originalGlbPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    assert.equal(json.nodes[SPEC.newRoot]?.extras?.stableID, 'D1F-SW-01');
    assert.equal(json.nodes[SPEC.sw02Root]?.extras?.stableID, 'D1F-SW-02');
    for (const [identity, index] of Object.entries(SPEC.activeD2f)) {
      assert.equal(json.nodes[index]?.extras?.stableID, identity);
    }
    for (const v of Object.values(SPEC.views)) {
      assert.equal(check(json, v, sha), true);
      assert.equal(check(json, v, SPEC.baseGlbSha256), false);
      assert.equal(receipt(json, sha, v.sceneIndex, v.role, 'D1F').publishAllowed, false);
    }
  });
