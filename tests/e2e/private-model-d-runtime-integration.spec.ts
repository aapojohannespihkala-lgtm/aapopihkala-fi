import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { THREE } from '../../src/scripts/threeRuntime';
import { createMainViewScope } from '../../src/scripts/privateModelMainViewScope';

const locks = {
  r4e: { env: 'YLIS_R4E_GLB', sha: '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680', scene: 32 },
  scene28: { env: 'YLIS_SCENE28_GLB', sha: '9bd394795b6bee37de9aea6f6b128cf93e9489a34015852d2d59082a3529013e', scene: 28 },
};
const privateBytes = (kind: keyof typeof locks) => {
  const lock = locks[kind], path = process.env[lock.env];
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(path, `Missing ${lock.env}, real-model run must fail`).toBeTruthy();
  test.skip(!path, `${lock.env} absent: real source NOT_RUN, never a WebGL PASS.`);
  const bytes = readFileSync(path!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(lock.sha);
  expect(JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()).scene).toBe(lock.scene);
  return bytes;
};

test('atomic Group primitive permit is revocable, source-hidden-safe and restores WHOLE', () => {
  const root = new THREE.Group(), group = new THREE.Group();
  const scope = { objectKey: 'wall', apartmentScope: 'SHARED_CD', storeyScope: 'BOTH',
    role: 'SHARED_BOUNDARY', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' };
  group.userData.ylisViewScope = scope;
  const meshes = [new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()),
    new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())];
  meshes[1].visible = false;
  group.add(...meshes); root.add(group);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  lower.userData.ylisViewScope = { ...scope, objectKey: 'lower', apartmentScope: 'D', storeyScope: '1F', role: 'CONTENT' };
  root.add(lower);
  const controller = createMainViewScope(root);
  controller.apply('1F'); expect(meshes.every(m => !m.visible)).toBe(true);
  let clipped = true;
  const permit = { sourceObjectKey: 'wall', meshes, clippedNow: () => clipped };
  controller.apply('1F', permit); expect(controller.t04Granted).toBe(true);
  expect(meshes.map(m => m.visible)).toEqual([true, false]);
  clipped = false; controller.enforce(); expect(controller.t04Granted).toBe(false);
  clipped = true; meshes[0].visible = true; controller.enforce();
  expect(meshes.every(m => !m.visible)).toBe(true);
  controller.restore(); expect(meshes.map(m => m.visible)).toEqual([true, false]);
  controller.apply('2F', { ...permit, meshes: [meshes[0], lower] });
  expect(controller.t04Granted).toBe(false);
  controller.restore(); controller.apply('BOTH');
  expect(meshes.map(m => m.visible)).toEqual([true, false]);
  controller.restore(); expect(meshes.every(m => !Object.hasOwn(m.userData, 'ylisViewScope'))).toBe(true);
});

const menu = async (page: Page, id: string) => {
  if (await page.locator(id).getAttribute('open') === null) await page.locator(`${id} > summary`).click();
};
const chooseFloor = async (page: Page, floor: string) => {
  await menu(page, '#preset-menu');
  await page.locator('#main-view-floor').selectOption(floor);
};

