import test from 'node:test';
import assert from 'node:assert/strict';
import { R32H_T12_NW_COW_SOURCE as S, planR32HT12NorthwestWorkTestCOW as plan } from '../../src/scripts/privateModelR32HT12NorthwestCOW.mjs';

const sourceFixture = () => {
  // Synthetic test positions within ORIGINAL source mesh bounds; no fake source
  // geometry or current/as-built status is passed to the scene receiver.
  const p = new Float32Array(S.vertexCount * 3);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = -0.18;
    p[i + 1] = i % 12 === 0 ? S.sourceMinY : i % 12 === 3 ? -0.29 : i % 12 === 6 ? -0.11 : S.sourceMaxY;
    p[i + 2] = -10.685;
  }
  p[0] = S.sourceBounds.minX;
  p[3] = S.sourceBounds.maxX;
  p[2] = S.sourceBounds.minZ;
  p[5] = S.sourceBounds.maxZ;
  return p;
};
const auth = (positions = sourceFixture()) => ({
  glbSha256: S.glbSha256, sceneIndex: 814,
  nodeIndex: S.nodeIndex, meshIndex: S.meshIndex,
  nodeName: S.nodeName, worldMatrixIsIdentity: true, positions,
});

test('NW T12 COW preserves the original GLB mesh, raises only the lower part and clears the candidate grate', () => {
  const original = sourceFixture(), saved = new Float32Array(original);
  const r = plan(auth(original));
  assert.equal(r.status, 'WORK_TEST_COW');
  assert.equal(r.stage, 'WORK_TEST_HOST_HOLD');
  assert.equal(r.physicalHostVerified, false);
  assert.equal(r.asBuiltClaim, false);
  assert.equal(r.positions.length, original.length);
  assert.notStrictEqual(r.positions, original);
  assert.deepEqual(original, saved);
  assert.ok(Math.abs(r.riseY - 0.45721) < 0.002);
  assert.ok(Math.abs(r.targetMinY - 0.129) < 1e-8);
  assert.ok(Math.abs(r.targetMinY - r.sourceMinY - r.riseY) < 1e-8);
  assert.ok(r.shiftedVertices > 0 && r.shiftedVertices < S.vertexCount);
  for (let i = 1; i < original.length; i += 3) {
    if (original[i] > S.upperBandY) assert.equal(r.positions[i], original[i]);
  }
  assert.equal(plan(auth(r.positions)).status, 'SOURCE_MESH_BOUNDS_MISMATCH');
});

test('source gate rejects any other SHA, scene, node, mesh, name or transform', () => {
  for (const change of [
    { glbSha256: 'wrong' }, { sceneIndex: 816 }, { sceneIndex: 817 },
    { nodeIndex: S.nodeIndex - 1 }, { meshIndex: S.meshIndex + 1 },
    { nodeName: 'unrelated' }, { worldMatrixIsIdentity: false },
  ]) {
    const r = plan({ ...auth(), ...change });
    assert.equal(r.status, 'OUT_OF_EXACT_SOURCE_SCOPE');
    assert.equal(r.positions, undefined);
  }
});

test('rejects missing, invalid, shifted or non-source geometry without mutating source', () => {
  const p = sourceFixture();
  assert.equal(plan(auth(undefined)).status, 'WORK_TEST_COW');
  assert.equal(plan(auth(new Float32Array(9))).status, 'INVALID_SOURCE_GEOMETRY');
  const bad = new Float32Array(p);
  bad[7] = NaN;
  assert.equal(plan(auth(bad)).status, 'INVALID_SOURCE_GEOMETRY');
  const moved = new Float32Array(p);
  moved[1] += 0.04;
  for (let i = 1; i < moved.length; i += 3) if (moved[i] < -0.3) moved[i] += 0.04;
  assert.equal(plan(auth(moved)).status, 'SOURCE_MESH_BOUNDS_MISMATCH');
  assert.equal(p[1], Math.fround(S.sourceMinY));
});

test('source geometry explains the SW-grade reuse and keeps the NW outlet as WORK_TEST, not as-built', () => {
  assert.equal(S.assumedT12WestGroundY, -0.36);
  assert.ok(Math.abs(S.sourceSWGroundY - S.assumedT12WestGroundY) < 0.02);
  assert.ok(S.sourceNWGroundYSamples.every(y => y > S.assumedT12WestGroundY + 0.30));
  assert.ok(Math.max(...S.sourceNWGroundYSamples) - Math.min(...S.sourceNWGroundYSamples) > 0.07);
  assert.equal(S.candidateGrateY, 0.109);
  assert.ok(S.originalOutletCentreY < Math.min(...S.sourceNWGroundYSamples));
  assert.ok(S.photoSourceDriveId);
});
