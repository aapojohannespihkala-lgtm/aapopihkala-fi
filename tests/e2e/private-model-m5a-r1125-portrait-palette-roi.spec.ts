import { expect, test } from '@playwright/test';
// @ts-ignore - standalone source-pixel detector has no TypeScript declaration
import {
  detectM5AR1125SourceProjectedPixels as detect,
  m5aR1125SourcePixelKinds,
} from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// Synthetic viewport regression only. These centers are not measured from
// original scene63 geometry, nor are these authenticated production pixels.
// In particular, an all-visible source-palette count is NOT a review PASS.
const keys = Object.keys(m5aR1125SourcePixelKinds);
const normalizedCenters: ReadonlyArray<readonly [number, number]> = [
  [0.15, 0.12], [0.35, 0.12], [0.55, 0.12], [0.75, 0.12], // four wells
  [0.15, 0.34], [0.205, 0.34], // first nearby cyan route pair
  [0.45, 0.34], [0.505, 0.34], // second nearby cyan route pair
  [0.75, 0.34], [0.25, 0.60], [0.65, 0.60], // other cyan routes
  [0.25, 0.82], [0.65, 0.82], // unresolved boundaries
];
const centers = (separated = false) => keys.map((key, index) => {
  const [u, v] = normalizedCenters[index]!;
  return {
    key,
    u: separated && (index === 5 || index === 7) ? u + 0.04 : u,
    v,
  };
});
const rgba = (width: number, height: number, points: ReturnType<typeof centers>) => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels.set([245, 249, 251, 255], offset);
  }
  points.forEach(({ u, v }, index) => {
    const x = Math.round(u * (width - 1));
    const y = Math.round(v * (height - 1));
    const color = index < 4 ? [160, 172, 180, 255] :
      index < 11 ? [25, 180, 220, 255] : [235, 181, 36, 255];
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        pixels.set(color, ((y + dy) * width + x + dx) * 4);
      }
    }
  });
  return pixels;
};

test('R1125 portrait 900x1600 rejects two overlapping cyan route ROI pairs even when all 13 palettes have pixels', () => {
  expect(keys).toHaveLength(13);
  const points = centers();
  const proof = detect(rgba(900, 1600, points), 900, 1600, points);
  expect(proof.radiusPx).toBe(32);
  expect(proof.requiredCounts).toEqual({
    wellGray: 4, routeCyan: 7, boundaryYellow: 2,
  });
  expect(proof.missingKeys).toEqual([]);
  expect(proof.sourceRoiPixels.every(
    (target: { classPixels: number; minimumPixels: number }) =>
      target.classPixels >= target.minimumPixels,
  )).toBe(true);
  expect(proof.ambiguousSourceKeys).toEqual([keys[4], keys[5], keys[6], keys[7]]);
  expect(proof.allSourceTargetsVisible).toBe(false);
  expect(proof.productionProvenanceVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('R1125 wider 1000x700 synthetic projection clears both same-palette pairs without weakening pixel floors', () => {
  const points = centers();
  const proof = detect(rgba(1000, 700, points), 1000, 700, points);
  expect(proof.radiusPx).toBe(25);
  expect(proof.ambiguousSourceKeys).toEqual([]);
  expect(proof.missingKeys).toEqual([]);
  expect(proof.sourceRoiPixels.map((target: { classPixels: number }) =>
    target.classPixels,
  )).toEqual(Array(13).fill(25));
  expect(proof.allSourceTargetsVisible).toBe(true);
  expect(proof.productionProvenanceVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('R1125 portrait only clears after actual supplied centers are sufficiently separated', () => {
  const points = centers(true);
  const proof = detect(rgba(900, 1600, points), 900, 1600, points);
  expect(proof.radiusPx).toBe(32);
  expect(proof.ambiguousSourceKeys).toEqual([]);
  expect(proof.missingKeys).toEqual([]);
  expect(proof.allSourceTargetsVisible).toBe(true);
  expect(proof.productionProvenanceVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});
