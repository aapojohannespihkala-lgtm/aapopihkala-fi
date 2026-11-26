import { expect, test } from '@playwright/test';

// QA3: the owner-approved cube switches the north reference, not the camera.
// Synthetic/asset-free UI check. Authenticated R34 WebGL remains separate.
test('cube face switches local/map north without changing the camera or view scope', async ({ page }) => {
  await page.route('**/private-model/**/*.glb*', route => route.fulfill({ status: 404 }));
  await page.goto('/private-model/?c70=1');

  const cube = page.locator('#orientation-gizmo');
  const frameButton = cube.locator('[data-navigation-north="toggle"]');
  const svg = cube.locator('svg').first();

  await expect(cube).toHaveAttribute('data-nav-cube', 'ready');
  await expect(cube).toHaveAttribute('data-north-frame', 'local');
  await expect(cube).toHaveAttribute('data-north-reference', 'YLIS-G1-LOCAL');
  await expect(cube).toHaveAttribute('data-nav-cube-frame', 'local');
  await expect(frameButton).toHaveAttribute('aria-pressed', 'false');
  await expect(cube.locator('.nav-cube-face').first()).toBeVisible();

  const readView = () => page.evaluate(() => {
    const cubeElement = document.querySelector<HTMLElement>('#orientation-gizmo')!;
    const canvasElement = document.querySelector<HTMLCanvasElement>('#private-model-canvas')!;
    const navigator = document.querySelector<HTMLElement>('#ai-navigator-readout');
    return {
      quaternion: cubeElement.dataset.cameraQuaternion,
      cameraPose: navigator?.dataset.worldPose ?? null,
      viewPreset: canvasElement.dataset.viewPreset ?? null,
      mainArea: canvasElement.dataset.mainViewArea ?? null,
      mainFloor: canvasElement.dataset.mainViewFloor ?? null,
    };
  });

  const initial = await readView();
  expect(initial.quaternion).toBeTruthy();

  // The SVG owns the click. Legacy axis lines overlay the face polygon,
  // so click the cube surface rather than an intercepted polygon target.
  await svg.click();
  await expect(cube).toHaveAttribute('data-north-frame', 'map');
  await expect(cube).toHaveAttribute('data-north-reference', 'EPSG:3879');
  await expect(cube).toHaveAttribute('data-nav-cube-frame', 'map');
  await expect(cube).toHaveAttribute('data-nav-cube-axis-frame', 'map');
  await expect(frameButton).toHaveAttribute('data-frame-label', 'ETRS-GK25');
  await expect(frameButton).toHaveAttribute('aria-pressed', 'true');
  expect(await readView()).toEqual(initial);

  // The same SVG must restore the original north reference and exactly the pose.
  await svg.click();
  await expect(cube).toHaveAttribute('data-north-frame', 'local');
  await expect(cube).toHaveAttribute('data-north-reference', 'YLIS-G1-LOCAL');
  await expect(cube).toHaveAttribute('data-nav-cube-frame', 'local');
  await expect(frameButton).toHaveAttribute('data-frame-label', 'YLIS-G1-LOCAL');
  await expect(frameButton).toHaveAttribute('aria-pressed', 'false');
  expect(await readView()).toEqual(initial);
});
