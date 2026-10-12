/**
 * P137E scene67: independent two-face, three-device rendered-pixel delta gate.
 * This consumes caller-supplied RGBA frames, NOT an authenticated screenshot.
 * No GLB identity, physical XY/Z, production or HUMAN_REVIEW PASS follows.
 */
const ids = Object.freeze({
  NORTH: Object.freeze(['D_THEMO_CURRENT_LOBBY_01']),
  SOUTH: Object.freeze(['D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01']),
});
const fail = (why) => { throw new Error('P137E two-face pixel gate: ' + why); };
const requireThat = (condition, why) => { if (!condition) fail(why); };
const own = (record, key) => Object.prototype.hasOwnProperty.call(record, key);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value) => Number.isSafeInteger(value);

function sourceGate(source) {
  requireThat(isRecord(source) &&
    source.sceneIndex === 67 &&
    source.focusedRootNode === 1107 &&
    source.originalWallNode === 798 &&
    source.originalWallMesh === 406 &&
    source.workTestOnly === true &&
    source.canonical === false &&
    source.currentGeometry === false &&
    source.asBuilt === false &&
    source.publishToCURRENT === false &&
    source.humanReview === 'NOT_RUN',
  'wrong original source or unsafe promotion');
}
function frameGate(frame, width, height, cameraKey) {
  requireThat(isRecord(frame) && frame.width === width && frame.height === height &&
    frame.cameraKey === cameraKey &&
    frame.rgba != null &&
    (frame.rgba instanceof Uint8Array ||
      frame.rgba instanceof Uint8ClampedArray ||
      Array.isArray(frame.rgba)) &&
    frame.rgba.length === width * height * 4, 'invalid or mismatched RGBA frame');
  for (let p = 0; p < frame.rgba.length; p++) {
    const c = frame.rgba[p];
    requireThat(integer(c) && c >= 0 && c <= 255, 'nonbyte RGBA');
  }
}
const whiteHousing = (pixels, i) => {
  const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
  return a >= 230 && r >= 218 && g >= 218 && b >= 215 &&
    Math.max(r, g, b) - Math.min(r, g, b) <= 45;
};
const inCircle = (x, y, target) =>
  (x - target.x) ** 2 + (y - target.y) ** 2 <= target.radius ** 2;

function viewGate(view, side) {
  requireThat(isRecord(view) && view.side === side &&
    integer(view.width) && integer(view.height) &&
    view.width >= 32 && view.width <= 4096 &&
    view.height >= 32 && view.height <= 4096 &&
    typeof view.cameraKey === 'string' && view.cameraKey.length >= 4 &&
    view.cameraKey.length <= 200 &&
    Array.isArray(view.projectedTargets) &&
    view.projectedTargets.length === ids[side].length &&
    isRecord(view.hiddenFrames) &&
    Object.keys(view.hiddenFrames).length === ids[side].length,
  'view framing, camera or target cardinality');

  const targets = new Map();
  for (const t of view.projectedTargets) {
    requireThat(isRecord(t) && ids[side].includes(t.logicalDeviceId) &&
      !targets.has(t.logicalDeviceId) &&
      integer(t.x) && integer(t.y) && integer(t.radius) &&
      t.radius >= 4 && t.radius <= 96 &&
      t.x - t.radius >= 0 && t.y - t.radius >= 0 &&
      t.x + t.radius < view.width && t.y + t.radius < view.height,
    'unknown, duplicate or clipped source target ROI');
    targets.set(t.logicalDeviceId, t);
  }
  for (const id of ids[side]) requireThat(targets.has(id), 'missing side target ' + id);
  for (const a of targets.values()) for (const b of targets.values()) {
    if (a === b) continue;
    requireThat((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > (a.radius + b.radius) ** 2,
      'source target ROI overlap');
  }

  frameGate(view.baseline, view.width, view.height, view.cameraKey);
  const results = [];
  for (const id of ids[side]) {
    requireThat(own(view.hiddenFrames, id), 'missing one-device-hidden frame');
    const hidden = view.hiddenFrames[id];
    frameGate(hidden, view.width, view.height, view.cameraKey);
    const roi = targets.get(id);
    let lost = 0, newWhite = 0, outsideChanges = 0, otherTargetChanges = 0;
    for (let y = 0; y < view.height; y++) for (let x = 0; x < view.width; x++) {
      const i = (y * view.width + x) * 4;
      const before = whiteHousing(view.baseline.rgba, i);
      const after = whiteHousing(hidden.rgba, i);
      const selected = inCircle(x, y, roi);
      const changed = [0, 1, 2, 3].some(c =>
        Math.abs(view.baseline.rgba[i + c] - hidden.rgba[i + c]) > 8);
      if (selected) {
        if (before && !after) lost++;
        if (!before && after) newWhite++;
      } else if (changed) {
        outsideChanges++;
        if ([...targets.values()].some(t => t !== roi && inCircle(x, y, t))) {
          otherTargetChanges++;
        }
      }
    }
    requireThat(lost >= 18 && newWhite === 0 &&
      outsideChanges <= 2 && otherTargetChanges === 0,
    'individual white-housing delta missing, swapped or outside source ROI: ' + id);
    results.push(Object.freeze({ logicalDeviceId: id, side, lostHousingPixels: lost }));
  }
  return results;
}

/**
 * Requires NORTH lobby + SOUTH bedroom and bathroom on their respective
 * source-derived camera frames. All results are synthetic/source-only until
 * a separate authenticated source byte and production screenshot gate passes.
 */
export function inspectP137ETwoFacePixelIsolation(evidence) {
  requireThat(isRecord(evidence), 'evidence missing');
  sourceGate(evidence.source);
  requireThat(Array.isArray(evidence.views) && evidence.views.length === 2,
    'two distinct source-wall faces required');
  const bySide = new Map();
  for (const view of evidence.views) {
    requireThat(isRecord(view) && own(ids, view.side) &&
      !bySide.has(view.side), 'duplicate or unknown view side');
    bySide.set(view.side, view);
  }
  // Distinct side labels alone do not prove distinct wall-face camera frames.
  // A copied NORTH frame cannot stand in for a SOUTH source-wall capture.
  const north = bySide.get('NORTH');
  const south = bySide.get('SOUTH');
  requireThat(north && south, 'NORTH and SOUTH source-wall faces required');
  requireThat(typeof north.cameraKey === 'string' &&
    typeof south.cameraKey === 'string' &&
    north.cameraKey !== south.cameraKey,
  'two source-wall faces require distinct cameras');
  const results = [];
  for (const side of ['NORTH', 'SOUTH']) {
    results.push(...viewGate(bySide.get(side), side));
  }
  requireThat(results.length === 3, 'three devices required');
  return Object.freeze({
    sourceOnly: true,
    sourcePixelEvidencePass: true,
    originalGlbAuthenticated: false,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
    canonical: false,
    asBuilt: false,
    devices: Object.freeze(results),
  });
}
