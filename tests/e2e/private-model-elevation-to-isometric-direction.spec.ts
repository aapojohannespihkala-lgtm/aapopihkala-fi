import { expect, test } from '@playwright/test';

// Two independent meshes let the real toolbar exercise both whole-building
// and D-focused transitions without loading protected Ylisrinne geometry.
const makeSyntheticGlb = () => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((v, i) =>
    positions.writeFloatLE(v, i * 4));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [0, 1] }],
    nodes: [
      { name: 'TEST_D_CONTENT', mesh: 0, translation: [5.3, 1.5, 0] },
      { name: 'TEST_OTHER_CONTENT', mesh: 0, translation: [13, 1.5, 0] },
    ],
    meshes: [{ name: 'TEST_TRIANGLE', primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [{
      bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
      min: [-1, -1, 0], max: [1, 1, 0],
    }],
  };
  const source = Buffer.from(JSON.stringify(json), 'utf8');
  const padded = Buffer.concat([source, Buffer.alloc((4 - source.length % 4) % 4, 0x20)]);
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
};

for (const preset of ['whole-building', 'd-roof'] as const) {
  test('elevation to isometric restores a 3D camera direction for ' + preset, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.route('**/private-model/model.glb', route => route.fulfill({
      contentType: 'model/gltf-binary', body: makeSyntheticGlb(),
    }));
    await page.route('**/private-model/work-test/catalog.json', route =>
      route.fulfill({ status: 404 }));
    await page.goto('/private-model/');
    await expect(page.getByRole('status')).toHaveText('Malli ladattu');

    const canvas = page.locator('#private-model-canvas');
    const readout = page.locator('#ai-navigator-readout');
    const angle = (name: string) =>
      page.locator('[data-desk-kind="angle"][data-desk-id="' + name + '"]');
    const presetButton = page.locator('[data-desk-kind="preset"][data-desk-id="' + preset + '"]');
    const pose = () => page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('#ai-navigator-readout');
      return JSON.parse(el?.dataset.worldPose || 'null') as {
        frame: string; projection: string; direction: number[]; target: number[];
      } | null;
    });

    await presetButton.click();
    await expect(presetButton).toHaveAttribute('aria-pressed', 'true');
    await angle('elev-pos-x').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'elevation');
    await expect(canvas).toHaveAttribute('data-elevation-direction', 'pos-x');
    await expect(readout).toHaveAttribute('data-ready', 'true');

    const elevation = await pose();
    expect(elevation?.frame).toBe('THREE_WORLD_Y_UP');
    expect(Math.abs(elevation!.direction[0])).toBeGreaterThan(0.95);
    expect(Math.abs(elevation!.direction[1])).toBeLessThan(0.05);
    expect(Math.abs(elevation!.direction[2])).toBeLessThan(0.05);
    const focus = await canvas.getAttribute('data-d-focus-ghost');

    await angle('iso').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'isometric');
    await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
    await expect(angle('iso')).toHaveAttribute('aria-pressed', 'true');
    await expect(presetButton).toHaveAttribute('aria-pressed', 'true');
    if (preset === 'd-roof') {
      expect(focus).toMatch(/^d-roof\|/);
      await expect(canvas).toHaveAttribute('data-d-focus-ghost', focus!);
    }

    const isometric = await pose();
    expect(isometric?.frame).toBe('THREE_WORLD_Y_UP');
    // Isometric means a three-quarter world direction, not just an
    // orthographic projection with the previous E-elevation look vector.
    for (const value of isometric!.direction) {
      expect(Math.abs(value)).toBeGreaterThan(0.25);
    }

    await angle('orbit').click();
    await expect(canvas).toHaveAttribute('data-view-preset', 'orbit');
    await expect(canvas).toHaveAttribute('data-camera-projection', 'perspective');
    await expect(presetButton).toHaveAttribute('aria-pressed', 'true');
    const orbit = await pose();
    expect(orbit?.frame).toBe('THREE_WORLD_Y_UP');
    // Once ISO is established, projection-only ISO -> 3D preserves its pose.
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(orbit!.direction[i] - isometric!.direction[i])).toBeLessThan(1e-5);
      expect(Math.abs(orbit!.target[i] - isometric!.target[i])).toBeLessThan(1e-5);
    }
  });
}
