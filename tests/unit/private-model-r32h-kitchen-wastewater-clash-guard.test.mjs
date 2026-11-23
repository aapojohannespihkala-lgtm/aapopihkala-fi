import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import {
  R32H_KITCHEN_WASTEWATER_CLASH,
  r32hKitchenWastewaterClashSelectionEntries,
} from '../../src/scripts/privateModelR32HKitchenWastewaterClashGuard.mjs';

const fixture = JSON.parse(readFileSync(
  new URL('../fixtures/private-model-r32h-scene-roots.json', import.meta.url), 'utf8'));
const sha = C80_R32H_SOURCE.glbSha256;
const ids = [13310, 13314, 13315, 13316, 13317];

function selectedFixture(sceneIndex = 814, selectedId = 13314) {
  // A synthetic ancestry fixture with source-exact scene names/roots and node IDs.
  // Not evidence that the real GLB has been rendered or its intersection retested.
  const nodes = Array.from({ length: fixture.counts.nodes }, () => ({}));
  const scenes = Object.fromEntries(Object.entries(fixture.scenes).map(([i, scene]) =>
    [i, { name: scene.name, nodes: [...scene.nodes] }]));
  const rootId = scenes[sceneIndex].nodes[0];
  nodes[rootId] = { name: 'TEST_SCENE_ROOT', children: ids };
  for (const id of ids) nodes[id] = { name: `TEST_KITCHEN_WASTEWATER_${id}`, mesh: id === 13310 ? 3709 : id - 9000 };
  const json = { scenes, nodes, asset: { extras: { ModelStage: 'WORK_TEST', current: false, asBuilt: false } } };
  const scene = { name: scenes[sceneIndex].name };
  const parent = { name: nodes[rootId].name, parent: scene };
  const selected = { name: nodes[selectedId].name, parent };
  const associations = new Map([[parent, { nodes: rootId }], [selected, { nodes: selectedId }]]);
  return { sourceModel: { scenes: Object.fromEntries([[sceneIndex, scene]]), parser: { json, associations } },
    json, scene, selected, parent };
}

test('R32H kitchen source guard is permanently non-physical', () => {
  assert.equal(R32H_KITCHEN_WASTEWATER_CLASH.original2015Node, 13310);
  assert.equal(R32H_KITCHEN_WASTEWATER_CLASH.original2015Mesh, 3709);
  assert.deepEqual(R32H_KITCHEN_WASTEWATER_CLASH.conflicting2026Nodes, [13314, 13315, 13316, 13317]);
  assert.equal(R32H_KITCHEN_WASTEWATER_CLASH.physicalConnectionsVerified, false);
  assert.equal(R32H_KITCHEN_WASTEWATER_CLASH.currentClaim, false);
  assert.equal(R32H_KITCHEN_WASTEWATER_CLASH.asBuiltClaim, false);
});

test('R32H source note appears for clash nodes in all original 814-817 scenes', () => {
  for (const { sceneIndex } of Object.values(C80_R32H_VIEWS)) {
    for (const id of ids) {
      const { sourceModel, selected } = selectedFixture(sceneIndex, id);
      const entries = r32hKitchenWastewaterClashSelectionEntries(sourceModel, sha, sceneIndex, selected);
      assert.equal(entries.length, 2, `scene ${sceneIndex}, node ${id}`);
      assert.match(entries[0][1], /n13310.*n13314-13317/);
      assert.match(entries[1][1], /EI todista.*WORK_TEST\/HOST_HOLD/);
    }
  }
});

test('wrong SHA, scene, node mapping, stale selection, source mesh and inactive geometry fail closed', () => {
  const a = selectedFixture(815);
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, 'wrong-sha', 815, a.selected), []);
  for (const sceneIndex of [814, 816, 817, -1]) {
    assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, sceneIndex, a.selected), []);
  }
  a.selected.name = 'STALE_OLD_OBJECT';
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, 815, a.selected), []);
  a.selected.name = a.json.nodes[13314].name;
  a.selected.parent = { name: 'DETACHED' };
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, 815, a.selected), []);
  a.selected.parent = a.parent;
  a.json.nodes[13310].mesh = 999;
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, 815, a.selected), []);
  a.json.nodes[13310].mesh = 3709;
  a.json.nodes[a.json.scenes[815].nodes[0]].children = [13310, 13314, 13315, 13316];
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, 815, a.selected), []);
});

