import { expect, test, type Page } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { visibleOrbitFocus } from '../../src/scripts/privateModelOrbitRecenter';

const length = (a: number[], b: number[]) => Math.hypot(...a.map((x, i) => x - b[i]));
const frames = (page: Page, n = 6) => page.evaluate((steps) => new Promise<void>((resolve) => {
  const f = () => { if (--steps <= 0) resolve(); else requestAnimationFrame(f); };
  requestAnimationFrame(f);
}), n);
type Pose = { frame: string; projection: string; position: number[]; target: number[]; direction: number[] };
const pose = async (page: Page): Promise<Pose> => {
  const raw = await page.locator('#ai-navigator-readout').getAttribute('data-world-pose');
  expect(raw).toBeTruthy();
  return JSON.parse(raw!) as Pose;
};

function broadCubeGlb() {
  const pos = [
    -8,-8,-8, 8,-8,-8, 8,8,-8, -8,8,-8,
    -8,-8, 8, 8,-8, 8, 8,8,8, -8,8,8,
  ];
  const indices = [
    0,2,1,0,3,2, 4,5,6,4,6,7,
    0,1,5,0,5,4, 3,7,6,3,6,2,
    0,4,7,0,7,3, 1,2,6,1,6,5,
  ];
  const bin = Buffer.alloc(pos.length * 4 + indices.length * 2);
  pos.forEach((v, i) => bin.writeFloatLE(v, i * 4));
  indices.forEach((v, i) => bin.writeUInt16LE(v, pos.length * 4 + i * 2));
  const json = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'visible-source-cube' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [.65, .75, .84, 1] } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.length * 4 },
                  { buffer: 0, byteOffset: pos.length * 4, byteLength: indices.length * 2 }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-8,-8,-8], max: [8,8,8] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR', min: [0], max: [7] },
    ],
  };
  const bytes = Buffer.from(JSON.stringify(json));
  const chunk = Buffer.concat([bytes, Buffer.alloc((4 - bytes.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20);
  header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + chunk.length + bin.length, 8);
  header.writeUInt32LE(chunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(bin.length); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, chunk, binaryHeader, bin]);
}

test('source-ray focus chooses a real visible mesh and ignores hidden / translucent model elements', () => {
  const camera = new PerspectiveCamera(38, 1, 0.01, 1000);
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const root = new Group();
  const material = new MeshBasicMaterial({ side: 2 });
  const cube = new Mesh(new BoxGeometry(16, 16, 16), material);
  root.add(cube);
  const focus = visibleOrbitFocus(root, camera);
  expect(focus).not.toBeNull();
  expect(focus!.distance).toBeGreaterThan(0);
  expect(Math.min(...focus!.point.toArray().map((x) => Math.abs(Math.abs(x) - 8)))).toBeLessThan(0.001);

  cube.visible = false;
  expect(visibleOrbitFocus(root, camera)).toBeNull();
  cube.visible = true;
  material.transparent = true;
  material.opacity = 0.20;
  expect(visibleOrbitFocus(root, camera)).toBeNull();
  material.opacity = 1;
  root.visible = false;
  expect(visibleOrbitFocus(root, camera)).toBeNull();
});

test('real viewer: after middle-look/wheel, actual left drag reanchors to visible source with no click-only retarget', async ({ page }) => {
  await page.route('**/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: broadCubeGlb() }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 30000 });
  await frames(page);
  const box = await page.locator('#private-model-canvas').boundingBox();
  expect(box).not.toBeNull();
  const p = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  await page.mouse.move(p.x, p.y);
  await page.mouse.wheel(0, -300);
  await frames(page, 15);

  const start = await pose(page);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(p.x + 16, p.y - 4, { steps: 4 });
  await page.mouse.up({ button: 'middle' });
  await frames(page, 5);
  const looked = await pose(page);
  expect(length(looked.position, start.position)).toBeLessThan(0.00001);
  expect(length(looked.direction, start.direction)).toBeGreaterThan(0.01);

  // Ordinary click must not move the pivot (a click can select objects).
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await frames(page);
  expect(length((await pose(page)).target, looked.target)).toBeLessThan(0.00001);

  // A real left drag runs the same production pointer events / OrbitControls.
  await page.mouse.down({ button: 'left' });
  await page.mouse.move(p.x + 22, p.y + 1, { steps: 10 });
  await page.mouse.up({ button: 'left' });
  await frames(page, 12);
  const after = await pose(page);
  expect(after.projection).toBe('perspective');
  expect([...after.target, ...after.position].every(Number.isFinite)).toBe(true);
  expect(length(after.target, looked.target)).toBeGreaterThan(0.02);
  // The target is the actual cube front surface, not the previous far look point.
  expect(Math.min(...after.target.map(x => Math.abs(Math.abs(x) - 8)))).toBeLessThan(0.08);
  expect(length(after.position, looked.position)).toBeGreaterThan(0.02);
});
