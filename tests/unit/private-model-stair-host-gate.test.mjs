import assert from 'node:assert/strict';
import test from 'node:test';
import { decideStairPresentation as decide } from '../../src/scripts/privateModelStairHostGate.mjs';

const sha = 'a'.repeat(64);
const fixture = () => ({
  floor: 'BOTH',
  selectedModel: { zipSha256: sha, sceneIndex: 33, modelKind: 'PHYSICAL_MAIN_WORK_TEST' },
  expected: { zipSha256: sha, sceneIndex: 33, objectKey: 'G2_STAIR_D_001' },
  stairScope: { objectKey: 'G2_STAIR_D_001', apartmentScope: 'D', storeyScope: 'BOTH',
    role: 'VERTICAL_CONNECTOR', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' },
  hostProof: {
    zipSha256: sha, sceneIndex: 33, objectKey: 'G2_STAIR_D_001',
    evidenceDocId: 'DOC:fixture12345', k17Integrated: true,
    activeStairTreads: 14, correctedRailAndLowWallParts: 6,
    visibleLegacy1000mmWalls: 0, noDuplicateActiveMeshes: true,
    stairHostGeometry: 'PASS', upperFloorOpeningGeometry: 'PASS',
    lightwellClearanceGeometry: 'PASS', noOtherApartmentLeak: true,
  },
  parts: { zipSha256: sha, sceneIndex: 33, parentObjectKey: 'G2_STAIR_D_001',
    provenance: 'SOURCE_ANCHORED_SEGMENTS',
    '1F': ['stair-1F-01', 'stair-1F-02'], '2F': ['stair-2F-01'],
    reference: { '1F': ['stair-1F-02'], '2F': ['stair-2F-01'] },
  },
});
const change = (callback) => { const x = fixture(); callback(x); return x; };
test('reject invalid floor or omitted identity', () => {
  assert.equal(decide({}).reason, 'INVALID_FLOOR');
  assert.equal(decide({ floor: '1F' }).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
});
test('reject incompatible ZIP hash and wrong selected scene', () => {
  assert.equal(decide(change(x => { x.expected.zipSha256 = 'b'.repeat(64); })).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
  assert.equal(decide(change(x => { x.selectedModel.sceneIndex = 54; })).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
});
test('reject donor masquerading as integrated main model', () => {
  assert.equal(decide(change(x => { x.selectedModel.modelKind = 'DONOR_SCENE'; })).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
});
test('reject UNKNOWN, historical, cross-apartment and invalid scope', () => {
  for (const [k, v] of [['apartmentScope', 'UNKNOWN'], ['apartmentScope', 'C'],
    ['storeyScope', 'UNKNOWN'], ['role', 'UNCLASSIFIED'], ['phaseScope', 'HISTORICAL']]) {
    assert.equal(decide(change(x => { x.stairScope[k] = v; })).reason, 'T05_SCOPE_NOT_VERIFIED');
  }
});
test('fail closed if host proof references wrong model', () => {
  assert.equal(decide(change(x => { x.hostProof.zipSha256 = 'b'.repeat(64); })).reason, 'T05_HOST_PROOF_NOT_VERSION_BOUND');
  assert.equal(decide(change(x => { x.hostProof.evidenceDocId = ''; })).reason, 'T05_HOST_PROOF_NOT_VERSION_BOUND');
});
test('K16a-like model without integrated K17 cannot claim D BOTH', () => {
  const x = change(x => { x.hostProof.k17Integrated = false; });
  assert.equal(decide(x).reason, 'K17_NOT_INTEGRATED_OR_HOST_UNVERIFIED');
  assert.deepEqual(decide(x).primaryKeys, []);
});
test('physical host must show 14 treads, 6 corrected parts, zero legacy duplicates', () => {
  for (const [k, v] of [['activeStairTreads', 13], ['correctedRailAndLowWallParts', 5],
    ['visibleLegacy1000mmWalls', 2], ['noDuplicateActiveMeshes', false]]) {
    assert.equal(decide(change(x => { x.hostProof[k] = v; })).status, 'HOST_HOLD');
  }
});
test('2F opening, lightwell, stair host and apartment leak must be verified', () => {
  for (const [k, v] of [['upperFloorOpeningGeometry', 'UNKNOWN'],
    ['lightwellClearanceGeometry', 'UNKNOWN'], ['stairHostGeometry', 'NOT_RUN'],
    ['noOtherApartmentLeak', false]]) {
    assert.equal(decide(change(x => { x.hostProof[k] = v; })).ok, false);
  }
});
test('WHOLE preserves original physical scene even if K17 unintegrated, with visible HOLD', () => {
  const x = change(x => { x.floor = 'WHOLE'; x.hostProof.k17Integrated = false; });
  const result = decide(x);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'HOST_HOLD');
  assert.equal(result.render, 'PRESERVE_SELECTED_MAIN_SCENE');
  assert.equal(result.canPublish, false);
});
test('D BOTH shows exactly one verified stair connector, never publishes', () => {
  const result = decide(fixture());
  assert.equal(result.status, 'PASS_SCOPED');
  assert.equal(result.render, 'SHOW_ONE_VERIFIED_CONNECTOR');
  assert.deepEqual(result.primaryKeys, ['G2_STAIR_D_001']);
  assert.equal(result.canPublish, false);
  assert.equal(result.asBuilt, false);
});
test('1F and 2F require disjoint, source-anchored segments, not raw height thresholds', () => {
  for (const f of ['1F', '2F']) {
    const result = decide(change(x => { x.floor = f; }));
    assert.equal(result.ok, true);
    assert.equal(result.referenceKeys.length, 0);
  }
  assert.equal(decide(change(x => { x.floor = '1F'; delete x.parts; })).reason, 'T05_FLOOR_SEGMENTATION_NOT_VERIFIED');
  assert.equal(decide(change(x => { x.floor = '2F'; x.parts['2F'] = ['stair-1F-01']; })).status, 'HOST_HOLD');
  assert.equal(decide(change(x => { x.floor = '1F'; x.parts.provenance = 'RAW_WORLD_Y_THRESHOLD'; })).status, 'HOST_HOLD');
});
test('opposite-floor reference is explicit and must be a subset of verified other floor', () => {
  const good = decide(change(x => { x.floor = '1F'; x.showReference = true; }));
  assert.deepEqual(good.referenceKeys, ['stair-2F-01']);
  const bad = decide(change(x => { x.floor = '1F'; x.showReference = true; x.parts.reference['2F'] = ['unknown-2F']; }));
  assert.equal(bad.reason, 'T05_REFERENCE_SEGMENT_NOT_VERIFIED');
});
test('pure gate does not alter evidence or source metadata', () => {
  const x = fixture(); const snapshot = structuredClone(x);
  decide(x);
  assert.deepEqual(x, snapshot);
});
test('malformed proof hashes are rejected without throwing', () => {
  assert.equal(decide(null).reason, 'INVALID_INPUT');
  assert.equal(decide(change(x => { x.hostProof.zipSha256 = 1234; })).status, 'HOST_HOLD');
  assert.equal(decide(change(x => { x.floor = '1F'; x.parts.zipSha256 = {}; })).status, 'HOST_HOLD');
});
test('WHOLE preserves current physical main scene when the K17 scope and proof are missing', () => {
  const x = fixture(); x.floor = 'WHOLE'; delete x.stairScope; delete x.hostProof;
  const result = decide(x);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'HOST_HOLD');
  assert.equal(result.render, 'PRESERVE_SELECTED_MAIN_SCENE');
  assert.deepEqual(result.primaryKeys, []);
  assert.equal(result.canPublish, false);
});
test('WHOLE still fails closed on an unverified physical-model version', () => {
  const x = fixture(); x.floor = 'WHOLE'; delete x.stairScope; delete x.hostProof;
  x.expected.zipSha256 = 'b'.repeat(64);
  const result = decide(x);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
});

test('SHA fields must be real strings, not coercible impostors', () => {
  const faux = { toString: () => sha };
  for (const field of ['zipSha256']) {
    const badSelected = change(x => { x.selectedModel[field] = faux; });
    const badExpected = change(x => { x.expected[field] = faux; });
    assert.equal(decide(badSelected).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
    assert.equal(decide(badExpected).reason, 'SELECTED_MAIN_MODEL_NOT_VERIFIED');
    const badProof = change(x => { x.hostProof[field] = faux; });
    assert.equal(decide(badProof).reason, 'T05_HOST_PROOF_NOT_VERSION_BOUND');
  }
});
