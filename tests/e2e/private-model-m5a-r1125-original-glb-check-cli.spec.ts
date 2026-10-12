import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
// @ts-ignore - standalone source-only ESM file has no TS declaration
import { verifyM5AR1125OriginalGlbFile } from
  '../../src/scripts/privateModelM5AR1125OriginalGlbCheckCli.mjs';
// @ts-ignore - existing untyped R1125 exact-byte identity module
import { R1125_ORIGINAL_GLB } from
  '../../src/scripts/privateModelM5AR1125OriginalGlbGuard.mjs';

const cliPath = fileURLToPath(new URL(
  '../../src/scripts/privateModelM5AR1125OriginalGlbCheckCli.mjs',
  import.meta.url,
));
const fakeFile = { isFile: () => true, size: R1125_ORIGINAL_GLB.bytes };
const zeroBytes = new Uint8Array(R1125_ORIGINAL_GLB.bytes);

// The CLI uses only Stats.isFile/size and raw bytes. Keep test doubles
// deliberately minimal; cast the injected port, not the production function,
// because node:fs/promises has unrelated stat/readFile overloads.
const fakeFs = (
  stats: { isFile: () => boolean; size: number },
  bytes: Uint8Array,
  onRead?: () => void,
) => ({
  statFile: async () => stats,
  readBytes: async () => { onRead?.(); return bytes; },
}) as unknown as {
  statFile: typeof import('node:fs/promises').stat;
  readBytes: typeof import('node:fs/promises').readFile;
};

test('R1125 original source gate only accepts one bounded real file path', async () => {
  for (const path of ['', ' ', 'x\0y', 'x'.repeat(4097), null]) {
    await expect(verifyM5AR1125OriginalGlbFile(path as string))
      .rejects.toThrow(/file path invalid/);
  }
});

test('R1125 file must have exact 3,112,432 raw bytes before read', async () => {
  let readCount = 0;
  const wrongStat = { isFile: () => true, size: 120 };
  await expect(verifyM5AR1125OriginalGlbFile('wrong.glb', {
    ...fakeFs(wrongStat, zeroBytes, () => { readCount += 1; }),
  })).rejects.toThrow(/file size mismatch/);
  expect(readCount).toBe(0);
});

test('R1125 directory masquerading as a source file is rejected', async () => {
  await expect(verifyM5AR1125OriginalGlbFile('directory.glb', {
    ...fakeFs({ isFile: () => false, size: R1125_ORIGINAL_GLB.bytes }, zeroBytes),
  })).rejects.toThrow(/file size mismatch/);
});

test('R1125 exact-size but changed SHA cannot authenticate', async () => {
  await expect(verifyM5AR1125OriginalGlbFile('forged.glb', {
    ...fakeFs(fakeFile, zeroBytes),
  })).rejects.toThrow(/original digest mismatch/);
});

test('R1125 short read after correct stat still fails raw byte gate', async () => {
  await expect(verifyM5AR1125OriginalGlbFile('changed.glb', {
    ...fakeFs(fakeFile, new Uint8Array(32)),
  })).rejects.toThrow(/raw byte length mismatch/);
});

test('R1125 executable CLI requires exactly one filename argument', () => {
  const proc = spawnSync(process.execPath, [cliPath], { encoding: 'utf8' });
  expect(proc.status).toBe(2);
  expect(proc.stdout).toBe('');
  expect(proc.stderr).toContain('Usage: node');
});

test('R1125 executable CLI fails closed for unavailable source file', () => {
  const proc = spawnSync(process.execPath, [
    cliPath, resolve('nonexistent-r1125-original-glb.glb'),
  ], { encoding: 'utf8' });
  expect(proc.status).toBe(1);
  expect(proc.stdout).toBe('');
  expect(proc.stderr).toMatch(/ENOENT/);
});

test('R1125 optional genuine downloaded raw GLB yields authenticated source-only evidence', async () => {
  const source = process.env.YLISRINNE_R1125_ORIGINAL_GLB_PATH;
  test.skip(!source, 'requires separately authorized exact raw G2b GLB fixture');
  const result = await verifyM5AR1125OriginalGlbFile(source!);
  expect(result).toMatchObject({
    contract: 'M5A_R1125_ORIGINAL_GLB_SOURCE_ONLY',
    driveFileId: '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs',
    sha256: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    byteLength: 3112432,
    sourceSceneIndex: 63,
    sourceTargetCount: 13,
    requiredCounts: { wellGray: 4, routeCyan: 7, boundaryYellow: 2 },
    originalGlbDigestAuthenticated: true,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
  });
  expect(result.sourceKeys).toHaveLength(13);
  expect(new Set(result.sourceKeys).size).toBe(13);
});
