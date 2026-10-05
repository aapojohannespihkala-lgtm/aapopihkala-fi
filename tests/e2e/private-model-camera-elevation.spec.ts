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

const clickViewAction = async (page: Page, name: string) => {
  const menu = page.locator('#view-menu');
  if ((await menu.getAttribute('open')) === null) {
    await menu.locator(':scope > summary').click();
  }
  await page.getByRole('button', { name, exact: true }).click();
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
  button: 'Julk +Y' | 'Julk -Y' | 'Julk +X' | 'Julk -X',
  direction: 'pos-y' | 'neg-y' | 'pos-x' | 'neg-x',
  look: RegExp,
) => {
  await clickViewAction(page, button);

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

  await expectElevation(page, 'Julk +Y', 'pos-y', /X[+-]0\.00 Y-1\.00 Z[+-]0\.00/);
  await expectElevation(page, 'Julk -Y', 'neg-y', /X[+-]0\.00 Y\+1\.00 Z[+-]0\.00/);
  await expectElevation(page, 'Julk +X', 'pos-x', /X-1\.00 Y[+-]0\.00 Z[+-]0\.00/);
  await expectElevation(page, 'Julk -X', 'neg-x', /X\+1\.00 Y[+-]0\.00 Z[+-]0\.00/);
});
