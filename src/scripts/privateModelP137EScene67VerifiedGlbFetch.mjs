/**
 * Source-only P137E scene67 WORK_TEST GLB fetch.
 * A browser fetch that has fully delivered bytes is verified BEFORE GLTF
 * parsing. It must never establish a rendered-pixel or HUMAN_REVIEW claim.
 * No retries, alias candidates, CURRENT fallback or canonical promotion.
 */
import {
  P137E_SCENE67_PRODUCTION_GLB_URL,
  P137E_SCENE67_EXPECTED_GLB_BYTES,
  P137E_SCENE67_EXPECTED_GLB_SHA256,
} from './privateModelP137EScene67ProductionSmokeGuard.mjs';

export const P137E_SCENE67_FETCH_DEADLINE_MS = 30_000;
const original = new URL(P137E_SCENE67_PRODUCTION_GLB_URL);
export const P137E_SCENE67_EXACT_ASSET_PATH = original.pathname;

const hashHex = bytes =>
  Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');

/**
 * @param {string} path
 * @param {{
 *   origin?: string,
 *   fetcher?: typeof fetch,
 *   digest?: (bytes: ArrayBuffer) => Promise<ArrayBuffer>,
 *   timeoutMs?: number
 * }} [config]
 * @returns {Promise<ArrayBuffer>} Exact verified original source bytes only.
 */
export async function fetchP137EScene67VerifiedGlb(path, {
  origin = globalThis.location?.origin ?? original.origin,
  fetcher = globalThis.fetch,
  digest = bytes => globalThis.crypto.subtle.digest('SHA-256', bytes),
  timeoutMs = P137E_SCENE67_FETCH_DEADLINE_MS,
} = {}) {
  if (typeof origin !== 'string' || typeof fetcher !== 'function' ||
      typeof digest !== 'function' || !Number.isInteger(timeoutMs) ||
      timeoutMs < 1 || timeoutMs > P137E_SCENE67_FETCH_DEADLINE_MS) {
    throw new Error('P137E_SCENE67_SOURCE_FETCH_CONFIG_INVALID');
  }
  const requested = new URL(path, origin);
  if (requested.protocol !== 'https:' ||
      requested.origin !== origin ||
      requested.pathname !== P137E_SCENE67_EXACT_ASSET_PATH ||
      requested.search || requested.hash) {
    throw new Error('P137E_SCENE67_SOURCE_URL_REJECTED');
  }
  const controller = new AbortController();
  let timer;
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error('P137E_SCENE67_SOURCE_FETCH_TIMEOUT');
        reject(error);
        controller.abort(error);
      }, timeoutMs);
    });
    const load = (async () => {
      const response = await fetcher(requested.pathname, {
        credentials: 'same-origin', mode: 'same-origin',
        redirect: 'error', cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'model/gltf-binary' },
      });
      const returned = new URL(response?.url ?? '', origin);
      if (response.status !== 200 || response.redirected ||
          returned.origin !== origin ||
          returned.pathname !== P137E_SCENE67_EXACT_ASSET_PATH ||
          returned.search || returned.hash) {
        throw new Error('P137E_SCENE67_SOURCE_RESPONSE_REJECTED');
      }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== P137E_SCENE67_EXPECTED_GLB_BYTES) {
        throw new Error('P137E_SCENE67_SOURCE_LENGTH_MISMATCH');
      }
      const digestHex = hashHex(await digest(bytes));
      if (digestHex !== P137E_SCENE67_EXPECTED_GLB_SHA256) {
        throw new Error('P137E_SCENE67_SOURCE_SHA256_MISMATCH');
      }
      return bytes;
    })();
    return await Promise.race([load, deadline]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
