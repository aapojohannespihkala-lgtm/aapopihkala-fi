import { test, expect } from '@playwright/test';

// #1527: unlike the MMB-only reproduction in PR #1758, this harness installs
// BOTH modules currently wired in private-model/index.astro.
// It is source-only Three/Chromium evidence, not authenticated production WebGL.
async function mountCurrentOrbitChain(page: import('@playwright/test').Page) {
  const { build } = await import('esbuild');
  const bundled = await build({
    stdin: {
      contents: `import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { installMiddleMouseLookAround } from './src/scripts/privateModelMiddleMouseLookAround.ts';
import { installOrbitRecenterOnDrag, visibleOrbitFocus } from './src/scripts/privateModelOrbitRecenter.ts';

const canvas = document.querySelector('canvas');
const camera = new THREE.PerspectiveCamera(55, 1.6, 0.01, 100);
camera.position.set(0, 2, 10);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 2, 0);
controls.zoomToCursor = true;
controls.enableDamping = false;
controls.update();

const scene = new THREE.Group();
// After an MMB turn of +120 px, this source mesh lies on the NEW centre ray.
// Its near surface is closer than the stale OrbitControls target.
const surface = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0x678cab }),
);
surface.position.set(2.4, 2, 3.5);
scene.add(surface);
canvas.dataset.interactionMode = 'navigate';

installMiddleMouseLookAround({ camera, controls, canvas });
installOrbitRecenterOnDrag({
  canvas, camera, controls,
  getScene: () => scene,
  isActive: () => controls.enabled && controls.enableRotate &&
    canvas.dataset.interactionMode === 'navigate',
});
window.setSurfaceVisible = (visible) => { surface.visible = visible; };
window.snapshot = () => ({
  position: camera.position.toArray(),
  target: controls.target.toArray(),
  forward: camera.getWorldDirection(new THREE.Vector3()).toArray(),
  focus: visibleOrbitFocus(scene, camera)?.point.toArray() ?? null,
  focusStatus: canvas.dataset.orbitFocusStatus ?? null,
});
`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'iife', write: false,
  });
  await page.setContent('<canvas width="800" height="500" style="width:800px;height:500px;touch-action:none"></canvas>');
  await page.addScriptTag({ content: bundled.outputFiles[0].text });
}

type Snapshot = {
  position: number[];
  target: number[];
  forward: number[];
  focus: number[] | null;
  focusStatus: string | null;
};
const snap = (page: import('@playwright/test').Page): Promise<Snapshot> =>
  page.evaluate(() => (window as any).snapshot());
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((value, i) => value - b[i]));

async function middleLook(page: import('@playwright/test').Page) {
  await page.mouse.move(260, 240);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(380, 240, { steps: 6 });
  await page.mouse.up({ button: 'middle' });
}

test('MMB fixed eye then click does not recenter; genuine LMB drag recenters to visible surface', async ({ page }) => {
  await mountCurrentOrbitChain(page);
  const before = await snap(page);
  await middleLook(page);
  const afterLook = await snap(page);
  expect(distance(before.position, afterLook.position)).toBeLessThan(1e-6);
  expect(distance(before.target, afterLook.target)).toBeGreaterThan(1);
  expect(afterLook.focus).not.toBeNull();
  expect(afterLook.focusStatus).toBe('PENDING_LOOK');

  // A click without dragging must not alter the camera, target or view.
  await page.mouse.move(250, 235);
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  const afterClick = await snap(page);
  expect(distance(afterLook.position, afterClick.position)).toBeLessThan(1e-6);
  expect(distance(afterLook.target, afterClick.target)).toBeLessThan(1e-6);
  expect(distance(afterLook.forward, afterClick.forward)).toBeLessThan(1e-6);

  // On the first real LMB movement, the existing recenter adapter should run
  // BEFORE OrbitControls rotates, with the target on the actual centre-ray hit.
  await page.mouse.move(250, 235);
  await page.mouse.down({ button: 'left' });
  const down = await snap(page);
  expect(distance(afterClick.position, down.position)).toBeLessThan(1e-6);
  expect(distance(afterClick.forward, down.forward)).toBeLessThan(1e-6);
  await page.mouse.move(256, 235); // above the adapter's 5 px threshold
  const afterDrag = await snap(page);
  await page.mouse.up({ button: 'left' });
  expect(afterDrag.focusStatus).toBe('RECENTERED');
  expect(distance(afterDrag.target, afterLook.focus!)).toBeLessThan(0.06);
  expect(distance(afterDrag.position, afterLook.position)).toBeGreaterThan(0.001);
});

test('hidden mesh cannot anchor orbit after fixed-eye look', async ({ page }) => {
  await mountCurrentOrbitChain(page);
  await middleLook(page);
  await page.evaluate(() => (window as any).setSurfaceVisible(false));
  const beforeDrag = await snap(page);
  expect(beforeDrag.focus).toBeNull();

  await page.mouse.move(250, 235);
  await page.mouse.down({ button: 'left' });
  await page.mouse.move(256, 235);
  const afterDrag = await snap(page);
  await page.mouse.up({ button: 'left' });
  expect(afterDrag.focusStatus).toBe('NO_VISIBLE_HIT');
  expect(distance(afterDrag.target, beforeDrag.target)).toBeLessThan(1e-6);
});
