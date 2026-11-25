import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import {
  K3_SW01_775776_SOURCE as SPEC,
  k3Sw01RootsFnv32 as fnv,
  isK3Sw01Scene775776Source as valid,
  k3Sw01Scene775776SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3Sw01Scene775776SourceReceipt.mjs';

// Real ordered source roots 773/774 compressed without meshes, photos or GLB.
// Fixture preserves source-root order and the normal/service plexi distinction.
const parentRoots = JSON.parse(inflateSync(Buffer.from(
  'eNrtlMuRXTEIRHOZtRYCxEeTisuRuJy7u1sbRzCrtzmFuKhBiKs/X93x9f2rI2t55aw6Ycv8nL0srM7qKCOK6JXhQWtoYVl+FZh03pUTSdS6XgzsTUl+bVuzd2DZTsg6RBK1Kq2JIe6qQSUAghN1AIi7lxVRoBICjezVsVlx9LLdN9dNaAOH0BK1332IJLRsYogLIIu5Bb/0RZ1+iCR0FCzt4sNAH4GQuHabGOIiZm8g4QuI3WtGwGr0D76hFcQhnF07aPXGAnaiNNuZjyW2OOIla4smQmGXIkuRpRjmMLQ+aLeJLj7PEVMsUW3rEaUwW9Te0d7R3tHe0d7R3mnlSrHE5xnxslXnyAYttoi7BUPkmIEmuhiiIk+KJbYI5XAMHvlszp9zBECOLi+LTLHEFkdkVd5bZN5k/SCzlB+RnjqPzPJqLvbcih1zY8/jXCo06wGf7WKwHp4IfPbRLatynsiDN2vzKB0OJSppdYw6vtM0l8qoE5lOZPU8OhGzuPT9KTtrRjNSdLH0i+jX1qwfTgh4RN3g0eT446tBfud8nhmdl/7cIWrvbdmpc+n2+YuEaao91YFkB2LzpoKa0LnqxhZdrN8Lr9H5vEaf1+jzGv3/Gn3eoR9+h/7+AwNxy4A=',
  'base64')).toString('utf8'));

function synthetic(index) {
  const v = Object.values(SPEC.views).find(x => x.sceneIndex === index);
  assert.ok(v);
  const oldRoots = parentRoots[String(v.parentScene)];
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  scenes[v.parentScene] = { nodes: [...oldRoots] };
  scenes[index] = {
    name: v.sceneName,
    nodes: oldRoots.map(i => i === SPEC.oldRoot ? SPEC.newRoot : i),
    extras: {
      stage: 'WORK_TEST_HOST_HOLD', sourceScene: v.parentScene,
      sourceGLBsha256: SPEC.parentGlbSha256,
      sourceRootOFF: SPEC.oldRoot, newRootON: SPEC.newRoot,
      sourceLinksNewSHA: 'NOT_BOUND', sourceLinksNewShaBound: false,
      '2026PhysicalSwitchPositionMeasured': false, plexyState: v.plexi,
      productSkuInstalledVerified: false,
      productionWebGL: 'NOT_RUN', humanReview: 'NOT_RUN',
      current: false, asBuilt: false,
    },
  };
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  nodes[SPEC.newRoot] = {
    name: 'K3_D2F_SW01_WHITE_EXXACT_STYLE_REFERENCE_87x87MM_WORLDHOST_WORK_TEST_HOST_HOLD',
    children: [13511, 13512],
    extras: {
      stableID: 'D2F-SW-01', floor: 'D2F',
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      sourcePreviousRoot: SPEC.oldRoot, activeHostNodeID: SPEC.hostNode,
      activeHostMeshID: SPEC.hostMesh, activeHostPrimitive: 2,
      activeHostTriangles: [12, 13], activeHostPlaneZ_m: -5.005,
      hostNormalWorld: [0, 0, 1], proxyReferenceOuterM: 0.087,
      geometrySource: 'PROCEDURAL_REFERENCE_NOT_MANUFACTURER_CAD',
      hostHold: true, current: false, asBuilt: false,
      sourceLinksBoundToOutputSHA: false,
      productionWebGLVerified: false, humanReview: false,
    },
  };
  nodes[13511] = { mesh: 5171 };
  nodes[13512] = { mesh: 5172 };
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

test('K3 source exact ordered roots and both scene roles', () => {
  assert.match(SPEC.zipSha256, /^[a-f0-9]{64}$/);
  assert.match(SPEC.glbSha256, /^[a-f0-9]{64}$/);
  assert.notEqual(SPEC.glbSha256, SPEC.parentGlbSha256);
  for (const v of Object.values(SPEC.views)) {
    const j = synthetic(v.sceneIndex);
    assert.equal(fnv(j.scenes[v.parentScene].nodes), v.parentRootFnv32);
    assert.equal(fnv(j.scenes[v.sceneIndex].nodes), v.rootFnv32);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F'), true);
    assert.equal(j.scenes[v.sceneIndex].nodes.includes(SPEC.oldRoot), false);
    assert.equal(j.scenes[v.sceneIndex].nodes.includes(SPEC.sw04Root), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD', sourceLinksBound: false,
      publishAllowed: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false, installedProductVerified: false,
    });
  }
  assert.equal(fnv([-1]), null);
  assert.equal(fnv([0.5]), null);
  assert.equal(fnv({}), null);
});

test('K3 SW01 source identity, camera-floor role and node mutations fail closed', () => {
  for (const v of Object.values(SPEC.views)) {
    const j = synthetic(v.sceneIndex);
    const ok = () => valid(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F');
    assert.equal(ok(), true);
    assert.equal(valid(j, '0'.repeat(64), v.sceneIndex, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.parentGlbSha256, v.sceneIndex, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.parentScene, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, 'wrong', 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role, 'BOTH'), false);
    const mutate = (obj, key, value) => {
      const prior = obj[key];
      obj[key] = value;
      try { assert.equal(ok(), false, String(key)); }
      finally { obj[key] = prior; }
    };
    mutate(j.asset.extras, 'current', true);
    mutate(j.asset.extras, 'HUMAN_REVIEW', 'PASS');
    mutate(j, 'scene', 775);
    mutate(j.scenes[v.sceneIndex], 'name', 'different GLB');
    mutate(j.scenes[v.sceneIndex].extras, 'sourceGLBsha256', '0'.repeat(64));
    mutate(j.scenes[v.sceneIndex].extras, 'sourceLinksNewSHA', 'BOUND');
    mutate(j.scenes[v.sceneIndex].extras, '2026PhysicalSwitchPositionMeasured', true);
    mutate(j.scenes[v.sceneIndex].extras, 'plexyState', 'FORGED');
    mutate(j.scenes[v.sceneIndex].nodes, 0, 90000);
    mutate(j.scenes[v.parentScene].nodes, 0, 90000);
    const swapIndex = j.scenes[v.sceneIndex].nodes.indexOf(SPEC.newRoot);
    mutate(j.scenes[v.sceneIndex].nodes, swapIndex, SPEC.oldRoot);
    mutate(j.nodes[SPEC.newRoot], 'children', [13511]);
    mutate(j.nodes[13511], 'mesh', 1);
    mutate(j.nodes[SPEC.hostNode], 'mesh', 4188);
    mutate(j.nodes[SPEC.newRoot].extras, 'activeHostNodeID', 10794);
    mutate(j.nodes[SPEC.newRoot].extras, 'hostNormalWorld', [1, 0, 0]);
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceLinksBoundToOutputSHA', true);
    assert.equal(ok(), true, 'restored original source fixture');
  }
});

test('invalid or missing source cannot gain publisher or as-built status', () => {
  const v = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
  assert.equal(r.physicalHostVerified, false);
});

const originalGlbPath = process.env.C80_R31_K3_SW01_SCENE775776_GLB_PATH;
test('optional original GLB byte-SHA and scene775/776 parity',
  { skip: !originalGlbPath }, () => {
    const b = readFileSync(originalGlbPath);
    assert.equal(b.toString('ascii', 0, 4), 'glTF');
    assert.equal(b.readUInt32LE(8), b.length);
    assert.equal(b.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(b).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
    for (const v of Object.values(SPEC.views)) {
      assert.equal(valid(j, sha, v.sceneIndex, v.role, 'D2F'), true);
      assert.equal(valid(j, sha, v.sceneIndex, v.role, '1F'), false);
    }
  });
