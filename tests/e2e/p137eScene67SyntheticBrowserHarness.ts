import type { Page } from '@playwright/test';
// @ts-ignore - exact source constants are also used by authenticated production workflow.
import { P137E_SCENE67_EXPECTED_GLB_BYTES, P137E_SCENE67_EXPECTED_GLB_SHA256 } from '../../src/scripts/privateModelP137EScene67ProductionSmokeGuard.mjs';

// Synthetic scene67 Chromium test adapter ONLY. This file is never imported by
// the viewer. A padded fixture + injected digest cannot prove original source
// bytes, Cloudflare Access, production pixels or HUMAN_REVIEW.
export const SYNTHETIC_SCENE67_ORIGIN = 'https://p137e-synthetic.test';

export function padScene67SyntheticGlb(source: Buffer): Buffer {
  if (source.toString('ascii', 0, 4) !== 'glTF' ||
      source.readUInt32LE(8) !== source.length) {
    throw new Error('Synthetic GLB header invalid');
  }
  const jsonSize = source.readUInt32LE(12);
  const manifest = JSON.parse(source.subarray(20, 20 + jsonSize).toString('utf8'));
  const binStart = 20 + jsonSize;
  if (source.readUInt32LE(binStart + 4) !== 0x004e4942 ||
      source.readUInt32LE(binStart) + binStart + 8 !== source.length) {
    throw new Error('Synthetic GLB BIN layout invalid');
  }
  if (!source.toString('utf8', 20, 20 + jsonSize)
      .includes('D_1F_SYNTHETIC_INTERIOR_CONTEXT_NOT_THEMO_SOURCE')) {
    throw new Error('Synthetic scene67 identity missing');
  }
  // Rebuild a legal GLB with a larger BIN buffer; keep its entire original
  // geometry and JSON semantic fixture, extending only unused buffer space.
  manifest.buffers[0].byteLength = P137E_SCENE67_EXPECTED_GLB_BYTES;
  const encodeJson = () => {
    const json = Buffer.from(JSON.stringify(manifest));
    return Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  };
  let json = encodeJson();
  const binarySize = P137E_SCENE67_EXPECTED_GLB_BYTES - 28 - json.length;
  manifest.buffers[0].byteLength = binarySize;
  json = encodeJson();
  if (28 + json.length + binarySize !== P137E_SCENE67_EXPECTED_GLB_BYTES ||
      binarySize < source.length - (binStart + 8) || binarySize % 4 !== 0) {
    throw new Error('Synthetic scene67 fixture size cannot be represented');
  }
  const header = Buffer.from(source.subarray(0, 12));
  header.writeUInt32LE(P137E_SCENE67_EXPECTED_GLB_BYTES, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binarySize, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  const originalBinary = source.subarray(binStart + 8);
  return Buffer.concat([header, jsonHeader, json, binaryHeader, originalBinary,
    Buffer.alloc(binarySize - originalBinary.length)]);
}

export async function installScene67SyntheticDigest(page: Page): Promise<void> {
  // The SHA-256 substitution is installed inside an isolated Playwright page,
  // never in a production build or application module. It applies only to
  // this clearly marked synthetic GLB with matching test buffer length.
  await page.addInitScript(({ hex, bytes }) => {
    const subtle = window.crypto.subtle;
    const digestOriginal = subtle.digest.bind(subtle);
    Object.defineProperty(subtle, 'digest', {
      configurable: true,
      value: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name.toUpperCase() === 'SHA-256' && data instanceof ArrayBuffer &&
            data.byteLength === bytes) {
          const view = new Uint8Array(data);
          const gltf = view[0] === 0x67 && view[1] === 0x6c &&
            view[2] === 0x54 && view[3] === 0x46;
          const jsonSize = new DataView(data).getUint32(12, true);
          const marker = gltf && jsonSize > 0 && jsonSize < bytes - 28 &&
            new TextDecoder().decode(new Uint8Array(data, 20, jsonSize))
              .includes('D_1F_SYNTHETIC_INTERIOR_CONTEXT_NOT_THEMO_SOURCE');
          if (marker) {
            return Uint8Array.from(hex.match(/../g)!, x => parseInt(x, 16)).buffer;
          }
        }
        return digestOriginal(algorithm, data);
      },
    });
  }, { hex: P137E_SCENE67_EXPECTED_GLB_SHA256,
       bytes: P137E_SCENE67_EXPECTED_GLB_BYTES });
}

export async function routeScene67SyntheticHttpsAssets(page: Page): Promise<void> {
  // Route only mocked browser navigation to the existing local Astro preview.
  // Production/Cloudflare is never contacted; browser uses a secure origin.
  await page.route(SYNTHETIC_SCENE67_ORIGIN + '/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: 'http://127.0.0.1:4321' + url.pathname + url.search,
    });
    await route.fulfill({ response });
  });
}
