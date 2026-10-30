import { test, expect } from '@playwright/test';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { isExactGLTFLoaderClone } from '../../src/scripts/c80SourceProfiles.mjs';

test('HI20 GLTFLoader clones keep exact source metadata and geometry', () => {
  const original = new Group();
  original.userData = { sourceLinks: [{ nodeIndex: 5623 }] };
  const mesh = new Mesh(new BoxGeometry(1, 2, 3), new MeshBasicMaterial());
  original.add(mesh);
  const clone = original.clone(true);
  expect(isExactGLTFLoaderClone(clone, original)).toBe(true);
  clone.userData.sourceLinks[0].nodeIndex = 4321;
  expect(isExactGLTFLoaderClone(clone, original)).toBe(false);
  const wrongMesh = original.clone(true);
  (wrongMesh.children[0] as Mesh).geometry = new BoxGeometry(1, 2, 3);
  expect(isExactGLTFLoaderClone(wrongMesh, original)).toBe(false);
  const missingChild = original.clone(true);
  missingChild.clear();
  expect(isExactGLTFLoaderClone(missingChild, original)).toBe(false);
});
