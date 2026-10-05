import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

test('Ylisrinne AI status loader is compatible with the private-model CSP', async ({ page }) => {
  const pageSource = readFileSync('src/pages/private-model/status/index.astro', 'utf8');
  const workerSource = readFileSync('worker/privateModel.ts', 'utf8');

  expect(pageSource).toContain('<script src="/private-model/status.js" defer></script>');
  expect(pageSource).not.toContain('<script is:inline>');
  expect(workerSource).toContain("script-src 'self'");
  expect(workerSource).not.toContain("script-src 'self' 'unsafe-inline'");

  await page.goto('/private-model/status/');
  await expect(page.getByRole('heading', { name: 'Ylisrinne AI - tilanne' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow,noarchive');
  await expect(page.locator('script[src="/private-model/status.js"]')).toHaveCount(1);
});

test('Ylisrinne AI status renders published data in the browser', async ({ page }) => {
  await page.route('**/private-model/status/data.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sample),
    });
  });

  await page.goto('/private-model/status/');

  await expect(page.locator('#active-packages')).toHaveText('1');
  await expect(page.locator('#active-lines')).toHaveText('1');
  await expect(page.locator('#passes-today')).toHaveText('2');
  await expect(page.locator('#freshness')).toContainText('Tilanne muodostettu');
  await expect(page.getByRole('heading', { name: 'Tilannepaneeli' })).toBeVisible();
  await expect(
    page.locator('#active-list').getByText('Ylisrinne AI derived status dashboard'),
  ).toBeVisible();
  await expect(
    page.locator('#events').getByText('PASS - M5B PR #831 main integration'),
  ).toBeVisible();
  await expect(page.locator('#human-action')).toBeHidden();

  await expect(page.getByRole('heading', { name: 'Kehitysketju' })).toBeVisible();
  await expect(page.locator('.development-note')).toContainText('Ei valmistumisprosentti');
  await expect(page.locator('#development-flow [data-stage="qa"]')).toContainText('TYÖN ALLA');
  await expect(page.locator('#development-tree [data-stage="qa"]')).toContainText(
    'Ylisrinne AI derived status dashboard',
  );
  await expect(page.locator('#development-flow [data-stage="human"]')).toContainText(
    'EI AKTIIVISTA TEHTÄVÄÄ',
  );
});

test('handoff parser derives active work and completed passes without a second registry', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ylisrinne-status-'));
  const input = join(directory, 'handoff.txt');
  const output = join(directory, 'status.json');
  const fixture = [
    'DISPATCH-CLAIM - V1 CAMERA_NAV | claim-ID: 2026-10-05T18:18:00+03:00-v1-unit-r1 | scope-key: unit-camera | claim-aika: 2026-10-05T18:18:00+03:00 | tarkoitus: Tee kameratesti | tila: CLAIMED.',
    'VARAUS - unit camera work | kaista: V1 CAMERA_NAV | ajo-ID: 2026-10-05T18:18:00+03:00-v1-unit-r1 | scope-key: unit-camera | checkpoint-aika: 2026-10-05T18:19:00+03:00 | tila: AKTIIVINEN.',
    'DISPATCH-CLAIM - M1 ENVELOPE | claim-ID: 2026-10-05T17:50:00+03:00-m1-stale-r2 | scope-key: stale-envelope | claim-aika: 2026-10-05T17:50:00+03:00 | tarkoitus: Vanha claim | tila: CLAIMED.',
    'VALMIS / VARAUS VAPAUTETTU - unit integration | kaista: V4 INTEGRATION_QA | ajo-ID: 2026-10-05T18:10:00+03:00-v4-unit-r3 | päättyi: 2026-10-05T18:12:00+03:00 | tulos: PASS_UNIT | tila: VALMIS / VARAUS VAPAUTETTU.',
  ].join('\n');

  try {
    writeFileSync(input, fixture, 'utf8');
    execFileSync(
      'python3',
      [
        '.github/build-ai-status.py',
        input,
        output,
        '2026-10-05T15:19:30Z',
        '1234',
        '2026-10-05T15:20:00Z',
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );
    const payload = JSON.parse(readFileSync(output, 'utf8'));

    expect(payload.summary).toEqual({
      activePackages: 1,
      activeLines: 1,
      passesToday: 1,
    });
    expect(payload.active).toHaveLength(1);
    expect(payload.active[0]).toMatchObject({
      lane: 'Viewer - kamera',
      title: 'unit camera work',
      goal: 'Tee kameratesti',
      state: 'ACTIVE',
    });
    expect(payload.recent.some((entry: { state: string; title: string }) =>
      entry.state === 'PASS' && entry.title === 'unit integration'
    )).toBe(true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
