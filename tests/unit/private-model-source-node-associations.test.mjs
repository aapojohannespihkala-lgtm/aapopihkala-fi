import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceNodeAssociations, createSourceNodeView,
} from '../../src/scripts/privateModelSourceNodeAssociations.mjs';
import { createHi20C045Presentation, C045_SOURCE_SHA } from '../../src/scripts/privateModelHi20C045Presentation.mjs';

const obj = (name, extra = {}) => ({ name, children: [], parent: null, ...extra });
const add = (parent, child) => { parent.children.push(child); child.parent = parent; return child; };

// Mirrors GLTFLoader output: node objects carry their own mesh/primitive
// objects first and JSON children last; duplicate names get _N suffixes.
function loaderLikeModel() {
  const json = {
    scenes: [{ nodes: [0, 2] }, { nodes: [3] }],
    nodes: [
      { name: 'Root A', children: [1] },
      { name: 'leaf.one' },
      { name: 'Multi', mesh: 0, children: [4] },
      { name: 'Root A' },
      { name: 'tail' },
    ],
  };
  const s0 = obj(''), s1 = obj('');
  const a = add(s0, obj('Root_A'));
  const leaf = add(a, obj('leafone'));
  const multi = add(s0, obj('Multi'));
  add(multi, obj('Multi_prim0', { isMesh: true }));
  add(multi, obj('Multi_prim1', { isMesh: true }));
  const tail = add(multi, obj('tail'));
  const a2 = add(s1, obj('Root_A_1'));
  const material = { isMaterial: true };
  return {
    gltf: { scene: s0, scenes: [s0, s1], parser: { json, associations: new Map([[material, { materials: 0 }]]) } },
    objects: { a, leaf, multi, tail, a2 },
  };
}

test('rebuilds node indices across scenes, groups and duplicate names', () => {
  const { gltf, objects } = loaderLikeModel();
  const map = buildSourceNodeAssociations(gltf);
  assert.equal(map.get(objects.a)?.nodes, 0);
  assert.equal(map.get(objects.leaf)?.nodes, 1);
  assert.equal(map.get(objects.multi)?.nodes, 2);
  assert.equal(map.get(objects.tail)?.nodes, 4);
  assert.equal(map.get(objects.a2)?.nodes, 3);
  assert.equal(map.size, 5);
});

test('fails closed on name or structure mismatch, only for that subtree', () => {
  const { gltf, objects } = loaderLikeModel();
  objects.multi.name = 'Other';
  const map = buildSourceNodeAssociations(gltf);
  assert.equal(map.has(objects.multi), false);
  assert.equal(map.has(objects.tail), false);
  assert.equal(map.get(objects.a)?.nodes, 0);
  gltf.scenes[1].children.push(obj('extra'));
  assert.equal(buildSourceNodeAssociations(gltf).has(objects.a2), false);
});

test('view keeps loader entries and never mutates the loader map', () => {
  const { gltf, objects } = loaderLikeModel();
  gltf.parser.associations.set(objects.leaf, { nodes: 99, meshes: 7 });
  const original = new Map(gltf.parser.associations);
  const view = createSourceNodeView(gltf, buildSourceNodeAssociations(gltf));
  assert.deepEqual([...gltf.parser.associations], [...original]);
  assert.equal(view.parser.json, gltf.parser.json);
  assert.equal(view.scenes, gltf.scenes);
  assert.equal(view.parser.associations.get(objects.a)?.nodes, 0);
  // Disagreement drops the node index instead of guessing.
  assert.equal(view.parser.associations.get(objects.leaf)?.nodes, undefined);
  assert.equal(view.parser.associations.get(objects.leaf)?.meshes, 7);
  assert.equal(createSourceNodeView(gltf, new Map()), gltf);
});

// Production 01.11.2026: the exact HI20 52scene GLB parsed by three r185
// left 0 node associations, so C045 and every sibling gate stayed closed.
test('C045 gate opens on the exact 52scene layout only through the node view', () => {
  const scenes = Array.from({ length: 52 }, () => obj(''));
  const json = { scenes: Array.from({ length: 52 }, () => ({ nodes: [] })), nodes: Array.from({ length: 6461 }, () => ({})) };
  const defs = [
    [50, 6380, 1843, 'C80-028_WEST_X0_TERRACE_SIDE_WALL_1F_WORK_TEST_OPTIN__D1F_C048_COW_WHITE', 3.635],
    [50, 6457, 1858, 'HI20_C045_CLIPPED_OWNER_WHITE_C048_1F_OPTIN', 1.709],
    [51, 6395, 1843, 'C80-028_WEST_X0_TERRACE_SIDE_WALL_BOTH_WORK_TEST_OPTIN__D1F_C048_COW_WHITE', 3.635],
    [51, 6460, 1858, 'HI20_C045_CLIPPED_OWNER_WHITE_C048_BOTH_OPTIN', 1.709],
  ];
  const walls = new Map();
  for (const [scene, id, mesh, name, length] of defs) {
    json.nodes[id] = { name, mesh };
    json.scenes[scene].nodes.push(id);
    walls.set(id, add(scenes[scene], obj(name, {
      isMesh: true, visible: true,
      geometry: { boundingBox: { min: { z: 0 }, max: { z: length } }, computeBoundingBox() {} },
    })));
  }
  const gltf = { scene: scenes[51], scenes, parser: { json, associations: new Map() } };
  assert.equal(createHi20C045Presentation(gltf, C045_SOURCE_SHA).available, false);
  const view = createSourceNodeView(gltf, buildSourceNodeAssociations(gltf));
  const api = createHi20C045Presentation(view, C045_SOURCE_SHA);
  assert.equal(api.available, true);
  api.setCorrected(true);
  assert.equal(walls.get(6380).visible, false);
  assert.equal(walls.get(6395).visible, false);
  assert.equal(walls.get(6457).visible, true);
  assert.equal(walls.get(6460).visible, true);
  api.dispose();
  assert.equal(walls.get(6380).visible, true);
});

test('loader name and scene-root rendering helpers', async () => {
  const { sameSourceName, isSourceSceneRoot } = await import('../../src/scripts/privateModelSourceNodeAssociations.mjs');
  assert.equal(sameSourceName('KPH07_GUIDE', 'KPH07_GUIDE'), true);
  assert.equal(sameSourceName('KPH07_GUIDE_1', 'KPH07_GUIDE'), true);
  assert.equal(sameSourceName('Room_A', 'Room A'), true);
  assert.equal(sameSourceName('KPH07_GUIDE_X', 'KPH07_GUIDE'), false);
  assert.equal(sameSourceName('KPH07_GUIDE_1', 'KPH07_GUIDE_2'), false);
  assert.equal(sameSourceName('OTHER', 'KPH07_GUIDE'), false);
  assert.equal(isSourceSceneRoot({ isGroup: true, parent: { isGroup: true } }), true);
  assert.equal(isSourceSceneRoot({ isScene: true }), true);
  assert.equal(isSourceSceneRoot({ isMesh: true }), false);
});
