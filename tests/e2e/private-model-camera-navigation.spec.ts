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

test('owner menu presets keep the active isometric or elevation camera direction', async ({ page }) => {
  // A synthetic fixture exercises the actual viewer controls without publishing
  // any original Ylisrinne geometry or requiring a protected model.
  // Reuse the elevation guard's visible-triangle GLB. Empty scenes cannot
  // activate elevation because the camera has no visible bounds to frame.
  const model = makeTriangleGlb();

  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');

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
    await expect(page.getByRole('status')).toHaveText('Malli ladattu');
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

test('exact 3D/isometric projection toggle preserves target, view direction and visible frame', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const model = makeTriangleGlb();
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu');
  const canvas = page.locator('#private-model-canvas');
  const readout = page.locator('#ai-navigator-readout');
  await expect(readout).toHaveAttribute('data-ready', 'true');

  const state = () => page.evaluate(() => {
    const canvasEl = document.querySelector<HTMLCanvasElement>('#private-model-canvas')!;
    const readoutEl = document.querySelector<HTMLElement>('#ai-navigator-readout')!;
    const pose = JSON.parse(readoutEl.dataset.worldPose || 'null');
    return {
      pose,
      frame: readoutEl.dataset.visibleBounds ?? '',
      model: canvasEl.dataset.modelSource ?? '',
      kept: canvasEl.dataset.deskPresetCameraKept ?? null,
      projectionSwitch: canvasEl.dataset.deskProjectionSwitch ?? null,
    };
  });
  const assertSamePose = (
    actual: Awaited<ReturnType<typeof state>>,
    reference: Awaited<ReturnType<typeof state>>,
  ) => {
    expect(actual.pose?.frame).toBe('THREE_WORLD_Y_UP');
    expect(actual.pose.target).toHaveLength(3);
    for (const key of ['target', 'direction'] as const) {
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(actual.pose[key][i] - reference.pose[key][i])).toBeLessThan(1e-5);
      }
    }
    // Human bounds are rounded to one decimal. A projection-only switch
    // can cross the 0.1 m display rounding threshold without changing the
    // machine-readable camera target or direction.
    const bounds = (label: string) =>
      (label.match(/[+-]?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const a = bounds(actual.frame), b = bounds(reference.frame);
    expect(a).toHaveLength(6);
    expect(b).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      expect(Math.abs(a[i] - b[i])).toBeLessThanOrEqual(0.15);
    }
  };
  const cameraButton = (id: 'iso' | 'orbit') =>
    page.locator(`.desk-toolbar [data-desk-kind="angle"][data-desk-id="${id}"]`);
  await expect(cameraButton('iso')).toBeVisible();

  const perspective = await state();
  expect(perspective.pose.projection).toBe('perspective');
  expect(perspective.frame).toBeTruthy();

  await cameraButton('iso').click();
  await expect(canvas).toHaveAttribute('data-desk-projection-switch', 'persp->iso');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  const iso = await state();
  expect(iso.pose.projection).toBe('orthographic');
  assertSamePose(iso, perspective);

  for (const preset of ['Koko rakennus', 'D-asunto'] as const) {
    await selectResearchPreset(page, preset);
    await expect(canvas).toHaveAttribute('data-desk-preset-camera-kept', 'exact');
    const afterPreset = await state();
    expect(afterPreset.pose.projection).toBe('orthographic');
    assertSamePose(afterPreset, perspective);
  }
  await cameraButton('orbit').click();
  await expect(canvas).toHaveAttribute('data-desk-projection-switch', 'iso->persp');
  await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
  const restored = await state();
  expect(restored.pose.projection).toBe('perspective');
  assertSamePose(restored, perspective);
});
