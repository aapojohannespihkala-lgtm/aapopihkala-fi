import { expect, test, type Page } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { createMainViewScope } from '../../src/scripts/privateModelMainViewScope';
import { createOtherFloorReference } from '../../src/scripts/privateModelOtherFloorReference';

const scope = (key: string, apartmentScope = 'D', storeyScope = '2F', role = 'CONTENT', phaseScope = 'ACTIVE_IN_SELECTED_WORKTEST') =>
  ({ objectKey: key, apartmentScope, storeyScope, role, phaseScope });

test('reference candidates share the main scope identity checks and retain source visibility', () => {
  const root = new THREE.Group();
  const add = (s: ReturnType<typeof scope>, parent: THREE.Object3D = root) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    m.userData = { ylisViewScope: s, sourceDocIds: ['fixture-source'], geometryConfidence: 'WORK_TEST' };
    parent.add(m); return m;
  };
  add(scope('lower', 'D', '1F'));
  const upper = add(scope('upper'));
  add(scope('shared', 'SHARED_CD', '2F', 'SHARED_BOUNDARY'));
  add(scope('outside', 'D', 'OUTSIDE_2F', 'OUTDOOR_D'));
  add(scope('C', 'C')); add(scope('unknown', 'UNKNOWN'));
  add(scope('old', 'D', '2F', 'CONTENT', 'HISTORICAL'));
  add(scope('both', 'D', 'BOTH', 'VERTICAL_CONNECTOR'));
  add(scope('roof', 'D', '2F', 'UPPER_OCCLUDER'));
  add(scope('reference', 'D', '2F', 'REFERENCE_ONLY'));
  add(scope('hidden')).visible = false;
  const hiddenParent = new THREE.Group(); hiddenParent.visible = false; root.add(hiddenParent);
  add(scope('hidden-parent'), hiddenParent);
  add(scope('duplicate')); add(scope('duplicate'));
  const filter = createMainViewScope(root);
  expect(filter.referenceCandidates()).toEqual([]);
  filter.apply('1F');
  const before = JSON.stringify(root.toJSON());
  expect(filter.referenceCandidates().map(c => c.objectKey)).toEqual(['upper', 'shared', 'outside']);
  expect(filter.referenceCandidates()[0].object).toBe(upper);
  expect(JSON.stringify(root.toJSON())).toBe(before);
  filter.apply('2F');
  expect(filter.referenceCandidates().map(c => c.objectKey)).toEqual(['lower']);
  filter.apply('BOTH'); expect(filter.referenceCandidates()).toEqual([]);
  filter.restore(); expect(filter.referenceCandidates()).toEqual([]);
});

test('reference outlines keep source geometry, metadata and materials untouched and cannot be picked', () => {
  const scene = new THREE.Scene(), root = new THREE.Group(); scene.add(root);
  root.position.set(4, 0, -2); root.rotation.y = .3;
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({ color: 0x507080, transparent: true, opacity: .72 });
  const source = new THREE.Mesh(geometry, material); source.position.y = 3;
  source.userData = { ylisViewScope: scope('upper'), phase: 'WORK_TEST', sourceDocIds: ['fixture-source'] };
  root.add(source); source.visible = false; root.updateMatrixWorld(true);
  const original = JSON.stringify(source.toJSON());
  const controller = createOtherFloorReference(scene);
  expect(controller.update(true, [{ object: source, objectKey: 'upper' }])).toEqual({ count: 1, unsupported: 0 });
  const line = controller.group.children[0] as THREE.LineSegments;
  expect(line.parent).not.toBe(root);
  expect(line.matrix.elements).toEqual(source.matrixWorld.elements);
  expect(line.geometry).not.toBe(source.geometry);
  expect(line.material).not.toBe(source.material);
  expect((line.material as THREE.LineBasicMaterial).opacity).toBe(.18);
  expect((line.material as THREE.LineBasicMaterial).depthWrite).toBe(false);
  const raycaster = new THREE.Raycaster(new THREE.Vector3(4, 3, 8), new THREE.Vector3(0, 0, -1));
  expect(raycaster.intersectObjects(controller.group.children, true)).toEqual([]);
  expect(JSON.stringify(source.toJSON())).toBe(original);
  expect(source.geometry).toBe(geometry); expect(source.material).toBe(material);
  controller.dispose();
});

