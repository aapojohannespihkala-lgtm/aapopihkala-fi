import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

import {
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
  isPrivateWorkTestPath,
} from '../../worker/privateWorkTest';
import { getRequestedReviewCandidateId } from '../../src/scripts/privateModelWorkTest';
// @ts-ignore - bounded ESM loader contract, shared with the actual viewer.
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

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

const measuredId = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';

test('measured walls and counter share one exact Drive, Worker and real-loader identity', () => {
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(manifest.candidates[measuredId]).toEqual({ driveFileId: '1i8w4k4VaDx3qDfGPcW1FpfKSP-afMTM6' });
  const candidate = getPrivateWorkTestCandidateById(measuredId);
  expect(candidate).toMatchObject({
    id: measuredId, path: `/private-model/work-test/${measuredId}.glb`,
    objectKey: `work-test/${measuredId}.glb`, expectedSize: 3_602_032,
    expectedSha256: '7da6b1e6ada391556ca3600346f1586ed2507ac86b4e489cb689e6e6cd11de71',
  });
  expect(D1F_COMBINED_WALL_ASSETS[measuredId].bytes).toBe(candidate?.expectedSize);
  expect(D1F_COMBINED_WALL_ASSETS[measuredId].sha256).toBe(candidate?.expectedSha256);
  expect(getRequestedReviewCandidateId(`?review=${measuredId}-review`)).toBe(measuredId);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${measuredId}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${measuredId}.glb`)).toBe(candidate);
});

test('measured successor cannot alias old walls or an unregistered model', () => {
  expect(getPrivateWorkTestCandidateById('d1f-combined-wall-115-100-20261013')).toMatchObject({
    expectedSize: 3_544_904,
    expectedSha256: '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2',
  });
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${measuredId}-forged.glb`)).toBeNull();
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${measuredId}.json`)).toBeNull();
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/upload/${measuredId}.glb`)).toBeNull();
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${measuredId}-forged.glb`)).toBeNull();
});


test('finished-face raw Drive bytes resolve through the same exact Worker publish and review path', () => {
  const id='d1f-finished-face-2360-wall-basin-20261014';
  const manifest=JSON.parse(readFileSync('.github/work-test-candidates.json','utf8'));
  expect(manifest.candidates[id]).toEqual({driveFileId:'1LinO0DkyqpbwO3kNmPfwLwcDmmKjbyg1'});
  const candidate=getPrivateWorkTestCandidateById(id);
  expect(candidate).toMatchObject({id,path:`/private-model/work-test/${id}.glb`,
    objectKey:`work-test/${id}.glb`,expectedSize:3654796,
    expectedSha256:'826633aba10b590935dc029358b1233957ab37ee7e167a5adfdab713617d8523'});
  expect(D1F_COMBINED_WALL_ASSETS[id].sha256).toBe(candidate?.expectedSha256);
  expect(getRequestedReviewCandidateId(`?review=${id}-review`)).toBe(id);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}.glb`)).toBe(candidate);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}-forged.glb`)).toBeNull();
});
