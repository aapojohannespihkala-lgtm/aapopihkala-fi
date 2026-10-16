import {
  D1F_SHOWER_PHOTO_SOURCE,
  D1F_SHOWER_PHOTO_VARIANTS,
  verifyD1FShowerPhotoRawGlb,
} from './privateModelD1FShowerPhotoSourceContract.mjs';
import { createD1FShowerGlassWebGLCapture } from './privateModelD1FShowerGlassWebGLCapture.mjs';
import { collectD1FShowerGlassPrimitiveFrames } from './privateModelD1FShowerGlassFrameCollector.mjs';

/**
 * Binds the exact original GLB bytes to the *same* GLTFLoader.parseAsync call
 * used for object-specific GPU readback. This deliberately avoids accepting
 * an unrelated caller-supplied parsed scene labeled with a trusted SHA.
 *
 * This is an offline/browser render proof runner, not a production verifier:
 * a separate authenticated production smoke must prove the actual origin,
 * exact one-link autoload, page state and viewer-visible object pixels.
 */
const fail = why => { throw new Error('D1F_SHOWER_WEBGL_RUNNER_REJECTED: ' + why); };
export async function runD1FShowerGlassSourceVerifiedWebGL({
  rawGlb, loader, renderer, target, camera, width, height,
} = {}) {
  const bytes = rawGlb instanceof ArrayBuffer ? new Uint8Array(rawGlb) :
    rawGlb instanceof Uint8Array ? rawGlb : null;
  if (!bytes || bytes.byteLength !== D1F_SHOWER_PHOTO_SOURCE.bytes ||
      typeof loader?.parseAsync !== 'function' ||
      !camera?.isCamera || typeof camera.updateMatrixWorld !== 'function' ||
      !renderer?.isWebGLRenderer ||
      !Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 32 || height < 32 || width > 4096 || height > 4096) {
    fail('missing immutable source GLB, real parser, camera, WebGL renderer or pixel dimensions');
  }

  // Includes full raw 8,914,072-byte digest, GLB structure and all 4 exact
  // scene/mesh-777 variants; rejects before GLTFLoader or any GPU call.
  const selected = await verifyD1FShowerPhotoRawGlb(bytes, D1F_SHOWER_PHOTO_VARIANTS[0].name);
  if (selected.sceneIndex !== 120 || selected.workTestOnly !== true ||
      selected.current !== false || selected.canonical !== false ||
      selected.asBuilt !== false || selected.humanReview !== 'NOT_RUN') {
    fail('source selection is not the isolated WORK_TEST candidate');
  }

  // The GLTFLoader must parse EXACTLY the bytes just authenticated.
  const originalRaw = bytes.slice();
  const gltf = await loader.parseAsync(
    originalRaw.buffer, '/private-model/work-test/'
  );
  if (!Array.isArray(gltf?.scenes) ||
      gltf.scenes.length !== D1F_SHOWER_PHOTO_SOURCE.sceneCount ||
      !(gltf.parser?.associations instanceof Map)) {
    fail('parsed source is not the expected GLTFLoader scene roster');
  }
  camera.updateMatrixWorld(true);
  for (const v of D1F_SHOWER_PHOTO_VARIANTS) {
    const scene = gltf.scenes[v.sceneIndex];
    if (!scene?.isObject3D || typeof scene.updateMatrixWorld !== 'function') {
      fail('missing real source-scene world transforms');
    }
    scene.updateMatrixWorld(true);
  }
  const captureRGBA = createD1FShowerGlassWebGLCapture({ renderer, target, width, height });
  const result = await collectD1FShowerGlassPrimitiveFrames({
    gltf, camera, width, height, captureRGBA,
    sourceBytes: bytes.byteLength,
    sourceSha256: D1F_SHOWER_PHOTO_SOURCE.sha256,
  });
  return Object.freeze({
    ...result,
    originalSourceDigestVerifiedByRunner: true,
    sourceParsedFromVerifiedBytes: true,
    realWebGLCaptureProvidedByRunner: true,
    productionOriginVerifiedByRunner: false,
    authenticatedPrivateViewerVerifiedByRunner: false,
    actualProductionOneLinkVerifiedByRunner: false,
    humanReview: 'NOT_RUN',
    current: false, canonical: false, asBuilt: false,
  });
}
