import { expect, test, type Page } from '@playwright/test';
import { C80_R31_R300_WORK_TEST_ID } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

const id = C80_R31_R300_WORK_TEST_ID;
const path = `/private-model/work-test/${id}.glb`;
const review = `/private-model/?review=${id}-review`;
const fixture = process.env.C80_R31_R300_SCENE760_GLB_PATH;

function currentGlb() {
  const json = Buffer.from(JSON.stringify({
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [] }], nodes: [],
  }));
  const padding = (4 - json.length % 4) % 4;
  const header = Buffer.alloc(20);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + json.length + padding, 8);
  header.writeUInt32LE(json.length + padding, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([header, json, Buffer.alloc(padding, 0x20)]);
}

async function setup(page: Page, available = true) {
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ contentType: 'model/gltf-binary', body: currentGlb() }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ status: 404 }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: available ? [{ id, path, label: 'NIBE R300' }] : [] } }));
}

test('R300 review requires both a protected catalog candidate and exact bytes', async ({ page }) => {
  await setup(page, false);
  let modelRequests = 0;
  await page.route(`**${path}`, route => {
    modelRequests++;
    return route.fulfill({ contentType: 'model/gltf-binary', body: currentGlb() });
  });

  const canvas = page.locator('#private-model-canvas');
  const controls = page.locator('#r300-work-test-views');
  const status = page.locator('#viewer-status');
  await page.goto(review);
  await expect(status).toContainText('ei ole palvelinpuolen katalogissa');
  expect(modelRequests).toBe(0);
  await expect(controls).toBeHidden();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');

  await setup(page);
  await page.reload();
  await expect(status).toHaveText('WORK_TEST-kandidaattia ei voitu avata');
  expect(modelRequests).toBe(1);
  await expect(controls).toBeHidden();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(canvas).not.toHaveAttribute('data-r300-work-test-view', /.+/);
});

test('verified original R300 switches in the viewer without leaving the active camera projection', async ({ page }) => {
  test.skip(!fixture, 'Requires the private original GLB in the local test environment');
  test.setTimeout(150_000);
  await setup(page);
  await page.route(`**${path}`, route =>
    route.fulfill({ contentType: 'model/gltf-binary', path: fixture }));

  await page.goto(review);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-r300-work-test-view', 'normal', { timeout: 100_000 });
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  const projection = await canvas.getAttribute('data-camera-projection');
  expect(projection).toBeTruthy();

  await page.locator('#model-menu summary').click();
  const normal = page.getByRole('button', { name: 'Normaali', exact: true });
  const service = page.getByRole('button', { name: 'Huolto', exact: true });
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  await service.click();
  await expect(service).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-r300-work-test-view', 'service');
  await expect(canvas).toHaveAttribute('data-camera-projection', projection!);
  await normal.click();
  await expect(normal).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-r300-work-test-view', 'normal');
  await expect(canvas).toHaveAttribute('data-camera-projection', projection!);

  await page.locator('#current-model-button').click();
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  await expect(page.locator('#r300-work-test-views')).toBeHidden();
  await expect(canvas).not.toHaveAttribute('data-r300-work-test-view', /.+/);
});
