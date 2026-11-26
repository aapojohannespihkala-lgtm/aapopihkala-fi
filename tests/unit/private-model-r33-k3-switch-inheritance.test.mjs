import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-exact roots verified against the original G2b R32H/R33 GLBs
// (R32H c26d99c1..., R33 3a226f98...). Fixtures hold source-derived roots,
// not a substitute for an authenticated production WebGL or physical-host test.
const r32h = JSON.parse(readFileSync(new URL('../fixtures/private-model-r32h-scene-roots.json', import.meta.url), 'utf8'));
const r33 = JSON.parse(readFileSync(new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8'));
const r34 = JSON.parse(readFileSync(new URL('../fixtures/private-model-r34-scene-roots.json', import.meta.url), 'utf8'));

// One semantic switch per source root: 1F SW01-04 Exxact, SW05 double rocker,
// SW06 semantic link. 2F SW01-03 Exxact, SW04 owner-photo root, SW05 hall-face.
const FIRST_FLOOR = Object.freeze([13522, 13519, 13525, 13528, 12134, 13534]);
const SECOND_FLOOR = Object.freeze([13510, 13513, 13516, 13813, 13839]);
const ACTIVE_OLD_MESH_REMAP = 12414; // 1F SW06 source mesh from inactive historical node 7996
const INACTIVE_LEGACY_NODE = 7996;
const NESTED_SOURCE_NODES = Object.freeze([13814, 13531]); // 2F SW04/SW05 leaves, not extra roots

function checkScene(source, sceneNumber, bothFloors) {
  const scene = source?.scenes?.[String(sceneNumber)];
  assert.ok(scene && Array.isArray(scene.nodes), 'missing source scene ' + sceneNumber);
  assert.ok(scene.name.endsWith('__scene' + sceneNumber), 'scene name/index mismatch ' + sceneNumber);
  const roots = scene.nodes;
  assert.equal(new Set(roots).size, roots.length, 'duplicated scene root in ' + sceneNumber);
  const expectedRoots = bothFloors
    ? [...FIRST_FLOOR, ...SECOND_FLOOR, ACTIVE_OLD_MESH_REMAP]
    : [...SECOND_FLOOR];
  const absentRoots = bothFloors
    ? [INACTIVE_LEGACY_NODE, ...NESTED_SOURCE_NODES]
    : [...FIRST_FLOOR, ACTIVE_OLD_MESH_REMAP, INACTIVE_LEGACY_NODE, ...NESTED_SOURCE_NODES];
  for (const node of expectedRoots) {
    assert.equal(roots.filter(root => root === node).length, 1,
      'missing/duplicated K3 root ' + node + ' in source scene ' + sceneNumber);
  }
  for (const node of absentRoots) {
    assert.ok(!roots.includes(node),
      'inactive/extra K3 root ' + node + ' leaked into source scene ' + sceneNumber);
  }
  const semanticCount = [...FIRST_FLOOR, ...SECOND_FLOOR]
    .filter(node => roots.includes(node)).length;
  assert.equal(semanticCount, bothFloors ? 11 : 5,
    'K3 semantic switch count changed in source scene ' + sceneNumber);
  return {
    semanticCount,
    switches: [...FIRST_FLOOR, ...SECOND_FLOOR].map(node => roots.includes(node)),
    remapVisible: roots.includes(ACTIVE_OLD_MESH_REMAP),
  };
}

test('R33 and R32H fixtures have original source stages and exact scene numbers', () => {
  for (const [source, count, meshes, numbers] of [
    [r32h, 818, 5237, [814, 815, 816, 817]],
    [r33, 822, 5237, [818, 819, 820, 821]],
    [r34, 826, 5242, [822, 823, 824, 825]],
  ]) {
    assert.equal(source.counts.scenes, count);
    assert.equal(source.counts.meshes, meshes);
    assert.equal(source.defaultScene, 292);
    assert.equal(source.asset.ModelStage, 'WORK_TEST');
    assert.equal(source.asset.current, false);
    assert.equal(source.asset.asBuilt, false);
    assert.deepEqual(Object.keys(source.scenes).map(Number), numbers);
  }
});

test('R33 K3 1F6+2F5 BOTH and 2F5 only match exact R32H switch visibility', () => {
  const pairs = [[814, 818, true], [815, 819, true], [816, 820, false], [817, 821, false]];
  for (const [before, after, both] of pairs) {
    assert.deepEqual(checkScene(r33, after, both), checkScene(r32h, before, both),
      'R32H to R33 K3 switch inheritance failed ' + before + ' -> ' + after);
  }
});

test('source fixture regression rejects missing and duplicated K3 roots', () => {
  const modified = structuredClone(r33);
  modified.scenes['818'].nodes = modified.scenes['818'].nodes.filter(x => x !== 13839);
  assert.throws(() => checkScene(modified, 818, true), /missing\/duplicated K3 root/);
  modified.scenes['818'].nodes.push(13839, 13839);
  assert.throws(() => checkScene(modified, 818, true), /duplicated scene root/);
});

test('source fixture regression rejects leaked 1F switches or old 1F SW06 identity in 2F', () => {
  const leaked = structuredClone(r33);
  leaked.scenes['820'].nodes.push(13534);
  assert.throws(() => checkScene(leaked, 820, false), /inactive\/extra K3 root/);
  const legacy = structuredClone(r33);
  legacy.scenes['819'].nodes.push(7996);
  assert.throws(() => checkScene(legacy, 819, true), /inactive\/extra K3 root/);
});

test('source fixture regression rejects nested 2F semantic leaves as duplicate scene roots', () => {
  const leaked = structuredClone(r33);
  leaked.scenes['821'].nodes.push(13814);
  assert.throws(() => checkScene(leaked, 821, false), /inactive\/extra K3 root/);
});

// R34 is the published WORK_TEST model. Preserve the source-only switch roots
// through R33 -> R34; these fixtures do not establish rendered WebGL or as-built wiring.
test('R34 inherits all 11 K3 switch roots in BOTH and only 5 in 2F from R33', () => {
  const pairs = [[818, 822, true], [819, 823, true], [820, 824, false], [821, 825, false]];
  for (const [before, after, both] of pairs) {
    assert.deepEqual(checkScene(r34, after, both), checkScene(r33, before, both),
      'R33 to R34 K3 switch inheritance failed ' + before + ' -> ' + after);
  }
});

test('R34 fixture rejects missing switches, floor leaks and stale scene/source nodes', () => {
  const missing = structuredClone(r34);
  missing.scenes['822'].nodes = missing.scenes['822'].nodes.filter(x => x !== 13839);
  assert.throws(() => checkScene(missing, 822, true), /missing\/duplicated K3 root/);
  const floorLeak = structuredClone(r34);
  floorLeak.scenes['824'].nodes.push(13534);
  assert.throws(() => checkScene(floorLeak, 824, false), /inactive\/extra K3 root/);
  const stale = structuredClone(r34);
  stale.scenes['823'].nodes.push(7996);
  assert.throws(() => checkScene(stale, 823, true), /inactive\/extra K3 root/);
  const nested = structuredClone(r34);
  nested.scenes['825'].nodes.push(13814);
  assert.throws(() => checkScene(nested, 825, false), /inactive\/extra K3 root/);
  const wrongScene = structuredClone(r34);
  wrongScene.scenes['822'].name = wrongScene.scenes['824'].name;
  assert.throws(() => checkScene(wrongScene, 822, true), /scene name\/index mismatch/);
});
