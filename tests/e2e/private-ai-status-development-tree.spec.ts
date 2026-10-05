import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('AI status development tree stays derived and lightweight', () => {
  const script = readFileSync('public/private-model/status.js', 'utf8');
  const page = readFileSync('src/pages/private-model/status/index.astro', 'utf8');

  expect(script).toContain('const DEVELOPMENT_STAGES = [');
  expect(script).toContain("laneCode || ''");
  expect(script).toContain('renderJourneys(data)');
  expect(script).toContain('const journeyItems = (data) =>');
  expect(script).toContain("data.humanAction ? 'human' : 'idle'");
  expect(script).toContain('renderDevelopment(data)');
  expect(page).toContain('id="journeys-title"');
  expect(page).toContain('id="journey-list"');
  expect(page).toContain('Matkat kohti valmista');
  expect(page).toContain('Tämä ei ole valmistumisprosentti');
  expect(page).toContain('id="development-title"');
  expect(page).toContain('id="development-flow"');
  expect(page).toContain('id="development-tree"');
  expect(page).toContain('Ei valmistumisprosentti');
  expect(page).not.toContain('canvas');
  expect(page).not.toContain('svg');
});

test('AI status journey renders a non-OPS goal from the published payload', async ({ page }) => {
  const payload = {
    version: 1,
    generatedAt: '2026-10-05T20:55:00Z',
    source: {
      documentId: '1MmJdjTZSUXiDS308bLNasdenyPJeXXZe4otwxHX62Go',
      modifiedTime: '2026-10-05T20:54:00Z',
      version: 'unit-test',
    },
    summary: {
      activePackages: 4,
      activeLines: 3,
      passesToday: 1,
    },
    active: [
      {
        id: 'model-goal',
        lane: '3D - rakennuksen vaippa',
        laneCode: 'M1 ENVELOPE',
        title: 'Ulkovaipan mallinnus',
        goal: 'Rakennuksen ulkovaippa oikeaksi katselumalliin',
        state: 'ACTIVE',
        updatedAt: '2026-10-05T20:53:00Z',
      },
      {
        id: 'ops-work',
        lane: 'Prosessi - eheys',
        laneCode: 'OPS8 PROCESS_INTEGRITY',
        title: 'Tekninen prosessihuolto',
        goal: 'Pidä sisäinen handoff eheänä',
        state: 'ACTIVE',
        updatedAt: '2026-10-05T20:52:00Z',
      },
      {
        id: 'status-survivor',
        lane: 'Viewer - integraatio',
        laneCode: 'V4 INTEGRATION_QA',
        title: 'AI status P0 survivor integration preflight r579',
        goal: 'Todista voiko parser-lifecycle + parser-arg-testikorjaus + Matkat kohti valmista yhdistyä yhteen fresh-main survivor-integraatioon ilman tiedostokonfliktia.',
        state: 'ACTIVE',
        updatedAt: '2026-10-05T20:51:00Z',
      },
      {
        id: 'status-terminal-qa',
        lane: 'Viewer - integraatio',
        laneCode: 'V4 INTEGRATION_QA',
        title: 'AI status terminal lifecycle branch QA r581',
        goal: 'Vie terminal lifecycle -korjaus branch-QA-PASS-porttiin, jotta status-survivor voidaan integroida.',
        state: 'ACTIVE',
        updatedAt: '2026-10-05T20:50:00Z',
      },
    ],
    recent: [],
    humanAction: null,
  };

  await page.route('**/private-model/status/data.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.goto('/private-model/status/');

  await expect(page.getByRole('heading', { name: 'Matkat kohti valmista' })).toBeVisible();
  const journeys = page.locator('#journey-list');
  await expect(journeys.locator('.journey-card')).toHaveCount(2);
  await expect(journeys.getByRole('heading', { name: 'Rakennuksen ulkovaippa oikeaksi katselumalliin' })).toBeVisible();
  await expect(journeys.getByRole('heading', { name: 'Tilannesivu valmiiksi ja tuotantoon' })).toBeVisible();
  await expect(journeys.locator('[aria-current="step"] .journey-step-label')).toHaveText(['3D-malli', 'Integraatio + QA']);
  const firstStep = journeys.locator('.journey-step').first();
  const stepNumber = await firstStep.locator('.journey-step-number').boundingBox();
  const stepLabel = await firstStep.locator('.journey-step-label').boundingBox();
  expect(stepNumber).not.toBeNull();
  expect(stepLabel).not.toBeNull();
  expect(stepLabel!.y - (stepNumber!.y + stepNumber!.height)).toBeGreaterThanOrEqual(5);
  await expect(journeys).not.toContainText('Tekninen prosessihuolto');
  await expect(journeys).not.toContainText('AI status P0 survivor integration preflight');
  await expect(journeys).not.toContainText('AI status terminal lifecycle branch QA');
  await expect(journeys).not.toContainText('parser-lifecycle + parser-arg-testikorjaus');
  await expect(journeys).not.toContainText('terminal lifecycle -korjaus');
});
