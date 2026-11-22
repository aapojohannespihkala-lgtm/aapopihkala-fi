import { expect, test, type Page } from '@playwright/test';

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

const openPresetMenu = async (page: Page) => {
  const menu = page.locator('#preset-menu');
  if ((await menu.getAttribute('open')) === null) {
    await menu.locator(':scope > summary').click();
  }
};

const selectResearchPreset = async (page: Page, name: 'Koko rakennus' | 'D-asunto') => {
  await openPresetMenu(page);
  await page.locator('#preset-menu').getByRole('button', { name, exact: true }).click();
};

const expectPerspectiveFreeOrbit = async (page: Page) => {
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(canvas).toHaveAttribute('data-camera-pan', 'enabled');
  await expect(canvas).toHaveAttribute('data-camera-zoom', 'enabled');
};

test('initial, whole-building, and D-apartment views keep perspective free orbit controls', async ({
  page,
}) => {
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: model,
    });
  });

  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');

  await expectPerspectiveFreeOrbit(page);

  await selectResearchPreset(page, 'Koko rakennus');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute(
    'data-standard-view-preset',
    'whole-building',
  );
  await expectPerspectiveFreeOrbit(page);

  await selectResearchPreset(page, 'D-asunto');
  await expect(page.locator('#private-model-canvas')).toHaveAttribute(
    'data-standard-view-preset',
    'd-apartment',
  );
  await expectPerspectiveFreeOrbit(page);
  await expect(page.getByRole('status')).toHaveText('D-asunto - molemmat kerrokset, vapaa 3D');
});

test('owner menu presets keep the active isometric or elevation camera direction', async ({ page }) => {
  // A synthetic fixture exercises the actual viewer controls without publishing
  // any original Ylisrinne geometry or requiring a protected model.
  const model = makeMinimalGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  });

  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');

  const cameraSnapshot = () => page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#private-model-canvas');
    const readout = document.querySelector<HTMLElement>('#ai-navigator-readout');
    return {
      view: canvas?.dataset.viewPreset ?? null,
      projection: canvas?.dataset.cameraProjection ?? null,
      look: readout?.dataset.lookVector ?? null,
      elevation: canvas?.dataset.elevationDirection ?? null,
    };
  });

  const chooseView = async (name: string) => {
    const menu = page.locator('#view-menu');
    if ((await menu.getAttribute('open')) === null) {
      await menu.locator(':scope > summary').click();
    }
    await menu.getByRole('button', { name, exact: true }).click();
  };

  for (const { viewButton, mode, projection } of [
    { viewButton: 'Isometrinen', mode: 'isometric', projection: 'orthographic' },
    { viewButton: 'Julk +Y', mode: 'elevation', projection: 'orthographic' },
  ]) {
    // Each independent camera mode starts from a fresh fixture. Switching
    // isometric -> elevation is a separate navigation action, not this test's
    // menu-preset preservation contract.
    await page.goto('/private-model/');
    await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
    await chooseView(viewButton);
    await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-view-preset', mode);
    const before = await cameraSnapshot();
    expect(before.projection).toBe(projection);
    expect(before.look).toMatch(/^X[+-]/);

    for (const preset of ['Koko rakennus', 'D-asunto'] as const) {
      await selectResearchPreset(page, preset);
      await expect.poll(cameraSnapshot, {
        message: `${preset} must preserve ${viewButton} camera orientation and projection`,
      }).toEqual(before);
    }
  }
});
