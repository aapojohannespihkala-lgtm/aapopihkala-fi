import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { releaseReplacedGltfGpuResources, withSelectedGltfScenes } from '../../src/scripts/privateModelGpuLifetime.mjs';

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

test('selective review parsing preserves source scene and node indices', async () => {
  const loader = new GLTFLoader();
  const source = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [
      { name: 'Default', nodes: [0] },
      { name: 'Archived', nodes: [1] },
      { name: 'Review', nodes: [2] },
    ],
    nodes: [{ name: 'DefaultNode' }, { name: 'ArchivedNode' }, { name: 'ReviewNode' }],
  };
  const selected = withSelectedGltfScenes(loader, () => new Set([0, 2]));
  const gltf = await selected.parseAsync(JSON.stringify(source), '');
  assert.deepEqual(gltf.parser.json.scenes, source.scenes);
  assert.deepEqual(gltf.parser.json.nodes, source.nodes);
  assert.equal(gltf.scenes.length, 3);
  assert.equal(gltf.scene, gltf.scenes[0]);
  assert.equal(gltf.scenes[1], undefined);
  assert.equal(gltf.scenes[2].children[0].name, 'ReviewNode');
  assert.equal(gltf.parser.cache.get('node:1'), undefined);

  const full = await loader.parseAsync(JSON.stringify(source), '');
  assert.equal(full.scenes[1].children[0].name, 'ArchivedNode');
  await assert.rejects(withSelectedGltfScenes(loader, () => {
    throw Error('C80_R31_REVIEW_SOURCE_MISMATCH');
  }).parseAsync(JSON.stringify(source), ''), /C80_R31_REVIEW_SOURCE_MISMATCH/);
  assert.equal((await loader.parseAsync(JSON.stringify(source), '')).scenes[1].name, 'Archived');
});

test('large GLB digest is awaited before GLTFLoader parse, with exact SHA gate retained', () => {
  const source = readFileSync(new URL('../../src/scripts/privateModelSourceCards.ts', import.meta.url), 'utf8');
  assert.match(source, /const digest = await digestTask;[\s\S]{0,160}if \(exactSource && digest !== exactSource\.glbSha256\)/);
  assert.match(source, /const \[gltf, cards\] = await Promise\.all\(\[\s*modelLoader\.parseAsync\(bytes/);
  assert.doesNotMatch(source, /loader\.parseAsync\(bytes[^\n]*\), digestTask, getBundle\(\)/);
});
