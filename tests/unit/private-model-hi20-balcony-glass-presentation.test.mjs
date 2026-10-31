import test from 'node:test';
import assert from 'node:assert/strict';
import { createHi20BalconyGlassPresentation } from '../../src/scripts/privateModelHi20Unified52BalconyGlassPresentation.mjs';

const SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const targets = [
  [48, [...Array.from({ length: 8 }, (_, i) => 2221 + i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)]],
  [51, [...Array.from({ length: 8 }, (_, i) => i), ...Array.from({ length: 5 }, (_, i) => 5943 + i)]],
];
function fixture() {
  const associations = new Map();
  const scenes = Array.from({ length: 52 }, () => null);
  const meshes = [];
  const original = { opacity: 0.24, transparent: true, depthWrite: false,
    clone() { return { ...this, disposed: false, dispose() { this.disposed = true; } }; } };
  for (const [index, ids] of targets) {
    const scene = { traverse(fn) { for (const obj of meshes.filter(m => m.parent === scene)) fn(obj); } };
    scenes[index] = scene;
    for (const id of ids) {
      const mesh = { isMesh: true, parent: scene, material: original };
      associations.set(mesh, { nodes: id });
      meshes.push(mesh);
    }
  }
  return { gltf: { scenes, parser: { json: { scenes: Array(52).fill({}) }, associations } },
    meshes, original };
}
test('SHA locked, all 13 upper/lower glass per source scene, source material restores', () => {
  const { gltf, meshes, original } = fixture();
  const presentation = createHi20BalconyGlassPresentation(gltf, SHA);
  assert.equal(presentation.available, true);
  assert.equal(presentation.count, 26);
  assert.equal(presentation.setEnabled(true), true);
  assert(meshes.every(m => m.material !== original && m.material.opacity === 0.60));
  assert.equal(original.opacity, 0.24);
  assert.equal(presentation.setEnabled(false), true);
  assert(meshes.every(m => m.material === original));
  presentation.setEnabled(true);
  presentation.dispose();
  assert(meshes.every(m => m.material === original));
});
test('does not touch different GLB, scene count or incomplete source node map', () => {
  const f = fixture();
  assert.equal(createHi20BalconyGlassPresentation(f.gltf, 'wrong').available, false);
  assert(f.meshes.every(m => m.material === f.original));
  f.gltf.scenes.length = 51;
  assert.equal(createHi20BalconyGlassPresentation(f.gltf, SHA).available, false);
  f.gltf.scenes.length = 52;
  f.gltf.parser.associations.delete(f.meshes[0]);
  assert.equal(createHi20BalconyGlassPresentation(f.gltf, SHA).available, false);
  assert(f.meshes.every(m => m.material === f.original));
});
test('does not style glass with unexpected source opacity', () => {
  const f = fixture();
  f.meshes[0].material = { ...f.original, opacity: 0.5 };
  const presentation = createHi20BalconyGlassPresentation(f.gltf, SHA);
  assert.equal(presentation.available, false);
  assert.equal(presentation.setEnabled(true), false);
  assert(f.meshes.slice(1).every(m => m.material === f.original));
});
