import { expect, test, type Page } from '@playwright/test';

/**
 * Chromium guard for the owner's A-style navigation cube edge arrows.
 * The test supplies a synthetic empty glTF only. No private GLB or Access
 * credentials are needed, and no production-WebGL claim is implied.
 */
const makeMinimalGlb = () => {
  const json = Buffer.from(JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'P133D REVIEW ROOT - BABYLON Y-UP', nodes: [] },
      { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [] },
    ],
    nodes: [],
  }), 'utf8');
  const padding = Buffer.alloc((4 - json.length % 4) % 4, 0x20);
  const data = Buffer.concat([json, padding]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + data.length, 8);
  const chunk = Buffer.alloc(8);
  chunk.writeUInt32LE(data.length, 0);
  chunk.writeUInt32LE(0x4e4f534a, 4);
  return Buffer.concat([header, chunk, data]);
};

const loadViewer = async (page: Page) => {
  const glb = makeMinimalGlb();
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toHaveText('Malli ladattu - D-pohjat käytettävissä');
  await expect(page.locator('#orientation-gizmo')).toHaveAttribute('data-nav-cube', 'ready');
};

const readCube = (page: Page) => page.evaluate(() => {
  const gizmo = document.querySelector<HTMLElement>('#orientation-gizmo')!;
  const svg = gizmo.querySelector('svg')!;
  const readout = document.querySelector<HTMLElement>('#ai-navigator-readout')!;
  const toggle = gizmo.querySelector<HTMLButtonElement>('[data-navigation-north="toggle"]')!;
  const corners = Array.from(svg.querySelectorAll<SVGPolygonElement>('.nav-cube-face'))
    .flatMap(face => (face.getAttribute('points') || '').split(' ').filter(Boolean)
      .map(pair => pair.split(',').map(Number)));
  const arrows = Array.from(svg.querySelectorAll<SVGLineElement>(
    '.nav-cube-edge-axes line[data-cube-edge-axis]')).map(line => {
      const key = line.dataset.cubeEdgeAxis!;
      const head = svg.querySelector<SVGPolygonElement>(
        '.nav-cube-edge-axes polygon[data-cube-edge-head="' + key + '"]')!;
      const label = svg.querySelector<SVGTextElement>(
        '.nav-cube-edge-axes text[data-cube-edge-label="' + key + '"]')!;
      return {
        key,
        start: [Number(line.getAttribute('x1')), Number(line.getAttribute('y1'))],
        tip: (head.getAttribute('points') || '').split(' ')[0].split(',').map(Number),
        head: head.getAttribute('points') || '',
        label: label.textContent,
      };
    });
  const oldAxesHidden = Array.from(svg.querySelectorAll<SVGElement>(
    '.orientation-axis, .orientation-axis-tip, .orientation-axis-label, .orientation-origin'))
    .every(node => node.style.opacity === '0');
  return {
    frame: gizmo.dataset.navCubeAxisFrame,
    cubeFrame: gizmo.dataset.navCubeFrame,
    cubeReady: gizmo.dataset.navCube,
    pose: readout.dataset.worldPose,
    quaternion: gizmo.dataset.cameraQuaternion,
    corners, arrows, oldAxesHidden,
    caption: toggle.dataset.frameLabel,
    visibleCaption: getComputedStyle(toggle, '::after').content,
    legacyCaptions: gizmo.querySelectorAll('.orientation-gizmo-title, .orientation-gizmo-note').length,
    error: gizmo.dataset.navCubeError ?? null,
  };
});

const verifyProjectedEdges = (state: Awaited<ReturnType<typeof readCube>>) => {
  expect(state.cubeReady).toBe('ready');
  expect(state.error).toBeNull();
  expect(state.oldAxesHidden).toBe(true);
  expect(state.arrows.length).toBeGreaterThanOrEqual(2);
  expect(state.arrows.length).toBeLessThanOrEqual(3);
  for (const arrow of state.arrows) {
    expect(['x', 'y', 'z']).toContain(arrow.key);
    expect(arrow.label).toBe(arrow.key.toUpperCase());
    expect(arrow.head.split(' ').length).toBe(3);
    for (const endpoint of [arrow.start, arrow.tip]) {
      expect(endpoint.every(Number.isFinite)).toBe(true);
      expect(state.corners.some(([x, y]) =>
        Math.hypot(x - endpoint[0], y - endpoint[1]) < 0.025)).toBe(true);
    }
    expect(Math.hypot(
      arrow.tip[0] - arrow.start[0],
      arrow.tip[1] - arrow.start[1],
    )).toBeGreaterThan(2.5);
  }
};

test('desktop: actual cube edges carry positive X/Y/Z arrows and north switch preserves camera', async ({ page }) => {
  await loadViewer(page);
  const gizmo = page.locator('#orientation-gizmo');
  const toggle = gizmo.getByRole('button', {
    name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen',
  });
  await expect(gizmo).toHaveAttribute('data-nav-cube-axis-frame', 'local');
  const local = await readCube(page);
  verifyProjectedEdges(local);
  expect(local.caption).toBe('YLIS-G1-LOCAL');
  expect(local.visibleCaption).toContain('YLIS-G1-LOCAL');
  expect(local.legacyCaptions).toBe(0);
  expect(local.pose).toBeTruthy();

  await toggle.click();
  await expect(gizmo).toHaveAttribute('data-nav-cube-axis-frame', 'map');
  const map = await readCube(page);
  verifyProjectedEdges(map);
  expect(map.caption).toBe('ETRS-GK25');
  expect(map.visibleCaption).toContain('ETRS-GK25');
  expect(map.legacyCaptions).toBe(0);
  expect(map.cubeFrame).toBe('map');
  expect(map.pose).toBe(local.pose);
  expect(map.quaternion).toBe(local.quaternion);
  expect(map.arrows.map(a => a.tip.join(','))).not.toEqual(
    local.arrows.map(a => a.tip.join(',')));

  await toggle.click();
  await expect(gizmo).toHaveAttribute('data-nav-cube-axis-frame', 'local');
  const back = await readCube(page);
  verifyProjectedEdges(back);
  expect(back.caption).toBe('YLIS-G1-LOCAL');
  expect(back.pose).toBe(local.pose);
  expect(back.arrows).toEqual(local.arrows);
});

test('390px: edge arrows remain mounted and local/map toggle keeps camera and model', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await loadViewer(page);
  const gizmo = page.locator('#orientation-gizmo');
  const toggle = gizmo.getByRole('button', {
    name: 'Vaihda paikallinen pohjoinen tai karttapohjoinen',
  });
  await expect(toggle).toBeVisible();
  const local = await readCube(page);
  verifyProjectedEdges(local);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(gizmo).toHaveAttribute('data-nav-cube-axis-frame', 'map');
  const map = await readCube(page);
  verifyProjectedEdges(map);
  expect(map.pose).toBe(local.pose);
  await page.keyboard.press('Space');
  await expect(gizmo).toHaveAttribute('data-nav-cube-axis-frame', 'local');
  expect((await readCube(page)).pose).toBe(local.pose);
});
