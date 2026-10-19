import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as ts from 'typescript';
import {
  createWorkTestLoadFailureDataset,
  formatWorkTestLoadError,
  workTestLoadFailurePhases,
  workTestLoadFailureStatusText,
} from '../../src/scripts/privateModelWorkTestLoadDiagnostics';

test('WORK_TEST load diagnostics expose the four post-1052 failure phases', () => {
  expect(workTestLoadFailurePhases).toEqual([
    'catalog-missing',
    'gltf-load-failed',
    'm5a-z2-presentation-guard-failed',
    'review-runtime-failed',
  ]);

  for (const phase of workTestLoadFailurePhases) {
    expect(workTestLoadFailureStatusText[phase]).toContain('WORK_TEST');
  }
});

test('WORK_TEST load diagnostics keep candidate id and phase machine-readable', () => {
  expect(
    createWorkTestLoadFailureDataset(
      'm5a-z2-presentation-guard-failed',
      'm5a-z2d-r1090-well-top-ground-surface',
      new Error('M5A-Z2 drainage targets or no-promotion semantics are not review-ready'),
    ),
  ).toEqual({
    workTestLoadState: 'failed',
    workTestLoadFailurePhase: 'm5a-z2-presentation-guard-failed',
    workTestLoadCandidate: 'm5a-z2d-r1090-well-top-ground-surface',
    workTestLoadError: 'M5A-Z2 drainage targets or no-promotion semantics are not review-ready',
  });
});

test('WORK_TEST load diagnostics omit unknown candidate and clamp long error text', () => {
  const dataset = createWorkTestLoadFailureDataset(
    'catalog-missing',
    null,
    'x'.repeat(300),
  );

  expect(dataset).not.toHaveProperty('workTestLoadCandidate');
  expect(dataset.workTestLoadError).toHaveLength(240);
  expect(formatWorkTestLoadError(new Error('GLB failed'))).toBe('GLB failed');
});

test('source156 exact identity is cleared on model switch without altering unrelated flags', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const declaration = '      const clearD1FSource156Identity = () => {';
  const start = source.indexOf(declaration);
  const close = source.indexOf('\n      };', start);
  expect(start).toBeGreaterThan(-1);
  expect(close).toBeGreaterThan(start);
  const originalHelper = source.slice(start, close + '\n      };'.length);
  const canvas = { dataset: {
    d1fSource156OriginalAuthenticated: 'true',
    d1fSource156OriginalSha256: 'old-source-sha',
    d1fSource156SceneIndex: '156',
    d1fSource156ProductionPixelsVerified: 'false',
    d1fSource156HumanReview: 'NOT_RUN',
    workTestReviewAutoload: 'true',
    standardViewPreset: 'd-apartment',
  } as Record<string, string> };
  runInNewContext(originalHelper + '\nclearD1FSource156Identity();', { canvas });
  expect(Object.keys(canvas.dataset).filter((key) => key.startsWith('d1fSource156'))).toEqual([]);
  expect(canvas.dataset.workTestReviewAutoload).toBe('true');
  expect(canvas.dataset.standardViewPreset).toBe('d-apartment');

  const loadStart = source.indexOf('      const applyLoadedModel = (');
  const resetAt = source.indexOf('        clearD1FSource156Identity();', loadStart);
  const autoloadClearAt = source.indexOf('        delete canvas.dataset.workTestReviewAutoload;', loadStart);
  const replaceAt = source.indexOf('        fullModelScene = gltf.scene;', loadStart);
  expect(loadStart).toBeGreaterThan(-1);
  expect(resetAt).toBeGreaterThan(loadStart);
  expect(autoloadClearAt).toBeGreaterThan(resetAt);
  expect(replaceAt).toBeGreaterThan(autoloadClearAt);
  // Only the initial successful one-link loader may set this evidence again.
  const autoloadSetAt = source.indexOf("if (loaded) canvas.dataset.workTestReviewAutoload = 'true';", replaceAt);
  expect(autoloadSetAt).toBeGreaterThan(replaceAt);
  // Correct source156 flags are subsequently set only after its authenticated load.
  const authSetterAt = source.indexOf('d1fSource156OriginalAuthenticated: \'true\'', replaceAt);
  expect(authSetterAt).toBeGreaterThan(replaceAt);
});


