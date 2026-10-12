import { expect, test } from '@playwright/test';
import {
  crossBindP137ER989CurrentThemosToScene67,
  p137eR989G2DocumentId,
  p137eScene67DriveId,
  p137eScene67Sha256,
  p137eScene67ByteSize,
  p137eScene67CurrentReviewIds,
} from '../../src/scripts/privateModelP137ER989Scene67CrossBinding';

const source = (): { documentId: string; revisionId: string; targets: Array<Record<string, unknown>> } => ({
  documentId: p137eR989G2DocumentId,
  revisionId: 'G2_R989_FRESH_TRUSTED_REVISION',
  targets: [
    ...p137eScene67CurrentReviewIds.map(id => ({
      reviewTargetId: id,
      sourceRecordId: id,
      apartment: 'D',
      floor: '1F',
      coordinateFrame: 'YLIS-G1-LOCAL',
      identityKind: 'USER_CURRENT_ONLY_REVIEW_ID',
      sourceG2Id: null,
      wallHosts: [] as unknown[],
    })),
  ],
});
const scene = () => ({
  sceneIndex: 67,
  sourceWallNode: 798,
  sourceWallMesh: 406,
  logicalDeviceIds: [...p137eScene67CurrentReviewIds],
  representationKind: 'P137E_SOURCE_WALL_AND_THREE_THEMOS_WORK_TEST',
  humanReview: 'NOT_RUN',
  currentGeometry: false,
  canonical: false,
  asBuilt: false,
});
const candidate = () => ({
  driveFileId: p137eScene67DriveId,
  byteSize: p137eScene67ByteSize,
  sha256: p137eScene67Sha256,
});
const verify = (args: {
  g2?: unknown;
  selection?: unknown;
  candidate?: unknown;
} = {}) => crossBindP137ER989CurrentThemosToScene67({
  g2: args.g2 ?? source(),
  selection: args.selection ?? scene(),
  candidate: args.candidate ?? candidate(),
});

test('three source-bound current R989 Themos match the focused original P123C scene67', () => {
  const output = verify();
  expect(output.status).toBe('SOURCE_IDENTITIES_MATCH_WORK_TEST_ONLY');
  expect(output.documentId).toBe(p137eR989G2DocumentId);
  expect(output.revisionId).toBe('G2_R989_FRESH_TRUSTED_REVISION');
  expect(output.logicalDeviceIds).toEqual([...p137eScene67CurrentReviewIds]);
  expect(new Set(output.logicalDeviceIds).size).toBe(3);
  expect(output.candidateDriveId).toBe('17FqR79AIjJhScxdydK0HG1RX0P53e0wf');
  expect(output.wallSourceNode).toBe(798);
  expect(output.wallSourceMesh).toBe(406);
  expect(output).toMatchObject({
    sourceByteAuthentication: 'EXTERNAL_GATE_NOT_RUN',
    productionRender: 'NOT_RUN', humanReview: 'NOT_RUN',
    currentGeometry: false, canonical: false, asBuilt: false,
  });
  expect(Object.isFrozen(output)).toBe(true);
  expect(Object.isFrozen(output.logicalDeviceIds)).toBe(true);
});

test('cannot confuse latest persisted survivor with old parent or changed bytes', () => {
  for (const mutant of [
    { driveFileId: '1gtAdJRncQ5qgwO6YRZ7zpwt2ZsTIjPhx' },
    { byteSize: 3258264 },
    { sha256: 'd691dd756b0b1b2b95b68251b5d1fddfa6bc67c94b7ddb253bb1c3318c490b9c' },
    { sha256: '0'.repeat(64) },
  ]) {
    expect(() => verify({ candidate: { ...candidate(), ...mutant } }))
      .toThrow('persisted WORK_TEST candidate identity');
  }
});

test('G2 native identity must have an actual revision and exactly three devices', () => {
  expect(() => verify({ g2: { ...source(), documentId: 'wrong-doc' } }))
    .toThrow('native G2 R989 revision');
  expect(() => verify({ g2: { ...source(), revisionId: '  ' } }))
    .toThrow('native G2 R989 revision');
  expect(() => verify({ g2: { ...source(), targets: source().targets.slice(0, 2) } }))
    .toThrow('native G2 R989 revision');
  expect(() => verify({ g2: { ...source(), targets: [...source().targets, source().targets[0]] } }))
    .toThrow('native G2 R989 revision');
});

test('G2 forbids duplicate IDs and former R1009 room-anchor aliases', () => {
  const duplicate = source();
  duplicate.targets[1] = { ...duplicate.targets[1], ...{
    reviewTargetId: duplicate.targets[0].reviewTargetId,
    sourceRecordId: duplicate.targets[0].sourceRecordId,
  } };
  expect(() => verify({ g2: duplicate })).toThrow('G2 target identity');
  const alias = source();
  alias.targets[1] = { ...alias.targets[1],
    reviewTargetId: 'D_THEMO_BEDROOM_CURRENT_01',
    sourceRecordId: 'D_THEMO_BEDROOM_CURRENT_01',
  };
  expect(() => verify({ g2: alias })).toThrow('G2 target identity');
});

test('cross-binding does not mint geometry, wall hosts or historical electrical groups', () => {
  for (const mutation of [
    { wallHosts: [{ g2Id: 'guessed-wall', approved: true }] },
    { sourceG2Id: '2015-GROUP-10.3' },
    { identityKind: 'SOURCE_G2_ID' },
    { floor: '2F' },
    { coordinateFrame: 'D15-LOCAL' },
    { apartment: 'A' },
    { sourceRecordId: 'different-current-device' },
    { xM: 3.2 },
    { asBuilt: true },
    { sourceGroupKey: '10.3' },
  ]) {
    const changed = source();
    changed.targets[1] = { ...changed.targets[1], ...mutation };
    expect(() => verify({ g2: changed })).toThrow('G2 target identity');
  }
});

test('scene67 original wall, device ordering and representation are exact', () => {
  const mutations = [
    { sceneIndex: 66 },
    { sourceWallNode: 1106 },
    { sourceWallMesh: 407 },
    { logicalDeviceIds: [p137eScene67CurrentReviewIds[0], p137eScene67CurrentReviewIds[1]] },
    { logicalDeviceIds: [p137eScene67CurrentReviewIds[1], p137eScene67CurrentReviewIds[0], p137eScene67CurrentReviewIds[2]] },
    { logicalDeviceIds: [p137eScene67CurrentReviewIds[0], p137eScene67CurrentReviewIds[1], 'D_THEMO_BATHROOM_CURRENT_01'] },
    { representationKind: 'referenceFootprint' },
  ];
  for (const mutation of mutations) {
    expect(() => verify({ selection: { ...scene(), ...mutation } }))
      .toThrow('P123C original wall');
  }
});

test('a G2 target match never upgrades human review, CURRENT or as-built', () => {
  for (const mutation of [
    { humanReview: 'PASS' },
    { currentGeometry: true },
    { canonical: true },
    { asBuilt: true },
  ]) {
    expect(() => verify({ selection: { ...scene(), ...mutation } }))
      .toThrow('P123C original wall');
  }
  const output = verify();
  expect(JSON.stringify(output)).not.toMatch(/"exactXY":true|"exactZ":true/);
  expect(JSON.stringify(output)).toContain('"productionRender":"NOT_RUN"');
});
