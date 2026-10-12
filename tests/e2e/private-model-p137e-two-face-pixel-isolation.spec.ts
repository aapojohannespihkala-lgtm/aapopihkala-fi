import { expect, test } from '@playwright/test';
// @ts-ignore - isolated .mjs source uses plain JavaScript
import { inspectP137ETwoFacePixelIsolation as inspect } from
  '../../src/scripts/privateModelP137ETwoFacePixelIsolation.mjs';

// Synthetic RGBA fixtures only. These do not prove the original GLB, a
// production rendered screenshot, or a physical/approved Themo location.
const W = 110;
const H = 56;
const background = [35, 59, 82, 255] as const;
const white = [242, 242, 238, 255] as const;
const targets = {
  NORTH: [{ logicalDeviceId: 'D_THEMO_CURRENT_LOBBY_01', x: 31, y: 26, radius: 11 }],
  SOUTH: [
    { logicalDeviceId: 'D_THEMO_CURRENT_BEDROOM_01', x: 31, y: 26, radius: 11 },
    { logicalDeviceId: 'D_THEMO_CURRENT_BATHROOM_01', x: 81, y: 26, radius: 11 },
  ],
} as const;
const source = () => ({
  sceneIndex: 67, focusedRootNode: 1107,
  originalWallNode: 798, originalWallMesh: 406,
  workTestOnly: true, canonical: false, currentGeometry: false,
  asBuilt: false, publishToCURRENT: false, humanReview: 'NOT_RUN',
});
const freshPixels = () => {
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set(background, i);
  return rgba;
};
const paint = (rgba: Uint8ClampedArray, x: number, y: number, color: readonly number[]) => {
  for (let yy = y - 2; yy <= y + 2; yy++) {
    for (let xx = x - 3; xx <= x + 3; xx++) {
      rgba.set(color, (yy * W + xx) * 4);
    }
  }
};
const makeView = (side: 'NORTH' | 'SOUTH') => {
  const cameraKey = 'scene67-original-wall-' + side;
  const baseline = { width: W, height: H, cameraKey, rgba: freshPixels() };
  for (const target of targets[side]) {
    paint(baseline.rgba, target.x, target.y, white);
  }
  const hiddenFrames: Record<string, typeof baseline> = {};
  for (const target of targets[side]) {
    const hidden = { ...baseline, rgba: new Uint8ClampedArray(baseline.rgba) };
    paint(hidden.rgba, target.x, target.y, background);
    hiddenFrames[target.logicalDeviceId] = hidden;
  }
  return {
    side, width: W, height: H, cameraKey,
    projectedTargets: targets[side].map(t => ({ ...t })),
    baseline, hiddenFrames,
  };
};
const fixture = () => ({ source: source(), views: [makeView('NORTH'), makeView('SOUTH')] });
type Fixture = ReturnType<typeof fixture>;

test('scene67 two wall faces require exactly three distinct visible Themo housing deltas', () => {
  const result = inspect(fixture());
  expect(result.sourcePixelEvidencePass).toBe(true);
  expect(result.sourceOnly).toBe(true);
  expect(result.originalGlbAuthenticated).toBe(false);
  expect(result.productionScreenshotVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
  expect(result.canonical).toBe(false);
  expect(result.devices.map((d: { logicalDeviceId: string; side: string; lostHousingPixels: number }) =>
    [d.logicalDeviceId, d.side, d.lostHousingPixels])).toEqual([
    ['D_THEMO_CURRENT_LOBBY_01', 'NORTH', 35],
    ['D_THEMO_CURRENT_BEDROOM_01', 'SOUTH', 35],
    ['D_THEMO_CURRENT_BATHROOM_01', 'SOUTH', 35],
  ]);
});

test('rejects wrong original wall, scene, claimed current geometry or human approval', () => {
  for (const change of [
    { sceneIndex: 66 }, { originalWallNode: 799 },
    { originalWallMesh: 405 }, { focusedRootNode: 1106 },
    { currentGeometry: true }, { canonical: true },
    { humanReview: 'PASS' }, { publishToCURRENT: true },
  ]) {
    const f = fixture();
    Object.assign(f.source, change);
    expect(() => inspect(f)).toThrow(/source|promotion/);
  }
});

test('rejects missing/duplicate wall-side view and missing or swapped target', () => {
  const missing = fixture() as Fixture;
  missing.views = [makeView('NORTH')] as typeof missing.views;
  expect(() => inspect(missing)).toThrow(/two distinct/);
  const repeated = fixture();
  repeated.views[1] = makeView('NORTH');
  expect(() => inspect(repeated)).toThrow(/duplicate/);
  const swapped = fixture();
  swapped.views[1].projectedTargets[0].logicalDeviceId = 'D_THEMO_CURRENT_LOBBY_01';
  expect(() => inspect(swapped)).toThrow(/unknown|duplicate/);
  const noHidden = fixture();
  delete noHidden.views[1].hiddenFrames.D_THEMO_CURRENT_BEDROOM_01;
  expect(() => inspect(noHidden)).toThrow(/cardinality|missing/);
});

test('rejects a swapped hidden-device frame and missing housing delta', () => {
  const swapped = fixture();
  const south = swapped.views[1];
  south.hiddenFrames.D_THEMO_CURRENT_BEDROOM_01 =
    south.hiddenFrames.D_THEMO_CURRENT_BATHROOM_01;
  expect(() => inspect(swapped)).toThrow(/delta/);
  const unchanged = fixture();
  unchanged.views[0].hiddenFrames.D_THEMO_CURRENT_LOBBY_01 =
    { ...unchanged.views[0].baseline, rgba: new Uint8ClampedArray(unchanged.views[0].baseline.rgba) };
  expect(() => inspect(unchanged)).toThrow(/delta/);
});

test('rejects viewport/camera mismatch and changed other-device pixels', () => {
  const camera = fixture();
  camera.views[0].hiddenFrames.D_THEMO_CURRENT_LOBBY_01.cameraKey = 'other-camera';
  expect(() => inspect(camera)).toThrow(/RGBA/);
  const changedOther = fixture();
  const other = changedOther.views[1].hiddenFrames.D_THEMO_CURRENT_BEDROOM_01.rgba;
  paint(other, 81, 26, background);
  expect(() => inspect(changedOther)).toThrow(/delta/);
  const offscreen = fixture();
  Reflect.set(offscreen.views[1].projectedTargets[0], 'x', 2);
  expect(() => inspect(offscreen)).toThrow(/clipped/);
});

test('rejects colliding source ROIs and false positive from elsewhere in frame', () => {
  const collisions = fixture();
  Reflect.set(collisions.views[1].projectedTargets[1], 'x', 34);
  expect(() => inspect(collisions)).toThrow(/overlap/);
  const unrelated = fixture();
  const frame = unrelated.views[0].hiddenFrames.D_THEMO_CURRENT_LOBBY_01.rgba;
  frame.set([255, 0, 0, 255], (4 * W + 4) * 4);
  frame.set([255, 0, 0, 255], (5 * W + 5) * 4);
  frame.set([255, 0, 0, 255], (6 * W + 6) * 4);
  expect(() => inspect(unrelated)).toThrow(/delta/);
});
