import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { C80_R32H_SOURCE, C80_R32H_VIEWS } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';
import { assessR32HLK75CoverSource, r32hLK75SelectionMetadataEntries, R32H_LK75_COVER_CONTRACT } from '../../src/scripts/privateModelR32HLK75CoverSourceGuard.mjs';

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

function selectedLK75Fixture(sceneIndex = 814) {
  const json = sourceView(sceneIndex);
  json.nodes[13253].children = [13254, 13255];
  json.nodes[13254] = { name: 'LK75_R32H_GENERIC_BODY', mesh: 5097 };
  json.nodes[13255] = { name: 'LK75_R32H_GENERIC_OUTLET', mesh: 5098 };
  const scene = json.scenes[sceneIndex];
  const drain = { name: json.nodes[13253].name, parent: scene };
  const outlet = { name: json.nodes[13255].name, parent: drain };
  const tile = { name: json.nodes[11624].name, parent: scene };
  const associations = new Map([
    [drain, { nodes: 13253 }], [outlet, { nodes: 13255 }], [tile, { nodes: 11624 }],
  ]);
  return { sourceModel: { scenes: json.scenes, parser: { json, associations } }, drain, outlet, tile, scene };
}

test('LK75 selection data reaches only the exact original drain subtree, not the tile sidewall', () => {
  const { sourceModel, drain, outlet, tile } = selectedLK75Fixture();
  for (const selected of [drain, outlet]) {
    const entries = r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, selected);
    assert.equal(entries.length, 2);
    assert.match(entries[0][1], /n11624.*seinälaatta/);
    assert.match(entries[1][1], /n11643.*n11644/);
  }
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, tile), []);
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, 'wrong-sha', 814, outlet), []);
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 812, outlet), []);
});

test('LK75 consumer rejects stale, reparented and non-source model selections', () => {
  const { sourceModel, drain, outlet } = selectedLK75Fixture();
  outlet.parent = { name: 'orphan' };
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, outlet), []);
  outlet.parent = drain;
  drain.name = 'unverified replica';
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, outlet), []);
  drain.name = sourceModel.parser.json.nodes[13253].name;
  sourceModel.parser.json.nodes[11624].mesh = 999;
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, outlet), []);
});

test('R32H viewer selection panel uses exact-source LK75 warning without GLB source remap', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{ r32hLK75SelectionMetadataEntries \} from/);
  assert.match(page, /r32hLK75SelectionMetadataEntries\(/);
  assert.match(page, /\.\.\.lk75SourceMetadata,/);
  assert.doesNotMatch(page, /sourceVisibleCoverNode\s*=\s*11643/);
});

test('LK75 warning follows the mounted scene across BOTH 814 to 815, not a stale cached scene', () => {
  const { sourceModel, outlet } = selectedLK75Fixture(815);
  assert.equal(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 815, outlet).length, 2);
  // The same selected object is not part of scene 814 and must fail closed.
  assert.deepEqual(r32hLK75SelectionMetadataEntries(sourceModel, SHA, 814, outlet), []);
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.ok(page.includes('const lk75ActiveScene = modelRoot.children[0] ?? null;'));
  assert.ok(page.includes('layersGltf.scenes?.indexOf(lk75ActiveScene)'));
  assert.ok(!page.includes('const lk75ActiveScene = mainViewScope'));
});
