// Production workflow gate for exact scene67 WORK_TEST source metadata.
// It is NOT an authenticated GLB byte digest or a three-device pixel proof.
// Keep this runnable export shared by the real workflow and regressions.
export const P137E_SCENE67_PRODUCTION_SMOKE_ID = 'p137e-d1f-three-wall-mounted-themos';
export const P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID =
  `${P137E_SCENE67_PRODUCTION_SMOKE_ID}-review`;

export const P137E_SCENE67_PRODUCTION_DATASET = Object.freeze({
  workTestReviewAutoload: 'true',
  modelSource: 'work-test',
  workTestReviewMode: P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
  workTestReviewCandidate: P137E_SCENE67_PRODUCTION_SMOKE_ID,
  p137eSceneIndex: '67',
  p137eFocusedRootCount: '1',
  p137eOriginalSourceWallNode: '798',
  p137eOriginalSourceWallMesh: '406',
  p137eWallMountedThemoCount: '3',
  p137eRoomFootprintCount: '0',
  p137ePresentationOnly: 'true',
  p137eWorkTestOnly: 'true',
  p137eExactXYClaim: 'false',
  p137eExactZClaim: 'false',
  p137eCurrentClaim: 'false',
  p137eCanonical: 'false',
  p137eAsBuiltClaim: 'false',
  p137eHumanReview: 'NOT_RUN',
  p137eReviewCameraMode: 'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP',
  contentFloor: '1F',
  contentScene: 'full-model',
});

function fail(reason) {
  throw new Error('P137E scene67 production source smoke: ' + reason);
}

// Return null for unrelated review targets without changing their contracts.
// Reject a P137E alias even when only one side of the ID pair matches.
export function inspectP137EScene67ProductionSmoke(reviewId, candidateId, dataset) {
  const referenced =
    String(reviewId ?? '').startsWith(P137E_SCENE67_PRODUCTION_SMOKE_ID) ||
    String(candidateId ?? '').startsWith(P137E_SCENE67_PRODUCTION_SMOKE_ID);
  if (!referenced) return null;
  if (reviewId !== P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID ||
      candidateId !== P137E_SCENE67_PRODUCTION_SMOKE_ID) {
    fail('review/candidate identity mismatch');
  }
  if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
    fail('canvas source dataset missing');
  }
  for (const [key, required] of Object.entries(P137E_SCENE67_PRODUCTION_DATASET)) {
    if (dataset[key] !== required) fail('missing or mismatched ' + key);
  }
  return Object.freeze({
    candidateId,
    reviewId,
    sceneIndex: 67,
    originalWallNode: 798,
    originalWallMesh: 406,
    expectedDeviceCount: 3,
    sourceMetadataMatched: true,
    glbBytesAuthenticatedByThisGate: false,
    individualDevicePixelsVerified: false,
    humanReview: 'NOT_RUN',
    publishToCURRENT: false,
  });
}
