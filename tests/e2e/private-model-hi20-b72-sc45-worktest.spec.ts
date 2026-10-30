import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

// This B72 opt-in has no CURRENT/as-built claim. The 46-scene ZIP is never
// published directly: main-only publish-work-test extracts immutable scene 45.
const id = 'ylisrinne-d-c80-hi20-b72-sc45-both-work-test-20261030';
const sourceFileId = '1CYZhDPUy_JqXeoxL_oiIXPLpmit7ZF6R';
const expectedSha = '973b536d157c2a7bd7ed66dd01fa5939b0f70951ced53c3662979631a75110ad';
const sourceGlb = process.env.YLIS_HI20_B72_SC45_GLB;

test('HI20 B72 scene45 protected WORK_TEST candidate is exact SHA/size-locked', () => {
  const candidate = getPrivateWorkTestCandidateById(id)!;
  expect(candidate).toBeTruthy();
  expect(candidate.path).toBe('/private-model/work-test/' + id + '.glb');
  expect(candidate.objectKey).toBe('work-test/' + id + '.glb');
  expect(candidate.expectedSize).toBe(7244028);
  expect(candidate.expectedSha256).toBe(expectedSha);
  expect(candidate.label).toContain('WORK_TEST');
  expect(candidate.label).toContain('HOST_HOLD');

  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[id]).toEqual({
    driveFileId: sourceFileId,
    extractScene: 45,
  });
  // Do not alter the previous exact 26-scene HI20 source candidate.
  const old = getPrivateWorkTestCandidateById('ylisrinne-d-c80-hi20-work-test-20261030')!;
  expect(old.expectedSize).toBe(14057136);
  expect(old.expectedSha256).toBe('8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d');
  expect(registry.candidates[old.id]).toEqual({driveFileId:'1KVt6coeXtd2H3h5M-1eiDpdB6X5TmeFn'});
});

test('HI20 B72 extracted BOTH GLB keeps only scene45 as default (trusted source optional)', () => {
  test.skip(!sourceGlb, 'Exact extracted GLB is present only at trusted source jobs');
  const bytes = readFileSync(sourceGlb!);
  expect(bytes.length).toBe(7244028);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedSha);
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
  const data = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  expect(data.scene).toBe(0);
  expect(data.scenes).toHaveLength(1);
  expect(data.scenes[0].nodes).toHaveLength(84);
  expect(data.scenes[0].name).toBe(
    'D_C80R2_HI20_44SCENE_P6_C012_C029_C035_C046_C047_C048_WP6_WP8_G3_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT',
  );
  expect(data.asset.extras.current).toBe(false);
  expect(data.asset.extras.asBuilt).toBe(false);
  expect(data.asset.extras.canonical).toBe(false);
  expect(data.asset.extras.HUMAN_REVIEW).toBe('NOT_RUN');
  expect(data.asset.generator).toContain('scene 45 of 46 extracted verbatim');
});
