import { expect, test, type Page } from '@playwright/test';

/**
 * VIEWER-QA-6, 26.11.2026. Pure synthetic GLB/URLs.
 * Tests a stale WORK_TEST load completing after a newer CURRENT user choice.
 * No protected R34 geometry, hosted scene, or HUMAN_REVIEW claim.
 */
const syntheticGlb = (name: string, source: string): Buffer => {
  const triangle = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0]
    .forEach((v, i) => triangle.writeFloatLE(v, i * 4));
  const json = {
    asset: { version: '2.0', extras: { ModelStage: 'WORK_TEST' } },
    scene: 0,
    scenes: [{ name: 'SYNTHETIC_QA6_' + name, nodes: [0] }],
    nodes: [{ name, mesh: 0, extras: {
      sourceLinks: [{ link: source, role: 'SYNTHETIC_SOURCE_ONLY', supports: 'Test fixture' }],
      ModelStage: 'WORK_TEST', current: false, asBuilt: false,
    } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: {
      baseColorFactor: [0.7, 0.7, 0.7, 1],
    } }],
    buffers: [{ byteLength: triangle.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: triangle.length, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3,
      type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] }],
  };
  const encoded = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([
    encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 0x20),
  ]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + triangle.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(triangle.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, triangle]);
};

