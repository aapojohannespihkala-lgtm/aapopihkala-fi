import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_HALLFACE_816817_SOURCE as SPEC,
  isK3Hallface816817Source as valid,
  k3Hallface816817SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3HallfaceScene816817SourceReceipt.mjs';

// Synthetic scene-root fixture only, NOT a rendering or authenticated GLB.
function synthetic() {
  const scenes = Array.from({ length: SPEC.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: SPEC.nodeCount }, () => ({}));
  const old = [...Array.from({ length: 499 }, (_, i) => i),
    SPEC.oldSw04Root, SPEC.oldSw05Root];
  for (const view of Object.values(SPEC.views)) {
    scenes[view.sourceScene] = { nodes: [...old] };
    scenes[view.sceneIndex] = {
      name: 'Ylisrinne_R31_D2F_HALLFACE_WORK_TEST_HOST_HOLD__scene' + view.sceneIndex,
      nodes: old.map(id => id === SPEC.oldSw04Root ? SPEC.photoSw04Root :
        id === SPEC.oldSw05Root ? SPEC.photoSw05Root : id),
    };
  }
  nodes[SPEC.photoSw04Root] = { name: 'SW04_AND_2SCHUKO_PHOTO' };
  nodes[SPEC.photoSw05Root] = { name: 'SW05_WALLHOST', children: [SPEC.oldSw05Root] };
  nodes[SPEC.photoHostNode] = { mesh: SPEC.photoHostMesh };
  return {
    asset: { version: '2.0' },
    scene: SPEC.defaultScene,
    scenes,
    nodes,
    meshes: Array(SPEC.meshCount).fill(null),
  };
}

test('source identity and BOTH 816/817 normal/service roots accept exact SHA only', () => {
  assert.match(SPEC.zipSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.glbSha256, /^[0-9a-f]{64}$/);
  assert.match(SPEC.parentGlbSha256, /^[0-9a-f]{64}$/);
  assert.notEqual(SPEC.glbSha256, SPEC.parentGlbSha256);
  for (const view of Object.values(SPEC.views)) {
    const j = synthetic();
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex, view.role), true);
    assert.deepEqual(receipt(j, SPEC.glbSha256, view.sceneIndex, view.role), {
      exactSource: true, stage: 'WORK_TEST_HOST_HOLD',
      sourceLinksBound: false, viewerRegistered: false,
      publishAllowed: false, productionWebGLVerified: false,
      humanReview: 'NOT_RUN', current: false, asBuilt: false,
      physicalHostVerified: false,
    });
  }
});

test('different SHA, roles, scene indices and scene label fail closed', () => {
  const j = synthetic();
  for (const view of Object.values(SPEC.views)) {
    assert.equal(valid(j, '0'.repeat(64), view.sceneIndex, view.role), false);
    assert.equal(valid(j, SPEC.parentGlbSha256, view.sceneIndex, view.role), false);
    assert.equal(valid(j, 'not-a-sha', view.sceneIndex, view.role), false);
    assert.equal(valid(j, SPEC.glbSha256, view.sourceScene, view.role), false);
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex, 'BOTH'), false);
    assert.equal(valid(j, SPEC.glbSha256, view.sceneIndex,
      view.role === 'BOTH_NORMAL' ? 'BOTH_SERVICE' : 'BOTH_NORMAL'), false);
    const clone = structuredClone(j);
    clone.scenes[view.sceneIndex].name = 'fake__scene' + view.sourceScene;
    assert.equal(valid(clone, SPEC.glbSha256, view.sceneIndex, view.role), false);
  }
});

test('two exact root replacements and every other source root stay in order', () => {
  const v = SPEC.views.normal;
  const j = synthetic();
  const fails = mutate => {
    const c = structuredClone(j);
    mutate(c);
    assert.equal(valid(c, SPEC.glbSha256, v.sceneIndex, v.role), false);
  };
  fails(c => { c.scene = 0; });
  fails(c => { c.scenes.length--; });
  fails(c => { c.nodes.length--; });
  fails(c => { c.meshes.length--; });
  fails(c => { c.scenes[v.sceneIndex].nodes.pop(); });
  fails(c => { c.scenes[v.sourceScene].nodes[0] = 12345; });
  fails(c => { c.scenes[v.sceneIndex].nodes[0] = 12345; });
  fails(c => {
    const r = c.scenes[v.sceneIndex].nodes;
    [r[0], r[1]] = [r[1], r[0]];
  });
  fails(c => { c.scenes[v.sourceScene].nodes[499] = SPEC.photoSw04Root; });
  fails(c => { c.scenes[v.sceneIndex].nodes[500] = SPEC.oldSw05Root; });
  fails(c => { c.nodes[SPEC.photoSw05Root].children = []; });
  fails(c => { c.nodes[SPEC.photoSw05Root].children = [SPEC.oldSw04Root]; });
  fails(c => { c.nodes[SPEC.photoHostNode].mesh = 0; });
  assert.equal(valid(j, SPEC.glbSha256, v.sceneIndex, v.role), true);
});

test('no source alone authorizes publishing or as-built status', () => {
  for (const view of Object.values(SPEC.views)) {
    const r = receipt(null, SPEC.glbSha256, view.sceneIndex, view.role);
    assert.equal(r.exactSource, false);
    assert.equal(r.publishAllowed, false);
    assert.equal(r.viewerRegistered, false);
    assert.equal(r.current, false);
    assert.equal(r.asBuilt, false);
    assert.equal(r.productionWebGLVerified, false);
  }
});

// Opt-in original-byte check. CI without private authorized file SKIPS this.
// Synthetic unit success is NOT proof that the original donor matches contract.
const glbFile = process.env.C80_R31_HALLFACE_SCENE816817_GLB_PATH;
test('optional authenticated original GLB SHA and source scene parity',
  { skip: !glbFile }, () => {
    const bytes = readFileSync(glbFile);
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.length, SPEC.glbBytes);
    assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
    const sha = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, SPEC.glbSha256);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    for (const view of Object.values(SPEC.views)) {
      assert.equal(valid(json, sha, view.sceneIndex, view.role), true);
      assert.equal(receipt(json, sha, view.sceneIndex, view.role).publishAllowed, false);
    }
  });
