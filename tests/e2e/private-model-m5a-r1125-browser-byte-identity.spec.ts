import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Load the REAL production-intended ESM source into Chromium without a Node
// polyfill or a synthetic digest implementation. Chromium's localhost preview
// is a secure context with native crypto.subtle.
const originalModule = readFileSync(
  new URL('../../src/scripts/privateModelM5AR1125BrowserByteIdentity.mjs', import.meta.url),
  'utf8',
);
const browserModuleUri = 'data:text/javascript;base64,' +
  Buffer.from(originalModule, 'utf8').toString('base64');

test('Chromium can execute the actual R1125 browser-only source digest gate', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async (uri) => {
    const module = await import(/* @vite-ignore */ uri);
    const bytes = new TextEncoder().encode('abc');
    const wrapped = new Uint8Array([0, ...bytes, 0]);
    const sha = await module.sha256M5AR1125BrowserBytes(bytes);
    const sliced = await module.sha256M5AR1125BrowserBytes(wrapped.subarray(1, 4));
    const arrayBuffer = await module.sha256M5AR1125BrowserBytes(bytes.buffer);

    let badLength = '';
    try {
      await module.verifyM5AR1125BrowserByteIdentity(bytes);
    } catch (error) {
      badLength = String(error);
    }
    let badDigest = '';
    try {
      await module.verifyM5AR1125BrowserByteIdentity(
        new Uint8Array(module.M5A_R1125_RAW_BYTE_LENGTH));
    } catch (error) {
      badDigest = String(error);
    }
    let wrongType = '';
    try {
      await module.verifyM5AR1125BrowserByteIdentity('c465' +
        module.M5A_R1125_RAW_SHA256);
    } catch (error) {
      wrongType = String(error);
    }
    return {
      secure: globalThis.isSecureContext,
      webCrypto: typeof globalThis.crypto?.subtle?.digest === 'function',
      sha, sliced, arrayBuffer, badLength, badDigest, wrongType,
      sourceLength: module.M5A_R1125_RAW_BYTE_LENGTH,
      expectedSha: module.M5A_R1125_RAW_SHA256,
    };
  }, browserModuleUri);

  const abc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  expect(result.secure).toBe(true);
  expect(result.webCrypto).toBe(true);
  expect(result.sha).toBe(abc);
  expect(result.sliced).toBe(abc);
  expect(result.arrayBuffer).toBe(abc);
  expect(result.sourceLength).toBe(3_112_432);
  expect(result.expectedSha).toBe(
    'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48');
  expect(result.badLength).toContain('original byte length mismatch');
  expect(result.badDigest).toContain('immutable original SHA-256 mismatch');
  expect(result.wrongType).toContain('ArrayBuffer or Uint8Array required');
});

// An actual 3,112,432-byte original GLB is intentionally NOT embedded into
// this test. Passing the vector/negative tests cannot claim source bytes,
// original thirteen source-mesh pixels, authenticated production or review.
