import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

// Main publisher contract allows only one candidate per Drive ID.
// Latest 52-scene BOTH preview is WORK_TEST/HOST_HOLD, not CURRENT/as-built.
const id = 'ylisrinne-d-c80-hi20-unified52-both-sc51-work-test-20261030';
const sourceFileId = '1Jee3b6wKBnEDgm43XND-4A9ODVn2ODXs';
const expectedSha = '8e18f6feb4960817024715c311d7e84894cd99cbe503d2bfe0d4d9033cf2b858';
const extractedGlb = process.env.YLIS_HI20_UNIFIED52_SC51_GLB;

test('52scene BOTH candidate is exact SHA-locked with unique Drive ID', () => {
  const candidate = getPrivateWorkTestCandidateById(id)!;
  expect(candidate).toBeTruthy();
  expect(candidate.path).toBe('/private-model/work-test/' + id + '.glb');
  expect(candidate.objectKey).toBe('work-test/' + id + '.glb');
  expect(candidate.expectedSize).toBe(7436424);
  expect(candidate.expectedSha256).toBe(expectedSha);
  expect(candidate.label).toContain('WORK_TEST');
  expect(candidate.label).toContain('HOST_HOLD');
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json','utf8'));
  expect(manifest.candidates[id]).toEqual({driveFileId:sourceFileId,extractScene:51});
  expect(Object.values(manifest.candidates).filter(
    (v: any) => v.driveFileId === sourceFileId
  )).toHaveLength(1);
  // Preserve existing HI20, B72 and earlier 50scene receiver identities.
  for (const [previousId,size,sha] of [
    ['ylisrinne-d-c80-hi20-work-test-20261030',14057136,'8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d'],
    ['ylisrinne-d-c80-hi20-b72-sc45-both-work-test-20261030',7244028,'973b536d157c2a7bd7ed66dd01fa5939b0f70951ced53c3662979631a75110ad'],
    ['ylisrinne-d-c80-hi20-wp6-c043-k17-sc49-both-work-test-20261030',7250936,'6ce0031ad0baf21f82a3aa599603f0515a22f398bc6336ac1492e31d59e9b8c6'],
  ] as const) {
    const old = getPrivateWorkTestCandidateById(previousId)!;
    expect(old.expectedSize).toBe(size);
    expect(old.expectedSha256).toBe(sha);
  }
});

test('52scene extracted BOTH GLB retains source scene51 as sole default (trusted source optional)', () => {
  test.skip(!extractedGlb, 'Exact extracted GLB supplied only at trusted source jobs');
  const bytes = readFileSync(extractedGlb!);
  expect(bytes.length).toBe(7436424);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedSha);
  expect(bytes.subarray(0,4).toString('ascii')).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
  const doc = JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  expect(doc.scene).toBe(0);
  expect(doc.scenes).toHaveLength(1);
  expect(doc.scenes[0].nodes).toHaveLength(84);
  expect(doc.scenes[0].name).toBe('HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT');
  expect(doc.scenes[0].extras.sourceLinksRequireRebind).toBe(true);
  expect(doc.asset.extras.current).toBe(false);
  expect(doc.asset.extras.asBuilt).toBe(false);
  expect(doc.asset.extras.canonical).toBe(false);
  expect(doc.asset.extras.HUMAN_REVIEW).toBe('NOT_RUN');
  expect(doc.asset.generator).toContain('scene 51 of 52 extracted verbatim');
});
