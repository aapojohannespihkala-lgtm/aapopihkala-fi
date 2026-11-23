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
