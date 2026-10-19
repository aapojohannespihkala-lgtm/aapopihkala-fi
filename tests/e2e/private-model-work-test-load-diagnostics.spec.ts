import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
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
