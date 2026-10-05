import { expect, test } from '@playwright/test';

import {
  PRIVATE_AI_STATUS_DATA_PATH,
  PRIVATE_AI_STATUS_PUBLISH_PATH,
  PRIVATE_AI_STATUS_VERIFY_PATH,
  handlePrivateAiStatusRequest,
  isPrivateAiStatusPath,
  validatePrivateAiStatusPayload,
} from '../../worker/privateAiStatus';
import type { PrivateModelEnv } from '../../worker/privateModel';

const sample = {
  version: 1,
  generatedAt: '2026-10-05T15:20:00Z',
  source: {
    documentId: '1MmJdjTZSUXiDS308bLNasdenyPJeXXZe4otwxHX62Go',
    modifiedTime: '2026-10-05T15:19:30Z',
    version: '1234',
  },
  summary: {
    activePackages: 1,
    activeLines: 1,
    passesToday: 2,
  },
  active: [
    {
      id: '2026-10-05T18:15:05+03:00-ops9-ai-status-dashboard-r437',
      lane: 'Tilannepaneeli',
      laneCode: 'OPS9 STATUS_DASHBOARD',
      title: 'Ylisrinne AI derived status dashboard',
      goal: 'Toteuta ylläpitovapaa tilannepaneeli.',
      state: 'ACTIVE',
      updatedAt: '2026-10-05T18:18:28+03:00',
    },
  ],
  recent: [
    {
      time: '2026-10-05T18:15:30+03:00',
      state: 'PASS',
      lane: 'Viewer - integraatio',
      title: 'M5B PR #831 main integration',
      detail: 'PASS_MAIN_INTEGRATION',
    },
  ],
  humanAction: null,
} as const;

test('private AI status routes are bounded to three exact paths', () => {
  expect(isPrivateAiStatusPath(PRIVATE_AI_STATUS_DATA_PATH)).toBe(true);
  expect(isPrivateAiStatusPath(PRIVATE_AI_STATUS_PUBLISH_PATH)).toBe(true);
  expect(isPrivateAiStatusPath(PRIVATE_AI_STATUS_VERIFY_PATH)).toBe(true);
  expect(isPrivateAiStatusPath('/private-model/status/')).toBe(false);
  expect(isPrivateAiStatusPath('/private-model/work-test/publish/example.glb')).toBe(false);
});

test('private AI status payload validation is strict and bounded', () => {
  expect(validatePrivateAiStatusPayload(sample)).toBe(true);
  expect(validatePrivateAiStatusPayload({ ...sample, version: 2 })).toBe(false);
  expect(
    validatePrivateAiStatusPayload({
      ...sample,
      source: { ...sample.source, documentId: 'wrong-document' },
    }),
  ).toBe(false);
  expect(
    validatePrivateAiStatusPayload({
      ...sample,
      active: Array.from({ length: 33 }, () => sample.active[0]),
    }),
  ).toBe(false);
});

test('private AI status data fails closed before R2 access without viewer Access configuration', async () => {
  let reads = 0;
  const env = {
    ASSETS: { fetch: async () => new Response('unused') },
    PRIVATE_MODEL_BUCKET: {
      get: async () => {
        reads += 1;
        return null;
      },
    },
  } as unknown as PrivateModelEnv;

  const response = await handlePrivateAiStatusRequest(
    new Request('https://example.test' + PRIVATE_AI_STATUS_DATA_PATH),
    env,
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(reads).toBe(0);
});

test('Ylisrinne AI status page renders a useful shell without live data', async ({ page }) => {
  await page.goto('/private-model/status/');
  await expect(page.getByRole('heading', { name: 'Ylisrinne AI - tilanne' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nyt työn alla' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Viimeisimmät tapahtumat' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow,noarchive');
});
