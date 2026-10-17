import { prepareM5AR1125Focus8020 } from './privateModelM5AR1125Focus8020.mjs';
import { captureM5AR1125FrameSequence } from './privateModelM5AR1125FrameCaptureSequence.mjs';

const fail = why => { throw new Error('R1125_WEBGL_RENDER_TARGET_CAPTURE: ' + why); };
const exactDimensions = (width, height) =>
  Number.isInteger(width) && width >= 128 && Number.isInteger(height) &&
  height >= 128 && width * height <= 2304000;

/**
 * Offscreen readback adapter connecting the already source-bound reversible
 * 80/20 focus to the existing baseline + 13 hide + 13 restore capture.
 *
 * NOT production proof: caller must separately prove genuine authenticated
 * viewer origin, raw-GLB network bytes, source-to-rendered-canvas identity and
 * each visible target's original source pixels. Readback here is offscreen.
 * Source geometry and all material refs are restored in every exit path.
 */
export async function captureM5AR1125FocusOffscreenFrames({
  gltf, binding, renderer, camera, THREE, width, height,
} = {}) {
  const scene = gltf?.scenes?.[63];
  if (!scene?.isGroup || !camera?.isCamera ||
      !(camera.isPerspectiveCamera || camera.isOrthographicCamera) ||
      !renderer?.isWebGLRenderer || typeof renderer.getRenderTarget !== 'function' ||
      typeof renderer.setRenderTarget !== 'function' ||
      typeof renderer.render !== 'function' ||
      typeof renderer.readRenderTargetPixels !== 'function' ||
      typeof THREE?.WebGLRenderTarget !== 'function' ||
      !exactDimensions(width, height)) {
    fail('real Three source scene, renderer, camera and bounded dimensions required');
  }

  // The original renderer target is always restored, including when setup,
  // GPU rendering, readPixels or a selective-source isolation fails.
  const previousTarget = renderer.getRenderTarget();
  let target = null, presentation = null;
  try {
    presentation = prepareM5AR1125Focus8020({ gltf, binding });
    target = new THREE.WebGLRenderTarget(width, height, {
      depthBuffer: true, stencilBuffer: false,
    });
    if (!target?.isWebGLRenderTarget ||
        target.width !== width || target.height !== height ||
        typeof target.dispose !== 'function') {
      fail('offscreen RGBA target unavailable');
    }

    const captureRGBA = async () => {
      if (renderer.getRenderTarget() !== previousTarget) {
        fail('renderer target changed by outside owner');
      }
      const bottomFirst = new Uint8Array(width * height * 4);
      renderer.setRenderTarget(target);
      try {
        renderer.render(scene, camera);
        renderer.readRenderTargetPixels(target, 0, 0, width, height, bottomFirst);
      } finally {
        renderer.setRenderTarget(previousTarget);
      }
      // WebGL readPixels starts at bottom-left; the existing source ROI
      // verifier expects ordinary screenshot top-left row order.
      const topFirst = new Uint8Array(bottomFirst.length);
      const rowSize = width * 4;
      for (let y = 0; y < height; y++) {
        topFirst.set(
          bottomFirst.subarray(y * rowSize, (y + 1) * rowSize),
          (height - 1 - y) * rowSize,
        );
      }
      return topFirst;
    };
    const frames = await captureM5AR1125FrameSequence({
      sceneRoot: scene, camera, sceneIndex: 63,
      width, height, targets: binding.targets, captureRGBA,
    });
    return Object.freeze({
      ...frames,
      captureMode: 'SOURCE_BOUND_OFFSCREEN_THREE_RENDER_TARGET',
      capturedFrameCount: 27,
      presentationState: presentation.state,
      readPixelsTopLeftReoriented: true,
      originalGlbDigestAuthenticated: false,
      productionProvenanceVerified: false,
      actualViewerCanvasPixelsVerified: false,
      individualSourcePixelsVerified: false,
      humanReview: 'NOT_RUN',
      current: false, canonical: false, asBuilt: false,
    });
  } finally {
    try {
      presentation?.restore();
    } finally {
      try { target?.dispose?.(); }
      finally { renderer.setRenderTarget(previousTarget); }
    }
  }
}
