/**
 * P7 local-glb scene overlay. It mounts ONLY the 27 original Elegance well
 * meshes and NEVER the 28th preview-pipe mesh. Source SHA and the exact
 * original R32H pipe geometry must already have passed the P7 receiver.
 *
 * This is WORK_TEST / HOST_HOLD. No automatic activation, no physical XYZ
 * assertion and no production publication approval.
 */
import { R32H_NW_PHOTO_SPOUT_SOURCE as P7 } from './privateModelR32HMerikaNWPhotoSpoutReceiver.mjs';

const denied = (status) => Object.freeze({
  available: false, status, applied: false,
  setApplied: () => false, dispose: () => {},
});

export function createR32HMerikaP7WellOverlay({
  siteGltf, siteSha256, targetScene, sourceReceiver,
} = {}) {
  if (siteSha256 !== P7.donorPreviewSha256 ||
      sourceReceiver?.status !== 'WORK_TEST_NW_PHOTO_SPOUT_READY' ||
      sourceReceiver?.sourceVerified !== true ||
      sourceReceiver?.available !== true ||
      sourceReceiver?.approvedForViewer !== false ||
      sourceReceiver?.asBuiltClaim !== false ||
      !targetScene?.add || !targetScene?.remove) {
    return denied('P7_SOURCE_OR_RECEIVER_NOT_AUTHENTICATED');
  }
  const j = siteGltf?.parser?.json, s = siteGltf?.scenes?.[0];
  const sourceRoot = s?.children?.[0], previewPipe = s?.children?.[1];
  if (j?.scenes?.length !== 1 ||
      j.scenes[0]?.nodes?.join(',') !== '0,28' ||
      j.nodes?.length !== 29 || j.meshes?.length !== 28 ||
      j.nodes[0]?.name !== 'world' ||
      j.nodes[0]?.children?.join(',') !==
        Array.from({length: 27}, (_, i) => i+1).join(',') ||
      j.nodes[28]?.name !== 'R32H_T12_NW_PHOTO_CONSTRAINED_SPOUT_WORK_TEST' ||
      !sourceRoot?.isObject3D || sourceRoot.name !== 'world' ||
      !previewPipe?.isMesh ||
      previewPipe.name !== j.nodes[28].name ||
      sourceRoot.children.length !== 27 ||
      s.children.length !== 2 ||
      sourceRoot.parent !== s ||
      previewPipe.parent !== s) {
    return denied('P7_SITE_ROOT_OR_PIPE_DUPLICATE_MISMATCH');
  }
  const counts = { NW: 0, NE: 0, SE: 0 };
  let invalid = false, count = 0;
  sourceRoot.traverse((obj) => {
    if (obj === sourceRoot) return;
    if (!obj.isMesh || !obj.geometry || obj.children.length !== 0) {
      invalid = true;
      return;
    }
    count++;
    const zone = /^RK_(NW|NE|SE)_ELEGANCE_1790RS_WORK_TEST__/.exec(obj.name)?.[1];
    if (!zone) invalid = true;
    else counts[zone]++;
  });
  if (invalid || count !== 27 || counts.NW !== 9 ||
      counts.NE !== 9 || counts.SE !== 9) {
    return denied('P7_SITE_WELL_MESH_PARITY_FAILED');
  }
  const overlay = sourceRoot.clone(true);
  overlay.name = 'P7_EL1790RS_WELLS_27_NO_DUPLICATE_SPOUT_WORK_TEST';
  overlay.userData = {
    ...overlay.userData,
    viewerDerived: true, ModelStage: 'WORK_TEST_VIEW',
    sourceModelSha256: P7.donorPreviewSha256,
    sourceZipReferenceSha256: P7.donorZipSha256,
    physicalZClaim: false, currentClaim: false, asBuiltClaim: false,
    physicalHostVerified: false,
  };
  let disposed = false, applied = false;
  const setApplied = (enabled) => {
    if (disposed) return false;
    if (Boolean(enabled) === applied) return true;
    if (enabled) {
      if (sourceRoot.parent !== s || targetScene === s ||
          overlay.parent || !sourceReceiver.setApplied(true)) return false;
      try {
        targetScene.add(overlay);
        applied = true;
        return true;
      } catch {
        sourceReceiver.setApplied(false);
        return false;
      }
    }
    if (overlay.parent !== targetScene ||
        !sourceReceiver.setApplied(false)) return false;
    targetScene.remove(overlay);
    applied = false;
    return true;
  };
  return {
    available: true,
    status: 'WORK_TEST_P7_WELLS_AND_NW_PIPE_READY',
    stage: 'WORK_TEST_HOST_HOLD',
    approvedForPublication: false, approvedForViewer: false,
    physicalHostVerified: false, asBuiltClaim: false,
    meshCount: count,
    get applied() { return applied; },
    setApplied,
    dispose: () => {
      if (disposed) return;
      if (applied && !setApplied(false)) return;
      sourceReceiver.dispose();
      disposed = true;
    },
  };
}
