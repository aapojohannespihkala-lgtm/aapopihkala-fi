#!/usr/bin/env node
/**
 * V33 WORK_TEST Layers source preflight against the exact immutable GLB.
 * Usage: node scripts/verify-v33-layer-source.mjs /path/to/V33.glb
 * Not a browser WebGL, publishing, CURRENT or HUMAN_REVIEW check.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  V33_SOURCE_SHA256, V33_SOURCE_SCENE_COUNT, V33_BUILDING_PARTS,
  V33_BUILDING_SCENES, V33_TECHNICAL_SCENES,
} from '../src/scripts/privateModelC80R2V33LayerSourceProfile.mjs';
import { V29_SOURCE_SHA256 } from '../src/scripts/privateModelC80R2V29LayerSourceProfile.mjs';

const input = process.argv[2];
if (!input || process.argv.length !== 3) {
  console.error('Usage: node scripts/verify-v33-layer-source.mjs <exact V33.glb>');
  process.exit(2);
}
const buffer = readFileSync(input);
assert.equal(createHash('sha256').update(buffer).digest('hex'), V33_SOURCE_SHA256,
  'Fail closed: expected exact V33 GLB SHA, not a ZIP, V29 or successor');
assert.notEqual(V33_SOURCE_SHA256, V29_SOURCE_SHA256, 'version SHA separation');
assert.equal(buffer.toString('ascii', 0, 4), 'glTF', 'GLB magic');
assert.equal(buffer.readUInt32LE(4), 2, 'glTF 2 binary');
assert.equal(buffer.readUInt32LE(8), buffer.length, 'GLB declared length');
assert.equal(buffer.toString('ascii', 16, 20), 'JSON', 'GLB JSON chunk');
const jsonLength = buffer.readUInt32LE(12);
assert.ok(jsonLength > 0 && 20 + jsonLength <= buffer.length, 'GLB JSON bounds');
const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
assert.equal(json.scenes?.length, V33_SOURCE_SCENE_COUNT, 'exact scene count');
assert.deepEqual(V33_TECHNICAL_SCENES, { '1F': 191, '2F': 192, BOTH: 193 },
  'technical 1F/2F/BOTH mapping');
assert.deepEqual(Object.keys(V33_BUILDING_SCENES).map(Number).sort((a,b)=>a-b),
  [191, 192, 193], 'building scenes are exact V33 presentation scenes');

const expected = { 191: '1F', 192: '2F', 193: 'BOTH' };
let pathsChecked = 0;
let classifiedLeaves = 0;
for (const [key, profile] of Object.entries(V33_BUILDING_SCENES)) {
  const index = Number(key);
  const scene = json.scenes[index];
  assert.equal(profile.floor, expected[index], 'floor label '+index);
  assert.equal(scene?.name, profile.name, 'scene '+index+' exact name');
  assert.ok(Array.isArray(scene.nodes), 'scene '+index+' roots');
  for (const [leafKey, paths] of Object.entries(profile.paths)) {
    const leaf = Number(leafKey);
    const part = V33_BUILDING_PARTS[leafKey];
    assert.ok(part && Number.isInteger(part.mesh) && typeof part.name === 'string',
      'classified part '+leafKey);
    assert.equal(json.nodes[leaf]?.mesh, part.mesh, 'mesh '+leafKey);
    assert.equal(json.nodes[leaf]?.name, part.name, 'name '+leafKey);
    assert.ok(Array.isArray(paths) && paths.length > 0, 'paths '+leafKey);
    classifiedLeaves++;
    for (const path of paths) {
      assert.ok(Array.isArray(path) && path.length > 0, 'nonempty route '+leafKey);
      assert.equal(path.at(-1), leaf, 'route leaf '+leafKey);
      assert.ok(scene.nodes.includes(path[0]), 'scene '+index+' root '+path[0]);
      for (let j=1;j<path.length;j++) {
        assert.ok(json.nodes[path[j-1]]?.children?.includes(path[j]),
          'parent route '+path[j-1]+' -> '+path[j]+' scene '+index);
      }
      pathsChecked++;
    }
  }
}

/**
 * PR1753 Kvik sink fronts: exact V33 2F/BOTH source routes, not the
 * interleaved GRIP_SHADOW_PROXY nodes. The inherited V29 classifications
 * must exist, not just the V33 path allowlist.
 */
const kvikFronts = {
  192: { roots: [9243, 9242, 8309], leaves: [8049, 8051, 8053, 8055, 8057, 8059, 8061, 8063, 8065] },
  193: { roots: [9253, 9246, 8421], leaves: [8109, 8111, 8113, 8115, 8117, 8119, 8121, 8123, 8125] },
};
let kvikChecked = 0;
for (const [sceneId, { roots, leaves }] of Object.entries(kvikFronts)) {
  for (const leaf of leaves) {
    const part = V33_BUILDING_PARTS[leaf];
    assert.equal(part?.id, 'architecture-fixtures', 'Kvik category ' + leaf);
    assert.match(part?.name ?? '', /^KVIK_SINK_OWNER20261101_.*_FRONT3x3_/,
      'Kvik front exact identity ' + leaf);
    assert.deepEqual(V33_BUILDING_SCENES[sceneId].paths[leaf], [[...roots, leaf]],
      'Kvik exact scene/parent route ' + sceneId + '/' + leaf);
    kvikChecked++;
  }
}
assert.equal(kvikChecked, 18, '9+9 Kvik fronts classified and bound');
for (const sceneId of [192, 193]) {
  const leaves = Object.keys(V33_BUILDING_SCENES[sceneId].paths).map(Number);
  assert.ok(!leaves.some(n => n >= (sceneId === 192 ? 8050 : 8110) &&
    n <= (sceneId === 192 ? 8066 : 8126) && n % 2 === 0),
    'GRIP_SHADOW_PROXY must not be classified as front');
}

const newParts = {
  9256: { id: 'architecture-floors', scenes: [191, 193] },
  9257: { id: 'architecture-floors', scenes: [192, 193] },
  9258: { id: 'architecture-fixtures', scenes: [192, 193] },
  9259: { id: 'roof', scenes: [191, 192, 193] },
};
for (const [key, { id, scenes }] of Object.entries(newParts)) {
  assert.equal(V33_BUILDING_PARTS[key]?.id, id, 'V33 layer classification '+key);
  for (const sceneId of [191, 192, 193]) {
    assert.equal(Object.hasOwn(V33_BUILDING_SCENES[sceneId].paths, key),
      scenes.includes(sceneId), 'V33 scene-specific membership '+key+' in '+sceneId);
  }
}
console.log(`V33 source PASS: exact SHA, ${json.scenes.length} scenes, ` +
  `${classifiedLeaves} classified scene-nodes / ${pathsChecked} root-to-leaf paths, ` +
  '4 V33 additions, three technical scenes. WORK_TEST only.');
