import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  C80_WW74_L150_GLB_SHA256,
  C80_WW74_L150_GLB_BYTES,
  C80_WW74_L150_VIEWER_ROLES,
  resolveC80Ww74L150SceneIndex,
  resolveC80Ww74L150Scenes,
  createC80Ww74L150FloorRuntime,
} from '../../src/scripts/privateModelC80Ww74L150FloorRuntime.mjs';

const options = [
  [483, '1F', 'CLOSED', false],
  [476, '2F', 'CLOSED', false],
  [484, 'BOTH', 'CLOSED', false],
  [478, '2F', 'ONE_OPEN', false],
  [485, 'BOTH', 'ONE_OPEN', false],
  [480, '2F', 'STACKED', false],
  [486, 'BOTH', 'STACKED', false],
  [487, 'BOTH', 'CLOSED', true],
];

test('488-scene WW74 L150 roles: 1F + BOTH new scenes, 2F inherited', () => {
  assert.deepEqual(Object.keys(C80_WW74_L150_VIEWER_ROLES).map(Number).sort((a, b) => a - b),
    [476, 478, 480, 483, 484, 485, 486, 487]);
  for (const [scene, floor, glazing, cutaway] of options)
    assert.equal(resolveC80Ww74L150SceneIndex(floor, glazing, cutaway), scene);
  assert.equal(resolveC80Ww74L150SceneIndex('2F', 'CLOSED', true), null);
  assert.equal(resolveC80Ww74L150SceneIndex('BOTH', 'UNKNOWN'), null);
});

test('invalid source and mount contract fail closed', () => {
  assert.equal(resolveC80Ww74L150Scenes(null, C80_WW74_L150_GLB_SHA256), null);
  assert.equal(resolveC80Ww74L150Scenes({ scenes: Array(488).fill({}) }, 'wrong'), null);
  assert.throws(() => createC80Ww74L150FloorRuntime({
    gltf: null, sha: C80_WW74_L150_GLB_SHA256, mount: () => {}, mounted: () => null,
  }), /WW74_L150_SOURCE_SCENE_MISMATCH/);
  assert.throws(() => createC80Ww74L150FloorRuntime({
    gltf: null, sha: C80_WW74_L150_GLB_SHA256, mount: null, mounted: () => null,
  }), /WW74_L150_MOUNT_CONTRACT/);
});

// The 55 MB GLB must never enter git; set C80_WW74_L150_GLB_PATH to run.
const fixture = process.env.C80_WW74_L150_GLB_PATH;
test('authentic 488-scene GLB mounts all roles and restores', { skip: !fixture }, () => {
  const binary = readFileSync(fixture);
  assert.equal(binary.length, C80_WW74_L150_GLB_BYTES);
  assert.equal(createHash('sha256').update(binary).digest('hex'), C80_WW74_L150_GLB_SHA256);
  const json = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString('utf8'));
  const scenes = json.scenes.map(s => ({
    name: s.name,
    children: (s.nodes || []).map(n => ({ name: json.nodes[n]?.name })),
    traverse(visitor) { for (const obj of this.children) visitor(obj); },
  }));
  const gltf = { parser: { json }, scenes };
  const resolved = resolveC80Ww74L150Scenes(gltf, C80_WW74_L150_GLB_SHA256);
  assert.ok(resolved);
  let current = resolved[484];
  const runtime = createC80Ww74L150FloorRuntime({
    gltf, sha: C80_WW74_L150_GLB_SHA256, mount(next) { current = next; }, mounted() { return current; },
  });
  assert.equal(runtime.defaultScene, resolved[484]);
  for (const [index, floor, glazing, cutaway] of options) {
    runtime.restore();
    assert.ok(runtime.apply(floor, glazing));
    if (cutaway) assert.ok(runtime.setCutaway(true));
    assert.equal(runtime.sceneIndex, index);
    assert.equal(runtime.selectedScene, current);
  }
  runtime.restore();
  assert.equal(runtime.sceneIndex, 484);
  runtime.dispose();
  assert.equal(runtime.apply('2F'), null);
});

test('viewer wiring admits only the authenticated 488 SHA and opens BOTH484', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{C80_WW74_L150_GLB_SHA256,resolveC80Ww74L150Scenes,createC80Ww74L150FloorRuntime\} from '\.\.\/\.\.\/scripts\/privateModelC80Ww74L150FloorRuntime\.mjs'/);
  assert.match(page, /loadedModelSha256\(gltf\) === C80_WW74_L150_GLB_SHA256\s+\? createC80Ww74L150FloorRuntime/);
  assert.match(page, /if\(loadedModelSha256\(gltf\)===C80_WW74_L150_GLB_SHA256&&!ww74\)throw new Error\('WW74_L150_SOURCE_SCENE_MISMATCH'\)/);
  assert.match(page, /if\(ww74\) gltf\.scene=ww74\[484\];\s+else if\(savo483\) gltf\.scene=savo483\[477\]/);
});
