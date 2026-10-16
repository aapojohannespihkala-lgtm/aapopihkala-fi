import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidate, getPrivateWorkTestCandidateById, getPrivateWorkTestPublishCandidate, getPrivateWorkTestVerifyCandidate, validatePrivateWorkTestUploadBytes } from '../../worker/privateWorkTest';
import { getRequestedReviewCandidateId, d1fShowerGlassPhotoCandidateId, d1fShowerGlassPhotoReviewId } from '../../src/scripts/privateModelWorkTest';
// @ts-ignore - narrow GLB source contract is tested independently against the original artifact.
import { D1F_SHOWER_PHOTO_SOURCE, D1F_SHOWER_PHOTO_VARIANTS } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
const id = 'd1f-shower-glass-photo-20261016';
const driveFileId = '1OrL1RVnM7jfAx9aTLn2rEgs0zOuAXdf0';
const size = 8914072;
const sha = '992819363a6e368546e870f9ff2a17ddf0904e760269fc20aec509aa310ba35e';

test('new D1F shower WORK_TEST source has exactly one Drive identity across publisher and private catalog routes', () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).toMatchObject({ id, path:`/private-model/work-test/${id}.glb`,
    objectKey:`work-test/${id}.glb`, expectedSize:size, expectedSha256:sha });
  expect(candidate?.label).toContain('WORK_TEST');
  expect(registry.candidates[id]).toEqual({driveFileId});
  expect(D1F_SHOWER_PHOTO_SOURCE).toMatchObject({driveFileId,bytes:size,sha256:sha,sceneCount:124,defaultScene:120,
    workTestOnly:true,humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false});
  expect(D1F_SHOWER_PHOTO_VARIANTS.map((v:any)=>v.sceneIndex)).toEqual([120,121,122,123]);
  expect(getPrivateWorkTestCandidate(`/private-model/work-test/${id}.glb`)).toEqual(candidate);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.glb`)).toEqual(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}.glb`)).toEqual(candidate);
});

test('one-link review route resolves only the 124-scene successor without changing CURRENT', () => {
  expect(d1fShowerGlassPhotoCandidateId).toBe(id);
  expect(d1fShowerGlassPhotoReviewId).toBe(`${id}-review`);
  expect(getRequestedReviewCandidateId(`?review=${d1fShowerGlassPhotoReviewId}`)).toBe(id);
  expect(getRequestedReviewCandidateId('?review=current-model-review')).toBe('current-model');
  expect(getPrivateWorkTestCandidateById('current-model')).toBeNull();
  expect(getPrivateWorkTestPublishCandidate('/private-model/work-test/publish/current.glb')).toBeNull();
  expect(getPrivateWorkTestCandidateById('d1f-shower-glass-photo-20261016-current')).toBeNull();
  expect(getPrivateWorkTestCandidateById('d1f-wc-closed-lid-450-20261016')?.expectedSha256).not.toBe(sha);
});

test('tampered bytes cannot pass exact source upload even with correct length', async () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  if (!candidate) throw new Error('missing candidate');
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(24).buffer,candidate)).toBe('upload-size-mismatch');
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(size).buffer,candidate)).toBe('upload-sha256-mismatch');
});

test('canonical machine publisher retains the existing single Drive-ID registry and no CURRENT alias', () => {
  const workflow = readFileSync('.github/workflows/publish-work-test.yml','utf8');
  expect(workflow).toContain('.github/work-test-candidates.json');
  expect(workflow).toContain('DRIVE_FILE_ID');
  expect(Object.values(registry.candidates).filter((v:any)=>v.driveFileId===driveFileId)).toHaveLength(1);
});
