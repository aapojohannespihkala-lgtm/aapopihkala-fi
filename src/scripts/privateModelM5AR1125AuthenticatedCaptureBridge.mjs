import {
  bindAuthenticatedR1125Scene63,
  projectAuthenticatedR1125BoundSourceObjects,
} from './privateModelM5AR1125OriginalSceneBindings.mjs';
import { captureM5AR1125FocusOffscreenFrames }
  from './privateModelM5AR1125RenderTargetCapture.mjs';
import { detectM5AR1125PerSourceRenderDelta }
  from './privateModelM5AR1125PerSourceRenderDelta.mjs';
import { m5aR1125SourcePixelKinds }
  from './privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys = Object.keys(m5aR1125SourcePixelKinds);
const sourceDigest =
  'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';
const fail = why => { throw new Error('R1125_AUTHENTIC_CAPTURE_BRIDGE: ' + why); };

/**
 * Source-bound offscreen WebGL evidence composition, NOT a viewer release.
 *
 * A single call performs the existing independent gates in this order:
 *  1. Validate raw immutable original R1125 GLB bytes (SHA-256) and
 *     bind GLTFLoader scene63's 13 exact node/mesh identities.
 *  2. Project precisely those original objects into the current camera.
 *  3. Present the same original scene in reversible 80/20 WORK_TEST form,
 *     offscreen render one baseline + 13 hide + 13 restore frames.
 *  4. Analyze per-source exclusive-pixel deltas against source geometry.
 *
 * Even a successful local WebGL result is NOT evidence of authenticated
 * production browser navigation, model transport, viewer-canvas pixels,
 * surveyed route geometry, or HUMAN_REVIEW. Never promote to CURRENT.
 */
export async function captureAuthenticatedM5AR1125SourceEvidence({
  originalRaw, gltf, renderer, camera, THREE, width, height,
} = {}) {
  if (!(originalRaw instanceof Uint8Array) ||
      originalRaw.byteLength !== 3_112_432 ||
      !gltf?.scenes?.[63]?.isGroup ||
      !camera?.isCamera ||
      !(camera.isPerspectiveCamera || camera.isOrthographicCamera) ||
      !renderer?.isWebGLRenderer ||
      !THREE?.Vector3 ||
      !Number.isInteger(width) || width < 128 ||
      !Number.isInteger(height) || height < 128 ||
      width * height > 2_304_000) {
    fail('immutable raw GLB, source scene, camera, renderer and bounded canvas required');
  }

  // Raw original SHA, geometry/source-no-promotion and exact GLTFLoader
  // identities are checked before any renderer state or scene material change.
  const binding = bindAuthenticatedR1125Scene63({ originalRaw, gltf });
  const projected = projectAuthenticatedR1125BoundSourceObjects({
    originalRaw, gltf, camera, THREE,
    imageWidth: width, imageHeight: height,
  });
  if (binding.originalGlbDigestAuthenticated !== true ||
      binding.originalSourceDigest !== sourceDigest ||
      projected.originalGlbDigestAuthenticated !== true ||
      projected.originalSourceDigest !== sourceDigest ||
      projected.originalSourceObjectIdentityVerified !== true ||
      binding.sourceTargetCount !== 13 ||
      projected.sourceTargetCount !== 13 ||
      projected.projectedCenters?.length !== 13 ||
      keys.some(key => binding.targets[key] !== projected.sourceTargets[key])) {
    fail('original raw digest, 13 target identities and projections must agree');
  }

  const frames = await captureM5AR1125FocusOffscreenFrames({
    gltf, binding, renderer, camera, THREE, width, height,
  });
  // This gate checks actual caller-renderer readback bytes against original
  // per-target source footprints, and may return a FAIL rather than invent
  // visibility for occluded or overlapping source geometry.
  const technicalPixels = detectM5AR1125PerSourceRenderDelta({
    ...frames, projections: projected.projectedCenters,
    width, height, cameraStates: frames.cameraStates,
    sourceScene: { sceneRoot: gltf.scenes[63], sceneIndex:63, camera, THREE },
  });
  if (technicalPixels.requiredSourceCount !== 13 ||
      technicalPixels.sourceIsolation?.length !== 13 ||
      frames.capturedFrameCount !== 27 ||
      frames.captureMode !== 'SOURCE_BOUND_OFFSCREEN_THREE_RENDER_TARGET') {
    fail('technical 13-target 27-frame source evidence incomplete');
  }

  return Object.freeze({
    sourceSceneIndex:63, sourceTargetCount:13,
    sourceDigestVerified:true, originalSourceDigest:sourceDigest,
    sourceGlbByteLength:originalRaw.byteLength,
    gltfSourceNodeMeshIdentityVerified:true,
    sameCameraFrameCount:27, cameraViewpointCount:1,
    sourceProjectedCenters:projected.projectedCenters,
    offscreenFrames:frames,
    technicalPixelIsolation:technicalPixels,
    allTechnicalOffscreenTargetsIsolated:
      technicalPixels.allSourceTargetsIsolated === true,
    // These cannot be inferred from raw bytes or caller-controlled renderer:
    productionSourceTransportVerified:false,
    authenticatedViewerAutoloadVerified:false,
    productionCanvasPixelProvenanceVerified:false,
    productionPerSourcePixelsVerified:false,
    humanReview:'NOT_RUN',
    current:false, canonical:false, asBuilt:false, publishToCURRENT:false,
  });
}
