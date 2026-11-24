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
  nodes[rootId] = { name: 'TEST_SCENE_ROOT', children: [...ids] };
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


/**
 * Original R32H GLB source-exact scene/root/mesh/position metadata, independently
 * read from G2b Drive1UM0piM, source SHA c26d99c1. This is a SYNTHETIC test
 * geometry with authentic index/name/accessor bounds, not a 64 MB GLB load.
 */
const originalR32HSourceNodes = Object.freeze({
  13310: { mesh: 3709, count: 256,
    name: 'M5_VV2015_D2F_KITCHEN_V75_ALAS_FLOOR_APPROACH_SC312_313_OPEN_HOST_HOLD_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
    min: [6.135791301727295, 2.86299991607666, -1.6525167226791382],
    max: [6.21079158782959, 4.550000190734863, -1.5775166749954224] },
  13314: { mesh: 4429, count: 518,
    name: 'D2F_KITCHEN_2026_PHOTO_WHITE_HORIZONTAL_TO_TRAP_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
    min: [6.0129008293151855, 3.3403701782226562, -1.6571139097213745],
    max: [6.198000907897949, 3.4098072052001953, -1.5815786123275757] },
  13315: { mesh: 4430, count: 1190,
    name: 'D2F_KITCHEN_2026_PHOTO_WHITE_VERTICAL_U_BEND_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
    min: [6.101444721221924, 3.08567476272583, -1.7572184801101685],
    max: [6.220225811004639, 3.365464210510254, -1.5793054103851318] },
  13316: { mesh: 4431, count: 686,
    name: 'D2F_KITCHEN_2026_PHOTO_GREY_ELBOW_TO_EXISTING_V75_STUB_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
    min: [6.085111618041992, 3.186152458190918, -1.7403438091278076],
    max: [6.183865547180176, 3.344787836074829, -1.5863525867462158] },
  13317: { mesh: 4432, count: 518,
    name: 'D2F_KITCHEN_2026_PHOTO_APPLIANCE_GREY_BRANCH_TO_WHITE_TRAP_D2F_KITCHEN_WASTE_CLASSIFY_VIEMARI_COW',
    min: [5.990418910980225, 3.252880573272705, -1.7667778730392456],
    max: [6.202773094177246, 3.3192055225372314, -1.6006189584732056] },
});
const originalR32HSourceParents = Object.freeze({
  13358: 'V93_IV_B_MJ01_REV2_TECH_2F_EXCLUDE_HIST2015_HIGH_WALL_P02_COW_P02_COW_R24_L12_WW_SEMANTIC_COW_ROOT_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW_E220S_ROOF_HOST_WT',
  13535: 'R31_T110_D2F_VESI_DUPLICATE_REMOVED_KEEP_VIEMARI_WT_HOLD',
  13319: 'D2F_KITCHEN_2026_PHOTO_WASTE_VISIBLE_TRAP_U_ELBOW_APPLIANCE_HOSE_ROOT_WORK_TEST_D2F_KITCHEN_WASTE_SEMANTIC_PARENT_COW',
});