test('unrelated nearby 2F kitchen object is never assigned the clash warning', () => {
  const a = selectedFixture(816);
  const other = { name: 'UNRELATED_KITCHEN', parent: a.parent };
  a.sourceModel.parser.associations.set(other, { nodes: 1234 });
  a.json.nodes[1234] = { name: other.name };
  a.json.nodes[a.json.scenes[816].nodes[0]].children.push(1234);
  assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(a.sourceModel, sha, 816, other), []);
});

test('viewer selection connects guard to mounted R32H scene without mutating GLB', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{ r32hKitchenWastewaterClashSelectionEntries \} from/);
  assert.match(page, /r32hKitchenWastewaterClashSelectionEntries\(/);
  assert.ok(page.includes('modelRoot.children[0] ?? null'));
  assert.ok(page.includes('layersGltf.scenes?.indexOf(kitchenWastewaterMountedScene)'));
  assert.doesNotMatch(page, /nodes\[13310\]\.mesh\s*=/);
});

function unboundLoaderSelection(sceneIndex = 814, selectedId = 13314) {
  const f = selectedFixture(sceneIndex, selectedId);
  const positions = [[0, 0, 0], [1, 1, 1], [0.5, 0.2, 0.1], [0.6, 0.8, 0.7]];
  const attr = { itemSize: 3, count: positions.length,
    getX: (i) => positions[i][0], getY: (i) => positions[i][1],
    getZ: (i) => positions[i][2] };
  const meshIndex = f.json.nodes[selectedId].mesh;
  f.json.meshes = [];
  f.json.meshes[meshIndex] = { primitives: [{ attributes: { POSITION: 0 } }] };
  f.json.accessors = [{ componentType: 5126, type: 'VEC3',
    count: positions.length, min: [0, 0, 0], max: [1, 1, 1] }];
  f.selected.isMesh = true;
  f.selected.geometry = { getAttribute: (key) => key === 'position' ? attr : null };
  f.scene.traverse = (visit) => visit(f.selected);
  f.sourceModel.parser.associations.delete(f.selected);
  return { ...f, positions, attr, meshIndex };
}

test('missing real GLTFLoader mesh association recovers only exact original source node', () => {
  for (const { sceneIndex } of Object.values(C80_R32H_VIEWS)) {
    for (const id of ids) {
      const f = unboundLoaderSelection(sceneIndex, id);
      const entries = r32hKitchenWastewaterClashSelectionEntries(f.sourceModel, sha, sceneIndex, f.selected);
      assert.equal(entries.length, 2, 'scene ' + sceneIndex + ' original node ' + id);
    }
  }
});

test('unbound fallback fails closed for conflicting binding, wrong parent, mesh and geometry', () => {
  const f = unboundLoaderSelection();
  const run = () => r32hKitchenWastewaterClashSelectionEntries(f.sourceModel, sha, 814, f.selected);
  assert.equal(run().length, 2);
  f.sourceModel.parser.associations.set(f.selected, { nodes: 999 });
  assert.deepEqual(run(), [], 'never override an explicit contradictory association');
  f.sourceModel.parser.associations.delete(f.selected);
  f.sourceModel.parser.associations.set(f.selected, { meshes: 999 });
  assert.deepEqual(run(), [], 'never override an explicit contradictory mesh binding');
  f.sourceModel.parser.associations.delete(f.selected);
  f.selected.parent.name = 'UNRELATED_2F_HOST';
  assert.deepEqual(run(), [], 'never infer a source from node name without exact parent');
  f.selected.parent.name = f.json.nodes[f.json.scenes[814].nodes[0]].name;
  f.positions[1][0] += 0.005;
  assert.deepEqual(run(), [], 'vertex bounds mismatch');
  f.positions[1][0] -= 0.005;
  f.json.meshes[f.meshIndex].primitives[0].attributes.POSITION = 999;
  assert.deepEqual(run(), [], 'wrong source accessor');
  f.json.meshes[f.meshIndex].primitives[0].attributes.POSITION = 0;
  const duplicate = { ...f.selected, parent: f.parent };
  f.scene.traverse = (visit) => { visit(f.selected); visit(duplicate); };
  assert.deepEqual(run(), [], 'two indistinguishable loader clones must not be attributed');
  f.scene.traverse = (visit) => visit(f.selected);
  f.sourceModel.parser.associations.set(f.parent, { nodes: 999 });
  assert.deepEqual(run(), [], 'contradictory parent source binding');
  f.sourceModel.parser.associations.set(f.parent, { nodes: f.json.scenes[814].nodes[0] });
  assert.equal(run().length, 2, 'restored source identity remains accepted');
});
