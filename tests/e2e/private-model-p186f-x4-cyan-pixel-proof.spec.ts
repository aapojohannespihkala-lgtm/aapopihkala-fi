import { expect, test } from '@playwright/test';
// Source-color-bound, synthetic pixel-only guard. This is NOT production render evidence.
// @ts-ignore - pure .mjs module has no TypeScript declaration
import { detectP186FX4CyanTargetComponents as detect } from '../../src/scripts/privateModelP186FX4CyanPixelProof.mjs';

const image = (width = 120, height = 60) => {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([242, 245, 249, 255], i);
  return { rgba, width, height };
};

const rectangle = (
  frame: ReturnType<typeof image>, x: number, y: number,
  w = 6, h = 5, color = [34, 211, 238, 255],
) => {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      frame.rgba.set(color, ((y + dy) * frame.width + x + dx) * 4);
    }
  }
};

const three = () => {
  const frame = image();
  rectangle(frame, 10, 15);
  rectangle(frame, 50, 15);
  rectangle(frame, 90, 15);
  return frame;
};

test('P186F-X4 requires three separate cyan scene66 viewer marker components', () => {
  const frame = three();
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.requiredCount).toBe(3);
  expect(result.minComponentPixels).toBe(20);
  expect(result.componentCount).toBe(3);
  expect(result.qualifyingColorPixels).toBe(90);
  expect(result.components.map((c: any) => c.pixels)).toEqual([30, 30, 30]);
  expect(result.components.map((c: any) => c.minX)).toEqual([10, 50, 90]);
});

test('P186F-X4 does not pass if a marker is missing or two targets merge', () => {
  const missing = image();
  rectangle(missing, 10, 15);
  rectangle(missing, 90, 15);
  expect(detect(missing.rgba, missing.width, missing.height).componentCount).toBe(2);

  const merged = three();
  rectangle(merged, 16, 15, 34, 5);
  expect(detect(merged.rgba, merged.width, merged.height).componentCount).toBe(2);
});

test('P186F-X4 ignores background, blue UI, pale cyan, tiny cyan noise and alpha noise', () => {
  const frame = three();
  rectangle(frame, 2, 2, 1, 1);
  rectangle(frame, 6, 42, 12, 10, [19, 101, 218, 255]);
  rectangle(frame, 27, 42, 12, 10, [130, 220, 239, 255]);
  rectangle(frame, 48, 42, 12, 10, [34, 211, 238, 180]);
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.componentCount).toBe(3);
  expect(result.qualifyingColorPixels).toBe(91);
});

test('P186F-X4 accepts anti-aliased target color and rejects invalid RGBA frames', () => {
  const frame = three();
  rectangle(frame, 90, 15, 6, 5, [48, 190, 225, 255]);
  expect(detect(frame.rgba, frame.width, frame.height).componentCount).toBe(3);
  expect(() => detect(frame.rgba, frame.width - 1, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(frame.rgba, frame.width + 0.5, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(null, frame.width, frame.height)).toThrow(/exact RGBA/);
});
