import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { THREE, GLTFLoader } from '../../src/scripts/threeRuntime';
import { deriveSharedCdFloorPlane } from '../../src/scripts/privateModelSharedBoundaryClip.mjs';

const helper = readFileSync(new URL('../../src/scripts/privateModelSharedBoundaryClip.mjs', import.meta.url), 'utf8');
const matrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];

test('T04 WebGL retains the requested floor and rejects the old reversed-sign control', async ({ page }, info) => {
  await page.route('**/t04-probe/three.module.js', route => route.fulfill({ contentType: 'text/javascript',
    body: readFileSync(new URL('../../node_modules/three/build/three.module.js', import.meta.url), 'utf8') }));
  await page.route('**/t04-probe/three.core.js', route => route.fulfill({ contentType: 'text/javascript',
    body: readFileSync(new URL('../../node_modules/three/build/three.core.js', import.meta.url), 'utf8') }));
  await page.route('**/t04-probe/clip.mjs', route => route.fulfill({ contentType: 'text/javascript', body: helper }));
  await page.route('**/t04-probe/', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html>
    <html><body><canvas id="probe"></canvas><script type="module">
    import * as THREE from './three.module.js';
    import { deriveSharedCdFloorPlane } from './clip.mjs';
    try {
      const canvas = document.querySelector('canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
      renderer.setSize(128, 128); renderer.localClippingEnabled = true;
      const target = new THREE.WebGLRenderTarget(128, 128);
      renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 1);
      const scene = new THREE.Scene();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -1,0,.76, 1,0,.76, 1,0,4.76, -1,0,.76, 1,0,4.76, -1,0,4.76
      ], 3));
      const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, toneMapped: false });
      const mesh = new THREE.Mesh(geometry, material); scene.add(mesh);
      const source = { zipSha256: 'a'.repeat(64), objectKey: 'synthetic-render-contract',
        apartmentScope: 'SHARED_CD', storeyScope: 'BOTH', role: 'SHARED_BOUNDARY',
        phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST' };
      const transforms = [
        ${JSON.stringify(matrix)},
        [-1,0,0,0, 0,0,-1,0, 0,1.5,0,0, 3,2,-1,1],
        [1,0,0,0, .3,0,-1,0, .2,1.2,.1,0, -2,-1,3,1],
      ];
      const results = [];
      for (const elements of transforms) {
        const transform = new THREE.Matrix4().fromArray(elements);
        mesh.matrixAutoUpdate = false; mesh.matrix.copy(transform);
        const point = z => new THREE.Vector3(0,0,z).applyMatrix4(transform);
        const center = point(2.76), up = point(3.76).sub(center).normalize();
        const right = new THREE.Vector3(1,0,0).transformDirection(transform);
        const normal = right.clone().cross(up).normalize();
        const camera = new THREE.OrthographicCamera(-4,4,4,-4,.1,30);
        camera.up.copy(up); camera.position.copy(center).addScaledVector(normal,10);
        camera.lookAt(center); camera.updateMatrixWorld();
        const pixels = new Uint8Array(128*128*4);
        const draw = plane => {
          material.clippingPlanes = plane ? [plane] : []; material.needsUpdate = true;
          renderer.render(scene,camera); renderer.readRenderTargetPixels(target,0,0,128,128,pixels);
          const sample = z => {
            const p = point(z).project(camera);
            const x = Math.floor((p.x+1)*64), y = Math.floor((p.y+1)*64), i = (y*128+x)*4;
            return pixels[i]>128 && pixels[i+2]>128;
          };
          return { lower: sample(1.76), upper: sample(3.76), bytes: Array.from(pixels) };
        };
        const before = draw(null), floors = {};
        for (const floor of ['1F','2F']) {
          const result = deriveSharedCdFloorPlane({ floor, source, expectedZipSha256: source.zipSha256,
            expectedObjectKey: source.objectKey, matrixReference:'G1_LOCAL_TO_WORLD', g1LocalToWorld:elements });
          if (!result.ok) throw new Error(result.reason);
          const plane = new THREE.Plane(new THREE.Vector3(...result.plane.normal), result.plane.constant);
          const current = draw(plane), reversed = draw(plane.clone().negate());
          floors[floor] = { current:{lower:current.lower,upper:current.upper},
            oldControl:{lower:reversed.lower,upper:reversed.upper} };
        }
        const restored = draw(null);
        results.push({ floors, original:{lower:before.lower,upper:before.upper},
          exactRestore:before.bytes.every((v,i)=>v===restored.bytes[i]),
          glError:renderer.getContext().getError() });
      }
      target.dispose(); geometry.dispose(); material.dispose(); renderer.dispose();
      window.__t04 = { ok:true, results };
    } catch (error) { window.__t04 = { ok:false, error:String(error) }; }
    </script></body></html>` }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/t04-probe/');
  await page.waitForFunction(() => Boolean((window as any).__t04));
  const result = await page.evaluate(() => (window as any).__t04);
  expect(result.ok, result.error).toBe(true);
  expect(errors).toEqual([]);
  expect(result.results).toHaveLength(3);
  for (const observed of result.results) {
    expect(observed.original).toEqual({ lower: true, upper: true });
    expect(observed.floors['1F'].current).toEqual({ lower: true, upper: false });
    expect(observed.floors['2F'].current).toEqual({ lower: false, upper: true });
    expect(observed.floors['1F'].oldControl).toEqual({ lower: false, upper: true });
    expect(observed.floors['2F'].oldControl).toEqual({ lower: true, upper: false });
    expect(observed.exactRestore).toBe(true);
    expect(observed.glError).toBe(0);
  }
  await info.attach('t04-gpu-sign-report', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
});

test('actual R4E shared wall primitives retain the requested source half-space', async ({}, info) => {
  const path = process.env.YLIS_R4E_GLB;
  test.skip(!path, 'Private R4E source absent. This is not real-model acceptance.');
  const bytes = readFileSync(path!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680');
  const previous = globalThis.ProgressEvent;
  if (!previous) globalThis.ProgressEvent = class {} as unknown as typeof ProgressEvent;
  let gltf;
  try { gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength), ''); }
  finally { if (!previous) delete (globalThis as { ProgressEvent?: unknown }).ProgressEvent; }
  expect(gltf.scenes.indexOf(gltf.scene)).toBe(32);
  const groups: THREE.Object3D[] = [];
  gltf.scene.traverse(o => { if (o.userData.ylisViewScope?.sourceNodeIndex === 1276) groups.push(o); });
  expect(groups).toHaveLength(1);
  const group = groups[0];
  expect(gltf.parser.json.nodes[1276].mesh).toBe(859);
  expect(group.userData.ylisViewScope).toEqual(gltf.parser.json.nodes[1276].extras.ylisViewScope);
  expect(group.userData.ylisViewScope).toMatchObject({ sourceMeshIndex:859, apartmentScope:'SHARED_CD',
    role:'SHARED_BOUNDARY',storeyScope:'BOTH' });
  expect(group.children).toHaveLength(2);
  group.updateWorldMatrix(true, true);
  const source = { ...group.userData.ylisViewScope, zipSha256: 'e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807' };
  const observations = [];
  for (const object of group.children) {
    const mesh = object as THREE.Mesh, positions = mesh.geometry.getAttribute('position');
    const counts = { lower:0, upper:0 };
    for (const floor of ['1F','2F']) {
      // This known source proof maps G1 Z=2.760 to world Y=2.760.
      // It does not promote this transform to a global scene32 runtime permit.
      const result = deriveSharedCdFloorPlane({ floor, source, expectedZipSha256:source.zipSha256,
        expectedObjectKey:source.objectKey,matrixReference:'G1_LOCAL_TO_WORLD',g1LocalToWorld:matrix });
      expect(result.ok).toBe(true);
      if (!result.plane) throw new Error('Verified single-floor plane missing');
      const plane = new THREE.Plane(new THREE.Vector3(...result.plane.normal), result.plane.constant);
      for (let i=0;i<positions.count;i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
        const lower = p.y < 2.760;
        expect(plane.distanceToPoint(p)>0).toBe(floor==='1F' ? lower : !lower);
        if (floor==='1F') counts[lower?'lower':'upper']++;
      }
    }
    expect(counts.lower).toBeGreaterThan(0); expect(counts.upper).toBeGreaterThan(0);
    observations.push(counts);
  }
  await info.attach('t04-real-source-halfspaces',{body:JSON.stringify({scene:32,node:1276,mesh:859,observations,
    gpu:'NOT_RUN',production:'NOT_RUN'}),contentType:'application/json'});
});
