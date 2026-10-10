import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const index = readFileSync('src/pages/private-model/index.astro', 'utf8');

test('P137E placement button stays hidden and hard-disabled until production gates pass', () => {
  expect(index).toContain('id="p137e-place-tool-button" type="button" aria-pressed="false" hidden disabled');
  expect(index).toContain('const p137ePlacementReleaseGate = (): boolean => false;');
  expect(index).toContain('p137ePlacementButton.hidden = true;');
  expect(index).toContain('p137ePlacementButton.disabled = true;');
  expect(index).toContain('p137ePlacementMount.hidden = true;');
  expect(index).toContain("if (mode === 'place' && !p137ePlacementReleaseGate()) return;");
});

test('P137E uses the existing D-floor plane raycaster and review XY crosshair', () => {
  expect(index).toContain('readPlanCoordinateAtClientPoint: (clientX, clientY) => {');
  expect(index).toContain('const xy = dReviewCoordinateAtClientPoint(clientX, clientY);');
  expect(index).toContain('return xy ? { xM: xy.xM, yM: xy.yM } : null;');
  expect(index).toContain('renderReviewCrosshair: (clientX, clientY) => setDCoordinateAnchor(clientX, clientY)');
  expect(index).toContain('bindPlacementPlanPointerEvents({ canvas, bridge: p137ePlacementBridge });');
  expect(index).toContain("if (!activePlanFloor || activeCamera !== planCamera) return null;");
});

test('P137E placement requires explicit target context and place tool activation', () => {
  expect(index).toContain('let p137eTrustedReviewContext: PlacementReviewContext | null = null;');
  expect(index).toContain('if (!p137ePlacementReleaseGate() || !p137eTrustedReviewContext || !activePlanFloor) return;');
  expect(index).toContain("setViewerToolMode('place');");
  expect(index).toContain('p137ePlacementBridge?.begin(p137eTrustedReviewContext)');
});

test('P137E resets a pending review on a plan floor/view or tool switch', () => {
  expect(index).toContain('let p137ePlacementBridge: ReturnType<typeof createPlacementReviewCoordinateBridge> | null = null;');
  expect(index.split('p137ePlacementBridge?.onViewerStateChange();').length - 1).toBeGreaterThanOrEqual(3);
  expect(index).toContain('const deactivateDCoordinateReview = () => {');
  expect(index).toContain('if (floorChanged) clearDCoordinateAnchor();');
  expect(index).toContain("type ViewerToolMode = 'navigate' | 'select' | 'place';");
});

test('P137E does not forge an authenticated G2 persistence result', () => {
  expect(index).toContain("persist: async () => { throw new Error('P137E_G2_WRITE_NOT_CONNECTED'); },");
  expect(index).toContain("readback: async () => { throw new Error('P137E_G2_READBACK_NOT_CONNECTED'); },");
  expect(index).not.toContain("status: 'PERSISTED_TO_EXISTING_G2'");
});

test('P137E leaves the established pointer selection route intact', () => {
  expect(index).toContain("canvas.addEventListener('pointerup', (event) => {");
  expect(index).toContain('if (activePlanFloor) setDCoordinateAnchor(event.clientX, event.clientY);');
  expect(index).toContain('selectAtClientPoint(event.clientX, event.clientY);');
  expect(index).toContain('canvas.dataset.interactionMode = mode;');
});
