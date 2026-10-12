import { expect, test } from '@playwright/test';
import { m5bCurrentVerticalDownspoutProxyIds } from '../../src/scripts/privateModelM5BReviewPresentation';
// @ts-ignore - isolated pixel helper is an untyped ESM module.
import {
  inspectM5BScene60FivePixelIsolation as inspect,
  m5bScene60ProxyIds,
} from '../../src/scripts/privateModelM5BScene60PixelIsolation.mjs';

// Synthetic canvas evidence only, not the authenticated original scene60 GLB,
// production viewer, actual five physical downspouts, or HUMAN_REVIEW approval.
const W = 128;
const H = 88;
const ys = 40;
const xs = [18, 40, 62, 84, 106];
const background = [30, 43, 51, 255] as const;
const blue = [56, 158, 224, 255] as const;
const ids = [...m5bCurrentVerticalDownspoutProxyIds];
const source = () => ({
  sceneIndex: 60,
  candidateId: 'm5b-z2r-roof-stormwater-structural-rebuilt',
  reviewId: 'm5b-roof-stormwater-current-review',
  presentation: 'WORK_TEST_VIEW',
  targetKind: 'THICK_VISIBLE_TUBE_PROXY',
  exactXYClaim: false, exactZClaim: false,
  currentGeometryClaim: false, asBuiltClaim: false,
  canonical: false, publishToCURRENT: false, humanReview: 'NOT_RUN',
});
const fresh = () => {
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set(background, i);
  return rgba;
};
const paint = (rgba: Uint8ClampedArray, x: number, color: readonly number[]) => {
  for (let y = ys - 5; y <= ys + 5; y++) {
    for (let xx = x - 2; xx <= x + 2; xx++) {
      rgba.set(color, (y * W + xx) * 4);
    }
  }
};
const frame = (rgba: Uint8ClampedArray) =>
  ({ width: W, height: H, cameraKey: 'original-scene60-current-proxy-camera', rgba });
const fixture = () => {
  const baseline = frame(fresh());
  for (const x of xs) paint(baseline.rgba, x, blue);
  const hiddenFrames: Record<string, ReturnType<typeof frame>> = {};
  ids.forEach((id, i) => {
    const hidden = frame(new Uint8ClampedArray(baseline.rgba));
    paint(hidden.rgba, xs[i], background);
    hiddenFrames[id] = hidden;
  });
  return {
    source: source(),
    view: {
      width: W, height: H, cameraKey: baseline.cameraKey,
      projectedTargets: ids.map((logicalProxyId, i) =>
        ({ logicalProxyId, x: xs[i], y: ys, radius: 8 })),
      baseline, hiddenFrames,
    },
  };
};

test('scene60 pixel isolation contract follows the five live 3D presentation IDs', () => {
  expect([...m5bScene60ProxyIds]).toEqual(ids);
  const proof = inspect(fixture());
  expect(proof.allFiveProxyPixelDeltasPresent).toBe(true);
  expect(proof.devices).toEqual(ids.map(logicalProxyId => ({ logicalProxyId, lostBluePixels: 55 })));
  expect(proof).toMatchObject({
    sourceOnly: true, originalGlbAuthenticated: false,
    productionViewerAutoloadVerified: false, productionScreenshotVerified: false,
    canonical: false, asBuilt: false, humanReview: 'NOT_RUN',
  });
});

test('five separate actual Chromium canvas RGBA images prove one-by-one blue deltas', async ({ page }) => {
  const pixels = await page.evaluate((positions) => {
    const render = (hiddenIndex: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 88;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Chromium RGBA canvas missing');
      ctx.fillStyle = '#1e2b33';
      ctx.fillRect(0, 0, 128, 88);
      positions.forEach((x, i) => {
        if (i !== hiddenIndex) {
          ctx.fillStyle = '#389ee0';
          ctx.fillRect(x - 2, 35, 5, 11);
        }
      });
      return Array.from(ctx.getImageData(0, 0, 128, 88).data);
    };
    return [render(-1), ...positions.map((_, i) => render(i))];
  }, xs);
  const evidence = fixture();
  evidence.view.baseline.rgba = Uint8ClampedArray.from(pixels[0]);
  ids.forEach((id, i) => {
    evidence.view.hiddenFrames[id].rgba = Uint8ClampedArray.from(pixels[i + 1]);
  });
  expect(inspect(evidence).devices.map((d: { lostBluePixels: number }) => d.lostBluePixels))
    .toEqual([55, 55, 55, 55, 55]);
});

test('fails if the fifth pipe does not produce its own screenshot delta', () => {
  const evidence = fixture();
  paint(evidence.view.baseline.rgba, xs[4], background);
  expect(() => inspect(evidence)).toThrow(/missing, swapped or nonlocal/);
});

test('fails a swapped hide-frame, same camera mismatch, or an unbound source', () => {
  const swapped = fixture();
  swapped.view.hiddenFrames[ids[0]] = swapped.view.hiddenFrames[ids[1]];
  expect(() => inspect(swapped)).toThrow(/missing, swapped or nonlocal/);
  const camera = fixture();
  camera.view.hiddenFrames[ids[0]].cameraKey = 'different-camera';
  expect(() => inspect(camera)).toThrow(/camera/);
  const unsafe = fixture();
  unsafe.source.humanReview = 'PASS';
  expect(() => inspect(unsafe)).toThrow(/source|promotion/);
  const wrongScene = fixture();
  wrongScene.source.sceneIndex = 63;
  expect(() => inspect(wrongScene)).toThrow(/source|promotion/);
});

test('fails missing, duplicate, shifted or overlapping source-projected targets', () => {
  const missing = fixture();
  missing.view.projectedTargets.pop();
  expect(() => inspect(missing)).toThrow(/cardinality/);
  const duplicate = fixture();
  duplicate.view.projectedTargets[4].logicalProxyId = ids[0];
  expect(() => inspect(duplicate)).toThrow(/duplicate/);
  const shifted = fixture();
  shifted.view.projectedTargets[3].x = 4;
  expect(() => inspect(shifted)).toThrow(/clipped/);
  const overlap = fixture();
  overlap.view.projectedTargets[3].x = overlap.view.projectedTargets[2].x + 1;
  expect(() => inspect(overlap)).toThrow(/overlapping/);
});

test('fails unrelated blue-background changes outside a target ROI', () => {
  const evidence = fixture();
  const hidden = evidence.view.hiddenFrames[ids[2]].rgba;
  hidden.set(blue, (4 * W + 4) * 4);
  hidden.set(blue, (5 * W + 4) * 4);
  hidden.set(blue, (6 * W + 4) * 4);
  expect(() => inspect(evidence)).toThrow(/nonlocal/);
});
