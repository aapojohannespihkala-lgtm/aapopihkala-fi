import { test, expect } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Object3D } from 'three';
import { rehydrateHI20SourceScenes } from '../../src/scripts/c80SourceProfiles.mjs';

function sharedParentFixture() {
  const shared = new Mesh(new BoxGeometry(1, 2, 3), new MeshBasicMaterial());
  shared.userData = { name: 'shared', sourceLinks: [{ sceneIndex: 0, nodeIndex: 0 }] };
  const first = new Group(), second = new Group();
  first.userData.name = 'first';
  second.userData.name = 'second';
  first.add(shared);
  second.add(shared); // GLTFLoader's Object3D.add re-parents without cloning.
  const scenes = [new Group(), new Group()];
  scenes[0].add(first);
  scenes[1].add(second);
  const json = {
    nodes: [{ mesh: 0, name: 'shared' }, { name: 'first', children: [0] },
      { name: 'second', children: [0] }],
    scenes: [{ nodes: [1] }, { nodes: [2] }],
  };
  const paths = new Map([
    [0, new Map([[1, [1]], [0, [1, 0]]])],
    [1, new Map([[2, [2]], [0, [2, 0]]])],
  ]);
  const cached = new Map<number, Object3D>([[0, shared], [1, first], [2, second]]);
  return { shared, scenes, json, paths, cached };
}

test('HI20 rehydrates real shared-parent nodes in both source scenes', () => {
  const f = sharedParentFixture();
  expect(f.scenes[0].children[0].children).toHaveLength(0);
  const scoped = rehydrateHI20SourceScenes(
    { scenes: f.scenes }, f.json, f.paths, f.cached, [0, 1]);
  const a = f.scenes[0].children[0].children[0] as Mesh;
  const b = f.scenes[1].children[0].children[0] as Mesh;
  expect(a).not.toBe(b);
  expect(a).not.toBe(f.shared);
  expect(a.geometry).toBe(f.shared.geometry);
  expect(b.material).toBe(f.shared.material);
  expect(a.userData.sourceLinks).toEqual(f.shared.userData.sourceLinks);
  expect(scoped.get(0)?.get(0)).toBe(a);
  expect(scoped.get(1)?.get(0)).toBe(b);
  expect(a.parent).toBe(f.scenes[0].children[0]);
  expect(b.parent).toBe(f.scenes[1].children[0]);
});

test('HI20 source graph failure is atomic before a scene is mutated', () => {
  const f = sharedParentFixture();
  f.json.nodes[1].children = [999];
  const prior = f.scenes.map(scene => [...scene.children]);
  expect(() => rehydrateHI20SourceScenes(
    { scenes: f.scenes }, f.json, f.paths, f.cached, [0, 1]
  )).toThrow(/rehydrate ambiguous child/);
  f.scenes.forEach((scene, i) => expect(scene.children).toEqual(prior[i]));
});
