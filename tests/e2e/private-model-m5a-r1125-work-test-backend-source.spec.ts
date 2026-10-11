import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  getPrivateWorkTestCandidate,
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestUploadCandidate,
  getPrivateWorkTestVerifyCandidate,
  validatePrivateWorkTestUploadBytes,
} from '../../worker/privateWorkTest';
import {
  getRequestedReviewCandidateId,
  m5aZ2R1125CandidateId,
  m5aZ2R1125ReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  m5aR1125SourceDriveId,
  m5aR1125SourceSha256,
  m5aR1125SourceSceneIndex,
} from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';

const id = 'm5a-r1125-pvk-diameter-source-split';
const driveId = '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs';
const sha256 = 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';
const byteLength = 3_112_432;
const pathOnHost = `/private-model/work-test/${id}.glb`;
const sourceRegistry = JSON.parse(readFileSync(
  path.join(process.cwd(), '.github', 'work-test-candidates.json'),
  'utf8',
)) as { version: number; candidates: Record<string, { driveFileId: string }> };

test('R1125 exact candidate, Drive source, browser review and machine registry stay 1:1', () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).toEqual({
    id,
    label: 'M5A R1125 5 salaoja nominal D100 + 2 PVK diameter UNKNOWN - WORK_TEST',
    path: pathOnHost,
    objectKey: `work-test/${id}.glb`,
    expectedSize: byteLength,
    expectedSha256: sha256,
  });
  expect(getPrivateWorkTestCandidate(pathOnHost)).toEqual(candidate);
  expect(getPrivateWorkTestUploadCandidate(`/private-model/work-test/upload/${id}.glb`))
    .toEqual(candidate);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.glb`))
    .toEqual(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}.glb`))
    .toEqual(candidate);
  expect(sourceRegistry.version).toBe(1);
  expect(sourceRegistry.candidates[id]).toEqual({ driveFileId: driveId });
  expect(m5aZ2R1125CandidateId).toBe(id);
  expect(m5aZ2R1125ReviewId).toBe(`${id}-review`);
  expect(getRequestedReviewCandidateId(`?review=${m5aZ2R1125ReviewId}`)).toBe(id);
  expect(m5aR1125SourceDriveId).toBe(driveId);
  expect(m5aR1125SourceSha256).toBe(sha256);
  expect(m5aR1125SourceSceneIndex).toBe(63);
});

test('R1125 Work Test never substitutes guessed bytes or leaks a CURRENT path', async () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).not.toBeNull();
  if (!candidate) throw new Error('M5A R1125 candidate absent');
  expect(candidate.objectKey).toMatch(/^work-test\//);
  expect(candidate.path).not.toMatch(/\/private-model\/model\.glb$/);
  expect(getPrivateWorkTestCandidateById('current-model')).toBeNull();
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(10).buffer, candidate))
    .toBe('upload-size-mismatch');
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(byteLength).buffer, candidate))
    .toBe('upload-sha256-mismatch');
});

test('R1125 one-link URL never carries unsafe transport or human approval state', () => {
  const url = new URL(`https://aapopihkala.fi/private-model/?review=${m5aZ2R1125ReviewId}`);
  expect([...url.searchParams.keys()]).toEqual(['review']);
  expect(url.pathname).toBe('/private-model/');
  for (const parameter of ['src', 'file', 'glb', 'upload', 'model', 'current', 'asBuilt', 'canonical', 'humanReview', 'readyForHumanReview']) {
    expect(url.searchParams.has(parameter)).toBe(false);
  }
  // This URL is an identity contract, NOT an assertion of deployed autoload or pixels.
});
