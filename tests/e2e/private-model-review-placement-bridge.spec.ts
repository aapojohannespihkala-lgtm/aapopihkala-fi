import { expect, test } from '@playwright/test';
import {
  createPlacementReviewCoordinateBridge,
  type PlacementBridgeViewerPort,
  type PlacementCoordinatePanelPort,
} from '../../src/scripts/privateModelReviewPlacementBridge';
import type { PlacementReviewContext } from '../../src/scripts/privateModelReviewPlacementDraft';

const context: PlacementReviewContext = {
  targetId: 'D_THEMO_BEDROOM',
  floor: '1F',
  approvedWallHosts: [], // Valid clicked XY may be observed without claiming a host.
};

const setup = () => {
  const calls: string[] = [];
  let activated = false;
  let floor: '1F' | '2F' | null = '1F';
  let camera = true;
  let mode: 'navigate' | 'select' | 'place' = 'place';
  let coordinate: { xM: number; yM: number } | null = { xM: 3.235, yM: 5.063 };
  let panelAccept = true;
  const panel: PlacementCoordinatePanelPort = {
    open: ({ targetId, floor }) => calls.push(`open:${targetId}:${floor}`),
    cancel: () => calls.push('cancel'),
    setClickedCoordinate: (xy, f) => {
      calls.push(`xy:${xy.xM}:${xy.yM}:${f}`);
      return panelAccept;
    },
  };
  const viewer: PlacementBridgeViewerPort = {
    canActivatePlacement: () => activated,
    getActivePlanFloor: () => floor,
    isPlanCameraActive: () => camera,
    getInteractionMode: () => mode,
    readPlanCoordinateAtClientPoint: (_x, _y) => coordinate,
    renderReviewCrosshair: (_x, _y) => calls.push('marker'),
  };
  const bridge = createPlacementReviewCoordinateBridge({ panel, viewer });
  return {
    calls,
    bridge,
    activate: () => { activated = true; },
    disable: () => { activated = false; },
    floor: (v: '1F' | '2F' | null) => { floor = v; },
    camera: (v: boolean) => { camera = v; },
    mode: (v: 'navigate' | 'select' | 'place') => { mode = v; },
    coordinate: (v: { xM: number; yM: number } | null) => { coordinate = v; },
    panelAccept: (v: boolean) => { panelAccept = v; },
  };
};

test('P137E bridge refuses production activation by default and does not draw', () => {
  const s = setup();
  expect(s.bridge.begin(context)).toBe('BLOCKED_ACTIVATION');
  expect(s.bridge.onPlanCanvasClick(22, 30)).toBe('INACTIVE');
  expect(s.calls).not.toContain('marker');
});

test('P137E bridge requires explicit place mode and correct D floor', () => {
  const s = setup();
  s.activate();
  s.mode('navigate');
  expect(s.bridge.begin(context)).toBe('NO_ACTIVE_D_FLOOR');
  s.mode('place');
  s.floor('2F');
  expect(s.bridge.begin(context)).toBe('INVALID_CONTEXT');
  s.floor('1F');
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  expect(s.bridge.hasActiveTarget()).toBe(true);
  expect(s.calls).toContain('open:D_THEMO_BEDROOM:1F');
});

test('P137E bridge keeps native XY and renders crosshair only on accepted click', () => {
  const s = setup();
  s.activate();
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  expect(s.bridge.onPlanCanvasClick(20, 40)).toBe('ACCEPTED');
  expect(s.calls.slice(-2)).toEqual(['xy:3.235:5.063:1F', 'marker']);
  s.coordinate({ xM: Number.NaN, yM: 5 });
  expect(s.bridge.onPlanCanvasClick(30, 60)).toBe('NO_COORDINATE');
  expect(s.calls.filter(x => x === 'marker')).toHaveLength(1);
  s.panelAccept(false);
  s.coordinate({ xM: 3.7, yM: 5.2 });
  expect(s.bridge.onPlanCanvasClick(30, 60)).toBe('NO_COORDINATE');
  expect(s.calls.filter(x => x === 'marker')).toHaveLength(1);
});

test('P137E bridge closes draft when changing floor, tool, camera or activation gate', () => {
  const s = setup();
  s.activate();
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  s.floor('2F');
  s.bridge.onViewerStateChange();
  expect(s.bridge.hasActiveTarget()).toBe(false);
  expect(s.bridge.onPlanCanvasClick(20, 40)).toBe('INACTIVE');
  s.floor('1F');
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  s.mode('navigate');
  expect(s.bridge.onPlanCanvasClick(20, 40)).toBe('WRONG_FLOOR_OR_MODE');
  expect(s.bridge.hasActiveTarget()).toBe(false);
  s.mode('place');
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  s.camera(false);
  s.bridge.onViewerStateChange();
  expect(s.bridge.hasActiveTarget()).toBe(false);
  s.camera(true);
  expect(s.bridge.begin(context)).toBe('ACCEPTED');
  s.disable();
  expect(s.bridge.onPlanCanvasClick(20, 40)).toBe('BLOCKED_ACTIVATION');
  expect(s.bridge.hasActiveTarget()).toBe(false);
  expect(s.calls.filter(x => x === 'marker')).toHaveLength(0);
});

test('P137E bridge rejects empty target IDs and malformed floor contexts', () => {
  const s = setup();
  s.activate();
  expect(s.bridge.begin({ ...context, targetId: '' })).toBe('INVALID_CONTEXT');
  expect(s.bridge.begin({ ...context, floor: '3F' as any })).toBe('INVALID_CONTEXT');
  expect(s.calls).not.toContain('marker');
});
