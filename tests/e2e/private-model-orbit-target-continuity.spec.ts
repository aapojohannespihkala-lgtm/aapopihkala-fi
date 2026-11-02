import { test, expect } from '@playwright/test';

// Issue #1527: isolated real Three.js mouse-behaviour measurement.
// This does not replace authenticated production-WebGL verification.
test('middle-look preserves eye and reports the next orbit pivot', async ({ page }) => {
  const { build } = await import('esbuild');
  const bundled = await build({
    stdin: {
      contents: `import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { installMiddleMouseLookAround } from './src/scripts/privateModelMiddleMouseLookAround.ts';
const canvas=document.querySelector('canvas');
const camera=new THREE.PerspectiveCamera(55,1.6,.01,100);
camera.position.set(0,2,10);
const controls=new OrbitControls(camera,canvas);
controls.target.set(0,2,0);controls.zoomToCursor=true;controls.enableDamping=false;controls.update();
installMiddleMouseLookAround({camera,controls,canvas});
window.snapshot=()=>({position:camera.position.toArray(),target:controls.target.toArray()});`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'iife', write: false,
  });
  await page.setContent('<canvas width="800" height="500" style="width:800px;height:500px;touch-action:none"></canvas>');
  await page.addScriptTag({ content: bundled.outputFiles[0].text });
  const snap = () => page.evaluate(() => (window as any).snapshot());
  const dist = (a:number[],b:number[]) => Math.hypot(...a.map((v,i)=>v-b[i]));
  await page.mouse.move(650,240);
  await page.mouse.wheel(0,-180);
  const before = await snap();
  await page.mouse.move(260,240);
  await page.mouse.down({button:'middle'});
  await page.mouse.move(440,205,{steps:6});
  await page.mouse.up({button:'middle'});
  const afterLook = await snap();
  expect(dist(before.position,afterLook.position)).toBeLessThan(1e-6);
  await page.mouse.move(250,240);
  await page.mouse.down({button:'left'});
  await page.mouse.move(320,270,{steps:5});
  await page.mouse.up({button:'left'});
  const afterOrbit = await snap();
  expect(dist(afterLook.position,afterOrbit.position)).toBeGreaterThan(.01);
  expect(dist(afterLook.target,afterOrbit.target)).toBeLessThan(1e-5);
  console.log('ORBIT1527_DIAG', JSON.stringify({
    targetShiftOnMMB: dist(before.target,afterLook.target),
    cameraShiftOnMMB: dist(before.position,afterLook.position),
    targetAfterLMB: afterOrbit.target,
  }));
});