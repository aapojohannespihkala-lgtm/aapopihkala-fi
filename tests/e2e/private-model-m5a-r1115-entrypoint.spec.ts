import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const source = readFileSync('src/pages/private-model/index.astro', 'utf8');

test('R1115 exact scene64 review entrypoint uses the guarded selector before model apply', () => {
  expect(source).toContain('m5aR1115CandidateId');
  expect(source).toContain('m5aR1115ReviewId');
  expect(source).toContain('selectM5AR1115ReviewScene');

  const detectIndex = source.indexOf(
    "candidate.id === m5aR1115CandidateId &&\n            isPrivateModelReviewRequested(window.location.search, m5aR1115ReviewId)",
  );
  const selectIndex = source.indexOf('const selectedReview = selectM5AR1115ReviewScene(gltf);');
  const applyIndex = source.indexOf("applyLoadedModel(gltf, 'work-test'");

  expect(detectIndex).toBeGreaterThan(-1);
  expect(selectIndex).toBeGreaterThan(detectIndex);
  expect(applyIndex).toBeGreaterThan(selectIndex);
});

test('R1115 runtime state drives drainage preset, dataset and target-bounds camera fail closed', () => {
  expect(source).toContain(
    'Object.assign(canvas.dataset, m5aR1115RuntimeState.dataset);',
  );
  expect(source).toContain(
    'applyStandardViewPreset(m5aR1115RuntimeState.standardViewPreset);',
  );
  expect(source).toContain(
    'focusM5AReviewCamera(m5aR1115RuntimeState.targetBounds)',
  );
  expect(source).toContain(
    "canvas.dataset.m5aR1115ReviewCameraFocusApplied = String(cameraFocusApplied);",
  );
  expect(source).toContain(
    "throw new Error('M5A R1115 review target-bounds camera focus failed');",
  );
  expect(source).toContain(
    'status.textContent = m5aR1115RuntimeState.statusText;',
  );
});
