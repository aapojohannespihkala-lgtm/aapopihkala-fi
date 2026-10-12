import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
  isPrivateWorkTestPath,
} from '../../worker/privateWorkTest';

const id = 'p137e-d1f-three-wall-mounted-themos';
const expectedPath = `/private-model/work-test/${id}.glb`;

// Regression for publish run 38187656750: a candidate present only in the
// machine manifest fell through the Worker PUT router and returned HTTP 405.
test('P137E scene67 raw Drive identity is allowlisted by the actual Worker publish route', () => {
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8')) as {
    candidates: Record<string, { driveFileId: string }>;
  };
  expect(manifest.candidates[id]).toEqual({ driveFileId: '17FqR79AIjJhScxdydK0HG1RX0P53e0wf' });

  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).not.toBeNull();
  expect(candidate?.id).toBe(id);
  expect(candidate?.path).toBe(expectedPath);
  expect(candidate?.objectKey).toBe(`work-test/${id}.glb`);
  expect(candidate?.expectedSize).toBe(3_258_268);
  expect(candidate?.expectedSha256).toBe('07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d');
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}.glb`)).toBe(candidate);
});

test('P137E publish allowlist stays bounded and cannot alias unknown candidates', () => {
  expect(isPrivateWorkTestPath(`/private-model/work-test/publish/${id}.glb`)).toBe(true);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}-forged.glb`)).toBeNull();
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.json`)).toBeNull();
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/upload/${id}.glb`)).toBeNull();
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}-forged.glb`)).toBeNull();
});
