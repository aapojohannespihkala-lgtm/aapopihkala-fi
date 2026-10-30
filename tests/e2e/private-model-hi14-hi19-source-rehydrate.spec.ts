import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Object3D } from 'three';
import { c80SourceRehydrationIndices, rehydrateHI20SourceScenes } from '../../src/scripts/c80SourceProfiles.mjs';
import hi12 from '../../src/scripts/privateModelC80Hi12Contract.json' with { type: 'json' };
import hi13 from '../../src/scripts/privateModelC80Hi13Contract.json' with { type: 'json' };
import hi14 from '../../src/scripts/privateModelC80Hi14Contract.json' with { type: 'json' };
import hi18 from '../../src/scripts/privateModelC80Hi18Contract.json' with { type: 'json' };
import hi19 from '../../src/scripts/privateModelC80Hi19Contract.json' with { type: 'json' };
import hi20 from '../../src/scripts/privateModelC80Hi20Contract.json' with { type: 'json' };

test('Only exact HI14/HI18/HI19 and HI20 SHA allow scene graph rehydration', () => {
  for (const c of [hi14, hi18, hi19])
    expect(c80SourceRehydrationIndices(c.glbSha256)).toEqual([0, 1, 2, 3]);
  expect(c80SourceRehydrationIndices(hi20.glbSha256)).toEqual([0, 1, 2, 3, 20, 23, 24, 25]);
  for (const sha of [hi12.glbSha256, hi13.glbSha256, '', '0'.repeat(64)])
    expect(c80SourceRehydrationIndices(sha)).toBeNull();
});

test('HI14 baseline shared-parent rehydration preserves both scene paths and provenance', () => {
  const shared = new Mesh(new BoxGeometry(1, 2, 3), new MeshBasicMaterial());
  shared.userData = { name: 'shared source', sourceLinks: [{ sceneIndex: 0, nodeIndex: 0 }] };
  const first = new Group(), second = new Group();
  first.add(shared);
  second.add(shared); // GLTFLoader's reparenting removes the child from first.
  const scenes = [new Group(), new Group()];
  scenes[0].add(first);
  scenes[1].add(second);
  const json = {
    nodes: [{ mesh: 0 }, { children: [0] }, { children: [0] }],
    scenes: [{ nodes: [1] }, { nodes: [2] }],
  };
  const paths = new Map([
    [0, new Map([[1, [1]], [0, [1, 0]]])],
    [1, new Map([[2, [2]], [0, [2, 0]]])],
  ]);
  const cached: Map<number, Object3D> = new Map([[0, shared], [1, first], [2, second]]);
  expect(first.children).toHaveLength(0);
  const result = rehydrateHI20SourceScenes({ scenes }, json, paths, cached, [0, 1]);
  const a = result.get(0)!.get(0)! as Mesh;
  const b = result.get(1)!.get(0)! as Mesh;
  expect(a).not.toBe(b);
  expect(a.parent).toBe(result.get(0)!.get(1));
  expect(b.parent).toBe(result.get(1)!.get(2));
  expect(a.geometry).toBe(shared.geometry);
  expect(b.material).toBe(shared.material);
  expect(a.userData).toEqual(shared.userData);
  expect(b.userData).toEqual(shared.userData);
});
