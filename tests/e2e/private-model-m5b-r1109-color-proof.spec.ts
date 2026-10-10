import { expect, test } from '@playwright/test';
// This is an independent pure-JS pixel detector; it runs without browser credentials.
// @ts-ignore - the mjs file is a JavaScript module without a TypeScript declaration
import { detectM5BR1109CyanLocatorComponents as detect } from '../../src/scripts/privateModelR1109CyanLocatorProof.mjs';

const image = (width = 120, height = 60) => {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([241, 243, 247, 255], i);
  return { rgba, width, height };
};
const rectangle = (
  frame: ReturnType<typeof image>, x: number, y: number,
  w = 5, h = 5, color = [0, 234, 255, 255],
) => {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      frame.rgba.set(color, ((y + dy) * frame.width + x + dx) * 4);
    }
  }
};
const five = () => {
  const frame = image();
  for (let i = 0; i < 5; i += 1) rectangle(frame, 6 + i * 21, 12);
  return frame;
};

test('R1109 proof counts five independent cyan viewer markers', () => {
  const frame = five();
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.requiredCount).toBe(5);
  expect(result.componentCount).toBe(5);
  expect(result.qualifyingColorPixels).toBe(125);
  expect(result.components.map((c: any) => c.pixels)).toEqual([25, 25, 25, 25, 25]);
  expect(result.components.map((c: any) => c.minX)).toEqual([6, 27, 48, 69, 90]);
});

test('R1109 missing or merged viewer markers do not pass five-target proof', () => {
  const missing = image();
  for (let i = 0; i < 4; i += 1) rectangle(missing, 6 + i * 21, 12);
  expect(detect(missing.rgba, missing.width, missing.height).componentCount).toBe(4);
  const touching = five();
  rectangle(touching, 74, 12, 17, 5);
  expect(detect(touching.rgba, touching.width, touching.height).componentCount).toBe(4);
});

test('R1109 ignores single cyan noise, original blue zones and light background', () => {
  const frame = five();
  rectangle(frame, 2, 2, 1, 1);
  rectangle(frame, 5, 40, 20, 10, [21, 107, 217, 255]);
  rectangle(frame, 33, 40, 20, 10, [130, 220, 239, 255]);
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.componentCount).toBe(5);
  expect(result.qualifyingColorPixels).toBe(126);
});

test('R1109 tolerates antialiasing and refuses invalid pixel dimensions', () => {
  const frame = five();
  rectangle(frame, 90, 12, 5, 5, [18, 215, 239, 255]);
  expect(detect(frame.rgba, frame.width, frame.height).componentCount).toBe(5);
  expect(() => detect(frame.rgba, frame.width - 1, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(null, frame.width, frame.height)).toThrow(/exact RGBA/);
});
