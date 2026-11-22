import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_D1F_SW06_SOURCE as SPEC,
  isK3D1fSw06ActiveSource as valid,
  resolveK3D1fSw06SourceAssociation as resolve,
} from '../../src/scripts/privateModelK3D1fSw06SourceAssociation.mjs';

// Deliberately synthetic structure: private original bytes are optional below.
const normalBase = [11775, 12414, 11625, 13525, 13519, 13507, 13510, 13513, 13516];
const serviceBase = normalBase.filter(x => x !== 11625);
function synthetic() {
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  for (const view of Object.values(SPEC.views)) {
    const orig = view.plexi ? normalBase : serviceBase;
    scenes[view.parentScene] = { nodes: orig.slice() };
    scenes[view.sceneIndex] = {
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_' +
        view.role + '_WORK_TEST_HOST_HOLD__scene' + view.sceneIndex,
      nodes: [...orig, SPEC.newCoexistingSw04Root],
      extras: {
        stage: 'WORK_TEST_HOST_HOLD', role: view.role,
        sourceParentScene: view.parentScene,
        sourceOriginalGLBSHA256: SPEC.combinedBaseGlbSha256,
        donorOriginalGLBSHA256: SPEC.sw04DonorGlbSha256,
        newD1FSW04Root: SPEC.newCoexistingSw04Root,
        sourceLinksBoundToOutputSHA: false,
        current: false, asBuilt: false,
        productionWebGLVerified: false, humanReview: false,
      },
    };
  }
  nodes[SPEC.markerNodeId] = {
    name: 'D1F-SW-06_OWNER_CONFIRMED_MARKER_LINK_TO_EXISTING_MODEL_SWITCH_7996',
    extras: {
      stableID: 'D1F-SW-06', floor: 'D1F',
      role: 'SEMANTIC_LINK_TO_SOURCE_EXISTING_SWITCH_NO_DUPLICATE_MESH',
      existingSourceSwitchNode: SPEC.historicalSwitchNodeId,
      remapSourceGLBNodeId: SPEC.erroneousWaterNodeId,
      modelAlreadyContainsGeometry: true,
      physicalWallHost: 'HOLD_UNVERIFIED',
      electricalCircuit: 'NOT_VERIFIED',
      current: false, asBuilt: false,
    },
  };
  nodes[SPEC.historicalSwitchNodeId] = {
    name: 'C80R2_V15_D1F_ENTRY_SWITCH_WORK_TEST', mesh: SPEC.activeSwitchMesh,
  };
  nodes[SPEC.activeSwitchNodeId] = {
    name: 'C80R2_V15_D1F_ENTRY_SWITCH_WORK_TEST', mesh: SPEC.activeSwitchMesh,
    extras: {
      C80614R6: { dxG1: 0.094 }, current: false, asBuilt: false,
    },
  };
  nodes[SPEC.erroneousWaterNodeId] = {
    name: 'P02_P03_KITCHEN_V75_DOWN_ACTIVE_1F_BOTH_COW',
    mesh: SPEC.erroneousWaterMesh,
    extras: { m5System: 'VESI' },
  };
  nodes[SPEC.newCoexistingSw04Root] = { extras: { stableID: 'D1F-SW-04' } };
  const meshes = Array(SPEC.meshCount).fill(null);
  meshes[SPEC.activeSwitchMesh] = {
    name: 'C80R2_V15_SWITCH_MESH',
    primitives: Array.from({ length: 6 }, () => ({})),
  };
  return {
    asset: { extras: {
      ModelStage: 'WORK_TEST', current: false,
      asBuilt: false, HUMAN_REVIEW: 'NOT_RUN',
    } },
    scene: SPEC.defaultScene, scenes, nodes, meshes,
    materials: Array(SPEC.materialCount).fill(null),
    accessors: Array(SPEC.accessorCount).fill(null),
    bufferViews: Array(SPEC.bufferViewCount).fill(null),
  };
}
const check = (json, v, sha = SPEC.glbSha256) =>
  valid(json, sha, v.sceneIndex, v.role, 'D1F');

