import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Group, Mesh } from 'three';
import { buildSourceNodeAssociations, createSourceNodeView } from '../../src/scripts/privateModelSourceNodeAssociations.mjs';
import { R33_LK75_COVER_SOURCE, assessR33LK75CoverSource, r33LK75SelectionMetadataEntries, R34_LK75_COVER_SOURCE, assessR34LK75CoverSource, r34LK75SelectionMetadataEntries } from '../../src/scripts/privateModelR33LK75CoverSourceGuard.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8'));
const SHA = R33_LK75_COVER_SOURCE.glbSha256;

function r33Fixture() {
  const scenes = Array.from({ length: fixture.counts.scenes }, () => ({ name: 'HISTORICAL', nodes: [] }));
  for (const i of [818, 819, 820, 821]) scenes[i] = structuredClone(fixture.scenes[String(i)]);
  const nodes = Array.from({ length: fixture.counts.nodes }, () => ({}));
  nodes[13253] = {
    name: 'C80_620R24_L10_D2FWC_DRAIN_BODY_AND_OUTLET_WORK_TEST_HOST_HOLD',
    children: [13254, 13255],
    extras: {
      sourceVisibleCoverNode: 11624, current: false, asBuilt: false,
      hostHold: true, physicalHostVerified: false, sourceLinksBoundToViewer: false,
    },
  };
  nodes[13254] = { name: 'R22_L10_V93_D2FWC_BODY_WORK_TEST_SLAB_V75_SC319320', mesh: 5097 };
  nodes[13255] = { name: 'R22_L10_V93_D2FWC_TRAP_OUTLET_WORK_TEST_SLAB_V75_SC319320', mesh: 5098 };
  nodes[11624] = { name: 'OWNER_YELLOW_LEFT_TILE_SIDEWALL_FROM_2TILE_RETURN_WORK_TEST', mesh: 4418 };
  nodes[11645] = { name: 'D2FWC_V14_SALES_PHOTO_TILE_PLEXI_EDGE_COVER_ROOT_WORK_TEST_HOST_HOLD', children: [11643, 11644] };
  nodes[11643] = { name: 'D2FWC_2024_SALES_TILE_ORIENTED_EXACT_1F_DONOR_COVER_MESH894_OPTIN_WORK_TEST', mesh: 894 };
  nodes[11644] = { name: 'D2FWC_2024_SALES_TILE_ORIENTED_EXACT_1F_DONOR_COVER_MESH895_OPTIN_WORK_TEST', mesh: 895 };
  return {
    scenes, nodes, meshes: Array.from({ length: fixture.counts.meshes }, () => ({})),
    scene: fixture.defaultScene,
    asset: { extras: { ModelStage: 'WORK_TEST', current: false, asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } },
  };
}

test('R33 original 818-821 retain the exact LK75 sidewall misreference, not a physical cover proof', () => {
  assert.equal(fixture.counts.scenes, 822);
  assert.equal(fixture.counts.nodes, 13846);
  assert.equal(fixture.counts.meshes, 5237);
  for (const i of [818, 819, 820, 821]) {
    assert.equal(fixture.scenes[i].name, R33_LK75_COVER_SOURCE.scenes[i]);
    assert.ok(fixture.scenes[i].nodes.includes(13253));
    assert.ok(fixture.scenes[i].nodes.includes(11624));
    assert.ok(fixture.scenes[i].nodes.includes(11645));
    const result = assessR33LK75CoverSource(r33Fixture(), SHA, i);
    assert.equal(result.status, 'WRONG_SIDEWALL_POINTER');
    assert.equal(result.linkedNode, 11624);
    assert.deepEqual(result.candidateCoverIds, [11643, 11644]);
    assert.equal(result.candidateCoverMeshesActive, true);
    assert.equal(result.physicalHostVerified, false);
    assert.equal(result.asBuiltClaim, false);
  }
});

