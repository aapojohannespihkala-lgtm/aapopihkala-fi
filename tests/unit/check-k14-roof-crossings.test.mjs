import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceAnchors, scene32SourceEvidence } from '../../src/data/scene32SourceScopeEvidence.mjs';
import {
  K14_HELD_INDICES, K14_KNOWN_ROOF_FOOTPRINTS,
  xModuleOverlaps, auditK14RoofCrossings,
} from '../../scripts/check-k14-roof-crossings.mjs';

const candidate = () => ({
  sourceZipSha256: evidenceAnchors.scene32ZipSha256,
  scene: 32,
  footprints: K14_KNOWN_ROOF_FOOTPRINTS.map((r) => ({ ...r })),
});
const rejected = (candidateInput, errorCode) => {
  const result = auditK14RoofCrossings(candidateInput);
  assert.equal(result.ok, false);
  assert.equal(result.canApplyToViewer, false);
  assert.equal(result.canPublish, false);
  assert.ok(result.errors.includes(errorCode), result.errors.join(','));
};

test('K14 D roof spans D, C and a B reference module; A roof spans B and A', () => {
  const result = auditK14RoofCrossings(candidate());
  assert.equal(result.ok, true, result.errors.join(','));
  assert.equal(result.results.length, 2);
  assert.deepEqual(result.results[0].overlappedG1Modules, ['D', 'C', 'B']);
  assert.deepEqual(result.results[1].overlappedG1Modules, ['B', 'A']);
  assert.deepEqual(result.results.map((r) => r.decision), [
    'HOLD_CROSS_APARTMENT_FOOTPRINT', 'HOLD_CROSS_APARTMENT_FOOTPRINT',
  ]);
  assert.deepEqual(result.results.map((r) => r.sourceLabel), ['D', 'A']);
  assert.equal(result.k14Held, 8);
  assert.equal(result.canApplyToViewer, false);
  assert.equal(result.canPublish, false);
  assert.equal(result.geometryVerifiedFromGlb, false);
  assert.equal(result.browserVerified, false);
  assert.ok(result.results.every((r) => r.ownershipInferred === false));
});

test('eight separate K14 gable/roof/rake/fascia parts retain UNKNOWN and UNCLASSIFIED', () => {
  const byId = new Map(scene32SourceEvidence().map((x) => [x.nodeIndex, x]));
  for (const nodeIndex of K14_HELD_INDICES) {
    const scope = byId.get(nodeIndex);
    assert.ok(scope);
    assert.equal(scope.storeyScope, 'UNKNOWN');
    assert.equal(scope.role, 'UNCLASSIFIED');
  }
});

test('touching a module boundary is not proof of overlapping ownership', () => {
  assert.deepEqual(xModuleOverlaps({ minX: 6.25, maxX: 6.50 }), []);
  assert.deepEqual(xModuleOverlaps({ minX: 6.24, maxX: 6.50 }), ['D']);
  assert.deepEqual(xModuleOverlaps({ minX: NaN, maxX: 1 }), []);
});

test('wrong SHA, scene, absent or duplicate footprint fail closed', () => {
  const cases = [
    [x => { x.sourceZipSha256 = '0'.repeat(64); }, 'SOURCE_ZIP_SHA_MISMATCH'],
    [x => { x.scene = 33; }, 'SCENE_ID_MISMATCH'],
    [x => { x.footprints.pop(); }, 'ROOF_FOOTPRINT_SET_INVALID'],
    [x => { x.footprints[1].nodeIndex = 2764; }, 'ROOF_FOOTPRINT_SET_INVALID'],
    [x => { x.footprints[0].minX = Infinity; }, 'ROOF_FOOTPRINT_INVALID:2764'],
  ];
  for (const [change, errorCode] of cases) {
    const x = candidate();
    change(x);
    rejected(x, errorCode);
  }
});

test('a shifted source roof cannot inherit scene32 K14 provenance silently', () => {
  const x = candidate();
  x.footprints[0].maxX = 6.25;
  rejected(x, 'ROOF_FOOTPRINT_SOURCE_DRIFT:2764');
});

test('changing any K14 held roof into a guessed storey or role is rejected', () => {
  for (const heldId of K14_HELD_INDICES) {
    const x = candidate();
    x.sourceEvidence = scene32SourceEvidence().map(r => ({ ...r }));
    const held = x.sourceEvidence.find(r => r.nodeIndex === heldId);
    held.storeyScope = 'ROOF';
    held.role = 'UPPER_OCCLUDER';
    rejected(x, 'SOURCE_EVIDENCE_FAIL');
  }
});

test('no valid footprint audit can claim real browser or publication acceptance', () => {
  const result = auditK14RoofCrossings(candidate());
  assert.equal(result.ok, true);
  assert.equal(result.canApplyToViewer, false);
  assert.equal(result.canPublish, false);
});
