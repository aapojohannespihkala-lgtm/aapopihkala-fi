import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  P137E_SCENE67_EXACT_ASSET_PATH,
  P137E_SCENE67_FETCH_DEADLINE_MS,
  fetchP137EScene67VerifiedGlb,
} from '../../src/scripts/privateModelP137EScene67VerifiedGlbFetch.mjs';
import {
  P137E_SCENE67_PRODUCTION_GLB_URL,
  P137E_SCENE67_EXPECTED_GLB_BYTES,
  P137E_SCENE67_EXPECTED_GLB_SHA256,
} from '../../src/scripts/privateModelP137EScene67ProductionSmokeGuard.mjs';

const origin = 'https://aapopihkala.fi';
const verifiedFixtureDigest = Uint8Array.from(
  P137E_SCENE67_EXPECTED_GLB_SHA256.match(/../g)!, x => Number.parseInt(x, 16),
).buffer;
const fixtureBuffer = new ArrayBuffer(P137E_SCENE67_EXPECTED_GLB_BYTES);
const ok = (bytes: ArrayBuffer = fixtureBuffer) => ({
  status: 200, redirected: false, url: P137E_SCENE67_PRODUCTION_GLB_URL,
  arrayBuffer: async () => bytes,
});

test('exact scene67 WORK_TEST source fetch verifies complete bytes before parse', async () => {
  const seen: { url: string; options: RequestInit }[] = [];
  const result = await fetchP137EScene67VerifiedGlb(P137E_SCENE67_EXACT_ASSET_PATH, {
    origin,
    fetcher: async (url, options) => {
      seen.push({ url: String(url), options: options ?? {} });
      return ok() as unknown as Response;
    },
    // The synthetic fixture has zero bytes; only its digest is mocked.
    // Production callers use the browser Web Crypto SHA-256 implementation.
    digest: async () => verifiedFixtureDigest,
  });
  expect(result).toBe(fixtureBuffer);
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toBe(P137E_SCENE67_EXACT_ASSET_PATH);
  expect(seen[0].options.credentials).toBe('same-origin');
  expect(seen[0].options.redirect).toBe('error');
  expect(seen[0].options.cache).toBe('no-store');
  expect(seen[0].options.signal?.aborted).toBe(true);
});

test('wrong candidate asset path is rejected before any network request', async () => {
  let requests = 0;
  const fetcher = async () => { requests++; return ok() as unknown as Response; };
  for (const path of [
    '/private-model/model.glb',
    '/private-model/work-test/not-three-themos.glb',
    P137E_SCENE67_EXACT_ASSET_PATH + '?different=1',
    'https://evil.example' + P137E_SCENE67_EXACT_ASSET_PATH,
  ]) {
    await expect(fetchP137EScene67VerifiedGlb(path, { origin, fetcher }))
      .rejects.toThrow('SOURCE_URL_REJECTED');
  }
  expect(requests).toBe(0);
});

test('SHA256, length, status and redirect must fail closed, not render an alias', async () => {
  const base = { origin, digest: async () => verifiedFixtureDigest };
  await expect(fetchP137EScene67VerifiedGlb(P137E_SCENE67_EXACT_ASSET_PATH, {
    ...base, fetcher: async () => ok(new ArrayBuffer(16)) as unknown as Response,
  })).rejects.toThrow('SOURCE_LENGTH_MISMATCH');
  await expect(fetchP137EScene67VerifiedGlb(P137E_SCENE67_EXACT_ASSET_PATH, {
    origin, fetcher: async () => ok() as unknown as Response,
    digest: async () => new Uint8Array(32).buffer,
  })).rejects.toThrow('SOURCE_SHA256_MISMATCH');
  for (const response of [
    { ...ok(), status: 206 },
    { ...ok(), redirected: true },
    { ...ok(), url: 'https://evil.example' + P137E_SCENE67_EXACT_ASSET_PATH },
  ]) {
    await expect(fetchP137EScene67VerifiedGlb(P137E_SCENE67_EXACT_ASSET_PATH, {
      ...base, fetcher: async () => response as Response,
    })).rejects.toThrow('SOURCE_RESPONSE_REJECTED');
  }
});

test('one total deadline covers a stalled browser request even when fetch ignores AbortSignal', async () => {
  let signal: AbortSignal | undefined;
  await expect(fetchP137EScene67VerifiedGlb(P137E_SCENE67_EXACT_ASSET_PATH, {
    origin, timeoutMs: 20,
    fetcher: async (_url, init) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    },
  })).rejects.toThrow('SOURCE_FETCH_TIMEOUT');
  expect(signal?.aborted).toBe(true);
  expect(P137E_SCENE67_FETCH_DEADLINE_MS).toBeLessThan(45_000);
});

test('viewer source uses verified bytes only for exact scene67 and keeps other loader paths', () => {
  const code = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const start = code.indexOf('const loadWorkTestCandidate = async (candidate: WorkTestCandidate)');
  const end = code.indexOf('const isP143aScalgoTerrainReview =', start);
  expect(end).toBeGreaterThan(start);
  const branch = code.slice(start, end);
  expect(start).toBeGreaterThan(0);
  expect(code).toContain('fetchP137EScene67VerifiedGlb');
  expect(branch).toContain('candidate.id === p137eScene67CandidateId');
  expect(branch).toContain('isP137EScene67ReviewRequested()');
  expect(branch).toContain('loader.parseAsync');
  expect(branch).toContain('fetchP137EScene67VerifiedGlb(candidate.path)');
  expect(branch).toContain('await loadModelWithSourceCards(loader, candidate.path)');
  expect(branch).not.toContain('publishToCURRENT: true');
  expect(branch).not.toContain('humanReview: \'PASS\'');
});