function originalR32HClashParentFixture(sceneIndex, selectedId) {
  const source = originalR32HSourceNodes[selectedId];
  const parent2015 = sceneIndex <= 815 ? 13358 : 13535;
  const parentId = selectedId === 13310 ? parent2015 : 13319;
  const nodes = Array.from({ length: fixture.counts.nodes }, () => ({}));
  const scenes = Object.fromEntries(Object.entries(fixture.scenes).map(([i, scene]) =>
    [i, { name: scene.name, nodes: [] }]));
  const meshes = [];
  const accessors = [];
  nodes[parent2015] = { name: originalR32HSourceParents[parent2015], children: [13310] };
  nodes[13319] = { name: originalR32HSourceParents[13319], children: [13314, 13315, 13316, 13317] };
  scenes[sceneIndex].nodes = [parent2015, 13319];
  for (const [accessorId, nodeId] of ids.entries()) {
    const entry = originalR32HSourceNodes[nodeId];
    nodes[nodeId] = { name: entry.name, mesh: entry.mesh };
    meshes[entry.mesh] = { primitives: [{ attributes: { POSITION: accessorId } }] };
    accessors[accessorId] = { componentType: 5126, type: 'VEC3', count: entry.count,
      min: [...entry.min], max: [...entry.max] };
  }
  const json = { scenes, nodes, meshes, accessors };
  const scene = { name: scenes[sceneIndex].name };
  const parent = { name: nodes[parentId].name, parent: scene };
  // Artificial vertices preserve original source accessor extrema and count.
  const attr = { itemSize: 3, count: source.count,
    getX: (i) => i === 0 ? source.min[0] : source.max[0],
    getY: (i) => i === 0 ? source.min[1] : source.max[1],
    getZ: (i) => i === 0 ? source.min[2] : source.max[2] };
  const selected = { isMesh: true, name: source.name, parent,
    geometry: { getAttribute: (key) => key === 'position' ? attr : null } };
  scene.traverse = (visit) => visit(selected);
  const associations = new Map([[parent, { nodes: parentId }]]);
  const sourceModel = { scenes: Object.fromEntries([[sceneIndex, scene]]),
    parser: { json, associations } };
  return { sourceModel, parent, selected, associations, parentId, json };
}

test('original R32H source parents: 2015 n13310 switches 13358 to 13535 between BOTH and 2F', () => {
  assert.equal(sha, 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c');
  for (const { sceneIndex } of Object.values(C80_R32H_VIEWS)) {
    const expected2015 = sceneIndex <= 815 ? 13358 : 13535;
    for (const nodeId of ids) {
      const f = originalR32HClashParentFixture(sceneIndex, nodeId);
      assert.equal(f.parentId, nodeId === 13310 ? expected2015 : 13319);
      assert.equal(f.json.nodes[nodeId].mesh, originalR32HSourceNodes[nodeId].mesh);
      const entries = r32hKitchenWastewaterClashSelectionEntries(
        f.sourceModel, sha, sceneIndex, f.selected);
      assert.equal(entries.length, 2, 'missing source warning for n' + nodeId + ' scene ' + sceneIndex);
      assert.match(entries[0][1], /LÄHDERISTIRIITA/);
      assert.match(entries[1][1], /EI todista.*HOST_HOLD/);
    }
  }
});

test('original R32H parent swap and stale source identity fail closed for all 5 pipes x 4 scenes', () => {
  for (const sceneIndex of [814, 815, 816, 817]) {
    for (const nodeId of ids) {
      const f = originalR32HClashParentFixture(sceneIndex, nodeId);
      assert.equal(r32hKitchenWastewaterClashSelectionEntries(
        f.sourceModel, sha, sceneIndex, f.selected).length, 2);
      const wrongParent = nodeId === 13310 ? (sceneIndex <= 815 ? 13535 : 13358) : 13535;
      f.parent.name = originalR32HSourceParents[wrongParent];
      f.associations.set(f.parent, { nodes: wrongParent });
      assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(
        f.sourceModel, sha, sceneIndex, f.selected), [],
        'cross-scene or cross-system n' + nodeId + ' scene ' + sceneIndex);
      f.parent.name = originalR32HSourceParents[f.parentId];
      f.associations.set(f.parent, { nodes: f.parentId });
      assert.equal(r32hKitchenWastewaterClashSelectionEntries(
        f.sourceModel, sha, sceneIndex, f.selected).length, 2);
      f.json.nodes[nodeId].name += '_STALE';
      assert.deepEqual(r32hKitchenWastewaterClashSelectionEntries(
        f.sourceModel, sha, sceneIndex, f.selected), [],
        'renamed source n' + nodeId + ' scene ' + sceneIndex);
    }
  }
});
