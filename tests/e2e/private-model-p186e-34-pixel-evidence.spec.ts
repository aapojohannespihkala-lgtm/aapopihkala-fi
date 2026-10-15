import { expect, test } from '@playwright/test';
import {
  verifyP186E34SourcePixelEvidence as verify,
  p186ePixelCandidateId as exactCandidateId,
  p186ePixelExpected as counts,
  p186ePixelSourcePdfDriveId as graphic,
  p186ePixelSchedulePdfDriveId as schedule,
  p186ePixelRepresentationKinds as kinds,
} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';

const sourceCandidateId = exactCandidateId;
const W = 160, H = 112;
type Floor = 'D1F' | 'D2F';
const paint = (frame: Uint8Array, x: number, y: number, rgba: number[]) =>
  frame.set(rgba, (y * W + x) * 4);
const blank = (floor: Floor) => {
  const pixels = new Uint8Array(W * H * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([32, 38, 43, 255], i);
  return { width: W, height: H, pixels, floor,
    cameraKey: floor + '_source_camera', sceneKey: floor + '_historical_scene',
    sourceCandidateId };
};
function floorData(floor: Floor) {
  const expected = counts[floor];
  const baseline = blank(floor);
  const targets = Array.from({ length: expected.total }, (_, n) => {
    const kind: 'group' | 'special' = n < expected.group ? 'group' : 'special';
    const roi = { x: 8 + n % 6 * 23, y: 8 + Math.floor(n / 6) * 23,
      width: 10, height: 10 };
    for (let y = roi.y; y < roi.y + roi.height; y++)
      for (let x = roi.x; x < roi.x + roi.width; x++)
        paint(baseline.pixels, x, y, [255, 190, 20, 255]);
    return {
      sourceKey: floor + '_SOURCE_LABEL_' + String(n + 1).padStart(2, '0'),
      kind, representationKind: kinds[kind],
      sourcePdfDriveId: graphic,
      schedulePdfDriveId: kind === 'group' ? schedule : null,
      roi, presentationOnly: true, sourceDerived: true,
      currentGeometryClaim: false, asBuilt: false, canonical: false,
      publishToCURRENT: false, humanReview: 'NOT_RUN',
    };
  });
  const hiddenFrames: Record<string, ReturnType<typeof blank>> = {};
  for (const target of targets) {
    const pixels = Uint8Array.from(baseline.pixels);
    for (let y = target.roi.y; y < target.roi.y + target.roi.height; y++)
      for (let x = target.roi.x; x < target.roi.x + target.roi.width; x++)
        paint(pixels, x, y, [32, 38, 43, 255]);
    hiddenFrames[target.sourceKey] = { ...baseline, pixels };
  }
  return { floor, cameraKey: baseline.cameraKey, sceneKey: baseline.sceneKey,
    baseline, targets, hiddenFrames };
}
const fixture = () => ({
  sourceCandidateId,
  floors: [floorData('D1F'), floorData('D2F')],
});
const check = (input: unknown) => verify(input as any);

test('34 separate historic source labels pass synthetic RGBA isolation, never production', () => {
  const value = check(fixture());
  expect(value.D1F).toMatchObject({ targets: 18, groups: 14, special: 4,
    visuallyIsolated: 18 });
  expect(value.D2F).toMatchObject({ targets: 16, groups: 15, special: 1,
    visuallyIsolated: 16 });
  expect([...value.D1F.identities, ...value.D2F.identities].every((i: any) =>
    i.lostAmberPixels === 100 && i.outsidePixelChanges === 0)).toBe(true);
  expect(value).toMatchObject({ status: 'SUPPLIED_PIXELS_SOURCE_ONLY_PASS',
    targetCount: 34, sourceAuthenticated: false,
    productionScreenshotVerified: false, humanReview: 'NOT_RUN',
    currentGeometry: false, canonical: false, asBuilt: false });
});

test('missing, duplicate or wrong-count floors are rejected', () => {
  const missing = fixture(); missing.floors.pop();
  expect(() => check(missing)).toThrow('source or proof configuration');
  const duplicate = fixture(); duplicate.floors[1] = duplicate.floors[0];
  expect(() => check(duplicate)).toThrow('floor/source-camera');
  const count = fixture(); count.floors[1].targets.pop();
  expect(() => check(count)).toThrow('floor target count');
});

test('duplicate source keys or injected current-geometry metadata are rejected', () => {
  const dup = fixture();
  dup.floors[0].targets[1].sourceKey = dup.floors[0].targets[0].sourceKey;
  expect(() => check(dup)).toThrow('original ID');
  for (const changed of [
    { sourcePdfDriveId: 'wrong-source' }, { currentGeometryClaim: true },
    { asBuilt: true }, { canonical: true }, { publishToCURRENT: true },
    { humanReview: 'PASS' }, { exactXYClaim: true },
  ]) {
    const item = fixture();
    Object.assign(item.floors[1].targets[0], changed);
    expect(() => check(item)).toThrow('historical source target');
  }
});

test('wrong group/special class, count and hidden roster cannot pass', () => {
  const mismatch = fixture();
  (mismatch.floors[0].targets[0] as any).kind = 'special';
  expect(() => check(mismatch)).toThrow('historical source target');
  const missing = fixture();
  delete missing.floors[0].hiddenFrames[missing.floors[0].targets[0].sourceKey];
  expect(() => check(missing)).toThrow('hidden frame');
  const forged = fixture();
  forged.floors[0].hiddenFrames.FORGED_SOURCE = forged.floors[0].baseline;
  expect(() => check(forged)).toThrow('hidden frame');
});

test('swapped target-hidden frames and invisible targets are rejected', () => {
  const switched = fixture();
  const [one, two] = switched.floors[0].targets;
  switched.floors[0].hiddenFrames[one.sourceKey] =
    switched.floors[0].hiddenFrames[two.sourceKey];
  expect(() => check(switched)).toThrow('not individually visible');
  const invisible = fixture();
  const target = invisible.floors[1].targets[0].sourceKey;
  invisible.floors[1].hiddenFrames[target] = {
    ...invisible.floors[1].baseline,
    pixels: Uint8Array.from(invisible.floors[1].baseline.pixels),
  };
  expect(() => check(invisible)).toThrow('not individually visible');
});

test('overlapping or off-canvas source-label ROI cannot prove visibility', () => {
  const overlap = fixture();
  overlap.floors[0].targets[1].roi = { ...overlap.floors[0].targets[0].roi };
  expect(() => check(overlap)).toThrow('overlapping');
  const off = fixture(); off.floors[1].targets[1].roi.x = W - 2;
  expect(() => check(off)).toThrow('ROI');
});

test('camera, scene, width and target identity must match in every frame', () => {
  const camera = fixture();
  camera.floors[0].hiddenFrames[camera.floors[0].targets[0].sourceKey].cameraKey =
    'ANOTHER_CAMERA';
  expect(() => check(camera)).toThrow('frame provenance');
  const scene = fixture(); scene.floors[0].baseline.sceneKey = 'ANOTHER_SCENE';
  expect(() => check(scene)).toThrow('frame provenance');
  const width = fixture();
  width.floors[1].hiddenFrames[width.floors[1].targets[0].sourceKey].width = W + 1;
  expect(() => check(width)).toThrow('frame provenance');
});

test('partially occupied source-label ROI accepts genuine loss without new amber', () => {
  const item = fixture();
  const first = item.floors[0].targets[0];
  const { x, y } = first.roi;
  // Preserve a 5x5 unoccupied patch inside the label ROI.
  for (let row = y; row < y + 5; row++)
    for (let col = x + 5; col < x + 10; col++) {
      paint(item.floors[0].baseline.pixels, col, row, [32, 38, 43, 255]);
      // Every hidden frame uses the same edited baseline except its own
      // selectively hidden target. Other labels must not reappear here.
      for (const [key, frame] of Object.entries(item.floors[0].hiddenFrames))
        if (key !== first.sourceKey)
          paint(frame.pixels, col, row, [32, 38, 43, 255]);
    }
  const result = check(item);
  expect(result.D1F.identities[0]).toMatchObject({
    lostAmberPixels: 75, gainedAmberPixels: 0, outsidePixelChanges: 0,
  });
});

test('moved source-label amber within the same ROI fails even when old pixels disappear', () => {
  const item = fixture();
  const first = item.floors[0].targets[0];
  const { x, y } = first.roi;
  const hidden = item.floors[0].hiddenFrames[first.sourceKey];
  // One 5x5 patch moves from previously amber pixels to empty space.
  // 75 source pixels still vanish and no pixel changes outside this ROI.
  for (let row = y; row < y + 5; row++)
    for (let col = x + 5; col < x + 10; col++) {
      paint(item.floors[0].baseline.pixels, col, row, [32, 38, 43, 255]);
      paint(hidden.pixels, col, row, [255, 190, 20, 255]);
      // Isolate the deliberate gain to the first hidden target frame.
      for (const [key, frame] of Object.entries(item.floors[0].hiddenFrames))
        if (key !== first.sourceKey)
          paint(frame.pixels, col, row, [32, 38, 43, 255]);
    }
  expect(() => check(item)).toThrow('gained amber pixels');
});

test('outside-ROI pixel alterations are rejected even if target is isolated', () => {
  const item = fixture();
  const target = item.floors[0].targets[0].sourceKey;
  paint(item.floors[0].hiddenFrames[target].pixels, W - 2, H - 2,
    [255, 0, 255, 255]);
  expect(() => check(item)).toThrow('outside-ROI');
});


test('rejects a forged or historically aliased WORK_TEST candidate even with 34 valid RGBA deltas', () => {
  const forged = fixture();
  forged.sourceCandidateId = 'p186e-x1-historical-source-work-test';
  for (const floor of forged.floors) {
    floor.baseline.sourceCandidateId = forged.sourceCandidateId;
    for (const hidden of Object.values(floor.hiddenFrames))
      hidden.sourceCandidateId = forged.sourceCandidateId;
  }
  expect(() => check(forged)).toThrow('source or proof configuration');
  const unrelated = fixture();
  unrelated.sourceCandidateId = 'p137e-d1f-three-wall-mounted-themos';
  expect(() => check(unrelated)).toThrow('source or proof configuration');
  const valid = check(fixture());
  expect(valid.sourceAuthenticated).toBe(false);
  expect(valid.productionScreenshotVerified).toBe(false);
});

function sparseFixture(lostPixels: number) {
  const input = fixture();
  for (const floor of input.floors) {
    for (const target of floor.targets) {
      for (let y = target.roi.y; y < target.roi.y + target.roi.height; y++)
        for (let x = target.roi.x; x < target.roi.x + target.roi.width; x++)
          paint(floor.baseline.pixels, x, y, [32, 38, 43, 255]);
      for (let n = 0; n < lostPixels; n++)
        paint(floor.baseline.pixels, target.roi.x + n % target.roi.width,
          target.roi.y + Math.floor(n / target.roi.width), [255, 190, 20, 255]);
    }
    for (const target of floor.targets) {
      const pixels = Uint8Array.from(floor.baseline.pixels);
      for (let y = target.roi.y; y < target.roi.y + target.roi.height; y++)
        for (let x = target.roi.x; x < target.roi.x + target.roi.width; x++)
          paint(pixels, x, y, [32, 38, 43, 255]);
      floor.hiddenFrames[target.sourceKey] = { ...floor.baseline, pixels };
    }
  }
  return input;
}


test('partly hidden amber source label cannot pass with 4 or 99 pixels lost', () => {
  for (const lostCount of [4, 99]) {
    const input = fixture();
    const session = input.floors[0];
    const target = session.targets[0];
    const hidden = session.hiddenFrames[target.sourceKey];
    let index = 0;
    for (let y = target.roi.y; y < target.roi.y + target.roi.height; y++) {
      for (let x = target.roi.x; x < target.roi.x + target.roi.width; x++) {
        if (index++ >= lostCount) {
          // Keep some original source-label amber despite enough actual loss.
          paint(hidden.pixels, x, y, [255, 190, 20, 255]);
        }
      }
    }
    expect(() => check(input)).toThrow('source label still amber');
  }
  // Fully removing the same 100-pixel original label remains valid.
  const valid = check(fixture());
  expect(valid.targetCount).toBe(34);
  expect(valid.productionScreenshotVerified).toBe(false);
});

test('callers cannot reduce four-pixel visibility floor for any of the 34 targets', () => {
  for (const minLostPixels of [0, 1, 2, 3, NaN, Infinity, 4.5]) {
    expect(() => check({ ...sparseFixture(3), minLostPixels }))
      .toThrow('source or proof configuration');
  }
  expect(() => check(sparseFixture(3))).toThrow('not individually visible');
  const boundary = check(sparseFixture(4));
  expect([...boundary.D1F.identities, ...boundary.D2F.identities]
    .every((target: any) => target.lostAmberPixels === 4)).toBe(true);
  expect(boundary.productionScreenshotVerified).toBe(false);
});

test('stronger caller floors remain effective and retain no-promotion flags', () => {
  const stronger = check({ ...sparseFixture(5), minLostPixels: 5 });
  expect(stronger.targetCount).toBe(34);
  expect(stronger).toMatchObject({ sourceAuthenticated: false,
    productionScreenshotVerified: false, humanReview: 'NOT_RUN',
    currentGeometry: false, canonical: false, asBuilt: false });
  expect(() => check({ ...sparseFixture(5), minLostPixels: 6 }))
    .toThrow('not individually visible');
});

test('callers cannot allow unrelated outside-ROI changes despite valid target loss', () => {
  const input = fixture();
  const floor = input.floors[0];
  paint(floor.hiddenFrames[floor.targets[0].sourceKey].pixels,
    W - 2, H - 2, [255, 0, 255, 255]);
  for (const maxOutsidePixelChanges of [1, 2, 100, NaN, Infinity, -1]) {
    expect(() => check({ ...input, maxOutsidePixelChanges }))
      .toThrow('source or proof configuration');
  }
  expect(() => check({ ...input, maxOutsidePixelChanges: 0 }))
    .toThrow('outside-ROI');
  expect(check({ ...fixture(), maxOutsidePixelChanges: 0 }).targetCount).toBe(34);
});
