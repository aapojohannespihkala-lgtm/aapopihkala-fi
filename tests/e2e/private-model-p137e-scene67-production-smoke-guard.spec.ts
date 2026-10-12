import { expect, test } from '@playwright/test';
// @ts-ignore - exact production workflow consumes the same untyped ESM helper.
import {
  inspectP137EScene67ProductionSmoke,
  P137E_SCENE67_PRODUCTION_DATASET,
  P137E_SCENE67_PRODUCTION_SMOKE_ID,
  P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
} from '../../src/scripts/privateModelP137EScene67ProductionSmokeGuard.mjs';

const source = () => ({ ...P137E_SCENE67_PRODUCTION_DATASET });
const verify = (dataset: Record<string, string>) =>
  inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    dataset,
  );

test('source-bound scene67 evidence is metadata-only, not 3/3 pixels or human approval', () => {
  const proof = verify(source());
  expect(proof).toMatchObject({
    candidateId: P137E_SCENE67_PRODUCTION_SMOKE_ID,
    sourceMetadataMatched: true,
    sceneIndex: 67,
    originalWallNode: 798,
    originalWallMesh: 406,
    expectedDeviceCount: 3,
    glbBytesAuthenticatedByThisGate: false,
    individualDevicePixelsVerified: false,
    publishToCURRENT: false,
    humanReview: 'NOT_RUN',
  });
});

test('unrelated review does not inherit P137E-only invariants', () => {
  expect(inspectP137EScene67ProductionSmoke('other-review', 'other-candidate', {}))
    .toBeNull();
});

test('missing canvas dataset fails before production review evidence', () => {
  expect(() => verify(null as unknown as Record<string, string>)).toThrow(/dataset missing/);
});

test('review/candidate swap is never accepted', () => {
  expect(() => inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID, 'another-candidate', source(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67ProductionSmoke(
    'another-review', P137E_SCENE67_PRODUCTION_SMOKE_ID, source(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID + '-forged',
    P137E_SCENE67_PRODUCTION_SMOKE_ID + '-forged', source(),
  )).toThrow(/identity mismatch/);
});

test('wrong default scene or focused original wall identity fails', () => {
  for (const [key, bad] of [
    ['p137eSceneIndex', '64'],
    ['p137eFocusedRootCount', '4'],
    ['p137eOriginalSourceWallNode', '799'],
    ['p137eOriginalSourceWallMesh', '407'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('missing or duplicate Themo count and nonempty room footprint fail', () => {
  for (const [key, bad] of [
    ['p137eWallMountedThemoCount', '2'],
    ['p137eWallMountedThemoCount', '4'],
    ['p137eRoomFootprintCount', '7'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('WORK_TEST cannot be reclassified as CURRENT or as-built', () => {
  for (const [key, bad] of [
    ['p137eWorkTestOnly', 'false'],
    ['p137eCurrentClaim', 'true'],
    ['p137eCanonical', 'true'],
    ['p137eAsBuiltClaim', 'true'],
    ['p137eExactXYClaim', 'true'],
    ['p137eExactZClaim', 'true'],
    ['p137eHumanReview', 'PASS'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('wrong floor, camera and fake autoload fail', () => {
  for (const [key, bad] of [
    ['contentFloor', '2F'],
    ['p137eReviewCameraMode', 'ORTHOGRAPHIC_OTHER'],
    ['workTestReviewAutoload', 'false'],
    ['modelSource', 'current'],
    ['workTestReviewCandidate', 'other'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});
