import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
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

test('missing one-link WORK_TEST review records a structured catalog failure', () => {
  const pageSource = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );
  const initialAutoload = pageSource.slice(pageSource.lastIndexOf('void (async () => {'));

  expect(initialAutoload).toContain("if (canvas.dataset.workTestImport !== 'failed')");
  expect(initialAutoload).toMatch(
    /createWorkTestLoadFailureDataset\(\s*'catalog-missing',\s*reviewCandidateId,/,
  );
  expect(initialAutoload).toContain("canvas.dataset.workTestCatalog === 'unavailable'");
  expect(initialAutoload).toContain("Requested WORK_TEST candidate absent from catalog");
  expect(initialAutoload).toContain("WORK_TEST catalog request unavailable");

  const failure = createWorkTestLoadFailureDataset(
    'catalog-missing',
    'm5a-z2d-r1090-well-top-ground-surface',
    new Error('Requested WORK_TEST candidate absent from catalog'),
  );
  expect(failure).toMatchObject({
    workTestLoadState: 'failed',
    workTestLoadFailurePhase: 'catalog-missing',
    workTestLoadCandidate: 'm5a-z2d-r1090-well-top-ground-surface',
    workTestLoadError: 'Requested WORK_TEST candidate absent from catalog',
  });
});
