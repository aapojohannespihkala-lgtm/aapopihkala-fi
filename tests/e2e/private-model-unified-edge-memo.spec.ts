import { expect, test } from '@playwright/test';
import { BoxGeometry, BufferAttribute, Float32BufferAttribute, Mesh, MeshBasicMaterial } from 'three';
import { createUnifiedEdgeMemo } from '../../src/scripts/privateModelUnifiedEdgeMemo';

const makeMesh = (x = 0) => {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  mesh.position.set(x, 0, 0);
  mesh.updateMatrixWorld(true);
  return mesh;
};

test('identical ordered visible set and variant reuse the exact stored segment array', () => {
  const memo = createUnifiedEdgeMemo(4);
  const meshes = [makeMesh(0), makeMesh(2)];
  const key = memo.keyOf(meshes, 'plain');
  expect(memo.keyOf(meshes, 'plain')).toBe(key);
  expect(memo.get(key)).toBeNull();

  const source = new Float32Array([0, 0, 0, 1, 0, 0]);
  memo.set(key, source, 3);
  source[0] = 99; // later disposal/mutation of the scene copy must not leak in
  const hit = memo.get(memo.keyOf(meshes, 'plain'));
  expect(hit).not.toBeNull();
  expect(Array.from(hit!.positions)).toEqual([0, 0, 0, 1, 0, 0]);
  expect(hit!.suppressedTJunctions).toBe(3);
});

test('any change to set, order, transform, geometry data or C80-044 variant misses', () => {
  const memo = createUnifiedEdgeMemo(4);
  const a = makeMesh(0);
  const b = makeMesh(2);
  const base = memo.keyOf([a, b], 'plain');
  const seen = new Set([base]);
  const expectNew = (key: string) => {
    expect(seen.has(key)).toBe(false);
    seen.add(key);
  };

  expectNew(memo.keyOf([b, a], 'plain'));
  expectNew(memo.keyOf([a], 'plain'));
  expectNew(memo.keyOf([a, b], 'c044'));

  b.position.x = 2.0001;
  b.updateMatrixWorld(true);
  expectNew(memo.keyOf([a, b], 'plain'));

  const position = a.geometry.getAttribute('position') as BufferAttribute;
  position.setX(0, position.getX(0) + 0.5);
  position.needsUpdate = true;
  expectNew(memo.keyOf([a, b], 'plain'));

  a.geometry.setAttribute('position', new Float32BufferAttribute(Array.from(position.array as Float32Array), 3));
  expectNew(memo.keyOf([a, b], 'plain'));

  a.geometry.setIndex([0, 1, 2]);
  expectNew(memo.keyOf([a, b], 'plain'));

  a.geometry = new BoxGeometry(1, 1, 1);
  expectNew(memo.keyOf([a, b], 'plain'));
});

test('memo is bounded and least recently used entries are evicted', () => {
  const memo = createUnifiedEdgeMemo(2);
  const meshes = [makeMesh(0), makeMesh(1), makeMesh(2)];
  const k1 = memo.keyOf([meshes[0]], 'plain');
  const k2 = memo.keyOf([meshes[1]], 'plain');
  const k3 = memo.keyOf([meshes[2]], 'plain');
  memo.set(k1, [1], 0);
  memo.set(k2, [2], 0);
  expect(memo.get(k1)).not.toBeNull(); // k1 is now most recent
  memo.set(k3, [3], 0);
  expect(memo.size).toBe(2);
  expect(memo.get(k2)).toBeNull();
  expect(Array.from(memo.get(k1)!.positions)).toEqual([1]);
  expect(Array.from(memo.get(k3)!.positions)).toEqual([3]);
  memo.clear();
  expect(memo.size).toBe(0);
});
