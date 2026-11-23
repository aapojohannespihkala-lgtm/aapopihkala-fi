import assert from 'node:assert/strict';
import test from 'node:test';
import {
  R32H_T12_NW_COW_SOURCE,
  planR32HT12NorthwestWorkTestCOW,
} from '../../src/scripts/privateModelR32HT12NorthwestCOW.mjs';
import {
  R32H_ELEGANCE_1790RS_NW_FIT_SOURCE,
  planR32HMerikaElegance1790RSNWWorkTest,
} from '../../src/scripts/privateModelR32HMerikaElegance1790RSFitGuard.mjs';

// Synthetic coordinates reproduce the exact source mesh's 360 vertices and
// local XYZ bounds. They are NOT a loaded or rendered 64 MB original R32H GLB.
function originalSourcePositions() {
  const s = R32H_T12_NW_COW_SOURCE;
  const out = new Float32Array(s.vertexCount * 3);
  for (let i = 0; i < s.vertexCount; i++) {
    const t = i / (s.vertexCount - 1);
    out[i * 3] = s.sourceBounds.minX + t * (s.sourceBounds.maxX - s.sourceBounds.minX);
    out[i * 3 + 1] = 0.2 + t * 5;
    out[i * 3 + 2] = s.sourceBounds.minZ + t * (s.sourceBounds.maxZ - s.sourceBounds.minZ);
  }
  out[1] = s.sourceMinY;
  out[4] = s.sourceMaxY;
  return out;
}
const S = R32H_ELEGANCE_1790RS_NW_FIT_SOURCE;
const args = (overrides = {}) => ({
  glbSha256: S.sourceGlbSha256,
  sceneIndex: 814,
  nodeIndex: S.sourceNodeIndex,
  meshIndex: S.sourceMeshIndex,
  nodeName: R32H_T12_NW_COW_SOURCE.nodeName,
  worldMatrixIsIdentity: true,
  positions: originalSourcePositions(),
  siteGlbSha256: S.siteGlbSha256,
  siteZipSha256: S.siteZipSha256,
  siteSceneIndex: 0,
  wellId: 'RK_NW',
  explicitPreviewOptIn: true,
  ...overrides,
});
const minY = (arr) => {
  let min = Infinity;
  for (let i = 1; i < arr.length; i += 3) min = Math.min(min, arr[i]);
  return min;
};
const near = (actual, wanted, tolerance = 0.002) =>
  assert.ok(Math.abs(actual - wanted) <= tolerance, actual + ' not near ' + wanted);

test('site donor and original source exact SHA, scene and well are locked', () => {
  assert.equal(S.siteDriveId, '11Yc1MqvtVugjt1ebi67l0WxlPbr4erEu');
  assert.equal(S.siteGlbSha256, 'b317657aba710e81651012eaade437c359c88a968b0527d48c456cadde886371');
  assert.equal(S.siteZipSha256, '3dcca022201c1bb3be8d2d33b3ee3613a0432905daa3439deb301e69104c845d');
  assert.deepEqual(S.sourceScenes, [814, 815]);
  assert.equal(S.legacyGrateY, 0.109);
  assert.equal(S.eleganceCandidateGrateY, 0.163);
  assert.equal(S.legacyPreviewLowerLipY, 0.129);
  near(S.legacyPreviewLowerLipY - S.eleganceCandidateGrateY, -0.034, 0.000001);
});

test('explicit opt-in OFF blocks all 3D modifications', () => {
  const orig = originalSourcePositions();
  const result = planR32HMerikaElegance1790RSNWWorkTest(args({
    positions: orig, explicitPreviewOptIn: false,
  }));
  assert.equal(result.status, 'EXPLICIT_OPT_IN_REQUIRED');
  assert.equal(result.approvedForViewer, false);
  assert.equal(result.asBuiltClaim, false);
  assert.equal(result.positions, undefined);
  assert.equal(orig[1], R32H_T12_NW_COW_SOURCE.sourceMinY);
});

