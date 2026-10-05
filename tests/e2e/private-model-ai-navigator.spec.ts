import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  formatHumanYlisLook,
  formatNavigatorState,
  formatSignedYlisBounds,
  formatSignedYlisVector,
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
  expect(formatSignedYlisBounds(bounds, 1)).toBe(
    'X-2.0..+6.0 · Y-3.0..+8.0 · Z-1.0..+4.0',
  );
});

test('AI navigator vector formatting normalizes negative zero and exposes direction signs', () => {
  const value = { x: -0.0001, y: 1.234, z: -5.678 };
  expect(formatYlisVector(value)).toBe('X 0.00  Y 1.23  Z -5.68');
  expect(formatSignedYlisVector(value)).toBe('X+0.00 Y+1.23 Z-5.68');
});

test('AI navigator turns a precise look vector into a compact human direction', () => {
  expect(formatHumanYlisLook({ x: -0.61, y: -0.66, z: -0.55 })).toBe(
    'SW · 31° DOWN',
  );
  expect(formatHumanYlisLook({ x: 0, y: 1, z: 0 })).toBe('N · LEVEL');
  expect(formatHumanYlisLook({ x: 0, y: 0, z: 1 })).toBe('UP');
});

test('AI navigator only surfaces exceptional viewer state', () => {
  expect(
    formatNavigatorState({
      clipZM: 2.75,
      objectMode: 'isolate',
      roofVisible: true,
      roofOpacity: 0.2,
    }),
  ).toBe('CLIP Z≤+2.75 · ISOLATE · ROOF 20%');

  expect(
    formatNavigatorState({
      clipZM: null,
      objectMode: null,
      roofVisible: true,
      roofOpacity: 1,
    }),
  ).toBe('');
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

  const orientationSource = readFileSync(
    new URL('../../src/scripts/privateModelOrientationGizmo.ts', import.meta.url),
    'utf8',
  );

  expect(source.match(/id="ai-navigator-readout"/g) ?? []).toHaveLength(0);
  expect(orientationSource.match(/readout\.id = 'ai-navigator-readout'/g) ?? []).toHaveLength(1);
  expect(orientationSource).toContain("title.textContent = 'YLIS-G1-LOCAL · m'");
  expect(orientationSource).toContain("createReadoutRow('MODEL')");
  expect(orientationSource).toContain("createReadoutRow('VIEW')");
  expect(orientationSource).toContain("createReadoutRow('LOOK')");
  expect(orientationSource).toContain("createReadoutRow('CAM')");
  expect(orientationSource).toContain("createReadoutRow('TARGET')");
  expect(orientationSource).toContain("createReadoutRow('FRAME')");
  expect(orientationSource).toContain("createReadoutRow('STATE', true)");
  expect(orientationSource).toContain("createReadoutRow('PIN', true)");
  expect(orientationSource).toContain("const preset = canvas.dataset.viewPreset ?? 'orbit'");
  expect(orientationSource).toContain('PERSPECTIVE');
  expect(orientationSource).toContain('camera.position');
  expect(orientationSource).toContain('canvas.dataset.reviewAnchorX');
  expect(orientationSource).toContain("readout.dataset.frame = 'YLIS-G1-LOCAL'");
  expect(orientationSource).toContain('readout.dataset.lookVector = lookVectorLabel');
  expect(orientationSource).toContain('readout.dataset.camera = cameraLabel');
  expect(orientationSource).toContain('readout.dataset.target = targetLabel');
  expect(orientationSource).toContain('readout.dataset.frameBounds = frameLabel');
  expect(orientationSource).toContain("readout.dataset.frameBasis = 'camera-target-plane'");
  expect(orientationSource).toContain('readout.dataset.center = targetLabel');
  expect(orientationSource).toContain('readout.dataset.visibleBounds = frameLabel');
});
