import { RGBAFormat, UnsignedByteType } from 'three';

/**
 * Real synchronous WebGLRenderTarget readback for the D1F shower-glass
 * primitive collector. The collector expects top-left-origin RGBA, whereas
 * WebGL readRenderTargetPixels returns bottom-left-origin rows.
 *
 * This adapter does NOT authenticate the GLB bytes, private viewer, browser,
 * Cloudflare Access, or production origin. A caller must independently prove
 * all of those before using the result as production pixel evidence.
 * Its target is caller-owned and deliberately never disposed here.
 */
const fail = reason => { throw new Error('D1F_SHOWER_WEBGL_CAPTURE_REJECTED: ' + reason); };
const integer = n => Number.isSafeInteger(n) && n >= 32 && n <= 4096;

export function createD1FShowerGlassWebGLCapture({ renderer, target, width, height } = {}) {
  if (!integer(width) || !integer(height) ||
      !renderer?.isWebGLRenderer ||
      !['getRenderTarget', 'setRenderTarget', 'clear', 'render',
        'readRenderTargetPixels'].every(name => typeof renderer[name] === 'function') ||
      !target?.isWebGLRenderTarget ||
      target.width !== width || target.height !== height ||
      target.samples !== 0 ||
      target.texture?.format !== RGBAFormat ||
      target.texture?.type !== UnsignedByteType) {
    fail('expected caller-owned unsigned-byte RGBA WebGL render target and renderer');
  }

  let capturing = false;
  return function captureRGBA({ scene, camera } = {}) {
    if (!scene?.isObject3D || !camera?.isCamera) {
      fail('expected an actual THREE Object3D source scene and camera');
    }
    if (capturing) fail('overlapping render capture');
    capturing = true;
    let previous, previousFace = 0, previousLevel = 0, savedTarget = false;
    try {
      previous = renderer.getRenderTarget();
      previousFace = renderer.getActiveCubeFace?.() ?? 0;
      previousLevel = renderer.getActiveMipmapLevel?.() ?? 0;
      savedTarget = true;
      renderer.setRenderTarget(target);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);
      const bottomLeft = new Uint8Array(width * height * 4);
      const result = renderer.readRenderTargetPixels(
        target, 0, 0, width, height, bottomLeft
      );
      if (result && typeof result.then === 'function') {
        fail('unexpected asynchronous readback without completion');
      }
      const topLeft = new Uint8Array(bottomLeft.length);
      const stride = width * 4;
      for (let row = 0; row < height; row++) {
        const sourceOffset = (height - 1 - row) * stride;
        topLeft.set(bottomLeft.subarray(sourceOffset, sourceOffset + stride), row * stride);
      }
      return topLeft;
    } finally {
      try {
        if (savedTarget) renderer.setRenderTarget(previous, previousFace, previousLevel);
      } finally {
        capturing = false;
      }
    }
  };
}
