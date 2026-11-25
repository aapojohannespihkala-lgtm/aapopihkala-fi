import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_SW03_779780_SOURCE as SPEC,
  isK3Sw03Scene779780Source as valid,
  k3Sw03Scene779780SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3Sw03Scene779780SourceReceipt.mjs';

// Small synthetic contract fixture: NOT the actual GLB (optional byte test below).
const normalOld = [13507, 13510, 13513, 11625, 13244, 7711];
const serviceOld = normalOld.filter(n => n !== 11625);
const makeExtras = (stableID, previousRoot) => ({
  stableID, floor: 'D2F', current: false, asBuilt: false,
  sourcePreviousRoot: previousRoot,
});
function synthetic() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  const define = (index, parent, oldRoots, label) => {
    scenes[parent] = { nodes: [...oldRoots] };
    scenes[index] = {
      name: 'Ylisrinne_C80_R31_2F_K3_SW04_SW01_SW02_SW03_WALLHOST_REF_' +
        label + '_WORK_TEST_HOST_HOLD__scene' + index,
      nodes: oldRoots.map(id => id === SPEC.oldRoot ? SPEC.newRoot : id),
      extras: {
        stage: 'WORK_TEST_HOST_HOLD',
        sourceScene: parent,
        sourceGLBsha256: SPEC.parentGlbSha256,
        sourceRootOFF: SPEC.oldRoot, newRootON: SPEC.newRoot,
        sourceLinksNewShaBound: false, sourceLinksNewSHA: 'NOT_BOUND',
        productSkuInstalledVerified: false,
        current: false, asBuilt: false,
        productionWebGL: 'NOT_RUN', humanReview: 'NOT_RUN',
      },
    };
  };
  define(779, 777, normalOld, 'NORMAL_PLEX_ON');
  define(780, 778, serviceOld, 'SERVICE_PLEX_OFF');
  for (const [stableID, index] of Object.entries(SPEC.activeRoots)) {
    nodes[index] = { extras: makeExtras(stableID, index === SPEC.newRoot ? SPEC.oldRoot : 0) };
  }
  nodes[SPEC.newRoot] = {
    name: 'K3_D2F_SW03_WHITE_EXXACT_STYLE_REFERENCE_WORK_TEST_HOST_HOLD',
    children: [13517, 13518],
    extras: {
      ...makeExtras('D2F-SW-03', SPEC.oldRoot),
      sourceOriginalZipDriveID: SPEC.parentZipDriveId,
      sourceOriginalGLBSHA256: SPEC.parentGlbSha256,
      activeHostNodeID: SPEC.hostNode,
      activeHostMeshID: SPEC.hostMesh,
      activeHostTriangles: [6, 7], activeHostPlaneZ_m: -7.225,
      hostHold: true, productSkuVerified: false,
      sourceLinksBoundToOutputSHA: false,
      productionWebGLVerified: false, humanReview: false,
    },
  };
  nodes[13517] = { mesh: 5175 };
  nodes[13518] = { mesh: 5176 };
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

test('SW03 authenticated SOURCE_ONLY contract accepts exact scene779/780 roles', () => {
  assert.match(SPEC.zipSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.glbSha256, /^[0-9a-f]{64}$/);
  assert.notEqual(SPEC.glbSha256, SPEC.parentGlbSha256);
  const j = synthetic();
  for (const v of Object.values(SPEC.views)) {
    assert.equal(check(j, v), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F'), {
      exactSource: true,
      stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, publishAllowed: false,
      viewerRegistered: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false, installedProductVerified: false,
    });
  }
});

test('SW03 fails closed for stale SW03, uncorrected SW02, floor, parent and root', () => {
  for (const v of Object.values(SPEC.views)) {
    const j = synthetic();
    assert.equal(check(j, v), true);
    const badSha = [
      'd46028d5244e990bf5f1f3c50dcc08f1fdf9804a232338819316dfaf8bcfc764',
      '9e12d439ff220a96648d73eb805a759631d28fd9f53d3d366b9ce9a56fe279e9',
      SPEC.parentGlbSha256, 'bad', '0'.repeat(64),
    ];
    for (const sha of badSha) assert.equal(check(j, v, sha), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role, '1F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.parentScene, v.role, 'D2F'), false);
    assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, 'D2F_SW02_NORMAL', 'D2F'), false);
    const mutate = (obj, key, val) => {
      const old = obj[key];
      obj[key] = val;
      try { assert.equal(check(j, v), false, String(key)); }
      finally { obj[key] = old; }
    };
    mutate(j, 'scene', 0);
    mutate(j.asset.extras, 'ModelStage', 'CURRENT');
    mutate(j.asset.extras, 'asBuilt', true);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceGLBsha256', 'legacy');
    mutate(j.scenes[v.sceneIndex].extras, 'sourceRootOFF', 13243);
    mutate(j.scenes[v.sceneIndex].extras, 'sourceLinksNewShaBound', true);
    mutate(j.scenes[v.sceneIndex].extras, 'productionWebGL', 'PASS');
    mutate(j.scenes[v.sceneIndex].nodes, 0, 999999);
    mutate(j.scenes[v.parentScene].nodes, 0, 999999);
    mutate(j.nodes[SPEC.newRoot], 'children', [13517]);
    mutate(j.nodes[SPEC.newRoot].extras, 'stableID', 'D2F-SW-01');
    mutate(j.nodes[SPEC.activeRoots['D2F-SW-02']].extras, 'stableID', 'D2F-SW-01');
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceOriginalGLBSHA256', 'legacy');
    mutate(j.nodes[SPEC.newRoot].extras, 'activeHostTriangles', [14, 15]);
    mutate(j.nodes[SPEC.newRoot].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(j.nodes[13517], 'mesh', 5174);
    mutate(j.nodes[SPEC.hostNode], 'mesh', 0);
    mutate(j.scenes[779].nodes, 3, 999999);
    assert.equal(check(j, v), true);
  }
});

test('unauthenticated input never permits publishing, current or as-built', () => {
  const v = SPEC.views.normal;
  const r = receipt(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F');
  assert.equal(r.exactSource, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.viewerRegistered, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

const originalGlbPath = process.env.C80_R31_K3_SW03_SCENE779780_GLB_PATH;
test('optional original corrected SW03 GLB byte SHA and scene779/780 parity',
  { skip: !originalGlbPath }, () => {
    const bytes = readFileSync(originalGlbPath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    for (const [identity, index] of Object.entries(SPEC.activeRoots)) {
      assert.equal(json.nodes[index].extras.stableID, identity);
    }
    for (const v of Object.values(SPEC.views)) {
      assert.equal(check(json, v, sha), true);
      assert.equal(check(json, v,
        'd46028d5244e990bf5f1f3c50dcc08f1fdf9804a232338819316dfaf8bcfc764'), false);
      assert.equal(receipt(json, sha, v.sceneIndex, v.role, 'D2F').publishAllowed, false);
    }
  });
