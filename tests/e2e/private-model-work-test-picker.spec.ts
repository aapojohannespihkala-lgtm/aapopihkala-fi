import { expect, test } from '@playwright/test';

import {
  groupWorkTestCandidatesForPicker,
  workTestCandidateLabelDate,
  workTestCandidateMatchesFilter,
  workTestCandidateOptionText,
} from '../../src/scripts/privateModelWorkTestPicker';
import { formatSelectionDimensionsFi } from '../../src/scripts/privateModelSelectionPanel';

const candidate = (id: string, label: string) => ({
  id,
  label,
  path: `/private-model/work-test/${id}.glb`,
});

// Catalog order is registration order (oldest first), as served by the Worker.
const catalog = [
  candidate('p136b-d-current-wall-corrected', 'p136B - D current wall corrected'),
  candidate('p143a-scalgo-terrain', 'p143A SCALGO terrain + architecture - WORK_TEST'),
  candidate(
    'auto-koko-rakennus-aaaa1111',
    'Auto: Ylisrinne KOKO RAKENNUS T12 WORK TEST 20261019 (scene63) - WORK_TEST',
  ),
  candidate('auto-salaojat-bbbb2222', 'Auto: Ylisrinne SALAOJAT KOKO JARJESTELMA WORK TEST 20261020 - WORK_TEST'),
  candidate(
    'auto-d1f-themo-cccc3333',
    'Auto: Ylisrinne D1F KPH09 THEMO WORK TEST SOURCE68 20261019 (scene68) - WORK_TEST',
  ),
  candidate('auto-kph09-keinu-dddd4444', 'Auto: Ylisrinne D1F KPH09 KEINU JA KIERTO WORK TEST 20261020 (scene69) - WORK_TEST'),
];

test('WORK_TEST picker groups automatic versions newest date first and manual versions last', () => {
  const groups = groupWorkTestCandidatesForPicker(catalog);
  expect(groups.map((group) => group.label)).toEqual([
    'Automaattijulkaisut 20.10.2026',
    'Automaattijulkaisut 19.10.2026',
    'Aiemmat tarkistusversiot',
  ]);
  expect(groups.map((group) => group.candidates.map((item) => item.id))).toEqual([
    ['auto-kph09-keinu-dddd4444', 'auto-salaojat-bbbb2222'],
    ['auto-d1f-themo-cccc3333', 'auto-koko-rakennus-aaaa1111'],
    ['p143a-scalgo-terrain', 'p136b-d-current-wall-corrected'],
  ]);
  // Every catalog entry appears exactly once.
  expect(groups.flatMap((group) => group.candidates).length).toBe(catalog.length);
});

test('WORK_TEST picker puts dated review versions in newest-first date order, newest model on top', () => {
  const withReviews = [
    ...catalog,
    candidate('c80-succ455-savo483-20261114', 'C80 483 - Savo: D 1F - WORK_TEST/HOST_HOLD'),
    candidate('auto-later-eeee5555', 'Auto: Ylisrinne C80 MJ79 WORK TEST 20261112 - WORK_TEST'),
    candidate('c80-ww74-l150-d1f-site-sewer-20261115', 'C80 488 - viemäri: D 1F -> L150-runko - WORK_TEST/HOST_HOLD'),
  ];
  const groups = groupWorkTestCandidatesForPicker(withReviews);
  expect(groups.map((group) => group.label)).toEqual([
    'Tarkistusversiot 15.11.2026',
    'Tarkistusversiot 14.11.2026',
    'Automaattijulkaisut 12.11.2026',
    'Automaattijulkaisut 20.10.2026',
    'Automaattijulkaisut 19.10.2026',
    'Aiemmat tarkistusversiot',
  ]);
  expect(groups[0].candidates[0].id).toBe('c80-ww74-l150-d1f-site-sewer-20261115');
  expect(groups.flatMap((group) => group.candidates).length).toBe(withReviews.length);
});

test('WORK_TEST picker puts the higher C80 model number first within the same review date', () => {
  const groups = groupWorkTestCandidatesForPicker([
    ...catalog,
    candidate('c80-530-v27-no-trench-terrain-20261115', 'C80 530 - V27 maasto - 15.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-524-rain-zones-t110-kvv-20261115', 'C80 524 - KV-nousut - 15.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-488-x-20261115', 'C80 488 - viemäri - WORK_TEST/HOST_HOLD'),
  ]);
  expect(groups[0].label).toBe('Tarkistusversiot 15.11.2026');
  expect(groups[0].candidates.map((c) => c.id)).toEqual([
    'c80-530-v27-no-trench-terrain-20261115', 'c80-524-rain-zones-t110-kvv-20261115', 'c80-488-x-20261115',
  ]);
});

