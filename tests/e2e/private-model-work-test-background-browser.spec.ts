import { expect, test } from '@playwright/test';

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

test('private viewer waits beyond the old 6 s limit for bounded server P150G seed', async ({ page }) => {
  test.setTimeout(20_000);

  const currentModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });
  const candidateModel = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      {
        name: 'P150G WHOLE-BUILDING + END-PLINTH HUMAN-REVIEW CORRECTION - BABYLON Y-UP',
        nodes: [],
      },
    ],
    nodes: [],
  });
  const candidateId = 'p150g-whole-building-end-plinth';
  const candidateLabel = 'P150G whole-building end-plinth correction - WORK_TEST';
  const candidatePath = '/private-model/work-test/p150g-whole-building-end-plinth.glb';
  const sourceUrl = 'https://unit.oaiusercontent.com/files/p150g/raw?se=x&sig=y';
  let catalogRequests = 0;
  let importRequests = 0;
  let sourceRequests = 0;
  let uploadRequests = 0;

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/import.json', async (route) => {
    importRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 6_500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidate: { id: candidateId, label: candidateLabel, path: candidatePath },
        ready: true,
        seeded: true,
      }),
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    catalogRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route('https://unit.oaiusercontent.com/**', async (route) => {
    sourceRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });
  await page.route(`**/private-model/work-test/upload/${candidateId}.glb`, async (route) => {
    uploadRequests += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  const fragment = new URLSearchParams({
    workTestCandidate: candidateId,
    workTestImport: sourceUrl,
  }).toString();
  await page.goto(
    `/private-model/?review=p150g-whole-building-end-plinth-review#${fragment}`,
  );

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-import', 'ready', { timeout: 12_000 });
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'p150g-whole-building-end-plinth-review',
  );
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page).not.toHaveURL(/workTestImport=/);
  expect(importRequests).toBe(1);
  expect(catalogRequests).toBeGreaterThanOrEqual(1);
  expect(sourceRequests).toBe(0);
  expect(uploadRequests).toBe(0);
});
