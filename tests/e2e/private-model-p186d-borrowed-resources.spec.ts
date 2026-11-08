import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three';

test('P186D context bridge removal never disposes source-owned geometry or material', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const cleanup = source.match(
    /const clearP186dReviewRoomContextBridge = \(\) => \{([\s\S]*?)\n      \};/,
  )?.[1];
  const prepare = source.match(
    /const prepareP186dD1fRoomContextBridge = \(\) => \{([\s\S]*?)\n      \};/,
  )?.[1];

  expect(cleanup, 'P186D cleanup must remain in the viewer').toBeDefined();
  expect(prepare, 'P186D bridge must retain exact source clone contract').toBeDefined();
  expect(prepare).toContain('clone.geometry = object.geometry;');
  expect(prepare).toContain('clone.material = object.material;');
  expect(cleanup).toContain('p186dReviewRoomContextGroup.parent?.remove(p186dReviewRoomContextGroup)');
  // Releasing these from the temporary bridge also releases the live source!
  expect(cleanup).not.toMatch(/\.dispose\s*\(/);
  expect(cleanup).not.toMatch(/\.dispose\?\.\s*\(/);
});

test('repeated borrowed-scene mounts preserve original GPU resource ownership', () => {
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();
  const sourceMesh = new Mesh(geometry, material);
  const sourceScene = new Group();
  const fullScene = new Group();
  sourceScene.add(sourceMesh);
  let geometryDisposals = 0;
  let materialDisposals = 0;
  geometry.addEventListener('dispose', () => { geometryDisposals += 1; });
  material.addEventListener('dispose', () => { materialDisposals += 1; });

  for (let cycle = 0; cycle < 12; cycle += 1) {
    const bridge = new Group();
    const clone = sourceMesh.clone(false);
    clone.geometry = sourceMesh.geometry;
    clone.material = sourceMesh.material;
    bridge.add(clone);
    fullScene.add(bridge);
    expect(clone.geometry).toBe(sourceMesh.geometry);
    expect(clone.material).toBe(sourceMesh.material);

    // The presentation group is viewer-owned; the assets are loader-owned.
    bridge.parent?.remove(bridge);
    expect(bridge.parent).toBeNull();
    expect(fullScene.children).toHaveLength(0);
    expect(sourceMesh.parent).toBe(sourceScene);
    expect(sourceMesh.geometry).toBe(geometry);
    expect(sourceMesh.material).toBe(material);
    expect(materialDisposals).toBe(0);
    expect(geometryDisposals).toBe(0);
  }

  // The owner may finally release them once the source itself is retired.
  geometry.dispose();
  material.dispose();
  expect(geometryDisposals).toBe(1);
  expect(materialDisposals).toBe(1);
});
