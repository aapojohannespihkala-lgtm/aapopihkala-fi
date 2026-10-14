/**
 * P186E historical 2015 D electrical source-label per-target screenshot guard.
 *
 * This is a PURE, synthetic-testable verifier accepting caller-supplied pixels.
 * It does NOT capture/authenticate production, read Google Drive, or prove
 * physical current D electrical devices. Original viewer labels remain
 * WORK_TEST/source-derived/presentation-only, HUMAN_REVIEW=NOT_RUN.
 *
 * To obtain real production evidence, a future authenticated harness must
 * independently supply the exact source GLB and matching same-camera RGBA
 * frames, one baseline plus one selectively hidden target per source key.
 */
export const p186ePixelExpected = Object.freeze({
  D1F: Object.freeze({ total: 18, group: 14, special: 4 }),
  D2F: Object.freeze({ total: 16, group: 15, special: 1 }),
});
// Exact viewer WORK_TEST identity, not an arbitrary caller-selected source alias.
export const p186ePixelCandidateId =
  'p186e-x1-d2015-electrical-source-label-anchors-p28-corrected';
export const p186ePixelSourcePdfDriveId = '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg';
export const p186ePixelSchedulePdfDriveId = '1-dioYKOAol67GyH0rl5cQ-omRcoeWAkP';
export const p186ePixelRepresentationKinds = Object.freeze({
  group: 'electricalGroupSourceLabelAnchor',
  special: 'electricalSpecialSourceLabelAnchor',
});
const identifier = /^[A-Za-z0-9_.:-]{3,128}$/;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const reject = reason => { throw new Error('P186E_PIXEL_SOURCE_GATE: ' + reason); };
const integer = n => Number.isSafeInteger(n);
const exactKeys = (value, keys) =>
  isRecord(value) && Object.keys(value).length === keys.length &&
  keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
const rgbaFrame = (frame, context) => {
  if (!isRecord(frame) ||
      !integer(frame.width) || !integer(frame.height) ||
      frame.width < 16 || frame.height < 16 ||
      frame.width > 4096 || frame.height > 4096 ||
      !identifier.test(frame.cameraKey ?? '') ||
      frame.cameraKey !== context.cameraKey ||
      frame.sceneKey !== context.sceneKey ||
      frame.floor !== context.floor ||
      frame.sourceCandidateId !== context.sourceCandidateId ||
      !(frame.pixels instanceof Uint8Array) ||
      frame.pixels.length !== frame.width * frame.height * 4) {
    reject('frame provenance/dimensions/real RGBA buffer');
  }
};
const amber = (bytes, index) => {
  const r = bytes[index], g = bytes[index + 1], b = bytes[index + 2], a = bytes[index + 3];
  return a >= 200 && r >= 145 && g >= 85 && b <= 165 &&
    r - g >= 18 && g - b >= 18;
};
const pixelChanged = (a, b, offset) =>
  Math.max(...[0, 1, 2, 3].map(c => Math.abs(a[offset + c] - b[offset + c]))) >= 20;

