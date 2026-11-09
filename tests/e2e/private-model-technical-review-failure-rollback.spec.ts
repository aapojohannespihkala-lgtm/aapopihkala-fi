import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
// Existing source-verified viewer presentation module, not a new viewer.
// @ts-ignore: JS source module has no standalone TypeScript declarations.
import { createTechnicalReviewPresentation } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

test('technical review restores exact source materials and releases its palette after a mid-traversal failure', () => {
  const root = new Group();
  const meshes = Array.from({ length: 3 }, () =>
    new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
  root.add(...meshes);
  const originalMaterials = meshes.map(mesh => mesh.material);
  const originalParents = meshes.map(mesh => mesh.parent);
  let disposedSource = 0, disposedOwned = 0, palettesMade = 0;
  for (const material of originalMaterials) {
    material.addEventListener('dispose', () => { disposedSource += 1; });
  }
  const palette = () => {
    palettesMade += 1;
    const materials = {
      surface: new MeshStandardMaterial({ color: 0x999999, opacity: 0.14, transparent: true }),
      line: new LineBasicMaterial({ color: 0x999999 }),
      systems: { SAHKO: new MeshStandardMaterial({ color: 0xff7700 }) },
    };
    for (const material of [materials.surface, materials.line, materials.systems.SAHKO]) {
      material.addEventListener('dispose', () => { disposedOwned += 1; });
    }
    return materials;
  };
  let fail = true;
  const controller = createTechnicalReviewPresentation(
    root, [meshes[1], meshes[2]], palette,
    (object: object) => {
      if (fail && object === meshes[2]) throw new Error('deliberate source-classifier failure');
      return 'SAHKO';
    },
  );

  // Mesh 0 and mesh 1 are already recolored when mesh 2 fails.
  expect(() => controller.apply(true)).toThrow('deliberate source-classifier failure');
  expect(controller.applied).toBe(false);
  expect(controller.changedCount).toBe(0);
  for (let i = 0; i < meshes.length; i++) {
    expect(meshes[i].material).toBe(originalMaterials[i]);
    expect(meshes[i].parent).toBe(originalParents[i]);
  }
  expect(disposedSource).toBe(0);
  expect(disposedOwned).toBe(3);
  expect(palettesMade).toBe(1);

  // A later successful retry must have a fresh presentation palette.
  fail = false;
  expect(controller.apply(true)).toBe(true);
  expect(controller.applied).toBe(true);
  expect(controller.changedCount).toBe(3);
  for (let i = 0; i < meshes.length; i++) expect(meshes[i].material).not.toBe(originalMaterials[i]);
  expect(palettesMade).toBe(2);

  expect(controller.apply(false)).toBe(false);
  expect(controller.changedCount).toBe(0);
  for (let i = 0; i < meshes.length; i++) expect(meshes[i].material).toBe(originalMaterials[i]);
  expect(disposedOwned).toBe(3); // Cached until final teardown.
  controller.dispose();
  controller.dispose(); // Idempotent and source-safe.
  expect(disposedOwned).toBe(6);
  expect(disposedSource).toBe(0);
  expect(controller.apply(true)).toBe(false);
});

test('normal technical review keeps lines and source materials reversible', () => {
  const root = new Group();
  const sourceMesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: 0x335577 }));
  const sourceLine = new Line(new BoxGeometry(), new LineBasicMaterial({ color: 0x112233 }));
  const sourceMeshMaterial = sourceMesh.material, sourceLineMaterial = sourceLine.material;
  root.add(sourceMesh, sourceLine);
  const owner = createTechnicalReviewPresentation(root, [], () => ({
    surface: new MeshStandardMaterial({ color: 0x999999 }),
    line: new LineBasicMaterial({ color: 0x999999 }),
    systems: {},
  }));
  expect(owner.apply(true)).toBe(true);
  expect(sourceMesh.material).not.toBe(sourceMeshMaterial);
  expect(sourceLine.material).not.toBe(sourceLineMaterial);
  expect(owner.apply(true)).toBe(true);
  expect(owner.changedCount).toBe(2);
  expect(owner.apply(false)).toBe(false);
  expect(sourceMesh.material).toBe(sourceMeshMaterial);
  expect(sourceLine.material).toBe(sourceLineMaterial);
  owner.dispose();
  expect(sourceMesh.parent).toBe(root);
  expect(sourceLine.parent).toBe(root);
});
