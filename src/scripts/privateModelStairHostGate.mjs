/**
 * Ylisrinne T05 stair-host visibility gate, pure and non-mutating.
 *
 * SOURCE_ONLY / WORK_TEST staging. No DOM, Three.js, renderer, or file changes.
 * The gate validates a caller-supplied, externally checked evidence contract.
 * It does NOT verify geometry, hashes, physical measurements or browser output.
 * In particular scene32 lacks the integrated K17 14-step donor (scene54).
 *
 * Source: Ylisrinne D-view task document, T05-TARKENNE (26.10.2026).
 * A result of PASS_SCOPED is permission to consider a staged presentation,
 * NOT CURRENT/as-built, a browser PASS, or permission to publish.
 */
const HASH = /^[a-f\d]{64}$/i;
const DOC = /^DOC:[a-zA-Z0-9_-]{8,}$/;
const FLOOR = new Set(['WHOLE', 'BOTH', '1F', '2F']);
const sameHash = (a, b) => HASH.test(a ?? '') && HASH.test(b ?? '') && a.toLowerCase() === b.toLowerCase();
const reject = (reason, floor = null) => Object.freeze({
  ok: false, status: 'HOST_HOLD', reason, floor,
  render: 'NO_NEW_STAIR_PRESENTATION', primaryKeys: [], referenceKeys: [],
  canPublish: false, asBuilt: false,
});
const validKey = (v) => typeof v === 'string' && !!v.trim();
const uniqueKeys = (arr) => Array.isArray(arr) && arr.every(validKey) && new Set(arr).size === arr.length;

/**
 * @param {object} input
 * @param {'WHOLE'|'BOTH'|'1F'|'2F'} input.floor
 * @param {object} input.selectedModel - Selected main scene identity, not donor.
 * @param {string} input.selectedModel.zipSha256 - Whole 64-char SHA-256, externally verified.
 * @param {number} input.selectedModel.sceneIndex
 * @param {'PHYSICAL_MAIN_WORK_TEST'} input.selectedModel.modelKind
 * @param {object} input.expected - Full source-version lock from the active application.
 * @param {object} input.stairScope - Unique embedded scope from that same model.
 * @param {object} input.hostProof - Only an independently verified host/mesh test may set PASS.
 * @param {object} [input.parts] - Verified 1F/2F segment IDs when a single floor is requested.
 * @param {boolean} [input.showReference=false] - Explicit opt-in for opposite-floor reference.
 */
export function decideStairPresentation(input = {}) {
  if (!input || typeof input !== 'object') return reject('INVALID_INPUT');
  const { floor = null, selectedModel, expected, stairScope, hostProof,
    parts, showReference = false } = input;
  if (!FLOOR.has(floor)) return reject('INVALID_FLOOR', floor);
  if (!selectedModel || !expected || !sameHash(selectedModel.zipSha256, expected.zipSha256) ||
    !Number.isSafeInteger(selectedModel.sceneIndex) || selectedModel.sceneIndex < 0 ||
    selectedModel.sceneIndex !== expected.sceneIndex ||
    selectedModel.modelKind !== 'PHYSICAL_MAIN_WORK_TEST') {
    return reject('SELECTED_MAIN_MODEL_NOT_VERIFIED', floor);
  }
  const scopeVerified = !!stairScope && validKey(expected.objectKey) &&
    stairScope.objectKey === expected.objectKey &&
    stairScope.apartmentScope === 'D' && stairScope.storeyScope === 'BOTH' &&
    stairScope.role === 'VERTICAL_CONNECTOR' &&
    stairScope.phaseScope === 'ACTIVE_IN_SELECTED_WORKTEST';
  const proofBound = scopeVerified && !!hostProof &&
    sameHash(hostProof.zipSha256, selectedModel.zipSha256) &&
    hostProof.sceneIndex === selectedModel.sceneIndex &&
    hostProof.objectKey === stairScope.objectKey &&
    typeof hostProof.evidenceDocId === 'string' &&
    DOC.test(hostProof.evidenceDocId);
  const hostReady = proofBound && hostProof.k17Integrated === true &&
    hostProof.activeStairTreads === 14 &&
    hostProof.correctedRailAndLowWallParts === 6 &&
    hostProof.visibleLegacy1000mmWalls === 0 &&
    hostProof.noDuplicateActiveMeshes === true &&
    hostProof.stairHostGeometry === 'PASS' &&
    hostProof.upperFloorOpeningGeometry === 'PASS' &&
    hostProof.lightwellClearanceGeometry === 'PASS' &&
    hostProof.noOtherApartmentLeak === true;

  if (floor === 'WHOLE') {
    // WHOLE never changes the selected physical main scene. A scene without an
    // integrated K17 stair connector has no valid stair scope/proof; it must
    // still remain visible as the source scene, with HOST_HOLD instead of a
    // fabricated stair representation. No donor is injected or inferred.
    return Object.freeze({
      ok: true, status: hostReady ? 'PASS_SCOPED' : 'HOST_HOLD',
      reason: hostReady ? 'VERIFIED_WHOLE_SOURCE' : 'K17_NOT_INTEGRATED_OR_HOST_UNVERIFIED',
      floor, render: 'PRESERVE_SELECTED_MAIN_SCENE', primaryKeys: [], referenceKeys: [],
      canPublish: false, asBuilt: false,
    });
  }
  if (!scopeVerified) return reject('T05_SCOPE_NOT_VERIFIED', floor);
  if (!proofBound) return reject('T05_HOST_PROOF_NOT_VERSION_BOUND', floor);
  if (!hostReady) return reject('K17_NOT_INTEGRATED_OR_HOST_UNVERIFIED', floor);
  if (floor === 'BOTH') {
    return Object.freeze({
      ok: true, status: 'PASS_SCOPED', reason: 'HOST_VERIFIED_BOTH', floor,
      render: 'SHOW_ONE_VERIFIED_CONNECTOR', primaryKeys: [stairScope.objectKey],
      referenceKeys: [], canPublish: false, asBuilt: false,
    });
  }
  // A BOTH mesh must never be split by world height or a name heuristic.
  // Require independently source-verified, disjoint render segments.
  if (!parts || !sameHash(parts.zipSha256, selectedModel.zipSha256) ||
    parts.sceneIndex !== selectedModel.sceneIndex || parts.parentObjectKey !== stairScope.objectKey ||
    parts.provenance !== 'SOURCE_ANCHORED_SEGMENTS' ||
    !uniqueKeys(parts['1F']) || !uniqueKeys(parts['2F']) ||
    !parts['1F'].length || !parts['2F'].length ||
    parts['1F'].some((key) => parts['2F'].includes(key))) {
    return reject('T05_FLOOR_SEGMENTATION_NOT_VERIFIED', floor);
  }
  const primaryKeys = [...parts[floor]];
  const otherFloor = floor === '1F' ? '2F' : '1F';
  if (showReference === true &&
    (!uniqueKeys(parts.reference?.[otherFloor]) ||
     parts.reference[otherFloor].some((key) => primaryKeys.includes(key)) ||
     parts.reference[otherFloor].some((key) => !parts[otherFloor].includes(key)))) {
    return reject('T05_REFERENCE_SEGMENT_NOT_VERIFIED', floor);
  }
  return Object.freeze({
    ok: true, status: 'PASS_SCOPED', reason: 'HOST_AND_SEGMENTS_VERIFIED', floor,
    render: 'SHOW_SOURCE_ANCHORED_FLOOR_SEGMENTS', primaryKeys,
    referenceKeys: showReference === true ? [...parts.reference[otherFloor]] : [],
    canPublish: false, asBuilt: false,
  });
}
