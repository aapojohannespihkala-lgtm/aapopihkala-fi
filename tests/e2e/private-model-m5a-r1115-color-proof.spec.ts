import { expect, test } from '@playwright/test';
// Pure screenshot-pixel detector: no browser credentials or production access required.
// @ts-ignore - JavaScript module without a TypeScript declaration
import { detectM5AR1115OrangeMarkerComponents as detect } from '../../src/scripts/privateModelR1115OrangeMarkerProof.mjs';

const image = (width = 120, height = 60) => {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([32, 42, 52, 255], i);
  return { rgba, width, height };
};

const rectangle = (
  frame: ReturnType<typeof image>,
  x: number,
  y: number,
  w = 6,
  h = 5,
  color = [240, 122, 28, 255],
) => {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      frame.rgba.set(color, ((y + dy) * frame.width + x + dx) * 4);
    }
  }
};

const two = () => {
  const frame = image();
  rectangle(frame, 18, 18);
  rectangle(frame, 82, 24);
  return frame;
};

test('R1115 proof counts exactly two independent orange planned-raise marker components', () => {
  const frame = two();
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.requiredCount).toBe(2);
  expect(result.componentCount).toBe(2);
  expect(result.qualifyingColorPixels).toBe(60);
  expect(result.components.map((c: any) => c.pixels)).toEqual([30, 30]);
  expect(result.components.map((c: any) => c.minX)).toEqual([18, 82]);
});

test('R1115 proof fails closed when one marker is missing or two markers merge', () => {
  const missing = image();
  rectangle(missing, 18, 18);
  expect(detect(missing.rgba, missing.width, missing.height).componentCount).toBe(1);

  const merged = two();
  rectangle(merged, 24, 18, 59, 11);
  expect(detect(merged.rgba, merged.width, merged.height).componentCount).toBe(1);
});

test('R1115 proof ignores non-orange review/context colors and tiny orange noise', () => {
  const frame = two();
  rectangle(frame, 3, 3, 1, 1);
  rectangle(frame, 8, 42, 20, 8, [255, 215, 40, 255]);
  rectangle(frame, 36, 42, 20, 8, [220, 40, 35, 255]);
  rectangle(frame, 64, 42, 20, 8, [0, 234, 255, 255]);
  rectangle(frame, 92, 42, 20, 8, [130, 130, 130, 255]);

  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.componentCount).toBe(2);
  expect(result.qualifyingColorPixels).toBe(61);
});

test('R1115 proof tolerates alpha-blended antialiasing and rejects invalid dimensions', () => {
  const frame = two();
  rectangle(frame, 82, 24, 6, 5, [202, 105, 39, 255]);
  expect(detect(frame.rgba, frame.width, frame.height).componentCount).toBe(2);
  expect(() => detect(frame.rgba, frame.width - 1, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(null, frame.width, frame.height)).toThrow(/exact RGBA/);
});
