import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

// 52scene G2b ZIP is WORK_TEST/HOST_HOLD/NONCURRENT, not CURRENT/as-built.
// Each approved scene is independently extracted by the existing trusted main-only publisher.
const srcDrive = '1Jee3b6wKBnEDgm43XND-4A9ODVn2ODXs';
const cases = [
  {
    "slug": "1f-sc50",
    "idx": 50,
    "size": 4118332,
    "sha": "bce1e87ce1dcf1b593d526601526b43df08c2ed8a578078553aead3d7724bcb4",
    "roots": 50,
    "name": "HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_1F_WORK_TEST_HOST_HOLD_NONCURRENT"
  },
  {
    "slug": "2f-sc48",
    "idx": 48,
    "size": 3115996,
    "sha": "09d3d2153812ca60b88535d44c1303498322fd015fde499723c37384b42513f6",
    "roots": 39,
    "name": "D_C80R2_HI20_P6_C012_C029_C035_C046_C047_C048_C043_WHITE_WP6_WP8_G3_2F_WORK_TEST_HOST_HOLD_NONCURRENT_K17_1125MM_AB_UNVERIFIED_WORK_TEST"
  },
  {
    "slug": "both-sc51",
    "idx": 51,
    "size": 7436424,
    "sha": "8e18f6feb4960817024715c311d7e84894cd99cbe503d2bfe0d4d9033cf2b858",
    "roots": 84,
    "name": "HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT"
  }
] as const;
const envVar = (idx: number) => `YLIS_HI20_UNIFIED52_SC${idx}_GLB`;

test('52scene 1F/2F/BOTH candidates are exact SHA+size locked to the same G2b source', () => {
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  for (const info of cases) {
    const id = `ylisrinne-d-c80-hi20-unified52-${info.slug}-work-test-20261030`;
    const entry = getPrivateWorkTestCandidateById(id)!;
    expect(entry).toBeTruthy();
    expect(entry.path).toBe(`/private-model/work-test/${id}.glb`);
    expect(entry.objectKey).toBe(`work-test/${id}.glb`);
    expect(entry.expectedSize).toBe(info.size);
    expect(entry.expectedSha256).toBe(info.sha);
    expect(entry.label).toContain('WORK_TEST');
    expect(entry.label).toContain('HOST_HOLD');
    expect(manifest.candidates[id]).toEqual({driveFileId:srcDrive,extractScene:info.idx});
  }
  // Existing HI20, B72 and 50scene WORK_TEST receivers remain byte-locked.
  const previous = [
    ['ylisrinne-d-c80-hi20-work-test-20261030',14057136,'8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d'],
    ['ylisrinne-d-c80-hi20-b72-sc45-both-work-test-20261030',7244028,'973b536d157c2a7bd7ed66dd01fa5939b0f70951ced53c3662979631a75110ad'],
    ['ylisrinne-d-c80-hi20-wp6-c043-k17-sc49-both-work-test-20261030',7250936,'6ce0031ad0baf21f82a3aa599603f0515a22f398bc6336ac1492e31d59e9b8c6'],
  ] as const;
  for (const [id,size,sha] of previous) {
    const old = getPrivateWorkTestCandidateById(id)!;
    expect(old.expectedSize).toBe(size);
    expect(old.expectedSha256).toBe(sha);
  }
});

for (const info of cases) {
  test(`52scene extracted glTF scene${info.idx} exact SHA+root count (trusted source optional)`, () => {
    const input = process.env[envVar(info.idx)];
    test.skip(!input, 'Only the trusted extraction job supplies exact GLB');
    const bytes = readFileSync(input!);
    expect(bytes.length).toBe(info.size);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(info.sha);
    expect(bytes.subarray(0,4).toString('ascii')).toBe('glTF');
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    const jsonLength = bytes.readUInt32LE(12);
    expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
    const doc = JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
    expect(doc.scene).toBe(0);
    expect(doc.scenes).toHaveLength(1);
    expect(doc.scenes[0].name).toBe(info.name);
    expect(doc.scenes[0].nodes).toHaveLength(info.roots);
    expect(doc.asset.extras.current).toBe(false);
    expect(doc.asset.extras.asBuilt).toBe(false);
    expect(doc.asset.generator).toContain(`scene ${info.idx} of 52 extracted verbatim`);
    expect(doc.scenes[0].extras.sourceLinksRequireRebind).toBe(true);
  });
}
