// Strict offline math for independent THREE/WebGL RGBA frame deltas.
// The caller must independently authenticate the live browser, GLB bytes,
// exact 3 device objects, camera/visibility toggles and screenshot provenance.
// A synthetic fixture or this function alone NEVER unlocks HUMAN_REVIEW.
export const P137E_HOUSING_IDS = Object.freeze({
  NORTH: Object.freeze(['D_THEMO_CURRENT_LOBBY_01']),
  SOUTH: Object.freeze([
    'D_THEMO_CURRENT_BEDROOM_01',
    'D_THEMO_CURRENT_BATHROOM_01',
  ]),
});
export const P137E_HOUSING_REVIEW_ID = 'p137e-d1f-three-wall-mounted-themos-review';
export const P137E_HOUSING_CANDIDATE_ID = 'p137e-d1f-three-wall-mounted-themos';
export const P137E_HOUSING_EXPECTED_SHA256 =
  '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d';
export const P137E_HOUSING_EXPECTED_BYTES = 3258268;
const ALL = Object.freeze([...P137E_HOUSING_IDS.NORTH, ...P137E_HOUSING_IDS.SOUTH]);
const fail = (msg) => { throw new Error('P137E housing RGBA isolation: ' + msg); };
const ensure = (condition, msg) => { if (!condition) fail(msg); };
const exact = (received, expected) =>
  Array.isArray(received) && received.length === expected.length &&
  expected.every((item, i) => received[i] === item);
const integer = (n) => Number.isSafeInteger(n);
const pixels = (frame, byteCount) =>
  frame instanceof Uint8Array && frame.length === byteCount;

function validateScene(evidence) {
  ensure(evidence && typeof evidence === 'object' && !Array.isArray(evidence),
    'missing source binding');
  ensure(evidence.reviewId === P137E_HOUSING_REVIEW_ID &&
    evidence.candidateId === P137E_HOUSING_CANDIDATE_ID,
  'exact review/candidate ID');
  ensure(evidence.glbSha256 === P137E_HOUSING_EXPECTED_SHA256 &&
    evidence.glbBytes === P137E_HOUSING_EXPECTED_BYTES &&
    evidence.sceneIndex === 67 && evidence.wallNode === 798 &&
    evidence.wallMesh === 406, 'exact source identity');
  ensure(evidence.workTestOnly === true && evidence.presentationOnly === true &&
    evidence.current === false && evidence.canonical === false &&
    evidence.asBuilt === false && evidence.humanReview === 'NOT_RUN',
  'WORK_TEST no-promotion');
}

/** Count changed RGBA pixels with a source-projected circular housing ROI.
 *  A single diff may be attributed only to the selected visible device:
 *  even one significant changed pixel outside its ROI fails closed.
 */
function diff(before, after, width, height, roi) {
  const r2 = roi?.radius ** 2;
  let inside = 0;
  let outside = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = (y * width + x) * 4;
      let changed = false;
      for (let ch = 0; ch < 4; ch++) {
        if (Math.abs(before[k + ch] - after[k + ch]) >= 20) {
          changed = true;
          break;
        }
      }
      if (!changed) continue;
      if (roi && (x - roi.x) ** 2 + (y - roi.y) ** 2 <= r2) inside++;
      else outside++;
    }
  }
  return { inside, outside, total: inside + outside };
}

/**
 * Required input: exact scene binding and two independently captured
 * face records with live *decoded* original RGBA bytes. For EACH face:
 *   visibleDeviceIds: IDs the real viewer reports visible, in source order;
 *   regions: source-projected, non-overlapping ROI(s) for visible IDs;
 *   baseline: unmodified real canvas RGBA;
 *   hidden: three variants, one for EACH source ID (including wrong-face
 *           negative controls), obtained by hiding just that GLB child.
 *
 * No supplied label or metadata proves browser auth, origin, or that the
 * screenshots really came from the original model. This function validates
 * only independent, stable, single-device pixel differences. Integration
 * must provide trusted, separately recorded live evidence for those claims.
 */
export function inspectP137EThreeHousingPixelIsolation(evidence) {
  validateScene(evidence);
  ensure(Array.isArray(evidence.faces) && evidence.faces.length === 2,
    'exact two browser face captures');
  const results = {};
  for (const [i, face] of evidence.faces.entries()) {
    const side = i === 0 ? 'NORTH' : 'SOUTH';
    const expected = P137E_HOUSING_IDS[side];
    ensure(face?.side === side && face.cameraKey ===
      'P137E_SCENE67_P123C_' + side, 'source camera identity/order ' + side);
    ensure(integer(face.width) && integer(face.height) &&
      face.width >= 256 && face.width <= 4096 &&
      face.height >= 256 && face.height <= 4096,
    'bounded real RGBA viewport ' + side);
    ensure(exact(face.visibleDeviceIds, expected),
      'exact source-face visible identities ' + side);
    const byteCount = face.width * face.height * 4;
    ensure(pixels(face.baseline, byteCount), 'baseline RGBA bytes ' + side);
    ensure(Array.isArray(face.regions) && face.regions.length === expected.length,
      'source ROIs ' + side);
    const regions = new Map();
    for (let j = 0; j < expected.length; j++) {
      const r = face.regions[j];
      ensure(r?.logicalDeviceId === expected[j] &&
        integer(r.x) && integer(r.y) && integer(r.radius) &&
        r.radius >= 4 && r.radius <= 96 &&
        r.x - r.radius >= 0 && r.x + r.radius < face.width &&
        r.y - r.radius >= 0 && r.y + r.radius < face.height,
      'source-projected bounded ROI ' + expected[j]);
      regions.set(r.logicalDeviceId, r);
    }
    for (let a = 0; a < face.regions.length; a++) {
      for (let b = a + 1; b < face.regions.length; b++) {
        const q = face.regions[a], r = face.regions[b];
        ensure((q.x - r.x) ** 2 + (q.y - r.y) ** 2 >
          (q.radius + r.radius) ** 2, 'overlapping device ROIs');
      }
    }
    ensure(Array.isArray(face.hidden) && face.hidden.length === ALL.length,
      'exact three independent hide snapshots ' + side);
    const changes = {};
    for (let j = 0; j < ALL.length; j++) {
      const variant = face.hidden[j];
      const id = ALL[j];
      ensure(variant?.hiddenLogicalDeviceId === id &&
        pixels(variant.rgba, byteCount),
      'single exact hidden device capture ' + side + '/' + id);
      const region = regions.get(id);
      const counts = diff(face.baseline, variant.rgba, face.width, face.height, region);
      if (region) {
        ensure(counts.inside >= 48 && counts.outside === 0,
          'missing/isolation-failed visible housing pixels ' + side + '/' + id);
      } else {
        ensure(counts.total === 0,
          'wrong-face ghost pixels ' + side + '/' + id);
      }
      changes[id] = Object.freeze({ ...counts, expectedVisibleOnFace: !!region });
    }
    results[side] = Object.freeze(changes);
  }
  return Object.freeze({
    sourceSceneIndex: 67,
    sourceWallMesh: 406,
    independentVisibleHousingPixelCount: 3,
    wrongFaceChangesMustBeZero: true,
    rgbaIsolationMathPassed: true,
    north: results.NORTH,
    south: results.SOUTH,
    // We cannot infer these from arbitrary screenshots or metadata claims.
    authenticatedProductionBrowserVerified: false,
    originalGlbLoadedInThatBrowserVerified: false,
    humanReview: 'NOT_RUN',
    publishToCURRENT: false,
    releaseHumanReview: false,
  });
}
