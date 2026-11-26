import { expect, test } from '@playwright/test';

const makeReviewGlb = () => {
  const positions = Buffer.alloc(36);
  [-4, -2, 0, 4, -2, 0, 0, 5, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P139AI HEIGHT SCALE TEST - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'P139AI_TEST_GEOMETRY', mesh: 0 }],
    meshes: [
      {
        name: 'P139AI_TEST_TRIANGLE',
        primitives: [{ attributes: { POSITION: 0 } }],
      },
    ],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-4, -2, 0],
        max: [4, 5, 0],
      },
    ],
  };

  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (positions.length % 4)) % 4;
  const binChunk = Buffer.concat([positions, Buffer.alloc(binPadding)]);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

test('map north aligns the plan camera while leaving the local model oblique', async ({ page }) => {
  const currentModel = makeReviewGlb();
  await page.route('**/private-model/model.glb', async route => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: currentModel });
  });
  await page.route('**/private-model/work-test/catalog.json', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [] }) });
  });

  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-model-source', 'current');
  const top = page.locator('[data-desk-kind="angle"][data-desk-id="top"]');
  const toggle = page.getByRole('button', { name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen' });
  const worldUp = async () => page.locator('#orientation-gizmo').evaluate(el => {
    const values = (el as HTMLElement).dataset.cameraQuaternion?.split('|').map(Number);
    if (!values || values.length !== 4 || values.some(v => !Number.isFinite(v))) {
      throw new Error('Camera quaternion missing from orientation gizmo');
    }
    const [x, y, z, w] = values;
    return [2 * (x*y - z*w), 1 - 2 * (x*x + z*z), 2 * (y*z + x*w)];
  });

  await top.click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  await expect(page.locator('#orientation-gizmo')).toHaveAttribute('data-north-frame', 'local');
  const localUp = await worldUp();
  expect(Math.abs(localUp[0])).toBeLessThan(0.002);
  expect(localUp[2]).toBeLessThan(-0.998);

  await toggle.click();
  await expect(page.locator('#orientation-gizmo')).toHaveAttribute('data-north-frame', 'map');
  // Existing contract: a cube click only switches the coordinate annotation,
  // not the currently active camera pose. Selecting the plan applies north-up.
  const unchangedUp = await worldUp();
  expect(Math.abs(unchangedUp[0] - localUp[0])).toBeLessThan(0.002);
  await top.click();
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  const mapUp = await worldUp();
  expect(mapUp[0]).toBeCloseTo(-0.370170648, 2);
  expect(mapUp[2]).toBeCloseTo(-0.928963773, 2);
  expect(Math.abs(mapUp[0])).toBeGreaterThan(0.35);

  // Asemapiirros is a content preset. Its old camera-pose restore must not
  // undo the explicit EPSG:3879 north-up selection.
  await page.locator('#preset-menu > summary').click();
  await page.locator('#site-preset-button').click();
  await expect(canvas).toHaveAttribute('data-standard-view-preset', 'site');
  await expect(canvas).toHaveAttribute('data-view-preset', 'top');
  const siteUp = await worldUp();
  expect(siteUp[0]).toBeCloseTo(-0.370170648, 2);
  expect(siteUp[2]).toBeCloseTo(-0.928963773, 2);

  await toggle.click();
  await top.click();
  const restored = await worldUp();
  expect(Math.abs(restored[0])).toBeLessThan(0.002);
  expect(restored[2]).toBeLessThan(-0.998);
});