test('exact SHA and both K3 1F SW06 source scenes resolve the rendered electrical switch', () => {
  assert.match(SPEC.zipSha256, /^[a-f0-9]{64}$/);
  assert.match(SPEC.glbSha256, /^[a-f0-9]{64}$/);
  const json = synthetic();
  for (const v of Object.values(SPEC.views)) {
    assert.equal(check(json, v), true);
    const found = resolve(json, SPEC.glbSha256, v.sceneIndex, v.role, 'D1F');
    assert.equal(found.stableID, 'D1F-SW-06');
    assert.equal(found.markerNodeId, 11775);
    assert.equal(found.activeRenderableNodeId, 12414);
    assert.equal(found.activeRenderableMeshId, 2447);
    assert.equal(found.historicalSwitchNodeId, 7996);
    assert.equal(found.rejectedLegacyWaterNodeId, 11724);
    assert.equal(found.sourceLinksBound, false);
    assert.equal(found.viewerRegistered, false);
    assert.equal(found.publishAllowed, false);
    assert.equal(found.current, false);
    assert.equal(found.asBuilt, false);
  }
});

test('never resolve stale SHA, drain 11724, historical 7996 or fabricated activation', () => {
  for (const v of Object.values(SPEC.views)) {
    const json = synthetic();
    assert.equal(check(json, v), true);
    for (const sha of [
      SPEC.combinedBaseGlbSha256,
      SPEC.sw04DonorGlbSha256,
      '0'.repeat(64), 'not-a-hash',
    ]) assert.equal(check(json, v, sha), false);
    assert.equal(valid(json, SPEC.glbSha256, v.sceneIndex, v.role, 'D2F'), false);
    assert.equal(valid(json, SPEC.glbSha256, v.parentScene, v.role, 'D1F'), false);
    assert.equal(valid(json, SPEC.glbSha256, v.sceneIndex, 'UNKNOWN', 'D1F'), false);
    const mutate = (obj, key, value) => {
      const old = obj[key]; obj[key] = value;
      try { assert.equal(check(json, v), false, String(key)); }
      finally { obj[key] = old; }
    };
    mutate(json, 'scene', 787);
    mutate(json.asset.extras, 'ModelStage', 'CURRENT');
    mutate(json.asset.extras, 'HUMAN_REVIEW', 'APPROVED');
    mutate(json.scenes[v.sceneIndex], 'name', 'impostor__scene' + v.sceneIndex);
    mutate(json.scenes[v.sceneIndex].extras, 'sourceOriginalGLBSHA256', 'old');
    mutate(json.scenes[v.sceneIndex].extras, 'sourceLinksBoundToOutputSHA', true);
    mutate(json.scenes[v.sceneIndex].extras, 'productionWebGLVerified', true);
    mutate(json.scenes[v.sceneIndex].nodes, 0, 11724);
    mutate(json.scenes[v.sceneIndex].nodes, 1, 7996);
    mutate(json.scenes[v.sceneIndex].nodes, 2, 9999);
    mutate(json.scenes[v.parentScene].nodes, 0, 11724);
    mutate(json.nodes[SPEC.markerNodeId].extras, 'stableID', 'D1F-SW-05');
    mutate(json.nodes[SPEC.markerNodeId].extras, 'remapSourceGLBNodeId', 12414);
    mutate(json.nodes[SPEC.markerNodeId].extras, 'existingSourceSwitchNode', 12414);
    mutate(json.nodes[SPEC.activeSwitchNodeId], 'mesh', SPEC.erroneousWaterMesh);
    mutate(json.nodes[SPEC.activeSwitchNodeId].extras.C80614R6, 'dxG1', 0);
    mutate(json.nodes[SPEC.erroneousWaterNodeId].extras, 'm5System', 'SAHKO');
    mutate(json.nodes[SPEC.newCoexistingSw04Root].extras, 'stableID', 'D1F-SW-06');
    assert.equal(check(json, v), true);
  }
});

test('invalid or unauthenticated source returns no association or permission', () => {
  const v = SPEC.views.normal;
  assert.equal(resolve(null, SPEC.glbSha256, v.sceneIndex, v.role, 'D1F'), null);
  assert.equal(resolve(synthetic(), 'ff', v.sceneIndex, v.role, 'D1F'), null);
});

const sourcePath = process.env.C80_R31_K3_D1F_SW06_SCENE787788_GLB_PATH;
test('optional original GLB SHA, two real scene graphs and SW06 semantic mapping',
  { skip: !sourcePath }, () => {
    const bytes = readFileSync(sourcePath);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const jsonLength = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
    for (const v of Object.values(SPEC.views)) {
      assert.equal(check(json, v, sha), true);
      const result = resolve(json, sha, v.sceneIndex, v.role, 'D1F');
      assert.equal(result.activeRenderableNodeId, 12414);
      assert.equal(result.rejectedLegacyWaterNodeId, 11724);
      assert.equal(result.publishAllowed, false);
    }
  });
