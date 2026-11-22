import { expect, test } from '@playwright/test';

/**
 * H-B / #2177: browser regression for D focus with scope-less D structure.
 * This deliberately synthetic GLB is not Ylisrinne geometry or an as-built QA.
 */
function syntheticBuildingGlb() {
  const vertices = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
  ];
  const triangles = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7,
    1, 5, 6, 1, 6, 2, 0, 3, 7, 0, 7, 4,
  ];
  const bin = Buffer.alloc(168);
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  vertices.flat().forEach((value, index) => data.setFloat32(index * 4, value, true));
  triangles.forEach((index, i) => data.setUint16(96 + i * 2, index, true));
  const node = (name: string, translation: number[], scale: number[], extras?: object) =>
    ({ name, mesh: 0, translation, scale, ...(extras ? { extras } : {}) });
  const json = {
    asset: { version: '2.0', generator: 'H-B synthetic D focus fixture' },
    scene: 0,
    scenes: [{ name: 'Synthetic viewer D/WHOLE focus', nodes: [0, 1, 2, 3, 4, 5] }],
    nodes: [
      node('D_MARKED_FOOTPRINT', [2, 0, -2], [6, 0.15, 12], {
        ylisViewScope: { apartmentScope: 'D', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' },
      }),
      node('D_WALL_WITHOUT_SCOPE', [1, 1, -2], [0.2, 2, 4]),
      node('D_WINDOW_WITHOUT_SCOPE', [2, 1.7, -2], [1, 1, 0.2]),
      node('ROOF_CROSSING_D_BOUNDARY', [5, 3, -2], [12, 0.25, 8]),
      node('GROUND_CROSSING_D_BOUNDARY', [5, -0.3, -2], [14, 0.1, 18]),
      node('OUTSIDE_D_FOOTPRINT', [12, 1, -2], [1, 2, 2]),
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ name: 'WORK_TEST_NEUTRAL', pbrMetallicRoughness: { baseColorFactor: [0.65, 0.72, 0.78, 1], metallicFactor: 0, roughnessFactor: 1 } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 96 }, { buffer: 0, byteOffset: 96, byteLength: 72 }],
    buffers: [{ byteLength: bin.byteLength }],
  };
  const rawJson = Buffer.from(JSON.stringify(json));
  const jsonPad = (4 - rawJson.length % 4) % 4;
  const paddedJson = Buffer.concat([rawJson, Buffer.alloc(jsonPad, 0x20)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(bin.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, bin]);
}

test('D roof and roof-hidden presets retain unscoped D walls, split shared meshes and restore whole building', async ({ page }) => {
  test.setTimeout(90_000);
  const glb = syntheticBuildingGlb();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route =>
    route.fulfill({ json: { modules: {} } }));
  await page.goto('/private-model/');
  await expect(page.locator('#viewer-status')).toContainText('Malli ladattu', { timeout: 60_000 });
  const canvas = page.locator('#private-model-canvas');
  const toolbar = page.getByRole('toolbar', { name: 'Näkymät ja kuvakulmat' });
  const preset = (id: string) => toolbar.locator(`[data-desk-kind="preset"][data-desk-id="${id}"]`);
  await expect(preset('d-roof')).toBeVisible();

  await preset('d-roof').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', /^d-roof\|in:\d+\|out:\d+\|split:\d+$/);
  const roof = await canvas.getAttribute('data-d-focus-ghost');
  const [, inside, outside, split] = roof!.match(/in:(\d+)\|out:(\d+)\|split:(\d+)/)!.map(Number);
  expect(inside).toBeGreaterThanOrEqual(3);
  expect(outside).toBeGreaterThanOrEqual(1);
  expect(split).toBeGreaterThanOrEqual(2);
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'true');
  await expect(canvas).toHaveAttribute('data-d-focus-footprint', /-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+/);

  await preset('d-apartment').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', `d-apartment|in:${inside}|out:${outside}|split:${split}`);
  await expect(canvas).toHaveAttribute('data-layer-roof-visible', 'false');

  await preset('whole-building').click();
  await expect(canvas).not.toHaveAttribute('data-d-focus-ghost', /.+/);
  await expect(canvas).not.toHaveAttribute('data-d-focus-footprint', /.+/);

  await preset('d-roof').click();
  await expect(canvas).toHaveAttribute('data-d-focus-ghost', roof!);
  await expect(preset('d-roof')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});


