import { expect, test, type Page } from '@playwright/test';

/**
 * VIEWER-QA-1 / 26.11.2026. Synthetic camera-transition regression only.
 * No protected Ylisrinne GLB, scene claim, or production WebGL validation.
 */
function syntheticCameraGlb() {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => {
    positions.writeFloatLE(value, index * 4);
  });
  const json = {
    asset: { version: '2.0', generator: 'VIEWER-QA-1 synthetic camera guard' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      { name: 'TEST_D_CONTENT', mesh: 0, translation: [5.3, 1.5, 0] },
      { name: 'TEST_OTHER_CONTENT', mesh: 0, translation: [13, 1.5, 0] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [{
      bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
      min: [-1, -1, 0], max: [1, 1, 0],
    }],
  };
  const raw = Buffer.from(JSON.stringify(json));
  const padded = Buffer.concat([raw, Buffer.alloc((4 - raw.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + padded.length + 8 + positions.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(padded.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(positions.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, padded, binHeader, positions]);
}

async function openSyntheticViewer(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: syntheticCameraGlb() }));
  await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({ status: 404 }));
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  const toolbar = page.getByRole('toolbar', { name: 'Näkymät ja kuvakulmat' });
  await expect(toolbar).toBeVisible();
  return {
    canvas: page.locator('#private-model-canvas'),
    preset: (id: string) => toolbar.locator('[data-desk-kind="preset"][data-desk-id="' + id + '"]'),
    angle: (id: string) => toolbar.locator('[data-desk-kind="angle"][data-desk-id="' + id + '"]'),
  };
}

type CameraPose = { projection: string; direction: number[]; target: number[] };
async function cameraPose(page: Page): Promise<CameraPose> {
  return page.locator('#ai-navigator-readout').evaluate(readout =>
    JSON.parse((readout as HTMLElement).dataset.worldPose || 'null')) as Promise<CameraPose>;
}

test('E facade to isometric uses a non-elevation direction, then 3D remains usable', async ({ page }) => {
  const ui = await openSyntheticViewer(page);
  await ui.preset('whole-building').click();
  await ui.angle('elev-pos-x').click();
  await expect(ui.canvas).toHaveAttribute('data-view-preset', 'elevation');
  await expect(ui.canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
  const elevation = await cameraPose(page);
  expect(elevation.direction).toHaveLength(3);

  await ui.angle('iso').click();
  await expect(ui.canvas).toHaveAttribute('data-view-preset', 'isometric');
  await expect(ui.canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  const iso = await cameraPose(page);
  expect(iso.direction).toHaveLength(3);
  const dot = elevation.direction.reduce(
    (sum, component, i) => sum + component * iso.direction[i], 0);
  const length = (vector: number[]) => Math.hypot(...vector);
  const alignment = dot / (length(elevation.direction) * length(iso.direction));

  await ui.angle('orbit').click();
  await expect(ui.canvas).toHaveAttribute('data-view-preset', 'orbit');
  await expect(ui.canvas).toHaveAttribute('data-camera-projection', 'perspective');
  await expect(ui.preset('whole-building')).toHaveAttribute('aria-pressed', 'true');

  // Known SOURCE_RISK in index.astro: the iso action may restore the facade
  // pose with deskApplyPose. XFAIL keeps CI non-blocking until the runtime
  // index.astro owner can repair the behavior; an unexpected pass forces
  // removal of this annotation and a new exact CI receipt.
  test.fail(true, 'VIEWER-QA-1: E elevation pose is currently reapplied to the ISO camera');
  expect(Math.abs(alignment)).toBeLessThan(0.985);
});

test('D roof and D 2F remain selected through E facade, ISO and 3D', async ({ page }) => {
  const ui = await openSyntheticViewer(page);
  for (const preset of ['d-roof', 'd-2f'] as const) {
    await ui.preset(preset).click();
    await expect(ui.canvas).toHaveAttribute('data-d-focus-ghost', new RegExp('^' + preset.replace('-', '\\-') + '\\|'));
    const focus = await ui.canvas.getAttribute('data-d-focus-ghost');
    await ui.angle('elev-pos-x').click();
    await expect(ui.canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
    await ui.angle('iso').click();
    await expect(ui.canvas).toHaveAttribute('data-camera-projection', 'orthographic');
    await ui.angle('orbit').click();
    await expect(ui.canvas).toHaveAttribute('data-camera-projection', 'perspective');
    await expect(ui.canvas).toHaveAttribute('data-d-focus-ghost', focus!);
    await expect(ui.preset(preset)).toHaveAttribute('aria-pressed', 'true');
  }
});
