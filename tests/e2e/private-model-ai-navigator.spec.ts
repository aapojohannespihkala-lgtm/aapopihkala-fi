import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  formatYlisBounds,
  formatYlisVector,
  viewerBoundsToYlis,
  viewerWorldToYlis,
} from '../../src/scripts/privateModelAiNavigator';

test('AI navigator maps Three world axes into YLIS-G1-LOCAL axes', () => {
  expect(viewerWorldToYlis({ x: 1, y: 0, z: 0 })).toEqual({ x: 1, y: 0, z: 0 });
  expect(viewerWorldToYlis({ x: 0, y: 0, z: -1 })).toEqual({ x: 0, y: 1, z: 0 });
  expect(viewerWorldToYlis({ x: 0, y: 1, z: 0 })).toEqual({ x: 0, y: 0, z: 1 });
});

test('AI navigator converts world bounds without losing the inverted Y extent', () => {
  const bounds = viewerBoundsToYlis(
    { x: -2, y: -1, z: -8 },
    { x: 6, y: 4, z: 3 },
  );

  expect(bounds).toEqual({
    min: { x: -2, y: -3, z: -1 },
    max: { x: 6, y: 8, z: 4 },
  });
  expect(formatYlisBounds(bounds)).toBe(
    'X -2.00..6.00  Y -3.00..8.00  Z -1.00..4.00',
  );
});

test('AI navigator vector formatting normalizes negative zero', () => {
  expect(formatYlisVector({ x: -0.0001, y: 1.234, z: -5.678 })).toBe(
    'X 0.00  Y 1.23  Z -5.68',
  );
});


test('viewer route wires explicit navigation and selection mode plus visible AI context', () => {
  const source = readFileSync(
    new URL('../../src/pages/private-model/index.astro', import.meta.url),
    'utf8',
  );

  expect(source).toContain('id="navigate-tool-button"');
  expect(source).toContain('id="selection-tool-button"');
  expect(source).toContain("canvas.dataset.interactionMode = 'navigate'");
  expect(source).toContain("selectionToolButton.addEventListener('click', () => setViewerToolMode('select'))");
  expect(source).toContain("navigateToolButton.addEventListener('click', () => setViewerToolMode('navigate'))");
  expect(source).toContain('id="ai-nav-frame"');
  expect(source).toContain('id="ai-nav-model"');
  expect(source).toContain('id="ai-nav-view"');
  expect(source).toContain('id="ai-nav-look"');
  expect(source).toContain('id="ai-nav-center"');
  expect(source).toContain('id="ai-nav-bounds"');
});