test('Chromium material, clipping and hit-testing restore exactly through D focus cycles and model swap', async ({ page }) => {
  const { build } = await import('esbuild');
  const browserSource = `
    import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Plane, Vector3 } from 'three';
    import { createDFocusGhost } from './src/scripts/privateModelDFocusGhost.ts';

    const box = (name, x, z, sx = 1, sz = 1, material = new MeshBasicMaterial()) => {
      const mesh = new Mesh(new BoxGeometry(sx, 1, sz), material);
      mesh.position.set(x, 0, z);
      mesh.name = name;
      return mesh;
    };
    const check = (ok, label, passed) => {
      if (!ok) throw new Error('D-focus restore regression: ' + label);
      passed.push(label);
    };

    window.__runDFocusGhostCycleQA = () => {
      const passed = [];
      const footprint = { x0: 0, x1: 6, z0: -10, z1: 5 };
      const first = new Group();
      const insideWall = box('D_WALL_NO_SCOPE', 2, 0);
      const insideWindow = box('D_WINDOW_NO_SCOPE', 3, 0, 1.5, 0.1);
      const outside = box('OUTSIDE_D', 12, 0);
      const sourceClip = new Plane(new Vector3(0, 1, 0), -0.75);
      const roofMaterial = new MeshBasicMaterial();
      roofMaterial.clippingPlanes = [sourceClip];
      const roof = box('CROSSING_ROOF', 5, -2, 12, 8, roofMaterial);
      const ground = box('CROSSING_TERRAIN', 5, -2, 14, 18);
      first.add(insideWall, insideWindow, outside, roof, ground);
      const originals = [insideWall, insideWindow, outside, roof, ground].map(mesh => mesh.material);
      const oldRaycast = outside.raycast;
      const roofRaycast = roof.raycast;
      const oldChildren = roof.children.length;
      const ghost = createDFocusGhost(0.1);

      const counts = ghost.apply(first, footprint);
      check(counts.inside >= 2, 'scope-less D wall and window stay full-strength', passed);
      check(counts.outside >= 1, 'outside building is ghosted', passed);
      check(counts.split >= 2, 'crossing roof and ground split', passed);
      check(insideWall.material === originals[0] && insideWindow.material === originals[1],
        'scope-less wall/window keep their exact original material', passed);
      check(outside.material !== originals[2] && outside.material.transparent &&
        Math.abs(outside.material.opacity - 0.1) < 1e-6 && !outside.material.depthWrite,
        'outside clone has 0.1 opacity and no depth write', passed);
      check(outside.userData.viewerSuppressEdgeOverlay === true,
        'outside ghost suppresses edges', passed);
      const outsideHits = []; outside.raycast({}, outsideHits);
      check(outsideHits.length === 0, 'outside ghost cannot be selected', passed);
      check(roof.material !== roofMaterial && roof.material.clippingPlanes.length === 5 &&
        roof.material.clippingPlanes.includes(sourceClip) && roof.material.clipIntersection === false,
        'roof D half keeps original clipping plus four local planes', passed);
      check(roof.children.length === oldChildren + 1 &&
        roof.children[0].userData.dFocusGhost === true &&
        roof.children[0].material.clippingPlanes.length === 5 &&
        roof.children[0].material.clipIntersection === true,
        'roof outside half exists as local clipped ghost', passed);
      const childHits = []; roof.children[0].raycast({}, childHits);
      check(childHits.length === 0, 'crossing ghost child is not selectable', passed);
      check(roofMaterial.clippingPlanes.length === 1 && roofMaterial.clippingPlanes[0] === sourceClip,
        'original roof clipping array was not mutated', passed);

      ghost.restore();
      check([insideWall, insideWindow, outside, roof, ground].every((mesh, i) => mesh.material === originals[i]),
        'whole-building preset restores exact source material references', passed);
      check(roof.children.length === oldChildren && ground.children.length === 0,
        'all temporary ghost children removed', passed);
      check(outside.raycast === oldRaycast && roof.raycast === roofRaycast &&
        !Object.prototype.hasOwnProperty.call(outside, 'raycast'),
        'selection and raycast behavior restored, no own override', passed);
      check(!Object.prototype.hasOwnProperty.call(outside.userData, 'viewerSuppressEdgeOverlay'),
        'temporary edge suppression removed', passed);
      check(roofMaterial.clippingPlanes[0] === sourceClip && !ghost.active,
        'original clipping and inactive state restored', passed);

      ghost.apply(first, footprint);
      check(roof.children.length === oldChildren + 1, 'repeat D-roof adds one child only', passed);
      ghost.apply(first, footprint);
      check(roof.children.length === oldChildren + 1,
        'same preset twice does not accumulate clipping children', passed);

      const second = new Group();
      const secondOutside = box('OTHER_MODEL_OUTSIDE_D', 11, 0, 1, 1, roofMaterial);
      second.add(secondOutside);
      ghost.apply(second, footprint);
      check([insideWall, insideWindow, outside, roof, ground].every((mesh, i) => mesh.material === originals[i]) &&
        roof.children.length === oldChildren,
        'scene/model switch restores first model before mutating second', passed);
      check(secondOutside.material !== roofMaterial && secondOutside.material.transparent,
        'new model receives its own faint cloned presentation', passed);
      ghost.restore();
      check(secondOutside.material === roofMaterial &&
        roofMaterial.clippingPlanes.length === 1 &&
        roofMaterial.clippingPlanes[0] === sourceClip && !ghost.active,
        'new model restored without mutating shared source material', passed);
      return { checked: passed.length, firstCounts: counts, noPrivateGLB: true };
    };
  `;
  const bundle = await build({
    stdin: { contents: browserSource, resolveDir: process.cwd(), sourcefile: 'd-focus-ghost-chromium-fixture.ts', loader: 'ts' },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2022',
    logLevel: 'silent', write: false,
  });
  await page.goto('/private-model/');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const report = await page.evaluate(() => (window as any).__runDFocusGhostCycleQA());
  expect(report.checked).toBeGreaterThanOrEqual(20);
  expect(report.firstCounts.inside).toBeGreaterThanOrEqual(2);
  expect(report.firstCounts.outside).toBeGreaterThanOrEqual(1);
  expect(report.firstCounts.split).toBeGreaterThanOrEqual(2);
  expect(report.noPrivateGLB).toBe(true);
});

