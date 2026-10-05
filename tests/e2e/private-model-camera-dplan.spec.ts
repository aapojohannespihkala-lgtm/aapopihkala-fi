import { expect, test, type Page } from '@playwright/test';

const makeDPlanGlb = () => {
  const positions = Buffer.alloc(36);
  [-1, 0, -1, 1, 0, -1, 0, 0, 1].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });

  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [1, 2] },
    ],
    nodes: [
      { name: 'WHOLE_BUILDING_CONTEXT', mesh: 0 },
      { name: 'D_1F_CAMERA_TEST', mesh: 0, translation: [0, 0, 0] },
      { name: 'D_2F_CAMERA_TEST', mesh: 0, translation: [0, 2.8, 0] },
    ],
    meshes: [
      {
        name: 'D_PLAN_CAMERA_TEST_TRIANGLE',
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
        min: [-1, 0, -1],
        max: [1, 0, 1],
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

const clickPreset = async (page: Page, name: 'D 1F' | 'D 2F') => {
  const menu = page.locator('#preset-menu');
  if ((await menu.getAttribute('open')) === null) {
    await menu.locator(':scope > summary').click();
  }
  await page.getByRole('button', { name, exact: true }).click();
};

const expectLockedDPlanCamera = async (page: Page, floor: '1F' | '2F') => {
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-view-preset', 'd-plan');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'disabled');
  await expect(canvas).toHaveAttribute('data-camera-pan', 'enabled');
  await expect(canvas).toHaveAttribute('data-camera-zoom', 'enabled');
  await expect(canvas).toHaveAttribute('data-content-scene', 'd-interior');
  await expect(canvas).toHaveAttribute('data-content-floor', floor);
  await expect(canvas).not.toHaveAttribute('data-camera-pitch', /.+/);
  await expect(canvas).not.toHaveAttribute('data-camera-roll', /.+/);
};

test('D 1F and D 2F plans stay orthographic pan/zoom views without rotation', async ({ page }) => {
  const model = makeDPlanGlb();

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');

  await clickPreset(page, 'D 1F');
  await expectLockedDPlanCamera(page, '1F');

  await clickPreset(page, 'D 2F');
  await expectLockedDPlanCamera(page, '2F');
});
