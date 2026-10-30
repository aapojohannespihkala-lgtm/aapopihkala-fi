import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getPrivateWorkTestCandidateById } from '../../worker/privateWorkTest';
import { THREE } from '../../src/scripts/threeRuntime';
import { HI20_UNIFIED52_SHA, resolveHi20Unified52Scenes } from '../../src/scripts/privateModelUnified52Floor';

// Main publisher contract allows only one candidate per Drive ID.
// The one protected candidate now transports the entire immutable 52-scene source.
// 1F/2F/BOTH use original scenes 50/48/51, never mesh-only clipping.
const id = 'ylisrinne-d-c80-hi20-unified52-both-sc51-work-test-20261030';
const sourceFileId = '1Jee3b6wKBnEDgm43XND-4A9ODVn2ODXs';
const expectedSha = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const sourceGlb = process.env.YLIS_HI20_UNIFIED52_SOURCE_GLB;

test('52scene BOTH candidate is exact SHA-locked with unique Drive ID', () => {
  const candidate = getPrivateWorkTestCandidateById(id)!;
  expect(candidate).toBeTruthy();
  expect(candidate.path).toBe('/private-model/work-test/' + id + '.glb');
  expect(candidate.objectKey).toBe('work-test/' + id + '.glb');
  expect(candidate.expectedSize).toBe(15338932);
  expect(candidate.expectedSha256).toBe(expectedSha);
  expect(candidate.label).toContain('WORK_TEST');
  expect(candidate.label).toContain('HOST_HOLD');
  const manifest = JSON.parse(readFileSync('.github/work-test-candidates.json','utf8'));
  expect(manifest.candidates[id]).toEqual({driveFileId:sourceFileId});
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

test('52scene full source preserves exact original 1F/2F/BOTH scene roots (trusted source optional)', () => {
  test.skip(!sourceGlb, 'Exact original 52scene GLB supplied only in trusted source jobs');
  const bytes = readFileSync(sourceGlb!);
  expect(bytes.length).toBe(15338932);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedSha);
  expect(bytes.subarray(0,4).toString('ascii')).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
  const doc = JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  expect(doc.scene).toBe(0);
  expect(doc.scenes).toHaveLength(52);
  const rootCount = { 48: 39, 50: 50, 51: 84 } as const;
  for (const [indexText, roots] of Object.entries(rootCount)) {
    const index = Number(indexText);
    expect(doc.scenes[index].nodes).toHaveLength(roots);
    expect(new Set(doc.scenes[index].nodes).size).toBe(roots);
    expect(doc.scenes[index].extras.sourceLinksRequireRebind).toBe(true);
  }
  expect(doc.scenes[48].name).toContain('_2F_WORK_TEST_');
  expect(doc.scenes[50].name).toContain('_1F_WORK_TEST_');
  expect(doc.scenes[51].name).toContain('_BOTH_WORK_TEST_');
  expect(doc.asset.extras.current).toBe(false);
  expect(doc.asset.extras.asBuilt).toBe(false);
  expect(doc.asset.extras.canonical).toBe(false);
  expect(doc.asset.extras.HUMAN_REVIEW).toBe('NOT_RUN');
  expect(doc.nodes).toHaveLength(6463);
  // Unmodified binary source includes all original scene roots and stairs.
  expect(doc.scenes[48].nodes).not.toEqual(doc.scenes[50].nodes);
});

test('original floor routing preserves complete roots; wrong scene or SHA fails closed', () => {
  const definitions = [
    [48, 39, 'D_C80R2_HI20_P6_C012_C029_C035_C046_C047_C048_C043_WHITE_WP6_WP8_G3_2F_WORK_TEST_HOST_HOLD_NONCURRENT_K17_1125MM_AB_UNVERIFIED_WORK_TEST'],
    [50, 50, 'HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_1F_WORK_TEST_HOST_HOLD_NONCURRENT'],
    [51, 84, 'HI20_50SCENE_K17_WP6_WP8_G3_C043_C027_C045_C049_K14_COMBINED_BOTH_WORK_TEST_HOST_HOLD_NONCURRENT'],
  ] as const;
  const scenes = Array.from({ length: 52 }, () => new THREE.Group());
  const source = Array.from({ length: 52 }, () => ({ name: '', nodes: [] as number[], extras: { current: false, asBuilt: false, stage: 'WORK_TEST' } }));
  for (const [index, count, name] of definitions) {
    scenes[index].name = name;
    source[index].name = name;
    source[index].nodes = Array.from({ length: count }, (_, n) => n + index * 100);
    for (let n = 0; n < count; n++) scenes[index].add(new THREE.Group());
  }
  const model = { scene: scenes[0], scenes, parser: { json: {
    asset: { version: '2.0', extras: { current: false, asBuilt: false } },
    scene: 0, scenes: source,
  } } };
  const selected = resolveHi20Unified52Scenes(model, HI20_UNIFIED52_SHA);
  expect(selected['1F']).toBe(scenes[50]);
  expect(selected['2F']).toBe(scenes[48]);
  expect(selected.BOTH).toBe(scenes[51]);
  expect(selected.BOTH.children).toHaveLength(84);
  expect(selected['1F'].children).toHaveLength(50);
  expect(selected['2F'].children).toHaveLength(39);
  expect(() => resolveHi20Unified52Scenes(model, '0'.repeat(64))).toThrow('SHA mismatch');
  source[50].nodes.pop();
  expect(() => resolveHi20Unified52Scenes(model, HI20_UNIFIED52_SHA)).toThrow('1F original scene');
});
