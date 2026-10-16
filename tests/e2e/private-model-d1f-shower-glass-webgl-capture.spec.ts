import { test, expect } from '@playwright/test';
import { RGBAFormat, UnsignedByteType } from 'three';
// @ts-ignore - the source capture adapter is a native ESM module.
import { createD1FShowerGlassWebGLCapture } from '../../src/scripts/privateModelD1FShowerGlassWebGLCapture.mjs';

const width = 64, height = 48;
const sourceScene = { isObject3D: true };
const camera = { isCamera: true };
const target = () => ({
  isWebGLRenderTarget: true, width, height, samples: 0,
  texture: { format: RGBAFormat, type: UnsignedByteType },
});

function fixture() {
  const old = { name: 'previous-webgl-target' };
  const calls: any[] = [];
  const f = {
    isWebGLRenderer: true,
    current: old,
    throwInRender: false,
    getRenderTarget() { return this.current; },
    getActiveCubeFace() { return 2; },
    getActiveMipmapLevel() { return 1; },
    setRenderTarget(value: any, face?: number, level?: number) {
      calls.push(['target', value, face, level]);
      this.current = value;
    },
    clear(...args: any[]) { calls.push(['clear', ...args]); },
    render(scene: any, actualCamera: any) {
      calls.push(['render', scene, actualCamera]);
      if (this.throwInRender) throw new Error('injected WebGL render failure');
    },
    readRenderTargetPixels(t: any, x: number, y: number, w: number, h: number, dest: Uint8Array) {
      calls.push(['read', t, x, y, w, h]);
      // Fake strictly supplies the WebGL bottom-left row ordering.
      for (let row = 0; row < h; row++)
        for (let col = 0; col < w; col++) {
          const offset = (row * w + col) * 4;
          dest[offset] = row;
          dest[offset + 1] = col;
          dest[offset + 2] = 77;
          dest[offset + 3] = 255;
        }
    },
  };
  return { renderer: f, old, calls };
}

test('readback flips real WebGL bottom-left RGBA rows to collector top-left rows', () => {
  const { renderer, old, calls } = fixture();
  const t = target();
  const capture = createD1FShowerGlassWebGLCapture({ renderer, target: t, width, height });
  const pixels = capture({ scene: sourceScene, camera });
  expect(pixels).toBeInstanceOf(Uint8Array);
  expect(pixels).toHaveLength(width * height * 4);
  expect([...pixels.subarray(0, 4)]).toEqual([height - 1, 0, 77, 255]);
  expect([...pixels.subarray((width - 1) * 4, width * 4)]).toEqual([height - 1, width - 1, 77, 255]);
  expect([...pixels.subarray((height - 1) * width * 4, (height - 1) * width * 4 + 4)])
    .toEqual([0, 0, 77, 255]);
  expect(calls[0]).toEqual(['target', t, undefined, undefined]);
  expect(calls[1]).toEqual(['clear', true, true, true]);
  expect(calls[2]).toEqual(['render', sourceScene, camera]);
  expect(calls[3]).toEqual(['read', t, 0, 0, width, height]);
  expect(calls.at(-1)).toEqual(['target', old, 2, 1]);
  expect(renderer.current).toBe(old);
});

test('source camera and render target are mandatory and cannot be inferred from screenshots', () => {
  const { renderer } = fixture();
  for (const params of [
    { renderer, target: target(), width: 0, height },
    { renderer, target: target(), width, height: height + 1 },
    { renderer, target: { ...target(), samples: 4 }, width, height },
    { renderer, target: { ...target(), texture: { format: RGBAFormat, type: -1 } }, width, height },
    { renderer: { ...renderer, isWebGLRenderer: false }, target: target(), width, height },
  ]) {
    expect(() => createD1FShowerGlassWebGLCapture(params)).toThrow('D1F_SHOWER_WEBGL_CAPTURE_REJECTED');
  }
  const capture = createD1FShowerGlassWebGLCapture({ renderer, target: target(), width, height });
  expect(() => capture({ scene: {}, camera })).toThrow('D1F_SHOWER_WEBGL_CAPTURE_REJECTED');
  expect(() => capture({ scene: sourceScene, camera: {} })).toThrow('D1F_SHOWER_WEBGL_CAPTURE_REJECTED');
});

test('a failed GPU render restores the previous target and does not poison the next capture', () => {
  const { renderer, old, calls } = fixture();
  const capture = createD1FShowerGlassWebGLCapture({ renderer, target: target(), width, height });
  renderer.throwInRender = true;
  expect(() => capture({ scene: sourceScene, camera })).toThrow('injected WebGL render failure');
  expect(renderer.current).toBe(old);
  expect(calls.at(-1)).toEqual(['target', old, 2, 1]);
  renderer.throwInRender = false;
  expect(capture({ scene: sourceScene, camera })).toHaveLength(width * height * 4);
  expect(renderer.current).toBe(old);
});

test('capture is render-only; it does not authenticate production or release a review', () => {
  const { renderer } = fixture();
  const capture = createD1FShowerGlassWebGLCapture({ renderer, target: target(), width, height });
  const rgba = capture({ scene: sourceScene, camera });
  expect(rgba).toBeInstanceOf(Uint8Array);
  expect(rgba).not.toHaveProperty('authenticatedProductionBrowserVerified');
  expect(rgba).not.toHaveProperty('rawGlbByteIdentityVerified');
  expect(rgba).not.toHaveProperty('humanReview');
});
