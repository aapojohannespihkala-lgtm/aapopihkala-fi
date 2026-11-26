import { expect, test } from '@playwright/test';

/**
 * VIEWER-QA-1: the elevation -> isometric -> 3D path must not leave the
 * orthographic isometric view pointing along an elevation's face-on axis.
 * Synthetic geometry only. This does not certify protected R34 WebGL.
 */
function buildingFixture() {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((v, i) => positions.writeFloatLE(v, i * 4));
  const json = {
    asset: { version: '2.0', generator: 'VIEWER-QA-1 synthetic camera fixture' },
    scene: 0,
    scenes: [{ name: 'Synthetic camera orientation check', nodes: [0, 1] }],
    nodes: [
      { name: 'D_VISIBLE_TEST', mesh: 0, translation: [5.3, 1.5, 0],
        extras: { ylisViewScope: { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' } } },
      { name: 'OTHER_VISIBLE_TEST', mesh: 0, translation: [13, 1.5, 0] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
      min: [-1, -1, 0], max: [1, 1, 0] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 }],
    buffers: [{ byteLength: 36 }],
  };
  const raw = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([raw, Buffer.alloc((4 - raw.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + positions.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(positions.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, positions]);
}

for (const preset of ['whole-building', 'd-roof', 'd-2f'] as const) {
  test('facade to ISO and 3D changes angle without replacing content: ' + preset, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/private-model/model.glb', route =>
      route.fulfill({ contentType: 'model/gltf-binary', body: buildingFixture() }));
    await page.route('**/private-model/work-test/catalog.json', route =>
      route.fulfill({ json: { candidates: [] } }));
    await page.route('**/private-model/source-cards.json', route =>
      route.fulfill({ json: { modules: {} } }));
    await page.goto('/private-model/');
    await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
    const canvas = page.locator('#private-model-canvas');
    const readout = page.locator('#ai-navigator-readout');
    await expect(readout).toHaveAttribute('data-ready', 'true');
    const button = (kind: string, id: string) =>
      page.locator('[data-desk-kind="' + kind + '"][data-desk-id="' + id + '"]');
    const cameraPose = () => page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('#ai-navigator-readout');
      return JSON.parse(el?.dataset.worldPose || 'null');
    });
    const distance = (a: number[], b: number[]) =>
      Math.hypot(...a.map((v, i) => v - b[i]));

    await button('preset', preset).click();
    await expect(button('preset', preset)).toHaveAttribute('aria-pressed', 'true');
    const focus = await canvas.getAttribute('data-d-focus-ghost');
    const source = await canvas.getAttribute('data-model-source');
    await button('angle', 'elev-pos-x').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
    const elevation = await cameraPose();
    expect(elevation.frame).toBe('THREE_WORLD_Y_UP');
    expect(elevation.direction).toHaveLength(3);

    await button('angle', 'iso').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
    await expect(button('angle', 'iso')).toHaveAttribute('aria-pressed', 'true');
    const iso = await cameraPose();
    expect(iso.projection).toBe('orthographic');
    expect(iso.direction).toHaveLength(3);
    // A genuine isometric camera is oblique, not the face-on elevation
    // direction transferred via a generic projection-only pose restore.
    expect(distance(iso.direction, elevation.direction)).toBeGreaterThan(0.35);
    expect(await canvas.getAttribute('data-model-source')).toBe(source);
    expect(await canvas.getAttribute('data-d-focus-ghost')).toBe(focus);
    await expect(button('preset', preset)).toHaveAttribute('aria-pressed', 'true');

    await button('angle', 'orbit').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
    const perspective = await cameraPose();
    expect(perspective.projection).toBe('perspective');
    // By contrast, ISO -> 3D is a projection-only switch and preserves angle.
    expect(distance(perspective.direction, iso.direction)).toBeLessThan(1e-5);
    expect(await canvas.getAttribute('data-d-focus-ghost')).toBe(focus);
    await expect(button('preset', preset)).toHaveAttribute('aria-pressed', 'true');
  });
}
