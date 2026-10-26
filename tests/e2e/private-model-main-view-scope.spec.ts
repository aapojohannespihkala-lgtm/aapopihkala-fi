import { expect, test, type Page } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { createMainViewScope } from '../../src/scripts/privateModelMainViewScope';

const scope = (key: string, apartmentScope = 'D', storeyScope = '1F', role = 'CONTENT', phaseScope = 'ACTIVE_IN_SELECTED_WORKTEST') =>
  ({ objectKey: key, apartmentScope, storeyScope, role, phaseScope });

test('main scene scope excludes other apartments, unresolved ownership, history and unsplit BOTH objects', () => {
  const root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial();
  const data = [scope('lower'), scope('upper', 'D', '2F'), scope('outside', 'D', 'OUTSIDE_1F', 'OUTDOOR_D'),
    scope('shared', 'SHARED_CD', 'BOTH', 'SHARED_BOUNDARY'), scope('stairs', 'D', 'BOTH', 'VERTICAL_CONNECTOR'),
    scope('a', 'A'), scope('b', 'B'), scope('c', 'C'), scope('site', 'SITE', 'UNKNOWN'),
    scope('unknown', 'UNKNOWN'), scope('old', 'D', '1F', 'CONTENT', 'HISTORICAL'),
    scope('reference', 'D', '1F', 'REFERENCE_ONLY'), scope('cover', 'D', '1F', 'UPPER_OCCLUDER'),
    scope('cover-both', 'D', 'BOTH', 'UPPER_OCCLUDER'), scope('roof', 'D', 'ROOF', 'CONTENT')];
  const meshes = data.map((s) => {
    const object = new THREE.Mesh(new THREE.BoxGeometry(), material);
    object.userData = { ylisViewScope: s, sourceDocIds: ['fixture-source'], geometryConfidence: 'WORK_TEST' };
    root.add(object);
    return object;
  });
  const original = meshes.map((o) => JSON.stringify(o.userData));
  const filter = createMainViewScope(root);
  expect(filter.available).toBe(true);
  const report = filter.apply('1F')!;
  expect(meshes.filter((o) => o.visible).map((o) => o.userData.ylisViewScope.objectKey)).toEqual(['lower', 'outside']);
  expect(report.exceptions.filter((e) => e.reason === 'STOREY_CLIPPING_PENDING').map((e) => e.objectKey)).toEqual(['shared', 'stairs']);
  // T06 covers that span both levels are omitted, not spuriously marked as
  // unsplittable T04/T05 geometry. ROOF also stays hidden in single-floor views.
  expect(report.exceptions.some((e) => ['cover-both', 'roof'].includes(e.objectKey))).toBe(false);
  expect(report.exceptions.some((e) => e.objectKey === 'site')).toBe(false);
  // A separate layer toggle may try to reveal these meshes while D/1F is
  // selected. T06 must still enforce the selected-floor occlusion mask.
  for (const key of ['cover-both', 'roof']) {
    const cover = meshes.find((o) => o.userData.ylisViewScope.objectKey === key)!;
    cover.visible = true;
  }
  filter.enforce();
  for (const key of ['cover-both', 'roof']) {
    expect(meshes.find((o) => o.userData.ylisViewScope.objectKey === key)?.visible).toBe(false);
  }
  const upperReport = filter.apply('2F')!;
  expect(meshes.filter((o) => o.visible).map((o) => o.userData.ylisViewScope.objectKey)).toEqual(['upper']);
  expect(upperReport.exceptions.filter((e) => e.reason === 'STOREY_CLIPPING_PENDING').map((e) => e.objectKey)).toEqual(['shared', 'stairs']);
  filter.apply('BOTH');
  expect(meshes.filter((o) => o.visible).map((o) => o.userData.ylisViewScope.objectKey)).toEqual(['lower', 'upper', 'outside', 'shared', 'stairs', 'cover', 'cover-both', 'roof']);
  meshes[7].visible = true; // a layer toggle must not leak C back into the D scope
  filter.enforce();
  expect(meshes[7].visible).toBe(false);
  filter.restore();
  expect(meshes.every((o) => o.visible && o.material === material)).toBe(true);
  expect(meshes.map((o) => JSON.stringify(o.userData))).toEqual(original);
});