test('reference cache reuses unchanged edges and disposes only derived resources on reset', () => {
  const scene = new THREE.Scene(), source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  scene.add(source);
  const controller = createOtherFloorReference(scene), candidates = [{ object: source, objectKey: 'upper' }];
  let sourceDisposals = 0, derivedDisposals = 0;
  source.geometry.addEventListener('dispose', () => sourceDisposals++);
  controller.update(true, candidates);
  const first = controller.group.children[0] as THREE.LineSegments;
  first.geometry.addEventListener('dispose', () => derivedDisposals++);
  controller.update(true, candidates); expect(controller.group.children[0]).toBe(first);
  source.position.x = 2;
  controller.update(true, candidates);
  expect(controller.group.children[0]).not.toBe(first); expect(derivedDisposals).toBe(1);
  controller.update(false, candidates);
  expect(controller.group.children).toHaveLength(0); expect(sourceDisposals).toBe(0);
  for (let i = 0; i < 5; i++) { controller.update(true, candidates); controller.clear(); }
  expect(sourceDisposals).toBe(0); expect(controller.group.children).toHaveLength(0);
  controller.dispose(); expect(scene.children).not.toContain(controller.group);
});

test('unsupported instances and non-mesh sources are reported instead of inventing outlines', () => {
  const controller = createOtherFloorReference(new THREE.Scene());
  const instance = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 2);
  const points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
  expect(controller.update(true, [{ object: instance, objectKey: 'instance' }, { object: points, objectKey: 'points' }]))
    .toEqual({ count: 0, unsupported: 2 });
  expect(controller.group.children).toHaveLength(0); controller.dispose();
});

const model = (classified = true) => {
  const box = new THREE.BoxGeometry(2, 2, 2), positions = box.getAttribute('position');
  const data = Buffer.alloc(positions.array.byteLength + box.index!.array.byteLength);
  Buffer.from(positions.array.buffer, positions.array.byteOffset, positions.array.byteLength).copy(data);
  Buffer.from(box.index!.array.buffer, box.index!.array.byteOffset, box.index!.array.byteLength).copy(data, positions.array.byteLength);
  const json = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'main', nodes: [0, 1, 2] }],
    nodes: ['lower', 'upper', 'other'].map((name, i) => ({ name, mesh: 0,
      translation: i === 1 ? [.25, 3, .25] : i === 2 ? [7, 0, 0] : [0, 0, 0],
      extras: classified ? { ylisViewScope: scope(name, i === 2 ? 'C' : 'D', i === 1 ? '2F' : '1F') } : {},
    })),
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [.25, .55, .7, 1], metallicFactor: 0, roughnessFactor: 1 } }],
    buffers: [{ byteLength: data.length }],
    bufferViews: [{ buffer: 0, byteLength: positions.array.byteLength },
      { buffer: 0, byteOffset: positions.array.byteLength, byteLength: box.index!.array.byteLength }],
    accessors: [{ bufferView: 0, componentType: 5126, count: positions.count, type: 'VEC3', min: [-1, -1, -1], max: [1, 1, 1] },
      { bufferView: 1, componentType: 5123, count: box.index!.count, type: 'SCALAR' }],
  };
  const bytes = Buffer.from(JSON.stringify(json));
  const chunk = Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + chunk.length + data.length, 8); header.writeUInt32LE(chunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(data.length); binHeader.writeUInt32LE(0x004e4942, 4);
  box.dispose(); return Buffer.concat([header, chunk, binHeader, data]);
};
const frames = (page: Page, n = 4) => page.evaluate((count) => new Promise<void>((resolve) => {
  const step = () => { if (--count <= 0) resolve(); else requestAnimationFrame(step); }; requestAnimationFrame(step);
}), n);

const screenshotsVisuallyEqual = async (page: Page, baseline: Buffer, observed: Buffer) =>
  page.evaluate(async ({ baseline64, observed64 }) => {
    const decode = async (encoded: string) => {
      const raw = atob(encoded);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const surface = document.createElement('canvas');
      surface.width = bitmap.width; surface.height = bitmap.height;
      const context = surface.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Unable to decode screenshot pixels');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return { width: surface.width, height: surface.height, rgba: context.getImageData(0, 0, surface.width, surface.height).data };
    };
    const a = await decode(baseline64), b = await decode(observed64);
    if (a.width !== b.width || a.height !== b.height) return false;
    // Compare rendered pixels, not compressed PNG bytes. A ghost outline
    // changes channels far more than the <=2/255 GPU quantization tolerance.
    for (let p = 0; p < a.rgba.length; p += 4) {
      for (let channel = 0; channel < 4; channel++) {
        if (Math.abs(a.rgba[p + channel] - b.rgba[p + channel]) > 2) return false;
      }
    }
    return true;
  }, { baseline64: baseline.toString('base64'), observed64: observed.toString('base64') });

const menu = async (page: Page, id = '#preset-menu') => {
  await page.keyboard.press('Escape'); await page.locator(`${id} > summary`).click();
};
const select = async (page: Page, name: string, value: string) => {
  await menu(page); await page.getByLabel(name, { exact: true }).selectOption(value); await frames(page);
};
const open = async (page: Page, classified = true) => {
  await page.route('**/private-model/model.glb', route => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: model(classified) }));
  await page.goto('/private-model/'); await expect(page.getByRole('status')).toContainText('Malli ladattu');
  if (classified) {
    await select(page, 'Alue päämallissa', 'D'); await select(page, 'Kerros päämallissa', '1F');
  }
};