test('wrong R32H/or arbitrary SHA, old glTF scene, wrong label or forged asset status fail closed', () => {
  let a = r33Fixture();
  assert.equal(assessR33LK75CoverSource(a, R33_LK75_COVER_SOURCE.parentR32HGlbSha256, 818).status, 'OUT_OF_SOURCE_SCOPE');
  assert.equal(assessR33LK75CoverSource(a, SHA, 814).status, 'OUT_OF_SOURCE_SCOPE');
  a.scenes[818].name = 'Ylisrinne_R33_wrong__scene818';
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'OUT_OF_SOURCE_SCOPE');
  a = r33Fixture(); a.asset.extras.current = true;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'OUT_OF_SOURCE_SCOPE');
  a = r33Fixture(); a.scenes.pop();
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'OUT_OF_SOURCE_SCOPE');
});

test('wrong host, missing active root and changed pointer never auto-correct a cover', () => {
  const a = r33Fixture();
  a.nodes[13253].extras.sourceVisibleCoverNode = 11643;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'CHANGED_POINTER_NOT_VERIFIED');
  a.nodes[13253].extras.sourceVisibleCoverNode = 11624;
  a.nodes[11624].mesh = 4444;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
  a.nodes[11624].mesh = 4418;
  a.nodes[13253].extras.current = true;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
  a.nodes[13253].extras.current = false;
  a.scenes[818].nodes = a.scenes[818].nodes.filter(id => id !== 13253);
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
});

test('sourceLinks-bound or claimed physical host cannot inherit the unverified R33 pointer', () => {
  const a = r33Fixture();
  a.nodes[13253].extras.sourceLinksBoundToViewer = true;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
  a.nodes[13253].extras.sourceLinksBoundToViewer = false;
  a.nodes[13253].extras.physicalHostVerified = true;
  assert.equal(assessR33LK75CoverSource(a, SHA, 818).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
});

test('candidate cover missing never becomes a physical cover claim', () => {
  const a = r33Fixture();
  a.nodes[11644].mesh = 999;
  const r = assessR33LK75CoverSource(a, SHA, 818);
  assert.equal(r.status, 'WRONG_SIDEWALL_POINTER');
  assert.equal(r.candidateCoverMeshesActive, false);
  assert.equal(r.physicalHostVerified, false);
});

function sourceSelection() {
  const json = r33Fixture();
  const scene = json.scenes[818];
  const drain = { name: json.nodes[13253].name, parent: scene };
  const body = { name: json.nodes[13254].name, parent: drain };
  const tile = { name: json.nodes[11624].name, parent: scene };
  const associations = new Map([
    [drain, { nodes: 13253 }], [body, { nodes: 13254 }], [tile, { nodes: 11624 }],
  ]);
  return { json, sourceModel: { scenes: json.scenes, parser: { json, associations } }, drain, body, tile, scene };
}

test('exact picked drain subtree displays two warnings, adjacent tile is never an LK75', () => {
  const { sourceModel, drain, body, tile } = sourceSelection();
  for (const selected of [drain, body]) {
    const entries = r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, selected);
    assert.equal(entries.length, 2);
    assert.match(entries[0][1], /n11624.*seinälaatta/);
    assert.match(entries[1][1], /n11643.*n11644.*WORK_TEST/);
  }
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, tile), []);
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, 'wrong-sha', 818, body), []);
});

test('wrong parent, wrong source-root name and stale selection cannot leak R33 warning', () => {
  const { sourceModel, drain, body, scene } = sourceSelection();
  body.parent = { name: 'stale scene root' };
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, body), []);
  body.parent = drain;
  drain.name = 'wrong source replica';
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, body), []);
  drain.name = sourceModel.parser.json.nodes[13253].name;
  scene.nodes = scene.nodes.filter(id => id !== 13253);
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, body), []);
});

test('stale selected object from a previous scene cannot inherit the R33 LK75 warning', () => {
  const { sourceModel, body } = sourceSelection();
  sourceModel.scenes[818] = { name: 'remounted scene', nodes: sourceModel.scenes[818].nodes };
  assert.deepEqual(r33LK75SelectionMetadataEntries(sourceModel, SHA, 818, body), []);
});

test('viewer only adds gated metadata without changing sourceVisibleCoverNode or sourceLinks', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /import \{ r33LK75SelectionMetadataEntries, R33_LK75_COVER_SOURCE \}/);
  assert.match(page, /r33LK75SelectionMetadataEntries\(/);
  assert.match(page, /layersLoadedSha === R33_LK75_COVER_SOURCE\.glbSha256/);
  assert.match(page, /\.\.\.lk75SourceMetadata,/);
  assert.doesNotMatch(page, /sourceVisibleCoverNode\s*=\s*11643/);
  assert.doesNotMatch(page, /sourceVisibleCoverNode\s*=\s*11644/);
});

