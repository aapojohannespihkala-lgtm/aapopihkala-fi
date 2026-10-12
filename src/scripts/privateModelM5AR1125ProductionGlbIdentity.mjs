// R1125 original scene63: exact published GLB bytes in the authenticated
// production browser. This does NOT prove the canvas rendered those bytes,
// individual 13/13 object pixels, measured pipe sizes or HUMAN_REVIEW.
export const M5A_R1125_CANDIDATE_ID = 'm5a-r1125-pvk-diameter-source-split';
export const M5A_R1125_REVIEW_ID = M5A_R1125_CANDIDATE_ID + '-review';
export const M5A_R1125_PRODUCTION_URL =
  'https://aapopihkala.fi/private-model/work-test/m5a-r1125-pvk-diameter-source-split.glb';
export const M5A_R1125_SOURCE_BYTES = 3_112_432;
export const M5A_R1125_SOURCE_SHA256 =
  'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';

function stop(reason) {
  throw new Error('R1125 exact production GLB: ' + reason);
}

// No-op for unrelated candidates. Reject aliases and half-matched source IDs.
export function inspectM5AR1125ProductionGlbAsset(reviewId, candidateId, asset) {
  const related = String(reviewId ?? '').startsWith(M5A_R1125_CANDIDATE_ID) ||
    String(candidateId ?? '').startsWith(M5A_R1125_CANDIDATE_ID);
  if (!related) return null;
  if (reviewId !== M5A_R1125_REVIEW_ID || candidateId !== M5A_R1125_CANDIDATE_ID) {
    stop('candidate or review identity mismatch');
  }
  if (asset === null || typeof asset !== 'object' || Array.isArray(asset) ||
      asset.url !== M5A_R1125_PRODUCTION_URL ||
      asset.status !== 200 ||
      asset.redirected !== false ||
      asset.byteLength !== M5A_R1125_SOURCE_BYTES ||
      asset.sha256 !== M5A_R1125_SOURCE_SHA256) {
    stop('exact URL, HTTP status, redirect, full byte length or SHA256 mismatch');
  }
  return Object.freeze({
    reviewId,
    candidateId,
    productionAssetUrl: M5A_R1125_PRODUCTION_URL,
    exactSourceSceneIndex: 63,
    sourceTargets: 13,
    bytes: M5A_R1125_SOURCE_BYTES,
    sha256: M5A_R1125_SOURCE_SHA256,
    productionAssetExactBytesVerified: true,
    viewerLoadedSameBytesVerified: false,
    individual13TargetPixelsVerified: false,
    humanReview: 'NOT_RUN',
    publishToCURRENT: false,
    physicalDiameterVerified: false,
  });
}
