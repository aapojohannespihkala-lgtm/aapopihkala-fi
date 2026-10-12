import { expect, test } from '@playwright/test';
// @ts-ignore - strict production helper is ESM without a declaration file.
import {
  inspectM5AR1125ProductionGlbAsset as inspect,
  M5A_R1125_CANDIDATE_ID,
  M5A_R1125_REVIEW_ID,
  M5A_R1125_PRODUCTION_URL,
  M5A_R1125_SOURCE_BYTES,
  M5A_R1125_SOURCE_SHA256,
} from '../../src/scripts/privateModelM5AR1125ProductionGlbIdentity.mjs';

const correctAsset = () => ({
  url: M5A_R1125_PRODUCTION_URL,
  status: 200,
  redirected: false,
  byteLength: M5A_R1125_SOURCE_BYTES,
  sha256: M5A_R1125_SOURCE_SHA256,
});
const check = (asset: ReturnType<typeof correctAsset> | null) =>
  inspect(M5A_R1125_REVIEW_ID, M5A_R1125_CANDIDATE_ID, asset);

test('R1125 production asset requires original exact source GLB and stays noncurrent', () => {
  const result = check(correctAsset());
  expect(result).toMatchObject({
    exactSourceSceneIndex: 63,
    sourceTargets: 13,
    productionAssetExactBytesVerified: true,
    viewerLoadedSameBytesVerified: false,
    individual13TargetPixelsVerified: false,
    bytes: 3112432,
    sha256: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    publishToCURRENT: false,
    physicalDiameterVerified: false,
    humanReview: 'NOT_RUN',
  });
});

test('R1125 wrong route, access redirect, bad HTTP status, truncation and hash fail closed', () => {
  const valid = correctAsset();
  for (const changed of [
    { ...valid, url: 'https://aapopihkala.fi/private-model/work-test/other.glb' },
    { ...valid, url: 'https://invalid.example/private-model/work-test/m5a-r1125-pvk-diameter-source-split.glb' },
    { ...valid, redirected: true },
    { ...valid, status: 302 },
    { ...valid, status: 403 },
    { ...valid, byteLength: valid.byteLength - 1 },
    { ...valid, byteLength: valid.byteLength + 1 },
    { ...valid, sha256: valid.sha256.toUpperCase() },
    { ...valid, sha256: '0'.repeat(64) },
  ]) {
    expect(() => check(changed)).toThrow(/exact URL, HTTP status, redirect, full byte length or SHA256 mismatch/);
  }
  expect(() => check(null)).toThrow(/exact URL/);
});

test('R1125 exact review and candidate must match, other candidates unaffected', () => {
  const asset = correctAsset();
  expect(inspect('unrelated-review', 'unrelated', asset)).toBeNull();
  expect(() => inspect(M5A_R1125_REVIEW_ID + '-alias', M5A_R1125_CANDIDATE_ID, asset))
    .toThrow(/candidate or review identity mismatch/);
  expect(() => inspect(M5A_R1125_REVIEW_ID, M5A_R1125_CANDIDATE_ID + '-alias', asset))
    .toThrow(/candidate or review identity mismatch/);
  expect(() => inspect('unrelated-review', M5A_R1125_CANDIDATE_ID, asset))
    .toThrow(/candidate or review identity mismatch/);
});

test('R1125 cannot accept user-provided readiness in place of actual asset evidence', () => {
  expect(() => check({ ...correctAsset(), sha256: undefined } as unknown as ReturnType<typeof correctAsset>))
    .toThrow(/SHA256 mismatch/);
});