async function selectCenterAndGetSource(page: Page): Promise<string> {
  const canvas = page.locator('#private-model-canvas');
  const select = page.locator('#selection-tool-button');
  if (await canvas.getAttribute('data-interaction-mode') !== 'select') {
    await select.evaluate((element: HTMLButtonElement) => element.click());
  }
  const rect = await canvas.boundingBox();
  expect(rect).not.toBeNull();
  await canvas.click({ position: { x: rect!.width / 2, y: rect!.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
  const links = page.locator('#selection-source-links-list a');
  await expect(links).toHaveCount(1);
  return (await links.first().getAttribute('href'))!;
}

async function runLateLoad(page: Page, lateStatus: 200 | 503) {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const urlA = 'https://drive.google.com/file/d/SYNTHETIC_QA6_A/view';
  const urlB = 'https://drive.google.com/file/d/SYNTHETIC_QA6_B/view';
  const urlC = 'https://drive.google.com/file/d/SYNTHETIC_QA6_C/view';
  const a = syntheticGlb('SYNTHETIC_QA6_A', urlA);
  const b = syntheticGlb('SYNTHETIC_QA6_B', urlB);
  const c = syntheticGlb('SYNTHETIC_QA6_C', urlC);
  let currentHit = 0;
  let workTestHit = 0;
  const bId = 'synthetic-qa6-b';
  let signalB!: () => void;
  let releaseB!: () => void;
  const bStarted = new Promise<void>(resolve => { signalB = resolve; });
  const bReleased = new Promise<void>(resolve => { releaseB = resolve; });
  let bNetworkFinished!: () => void;
  const bFinished = new Promise<void>(resolve => { bNetworkFinished = resolve; });

  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [{
      id: bId, label: 'Synthetic QA6 B', path: '/private-model/work-test/synthetic-qa6-b.glb',
    }] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/work-test/synthetic-qa6-b.glb', async route => {
    workTestHit++;
    signalB();
    await bReleased;
    await route.fulfill({
      status: lateStatus, contentType: 'model/gltf-binary',
      body: lateStatus === 200 ? b : Buffer.from('late synthetic 503'),
    });
    bNetworkFinished();
  });
  await page.route('**/private-model/model.glb', async route => {
    currentHit++;
    await route.fulfill({
      status: 200, contentType: 'model/gltf-binary', body: currentHit === 1 ? a : c,
    });
  });

  await page.goto('/private-model/');
  const status = page.locator('#viewer-status');
  await expect(status).toContainText('Malli ladattu', { timeout: 60_000 });
  expect(await selectCenterAndGetSource(page)).toBe(urlA);

  const loadB = () => page.locator(
    '#work-test-options button[data-work-test-candidate="synthetic-qa6-b"]',
  ).evaluate((element: HTMLButtonElement) => element.click());
  const loadC = () => page.locator('#current-model-button')
    .evaluate((element: HTMLButtonElement) => element.click());

  await expect(page.locator('#private-model-canvas')).toHaveAttribute(
    'data-work-test-catalog', 'ready',
  );
  try {
    await loadB(); // B: unresolved WORK_TEST request, older intent.
    await bStarted;
    await loadC(); // C: newer CURRENT intent, distinct URL to avoid loader coalescing.
    await expect(status).toContainText('Malli ladattu', { timeout: 60_000 });
    expect(await selectCenterAndGetSource(page)).toBe(urlC);
  } finally {
    // Always complete the held HTTP request, even when an earlier assertion fails.
    releaseB();
  }
  await bFinished;
  // Allow the normal loader's small synthetic GLB parse/error handlers to settle.
  await page.waitForTimeout(650);
  expect(currentHit).toBe(2);
  expect(workTestHit).toBe(1);
  await expect(status).toContainText('Malli ladattu');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-model-source', 'current');
  // A late B must not silently replace the visible C model or its source card.
  expect(await selectCenterAndGetSource(page)).toBe(urlC);
}

test('latest C selection wins when delayed B succeeds after C', async ({ page }) => {
  await runLateLoad(page, 200);
});

test('latest C selection and status survive delayed B HTTP failure', async ({ page }) => {
  await runLateLoad(page, 503);
});


test('overlapping A/B comparisons preserve the newest candidate and view state', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const bId = 'synthetic-qa6-b';
  const cId = 'synthetic-qa6-c';
  const bSource = 'https://drive.google.com/file/d/SYNTHETIC_QA6_B/view';
  const cSource = 'https://drive.google.com/file/d/SYNTHETIC_QA6_C/view';
  const b = syntheticGlb('SYNTHETIC_QA6_B', bSource);
  const c = syntheticGlb('SYNTHETIC_QA6_C', cSource);
  const a = syntheticGlb('SYNTHETIC_QA6_A', 'https://drive.google.com/file/d/SYNTHETIC_QA6_A/view');

  let beginB!: () => void;
  let releaseB!: () => void;
  let finishB!: () => void;
  const bStarted = new Promise<void>(resolve => { beginB = resolve; });
  const bReleased = new Promise<void>(resolve => { releaseB = resolve; });
  const bFinished = new Promise<void>(resolve => { finishB = resolve; });

  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [
      { id: bId, label: 'Synthetic QA6 B', path: '/private-model/work-test/synthetic-qa6-b.glb' },
      { id: cId, label: 'Synthetic QA6 C', path: '/private-model/work-test/synthetic-qa6-c.glb' },
    ] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: a }));
  await page.route('**/private-model/work-test/synthetic-qa6-b.glb', async route => {
    beginB();
    await bReleased;
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: b });
    finishB();
  });
  await page.route('**/private-model/work-test/synthetic-qa6-c.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: c }));

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(canvas).toHaveAttribute('data-work-test-catalog', 'ready');

  const choose = async (id: string) => page.locator('#work-test-select').evaluate(
    (element: HTMLSelectElement, choice: string) => {
      element.value = choice;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, id);
  const compare = () => page.locator('#compare-model-button')
    .evaluate((element: HTMLButtonElement) => element.click());

  try {
    await choose(bId);
    await compare();
    await bStarted;
    // The second comparison loads C while B is still pending.
    await choose(cId);
    await compare();
    await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
    await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
    await expect(canvas).toHaveAttribute('data-model-comparison-candidate', cId);
    expect(await selectCenterAndGetSource(page)).toBe(cSource);
  } finally {
    releaseB();
  }
  await bFinished;
  await page.waitForTimeout(650);
  // The late B callback must not restore B's snapshot or overwrite C's badge.
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute('data-model-comparison', 'active');
  await expect(canvas).toHaveAttribute('data-model-comparison-candidate', cId);
  expect(await selectCenterAndGetSource(page)).toBe(cSource);
});
