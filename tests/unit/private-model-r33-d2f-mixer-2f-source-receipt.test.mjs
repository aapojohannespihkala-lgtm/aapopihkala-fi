import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  isR33D2FMixer2FSource, r33D2FMixer2FReceipt,
  R33_D2F_MIXER_SOURCE as SOURCE, R33_D2F_MIXER_VIEWS as VIEWS,
} from '../../src/scripts/privateModelR33D2FMixer2FSourceReceipt.mjs';
import {
  C80_R33_SOURCE, C80_R34_SOURCE,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

const original = JSON.parse(readFileSync(
  new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8',
));
function sourceFixture() {
  const c = original.counts;
  const scenes = Array.from({ length: 824 }, () => ({ name: 'unused', nodes: [] }));
  for (const [index, source] of Object.entries(original.scenes)) {
    scenes[Number(index)] = { name: source.name, nodes: [...source.nodes] };
  }
  scenes[822] = {
    name: 'Ylisrinne_R33_D2F_KITCHEN_MIXER_2F_NORMAL_WORK_TEST_HOST_HOLD__scene822',
    nodes: [...scenes[820].nodes, 13472],
  };
  scenes[823] = {
    name: 'Ylisrinne_R33_D2F_KITCHEN_MIXER_2F_SERVICE_WORK_TEST_HOST_HOLD__scene823',
    nodes: [...scenes[821].nodes, 13472],
  };
  const nodes = Array.from({ length: c.nodes }, () => ({}));
  nodes[13472] = { children: [13470, 13471] };
  nodes[13470] = { mesh: 5160 };
  nodes[13471] = { mesh: 5161 };
  return {
    asset: { extras: { ...original.asset } },
    scene: original.defaultScene,
    scenes, nodes,
    meshes: Array(c.meshes), materials: Array(c.materials),
    accessors: Array(c.accessors), bufferViews: Array(c.bufferViews),
  };
}
const prove = (j, i) => isR33D2FMixer2FSource(j, SOURCE.glbSha256, i);

test('2F normal and service: exact R33 inherited source roots plus mixer only once', () => {
  const j = sourceFixture();
  assert.equal(SOURCE.originalGlbSha256, C80_R33_SOURCE.glbSha256);
  assert.equal(SOURCE.sceneCount, 824);
  for (const v of Object.values(VIEWS)) {
    assert.equal(j.scenes[v.sceneIndex].nodes.length, j.scenes[v.originalSceneIndex].nodes.length + 1);
    assert.ok(!j.scenes[v.originalSceneIndex].nodes.includes(13472));
    assert.ok(j.scenes[v.sceneIndex].nodes.includes(13472));
    assert.equal(prove(j, v.sceneIndex), true);
    assert.deepEqual({ ...r33D2FMixer2FReceipt(j, SOURCE.glbSha256, v.sceneIndex) }, {
      sourceSha256: SOURCE.glbSha256,
      originalSourceSha256: C80_R33_SOURCE.glbSha256,
      sceneIndex: v.sceneIndex,
      originalSceneIndex: v.originalSceneIndex,
      floor: '2F', role: v.role, status: 'WORK_TEST_HOST_HOLD',
    });
  }
  assert.ok(j.scenes[818].nodes.includes(13472));
  assert.ok(j.scenes[819].nodes.includes(13472));
  assert.equal(prove(j, 820), false);
});

test('fail closed for canonical R34, wrong raw SHA or altered source stage', () => {
  const j = sourceFixture();
  assert.equal(isR33D2FMixer2FSource(j, C80_R33_SOURCE.glbSha256, 822), false);
  assert.equal(isR33D2FMixer2FSource(j, C80_R34_SOURCE.glbSha256, 822), false);
  assert.equal(isR33D2FMixer2FSource(j, '0'.repeat(64), 822), false);
  assert.equal(r33D2FMixer2FReceipt(j, C80_R34_SOURCE.glbSha256, 822), null);
  const current = sourceFixture(); current.asset.extras.current = true;
  assert.equal(prove(current, 822), false);
  const asBuilt = sourceFixture(); asBuilt.asset.extras.asBuilt = true;
  assert.equal(prove(asBuilt, 822), false);
  const changedCount = sourceFixture(); changedCount.meshes.pop();
  assert.equal(prove(changedCount, 822), false);
});

test('fail closed for altered 2F pair, original R33 roots and source mesh identity', () => {
  const missing = sourceFixture(); missing.scenes[822].nodes.pop();
  assert.equal(prove(missing, 822), false);
  const dup = sourceFixture(); dup.scenes[823].nodes.push(13472);
  assert.equal(prove(dup, 823), false);
  const swapped = sourceFixture(); swapped.scenes[822].nodes.splice(0, 1, 13472);
  assert.equal(prove(swapped, 822), false);
  const oldSourceRoot = sourceFixture(); oldSourceRoot.scenes[820].nodes.push(13472);
  assert.equal(prove(oldSourceRoot, 822), false);
  const oldR33Changed = sourceFixture(); oldR33Changed.scenes[818].nodes[0] = 99999;
  assert.equal(prove(oldR33Changed, 823), false);
  const wrongName = sourceFixture(); wrongName.scenes[823].name = 'R34__scene823';
  // Name alone is not a source digest: the exact source SHA is mandatory.
  assert.equal(isR33D2FMixer2FSource(wrongName, C80_R34_SOURCE.glbSha256, 823), false);
  const wrongMesh = sourceFixture(); wrongMesh.nodes[13471].mesh = 5162;
  assert.equal(prove(wrongMesh, 822), false);
  const wrongChildren = sourceFixture(); wrongChildren.nodes[13472].children.reverse();
  assert.equal(prove(wrongChildren, 822), false);
});
