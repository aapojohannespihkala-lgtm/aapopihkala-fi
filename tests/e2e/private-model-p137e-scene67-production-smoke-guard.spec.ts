import { expect, test } from '@playwright/test';
// @ts-ignore - exact production workflow consumes the same untyped ESM helper.
import {
  inspectP137EScene67ProductionSmoke,
  inspectP137EScene67PublishedGlb,
  P137E_SCENE67_EXPECTED_GLB_BYTES,
  P137E_SCENE67_EXPECTED_GLB_SHA256,
  P137E_SCENE67_PRODUCTION_GLB_URL,
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


const assetEvidence = () => ({
  url: P137E_SCENE67_PRODUCTION_GLB_URL,
  status: 200,
  byteLength: P137E_SCENE67_EXPECTED_GLB_BYTES,
  sha256: P137E_SCENE67_EXPECTED_GLB_SHA256,
});
const verifyAsset = (details = assetEvidence()) =>
  inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    details,
  );

test('published scene67 byte gate proves exact fetched asset but not visible devices', () => {
  const proof = verifyAsset();
  expect(proof).toMatchObject({
    productionAssetExactBytesVerified: true,
    browserCanvasUsesTheseBytesVerified: false,
    individualDevicePixelsVerified: false,
    humanReview: 'NOT_RUN',
    publishToCURRENT: false,
    bytes: 3_258_268,
    sha256: '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d',
  });
});

test('published scene67 byte gate rejects auth redirects, truncated and changed bytes', () => {
  const valid = assetEvidence();
  for (const invalid of [
    { ...valid, status: 302 },
    { ...valid, status: 403 },
    { ...valid, url: 'https://aapopihkala.fi/cdn-cgi/access/login' },
    { ...valid, url: 'https://evil.example/private-model/work-test/p137e-d1f-three-wall-mounted-themos.glb' },
    { ...valid, byteLength: valid.byteLength - 1 },
    { ...valid, sha256: '0'.repeat(64) },
    { ...valid, sha256: valid.sha256.toUpperCase() },
  ]) {
    expect(() => verifyAsset(invalid)).toThrow(/production GLB URL, HTTP status, full length or SHA256 mismatch/);
  }
});

test('published GLB verification is exact-candidate only, no alias or review promotion', () => {
  expect(inspectP137EScene67PublishedGlb('other-review', 'other', null)).toBeNull();
  expect(() => inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID + '-forged',
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    assetEvidence(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID + '-forged',
    assetEvidence(),
  )).toThrow(/identity mismatch/);
  expect(() => verifyAsset(null as unknown as ReturnType<typeof assetEvidence>))
    .toThrow(/production GLB/);
});
