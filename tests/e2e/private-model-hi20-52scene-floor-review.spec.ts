import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';

// Source: one immutable 52-scene G2b WORK_TEST/HOST_HOLD, not CURRENT.
// Canonical publisher extracts ONLY the chosen floor scene and SHA-locks it.
const sourceDriveId = '1Jee3b6wKBnEDgm43XND-4A9ODVn2ODXs';
const cases = [
  { floor: '1f', scene: 50, size: 4118332, roots: 50, sha: 'bce1e87ce1dcf1b593d526601526b43df08c2ed8a578078553aead3d7724bcb4' },
  { floor: '2f', scene: 48, size: 3115996, roots: 39, sha: '09d3d2153812ca60b88535d44c1303498322fd015fde499723c37384b42513f6' },
  { floor: 'both', scene: 51, size: 7436424, roots: 84, sha: '8e18f6feb4960817024715c311d7e84894cd99cbe503d2bfe0d4d9033cf2b858' },
] as const;

test('52scene 1F/2F/BOTH are three separate exact protected WORK_TEST choices', () => {
  const reg = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  for (const entry of cases) {
    const id = `ylisrinne-d-c80-hi20-review52-sc${entry.scene}-${entry.floor}-work-test-20261030`;
    const candidate = getPrivateWorkTestCandidateById(id);
    expect(candidate).toBeTruthy();
    expect(candidate!.path).toBe('/private-model/work-test/' + id + '.glb');
    expect(candidate!.objectKey).toBe('work-test/' + id + '.glb');
    expect(candidate!.expectedSize).toBe(entry.size);
    expect(candidate!.expectedSha256).toBe(entry.sha);
    expect(candidate!.label).toContain('WORK_TEST');
    expect(candidate!.label).toContain('HOST_HOLD');
    expect(reg.candidates[id]).toEqual({ driveFileId: sourceDriveId, extractScene: entry.scene });
  }
  // Legacy original HI20, and prior B72/50scene variants remain unchanged.
  for (const [id,size,sha] of [
    ['ylisrinne-d-c80-hi20-work-test-20261030', 14057136, '8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d'],
    ['ylisrinne-d-c80-hi20-b72-sc45-both-work-test-20261030',7244028,'973b536d157c2a7bd7ed66dd01fa5939b0f70951ced53c3662979631a75110ad'],
    ['ylisrinne-d-c80-hi20-wp6-c043-k17-sc49-both-work-test-20261030',7250936,'6ce0031ad0baf21f82a3aa599603f0515a22f398bc6336ac1492e31d59e9b8c6'],
  ] as const) {
    const old = getPrivateWorkTestCandidateById(id);
    expect(old?.expectedSize).toBe(size);
    expect(old?.expectedSha256).toBe(sha);
  }
});
for (const entry of cases) {
  test(`52scene extracted source scene${entry.scene} has exact bytes and floor scene topology when provided`, () => {
    const file = process.env[`YLIS_HI20_52SCENE_SC${entry.scene}_GLB`];
    test.skip(!file, 'Trusted exact 52scene extractor bytes not provided');
    const bytes = readFileSync(file!);
    expect(bytes.length).toBe(entry.size);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha);
    expect(bytes.subarray(0,4).toString('ascii')).toBe('glTF');
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    const jsonLength = bytes.readUInt32LE(12);
    expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
    const g = JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
    expect(g.scene).toBe(0);
    expect(g.scenes).toHaveLength(1);
    expect(g.scenes[0].nodes).toHaveLength(entry.roots);
    expect(g.asset.extras.current).toBe(false);
    expect(g.asset.extras.asBuilt).toBe(false);
    expect(g.asset.extras.canonical).toBe(false);
    expect(g.asset.extras.HUMAN_REVIEW).toBe('NOT_RUN');
    expect(g.asset.generator).toContain(`scene ${entry.scene} of 52 extracted verbatim`);
  });
}
