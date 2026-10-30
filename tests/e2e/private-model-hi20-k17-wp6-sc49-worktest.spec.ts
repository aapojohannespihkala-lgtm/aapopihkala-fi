import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

// New opt-in BOTH model: no CURRENT/as-built or source-card MATCHED claim.
// Main-only publish-work-test extracts scene49 before Worker SHA/size gates.
const id = 'ylisrinne-d-c80-hi20-wp6-c043-k17-sc49-both-work-test-20261030';
const driveFileId = '13ZlpGX5PYhQ4VYGVpkFifyv38-UXwDLR';
const extractedSha = '6ce0031ad0baf21f82a3aa599603f0515a22f398bc6336ac1492e31d59e9b8c6';
const extractedGlb = process.env.YLIS_HI20_K17_SC49_GLB;

test('HI20 K17/WP6/C043 scene49 WORK_TEST receiver is exact SHA-locked', () => {
  const candidate = getPrivateWorkTestCandidateById(id)!;
  expect(candidate).toBeTruthy();
  expect(candidate.path).toBe('/private-model/work-test/' + id + '.glb');
  expect(candidate.objectKey).toBe('work-test/' + id + '.glb');
  expect(candidate.expectedSize).toBe(7250936);
  expect(candidate.expectedSha256).toBe(extractedSha);
  expect(candidate.label).toContain('WORK_TEST');
  expect(candidate.label).toContain('HOST_HOLD');

  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[id]).toEqual({ driveFileId, extractScene: 49 });

  // Source HI20 and previously accepted B72 scene45 must retain exact identities.
  const old = getPrivateWorkTestCandidateById('ylisrinne-d-c80-hi20-work-test-20261030')!;
  expect(old.expectedSize).toBe(14057136);
  expect(old.expectedSha256).toBe('8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d');
  expect(registry.candidates[old.id]).toEqual({driveFileId:'1KVt6coeXtd2H3h5M-1eiDpdB6X5TmeFn'});
  const b72 = getPrivateWorkTestCandidateById('ylisrinne-d-c80-hi20-b72-sc45-both-work-test-20261030')!;
  expect(b72.expectedSize).toBe(7244028);
  expect(b72.expectedSha256).toBe('973b536d157c2a7bd7ed66dd01fa5939b0f70951ced53c3662979631a75110ad');
});

test('HI20 K17 scene49 extracted GLB preserves only protected BOTH view (trusted source optional)', () => {
  test.skip(!extractedGlb, 'Exact extracted GLB provided only by trusted source job');
  const bytes = readFileSync(extractedGlb!);
  expect(bytes.length).toBe(7250936);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(extractedSha);
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
    'D_C80R2_HI20_P6_C012_C029_C035_C046_C047_C048_C043_WHITE_WP6_WP8_G3_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT_K17_1125MM_AB_UNVERIFIED_WORK_TEST',
  );
  expect(data.asset.extras.current).toBe(false);
  expect(data.asset.extras.asBuilt).toBe(false);
  expect(data.asset.extras.canonical).toBe(false);
  expect(data.asset.extras.HUMAN_REVIEW).toBe('NOT_RUN');
  expect(data.asset.generator).toContain('scene 49 of 50 extracted verbatim');
});
