import { expect, test } from '@playwright/test';
import {
  placementG2DocumentId,
  resolvePlacementG2Context,
  type G2PlacementReviewTarget,
} from '../../src/scripts/privateModelReviewPlacementG2Context';

const target: G2PlacementReviewTarget = {
  reviewTargetId: 'D1F_USER_CURRENT_DOOR_A',
  sourceRecordId: 'D1F_USER_CURRENT_DOOR_A',
  apartment: 'D',
  floor: '1F',
  coordinateFrame: 'YLIS-G1-LOCAL',
  identityKind: 'USER_CURRENT_ONLY_REVIEW_ID',
  sourceG2Id: null,
  wallHosts: [],
};
const source = (records: G2PlacementReviewTarget[]) => ({
  documentId: placementG2DocumentId,
  revisionId: 'G2_TEST_REVISION_01',
  targets: records,
});
const check = (records: G2PlacementReviewTarget[], floor: '1F' | '2F' = '1F') =>
  resolvePlacementG2Context({
    targetId: target.reviewTargetId, floor, readG2: async () => source(records),
  });

test('P137E keeps the G2 current-only reviewDoorId and does not mint G2_DOOR IDs', async () => {
  expect(await check([target])).toMatchObject({
    status: 'REVIEW_CONTEXT_READY',
    context: { targetId: target.reviewTargetId, floor: '1F', approvedWallHosts: [] },
    evidence: { identityKind: 'USER_CURRENT_ONLY_REVIEW_ID',
      sourceRecordId: target.sourceRecordId, exactPhysicalPlacement: false },
  });
  expect((await check([{ ...target, sourceG2Id: 'G2_DOOR_SYNTHETIC' }])).status)
    .toBe('TARGET_SOURCE_CONFLICT');
});

test('P137E rejects wrong floor, duplicates and mismatched readback', async () => {
  expect((await check([target], '2F')).status).toBe('TARGET_SOURCE_CONFLICT');
  expect((await check([target, target])).status).toBe('DUPLICATE_TARGET');
  expect((await resolvePlacementG2Context({
    targetId: target.reviewTargetId, floor: '1F',
    readG2: async () => ({ ...source([target]), documentId: 'WRONG_G2_DOC' }),
  })).status).toBe('SOURCE_UNAVAILABLE');
});

test('P137E refuses unapproved walls and unknown opening coverage', async () => {
  const wall = {
    g2Id: 'G2_WALL_TEST', floor: '1F' as const,
    coordinateFrame: 'YLIS-G1-LOCAL' as const,
    approvalEvidenceId: 'EVIDENCE_TEST', approved: true as const,
    axis: 'Y_FIXED' as const, fixedM: 5, startM: 2, endM: 6,
    openingsComplete: true, openings: [{ startM: 3, endM: 4 }],
  };
  expect(await check([{ ...target, wallHosts: [
    { ...wall, approved: false as true },
    { ...wall, openingsComplete: false },
  ] }])).toMatchObject({
    status: 'REVIEW_CONTEXT_READY',
    context: { approvedWallHosts: [] },
    evidence: { verifiedWallCount: 0 },
  });
  expect(await check([{ ...target, wallHosts: [wall] }])).toMatchObject({
    status: 'REVIEW_CONTEXT_READY',
    context: { approvedWallHosts: [{ g2Id: 'G2_WALL_TEST', openings: [{ startM: 3, endM: 4 }] }] },
    evidence: { verifiedWallCount: 1 },
  });
});

test('P137E permits exact G2 source review identities but not mismatched source IDs', async () => {
  const known = {
    ...target, reviewTargetId: 'G2_DOOR_INT_D_1F_WC_001',
    sourceRecordId: 'G2_DOOR_INT_D_1F_WC_001',
    identityKind: 'SOURCE_G2_ID' as const,
    sourceG2Id: 'G2_DOOR_INT_D_1F_WC_001',
  };
  const request = (record: typeof known) => resolvePlacementG2Context({
    targetId: known.reviewTargetId, floor: '1F', readG2: async () => source([record]),
  });
  expect((await request(known)).status).toBe('REVIEW_CONTEXT_READY');
  expect((await request({ ...known, sourceG2Id: 'OTHER' })).status)
    .toBe('TARGET_SOURCE_CONFLICT');
});

test('P137E invalid opening items cannot create approved wall', async () => {
  const invalid = { g2Id: 'G2_WALL_TEST', floor: '1F', coordinateFrame: 'YLIS-G1-LOCAL', approvalEvidenceId: 'EVIDENCE_TEST', approved: true, axis: 'Y_FIXED', fixedM: 5, startM: 2, endM: 6, openingsComplete: true, openings: [null] };
  const result = await check([{ ...target, wallHosts: [invalid as unknown as G2PlacementReviewTarget['wallHosts'][number]] }]);
  expect(result).toMatchObject({ status: 'REVIEW_CONTEXT_READY', context: { approvedWallHosts: [] } });
});