/** Floor-specific 18+16 source label screenshots; all frames share one camera per floor. */
export function verifyP186E34SourcePixelEvidence({
  sourceCandidateId, floors, minLostPixels = 4, maxOutsidePixelChanges = 0,
} = {}) {
  if (sourceCandidateId !== p186ePixelCandidateId ||
      !Array.isArray(floors) || floors.length !== 2 ||
      !integer(minLostPixels) || minLostPixels < 4 ||
      !integer(maxOutsidePixelChanges) || maxOutsidePixelChanges !== 0) {
    reject('source or proof configuration');
  }
  const processed = new Set();
  const result = {};
  for (const session of floors) {
    const floor = session?.floor;
    if (!Object.prototype.hasOwnProperty.call(p186ePixelExpected, floor) ||
        processed.has(floor) || !identifier.test(session?.cameraKey ?? '') ||
        !identifier.test(session?.sceneKey ?? '') ||
        !Array.isArray(session.targets)) {
      reject('floor/source-camera session identity');
    }
    processed.add(floor);
    const expected = p186ePixelExpected[floor];
    if (session.targets.length !== expected.total) reject('floor target count');
    const context = { floor, cameraKey: session.cameraKey,
      sceneKey: session.sceneKey, sourceCandidateId };
    rgbaFrame(session.baseline, context);
    const { width, height } = session.baseline;
    if (!isRecord(session.hiddenFrames)) reject('missing per-target hidden frames');
    const seen = new Set();
    const regions = [];
    let groups = 0, special = 0;
    for (const target of session.targets) {
      if (!exactKeys(target, [
        'sourceKey', 'kind', 'representationKind', 'sourcePdfDriveId',
        'schedulePdfDriveId', 'roi', 'presentationOnly', 'sourceDerived',
        'currentGeometryClaim', 'asBuilt', 'canonical', 'publishToCURRENT', 'humanReview',
      ]) || typeof target.sourceKey !== 'string' ||
          !identifier.test(target.sourceKey) || seen.has(target.sourceKey) ||
          !Object.prototype.hasOwnProperty.call(p186ePixelRepresentationKinds, target.kind) ||
          target.representationKind !== p186ePixelRepresentationKinds[target.kind] ||
          target.sourcePdfDriveId !== p186ePixelSourcePdfDriveId ||
          target.schedulePdfDriveId !== (target.kind === 'group' ? p186ePixelSchedulePdfDriveId : null) ||
          target.presentationOnly !== true || target.sourceDerived !== true ||
          target.currentGeometryClaim !== false || target.asBuilt !== false ||
          target.canonical !== false || target.publishToCURRENT !== false ||
          target.humanReview !== 'NOT_RUN' ||
          !exactKeys(target.roi, ['x', 'y', 'width', 'height']) ||
          ![target.roi.x, target.roi.y, target.roi.width, target.roi.height].every(integer) ||
          target.roi.x < 0 || target.roi.y < 0 ||
          target.roi.width < 3 || target.roi.height < 3 ||
          target.roi.x + target.roi.width > width ||
          target.roi.y + target.roi.height > height) {
        reject('historical source target, original ID, ROI or no-promotion');
      }
      seen.add(target.sourceKey);
      regions.push(target.roi);
      if (target.kind === 'group') groups++; else special++;
    }
    if (groups !== expected.group || special !== expected.special ||
        Object.keys(session.hiddenFrames).length !== expected.total ||
        Object.keys(session.hiddenFrames).some(key => !seen.has(key))) {
      reject('source group/special roster or hidden frame key parity');
    }
    // Reject intersecting label boxes: one amber source-label pixel cannot be
    // claimed as proof for two historical labels.
    for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i], b = regions[j];
      if (a.x < b.x + b.width && b.x < a.x + a.width &&
          a.y < b.y + b.height && b.y < a.y + a.height) {
        reject('overlapping source label ROIs');
      }
    }
    const identities = [];
    for (const target of session.targets) {
      const hidden = session.hiddenFrames[target.sourceKey];
      rgbaFrame(hidden, context);
      if (hidden.width !== width || hidden.height !== height) reject('frame dimensions mismatch');
      let lost = 0, gained = 0, outsideChanged = 0, baselineAmber = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const inside = x >= target.roi.x && x < target.roi.x + target.roi.width &&
          y >= target.roi.y && y < target.roi.y + target.roi.height;
        if (inside) {
          if (amber(session.baseline.pixels, idx)) {
            baselineAmber++;
            if (!amber(hidden.pixels, idx) && pixelChanged(session.baseline.pixels, hidden.pixels, idx)) {
              lost++;
            }
          }
          // A moved source marker can lose its old pixels while gaining new
          // amber pixels elsewhere inside the same ROI. Loss alone is not proof.
          if (!amber(session.baseline.pixels, idx) && amber(hidden.pixels, idx) &&
              pixelChanged(session.baseline.pixels, hidden.pixels, idx)) gained++;
        } else if (pixelChanged(session.baseline.pixels, hidden.pixels, idx)) {
          outsideChanged++;
        }
      }
      if (baselineAmber < minLostPixels || lost < minLostPixels ||
          outsideChanged > maxOutsidePixelChanges || gained !== 0) {
        reject('target not individually visible, gained amber pixels or outside-ROI frame changed: ' + target.sourceKey);
      }
      identities.push(Object.freeze({
        sourceKey: target.sourceKey, kind: target.kind, lostAmberPixels: lost,
        gainedAmberPixels: gained, outsidePixelChanges: outsideChanged,
      }));
    }
    result[floor] = Object.freeze({
      targets: expected.total, groups, special, visuallyIsolated: identities.length,
      identities: Object.freeze(identities),
    });
  }
  if (processed.size !== 2) reject('both D floor views required');
  return Object.freeze({
    status: 'SUPPLIED_PIXELS_SOURCE_ONLY_PASS',
    targetCount: 34, D1F: result.D1F, D2F: result.D2F,
    sourceAuthenticated: false, productionScreenshotVerified: false,
    humanReview: 'NOT_RUN', currentGeometry: false, canonical: false, asBuilt: false,
  });
}
