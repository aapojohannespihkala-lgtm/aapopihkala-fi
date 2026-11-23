import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { assessR32HLK75CoverSource, R32H_LK75_COVER_CONTRACT } from '../../src/scripts/privateModelR32HLK75CoverSourceGuard.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-r32h-scene-roots.json', import.meta.url), 'utf8'));
const SHA = C80_R32H_SOURCE.glbSha256;

function sourceView(index = 814) {
  const scene = fixture.scenes[String(index)];
  const nodes = Array.from({ length: fixture.counts.nodes }, () => ({}));
  nodes[13253] = { name: 'LK75_R32H_GENERIC_DRAIN_BODY', extras: { sourceVisibleCoverNode: 11624 } };
  nodes[11624] = { name: 'OWNER_YELLOW_LEFT_TILE_SIDEWALL', mesh: 4418 };
  nodes[11645] = { name: 'LK75_COVER_ROOT', children: [11643, 11644] };
  nodes[11643] = { name: 'LK75_COVER_PART_A', mesh: 894 };
  nodes[11644] = { name: 'LK75_COVER_PART_B', mesh: 895 };
  return { scenes: Object.fromEntries(
    Object.entries(fixture.scenes).map(([i, v]) => [i, { name: v.name, nodes: [...v.nodes] }])
  ), nodes, asset: { extras: { current: false, asBuilt: false } } };
}

test('original R32H source links LK75 to a tile SIDEWALL rather than a drain lid', () => {
  assert.equal(R32H_LK75_COVER_CONTRACT.rejectedPointer, 11624);
  assert.equal(R32H_LK75_COVER_CONTRACT.rejectedMesh, 4418);
  assert.deepEqual(R32H_LK75_COVER_CONTRACT.coverLeafMeshes, [[11643, 894], [11644, 895]]);
  for (const { sceneIndex } of Object.values(C80_R32H_VIEWS)) {
    const result = assessR32HLK75CoverSource(sourceView(sceneIndex), SHA, sceneIndex);
    assert.equal(result.status, 'WRONG_SIDEWALL_POINTER');
    assert.equal(result.linkedNode, 11624);
    assert.deepEqual(result.candidateCoverIds, [11643, 11644]);
    assert.equal(result.candidateCoverMeshesActive, true);
    assert.equal(result.physicalHostVerified, false);
    assert.equal(result.asBuiltClaim, false);
  }
});

test('invalid source SHA/scene and inactive covers never produce a physical claim', () => {
  const a = sourceView();
  assert.equal(assessR32HLK75CoverSource(a, 'wrong-sha', 814).status, 'OUT_OF_SOURCE_SCOPE');
  assert.equal(assessR32HLK75CoverSource(a, SHA, 812).status, 'OUT_OF_SOURCE_SCOPE');
  a.scenes[814].nodes = a.scenes[814].nodes.filter((id) => id !== 11645);
  const result = assessR32HLK75CoverSource(a, SHA, 814);
  assert.equal(result.status, 'WRONG_SIDEWALL_POINTER');
  assert.equal(result.candidateCoverMeshesActive, false);
  assert.equal(result.physicalHostVerified, false);
});

test('even repaired candidate leaf index remains HOST_HOLD until a reviewed successor', () => {
  const a = sourceView();
  a.nodes[13253].extras.sourceVisibleCoverNode = 11643;
  const r = assessR32HLK75CoverSource(a, SHA, 814);
  assert.equal(r.status, 'CANDIDATE_LEAF_ONLY');
  assert.equal(r.linkedNode, 11643);
  assert.equal(r.asBuiltClaim, false);
  assert.equal(r.physicalHostVerified, false);
  a.nodes[13253].extras.sourceVisibleCoverNode = 99999;
  assert.equal(assessR32HLK75CoverSource(a, SHA, 814).status, 'UNVERIFIED_COVER_LINK');
});
