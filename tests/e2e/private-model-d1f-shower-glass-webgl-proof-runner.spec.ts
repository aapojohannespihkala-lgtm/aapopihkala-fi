import { test, expect } from '@playwright/test';
// @ts-ignore - browser-neutral native ESM runner uses the same source gate as the viewer.
import { runD1FShowerGlassSourceVerifiedWebGL } from '../../src/scripts/privateModelD1FShowerGlassWebGLProofRunner.mjs';
// @ts-ignore - immutable test reference, not a substitute for actual raw bytes.
import { D1F_SHOWER_PHOTO_SOURCE } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const reader = () => {
  let parseCount = 0, gpuCount = 0;
  const api = {
    loader: { async parseAsync(_bytes: ArrayBuffer) { parseCount++; throw new Error('should not parse'); } },
    renderer: { isWebGLRenderer: true, render() { gpuCount++; } },
    camera: { isCamera: true, updateMatrixWorld() {} },
    target: {},
    width: 64,
    height: 64,
  };
  return { api, calls: () => ({ parseCount, gpuCount }) };
};

test('rejects an absent source file before source parsing or any GPU readback', async () => {
  const { api, calls } = reader();
  for (const bad of [undefined, new Uint8Array(0), new Uint8Array(200)]) {
    await expect(runD1FShowerGlassSourceVerifiedWebGL({ ...api, rawGlb: bad }))
      .rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  }
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('full-size but forged GLB cannot borrow the original SHA label', async () => {
  const { api, calls } = reader();
  // Valid-enough binary structure to reach the independent full-blob SHA gate,
  // but contents do not match the immutable source and MUST NOT be loaded.
  const rawGlb = new Uint8Array(D1F_SHOWER_PHOTO_SOURCE.bytes);
  const view = new DataView(rawGlb.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, rawGlb.byteLength, true);
  view.setUint32(12, 4, true);
  view.setUint32(16, 0x4e4f534a, true);
  rawGlb.set(new TextEncoder().encode('{}  '), 20);
  view.setUint32(24, rawGlb.byteLength - 32, true);
  view.setUint32(28, 0x004e4942, true);
  await expect(runD1FShowerGlassSourceVerifiedWebGL({ ...api, rawGlb }))
    .rejects.toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('never accepts a separately parsed GLTF object as authenticated source', async () => {
  const { api, calls } = reader();
  const arbitraryParsedScene = {
    scenes: Array.from({ length: 124 }, () => ({ isObject3D: true })),
    parser: { associations: new Map() },
  };
  await expect(runD1FShowerGlassSourceVerifiedWebGL({
    ...api, gltf: arbitraryParsedScene,
    rawGlb: new Uint8Array(64),
  })).rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  expect(calls()).toEqual({ parseCount: 0, gpuCount: 0 });
});

test('missing a real renderer or source camera rejects rather than minting production evidence', async () => {
  const { api } = reader();
  for (const variant of [
    { camera: {} },
    { renderer: {} },
    { width: 0 },
    { height: 0 },
    { loader: {} },
  ]) {
    await expect(runD1FShowerGlassSourceVerifiedWebGL({
      ...api, rawGlb: new Uint8Array(D1F_SHOWER_PHOTO_SOURCE.bytes), ...variant,
    })).rejects.toThrow('D1F_SHOWER_WEBGL_RUNNER_REJECTED');
  }
});