test('other-floor UI preserves the reference preference across floors and clears it on whole/reset', async ({ page }) => {
  await open(page);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-other-floor-mode', 'HIDDEN');
  await select(page, 'Muu kerros', 'REFERENCE');
  await expect(canvas).toHaveAttribute('data-other-floor-reference-keys', 'upper');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '1');
  await select(page, 'Kerros päämallissa', '2F');
  await expect(canvas).toHaveAttribute('data-other-floor-mode', 'REFERENCE');
  await expect(canvas).toHaveAttribute('data-other-floor-reference-keys', 'lower');
  await select(page, 'Kerros päämallissa', 'BOTH');
  await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
  await expect(page.getByLabel('Muu kerros', { exact: true })).toBeDisabled();
  await select(page, 'Kerros päämallissa', '1F'); await select(page, 'Muu kerros', 'REFERENCE');
  await select(page, 'Alue päämallissa', 'WHOLE');
  await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
  await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '3');
  await select(page, 'Alue päämallissa', 'D'); await select(page, 'Kerros päämallissa', '1F');
  await select(page, 'Muu kerros', 'REFERENCE');
  await menu(page, '#more-menu'); await page.getByRole('button', { name: 'Palauta näkymän oletukset', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
});

test('reference pixels appear in two 3D directions and plan, then return exactly to the hidden view', async ({ page }) => {
  await open(page);
  const canvas = page.locator('#private-model-canvas');
  for (const view of ['free', 'rotated', 'plan']) {
    if (view === 'rotated') {
      const rect = (await canvas.boundingBox())!;
      const beforeLook = JSON.parse((await page.locator('#ai-navigator-readout').getAttribute('data-world-pose'))!).direction as number[];
      await page.mouse.move(rect.x + rect.width * .4, rect.y + rect.height * .45);
      // Fixed-position look produces a distinct view without a residual orbit
      // damping impulse changing the baseline during the pixel comparison.
      await page.mouse.down({ button: 'middle' });
      await page.mouse.move(rect.x + rect.width * .4 + 60, rect.y + rect.height * .45 - 20, { steps: 8 });
      await page.mouse.up({ button: 'middle' }); await frames(page);
      const afterLook = JSON.parse((await page.locator('#ai-navigator-readout').getAttribute('data-world-pose'))!).direction as number[];
      expect(Math.hypot(...beforeLook.map((n, i) => n - afterLook[i]))).toBeGreaterThan(.1);
    } else if (view === 'plan') {
      await menu(page, '#view-menu'); await page.getByRole('button', { name: 'Ylhäältä', exact: true }).click();
    }
    await frames(page);
    const before = await canvas.screenshot();
    const poseBefore = await page.locator('#ai-navigator-readout').getAttribute('data-world-pose');
    await select(page, 'Muu kerros', 'REFERENCE');
    await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '1');
    const withReference = await canvas.screenshot();
    expect(withReference.equals(before), view).toBe(false);
    await expect(canvas).toHaveAttribute('data-edge-source-mesh-count', '1');
    const beforePosition = JSON.parse(poseBefore!).position as number[];
    const afterPosition = JSON.parse((await page.locator('#ai-navigator-readout').getAttribute('data-world-pose'))!).position as number[];
    expect(Math.hypot(...beforePosition.map((n, i) => n - afterPosition[i])), view).toBeLessThan(1e-7);
    await select(page, 'Muu kerros', 'HIDDEN');
    await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
    await expect(canvas).toHaveAttribute('data-other-floor-mode', 'HIDDEN');
    expect(await screenshotsVisuallyEqual(page, before, await canvas.screenshot()), view).toBe(true);
  }
});

test('reference is non-selectable in the real page and works with the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page);
  await select(page, 'Muu kerros', 'REFERENCE');
  await page.locator('#selection-tool-button').click();
  const canvas = page.locator('#private-model-canvas'), rect = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: rect.width / 2, y: rect.height / 2 } });
  await expect(page.locator('#selection-panel')).toBeVisible();
  const sourceIdentity = page.locator('#selection-metadata-list dt').filter({ hasText: /^Tekninen kohde$/ })
    .locator('xpath=following-sibling::dd[1]');
  await expect(sourceIdentity).toHaveText('lower');
  await expect(canvas).toHaveAttribute('data-other-floor-reference-keys', 'upper');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('unclassified models cannot enable other-floor references', async ({ page }) => {
  await open(page, false);
  await expect(page.getByLabel('Muu kerros', { exact: true })).toBeDisabled();
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-other-floor-reference-count', '0');
});