const r34Roots = JSON.parse(readFileSync(new URL('../fixtures/private-model-r34-scene-roots.json', import.meta.url), 'utf8'));
const SHA34 = R34_LK75_COVER_SOURCE.glbSha256;
function r34Fixture() {
  // Actual canonical root lists and counts; inherited reviewed LK75 nodes from R33.
  // This is a JSON fixture, not a loaded GLB or a physical connection test.
  const j = r33Fixture();
  j.scenes = Array.from({ length: r34Roots.counts.scenes }, () => ({ name: 'HISTORICAL', nodes: [] }));
  for (const [i, v] of Object.entries(r34Roots.scenes)) j.scenes[Number(i)] = structuredClone(v);
  j.nodes.push(...Array.from({ length: r34Roots.counts.nodes - j.nodes.length }, () => ({})));
  j.meshes.push(...Array.from({ length: r34Roots.counts.meshes - j.meshes.length }, () => ({})));
  j.scene = r34Roots.defaultScene;
  j.asset.extras = { ...r34Roots.asset };
  j.nodes[13253].extras.targetVerticalV75ExistingNode = 10143;
  return j;
}
test('R34 exact four canonical views retain LK75 source conflict, not a verified cover', () => {
  for (const i of [822, 823, 824, 825]) {
    const j = r34Fixture();
    assert.equal(j.scenes[i].name, R34_LK75_COVER_SOURCE.scenes[i]);
    assert.equal(assessR34LK75CoverSource(j, SHA34, i).status, 'WRONG_SIDEWALL_POINTER');
    assert.equal(assessR34LK75CoverSource(j, SHA34, i).candidateCoverMeshesActive, true);
    assert.equal(assessR34LK75CoverSource(j, SHA34, i).physicalHostVerified, false);
    assert.equal(assessR33LK75CoverSource(j, SHA34, i).status, 'OUT_OF_SOURCE_SCOPE');
  }
});
test('R34 rejects old SHA, old scene, wrong count, missing host and changed source pointer', () => {
  const j = r34Fixture();
  assert.equal(assessR34LK75CoverSource(j, SHA, 822).status, 'OUT_OF_SOURCE_SCOPE');
  assert.equal(assessR34LK75CoverSource(j, SHA34, 818).status, 'OUT_OF_SOURCE_SCOPE');
  j.nodes.push({});
  assert.equal(assessR34LK75CoverSource(j, SHA34, 822).status, 'OUT_OF_SOURCE_SCOPE');
  j.nodes.pop();
  j.nodes[13253].extras.sourceVisibleCoverNode = 11643;
  assert.equal(assessR34LK75CoverSource(j, SHA34, 822).status, 'CHANGED_POINTER_NOT_VERIFIED');
  j.nodes[13253].extras.sourceVisibleCoverNode = 11624;
  j.scenes[822].nodes = j.scenes[822].nodes.filter(n => n !== 13253);
  assert.equal(assessR34LK75CoverSource(j, SHA34, 822).status, 'SOURCE_NODE_OR_HOST_MISMATCH');
});
test('R34 mounted selection rejects stale scene and unrelated reparented object', () => {
  const j = r34Fixture();
  const scene = j.scenes[822];
  const drain = { name: j.nodes[13253].name, parent: scene };
  const body = { name: j.nodes[13254].name, parent: drain };
  const tile = { name: j.nodes[11624].name, parent: drain };
  const associations = new Map([[drain, { nodes: 13253 }], [body, { nodes: 13254 }], [tile, { nodes: 11624 }]]);
  const sourceModel = { scenes: [...j.scenes], parser: { json: j, associations } };
  assert.match(r34LK75SelectionMetadataEntries(sourceModel, SHA34, 822, body)[0][1], /n11624.*seinälaatta/);
  assert.deepEqual(r34LK75SelectionMetadataEntries(sourceModel, SHA34, 822, tile), []);
  assert.deepEqual(r34LK75SelectionMetadataEntries(sourceModel, SHA34, 824, body), []);
  sourceModel.scenes[822] = {};
  assert.deepEqual(r34LK75SelectionMetadataEntries(sourceModel, SHA34, 822, body), []);
});
test('R34 V75 candidate is conditional on active source ancestry, never a physical link', () => {
  for (const i of [822, 823, 824, 825]) {
    const j = r34Fixture(), candidate = R34_LK75_COVER_SOURCE.v75ByScene[i];
    // Simulated active ancestry to isolate the conditional warning; no GLB claim.
    j.nodes[13254].children = [candidate];
    const check = assessR34LK75CoverSource(j, SHA34, i);
    assert.equal(check.v75ReferenceConflict, true);
    assert.equal(check.activeV75Candidate, candidate);
    assert.equal(check.physicalHostVerified, false);
    j.nodes[13254].children = [10143, candidate];
    assert.equal(assessR34LK75CoverSource(j, SHA34, i).v75ReferenceConflict, false);
  }
});