test('WORK_TEST picker puts the newest C80 revision first within the same review date', () => {
  // Owner 17.11.2026: the latest WORK_TEST must always be at the top, whatever the catalog order.
  const groups = groupWorkTestCandidatesForPicker([
    candidate('c80-620r13-x', 'C80 620R13 - kotelo - 17.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-620r12-x', 'C80 620R12 - kanava - 17.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-620r11-x', 'C80 620R11 - välykset - 17.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-614r10-x', 'C80 614 R10 - porras - 17.11.2026 WORK_TEST/HOST_HOLD'),
    candidate('c80-608c-x', 'C80 608C - korjaukset - 17.11.2026 WORK_TEST/HOST_HOLD'),
  ]);
  expect(groups[0].candidates.map((item) => item.id)).toEqual([
    'c80-620r13-x', 'c80-620r12-x', 'c80-620r11-x', 'c80-614r10-x', 'c80-608c-x',
  ]);
});

test('WORK_TEST picker helpers parse dates, shorten auto labels and filter by all terms', () => {
  expect(workTestCandidateLabelDate('x 20261019 y 20261020 (scene69)')).toBe('2026-10-20');
  expect(workTestCandidateLabelDate('SOURCE156 scene300 no date')).toBeNull();
  expect(workTestCandidateLabelDate('bad 20261399')).toBeNull();

  expect(workTestCandidateOptionText(catalog[5])).toBe(
    'Ylisrinne D1F KPH09 KEINU JA KIERTO WORK TEST 20261020 (scene69)',
  );
  expect(workTestCandidateOptionText(catalog[0])).toBe('p136B - D current wall corrected');

  expect(workTestCandidateMatchesFilter(catalog[4], 'scene68')).toBe(true);
  expect(workTestCandidateMatchesFilter(catalog[4], 'd1f   themo')).toBe(true);
  expect(workTestCandidateMatchesFilter(catalog[4], 'd1f salaojat')).toBe(false);
  expect(workTestCandidateMatchesFilter(catalog[4], '  ')).toBe(true);
});

test('selection dimensions use YLIS-G1-LOCAL axes from viewer world bounds', () => {
  // Viewer world: x = X, -z = Y, y = Z.
  expect(formatSelectionDimensionsFi({ x: 1, y: 0.1, z: -3 }, { x: 2.25, y: 2.5, z: -2.4 })).toBe(
    'X 1,25 × Y 0,60 × Z 2,40 m · Z 0,10…2,50',
  );
});

const makeMinimalGlb = (json: Record<string, unknown>) => {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonChunk.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);
  return Buffer.concat([header, chunkHeader, jsonChunk]);
};

test('private viewer preselects the newest WORK_TEST and filters the version list', async ({ page }) => {
  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] }],
    nodes: [],
  });
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel }),
  );
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: catalog }),
    }),
  );

  await page.goto('/private-model/');
  const select = page.locator('#work-test-select');
  const filter = page.locator('#work-test-filter');
  await expect(select).toBeEnabled();
  await expect(select).toHaveValue('auto-kph09-keinu-dddd4444');
  await expect(select.locator('optgroup')).toHaveCount(3);
  await expect(page.locator('#work-test-count')).toHaveText('6 versiota, uusin ensin');

  await page.locator('#model-menu summary').click();
  await filter.fill('scene68');
  await expect(select).toHaveValue('auto-d1f-themo-cccc3333');
  await expect(select.locator('option')).toHaveCount(1);
  await expect(page.locator('#work-test-count')).toHaveText('1 / 6 versiota vastaa suodatusta');
  await expect(page.locator('#work-test-button')).toBeEnabled();

  await filter.fill('ei-osumaa');
  await expect(select.locator('option')).toHaveCount(0);
  await expect(page.locator('#work-test-button')).toBeDisabled();

  await filter.fill('');
  await expect(select.locator('option')).toHaveCount(6);
  await expect(page.locator('#work-test-button')).toBeEnabled();
});
