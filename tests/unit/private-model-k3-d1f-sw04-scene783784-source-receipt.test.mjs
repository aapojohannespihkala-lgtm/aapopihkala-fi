import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { K3_D1F_SW04_SOURCE as SPEC, k3D1fSw04RootsFnv32 as fnv,
  isK3D1fSw04Scene783784Source as valid,
  k3D1fSw04Scene783784SourceReceipt as receipt }
  from '../../src/scripts/privateModelK3D1fSw04Scene783784SourceReceipt.mjs';

// Authenticated GLB's real 781 roots, compressed; service = remove 11625.
const normalParents = JSON.parse(inflateSync(Buffer.from('eNotlstxACEMQxvaA7YBQy2Z9N9GpEcuGpa1DPgj+Nmzxhc5Y303z/hOz63vNZeHh+HWcA2G7WEy1L+aW8YVwpU5vz1X+/vMr7dsBQfnYecho7O+fRewDW04hivY49u7wpAirzAwKsOUr9DG5DH55T3Kz9mdnwy9qj4FXlpu9aPkLIc+N8csLWOXYrRBSx9tVHC0xeF9jjSUYRocmLENbeBAmWCBE3zb2mCDz1ILHgev5sXknq/Xnd45Izs9uIuXiDfGdchssOwOfw/TdBCdaxp0/q2wCvx5MMzvHGds32HP+NGmz1ms5HylVr7DRxzDG1YyvxuXc4xrKw5ADBTZGA6ehszWy6gCUkqmgNmQ85IHgScvZVH91dZ5Y6xd4AQXuMEGn8019gADTBBuw224DbfhNtyGe+AeuAfugXvgHrgH7oF74B64F+6Fe+FeuBfuhXvhXrjvXNfcPQYYIAEbBU5wgRts8IBwA27ADbgBN+AG3IAbcANuwE24CTfhJtyEm3ATbsJNuAm34BbcgltwC27BLbgFt+AW3Al3wp1wJ9wJd8KdcCfcCXfCXXAX3AV3wVUNdmqbql59R6mQhY6XkJobzDheQvfD8snDbRA5nI+wVgnpdc4ZZDfIa5CPSp8qiHVGoCmOcqZO2CX9SEuHTkTL+agSOG2u1IOCbehvyY9HxyN9spoMlyfvp8JbBuvGtqHKWi79V6V93HyKTRoYWTt1DoFkcSnTgmOwfFgRT1nitI/t/tn3ekd24PBJyGTXT8lJV7sN3TnXjXPdN9dt01cxECwDn204hisoolL+o5Y6I61AKiQBR9FnqObPQczCuhiWsFD4r/9IIa0VFpuSs3ut/VfBvq34ae54VIZpSEfNlaS7xBGsRV8t+m3Rb4t++5+nVze9uunV/WqIasNyY+M1VAPUdKMmjZp0v5kJLnCDhA01adSkUZNGTRo1adSkUZNGTRo1aTSQnkl6JumZpGeSntG9NRlP6hl0D+vA4KSqHQchdf66YGLpjnKAQDqC29ftYnzjS20P0KXrZBmp7Y3OW22FB/Su0mor9LrL+xfSHVaQQEGCfg56uN6eN725uQ+CG3/SX50PE/T+X0mueLvCnggQec3Y28HnSXqTxwc1EOchnq8VVvjGCRZoVjS9d55NowwX5KXCNb24phfX9EpUwjWgW8+nu5esYT+sTRnsdlhhc7y9cYuH60GvgA1i41tEeFEh7C/Sgc306YS2CXIR5CLIRfzngnyxIjHRW6pAcjeZp35efJJXVaFahY5VsNYTgMnqT77o51m8AooL3lmutzqqLffc4P0iQNcQK7Kf3B8qN7KPz8U7bJ730uNNw9nXIM6Dv5csPJUexHzxXsSe+z65deqdbl92xSq5mPetUNZOreucCtEHclHeW9X7i274reTmSPDtmTEvnnn569u6lmtJmKD/WmU9bsb89R0s3L9/uZMwyw==', 'base64')).toString('utf8'));
const serviceParents = normalParents.filter(i => i !== 11625);
const parents = { 781: normalParents, 782: serviceParents };
function fixture(sceneIndex) {
  const v = Object.values(SPEC.views).find(x => x.sceneIndex === sceneIndex);
  assert.ok(v);
  const old = parents[v.parentScene];
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  scenes[v.parentScene] = { nodes: [...old] };
  scenes[sceneIndex] = {
    name: v.sceneName,
    nodes: [...old, SPEC.newRoot],
    extras: {
      stage: 'WORK_TEST_HOST_HOLD', sourceParentScene: v.parentScene,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256, newD1FSW04Root: SPEC.newRoot,
      ownerMarkerNode: SPEC.oldMarker, activeHostNodeID: SPEC.hostNode,
      activeHostPrimitive: SPEC.hostPrimitive, role: v.role,
      current: false, asBuilt: false, humanReview: false,
      productionWebGLVerified: false, sourceLinksBoundToOutputSHA: false,
    },
  };
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  nodes[SPEC.oldMarker] = { extras: { stableID: 'D1F-SW-04' } };
  nodes[SPEC.hostNode] = { mesh: SPEC.hostMesh };
  nodes[13523] = { mesh: 5179 };
  nodes[13524] = { mesh: 5180 };
  nodes[SPEC.newRoot] = {
    name: 'K3_D1F_SW04_87MM_EXXACT_STYLE_REFERENCE_ACTIVE_WALL_WORK_TEST_HOST_HOLD',
    children: [13523, 13524],
    extras: {
      stableID: 'D1F-SW-04', floor: 'D1F',
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalZipSHA256: SPEC.parentZipSha256,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      sourceOwnerMarkerNode: SPEC.oldMarker, sourceOwnerMarkerPixel: [328, 921],
      historicalWallHostNodeNOTACTIVE: 7221,
      activeHostNodeID: SPEC.hostNode, activeHostMeshID: SPEC.hostMesh,
      activeHostPrimitive: SPEC.hostPrimitive, activeHostTriangle: SPEC.hostTriangle,
      activeHostPlaneZ_m: -5.032, hostNormalWorld: [0, 0, 1],
      proxyCenterXYZ_m: [5.15, 1.175, -5.032],
      proxyFrameOuter_m: 0.087, proxyVisibleRocker_m: 0.069,
      proxyWallGap_m_WORK_ASSUMPTION: 0.001,
      geometrySource: 'PROCEDURAL_EXXACT_STYLE_VISUAL_REFERENCE_NOT_MANUFACTURER_CAD',
      hostHold: true, current: false, asBuilt: false,
      installedBrandNotVerified: true, installedSKUNotVerified: true,
      physicalHostNotVerified: true, electricalCircuitNotVerified: true,
      sourceLinksBoundToOutputSHA: false, humanReview: false,
      productionWebGLVerified: false,
      preservesOtherD1FSwitches: ['D1F-SW-01','D1F-SW-02','D1F-SW-03','D1F-SW-06'],
      preservesD2FSwitches: ['D2F-SW-01','D2F-SW-02','D2F-SW-03','D2F-SW-04'],
    },
  };
  return {
    asset: { extras: { ModelStage: 'WORK_TEST', current: false,
      asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } },
    scene: SPEC.defaultScene, scenes, nodes,
    meshes: Array(SPEC.meshCount), materials: Array(SPEC.materialCount),
    accessors: Array(SPEC.accessorCount), bufferViews: Array(SPEC.bufferViewCount),
  };
}
const good = (json, idx) =>
  valid(json, SPEC.glbSha256, idx, idx === 783 ? 'NORMAL' : 'SERVICE', 'D1F');