test('R34 viewer invokes only the exact source guard using the mounted scene', () => {
  const page = readFileSync(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /const lk75ActiveScene = modelRoot\.children\[0\] \?\? null;/);
  assert.match(page, /const lk75SceneIndex = layersGltf\?\.scenes\?\.indexOf\(lk75ActiveScene\) \?\? -1;/);
  assert.match(page, /layersLoadedSha === R34_LK75_COVER_SOURCE\.glbSha256\s*\? r34LK75SelectionMetadataEntries\(sourceNodeModel\(layersGltf\), layersLoadedSha, lk75SceneIndex, object\)/);
});

test('R34 mounted Three scene cycle accepts loader-suffixed source names without stale or unrelated selections', () => {
  // Canonical scene roots/counts with synthetic Object3D trees; NOT original GLB playback.
  const j = r34Fixture();
  const scenes = j.scenes.map((def, sceneIndex) => {
    const scene = new Group();
    scene.name = def.name;
    const build = (id) => {
      const node = j.nodes[id];
      const object = Number.isInteger(node.mesh) ? new Mesh() : new Group();
      object.name = node.name ?? '';
      if (id === 13253 && sceneIndex !== 822) object.name += '_' + (sceneIndex - 822);
      for (const child of node.children ?? []) object.add(build(child));
      return object;
    };
    for (const id of def.nodes) scene.add(build(id));
    return scene;
  });
  const gltf = { scenes, scene: scenes[j.scene], parser: { json: j, associations: new Map() } };
  const rebuilt = buildSourceNodeAssociations(gltf);
  const view = createSourceNodeView(gltf, rebuilt);
  const modelRoot = new Group();
  let prior = null;
  for (const i of [822, 823, 824, 825, 822]) {
    modelRoot.clear();
    modelRoot.add(scenes[i]);
    const mountedIndex = scenes.indexOf(modelRoot.children[0]);
    assert.equal(mountedIndex, i);
    const drain = scenes[i].children.find(o => rebuilt.get(o)?.nodes === 13253);
    const tile = scenes[i].children.find(o => rebuilt.get(o)?.nodes === 11624);
    assert.ok(drain && tile);
    const body = drain.children[0];
    const outlet = drain.children[1];
    for (const selected of [drain, body, outlet]) {
      const entries = r34LK75SelectionMetadataEntries(view, SHA34, mountedIndex, selected);
      assert.match(entries[0]?.[1] ?? '', /n11624.*seinälaatta/);
      assert.deepEqual(r34LK75SelectionMetadataEntries(view, SHA34, mountedIndex === 822 ? 823 : 822, selected), []);
    }
    assert.deepEqual(r34LK75SelectionMetadataEntries(view, SHA34, mountedIndex, tile), []);
    if (prior) assert.deepEqual(r34LK75SelectionMetadataEntries(view, SHA34, mountedIndex, prior), []);
    const originalName = drain.name;
    drain.name = originalName + '_not_a_loader_suffix';
    assert.deepEqual(r34LK75SelectionMetadataEntries(view, SHA34, mountedIndex, body), []);
    drain.name = originalName;
    prior = outlet;
  }
  assert.equal(gltf.parser.associations.size, 0, 'loader map stays untouched');
});
