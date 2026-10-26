import { expect, test, type Page } from '@playwright/test';

type Pose = { frame: string; projection: string; position: number[]; target: number[]; direction: number[] };
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
const yaw = (p: Pose) => Math.atan2(p.direction[0], -p.direction[2]);
const pitch = (p: Pose) => Math.atan2(p.direction[1], Math.hypot(p.direction[0], p.direction[2]));
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const radius = (p: Pose) => distance(p.position, p.target);

// Synthetic, explicitly classified geometry goes through the normal GLB loader
// and the production page, Three.js runtime, real OrbitControls and render loop.
const model = () => {
  const positions = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((n, i) => positions.writeFloatLE(n, i * 4));
  const json = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ name: 'main', nodes: [0, 1, 2] }],
    nodes: ['lower', 'upper', 'other'].map((name, i) => ({
      name, mesh: 0, translation: [i * 3, i === 1 ? 3 : 0, 0],
      extras: { ylisViewScope: { objectKey: name, apartmentScope: i === 2 ? 'C' : 'D',
        storeyScope: i === 1 ? '2F' : '1F', role: 'CONTENT', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' } },
    })),
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [.6, .7, .8, 1] } }],
    buffers: [{ byteLength: 36 }], bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] }],
  };
  const bytes = Buffer.from(JSON.stringify(json));
  const chunk = Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20);
  header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + chunk.length + 36, 8);
  header.writeUInt32LE(chunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(36); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, chunk, binHeader, positions]);
};

const frames = (page: Page, count = 3) => page.evaluate((n) => new Promise<void>((resolve) => {
  const frame = () => { if (--n <= 0) resolve(); else requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}), count);
const pose = async (page: Page): Promise<Pose> => {
  const raw = await page.locator('#ai-navigator-readout').getAttribute('data-world-pose');
  expect(raw).not.toBeNull();
  const p = JSON.parse(raw!) as Pose;
  expect(p.frame).toBe('THREE_WORLD_Y_UP');
  expect([...p.position, ...p.target, ...p.direction].every(Number.isFinite)).toBe(true);
  return p;
};
const center = async (page: Page) => {
  const box = await page.locator('#private-model-canvas').boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width * .4, y: box!.y + box!.height * .4 };
};
const drag = async (page: Page, button: 'left' | 'middle' | 'right', dx: number, dy: number) => {
  const p = await center(page);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down({ button });
  await page.mouse.move(p.x + dx, p.y + dy, { steps: 8 });
  await frames(page);
  const during = await pose(page);
  await page.mouse.up({ button });
  await frames(page);
  return during;
};
const menu = async (page: Page, id: string) => {
  await page.keyboard.press('Escape');
  await page.locator(`${id} > summary`).click();
};
const camera = async (page: Page, name: 'Vapaa 3D' | 'Ylhäältä') => {
  await menu(page, '#view-menu');
  await page.getByRole('button', { name, exact: true }).click();
  await frames(page);
};
const contentState = (page: Page) => page.locator('#private-model-canvas').evaluate((element) => {
  const d = (element as HTMLElement).dataset;
  return [d.mainViewArea, d.mainViewFloor, d.contentScene, d.edgeSourceMeshCount,
    d.mainViewExceptionCount, d.modelSource, d.interactionMode];
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__middleEvents = [];
    for (const type of ['pointerdown', 'mousedown', 'auxclick']) {
      document.addEventListener(type, (event) => {
        const e = event as PointerEvent;
        // Microtasks can run between listeners during native input dispatch.
        // Observe cancellation after the canvas capture handlers have finished.
        setTimeout(() => (window as any).__middleEvents.push({ type, button: e.button,
          pointerId: e.pointerId, prevented: e.defaultPrevented, target: (e.target as HTMLElement)?.id }), 0);
      }, { capture: true });
    }
  });
  await page.route('**/private-model/model.glb', (route) => route.fulfill({
    status: 200, contentType: 'model/gltf-binary', body: model(),
  }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toContainText('Malli ladattu');
  await expect(page.locator('#ai-navigator-readout')).toHaveAttribute('data-world-pose', /THREE_WORLD_Y_UP/);
  await frames(page);
});

test('MMB-01 horizontal drag changes yaw with a fixed real camera position', async ({ page }) => {
  const before = await pose(page), during = await drag(page, 'middle', 70, 0), after = await pose(page);
  expect(Math.abs(angleDelta(yaw(during), yaw(before)))).toBeGreaterThan(.1);
  expect(Math.abs(pitch(during) - pitch(before))).toBeLessThan(1e-8);
  expect(distance(during.position, before.position)).toBeLessThan(1e-8);
  expect(distance(after.position, before.position)).toBeLessThan(1e-8);
  expect(Math.abs(radius(after) - radius(before))).toBeLessThan(1e-8);
});

test('MMB-02 vertical drag changes pitch without yaw, translation or zoom', async ({ page }) => {
  const before = await pose(page), during = await drag(page, 'middle', 0, -60), after = await pose(page);
  expect(Math.abs(pitch(during) - pitch(before))).toBeGreaterThan(.1);
  expect(Math.abs(angleDelta(yaw(during), yaw(before)))).toBeLessThan(1e-8);
  expect(distance(after.position, before.position)).toBeLessThan(1e-8);
  expect(Math.abs(radius(after) - radius(before))).toBeLessThan(1e-8);
});

