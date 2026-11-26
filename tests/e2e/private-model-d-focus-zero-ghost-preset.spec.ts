import { expect, test } from '@playwright/test';

/**
 * VIEWER-QA-7: a D-only scene has no outside meshes and therefore zero
 * D-focus ghost snapshots. A return to whole-building must still clear
 * the focus marker and selected preset icon. Synthetic GLB only.
 */
function allInsideDGlb(): Buffer {
  const positions = Buffer.alloc(36);
  [-0.2, 0, 0, 0.2, 0, 0, 0, 0.3, 0]
    .forEach((value, index) => positions.writeFloatLE(value, index * 4));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'QA7_D_ONLY_ZERO_GHOST', nodes: [0] }],
    nodes: [{
      name: 'D_1F_ONLY_TRIANGLE',
      mesh: 0,
      extras: { ylisViewScope: { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' } },
    }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length, target: 34962 }],
    accessors: [{
      bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
      min: [-0.2, 0, 0], max: [0.2, 0.3, 0],
    }],
  };
  const encoded = Buffer.from(JSON.stringify(json), 'utf8');
  const padded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + padded.length + 8 + positions.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(padded.length);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(positions.length);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, padded, binHeader, positions]);
}

test('D with zero ghost copies returns to whole building with correct icon and no stale marker', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: allInsideDGlb() }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  const canvas = page.locator('#private-model-canvas');
  const toolbar = page.getByRole('toolbar', { name: 'Näkymät ja kuvakulmat' });
  const preset = (id: string) => toolbar.locator('[data-desk-kind="preset"][data-desk-id="' + id + '"]');

  for (const focus of ['d-roof', 'd-apartment']) {
    await preset(focus).click();
    // The presentation snapshot set is empty even though the D marker is active.
    await expect(canvas).toHaveAttribute('data-d-focus-ghost',
      new RegExp('^' + focus + '\\|in:1\\|out:0\\|split:0\\|hidden:0\\|aids:0$'));
    await expect(preset(focus)).toHaveAttribute('aria-pressed', 'true');
    await preset('whole-building').click();
    await expect(canvas).toHaveAttribute('data-standard-view-preset', 'whole-building');
    await expect(canvas).not.toHaveAttribute('data-d-focus-ghost', /.+/);
    await expect(canvas).not.toHaveAttribute('data-d-focus-footprint', /.+/);
    await expect(preset('whole-building')).toHaveAttribute('aria-pressed', 'true');
    await expect(preset(focus)).toHaveAttribute('aria-pressed', 'false');
  }
  expect(errors).toEqual([]);
});
