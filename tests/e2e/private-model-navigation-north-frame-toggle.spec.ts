import { expect, test, type Page } from '@playwright/test';

/**
 * Real Chromium test of the existing private-model HUD and active Orbit camera.
 * This intentionally uses only a synthetic glTF fixture. It does not load,
 * publish or attest to any protected original Ylisrinne GLB.
 */
const makeMinimalGlb = () => {
  const json = Buffer.from(
    JSON.stringify({
      asset: { version: '2.0' },
      scene: 0,
      scenes: [
        { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
        { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
      ],
      nodes: [],
    }),
    'utf8',
  );
  const padding = Buffer.alloc((4 - (json.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([json, padding]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);
  const chunk = Buffer.alloc(8);
  chunk.writeUInt32LE(jsonChunk.length, 0);
  chunk.writeUInt32LE(0x4e4f534a, 4);
  return Buffer.concat([header, chunk, jsonChunk]);
};

const loadSyntheticViewer = async (page: Page) => {
  const glb = makeMinimalGlb();
  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }),
  );
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
};

const activeCameraState = (page: Page) =>
  page.evaluate(() => {
    const readout = document.querySelector<HTMLElement>('#ai-navigator-readout');
    const canvas = document.querySelector<HTMLCanvasElement>('#private-model-canvas');
    return {
      worldPose: readout?.dataset.worldPose ?? null,
      frame: readout?.dataset.frame ?? null,
      model: readout?.dataset.model ?? null,
      projection: canvas?.dataset.cameraProjection ?? null,
      cameraMode: canvas?.dataset.viewPreset ?? null,
      modelSource: canvas?.dataset.modelSource ?? null,
    };
  });

test('navigation gizmo switches local/map north on click without moving the actual camera', async ({ page }) => {
  await loadSyntheticViewer(page);

  const gizmo = page.locator('#orientation-gizmo');
  const button = gizmo.getByRole('button', {
    name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen',
  });
  const northLabel = page.locator('#orientation-north-label');
  const mapLine = gizmo.locator('svg [data-navigation-north="map-arrow"]');
  const readout = page.locator('#ai-navigator-readout');

  await expect(button).toBeVisible();
  await expect(gizmo).toHaveCSS('pointer-events', 'none');
  await expect(button).toHaveCSS('pointer-events', 'auto');
  await expect(readout).toHaveAttribute('data-ready', 'true');
  await expect(gizmo).toHaveAttribute('data-frame', 'YLIS-G1-LOCAL');
  await expect(gizmo).toHaveAttribute('data-north-reference', 'YLIS-G1-LOCAL');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveText('Pohjoinen: rakennus');
  await expect(northLabel).toHaveText('N');
  await expect(mapLine).toBeHidden();

  const before = await activeCameraState(page);
  expect(before.worldPose).not.toBeNull();
  expect(before.frame).toBe('YLIS-G1-LOCAL');

  await button.click();
  await expect(gizmo).toHaveAttribute('data-north-frame', 'map');
  await expect(gizmo).toHaveAttribute('data-north-reference', 'EPSG:3879');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveText('Pohjoinen: kartta');
  await expect(northLabel).toHaveText('N kartta');
  await expect(mapLine).toBeVisible();
  expect(await activeCameraState(page)).toEqual(before);

  // One more click restores exactly the former local view, not a second camera.
  await button.click();
  await expect(gizmo).toHaveAttribute('data-north-frame', 'local');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(northLabel).toHaveText('N');
  await expect(mapLine).toBeHidden();
  expect(await activeCameraState(page)).toEqual(before);
});

test('same north-reference switch is keyboard accessible in the compact viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await loadSyntheticViewer(page);
  const gizmo = page.locator('#orientation-gizmo');
  const button = gizmo.getByRole('button', {
    name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen',
  });
  await expect(button).toBeVisible();
  await expect(button).toHaveCSS('pointer-events', 'auto');
  const before = await activeCameraState(page);
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(gizmo).toHaveAttribute('data-north-reference', 'EPSG:3879');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(await activeCameraState(page)).toEqual(before);
  await page.keyboard.press('Space');
  await expect(gizmo).toHaveAttribute('data-north-reference', 'YLIS-G1-LOCAL');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await activeCameraState(page)).toEqual(before);
});
