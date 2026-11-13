import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  m5bR1109RoofOptInSha256,
  m5bR1109RoofParentSha256,
  selectM5BR1109RoofOptInScene,
} from '../src/scripts/privateModelM5BR1109RoofOptIn.mjs';

const base = {
  parentSourceGLBSha256: m5bR1109RoofParentSha256,
  ModelStage: 'WORK_TEST_VIEW',
  sourcePresenceTargetCount: 5,
  sourcePresenceZoneNodeIds: [1118, 1119, 1120, 1121, 1122],
  presentationOnly: true,
  workAssumption: true,
  oneToOneDownspoutToRouteLinks: 0,
  unsupportedPhysicalRouteLinks: 0,
  physicalDownspoutHostClaim: false,
  physicalPipeOrGutterGeometryAdded: false,
  sourceSceneDefaultIndex: 63,
  exactXYClaim: false,
  exactZClaim: false,
  physicalDiameterClaim: false,
  physicalRouteClaim: false,
  hydraulicConnectionToM5A: false,
  asBuiltClaim: false,
  currentGeometryClaim: false,
  canonical: false,
  publishToCURRENT: false,
  humanReview: 'NOT_RUN',
  productionWebGL: 'NOT_VERIFIED',
};
function fixture() {
  const nodes = Array.from({ length: 1124 }, () => ({}));
  // Direct children read from exact G2b source GLB SHA256 b6b5b14c3c7d... .
  nodes[1123] = { children: [1118, 1119, 1120, 1121, 1122] };
  nodes[1102] = { children: [1097, 1098] };
  nodes[1103] = { children: [1099, 1100, 1101] };
  const scenes = Array.from({ length: 66 }, () => ({}));
  scenes[63] = { nodes: [1021, 1123] };
  scenes[64] = {
    nodes: [1021, 1123, 1102],
    extras: {
      ...base,
      phase: 'CURRENT_SOURCE_PRESENCE_SCOPED',
      reviewType: 'SOURCE_PRESENCE_PLUS_CURRENT_REFERENCE',
      directCurrentRouteNodes: [1097, 1098],
      currentReferenceRouteCount: 2,
      plannedEntitiesInReview: 0,
    },
  };
  scenes[65] = {
    nodes: [1021, 1123, 1103],
    extras: {
      ...base,
      phase: 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED',
      reviewType: 'SOURCE_PRESENCE_PLUS_EXPLICIT_PLANNED_COMPARISON',
      plannedDirectNodes: [1099, 1100],
      plannedCount: 2,
      plannedOrdered: false,
      plannedImplemented: false,
      currentSOK1ReferenceContextNode: 1101,
    },
  };
  const renderable = Array.from({ length: 66 }, (_, i) => ({
    name: 'scene_' + i,
    traverse() {},
  }));
  return {
    parser: { json: {
      scene: 63, scenes,
      nodes,
      meshes: Array.from({ length: 567 }, () => ({})),
    } },
    scenes: renderable,
  };
}
test('R1109 scene64/65 select exact separate source roots, scene63 is untouched', () => {
  const gltf = fixture();
  const a = selectM5BR1109RoofOptInScene(gltf, 64);
  const b = selectM5BR1109RoofOptInScene(gltf, 65);
  assert.equal(a.scene, gltf.scenes[64]);
  assert.equal(b.scene, gltf.scenes[65]);
  assert.equal(a.phase, 'CURRENT_SOURCE_PRESENCE_SCOPED');
  assert.equal(b.phase, 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED');
  assert.deepEqual(gltf.parser.json.scenes[63].nodes, [1021, 1123]);
  assert.equal(gltf.parser.json.scene, 63);
  assert.equal(a.humanReview, 'NOT_RUN');
  assert.equal(b.productionWebGL, 'NOT_VERIFIED');
});
test('R1109 rejects wrong scene, removed root, planned promoted or source mismatch', () => {
  assert.throws(() => selectM5BR1109RoofOptInScene(fixture(), 63), /unknown-scene/);
  const x = fixture();
  x.parser.json.scenes[64].nodes = [1021, 1123];
  assert.throws(() => selectM5BR1109RoofOptInScene(x, 64), /scene-contract/);
  const y = fixture();
  y.parser.json.scenes[65].extras.plannedImplemented = true;
  assert.throws(() => selectM5BR1109RoofOptInScene(y, 65), /planned-only/);
  const z = fixture();
  z.parser.json.scenes[64].extras.hydraulicConnectionToM5A = true;
  assert.throws(() => selectM5BR1109RoofOptInScene(z, 64), /scene-contract/);
  const w = fixture();
  w.parser.json.scene = 64;
  assert.throws(() => selectM5BR1109RoofOptInScene(w, 64), /source-identity/);
  const missing = fixture();
  missing.scenes[65] = null;
  assert.throws(() => selectM5BR1109RoofOptInScene(missing, 65), /renderable-scene-missing/);
  const wrongParent = fixture();
  wrongParent.parser.json.nodes[1103].children = [1099, 1100];
  assert.throws(() => selectM5BR1109RoofOptInScene(wrongParent, 65), /source-parentage/);
  const measuredWithoutEvidence = fixture();
  measuredWithoutEvidence.parser.json.scenes[64].extras.exactXYClaim = true;
  assert.throws(() => selectM5BR1109RoofOptInScene(measuredWithoutEvidence, 64), /scene-contract/);
  const falseDiameter = fixture();
  falseDiameter.parser.json.scenes[65].extras.physicalDiameterClaim = true;
  assert.throws(() => selectM5BR1109RoofOptInScene(falseDiameter, 65), /scene-contract/);
  const inheritedDefaultMismatch = fixture();
  inheritedDefaultMismatch.parser.json.scenes[64].extras.sourceSceneDefaultIndex = 62;
  assert.throws(() => selectM5BR1109RoofOptInScene(inheritedDefaultMismatch, 64), /scene-contract/);
});
test('WORK_TEST transport registers a separate SHA-exact GLB, no old candidate replacement', () => {
  const worker = readFileSync(new URL('../worker/privateWorkTest.ts', import.meta.url), 'utf8');
  const ids = readFileSync(new URL('../src/scripts/privateModelWorkTest.ts', import.meta.url), 'utf8');
  const viewer = readFileSync(new URL('../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.ok(worker.includes('M5B_R1109_FIVE_DOWNSPOUT_PRESENCE_ZONES_CANDIDATE'));
  assert.ok(worker.includes('M5B_R1109_ROOF_SCENES64_65_CANDIDATE'));
  assert.ok(worker.includes('expectedSize: 3_104_840'));
  assert.ok(worker.includes(m5bR1109RoofOptInSha256));
  assert.ok(ids.includes('m5bR1109CurrentReferenceReviewId'));
  assert.ok(ids.includes('m5bR1109PlannedSok2ReviewId'));
  assert.ok(viewer.includes('selectM5BR1109RoofOptInScene(gltf, requestedScene)'));
  assert.ok(viewer.includes('m5bRoofOptInProductionWebGL: \'NOT_VERIFIED\''));
});
