import {test, expect} from '@playwright/test';
import {
  createSharedCombinedSceneSelector,
  SharedWorkTestSceneError,
} from '../../src/scripts/privateModelSharedCombinedWorkTestSceneSelector.mjs';

// Real immutable shared298 scene297 manifest, NOT a current physical approval.
// Source GLB sha-256 verified independently from its original bytes.
const source = {
  candidateId: 'm5a-m5b-d1f-shared-systems-298-20261019',
  rawGlbSha256: '303e60a903c0988dcfa0cee77c4dda21f2e0d7d87e55de4539192c6423c5046c',
  expectedDefaultSceneIndex: 65,
  expectedSceneCount: 298,
  sceneIndex: 297,
  sceneName: 'SHARED297_COMBINED_USER_2_IV_CORRECTED_SAUNA_U_PC90_TWO_CONDITIONAL_DRAINS_WORK_TEST_20261019',
  rootNodeIds: [1125, 1102, 3525, 1227, 3945, 2952, 2977, 3044, 3108, 3109, 3524, 3634, 3699],
};
function fixture() {
  const config = structuredClone(source);
  const original = {children: [{name: 'ORIGINAL_DEFAULT_BUILDING'}]};
  const roots = config.rootNodeIds.map(id => ({name: 'SOURCE_NODE_' + id}));
  const selected = {children: roots};
  const scenes: any[] = Array.from({length: config.expectedSceneCount}, () => ({children: []}));
  scenes[config.expectedDefaultSceneIndex] = original;
  scenes[config.sceneIndex] = selected;
  const entries = new Map(roots.map((child, i) => [child, {nodes: config.rootNodeIds[i]}]));
  const definitions: Array<{name?: string, nodes?: number[]}> =
    Array.from({length: config.expectedSceneCount}, () => ({}));
  definitions[config.sceneIndex] = {name: config.sceneName, nodes: [...config.rootNodeIds]};
  const nodes = Array.from({length: 4000}, () => ({}));
  const gltf = {
    scene: original, scenes,
    parser: {
      json: {asset: {version: '2.0',
        extras: {canonical: false, currentCandidateR730: {canonical: false}}},
        scene: 65, scenes: definitions, nodes},
      associations: entries,
    },
  };
  const identity = {
    authenticatedCandidateId: config.candidateId,
    authenticatedRawGlbSha256: config.rawGlbSha256,
  };
  return {gltf, original, selected, config, identity, roots, definitions, entries};
}
test('source-exact optional scene297 selects without changing original nodes and restores default65', () => {
  const f = fixture();
  const selector = createSharedCombinedSceneSelector(f.config);
  expect(selector.identity).toMatchObject({
    sceneIndex: 297, expectedDefaultSceneIndex: 65, expectedSceneCount: 298,
    workTestOnly: true, current: false, canonical: false, asBuilt: false,
    humanReview: 'NOT_RUN', productionPixelsVerified: false,
  });
  const lease = selector.select({gltf: f.gltf, ...f.identity});
  expect(f.gltf.scene).toBe(f.original);
  expect(lease.selectForPresentation()).toMatchObject({
    sceneIndex: 297, sourceVerified: true, productionPixelsVerified: false,
  });
  expect(f.gltf.scene).toBe(f.selected);
  expect(f.gltf.scenes[65]).toBe(f.original);
  expect(f.roots.every((child, i) => child === f.selected.children[i])).toBe(true);
  expect(lease.restoreOriginal()).toMatchObject({
    restored: true, originalDefaultSceneIndex: 65,
  });
  expect(f.gltf.scene).toBe(f.original);
});
test('wrong candidate, wrong raw SHA, missing authenticated evidence fail closed', () => {
  const f = fixture();
  const selector = createSharedCombinedSceneSelector(f.config);
  expect(() => selector.select({gltf: f.gltf,
    authenticatedCandidateId: 'wrong',
    authenticatedRawGlbSha256: source.rawGlbSha256}))
    .toThrow(/AUTHENTICATED_SOURCE_IDENTITY/);
  expect(() => selector.select({gltf: f.gltf,
    ...f.identity, authenticatedRawGlbSha256: '0'.repeat(64)}))
    .toThrow(/AUTHENTICATED_SOURCE_IDENTITY/);
  expect(() => selector.select({gltf: f.gltf}))
    .toThrow(/AUTHENTICATED_SOURCE_IDENTITY/);
  expect(f.gltf.scene).toBe(f.original);
});
test('wrong actual scene name/root order, default and noncanonical flag reject', () => {
  const f = fixture();
  const selector = createSharedCombinedSceneSelector(f.config);
  f.definitions[297].name = 'OTHER_SCENE';
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/EXACT_COMBINED_SCENE_ROOTS/);
  f.definitions[297].name = source.sceneName;
  f.definitions[297].nodes?.reverse();
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/EXACT_COMBINED_SCENE_ROOTS/);
  f.definitions[297].nodes?.reverse();
  f.gltf.parser.json.asset.extras.canonical = true;
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/ORIGINAL_NONCANONICAL_SOURCE/);
  f.gltf.parser.json.asset.extras.canonical = false;
  f.gltf.parser.json.scene = 297;
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/ORIGINAL_NONCANONICAL_SOURCE/);
  f.gltf.parser.json.scene = 65;
  f.gltf.parser.json.scenes.pop();
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/ORIGINAL_NONCANONICAL_SOURCE/);
});
test('missing source association, duplicated scene selection or external re-owner reject', () => {
  const f = fixture();
  const selector = createSharedCombinedSceneSelector(f.config);
  f.entries.delete(f.roots[0]);
  expect(() => selector.select({gltf: f.gltf, ...f.identity}))
    .toThrow(/EXACT_COMBINED_SCENE_ROOTS/);
  f.entries.set(f.roots[0], {nodes: source.rootNodeIds[0]});
  const lease = selector.select({gltf: f.gltf, ...f.identity});
  lease.selectForPresentation();
  expect(() => lease.selectForPresentation()).toThrow(/ALREADY_SELECTED_OR_EXTERNAL_OWNER/);
  f.gltf.scene = f.original;
  expect(() => lease.restoreOriginal()).toThrow(/EXTERNAL_SCENE_OWNER/);
});
test('trusted contract rejects default65, duplicate roots, missing SHA and query-derived scene names', () => {
  const config = structuredClone(source);
  config.sceneIndex = 65;
  expect(() => createSharedCombinedSceneSelector(config)).toThrow(SharedWorkTestSceneError);
  config.sceneIndex = 297;
  config.rootNodeIds[0] = config.rootNodeIds[1];
  expect(() => createSharedCombinedSceneSelector(config)).toThrow(/INVALID_SCENE_ROOTS/);
  config.rootNodeIds = [...source.rootNodeIds];
  config.rawGlbSha256 = 'QUERY_SHA';
  expect(() => createSharedCombinedSceneSelector(config)).toThrow(/INVALID_RAW_SHA/);
  config.rawGlbSha256 = source.rawGlbSha256;
  config.sceneName = 'scene=297';
  expect(() => createSharedCombinedSceneSelector(config)).toThrow(/INVALID_SCENE_NAME/);
});
