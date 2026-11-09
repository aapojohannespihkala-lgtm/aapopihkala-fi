#!/usr/bin/env node
/**
 * Source-only V35 Layers preflight. No authenticated browser or human review.
 * Usage: node scripts/verify-v35-layer-source.mjs <V35.glb> [V34.glb]
 * The optional exact V34 input additionally proves all retained source arrays
 * and the complete BIN prefix, rather than inferring parity from version names.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  V34_SOURCE_SHA256, V34_BUILDING_PARTS, V34_BUILDING_SCENES,
} from '../src/scripts/privateModelC80R2V34LayerSourceProfile.mjs';
import {
  V35_SOURCE_SHA256, V35_SOURCE_SCENE_COUNT, V35_SOURCE_ROLE,
  V35_BUILDING_PARTS, V35_BUILDING_SCENES, V35_TECHNICAL_SCENES,
} from '../src/scripts/privateModelC80R2V35LayerSourceProfile.mjs';

const [sourcePath, parentPath] = process.argv.slice(2);
if (!sourcePath || process.argv.length > 4) {
  console.error('Usage: node scripts/verify-v35-layer-source.mjs <V35.glb> [V34.glb]');
  process.exit(2);
}

const readGlb = (path, expectedSha, expectedSize) => {
  const buffer = readFileSync(path);
  assert.equal(createHash('sha256').update(buffer).digest('hex'), expectedSha,
    'Fail closed: wrong exact source GLB bytes');
  assert.equal(buffer.length, expectedSize, 'Exact source byte length');
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF');
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  assert.equal(buffer.toString('ascii', 16, 20), 'JSON');
  const length = buffer.readUInt32LE(12);
  assert.ok(length > 0 && length + 28 <= buffer.length);
  const binHeader = length + 20;
  const binLength = buffer.readUInt32LE(binHeader);
  assert.equal(buffer.readUInt32LE(binHeader + 4), 0x004e4942, 'BIN chunk');
  assert.equal(binHeader + 8 + binLength, buffer.length);
  return {
    json: JSON.parse(buffer.subarray(20, length + 20).toString('utf8')),
    bin: buffer.subarray(binHeader + 8),
  };
};

const { json, bin } = readGlb(sourcePath, V35_SOURCE_SHA256, 30_023_592);
assert.equal(json.scenes.length, V35_SOURCE_SCENE_COUNT);
assert.equal(json.nodes.length, 9334);
assert.equal(json.meshes.length, 3284);
assert.equal(json.asset.extras.current, false);
assert.equal(json.asset.extras.asBuilt, false);
assert.equal(V35_SOURCE_ROLE, 'SOURCE_WORK_TEST');
assert.deepEqual(V35_TECHNICAL_SCENES, { '1F': 194, '2F': 197, BOTH: 198 });
assert.deepEqual(json.asset.extras.viewerFloorScenes, V35_TECHNICAL_SCENES);
assert.deepEqual(Object.keys(V35_BUILDING_SCENES).map(Number).sort((a, b) => a - b),
  [194, 197, 198], 'Old V34 2F195/BOTH196 must not be activated for V35');

const reachable = sceneIndex => {
  const seen = new Set();
  const visit = (nodeIndex, parents) => {
    assert.ok(Number.isInteger(nodeIndex) && json.nodes[nodeIndex]);
    assert.ok(!parents.has(nodeIndex), 'Cycle in active source scene');
    if (seen.has(nodeIndex)) return;
    seen.add(nodeIndex);
    const next = new Set(parents).add(nodeIndex);
    for (const child of json.nodes[nodeIndex].children ?? []) visit(child, next);
  };
  for (const node of json.scenes[sceneIndex].nodes) visit(node, new Set());
  return seen;
};

let checked = 0;
let cabinetFronts = 0;
const counts = {};
for (const [newSceneIndex, oldSceneIndex] of [[194, 194], [197, 195], [198, 196]]) {
  const profile = V35_BUILDING_SCENES[newSceneIndex];
  const oldProfile = V34_BUILDING_SCENES[oldSceneIndex];
  const scene = json.scenes[newSceneIndex];
  assert.equal(profile.floor, oldProfile.floor);
  assert.equal(profile.name, scene.name);
  const expectedIds = Object.keys(oldProfile.paths).filter(id => id !== '9275').sort();
  assert.deepEqual(Object.keys(profile.paths).sort(), expectedIds,
    'Only the rechecked retained V34 node vocabulary is admitted');
  let sceneCount = 0;
  for (const [id, paths] of Object.entries(profile.paths)) {
    const part = V35_BUILDING_PARTS[id];
    const node = json.nodes[id];
    assert.deepEqual(part, V34_BUILDING_PARTS[id], 'Retained source identity ' + id);
    assert.equal(node.name, part.name, 'Exact source node name ' + id);
    assert.equal(node.mesh, part.mesh, 'Exact source mesh ' + id);
    assert.deepEqual(paths, oldProfile.paths[id], 'Retained parent route ' + id);
    for (const path of paths) {
      assert.equal(path.at(-1), Number(id));
      assert.ok(scene.nodes.includes(path[0]), 'Original source root ' + newSceneIndex + '/' + id);
      for (let i = 1; i < path.length; i++) {
        assert.ok(json.nodes[path[i - 1]]?.children?.includes(path[i]),
          'Exact source parent ' + newSceneIndex + '/' + id + '/' + i);
      }
      checked++;
      sceneCount++;
      if (/^KVIK_SINK_OWNER20261101_.*_FRONT3x3_|^HOB28_COW3_SC129_CAB[1-4]_/.test(part.name)) {
        assert.equal(part.id, 'architecture-fixtures');
        cabinetFronts++;
      }
    }
  }
  counts[newSceneIndex] = sceneCount;
  const active = reachable(newSceneIndex);
  assert.ok(!active.has(9275), 'Retired WC floor9275 is not active in V35');
  assert.equal(active.has(9331), newSceneIndex !== 194,
    'The mixed replacement is present only in 2F/BOTH source scenes');
  for (const excluded of [9275, 9331, 9332, 9333]) {
    assert.ok(!Object.hasOwn(profile.paths, excluded),
      'No binding for retired/mixed/empty source node ' + excluded);
  }
}
assert.equal(checked, 133);
assert.deepEqual(counts, { 194: 17, 197: 51, 198: 65 });
assert.equal(cabinetFronts, 42, '18 sink + 24 tall-cabinet SOURCE_WORK_TEST front paths');
assert.ok(!Object.hasOwn(V35_BUILDING_PARTS, 9275));
assert.ok(!Object.hasOwn(V35_BUILDING_PARTS, 9331));

// This is a source-declared mixed role, not a floor inferred from its colour.
const mixed = json.nodes[9331];
assert.equal(mixed.name,
  'C80R2_V35_D2F_WC_RAISED_FLOOR_80MM_AND_EAST_WALL_YELLOW_TILES_154_PHOTO');
assert.equal(mixed.mesh, 3283);
assert.equal(json.meshes[3283].primitives.length, 8);
assert.equal(mixed.extras.current, false);
assert.equal(mixed.extras.asBuilt, false);
assert.match(mixed.extras.replaces, /V34 9275/);
for (const placeholder of [9332, 9333]) {
  assert.equal(json.nodes[placeholder].mesh, undefined);
  assert.equal(json.nodes[placeholder].children, undefined);
}

if (parentPath) {
  const parent = readGlb(parentPath, V34_SOURCE_SHA256, 29_813_768);
  for (const key of ['scenes', 'nodes', 'meshes', 'materials', 'accessors', 'bufferViews']) {
    assert.deepEqual(json[key].slice(0, parent.json[key].length), parent.json[key],
      'Exact retained V34 ' + key + ' prefix');
  }
  assert.deepEqual(bin.subarray(0, parent.bin.length), parent.bin,
    'The entire V34 BIN is byte-identical in the V35 prefix');
}

console.log(JSON.stringify({
  result: 'PASS', sourceSha256: V35_SOURCE_SHA256,
  sourceRole: V35_SOURCE_ROLE, sceneCount: V35_SOURCE_SCENE_COUNT,
  sourcePaths: checked, perScene: counts, cabinetFrontPaths: cabinetFronts,
  mixedNode9331: 'UNCLASSIFIED_FLOOR_AND_WALL',
  exactV34PrefixParity: parentPath ? 'PASS' : 'NOT_RUN',
  authenticatedWebGL: 'NOT_RUN', humanReview: 'NOT_RUN',
}));
