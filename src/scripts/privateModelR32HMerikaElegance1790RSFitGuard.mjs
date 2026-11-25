/**
 * Optional Merika Elegance 110/1790RS northwest downpipe fit candidate.
 *
 * Independent stacked WORK_TEST donor for PR2251, not wired to the viewer.
 * This module never changes R32H's original GLB or the existing 20 mm preview.
 *
 * Source 1: exact R32H GLB c26d99c1, scene 814/815, T12 NW n13801/mesh5207.
 * Source 2: standalone 3-site Elegance GLB b317657a, Drive 11Yc1MqvtVugjt1ebi67l0WxlPbr4erEu.
 * Source 3: owner NW photo 25.4.2026, Drive 1Hbw4Ir3c7WHg2PDU58KcN6v1W_uunuS8.
 * The Elegance location/upper-rim anchoring and 20 mm free gap are WORK_TEST
 * assumptions. The SKU, product installation, grille elevation and pipe host
 * remain unmeasured. No CURRENT/as-built/physical-Z claim is permitted.
 */
import {
  R32H_T12_NW_COW_SOURCE,
  planR32HT12NorthwestWorkTestCOW,
} from './privateModelR32HT12NorthwestCOW.mjs';

export const R32H_ELEGANCE_1790RS_NW_FIT_SOURCE = Object.freeze({
  sourceGlbSha256: R32H_T12_NW_COW_SOURCE.glbSha256,
  sourceScenes: Object.freeze([814, 815]),
  sourceNodeIndex: 13801,
  sourceMeshIndex: 5207,
  siteGlbSha256: 'b317657aba710e81651012eaade437c359c88a968b0527d48c456cadde886371',
  siteZipSha256: '3dcca022201c1bb3be8d2d33b3ee3613a0432905daa3439deb301e69104c845d',
  siteDriveId: '11Yc1MqvtVugjt1ebi67l0WxlPbr4erEu',
  siteSceneIndex: 0,
  wellId: 'RK_NW',
  wellXY: Object.freeze({ x: -0.350, z: -10.685 }),
  assumedGroundY: 0.034,
  assumedTopY: 0.283,
  legacyGrateY: 0.109,
  eleganceCandidateGrateY: 0.163,
  legacyPreviewLowerLipY: 0.129,
  workTestGapM: 0.020,
  sourcePhotoDriveId: '1Hbw4Ir3c7WHg2PDU58KcN6v1W_uunuS8',
});

const close = (a, b, tol = 0.000001) => Number.isFinite(a) &&
  Math.abs(a - b) <= tol;

const held = (status) => ({
  status,
  stage: 'WORK_TEST_HOST_HOLD',
  approvedForViewer: false,
  approvedForPublication: false,
  physicalHostVerified: false,
  asBuiltClaim: false,
});

/**
 * Build alternate COW positions from the original source geometry ONLY.
 * Does not touch PR2251's working AvantGarde receiver, viewer or source GLB.
 *
 * All source and donor identities must match. An explicit user opt-in is
 * required even to return candidate positions. A future viewer receiver must
 * independently enforce the same source/scene/switch locks and restore the
 * original geometry on scene change, reload and dispose.
 */