test('Chromium raster pixels reject source-clipped ghost fragments outside D and all ghost fragments inside D', async ({ page }) => {
  test.setTimeout(90_000);
  const { build } = await import('esbuild');
  const browserSource = `
    import { BoxGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, OrthographicCamera, Plane,
      Scene, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
    import { createDFocusGhost } from './src/scripts/privateModelDFocusGhost.ts';
    window.__runDFocusSourceClipPixelQA = () => {
      const renderer = new WebGLRenderer({ antialias: false });
      renderer.setSize(128, 128, false);
      renderer.setPixelRatio(1);
      renderer.localClippingEnabled = true;
      renderer.setClearColor(0x000000, 1);
      const target = new WebGLRenderTarget(128, 128);
      renderer.setRenderTarget(target);
      const scene = new Scene();
      const root = new Group(); scene.add(root);
      const clip = new Plane(new Vector3(0, 1, 0), -0.75);
      const original = new MeshBasicMaterial({
        color: 0xff0000, side: DoubleSide, clippingPlanes: [clip], clipIntersection: false,
      });
      const roof = new Mesh(new BoxGeometry(12, 0.02, 8), original);
      roof.position.set(5, 1, -2); root.add(roof);
      const camera = new OrthographicCamera(-15, 15, 15, -15, 0.1, 100);
      camera.up.set(0, 0, -1);
      camera.position.set(5, 20, -2); camera.lookAt(5, 0, -2);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      const footprint = { x0: 0, x1: 6, z0: -10, z1: 5 };
      const ghost = createDFocusGhost(0.1);
      const read = (x, y, z) => {
        const n = new Vector3(x, y, z).project(camera);
        const ix = Math.max(0, Math.min(127, Math.round((n.x + 1) * 63.5)));
        const iy = Math.max(0, Math.min(127, Math.round((n.y + 1) * 63.5)));
        const pixel = new Uint8Array(4);
        renderer.readRenderTargetPixels(target, ix, iy, 1, 1, pixel);
        return [...pixel];
      };
      const paint = () => { renderer.render(scene, camera); };
      const assertPixel = (ok, label, pixel) => {
        if (!ok) throw new Error('D-focus clipping raster FAIL: ' + label + ' pixel=' + pixel);
      };
      const counts = ghost.apply(root, footprint);
      if (counts.split !== 1 || roof.children.length !== 1) throw new Error('Missing clipped ghost roof');
      paint();
      const inD = read(2, 1, -2);
      const outside = read(8, 1, -2);
      assertPixel(inD[0] > 150 && inD[1] < 75 && inD[2] < 75,
        'source-visible inside D must be pure red, not ghost-tinted', inD);
      assertPixel(outside[0] > 5 && outside[0] < 145 && outside[1] > 5 && outside[2] > 5,
        'source-visible outside D must be faint, not hidden', outside);
      // Move the identical roof into the original source clip rejection zone.
      // The outside ghost must now be completely absent rather than leaked.
      ghost.restore(); roof.position.y = 0;
      ghost.apply(root, footprint); paint();
      const rejectedInside = read(2, 0, -2);
      const rejectedOutside = read(8, 0, -2);
      assertPixel(rejectedInside.slice(0, 3).every(v => v <= 3),
        'source-rejected inside D is transparent', rejectedInside);
      assertPixel(rejectedOutside.slice(0, 3).every(v => v <= 3),
        'source-rejected outside D must not leak as ghost', rejectedOutside);
      ghost.restore();
      if (roof.material !== original || roof.children.length !== 0 || ghost.active)
        throw new Error('Pixel fixture must restore exact source material and mesh graph');
      target.dispose(); renderer.dispose();
      return { inD, outside, rejectedInside, rejectedOutside, checked: 4 };
    };
  `;
  const bundle = await build({
    stdin: { contents: browserSource, resolveDir: process.cwd(),
      sourcefile: 'd-focus-source-clipping-pixels.ts', loader: 'ts' },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2022',
    logLevel: 'silent', write: false,
  });
  await page.goto('/private-model/');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const report = await page.evaluate(() => (window as any).__runDFocusSourceClipPixelQA());
  expect(report.checked).toBe(4);
});
