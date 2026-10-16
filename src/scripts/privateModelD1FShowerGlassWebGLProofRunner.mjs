import { DirectionalLight, HemisphereLight } from 'three';
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

/**
 * Real private-model viewer light profile. Those lights live OUTSIDE modelRoot
 * in the production viewer, while a standalone WebGL proof renders only the
 * GLTFLoader scene. Without this temporary presentation rig, MeshStandard
 * glass/metal can be black for reasons unrelated to source visibility.
 *
 * Add no geometry, source metadata or material edits. Always undo even if the
 * parser, render callback or pixel evaluator rejects the source.
 */
export function mountD1FShowerViewerPresentationLights(gltf) {
  const mounted = [];
  const cleanup = () => {
    for (const { scene, ambient, key } of mounted.reverse()) {
      scene.remove(ambient, key);
      scene.updateMatrixWorld(true);
    }
    mounted.length = 0;
  };
  try {
    if (!Array.isArray(gltf?.scenes) ||
        gltf.scenes.length !== D1F_SHOWER_PHOTO_SOURCE.sceneCount) {
      fail('exact original scene roster required for presentation light rig');
    }
    for (const v of D1F_SHOWER_PHOTO_VARIANTS) {
      const scene = gltf.scenes[v.sceneIndex];
      if (!scene?.isScene || scene.children?.length !== 1 ||
          scene.children[0].parent !== scene) {
        fail('cannot add temporary lights to nonoriginal source root');
      }
      const ambient = new HemisphereLight(0xffffff, 0x777777, 2.2);
      const key = new DirectionalLight(0xffffff, 2.0);
      key.position.set(8, 14, 10);
      ambient.name = 'D1F_PRESENTATION_ONLY_VIEWER_HEMISPHERE';
      key.name = 'D1F_PRESENTATION_ONLY_VIEWER_DIRECTIONAL';
      scene.add(ambient, key);
      mounted.push({ scene, ambient, key });
      scene.updateMatrixWorld(true);
    }
  } catch (error) {
    cleanup();
    throw error;
  }
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    cleanup();
  };
}
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
  // All four scene captures use the same lighting as the private viewer.
  // The source objects/materials stay exact and every temporary light is removed.
  const removePresentationLights = mountD1FShowerViewerPresentationLights(gltf);
  try {
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
      presentationLightProfile: 'PRIVATE_VIEWER_HEMISPHERE_2_2_DIRECTIONAL_2_0',
      temporarySourcePresentationLightsRestored: true,
      productionOriginVerifiedByRunner: false,
      authenticatedPrivateViewerVerifiedByRunner: false,
      actualProductionOneLinkVerifiedByRunner: false,
      humanReview: 'NOT_RUN',
      current: false, canonical: false, asBuilt: false,
    });
  } finally {
    removePresentationLights();
  }
}