test('MMB-03 diagonal drag changes both axes and remains anchored over later render frames', async ({ page }) => {
  const before = await pose(page), during = await drag(page, 'middle', 65, -45);
  expect(Math.abs(angleDelta(yaw(during), yaw(before)))).toBeGreaterThan(.1);
  expect(Math.abs(pitch(during) - pitch(before))).toBeGreaterThan(.08);
  await frames(page, 20);
  const after = await pose(page);
  expect(distance(after.position, before.position)).toBeLessThan(1e-8);
  expect(distance(after.direction, during.direction)).toBeLessThan(1e-8);
  expect(Math.abs(radius(after) - radius(before))).toBeLessThan(1e-8);
});

test('MMB-04 right-button pan still translates camera and target together before and after look', async ({ page }) => {
  for (let i = 0; i < 2; i++) {
    const before = await pose(page);
    await drag(page, 'right', 60, 25);
    const after = await pose(page);
    expect(distance(after.position, before.position)).toBeGreaterThan(.05);
    expect(distance(after.direction, before.direction)).toBeLessThan(1e-8);
    const cameraDelta = after.position.map((v, j) => v - before.position[j]);
    const targetDelta = after.target.map((v, j) => v - before.target[j]);
    expect(distance(cameraDelta, targetDelta)).toBeLessThan(1e-8);
    if (i === 0) await drag(page, 'middle', 55, -25);
  }
});

test('MMB-05 left orbit and wheel zoom remain functional', async ({ page }) => {
  await drag(page, 'middle', 40, -20);
  const beforeOrbit = await pose(page);
  await drag(page, 'left', 65, 20);
  const afterOrbit = await pose(page);
  expect(distance(afterOrbit.position, beforeOrbit.position)).toBeGreaterThan(.05);
  expect(Math.abs(radius(afterOrbit) - radius(beforeOrbit))).toBeLessThan(1e-8);
  const p = await center(page);
  await page.mouse.move(p.x, p.y);
  await page.mouse.wheel(0, -240);
  await frames(page, 10);
  expect(radius(await pose(page))).toBeLessThan(radius(afterOrbit) * .98);
});

test('MMB-06 release, cancel, focus loss, missing button and outside release stop the turn', async ({ page }) => {
  for (const ending of ['up', 'cancel', 'blur', 'buttons', 'outside']) {
    await camera(page, 'Vapaa 3D');
    const p = await center(page);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(p.x + 25, p.y - 15);
    await frames(page);
    const pointerId = await page.evaluate(() => (window as any).__middleEvents.filter((e: any) =>
      e.type === 'pointerdown' && e.button === 1 && e.target === 'private-model-canvas').at(-1).pointerId as number);
    if (ending === 'cancel') await page.dispatchEvent('#private-model-canvas', 'pointercancel', { pointerId, pointerType: 'mouse', buttons: 0 });
    else if (ending === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    else if (ending === 'buttons') await page.dispatchEvent('#private-model-canvas', 'pointermove', { pointerId, pointerType: 'mouse', buttons: 0 });
    else {
      if (ending === 'outside') await page.mouse.move(2, 2);
      await page.mouse.up({ button: 'middle' });
    }
    await frames(page);
    const stopped = await pose(page);
    await page.mouse.move(p.x + 65, p.y + 10);
    await frames(page, 5);
    const after = await pose(page);
    expect(distance(after.position, stopped.position), ending).toBeLessThan(1e-8);
    expect(distance(after.direction, stopped.direction), ending).toBeLessThan(1e-8);
    if (!['up', 'outside'].includes(ending)) await page.mouse.up({ button: 'middle' });
  }
  const before = await pose(page);
  await drag(page, 'middle', 35, -20);
  expect(distance((await pose(page)).direction, before.direction)).toBeGreaterThan(.05);
});

test('MMB-07 WHOLE/D/floors and plan keep their content scope through middle-button input', async ({ page }) => {
  for (const floor of ['WHOLE', 'BOTH', '1F', '2F']) {
    await menu(page, '#preset-menu');
    if (floor === 'WHOLE' || floor === 'BOTH') await page.getByLabel('Alue päämallissa', { exact: true }).selectOption(floor === 'WHOLE' ? 'WHOLE' : 'D');
    else await page.getByLabel('Kerros päämallissa', { exact: true }).selectOption(floor);
    await camera(page, 'Vapaa 3D');
    const perspectiveState = await contentState(page), before = await pose(page);
    await drag(page, 'middle', 40, -25);
    expect(await contentState(page)).toEqual(perspectiveState);
    expect(distance((await pose(page)).position, before.position)).toBeLessThan(1e-8);
    await camera(page, 'Ylhäältä');
    const planState = await contentState(page);
    await drag(page, 'middle', 25, 15);
    expect((await pose(page)).projection).toBe('orthographic');
    expect(await contentState(page)).toEqual(planState);
  }
});

test('MMB-08 canvas middle defaults are prevented while toolbar input is untouched', async ({ page }) => {
  const scroll = await page.evaluate(() => [scrollX, scrollY]);
  await drag(page, 'middle', 35, -15);
  const events = await page.evaluate(() => (window as any).__middleEvents as Array<{ type: string; button: number; prevented: boolean; target: string }>);
  expect(events.some((e) => e.type === 'pointerdown' && e.button === 1 && e.target === 'private-model-canvas' && e.prevented)).toBe(true);
  expect(events.filter((e) => e.button === 1 && e.target === 'private-model-canvas').every((e) => e.prevented)).toBe(true);
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual(scroll);
  const before = await pose(page);
  await page.locator('#layers-button').click({ button: 'middle' });
  await frames(page);
  expect(distance((await pose(page)).position, before.position)).toBeLessThan(1e-8);
  await page.locator('#layers-button').click();
  await expect(page.locator('#layers-panel')).toBeVisible();
});
