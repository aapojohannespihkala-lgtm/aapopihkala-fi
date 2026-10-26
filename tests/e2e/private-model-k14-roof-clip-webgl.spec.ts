import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// This renders synthetic geometry to verify the calculator's Three.js contract.
// Fixture proof is not real K14 source approval or production-model acceptance.
const bundleSource = `
import * as THREE from 'three';
import { deriveK14RoofViewClip, R4E_K14_SOURCE_LOCK as lock }
  from './src/scripts/privateModelK14RoofViewClip.mjs';
window.renderK14Clip = (elements) => {
  const matrix = new THREE.Matrix4().fromArray(elements);
  const objectKey = 'synthetic-K14-render-contract';
  const result = deriveK14RoofViewClip({
    view: 'D_BOTH', model: { ...lock },
    source: { nodeIndex: 2764, objectKey, apartmentScope: 'D',
      storeyScope: 'UNKNOWN', role: 'UNCLASSIFIED',
      phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST', k14SourceStatus: 'HOLD_STOREY_ROLE' },
    sliceProof: { status: 'SOURCE_APPROVED_X_BAND', zipSha256: lock.zipSha256,
      nodeIndex: 2764, sourceObjectKey: objectKey, apartmentSijId: 'SIJ033',
      boundarySijId: 'SIJ062', purpose: 'VIEW_ONLY_NOT_AS_BUILT',
      sourceDocIds: ['DOC:1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU',
        'DOC:1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI'],
      minX: -.6, maxX: 6.375 },
    matrixReference: 'G1_LOCAL_TO_WORLD', g1LocalToWorld: elements,
  });
  if (!result.ok || result.planes.length !== 2) throw new Error('Fixture rejected');
  const width = 240, height = 160;
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1); renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 1); renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.NoToneMapping;
  const target = new THREE.WebGLRenderTarget(width, height);
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(10, 2).translate(3, 0, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false; mesh.matrix.copy(matrix); scene.add(mesh);
  const world = (x, y = 0) => new THREE.Vector3(x, y, 0).applyMatrix4(matrix);
  const center = world(3);
  const alongX = world(4).sub(center), alongY = world(3, 1).sub(center);
  const normal = new THREE.Vector3().crossVectors(alongX, alongY).normalize();
  const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, .1, 100);
  camera.up.copy(alongY).normalize();
  camera.position.copy(center).addScaledVector(normal, 30); camera.lookAt(center);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  const capture = () => {
    const pixels = new Uint8Array(width * height * 4);
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    const samples = [-1.4, 2.7, 7.2].map(x => {
      const p = world(x).project(camera);
      const px = Math.floor((p.x + 1) * width / 2);
      const py = Math.floor((p.y + 1) * height / 2);
      if (px < 0 || py < 0 || px >= width || py >= height) throw new Error('Sample outside viewport');
      const offset = (py * width + px) * 4;
      return pixels[offset] > 200 && pixels[offset + 1] < 10 && pixels[offset + 2] < 10;
    });
    return { pixels, samples };
  };
  try {
    const before = capture();
    material.clippingPlanes = result.planes.map(p =>
      new THREE.Plane(new THREE.Vector3(...p.normal), p.constant));
    const clipped = capture();
    // Reproduce the old bug as a negative control against the actual shader.
    material.clippingPlanes = material.clippingPlanes.map(p => p.clone().negate());
    const reversed = capture();
    material.clippingPlanes = null;
    const restored = capture();
    return { baseline: before.samples, clipped: clipped.samples, reversed: reversed.samples,
      restored: restored.samples,
      exactRestore: before.pixels.every((v, i) => v === restored.pixels[i]),
      canApplyToViewer: result.canApplyToViewer, canPublish: result.canPublish,
      glError: renderer.getContext().getError() };
  } finally {
    renderer.setRenderTarget(null); target.dispose(); geometry.dispose();
    material.dispose(); renderer.dispose(); renderer.forceContextLoss();
  }
};
`;

test('K14 planes keep the band in real WebGL after identity, mirrored and sheared transforms', async () => {
  const bundle = await build({
    stdin: { contents: bundleSource, resolveDir: process.cwd(), sourcefile: 'k14-clip-gpu.mjs' },
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
    const transforms = [
      { name: 'identity', matrix: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] },
      { name: 'mirrored', matrix: [-1,0,0,0, 0,1.3,0,0, 0,0,1,0, 4,2,0,1] },
      { name: 'sheared', matrix: [1,.25,.1,0, .4,1.2,.15,0, .2,0,1,0, 3,-2,1,1] },
    ];
    for (const { name, matrix } of transforms) {
      const result = await page.evaluate(elements => (window as any).renderK14Clip(elements), matrix);
      expect(result, name).toEqual({
        baseline: [true, true, true], clipped: [false, true, false],
        reversed: [false, false, false], restored: [true, true, true],
        exactRestore: true, canApplyToViewer: false, canPublish: false, glError: 0,
      });
    }
  } finally { await browser.close(); }
});
