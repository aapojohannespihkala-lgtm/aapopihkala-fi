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


// These tests exercise actual WebCrypto SHA-256 over full in-memory GLB bodies,
// rather than mock hashes copied from the expected catalogue contract.
import { createHash, webcrypto } from 'node:crypto';
import { fetchVerifiedSharedSystemsGlb } from '../../src/scripts/privateModelSharedSystemsSceneGate.mjs';
function binaryFixture() {
  const bytes = new ArrayBuffer(24);
  const v = new DataView(bytes);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, bytes.byteLength, true);
  v.setUint32(12, 4, true);
  v.setUint32(16, 0x4e4f534a, true);
  const sha = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
  const candidate = {
    id: 'm5a-m5b-d1f-shared-systems-298-20261019',
    path: '/private-model/work-test/test-298.glb',
    expectedSize: 24,
    expectedSha256: sha,
  };
  const contract = {
    candidateId: candidate.id,
    expectedSizeBytes: 24,
    expectedSha256: sha,
  };
  let lastOptions;
  const fetchImpl = async (url, options) => {
    lastOptions = options;
    return { ok: true, redirected: false, type: 'basic', url,
      arrayBuffer: async () => bytes.slice(0) };
  };
  const args = {candidate, contract, origin: 'https://viewer.example.test',
    fetchImpl, cryptoSubtle: webcrypto.subtle};
  return {bytes, args, options: () => lastOptions};
}
test('fetches exact authenticated body, validates GLB2 header and actual SHA-256', async () => {
  const f = binaryFixture();
  const actual = await fetchVerifiedSharedSystemsGlb(f.args);
  assert.equal(actual.verifiedBytes.byteLength, 24);
  assert.equal(actual.verification.actualSha256, f.args.contract.expectedSha256);
  assert.deepEqual(f.options(), {
    credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
  });
});
test('refuses cross-origin, unverified metadata and opaque/redirected/failed fetch', async () => {
  for (const change of [
    f => { f.args.candidate.path = '//other.example.test/a.glb'; },
    f => { f.args.candidate.path = 'https://other.example.test/a.glb'; },
    f => { f.args.candidate.path = '/private-model/a.glb?query=true'; },
    f => { f.args.candidate.expectedSize++; },
    f => { f.args.contract.expectedSha256 = '2'.repeat(64); },
    f => { f.args.fetchImpl = async () => ({ok:false}); },
    f => { f.args.fetchImpl = async () => ({ok:true,redirected:true}); },
    f => { f.args.fetchImpl = async () => ({ok:true,type:'opaque'}); },
    f => { f.args.fetchImpl = async () => ({ok:true,redirected:false,type:'basic',arrayBuffer:async()=>f.bytes,url:'https://other.example.test/a.glb'}); },
  ]) {
    const f=binaryFixture();change(f);
    await assert.rejects(fetchVerifiedSharedSystemsGlb(f.args),/SHARED_WORK_TEST_SCENE_GATE/);
  }
});
test('fails closed on altered bytes, missing GLB2 header, and a truncated body', async () => {
  for (const change of [
    f => {f.args.fetchImpl=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(12)});},
    f => {f.bytes=new ArrayBuffer(24);f.args.fetchImpl=async()=>({ok:true,arrayBuffer:async()=>f.bytes});},
    f => {const b=f.bytes.slice(0);new DataView(b).setUint32(4,1,true);f.args.fetchImpl=async()=>({ok:true,arrayBuffer:async()=>b});},
    f => {const b=f.bytes.slice(0);new DataView(b).setUint32(20,41,true);f.args.fetchImpl=async()=>({ok:true,arrayBuffer:async()=>b});},
  ]) {
    const f=binaryFixture();change(f);
    await assert.rejects(fetchVerifiedSharedSystemsGlb(f.args),/SHARED_WORK_TEST_SCENE_GATE/);
  }
});
