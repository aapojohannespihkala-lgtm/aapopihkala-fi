import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { observeC008Depth } from '../../src/scripts/privateModelC008DepthObservation';
import { createSourceNodeView } from '../../src/scripts/privateModelSourceNodeAssociations.mjs';

const sha = 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3';
function fixture() {
  const root = new Group();
  const camera = new PerspectiveCamera(38, 1280 / 900, .1, 100);
  camera.position.set(0, 0, 8); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  const doors = [8028, 8030].map((node, i) => {
    const object = new Mesh(new BoxGeometry(.7, 2, .035), new MeshBasicMaterial());
    object.name = `door${node}`; object.position.x = i ? .6 : -.6; root.add(object); return object;
  });
  const blocker = new Mesh(new BoxGeometry(4, 4, .1), new MeshBasicMaterial());
  blocker.name = 'backing'; blocker.position.z = -1; root.add(blocker);
  const nodes: any[] = [], meshes: any[] = [], materials: any[] = [];
  [8028, 8030, 10].forEach((node, i) => {
    const mesh = [2461, 2462, 0][i];
    nodes[node] = { name: i < 2 ? doors[i].name : blocker.name, mesh };
    meshes[mesh] = { primitives: [{ material: 453 }] };
  });
  materials[453] = { alphaMode: 'OPAQUE' };
  const scenes = Array.from({ length: 295 }, () => ({ nodes: [] as number[] }));
  scenes[293].nodes = [8028, 8030, 10];
  const sceneObjects = Array.from({ length: 295 }, () => new Group()); sceneObjects[293] = root;
  const source = { scenes: sceneObjects, parser: { json: { nodes, meshes, materials, scenes },
    associations: new Map([[doors[0], { nodes: 8028 }], [doors[1], { nodes: 8030 }], [blocker, { nodes: 10 }]]) } };
  return { root, camera, doors, blocker, source, sceneIndex: 293, loadedSha: sha,
    expectedSha: sha, width: 1280, height: 900 };
}

test('C008 read-only live rays distinguish an opaque backing from a true front occluder', () => {
  const f = fixture();
  const before = f.doors.map(door => [door.material, door.visible, door.renderOrder, door.matrix.toArray()]);
  const observation = observeC008Depth(f)!;
  for (const door of observation.doors) expect(door.samples.some(sample => sample.frontNode === door.node)).toBe(true);
  f.blocker.position.z = 2;
  const blocked = observeC008Depth(f)!;
  for (const door of blocked.doors) expect(door.samples.every(sample => sample.frontNode === 10)).toBe(true);
  expect(f.doors.map(door => [door.material, door.visible, door.renderOrder])).toEqual(before.map(row => row.slice(0, 3)));
  expect(observation.humanReview).toBe('NOT_RUN');
});

test('C008 does not mistake transparent context or an invisible ancestor for opaque depth', () => {
  const f = fixture(); f.blocker.position.z = 2;
  f.blocker.material.transparent = true; f.blocker.material.opacity = .3;
  for (const door of observeC008Depth(f)!.doors) expect(door.samples.some(sample => sample.frontNode === door.node)).toBe(true);
  f.root.visible = false;
  for (const door of observeC008Depth(f)!.doors) {
    expect(door.visible).toBe(false); expect(door.samples.every(sample => sample.frontNode === null)).toBe(true);
  }
});

test('C008 rejects source, scene, mesh and original-parent drift', () => {
  const f = fixture();
  expect(observeC008Depth({ ...f, loadedSha: '0'.repeat(64) })).toBeNull();
  expect(observeC008Depth({ ...f, expectedSha: null })).toBeNull();
  expect(observeC008Depth({ ...f, sceneIndex: 290 })).toBeNull();
  f.source.parser.json.nodes[8028].mesh = 2462;
  expect(observeC008Depth(f)).toBeNull();
  f.source.parser.json.nodes[8028].mesh = 2461;
  const moved = new Group(); f.root.add(moved); moved.add(f.doors[0]);
  expect(observeC008Depth(f)).toBeNull();
});

test('C008 requires the same restored multi-scene source map as the live Layers runtime', () => {
  const f = fixture();
  const captured = new Map(f.source.parser.associations);
  f.source.parser.associations.clear();
  expect(observeC008Depth(f)).toBeNull();
  const view = createSourceNodeView(f.source, captured);
  expect(view.scenes[293]).toBe(f.root);
  expect(observeC008Depth({ ...f, source: view })!.doors.map(door => door.node)).toEqual([8028, 8030]);
});
