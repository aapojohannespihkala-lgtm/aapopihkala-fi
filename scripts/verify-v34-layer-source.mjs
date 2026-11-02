#!/usr/bin/env node
/**
 * Exact V34 Layers structural preflight. Usage:
 * node scripts/verify-v34-layer-source.mjs /path/to/V34.glb
 * This does not establish authenticated WebGL or HUMAN_REVIEW.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { V33_SOURCE_SHA256 } from '../src/scripts/privateModelC80R2V33LayerSourceProfile.mjs';
import {
  V34_SOURCE_SHA256, V34_SOURCE_SCENE_COUNT,
  V34_BUILDING_PARTS, V34_BUILDING_SCENES, V34_TECHNICAL_SCENES,
} from '../src/scripts/privateModelC80R2V34LayerSourceProfile.mjs';

const path = process.argv[2];
if (process.argv.length !== 3 || !path) {
  console.error('Usage: node scripts/verify-v34-layer-source.mjs <exact V34.glb>');
  process.exit(2);
}
const buffer = readFileSync(path);
assert.equal(createHash('sha256').update(buffer).digest('hex'), V34_SOURCE_SHA256,
  'Fail closed: wrong raw V34 GLB bytes');
assert.notEqual(V34_SOURCE_SHA256, V33_SOURCE_SHA256);
assert.equal(buffer.toString('ascii', 0, 4), 'glTF');
assert.equal(buffer.readUInt32LE(4), 2);
assert.equal(buffer.readUInt32LE(8), buffer.length);
assert.equal(buffer.toString('ascii', 16, 20), 'JSON');
const n = buffer.readUInt32LE(12);
assert.ok(n > 0 && n + 20 <= buffer.length);
const json = JSON.parse(buffer.subarray(20, 20 + n).toString('utf8'));
assert.equal(json.scenes?.length, V34_SOURCE_SCENE_COUNT);
assert.deepEqual(V34_TECHNICAL_SCENES, { '1F': 194, '2F': 195, BOTH: 196 });
assert.deepEqual(Object.keys(V34_BUILDING_SCENES).map(Number).sort((a,b)=>a-b), [194,195,196]);

const floors = { 194: '1F', 195: '2F', 196: 'BOTH' };
let checked = 0;
for (const [id, profile] of Object.entries(V34_BUILDING_SCENES)) {
  const scene = json.scenes[Number(id)];
  assert.equal(profile.floor, floors[id]);
  assert.equal(scene?.name, profile.name);
  assert.ok(Array.isArray(scene?.nodes));
  for (const [leaf, routes] of Object.entries(profile.paths)) {
    const part = V34_BUILDING_PARTS[leaf], node = json.nodes[Number(leaf)];
    assert.ok(part && node, 'missing classified leaf ' + leaf);
    assert.equal(node.name, part.name, 'node name ' + leaf);
    assert.equal(node.mesh, part.mesh, 'node mesh ' + leaf);
    assert.ok(Array.isArray(routes) && routes.length);
    for (const route of routes) {
      assert.ok(route.length && route.at(-1) === Number(leaf));
      assert.ok(scene.nodes.includes(route[0]), 'scene root ' + id + '/' + leaf);
      for (let i=1;i<route.length;i++)
        assert.ok(json.nodes[route[i-1]]?.children?.includes(route[i]),
          'parent path ' + id + '/' + leaf + '/' + i);
      checked++;
    }
  }
}
assert.equal(checked, 111, 'V34 exact classified source paths');
const kvik = {
  195: { root: [9293,9292,8309], leaves: [8049,8051,8053,8055,8057,8059,8061,8063,8065] },
  196: { root: [9328,9327,8421], leaves: [8109,8111,8113,8115,8117,8119,8121,8123,8125] },
};
for (const [scene, { root, leaves }] of Object.entries(kvik)) for (const node of leaves) {
  assert.equal(V34_BUILDING_PARTS[node]?.id, 'architecture-fixtures');
  assert.match(V34_BUILDING_PARTS[node]?.name ?? '', /^KVIK_SINK_OWNER20261101_.*_FRONT3x3_/);
  assert.deepEqual(V34_BUILDING_SCENES[scene].paths[node], [[...root,node]]);
}
for (const scene of [194,195,196]) {
  const paths = V34_BUILDING_SCENES[scene].paths;
  for (const node of [8855,8856,9256,9273,9276,9288,9323])
    assert.ok(!Object.hasOwn(paths,node), 'retired/ambiguous/reference unclassified ' + scene + '/' + node);
}
const added = {
  9271: { id:'roof', scenes:[196] },
  9272: { id:'architecture-walls-exterior', scenes:[194,196] },
  9274: { id:'architecture-floors', scenes:[194,196] },
  9275: { id:'architecture-floors', scenes:[195,196] },
  9277: { id:'architecture-walls-exterior', scenes:[194,196] },
};
for (const [node, { id, scenes }] of Object.entries(added)) {
  assert.equal(V34_BUILDING_PARTS[node]?.id, id);
  for (const scene of [194,195,196])
    assert.equal(Object.hasOwn(V34_BUILDING_SCENES[scene].paths,node), scenes.includes(scene));
}
console.log('V34 source PASS: exact raw GLB SHA, 197 scenes, 111 source paths, 18 Kvik fronts, 5 V34 parts, WORK_TEST only.');
