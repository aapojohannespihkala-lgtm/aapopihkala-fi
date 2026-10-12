import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authenticateM5AR1125OriginalGlb,
  R1125_ORIGINAL_GLB,
} from './privateModelM5AR1125OriginalGlbGuard.mjs';

// Reusable, server-side release gate for a downloaded *original* raw GLB.
// No browser data, URL, synthetic scene, manifest or screenshot may stand in
// for these exact bytes. The caller owns download authorization and identity.
export async function verifyM5AR1125OriginalGlbFile(filePath, {
  statFile = stat, readBytes = readFile,
} = {}) {
  if (typeof filePath !== 'string' || !filePath.trim() ||
      filePath.length > 4096 || filePath.includes('\0')) {
    throw new Error('R1125 original GLB file path invalid');
  }
  const fileStat = await statFile(filePath);
  if (!fileStat.isFile() || fileStat.size !== R1125_ORIGINAL_GLB.bytes) {
    throw new Error('R1125 original GLB file size mismatch');
  }
  const bytes = await readBytes(filePath);
  const result = authenticateM5AR1125OriginalGlb(bytes);
  if (result.sourceTargetCount !== 13 ||
      result.sourceTargets?.length !== 13 ||
      result.originalGlbDigestAuthenticated !== true ||
      result.productionScreenshotVerified !== false ||
      result.humanReview !== 'NOT_RUN') {
    throw new Error('R1125 GLB original source proof incomplete');
  }
  return Object.freeze({
    contract: 'M5A_R1125_ORIGINAL_GLB_SOURCE_ONLY',
    driveFileId: result.driveFileId,
    sha256: result.sha256,
    byteLength: R1125_ORIGINAL_GLB.bytes,
    sourceSceneIndex: 63,
    sourceTargetCount: result.sourceTargetCount,
    requiredCounts: result.requiredCounts,
    sourceKeys: result.sourceTargets.map((target) => target.key),
    originalGlbDigestAuthenticated: true,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
  });
}

const invokedAsCli = process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  if (process.argv.length !== 3) {
    process.stderr.write('Usage: node privateModelM5AR1125OriginalGlbCheckCli.mjs <original.glb>\n');
    process.exitCode = 2;
  } else {
    verifyM5AR1125OriginalGlbFile(process.argv[2]).then((result) => {
      process.stdout.write(JSON.stringify(result) + '\n');
    }).catch((error) => {
      process.stderr.write(String(error?.message ?? error) + '\n');
      process.exitCode = 1;
    });
  }
}
