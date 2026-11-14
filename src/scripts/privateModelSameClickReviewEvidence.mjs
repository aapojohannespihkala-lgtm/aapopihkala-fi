// KP-011 WORK_TEST: a coordinate raycast and the selected source-card object
// are independent unless they are the SAME attached Object3D, not merely
// same-named nodes or the same reused node index in another GLB.
export function classifySameClickReviewEvidence({coordinateHitObject, selectedObject, modelRoot}) {
  if (!coordinateHitObject) return 'NO_COORDINATE_HIT';
  if (!selectedObject) return 'NO_SELECTION';
  if (coordinateHitObject !== selectedObject) return 'INDEPENDENT_HITS';
  let current = coordinateHitObject;
  for (let depth = 0; current && depth < 256; depth++) {
    if (current === modelRoot) return 'MATCHED_SURFACE';
    current = current.parent;
  }
  return 'DETACHED_SELECTION';
}
