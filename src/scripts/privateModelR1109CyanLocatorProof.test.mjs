import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectM5BR1109CyanLocatorComponents as detect } from './privateModelR1109CyanLocatorProof.mjs';

function image(width = 120, height = 60) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba.set([241, 243, 247, 255], i);
  }
  return { rgba, width, height };
}
function rectangle(frame, x, y, w = 5, h = 5, color = [0, 234, 255, 255]) {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      frame.rgba.set(color, ((y + dy) * frame.width + x + dx) * 4);
    }
  }
}
function fullFive() {
  const frame = image();
  for (let i = 0; i < 5; i += 1) rectangle(frame, 6 + i * 21, 12);
  return frame;
}

test('five distinct source locator colors produce five spatial pixel components', () => {
  const frame = fullFive();
  const proof = detect(frame.rgba, frame.width, frame.height);
  assert.equal(proof.componentCount, 5);
  assert.equal(proof.requiredCount, 5);
  assert.equal(proof.qualifyingColorPixels, 125);
  assert.deepEqual(proof.components.map(c => c.pixels), [25, 25, 25, 25, 25]);
  assert.deepEqual(proof.components.map(c => c.minX), [6, 27, 48, 69, 90]);
});

test('missing or merged source cue cannot pass the five-component gate', () => {
  const missing = image();
  for (let i = 0; i < 4; i += 1) rectangle(missing, 6 + i * 21, 12);
  assert.equal(detect(missing.rgba, missing.width, missing.height).componentCount, 4);
  const touching = image();
  for (let i = 0; i < 4; i += 1) rectangle(touching, 6 + i * 21, 12);
  rectangle(touching, 90, 12);
  rectangle(touching, 74, 12, 17, 5);
  assert.equal(detect(touching.rgba, touching.width, touching.height).componentCount, 4);
});

test('thin noise, original blue zone bars and background do not count as cyan locators', () => {
  const frame = fullFive();
  rectangle(frame, 2, 2, 1, 1);
  rectangle(frame, 5, 40, 20, 10, [21, 107, 217, 255]);
  rectangle(frame, 33, 40, 20, 10, [130, 220, 239, 255]);
  const proof = detect(frame.rgba, frame.width, frame.height);
  assert.equal(proof.componentCount, 5);
  assert.equal(proof.qualifyingColorPixels, 126);
});

test('antialias-tolerant cyan passes; malformed image fails closed', () => {
  const frame = fullFive();
  rectangle(frame, 90, 12, 5, 5, [18, 215, 239, 255]);
  assert.equal(detect(frame.rgba, frame.width, frame.height).componentCount, 5);
  assert.throws(() => detect(frame.rgba, frame.width - 1, frame.height), /exact RGBA/);
  assert.throws(() => detect(null, frame.width, frame.height), /exact RGBA/);
});