for (const sceneIndex of [814, 815]) {
  test('scene ' + sceneIndex + ': old +0.129 becomes opt-in Elegance +0.183, 20 mm free', () => {
    const sourcePositions = originalSourcePositions();
    const before = sourcePositions.slice();
    const old = planR32HT12NorthwestWorkTestCOW(args({
      sceneIndex, positions: sourcePositions,
    }));
    const result = planR32HMerikaElegance1790RSNWWorkTest(args({
      sceneIndex, positions: sourcePositions,
    }));
    assert.equal(old.status, 'WORK_TEST_COW');
    assert.equal(result.status, 'WORK_TEST_EL1790RS_NW_COW_CANDIDATE');
    near(old.targetMinY, 0.129);
    near(result.candidateLowerLipY, 0.183);
    near(result.candidateGapM, 0.020);
    near(result.additionalRiseY, 0.054);
    near(result.legacyClearanceM, -0.034);
    near(minY(result.positions), 0.183);
    near(minY(old.positions), 0.129);
    assert.deepEqual(sourcePositions, before);
    assert.ok(result.positions instanceof Float32Array);
    assert.notStrictEqual(result.positions, sourcePositions);
    assert.equal(result.physicalHostVerified, false);
    assert.equal(result.asBuiltClaim, false);
    assert.equal(result.approvedForViewer, false);
    assert.equal(result.approvedForPublication, false);
    assert.equal(result.viewerIntegration, 'NOT_WIRED');
    for (let i = 0; i < sourcePositions.length; i += 3) {
      assert.equal(result.positions[i], sourcePositions[i]);
      assert.equal(result.positions[i + 2], sourcePositions[i + 2]);
      if (sourcePositions[i + 1] >= R32H_T12_NW_COW_SOURCE.upperBandY) {
        assert.equal(result.positions[i + 1], sourcePositions[i + 1]);
      }
    }
  });
}
for (const [caseName, patch] of [
  ['wrong source SHA', { glbSha256: 'bad' }],
  ['wrong donor GLB', { siteGlbSha256: 'bad' }],
  ['wrong donor ZIP', { siteZipSha256: 'bad' }],
  ['wrong donor scene', { siteSceneIndex: 1 }],
  ['wrong well NE', { wellId: 'RK_NE' }],
  ['wrong well SE', { wellId: 'RK_SE' }],
  ['wrong scene 816', { sceneIndex: 816 }],
  ['wrong scene 817', { sceneIndex: 817 }],
  ['wrong node', { nodeIndex: 13800 }],
  ['wrong mesh', { meshIndex: 5208 }],
]) {
  test(caseName + ' fails closed', () => {
    const r = planR32HMerikaElegance1790RSNWWorkTest(args(patch));
    assert.equal(r.status, 'EXACT_SOURCE_OR_DONOR_MISMATCH');
    assert.equal(r.positions, undefined);
  });
}
for (const [caseName, patch] of [
  ['wrong node name', { nodeName: 'another downpipe' }],
  ['world matrix not identity', { worldMatrixIsIdentity: false }],
  ['wrong positions size', { positions: new Float32Array(18) }],
]) {
  test(caseName + ' fails the authenticated old-source guard', () => {
    const r = planR32HMerikaElegance1790RSNWWorkTest(args(patch));
    assert.equal(r.status, 'LEGACY_COW_SOURCE_GUARD_FAILED');
    assert.equal(r.positions, undefined);
  });
}
test('already moved mesh cannot be shifted twice', () => {
  const original = args();
  const old = planR32HT12NorthwestWorkTestCOW(original);
  assert.equal(old.status, 'WORK_TEST_COW');
  const r = planR32HMerikaElegance1790RSNWWorkTest(args({
    positions: old.positions,
  }));
  assert.equal(r.status, 'LEGACY_COW_SOURCE_GUARD_FAILED');
});
test('mutated source bounds and non-finite positions fail closed', () => {
  const modified = originalSourcePositions();
  modified[0] += 0.02;
  assert.equal(planR32HMerikaElegance1790RSNWWorkTest(args({
    positions: modified,
  })).status, 'LEGACY_COW_SOURCE_GUARD_FAILED');
  const nan = originalSourcePositions();
  nan[3] = Number.NaN;
  assert.equal(planR32HMerikaElegance1790RSNWWorkTest(args({
    positions: nan,
  })).status, 'LEGACY_COW_SOURCE_GUARD_FAILED');
});