for (const width of [1280, 390]) test(`actual R4E main viewer floor/reference/orbit/reset/reload WebGL at ${width}px`, async ({ page }, info) => {
  const bytes = privateBytes('r4e');
  test.setTimeout(180_000);
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256', locks.r4e.sha);
  const gl = await canvas.evaluate((c: HTMLCanvasElement) => {
    const gl = c.getContext('webgl2')!;
    return { real: gl instanceof WebGL2RenderingContext, lost: gl.isContextLost(), error: gl.getError() };
  });
  expect(gl).toEqual({ real: true, lost: false, error: 0 });
  await menu(page, '#preset-menu'); await page.locator('#main-view-area').selectOption('D');
  const observations: object[] = [];
  for (const floor of ['1F', '2F', 'BOTH', '1F', '2F']) {
    const start = performance.now();
    await chooseFloor(page, floor);
    await expect(canvas).toHaveAttribute('data-content-scene', 'full-model');
    await expect(canvas).toHaveAttribute('data-main-view-floor', floor);
    await expect(canvas).toHaveAttribute('data-main-view-t04-status', floor === 'BOTH' ? 'D_BOTH_ORIGINAL' : 'T04_CLIPPED_SOURCE');
    await expect(canvas).toHaveAttribute('data-main-view-stair-status', 'HOST_HOLD');
    const transitionMs = performance.now() - start;
    expect(transitionMs, 'Floor transition must remain bounded').toBeLessThan(10_000);
    if (floor !== 'BOTH') {
      await menu(page, '#preset-menu'); await page.locator('#other-floor-mode').selectOption('REFERENCE');
      await expect.poll(async () => Number(await canvas.getAttribute('data-other-floor-reference-count'))).toBeGreaterThan(16);
      await page.screenshot({ path: info.outputPath(`r4e-${floor}-reference-${observations.length}.png`) });
      await menu(page, '#preset-menu'); await page.locator('#other-floor-mode').selectOption('HIDDEN');
      await expect(canvas).toHaveAttribute('data-other-floor-reference-count', '0');
    }
    const box = (await canvas.boundingBox())!;
    const before = await canvas.screenshot();
    await page.mouse.move(box.x + box.width * .45, box.y + box.height * .55);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * .65, box.y + box.height * .45, { steps: 8 }); await page.mouse.up();
    await expect(canvas).toHaveAttribute('data-camera-rotation', 'enabled');
    await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
    await page.screenshot({ path: info.outputPath(`r4e-${floor}-orbit-${observations.length}.png`) });
    observations.push({ floor, transitionMs,
      count: await canvas.getAttribute('data-edge-source-mesh-count') });
  }
  await menu(page, '#more-menu'); await page.getByRole('button', { name: 'Palauta näkymän oletukset', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
  await expect(canvas).toHaveAttribute('data-main-view-t04-status', 'WHOLE_ORIGINAL');
  await page.reload(); await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(canvas).toHaveAttribute('data-main-view-area', 'WHOLE');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await info.attach('actual-r4e-runtime-report', { body: JSON.stringify({ sourceSha256: locks.r4e.sha,
    sourceScene: 32, sourceLevel: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD', testedCommit: process.env.D_VIEW_TESTED_COMMIT ?? process.env.GITHUB_SHA ?? 'local',
    browserWebGL: 'PASS', production: 'NOT_RUN', host: 'HOLD', width, observations }), contentType: 'application/json' });
});

test('published scene28 is separate and cannot claim unavailable D metadata', async ({ page }, info) => {
  const bytes = privateBytes('scene28');
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.goto('/private-model/');
  await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(page.locator('#main-view-area')).toBeDisabled();
  await expect(page.locator('#private-model-canvas')).toHaveAttribute('data-main-view-source-sha256', locks.scene28.sha);
  await page.screenshot({ path: info.outputPath('published-scene28-metadata-unavailable.png') });
  await info.attach('published-source-result', { body: JSON.stringify({ sourceSha256: locks.scene28.sha,
    sourceScene: 28, dView: 'HOLD_NO_METADATA', replacedByR4E: false }), contentType: 'application/json' });
});

// A second browser renders the exact original wall primitives with the actual
// runtime. Pixel isolation below changes only temporary test material color.
// The source geometry, matrices, hierarchy, clipping and raycasts stay original.
test('actual R4E T04 pixels, pick half-space, invalidation and material disposal', async ({ page }, info) => {
  const bytes = privateBytes('r4e');
  const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
    import { THREE, GLTFLoader } from './src/scripts/threeRuntime';
    import { loadModelWithSourceCards } from './src/scripts/privateModelSourceCards';
    import { createDViewRuntime } from './src/scripts/privateModelDViewRuntime';
    window.run = async () => {
      const gltf = await loadModelWithSourceCards(new GLTFLoader(), '/private-model/model.glb');
      const root = gltf.scene;
      const group = root.children[gltf.parser.json.scenes[32].nodes.indexOf(1276)];
      if (!group || group.children.length !== 2) throw Error('SOURCE_BINDING');
      const meshes = group.children, originals = meshes.map(o => o.material), raycasts = meshes.map(o => o.raycast);
      const renderer = new THREE.WebGLRenderer({antialias:false});
      renderer.localClippingEnabled = true; renderer.setSize(256,256); renderer.setClearColor(0,1);
      document.body.append(renderer.domElement);
      const scene = new THREE.Scene(); scene.add(root);
      const runtime = createDViewRuntime(gltf,renderer);
      const target = new THREE.WebGLRenderTarget(256,256), pixels = new Uint8Array(256*256*4);
      const all = []; root.traverse(o=>{if(o.isMesh) all.push(o)});
      const visibility = all.map(o=>o.visible);
      const bounds = new THREE.Box3().setFromObject(group), center=bounds.getCenter(new THREE.Vector3());
      const camera = new THREE.OrthographicCamera(-6,6,5,-5,.01,100);
      camera.position.set(center.x+20,center.y,center.z);camera.lookAt(center);camera.updateMatrixWorld();
      const colorBaseline = originals.map(m=>({color:m.color.clone(),emissive:m.emissive.clone()}));
      const paint = m=>{m.color.set(0xff00ff);m.emissive.set(0xff00ff);m.toneMapped=false;};
      const draw = () => {
        all.forEach(o=>o.visible=meshes.includes(o));runtime.enforce();
        renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,256,256,pixels);
        const counts={lower:0,upper:0};
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){
          const i=(y*256+x)*4;
          if(pixels[i]>120&&pixels[i+2]>120&&pixels[i+1]<80){
            const world=new THREE.Vector3((x+.5)/128-1,(y+.5)/128-1,0).unproject(camera);
            if(world.y<2.70)counts.lower++;if(world.y>2.82)counts.upper++;
          }
        }
        return counts;
      };
      const rows=[];let disposed=0;
      for(const floor of ['1F','2F','BOTH','1F','2F']){
        runtime.restore();all.forEach((o,i)=>o.visible=visibility[i]);
        runtime.apply(floor);
        for(const mesh of meshes){paint(mesh.material);if(mesh.material!==originals[meshes.indexOf(mesh)])mesh.material.addEventListener('dispose',()=>disposed++);}
        const counts=draw();
        const picks={};
        for(const [name,y] of [['lower',1.5],['upper',3.5]]){
          const ray=new THREE.Raycaster(new THREE.Vector3(center.x+20,y,center.z),new THREE.Vector3(-1,0,0));
          picks[name]=ray.intersectObjects(meshes,false).length;
        }
        rows.push({floor,status:runtime.t04Status,counts,picks,geometries:meshes.map(m=>m.geometry.uuid),
          gpuGeometries:renderer.info.memory.geometries});
      }
      renderer.localClippingEnabled=false;runtime.enforce();
      const invalidated=meshes.every(m=>!m.visible)&&runtime.t04Status==='T04_HOLD';
      renderer.localClippingEnabled=true;runtime.restore();
      const exactMaterials=meshes.every((m,i)=>m.material===originals[i]);
      runtime.dispose();const exactRaycasts=meshes.every((m,i)=>m.raycast===raycasts[i]);
      originals.forEach((m,i)=>{m.color.copy(colorBaseline[i].color);m.emissive.copy(colorBaseline[i].emissive)});
      const glError=renderer.getContext().getError();
      target.dispose();renderer.dispose();
      return {rows,invalidated,exactMaterials,exactRaycasts,disposed,glError};
    };` }, bundle: true, format: 'iife', write: false });
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.route('**/runtime-probe/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }));
  await page.goto('/runtime-probe/'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const result = await page.evaluate(() => (window as any).run());
  for (const row of result.rows) {
    if (row.floor === '2F') expect(row.counts.lower).toBe(0);
    if (row.floor === '1F') expect(row.counts.upper).toBe(0);
    if (row.floor !== '2F') expect(row.counts.lower).toBeGreaterThan(10);
    if (row.floor !== '1F') expect(row.counts.upper).toBeGreaterThan(10);
    expect(row.picks.lower)[row.floor === '2F' ? 'toBe' : 'toBeGreaterThan'](0);
    expect(row.picks.upper)[row.floor === '1F' ? 'toBe' : 'toBeGreaterThan'](0);
  }
  expect(result.invalidated).toBe(true); expect(result.exactMaterials).toBe(true); expect(result.exactRaycasts).toBe(true);
  expect(result.disposed).toBe(8); expect(result.glError).toBe(0);
  expect(result.rows.every((r: any) => r.gpuGeometries === result.rows[0].gpuGeometries)).toBe(true);
  expect(result.rows.every((r: any) => JSON.stringify(r.geometries) === JSON.stringify(result.rows[0].geometries))).toBe(true);
  await info.attach('actual-wall-webgl-and-picking', { body: JSON.stringify(result), contentType: 'application/json' });
});
