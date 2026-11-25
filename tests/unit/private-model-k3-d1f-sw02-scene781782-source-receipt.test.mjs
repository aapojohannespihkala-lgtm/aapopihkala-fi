import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_D1F_SW02_781782_SOURCE as SPEC,
  isK3D1fSw02Scene781782Source as valid,
  k3D1fSw02Scene781782SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3D1fSw02Scene781782SourceReceipt.mjs';

// Synthetic shapes, not source evidence. The optional RAW-byte test is separate.
const normalOld = [11625, 13238, 13245, 13242, 13243, 13244, 13237, 13239, 452];
const serviceOld = normalOld.filter(id => id !== 11625);
const fresh = old => old.map(id => SPEC.replacedRoots[id] ?? id).reverse();
function synthetic() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  for (const v of Object.values(SPEC.views)) {
    const parentRoots = v.plexi ? normalOld : serviceOld;
    scenes[v.parentScene] = { nodes: [...parentRoots] };
    scenes[v.sceneIndex] = {
      name: 'Ylisrinne_C80_R31_BOTH_R300_K3_D1F_SW02_D2F_SW01_02_03_04_' +
        (v.plexi ? 'NORMAL' : 'SERVICE') + '_WORK_TEST_HOST_HOLD__scene' + v.sceneIndex,
      nodes: fresh(parentRoots),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD', current: false, asBuilt: false,
        humanReview: false, productionWebGLVerified: false,
        sourceCombinedOriginalGLBSHA256: SPEC.parentGlbSha256,
        sourceParentScene: v.parentScene,
        sourceK3D2FScene: v.source2fScene,
        role: v.role, newD1FSW02Root: SPEC.newRoot,
        oldD1FSW02RootDisabled: SPEC.sourceRoot,
        inheritedD2FRoots: Object.values(SPEC.activeD2f),
        retainsOldD1FSW01AndSW03: true,
        sourceLinksBoundToOutputSHA: false,
      },
    };
  }
  for (const [stableID, id] of Object.entries(SPEC.activeD2f)) {
    nodes[id] = { extras: {
      stableID, floor: 'D2F', current: false, asBuilt: false, hostHold: true,
    } };
  }
  nodes[SPEC.newRoot] = {
    name: 'K3_D1F_SW02_87MM_EXXACT_STYLE_REFERENCE_WORLDHOST_WORK_TEST_HOST_HOLD',
    children: [13520, 13521],
    extras: {
      stableID: 'D1F-SW-02', floor: 'D1F',
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      sourceRoot: SPEC.sourceRoot, sourceLeafNodes: [13201, 13202],
      activeHostNodeID: SPEC.hostNode, activeHostMeshID: SPEC.hostMesh,
      activeHostPrimitive: 1, activeHostTriangles: [2, 3],
      activeHostPlaneZ_m: -3.194, hostHold: true,
      sourceLinksBoundToOutputSHA: false,
      installedSKUNotVerified: true, physicalHostNotVerified: true,
      electricalCircuitNotVerified: true,
      current: false, asBuilt: false,
      productionWebGLVerified: false, humanReview: false,
    },
  };
  nodes[13520] = { mesh: 5177 };
  nodes[13521] = { mesh: 5178 };
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
const ok = (json, view, sha = SPEC.glbSha256) =>
  valid(json, sha, view.sceneIndex, view.role, 'D1F');

test('K3 D1F SW02 source receipt binds normal/service exact identity only', () => {
  assert.match(SPEC.glbSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.zipSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.parentGlbSha256, /^[0-9a-f]{64}$/);
  const json = synthetic();
  for (const view of Object.values(SPEC.views)) {
    assert.equal(ok(json, view), true);
    assert.deepEqual(receipt(json, SPEC.glbSha256, view.sceneIndex, view.role, 'D1F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, publishAllowed: false,
      viewerRegistered: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false, installedProductVerified: false,
    });
  }
});

test('K3 D1F SW02 refuses old SHA and incorrect roles, root sets or metadata', () => {
  for (const view of Object.values(SPEC.views)) {
    const json = synthetic();
    const check = () => ok(json, view);
    assert.equal(check(), true);
    for (const oldSha of [
      SPEC.parentGlbSha256,
      '1dacc21ec78e9de4a746e362ed06d5495e22ecf6df26113a5fb4244f844661ab',
      'a30dd2dae96dc6c5e5bb8c6cf1930c4a02bfb70fce5c6a2ecb68b5689318ab3',
      '0'.repeat(64),
      'bad',
    ]) assert.equal(ok(json, view, oldSha), false);
    assert.equal(valid(json, SPEC.glbSha256, view.parentScene, view.role, 'D1F'), false);
    assert.equal(valid(json, SPEC.glbSha256, view.sceneIndex, 'INVALID_ROLE', 'D1F'), false);
    assert.equal(valid(json, SPEC.glbSha256, view.sceneIndex, view.role, 'D2F'), false);
    const mutate = (obj, field, value) => {
      const old = obj[field];
      obj[field] = value;
      try { assert.equal(check(), false, String(field)); }
      finally { obj[field] = old; }
    };
    mutate(json, 'scene', 777);
    mutate(json.asset.extras, 'ModelStage', 'CURRENT');
    mutate(json.asset.extras, 'HUMAN_REVIEW', 'APPROVED');
    mutate(json.scenes[view.sceneIndex], 'name', 'forged__scene' + view.sceneIndex);
    mutate(json.scenes[view.sceneIndex].extras, 'sourceCombinedOriginalGLBSHA256', 'bad');
    mutate(json.scenes[view.sceneIndex].extras, 'sourceParentScene', 771);
    mutate(json.scenes[view.sceneIndex].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(json.scenes[view.sceneIndex].extras, 'productionWebGLVerified', true);
    mutate(json.scenes[view.sceneIndex].nodes, 0, 777777);
    mutate(json.scenes[view.parentScene].nodes, 0, 777777);
    mutate(json.nodes[SPEC.newRoot], 'children', [13520]);
    mutate(json.nodes[SPEC.newRoot].extras, 'stableID', 'D2F-SW-02');
    mutate(json.nodes[SPEC.newRoot].extras, 'activeHostTriangles', [14, 15]);
    mutate(json.nodes[SPEC.newRoot].extras, 'sourceOriginalGLBSHA256', 'bad');
    mutate(json.nodes[SPEC.newRoot].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(json.nodes[SPEC.activeD2f['D2F-SW-02']].extras, 'stableID', 'D2F-SW-01');
    mutate(json.nodes[13520], 'mesh', 5176);
    mutate(json.nodes[SPEC.hostNode], 'mesh', 0);
    assert.equal(check(), true);
  }
});

test('missing authenticated bytes never permit publication or viewer registration', () => {
  const view = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, view.sceneIndex, view.role, 'D1F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

const originalGlbPath = process.env.C80_R31_K3_D1F_SW02_SCENE781782_GLB_PATH;
test('optional original RAW GLB byte SHA, scene781/782 and root parity',
  { skip: !originalGlbPath }, () => {
    const bytes = readFileSync(originalGlbPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    assert.equal(json.nodes[SPEC.newRoot]?.extras?.stableID, 'D1F-SW-02');
    for (const [identity, root] of Object.entries(SPEC.activeD2f)) {
      assert.equal(json.nodes[root]?.extras?.stableID, identity);
    }
    for (const v of Object.values(SPEC.views)) {
      assert.equal(ok(json, v, sha), true);
      assert.equal(ok(json, v, SPEC.parentGlbSha256), false);
      assert.equal(receipt(json, sha, v.sceneIndex, v.role, 'D1F').publishAllowed, false);
    }
  });