test('source156 seven original targets have reversible exact-loader isolation without pixel PASS', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const begin = source.indexOf('      const createD1FSource156OriginalPixelIsolation = (');
  const end = source.indexOf('      const loadD1FSource156ExactReview =', begin);
  expect(begin).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(begin);
  const code = ts.transpileModule(source.slice(begin, end), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const ids = (start: number, count: number) => Array.from({length: count}, (_, i) => start + i);
  const groups = {
    mirror305: ids(2583, 14),
    wc: [2251],
    odensvik: [2580, 2581, 2486],
    bosch: ids(2499, 27),
    'shower-glass-two-pulls': ids(2733, 37),
    'white-shelf': ids(2773, 17),
    'sauna-u': ids(2654, 53),
  };
  const all = Object.values(groups).flat();
  expect(new Set(all).size).toBe(152);
  const nodes: any[] = Array(2856);
  const roots = [2855, 2615, 2640, 2653, 2707, 2771, 2772];
  for (const root of roots) nodes[root] = {name: 'world', children: []};
  nodes[2855].name = 'SOURCE156_ROOM_MIRROR_CONDITIONAL_305MM_SOURCE_CLONE_2770_WORK_TEST';
  nodes[2771].name = 'TWO_HANDLE_SOURCE_EXACT_GLASS_REPLACEMENT_WORK_TEST_ONLY';
  nodes[2772].name = 'D1F_SHELF_PHOTO_RIGHT_SOURCE146_HOST_WORLD_Y_UP_UNSURVEYED';
  nodes[2855].children = [...groups.mirror305, ...groups.wc, ...groups.odensvik, ...groups.bosch];
  nodes[2771].children = [2732];
  nodes[2732] = {name: 'world', children: groups['shower-glass-two-pulls']};
  nodes[2772].children = groups['white-shelf'];
  nodes[2653].children = groups['sauna-u'];
  const objects = new Map<number, {name: string; visible: boolean}>();
  for (const id of all) {
    nodes[id] = {name: 'exact-fixture-node-' + id, mesh: id};
    objects.set(id, {name: nodes[id].name, visible: true});
  }
  const associations = new Map(
    [...objects].map(([id, obj]) => [obj, {nodes: id}]),
  );
  const scene = {
    traverse(cb: (object: any) => void) {
      for (const obj of objects.values()) cb(obj);
    },
    updateMatrixWorld() {},
  };
  const scenes: any[] = Array.from({length: 158}, () => ({nodes: []}));
  scenes[156] = scene;
  const jsonScenes: any[] = Array.from({length: 158}, () => ({nodes: []}));
  jsonScenes[156] = {nodes: roots};
  const gltf = {scene, scenes, parser: {
    json: {scene: 156, scenes: jsonScenes, nodes}, associations,
  }};
  const bridge: any = runInNewContext(
    code + '\ncreateD1FSource156OriginalPixelIsolation(gltf);', {gltf},
  );
  expect(bridge.targets.map((t: any) => t.key)).toEqual(Object.keys(groups));
  expect(bridge.targets.map((t: any) => t.nodeIds.length))
    .toEqual([14, 1, 3, 27, 37, 17, 53]);
  const state = bridge.setSourceVisibility('mirror305', 'HIDE');
  expect(state.productionPixelsVerified).toBe(false);
  expect(state.humanReview).toBe('NOT_RUN');
  expect(groups.mirror305.every(id => objects.get(id)!.visible === false)).toBe(true);
  expect(groups.bosch.every(id => objects.get(id)!.visible === true)).toBe(true);
  expect(() => bridge.setSourceVisibility('bosch', 'HIDE')).toThrow(/not-pristine/);
  expect(() => bridge.setSourceVisibility('bosch', 'RESTORE')).toThrow(/invalid-restore/);
  expect(() => bridge.projectSourceTargets({}, {}, 64, 64)).toThrow(/not-ready-to-project/);
  expect(bridge.setSourceVisibility('mirror305', 'RESTORE').activeHiddenCount).toBe(0);
  expect([...objects.values()].every(o => o.visible)).toBe(true);
  expect(() => bridge.setSourceVisibility('not-source', 'HIDE')).toThrow(/unknown-target/);
  bridge.setSourceVisibility('sauna-u', 'HIDE');
  expect(bridge.restore().activeHiddenCount).toBe(0);
  expect([...objects.values()].every(o => o.visible)).toBe(true);

  // Fail closed on altered scene identity, altered source node name and
  // duplicate original glTF associations. Fixture is NOT production evidence.
  jsonScenes[156].nodes = roots.slice(0, -1);
  expect(() => runInNewContext(code + '\ncreateD1FSource156OriginalPixelIsolation(gltf);', {gltf}))
    .toThrow(/scene-identity/);
  jsonScenes[156].nodes = roots;
  objects.get(2583)!.name = 'wrong-source';
  expect(() => runInNewContext(code + '\ncreateD1FSource156OriginalPixelIsolation(gltf);', {gltf}))
    .toThrow(/object-name-or-visibility/);
  objects.get(2583)!.name = nodes[2583].name;
  const priorTraverse = scene.traverse;
  scene.traverse = (cb: any) => {priorTraverse(cb); cb(objects.get(2583));};
  expect(() => runInNewContext(code + '\ncreateD1FSource156OriginalPixelIsolation(gltf);', {gltf}))
    .toThrow(/duplicate-source-node/);
});

test('source156 original-target bridge is installed only after authenticated model load and reset on switch', () => {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const loader = source.indexOf('const loadD1FSource156ExactReview =');
  const hashGuard = source.indexOf('D1F_SOURCE156_ORIGINAL_SHA_MISMATCH', loader);
  const application = source.indexOf("applyLoadedModel(gltf, 'work-test'", hashGuard);
  const install = source.indexOf('createD1FSource156OriginalPixelIsolation(d1fSource156Review.gltf)', application);
  const reset = source.indexOf('(canvas as any).d1fSource156RestoreOriginalVisibility?.();');
  expect(loader).toBeGreaterThan(-1);
  expect(hashGuard).toBeGreaterThan(loader);
  expect(application).toBeGreaterThan(hashGuard);
  expect(install).toBeGreaterThan(application);
  expect(reset).toBeGreaterThan(-1);
  expect(reset).toBeLessThan(application);
  expect(source).toContain("canvas.dataset.d1fSource156PixelIsolationReady = 'true';");
  expect(source).toContain("canvas.dataset.d1fSource156PixelIsolationReady = 'false';");
  expect(source).toContain("d1fSource156ProductionPixelsVerified: 'false'");
});