test('source-root signatures and both exact scene roles', () => {
  assert.equal(normalParents.length, 499);
  assert.equal(serviceParents.length, 498);
  assert.equal(fnv(normalParents), SPEC.views.normal.parentRootFnv32);
  assert.equal(fnv(serviceParents), SPEC.views.service.parentRootFnv32);
  for (const idx of [783, 784]) {
    const json = fixture(idx), v = idx === 783 ? SPEC.views.normal : SPEC.views.service;
    assert.equal(fnv(json.scenes[idx].nodes), v.rootFnv32);
    assert.equal(good(json, idx), true);
    assert.deepEqual(receipt(json, SPEC.glbSha256, idx, v.role, 'D1F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, publishAllowed: false,
      productionWebGLVerified: false, humanReview: 'NOT_RUN',
      current: false, asBuilt: false, physicalHostVerified: false,
      installedProductVerified: false,
    });
  }
});
test('rejects SHA, role, floor, scene mismatch', () => {
  const j = fixture(783);
  assert.equal(valid(j, SPEC.parentGlbSha256, 783, 'NORMAL', 'D1F'), false);
  assert.equal(valid(j, '0'.repeat(64), 783, 'NORMAL', 'D1F'), false);
  assert.equal(valid(j, SPEC.glbSha256, 783, 'SERVICE', 'D1F'), false);
  assert.equal(valid(j, SPEC.glbSha256, 783, 'NORMAL', 'D2F'), false);
  assert.equal(valid(j, SPEC.glbSha256, 784, 'NORMAL', 'D1F'), false);
  assert.equal(valid(j, SPEC.glbSha256, 999, 'NORMAL', 'D1F'), false);
});
test('rejects inherited roots, plexi or new root tampering', () => {
  let j = fixture(783);
  j.scenes[783].nodes[0] = SPEC.newRoot;
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.scenes[781].nodes.reverse();
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.scenes[783].nodes.splice(j.scenes[783].nodes.indexOf(13513), 1);
  assert.equal(good(j, 783), false);
  j = fixture(784);
  j.scenes[784].nodes.push(11625);
  assert.equal(good(j, 784), false);
});
test('rejects changed node, active wall, parent or physical-host claims', () => {
  let j = fixture(783);
  j.nodes[13522].extras.stableID = 'D1F-SW-03';
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.nodes[13523].mesh = 5180;
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.nodes[13495].mesh = 5164;
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.nodes[13522].extras.sourceOriginalGLBSHA256 = 'a'.repeat(64);
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.nodes[13522].extras.physicalHostNotVerified = false;
  assert.equal(good(j, 783), false);
  j = fixture(783);
  j.scenes[783].extras.sourceParentScene = 782;
  assert.equal(good(j, 783), false);
});
test('never upgrades nonpublished source to CURRENT, as-built or WebGL PASS', () => {
  let j = fixture(783);
  j.asset.extras.current = true;
  assert.equal(good(j, 783), false);
  j = fixture(784);
  j.scenes[784].extras.sourceLinksBoundToOutputSHA = true;
  assert.equal(good(j, 784), false);
  j = fixture(783);
  j.nodes[13522].extras.productionWebGLVerified = true;
  const r = receipt(j, SPEC.glbSha256, 783, 'NORMAL', 'D1F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
});
test('rejects invalid root indices', () => {
  for (const x of [null, [1, -1], [1, 1.2], [Number.MAX_SAFE_INTEGER + 1]])
    assert.equal(fnv(x), null);
});