test('names and duplicate keys cannot establish D ownership and original hidden objects stay hidden', () => {
  const root = new THREE.Group();
  const add = (s?: ReturnType<typeof scope>) => {
    const object = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    object.name = 'D_1F_ROOM';
    if (s) object.userData.ylisViewScope = s;
    root.add(object);
    return object;
  };
  const noMetadata = add();
  expect(createMainViewScope(root).available).toBe(false);
  const firstDuplicate = add(scope('duplicate'));
  add(scope('duplicate'));
  expect(createMainViewScope(root).available).toBe(false);
  const hidden = add(scope('valid', 'D', '2F'));
  hidden.visible = false;
  const filter = createMainViewScope(root);
  filter.apply('1F');
  expect(firstDuplicate.visible).toBe(false);
  expect(noMetadata.visible).toBe(false);
  filter.apply('BOTH');
  expect(hidden.visible).toBe(false);
  filter.restore();
  expect(hidden.visible).toBe(false);
  expect(noMetadata.visible).toBe(true);
});

const fixture = (withScope = true, withElectrical = false) => {
  const positions = Buffer.alloc(36);
  [-.5, -.5, 0, .5, -.5, 0, 0, .5, 0].forEach((n, i) => positions.writeFloatLE(n, i * 4));
  const data = [scope('lower'), scope('upper', 'D', '2F'), scope('other', 'C'),
    scope('unknown', 'UNKNOWN'), scope('shared', 'SHARED_CD', 'BOTH', 'SHARED_BOUNDARY'),
    scope('old', 'D', '1F', 'CONTENT', 'HISTORICAL')];
  const json = {
    asset: { version: '2.0' }, scene: 0,
    scenes: [{ name: 'main', nodes: data.map((_, i) => i) },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [data.length] }],
    nodes: [...data.map((s, i) => ({ name: s.objectKey, mesh: 0, translation: [i * 2, i === 1 ? 3 : 0, 0],
      extras: { ...(withScope ? { ylisViewScope: s } : {}),
        ...(withElectrical && i === 2 ? { presentationLayer: 'MEP_ELECTRICAL' } : {}) } })), { name: 'legacy-interior', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [.5, .7, .8, 1] } }],
    buffers: [{ byteLength: 36 }], bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-.5, -.5, 0], max: [.5, .5, 0] }],
  };
  const bytes = Buffer.from(JSON.stringify(json));
  const chunk = Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20);
  header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + chunk.length + positions.length, 8);
  header.writeUInt32LE(chunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(36); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, chunk, binHeader, positions]);
};
const menu = async (page: Page, id: string) => {
  if (await page.locator(id).getAttribute('open') === null) await page.locator(`${id} > summary`).click();
};

for (const width of [1280, 390]) test(`main model area/floor, independent cameras and reset work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/private-model/model.glb', (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fixture() }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.getByRole('status')).toContainText('Malli ladattu');
  await menu(page, '#preset-menu');
  await page.getByLabel('Alue päämallissa', { exact: true }).selectOption('D');
  await expect(canvas).toHaveAttribute('data-content-scene', 'full-model');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '3');
  await menu(page, '#preset-menu');
  await page.getByLabel('Kerros päämallissa', { exact: true }).selectOption('1F');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '1');
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(page.locator('#main-view-scope-note')).toContainText('osittainen');
  await menu(page, '#view-menu');
  await page.getByRole('button', { name: 'Ylhäältä', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-camera-projection', 'orthographic');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '1');
  await menu(page, '#view-menu');
  await page.getByRole('button', { name: 'Vapaa 3D', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  await menu(page, '#preset-menu');
  await page.getByLabel('Kerros päämallissa', { exact: true }).selectOption('2F');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '2F');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '1');
  await menu(page, '#more-menu');
  await page.getByRole('button', { name: 'Palauta näkymän oletukset', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '6');
  await expect(page.getByLabel('Kerros päämallissa', { exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('a legacy model keeps its existing D review and disables the main-model scope', async ({ page }) => {
  await page.route('**/private-model/model.glb', (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fixture(false) }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toContainText('Malli ladattu');
  await expect(page.getByLabel('Alue päämallissa', { exact: true })).toBeDisabled();
  await menu(page, '#preset-menu');
  await page.getByRole('button', { name: 'D-asunto', exact: true }).click();
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-content-scene', 'd-overview');
});

test('returning to the whole model preserves layer changes made inside the D scope', async ({ page }) => {
  await page.route('**/private-model/model.glb', (route) => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fixture(true, true) }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toContainText('Malli ladattu');
  await menu(page, '#preset-menu');
  await page.getByLabel('Alue päämallissa', { exact: true }).selectOption('D');
  await page.locator('#layers-button').click();
  await page.locator('#electrical-layer-visible').uncheck();
  await page.locator('#layers-button').click();
  await menu(page, '#preset-menu');
  await page.getByLabel('Alue päämallissa', { exact: true }).selectOption('WHOLE');
  await expect(page.locator('#electrical-layer-visible')).not.toBeChecked();
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-edge-source-mesh-count', '5');
});
