import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_SW02_777778_SOURCE as SPEC,
  isK3Sw02Scene777778Source as valid,
  k3Sw02Scene777778SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3Sw02Scene777778SourceReceipt.mjs';

// Synthetic, intentionally minimal roots. NOT an original-GLB fixture.
// The optional raw-byte test below is needed for real source verification.
const normalOld = [13507, 11625, 13510, 13243, 7777];
const serviceOld = normalOld.filter(n => n !== 11625);
function synthetic() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  const mk = (name, old, ix, parent) => {
    scenes[parent] = { nodes: [...old] };
    scenes[ix] = {
      name: `Ylisrinne_C80_R31_2F_R300_K3_SW04_SW01_SW02_WALLHOST_REF_${name}_WORK_TEST_HOST_HOLD__scene${ix}`,
      nodes: old.map(n => n === SPEC.oldRoot ? SPEC.newRoot : n),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD', sourceScene: parent,
        sourceGLBsha256: SPEC.parentGlbSha256,
        sourceLinksNewShaBound: false,
        current: false, asBuilt: false,
        productionWebGL: 'NOT_RUN', humanReview: 'NOT_RUN',
      },
    };
  };
  mk('NORMAL_PLEX_ON', normalOld, 777, 775);
  mk('SERVICE_PLEX_OFF', serviceOld, 778, 776);
  nodes[SPEC.newRoot] = {
    name: 'K3_D2F_SW02_WHITE_EXXACT_STYLE_REFERENCE_87x87MM_WORLDHOST_WORK_TEST_HOST_HOLD',
    children: [13514, 13515],
    extras: {
      stableID: 'D2F-SW-02', floor: 'D2F',
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      sourcePreviousRoot: SPEC.oldRoot,
      activeHostNodeID: SPEC.hostNode, activeHostMeshID: SPEC.hostMesh,
      activeHostTriangles: [14, 15], activeHostPlaneZ_m: -7.225,
      hostHold: true, sourceLinksBoundToOutputSHA: false,
      current: false, asBuilt: false,
    },
  };
  nodes[13514] = { mesh: 5173 };
  nodes[13515] = { mesh: 5174 };
  nodes[SPEC.hostNode] = { mesh: SPEC.hostMesh };
  return {
    asset: { version: '2.0', extras: {
      ModelStage: 'WORK_TEST', current: false, asBuilt: false,
      HUMAN_REVIEW: 'NOT_RUN',
    } },
    scene: SPEC.defaultScene, scenes, nodes,
    meshes: Array(SPEC.meshCount).fill(null),
    materials: Array(SPEC.materialCount).fill(null),
  };
}

test('SW02 source contract accepts only its authenticated normal and service roles', () => {
  assert.match(SPEC.glbSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.zipSha256, /^[0-9a-f]{64}$/);
  assert.notEqual(SPEC.glbSha256, SPEC.parentGlbSha256);
  const j = synthetic();
  for (const view of Object.values(SPEC.views)) {
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex, view.role, 'D2F'), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, view.sceneIndex, view.role, 'D2F'), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, publishAllowed: false,
      viewerRegistered: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false, installedProductVerified: false,
    });
  }
});

test('SW02 wrong SHA, source, floor, role, root, host, plexi and stage fail closed', () => {
  for (const view of Object.values(SPEC.views)) {
    const j = synthetic();
    const ok = () => valid(j, SPEC.glbSha256, view.sceneIndex, view.role, 'D2F');
    assert.equal(ok(), true);
    for (const sha of ['0'.repeat(64), SPEC.parentGlbSha256, 'not-a-sha']) {
      assert.equal(valid(j, sha, view.sceneIndex, view.role, 'D2F'), false);
    }
    assert.equal(valid(j, SPEC.glbSha256, view.parentScene, view.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex, 'D2F_SW01_NORMAL', 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex, view.role, 'BOTH'), false);
    const mutate = (object, key, value) => {
      const was = object[key];
      object[key] = value;
      try { assert.equal(ok(), false, String(key)); }
      finally { object[key] = was; }
    };
    mutate(j, 'scene', 0);
    mutate(j.asset.extras, 'ModelStage', 'CURRENT');
    mutate(j.asset.extras, 'asBuilt', true);
    mutate(j.asset.extras, 'HUMAN_REVIEW', 'APPROVED');
    mutate(j.scenes[view.sceneIndex], 'name', 'forged__scene' + view.sceneIndex);
    mutate(j.scenes[view.sceneIndex].extras, 'sourceGLBsha256', 'bad');
    mutate(j.scenes[view.sceneIndex].extras, 'sourceLinksNewShaBound', true);
    mutate(j.scenes[view.sceneIndex].extras, 'productionWebGL', 'PASS');
    mutate(j.scenes[view.sceneIndex].nodes, 0, 99999);
    mutate(j.scenes[view.parentScene].nodes, 0, 99999);
    mutate(j.nodes[SPEC.newRoot], 'children', [13514]);
    mutate(j.nodes[SPEC.newRoot].extras, 'stableID', 'D2F-SW-01');
    mutate(j.nodes[SPEC.newRoot].extras, 'activeHostNodeID', 10794);
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(j.nodes[13514], 'mesh', 0);
    mutate(j.nodes[SPEC.hostNode], 'mesh', 4188);
    mutate(j.scenes[777].nodes, 1, 99999); // normal plexi removed
    assert.equal(ok(), true);
  }
});

test('unverified input never permits publishing or current/as-built', () => {
  const v = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

const originalGlbPath = process.env.C80_R31_K3_SW02_SCENE777778_GLB_PATH;
test('optional original bytes SHA and scene777/778 parity',
  { skip: !originalGlbPath }, () => {
    const bytes = readFileSync(originalGlbPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    // Authenticated original contains an independently verified defect:
    // node13513 was copied with stableID D2F-SW-01 instead of D2F-SW-02.
    assert.equal(json.nodes[SPEC.newRoot]?.extras?.stableID, 'D2F-SW-01');
    for (const v of Object.values(SPEC.views)) {
      assert.equal(valid(json, sha, v.sceneIndex, v.role, 'D2F'), false);
      assert.equal(receipt(json, sha, v.sceneIndex, v.role, 'D2F').publishAllowed, false);
    }
  });
