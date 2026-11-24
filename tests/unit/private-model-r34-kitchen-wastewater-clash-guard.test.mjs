import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { R34_KITCHEN_WASTEWATER_SOURCE, r34KitchenWastewaterClashSelectionEntries } from
  '../../src/scripts/privateModelR34KitchenWastewaterClashGuard.mjs';

const fixture = JSON.parse(readFileSync(
  new URL('../fixtures/private-model-r34-scene-roots.json', import.meta.url), 'utf8'));
const activeIds = [13310, 13314, 13315, 13316, 13317];
const meshIds = [3709, 4429, 4430, 4431, 4432];

function sourceFixture(sceneIndex = 822, selectedId = 13314) {
  const nodes = Array.from({ length: fixture.counts.nodes }, () => ({}));
  const scenes = new Array(fixture.counts.scenes);
  for (const [i, scene] of Object.entries(fixture.scenes)) {
    scenes[Number(i)] = { name: scene.name, nodes: [...scene.nodes] };
  }
  const p2015 = sceneIndex <= 823 ? 13358 : 13535;
  nodes[p2015] = { name: 'ORIGINAL_2015_WASTE_PARENT_' + p2015, children: [13310] };
  nodes[13319] = { name: 'ORIGINAL_2026_WASTE_PARENT_13319', children: [13314, 13315, 13316, 13317] };
  for (let i = 0; i < activeIds.length; i++) {
    nodes[activeIds[i]] = { name: 'ORIGINAL_WASTE_NODE_' + activeIds[i], mesh: meshIds[i] };
  }
  const json = {
    scene: 292, scenes, nodes, meshes: new Array(fixture.counts.meshes),
    asset: { extras: { ModelStage: 'WORK_TEST', current: false, asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } },
  };
  const scene = { name: scenes[sceneIndex].name };
  const parentId = selectedId === 13310 ? p2015 : 13319;
  const parent = { name: nodes[parentId].name, parent: scene };
  const selected = { name: nodes[selectedId].name, parent };
  const associations = new Map([[parent, { nodes: parentId }], [selected, { nodes: selectedId }]]);
  const sourceModel = { scenes: Object.assign([], { [sceneIndex]: scene }), parser: { json, associations } };
  return { sourceModel, json, scene, parent, parentId, selected, associations };
}

const show = f => r34KitchenWastewaterClashSelectionEntries(
  f.sourceModel, R34_KITCHEN_WASTEWATER_SOURCE.glbSha256,
  Number(f.scene.name.match(/__scene(\d+)$/)?.[1]), f.selected);

test('R34 original source identity and four scene root fingerprints are pinned', () => {
  const s = R34_KITCHEN_WASTEWATER_SOURCE;
  assert.equal(s.glbSha256, '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725');
  assert.equal(s.nodeCount, 13854);
  assert.equal(s.sceneCount, 826);
  assert.equal(s.meshCount, 5242);
  assert.deepEqual(s.views.map(x => x.sceneIndex), [822, 823, 824, 825]);
  assert.equal(fixture.defaultScene, 292);
  assert.deepEqual(fixture.counts, { scenes: 826, nodes: 13854, meshes: 5242,
    materials: 826, accessors: 11449, bufferViews: 11455 });
});

test('original 2015/2026 kitchen warning survives R33 to R34 scene inheritance', () => {
  for (const sceneIndex of [822, 823, 824, 825]) {
    for (const id of activeIds) {
      const f = sourceFixture(sceneIndex, id);
      assert.equal(f.parentId, id === 13310 ? (sceneIndex <= 823 ? 13358 : 13535) : 13319);
      const entries = show(f);
      assert.equal(entries.length, 2, 'R34 original ' + sceneIndex + ', selected ' + id);
      assert.match(entries[0][1], /R34-lähdemallissa/);
      assert.match(entries[1][1], /EI todista.*WORK_TEST\/HOST_HOLD/);
    }
  }
});

