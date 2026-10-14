import { expect, test } from '@playwright/test';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  getPrivateWorkTestCandidateById,
  getPrivateWorkTestCandidate,
  getPrivateWorkTestPublishCandidate,
  getPrivateWorkTestVerifyCandidate,
  validatePrivateWorkTestUploadBytes,
} from '../../worker/privateWorkTest';
import {
  D1F_COMBINED_WALL_ASSETS,
  isD1FCombinedWallReviewRequested,
} from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const id = 'd1f-combined-wall-115-100-20261013';
const sourceId = '1zQrmMTos-hjoi3FDu3gYbacdRMcPxVX_';
const sourceSize = 3544904;
const sourceSha = '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2';
const pathname = `/private-model/work-test/${id}.glb`;
const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));

test('combined wall registry, runtime routes and browser bytes agree on one immutable source', () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  expect(candidate).not.toBeNull();
  expect(candidate).toMatchObject({
    id, path: pathname, objectKey: `work-test/${id}.glb`,
    expectedSize: sourceSize, expectedSha256: sourceSha,
  });
  expect(candidate?.label).toContain('WORK_TEST');
  expect(registry.candidates[id]).toEqual({ driveFileId: sourceId });
  expect(D1F_COMBINED_WALL_ASSETS[id]).toEqual({ bytes: sourceSize, sha256: sourceSha });
  expect(isD1FCombinedWallReviewRequested(`?review=${id}-review`)).toBe(true);
  expect(getPrivateWorkTestCandidate(pathname)).toEqual(candidate);
  expect(getPrivateWorkTestPublishCandidate(`/private-model/work-test/publish/${id}.glb`)).toEqual(candidate);
  expect(getPrivateWorkTestVerifyCandidate(`/private-model/work-test/verify/${id}.glb`)).toEqual(candidate);
});

test('canonical publisher resolves the registered Drive source before machine authentication', () => {
  const workflow = readFileSync('.github/workflows/publish-work-test.yml', 'utf8');
  const prefix = `python3 - ".github/work-test-candidates.json" "$REQUESTED_CANDIDATE" "$GITHUB_ENV" <<'PY'\n`;
  const python = workflow.split(prefix)[1]?.split('\n          PY')[0]
    ?.split('\n').map(line => line.replace(/^          /, '')).join('\n');
  expect(python).toBeTruthy();
  const temp = mkdtempSync(join(tmpdir(), 'd1f-combined-publish-'));
  try {
    const output = join(temp, 'env');
    const result = spawnSync('python3', ['-c', python!, '.github/work-test-candidates.json', id, output],
      { cwd: process.cwd(), encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    const env = readFileSync(output, 'utf8');
    expect(env).toContain(`DRIVE_FILE_ID=${sourceId}\n`);
    expect(env).toContain(`CANDIDATE_ID=${id}\n`);
    expect(env).toContain(`EXPECTED_PATH=${pathname}\n`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('different raw bytes and CURRENT aliases cannot enter the combined publication route', async () => {
  const candidate = getPrivateWorkTestCandidateById(id);
  if (!candidate) throw new Error('combined candidate absent');
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(2_383_872).buffer, candidate))
    .toBe('upload-size-mismatch');
  expect(await validatePrivateWorkTestUploadBytes(new Uint8Array(sourceSize).buffer, candidate))
    .toBe('upload-sha256-mismatch');
  expect(getPrivateWorkTestCandidateById('current-model')).toBeNull();
  expect(getPrivateWorkTestPublishCandidate('/private-model/model.glb')).toBeNull();
  expect(getPrivateWorkTestPublishCandidate('/private-model/work-test/publish/current.glb')).toBeNull();
  expect(isD1FCombinedWallReviewRequested(`?review=${id}-review-current`)).toBe(false);
});
