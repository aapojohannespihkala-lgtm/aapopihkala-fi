import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolveC80R2ChainFloorScenes } from '../../src/scripts/privateModelC80R2ChainScenes.mjs';

const ROOT = new URL('../../', import.meta.url);
const candidateId = 'ylisrinne-v69p12r1-sink-faucet-floor-metadata-20261105';
const sourceId = '1Jh-ssNwDO_k6byI8M0jrE7GiOgBNktMM';
const sha = 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3';
const size = 32_610_084;
const worker = readFileSync(new URL('worker/privateWorkTest.ts', ROOT), 'utf8');
const registry = JSON.parse(readFileSync(new URL('.github/work-test-candidates.json', ROOT), 'utf8'));

// This is an opt-in transport registration for an immutable GLB, not a scene
// selector change, deployment, source-card promotion, or human acceptance.
test('V69P12R1 has one exact SHA-pinned Worker receiver and Drive source', () => {
  const candidates = worker.match(/const V69P12R1_SINK_FAUCET_WORK_TEST_CANDIDATE = \{([\s\S]*?)\} as const satisfies PrivateWorkTestCandidate;/g) ?? [];
  assert.equal(candidates.length, 1);
  const block = candidates[0];
  assert.ok(block.includes(`id: '${candidateId}'`));
  assert.ok(block.includes(`objectKey: 'work-test/${candidateId}.glb'`));
  assert.ok(block.includes(`expectedSize: 32_610_084`));
  assert.ok(block.includes(`expectedSha256: '${sha}'`));
  assert.match(worker, /const PRIVATE_WORK_TEST_RUNTIME_CANDIDATES = \[\s*V69P12R1_SINK_FAUCET_WORK_TEST_CANDIDATE,/);
  assert.equal(registry.candidates[candidateId]?.driveFileId, sourceId);
  assert.equal(registry.candidates['ylisrinne-v69-six6-k17-rail900-20261104']?.driveFileId, '1xHJfOqoS7mzd7bpt527nziQl7cHhUMQv');
  assert.ok(!block.includes('current: true') && !block.includes('asBuilt: true'));
});

test('real 295-scene source keeps original default, and routes 2F/BOTH to new sink',
  { skip: !process.env.YLIS_V69P12R1_GLB }, () => {
    const bytes = readFileSync(process.env.YLIS_V69P12R1_GLB);
    assert.equal(bytes.byteLength, size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
    assert.equal(bytes.toString('utf8', 0, 4), 'glTF');
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.byteLength);
    assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
    const source = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
    assert.equal(source.scenes.length, 295);
    assert.equal(source.scene, 292); // Existing default is preserved.
    assert.equal(source.asset.extras.current, false);
    assert.equal(source.asset.extras.asBuilt, false);
    assert.deepEqual(resolveC80R2ChainFloorScenes(source) &&
      Object.fromEntries(['1F', '2F', 'BOTH'].map(k => [k, resolveC80R2ChainFloorScenes(source)[k]])),
      { '1F': 290, '2F': 293, 'BOTH': 294 });
    assert.match(source.scenes[293].name, /V59P12.*2F/);
    assert.match(source.scenes[294].name, /V59P12.*BOTH/);
  });
