import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// Real Three.js/WebGL resource lifecycle with synthetic 826-scene models.
// Not an authenticated production test or a reproduction of the user's Snap.
const bundleSource = `
import * as THREE from 'three';
import { releaseReplacedGltfGpuResources } from './src/scripts/privateModelGpuLifetime.mjs';

window.runGpuLifetime = (fixed) => {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(64, 64, false);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  const gl = renderer.getContext();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
  camera.position.z = 2;
  const all = [];
  const counts = [];
  let previous = null;
  const createModel = () => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const scenes = Array.from({ length: 826 }, () => {
      const scene = new THREE.Scene();
      scene.add(new THREE.Mesh(geometry, material));
      return scene;
    });
    const model = { scene: scenes[822], scenes };
    all.push(model);
    return model;
  };
  try {
    for (let i = 0; i < 8; i++) {
      const next = createModel();
      if (fixed && previous) {
        const disposed = releaseReplacedGltfGpuResources(previous, renderer);
        if (disposed.geometries !== 1 || disposed.materials !== 1 || disposed.textures !== 1)
          throw Error('shared resources must be disposed once');
      }
      renderer.render(next.scene, camera);
      const pixel = new Uint8Array(4);
      gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      if (pixel[0] < 240 || pixel[1] > 15 || pixel[2] > 15 || gl.getError() !== gl.NO_ERROR || gl.isContextLost())
        throw Error('active replacement pixels/context invalid');
      counts.push({ geometry: renderer.info.memory.geometries, texture: renderer.info.memory.textures });
      previous = next;
    }
    return { geometry: counts.map(x => x.geometry - counts[0].geometry + 1),
      texture: counts.map(x => x.texture - counts[0].texture + 1), contextLost: gl.isContextLost() };
  } finally {
    for (const model of all) releaseReplacedGltfGpuResources(model, renderer);
    renderer.dispose();
    renderer.forceContextLoss();
  }
};
`;

test('repeated WORK_TEST swaps release real Three.js geometry and texture resources', async () => {
  const bundle = await build({
    stdin: { contents: bundleSource, resolveDir: process.cwd(), sourcefile: 'viewer-gpu-lifetime.mjs' },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2022',
    write: false, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true, args: [
    '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ] });
  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
    const baseline = await page.evaluate(() => (window as any).runGpuLifetime(false));
    const fixed = await page.evaluate(() => (window as any).runGpuLifetime(true));
    expect(baseline).toEqual({ geometry: [1,2,3,4,5,6,7,8], texture: [1,2,3,4,5,6,7,8], contextLost: false });
    expect(fixed).toEqual({ geometry: [1,1,1,1,1,1,1,1], texture: [1,1,1,1,1,1,1,1], contextLost: false });
  } finally { await browser.close(); }
});