test('R34 guard fails closed for wrong SHA, scene, root ordering, stage or node count', () => {
  const f = sourceFixture(824);
  const s = R34_KITCHEN_WASTEWATER_SOURCE.glbSha256;
  assert.equal(show(f).length, 2);
  assert.deepEqual(r34KitchenWastewaterClashSelectionEntries(f.sourceModel, '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c', 824, f.selected), []);
  assert.deepEqual(r34KitchenWastewaterClashSelectionEntries(f.sourceModel, s, 822, f.selected), []);
  const roots = f.json.scenes[824].nodes;
  [roots[0], roots[1]] = [roots[1], roots[0]];
  assert.deepEqual(show(f), [], 'root FNV changed');
  [roots[0], roots[1]] = [roots[1], roots[0]];
  f.json.asset.extras.current = true;
  assert.deepEqual(show(f), []);
  f.json.asset.extras.current = false;
  f.json.nodes.pop();
  assert.deepEqual(show(f), []);
});

test('inactive scene nodes, stale selection and conflicting association are never attributed', () => {
  const f = sourceFixture(822);
  assert.equal(show(f).length, 2);
  f.json.nodes[13314].mesh = 4430;
  assert.deepEqual(show(f), [], 'wrong 2026 mesh');
  f.json.nodes[13314].mesh = 4429;
  f.json.nodes[f.parentId].children = [];
  assert.deepEqual(show(f), [], 'missing direct active parent');
  f.json.nodes[f.parentId].children = [13314, 13315, 13316, 13317];
  f.json.nodes[13319].children = [13314, 13315, 13316];
  assert.deepEqual(show(f), []);
  f.json.nodes[13319].children.push(13317);
  f.selected.name = 'UNRELATED_ROOM_MESH';
  assert.deepEqual(show(f), []);
  f.selected.name = f.json.nodes[13314].name;
  f.associations.set(f.selected, { nodes: 9999 });
  assert.deepEqual(show(f), []);
  f.associations.set(f.selected, { nodes: 13314 });
  assert.equal(show(f).length, 2);
});

test('unbound GLTFLoader fallback keeps parent, mesh geometry and uniqueness safeguards in R34', () => {
  const f = sourceFixture(825, 13314);
  const xyz = [[0, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5]];
  const attr = { itemSize: 3, count: 3,
    getX: i => xyz[i][0], getY: i => xyz[i][1], getZ: i => xyz[i][2] };
  f.json.meshes[4429] = { primitives: [{ attributes: { POSITION: 0 } }] };
  f.json.accessors = [{ componentType: 5126, type: 'VEC3', count: 3,
    min: [0, 0, 0], max: [1, 1, 1] }];
  f.selected.isMesh = true;
  f.selected.geometry = { getAttribute: name => name === 'position' ? attr : null };
  f.scene.traverse = visit => visit(f.selected);
  f.associations.delete(f.selected);
  assert.equal(show(f).length, 2);
  xyz[1][0] = 2;
  assert.deepEqual(show(f), [], 'original-source bounds must match');
  xyz[1][0] = 1;
  f.associations.set(f.selected, { nodes: 9999 });
  assert.deepEqual(show(f), [], 'contradictory parser binding must not fall back');
  f.associations.delete(f.selected);
  f.scene.traverse = visit => { visit(f.selected); visit({ ...f.selected }); };
  assert.deepEqual(show(f), [], 'two indistinguishable mesh clones');
});

test('viewer calls R34 guard in the existing source-card selection, not geometry', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{ r34KitchenWastewaterClashSelectionEntries \} from/);
  assert.match(page, /r34KitchenWastewaterClashSelectionEntries\(/);
  assert.match(page, /r32hKitchenWastewaterClashSelectionEntries\(/);
  assert.doesNotMatch(page, /nodes\[13310\]\.mesh\s*=/);
});
