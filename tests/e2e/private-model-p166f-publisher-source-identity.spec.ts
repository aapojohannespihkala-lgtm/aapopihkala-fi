import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
  isPrivateWorkTestPath,
} from '../../worker/privateWorkTest';

const id = 'p166f-lightwell-proxies';
const size = 2_030_604;
const sha = '3b1e2158408937be1f11a27b16eae605204d5aa2184c7d513f6883d92a430f0a';
const fileId = '1dDxcJFkLIn7JU_6msVgQVQYOurqv_L4c';

test('P166F machine manifest maps to exact Worker source bytes and WORK_TEST path', () => {
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8')) as {
    candidates: Record<string, { driveFileId: string }>;
  };
  expect(manifest.candidates[id]).toEqual({ driveFileId: fileId });

  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).not.toBeNull();
  expect(candidate?.id).toBe(id);
  expect(candidate?.label).toMatch(/WORK_TEST/);
  expect(candidate?.path).toBe('/private-model/work-test/p166f-lightwell-proxies.glb');
  expect(candidate?.objectKey).toBe('work-test/p166f-lightwell-proxies.glb');
  expect(candidate?.expectedSize).toBe(size);
  expect(candidate?.expectedSha256).toBe(sha);
});

test('P166F machine PUT and verify GET resolve the same immutable candidate', () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).toBeTruthy();
  const publish = `/private-model/work-test/publish/${id}.glb`;
  const verify = `/private-model/work-test/verify/${id}.glb`;
  expect(isPrivateWorkTestPath(publish)).toBe(true);
  expect(getPrivateWorkTestPublishCandidate(publish)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(verify)).toBe(candidate);
});

test('P166F refuses forged IDs, alternate paths and CURRENT promotion', () => {
  expect(getPrivateWorkTestPublishCandidate('/private-model/work-test/publish/p166f-lightwell-proxies-fake.glb')).toBeNull();
  expect(getPrivateWorkTestVerifyCandidate('/private-model/work-test/verify/p166f-lightwell-proxies-fake.glb')).toBeNull();
  expect(getPrivateWorkTestPublishCandidate('/private-model/work-test/publish/p166f-lightwell-proxies.json')).toBeNull();
  expect(getPrivateWorkTestPublishCandidate('/private-model/work-test/upload/p166f-lightwell-proxies.glb')).toBeNull();
  expect(getPrivateWorkTestCandidateById('current-model')).toBeNull();
  expect(getPrivateWorkTestCandidateById(id)?.path).not.toBe('/private-model/model.glb');
});
