import { expect, test, type Page } from '@playwright/test';

const makeTriangleGlb = () => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] }],
    nodes: [{ name: 'ELEVATION_CAMERA_TEST', mesh: 0 }],
    meshes: [
      {
        name: 'TEST_TRIANGLE',
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
        min: [-1, -1, 0],
        max: [1, 1, 0],
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


const expectZScreenUp = async (page: Page) => {
  const zAxis = page.locator('#orientation-axis-z');
  const [x1, y1, x2, y2] = await Promise.all(
    ['x1', 'y1', 'x2', 'y2'].map(async (attribute) =>
      Number(await zAxis.getAttribute(attribute)),
    ),
  );

  expect(Math.abs(x2 - x1)).toBeLessThan(0.2);
  expect(y2).toBeLessThan(y1);
};

const expectElevation = async (
  page: Page,
  direction: 'pos-y' | 'neg-y' | 'pos-x' | 'neg-x',
  look: RegExp,
) => {
  await page.locator(`[data-desk-kind="angle"][data-desk-id="elev-${direction}"]`).click();

  const canvas = page.locator('#private-model-canvas');
  const aiNavigator = page.locator('#ai-navigator-readout');

  await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(canvas).toHaveAttribute('data-elevation-direction', direction);
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'yaw-only');
  await expect(canvas).toHaveAttribute('data-camera-pan', 'enabled');
  await expect(canvas).toHaveAttribute('data-camera-zoom', 'enabled');
  await expect(canvas).toHaveAttribute('data-camera-pitch', 'locked');
  await expect(canvas).toHaveAttribute('data-camera-roll', 'locked');
  await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
  await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
  await expect(aiNavigator).toHaveAttribute('data-frame', 'YLIS-G1-LOCAL');
  await expect(aiNavigator).toHaveAttribute('data-look-vector', look);

  await expectZScreenUp(page);
};

test('all elevation presets keep orthographic yaw-only controls and YLIS Z screen-up', async ({
  page,
}) => {
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  await expectElevation(page, 'pos-y', /X[+-]0\.00 Y-1\.00 Z[+-]0\.00/);
  await expectElevation(page, 'neg-y', /X[+-]0\.00 Y\+1\.00 Z[+-]0\.00/);
  await expectElevation(page, 'pos-x', /X-1\.00 Y[+-]0\.00 Z[+-]0\.00/);
  await expectElevation(page, 'neg-x', /X\+1\.00 Y[+-]0\.00 Z[+-]0\.00/);
});

test('elevation to orbit and top transitions clear stale Z-scale state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: makeTriangleGlb() }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  const scale = page.locator('#height-scale');
  const labels = scale.locator('.height-scale-label');

  const enter = async (direction: 'pos-y' | 'neg-x') => {
    await page.locator(`[data-desk-kind="angle"][data-desk-id="elev-${direction}"]`).click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
    await expect(canvas).toHaveAttribute('data-elevation-direction', direction);
    await expect(canvas).toHaveAttribute('data-camera-pitch', 'locked');
    await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
    await expect(scale).toBeVisible();
    await expect.poll(() => labels.count()).toBeGreaterThan(1);
  };
  const leave = async (preset: 'orbit' | 'top') => {
    await page.locator(`[data-desk-kind="angle"][data-desk-id="${preset}"]`).click();
    await expect(canvas).toHaveAttribute('data-view-preset', preset);
    await expect(canvas).toHaveAttribute('data-height-scale-visible', 'false');
    await expect(scale).toBeHidden();
    await expect(labels).toHaveCount(0);
    for (const attribute of ['data-elevation-direction', 'data-height-scale-min-z',
      'data-height-scale-max-z', 'data-height-scale-step-m', 'data-camera-pitch', 'data-camera-roll']) {
      await expect.poll(() => canvas.getAttribute(attribute)).toBeNull();
    }
  };
  await enter('pos-y');
  await leave('orbit');
  await enter('neg-x');
  await leave('top');
  await enter('pos-y');
  await leave('orbit');
  expect(errors).toEqual([]);
});

test('four elevation rulers remain pixel-aligned through wheel zoom and north switches', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: makeTriangleGlb() }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

  const canvas = page.locator('#private-model-canvas');
  const scale = page.locator('#height-scale');
  const guides = scale.locator('.height-scale-guide');
  const labels = scale.locator('.height-scale-label');
  const northToggle = page.getByRole('button', {
    name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen',
  });
  const span = async () => {
    const min = Number(await canvas.getAttribute('data-height-scale-min-z'));
    const max = Number(await canvas.getAttribute('data-height-scale-max-z'));
    return max - min;
  };
  const expectProjectedTicks = async () => {
    const viewport = await canvas.boundingBox();
    const min = Number(await canvas.getAttribute('data-height-scale-min-z'));
    const max = Number(await canvas.getAttribute('data-height-scale-max-z'));
    expect(viewport).not.toBeNull();
    expect(max).toBeGreaterThan(min);
    const last = (await guides.count()) - 1;
    // A zoomed-in camera may show just one metric tick while remaining correctly aligned.
    expect(last).toBeGreaterThanOrEqual(0);
    for (const index of new Set([0, Math.floor(last / 2), last])) {
      const guide = guides.nth(index);
      const z = Number(await guide.getAttribute('data-height-m'));
      const box = await guide.boundingBox();
      expect(box).not.toBeNull();
      const expectedY = viewport!.y + (max - z) / (max - min) * viewport!.height;
      expect(Math.abs(box!.y - expectedY)).toBeLessThan(3);
    }
  };

  for (const direction of ['pos-y', 'neg-y', 'pos-x', 'neg-x'] as const) {
    await page.locator('[data-desk-kind="angle"][data-desk-id="elev-' + direction + '"]').click();
    await expect(canvas).toHaveAttribute('data-elevation-direction', direction);
    await expect(canvas).toHaveAttribute('data-height-scale-visible', 'true');
    await expect(scale).toBeVisible();
    await expect.poll(() => guides.count()).toBeGreaterThan(1);
    await expectProjectedTicks();

    const initialSpan = await span();
    await canvas.hover();
    await page.mouse.wheel(0, -320);
    await expect.poll(span).toBeLessThan(initialSpan - 0.01);
    await expectProjectedTicks();

    const oldLabels = await labels.allTextContents();
    await northToggle.click();
    await expect(canvas).toHaveAttribute('data-height-scale-north-reference', 'EPSG:3879');
    await expect(canvas).toHaveAttribute('data-height-scale-frame', 'N2000-CONDITIONAL-WORK_TEST');
    await expectProjectedTicks();
    await northToggle.click();
    await expect(canvas).toHaveAttribute('data-height-scale-north-reference', 'YLIS-G1-LOCAL');
    await expect(canvas).toHaveAttribute('data-height-scale-frame', 'YLIS-G1-LOCAL');
    expect(await labels.allTextContents()).toEqual(oldLabels);
    await expectProjectedTicks();
  }

  expect(errors).toEqual([]);
});