export function planR32HMerikaElegance1790RSNWWorkTest({
  glbSha256,
  sceneIndex,
  nodeIndex,
  meshIndex,
  nodeName,
  worldMatrixIsIdentity,
  positions,
  siteGlbSha256,
  siteZipSha256,
  siteSceneIndex,
  wellId,
  explicitPreviewOptIn,
} = {}) {
  const s = R32H_ELEGANCE_1790RS_NW_FIT_SOURCE;
  if (siteGlbSha256 !== s.siteGlbSha256 ||
      siteZipSha256 !== s.siteZipSha256 ||
      siteSceneIndex !== s.siteSceneIndex ||
      wellId !== s.wellId ||
      glbSha256 !== s.sourceGlbSha256 ||
      !s.sourceScenes.includes(sceneIndex) ||
      nodeIndex !== s.sourceNodeIndex ||
      meshIndex !== s.sourceMeshIndex) {
    return held('EXACT_SOURCE_OR_DONOR_MISMATCH');
  }
  if (explicitPreviewOptIn !== true) return held('EXPLICIT_OPT_IN_REQUIRED');

  // Existing PR2251 source checker verifies original vertex count, bounds,
  // node name, exact scene, glTF mesh, finite positions and world identity.
  const legacy = planR32HT12NorthwestWorkTestCOW({
    glbSha256, sceneIndex, nodeIndex, meshIndex, nodeName,
    worldMatrixIsIdentity, positions,
  });
  if (legacy.status !== 'WORK_TEST_COW' || legacy.sourceVerified !== true ||
      !close(legacy.targetMinY, s.legacyPreviewLowerLipY, 0.002) ||
      !close(R32H_T12_NW_COW_SOURCE.candidateGrateY, s.legacyGrateY) ||
      !close(R32H_T12_NW_COW_SOURCE.workTestLowerLipGapM, s.workTestGapM)) {
    return held('LEGACY_COW_SOURCE_GUARD_FAILED');
  }

  const legacyClearanceM = legacy.targetMinY - s.eleganceCandidateGrateY;
  if (!close(legacyClearanceM, -0.034, 0.002)) {
    return held('EXPECTED_34MM_COLLISION_CHANGED');
  }

  // Rebase the original SOURCE-EXACT COW result to the new candidate grille,
  // preserving the same taper function, same upper fixed band and source XYZ.
  const desiredLipY = s.eleganceCandidateGrateY + s.workTestGapM;
  const additionalRiseY = desiredLipY - legacy.targetMinY;
  const out = new Float32Array(legacy.positions);
  for (let i = 1; i < out.length; i += 3) {
    const y = positions[i]; // ORIGINAL source, never the already-adjusted Y
    const factor = y <= R32H_T12_NW_COW_SOURCE.lowerBandY ? 1
      : y >= R32H_T12_NW_COW_SOURCE.upperBandY ? 0
      : (R32H_T12_NW_COW_SOURCE.upperBandY - y) /
        (R32H_T12_NW_COW_SOURCE.upperBandY - R32H_T12_NW_COW_SOURCE.lowerBandY);
    out[i] += additionalRiseY * factor;
  }
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < out.length; i += 3) {
    minY = Math.min(minY, out[i]);
    maxY = Math.max(maxY, out[i]);
  }
  if (!close(minY, desiredLipY, 0.002) ||
      !close(maxY, R32H_T12_NW_COW_SOURCE.sourceMaxY, 0.002) ||
      !close(additionalRiseY, 0.054, 0.002)) {
    return held('ELEGANCE_COW_GEOMETRY_CLEARANCE_FAIL');
  }

  return {
    status: 'WORK_TEST_EL1790RS_NW_COW_CANDIDATE',
    stage: 'WORK_TEST_HOST_HOLD',
    sourceVerified: true,
    physicalHostVerified: false,
    asBuiltClaim: false,
    approvedForViewer: false, // no viewer receiver exists yet
    approvedForPublication: false,
    viewerIntegration: 'NOT_WIRED',
    originalSourceGlbSha256: s.sourceGlbSha256,
    donorGlbSha256: s.siteGlbSha256,
    siteDriveId: s.siteDriveId,
    sceneIndex,
    nodeIndex,
    meshIndex,
    legacyLowerLipY: legacy.targetMinY,
    newGrateY: s.eleganceCandidateGrateY,
    legacyClearanceM,
    additionalRiseY,
    candidateLowerLipY: minY,
    candidateGapM: minY - s.eleganceCandidateGrateY,
    shiftedVertices: legacy.shiftedVertices,
    positions: out,
    note: '54 mm extra rise is only a new 3D WORK_TEST candidate; physical grille/host elevation is unmeasured.',
  };
}
