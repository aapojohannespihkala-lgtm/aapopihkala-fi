import test from 'node:test';
import assert from 'node:assert/strict';
import { selectVerifiedSharedSystemsScene } from '../../src/scripts/privateModelSharedSystemsSceneGate.mjs';

const hash = '4'.repeat(64);
function fixture() {
  const candidate = {
    id: 'm5a-m5b-d1f-shared-systems-299-20261019',
    expectedSize: 10840000,
    expectedSha256: hash,
  };
  const verification = {
    candidateId: candidate.id,
    actualSizeBytes: candidate.expectedSize,
    actualSha256: hash,
  };
  const contract = {
    candidateId: candidate.id,
    expectedSizeBytes: candidate.expectedSize,
    expectedSha256: hash,
    sourceDefaultSceneIndex: 65,
    combinedSceneIndex: 298,
    combinedSceneName: 'SOURCE_D1F_M5A_M5B_299_WORK_TEST',
    requiredRootNodeIndices: [111, 3525, 4040],
  };
  const scenes = Array.from({ length: 299 }, (_, i) => ({ name: `scene-${i}` }));
  scenes[298].name = contract.combinedSceneName;
  const nodes = Array.from({ length: 4041 }, (_, i) => ({ name: `source-node-${i}` }));
  const sourceScenes = scenes.map((s, i) => ({ name: s.name, nodes: i === 298 ? [111, 3525, 4040] : [i] }));
  const gltf = { scenes, scene: scenes[65], parser: { json: { scene: 65, scenes: sourceScenes, nodes } } };
  return { candidate, verification, contract, gltf };
}
const select = selectVerifiedSharedSystemsScene;
test('returns exact combined scene, never defaults to scene65', () => {
  const f = fixture();
  assert.equal(select(f), f.gltf.scenes[298]);
  assert.equal(f.gltf.scene, f.gltf.scenes[65]);
});
test('rejects stale candidate and mismatched byte-verified identity', () => {
  for (const mutate of [
    f => { f.candidate.id = 'wrong'; },
    f => { f.verification.candidateId = 'wrong'; },
    f => { f.verification.actualSizeBytes++; },
    f => { f.verification.actualSha256 = '2'.repeat(64); },
    f => { f.candidate.expectedSha256 = '2'.repeat(64); },
    f => { f.contract.expectedSha256 = 'xyz'; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => select(f), /SHARED_WORK_TEST_SCENE_GATE/);
  }
});
test('rejects stale selection index and a missing combined scene', () => {
  for (const mutate of [
    f => { f.contract.combinedSceneIndex = 65; },
    f => { f.contract.combinedSceneIndex = 299; },
    f => { f.contract.sourceDefaultSceneIndex = 0; },
    f => { f.gltf.scenes.splice(298, 1); },
    f => { f.gltf.scene = f.gltf.scenes[298]; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => select(f), /SHARED_WORK_TEST_SCENE_GATE/);
  }
});
test('rejects stale source and Three scene names', () => {
  for (const mutate of [
    f => { f.contract.combinedSceneName = 'HISTORICAL_SCENE'; },
    f => { f.gltf.scenes[298].name = 'wrong'; },
    f => { f.gltf.parser.json.scenes[298].name = 'wrong'; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => select(f), /SHARED_WORK_TEST_SCENE_GATE/);
  }
});
test('requires unique original source roots all inside the combined scene', () => {
  for (const mutate of [
    f => { f.contract.requiredRootNodeIndices = [111]; },
    f => { f.contract.requiredRootNodeIndices = [111,111]; },
    f => { f.contract.requiredRootNodeIndices = [111,3525,4042]; },
    f => { f.gltf.parser.json.scenes[298].nodes = [111,3525]; },
    f => { f.gltf.parser.json.scenes[298].nodes = [111,3525,3525,4040]; },
    f => { f.gltf.parser.json.nodes[111].name = ''; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => select(f), /SHARED_WORK_TEST_SCENE_GATE/);
  }
});
