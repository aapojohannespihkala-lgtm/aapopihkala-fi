import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { releaseReplacedGltfGpuResources } from '../../src/scripts/privateModelGpuLifetime.mjs';

const disposable = (extra = {}) => ({ count: 0, dispose() { this.count++; }, ...extra });

test('releases resources once even when 826 scenes share one mesh', () => {
  const texture = disposable({ isTexture: true });
  const geometry = disposable();
  const material = disposable({ map: texture, normalMap: texture });
  const mesh = { children: [], geometry, material };
  const scene = { children: [mesh] };
  const renderer = { renderLists: disposable() };
  const result = releaseReplacedGltfGpuResources({ scenes: Array.from({ length: 826 }, () => scene), scene }, renderer);
  assert.deepEqual(result, { objects: 2, geometries: 1, materials: 1, textures: 1 });
  for (const item of [texture, geometry, material, renderer.renderLists]) assert.equal(item.count, 1);
});

test('handles material arrays, uniform textures and shared scene objects', () => {
  const image = disposable({ isTexture: true });
  const color = disposable();
  const second = disposable({ uniforms: { diffuse: { value: image } } });
  const mesh = { children: [], material: [color, second] };
  const result = releaseReplacedGltfGpuResources({ scenes: [{ children: [mesh] }, { children: [mesh] }] });
  assert.deepEqual(result, { objects: 3, geometries: 0, materials: 2, textures: 1 });
  for (const item of [image, color, second]) assert.equal(item.count, 1);
});

test('empty result does not dispose render resources', () => {
  const renderLists = disposable();
  assert.deepEqual(releaseReplacedGltfGpuResources(null, { renderLists }),
    { objects: 0, geometries: 0, materials: 0, textures: 0 });
  assert.equal(renderLists.count, 0);
});

test('viewer disposes only previous model after successful scene mount', () => {
  const source = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(source, /const replacedGltf = layersGltf && layersGltf !== gltf \? layersGltf : null;\s*onLayersModelLoaded\(gltf, c70PreviewSession\)/);
  assert.match(source, /setModelScene\(fullModelScene\);[\s\S]{0,250}if \(replacedGltf\) releaseReplacedGltfGpuResources\(replacedGltf, renderer\);/);
  assert.match(source, /import \{ releaseReplacedGltfGpuResources \} from/);
});
