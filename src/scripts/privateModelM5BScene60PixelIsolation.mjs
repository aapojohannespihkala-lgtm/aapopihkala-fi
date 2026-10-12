/**
 * M5B scene60: five vertical downspout WORK_TEST proxy screenshot-delta gate.
 *
 * The caller must obtain an unchanged-camera baseline RGBA frame and five
 * independent same-camera frames, each with exactly one corresponding proxy
 * hidden. Projected source-target ROIs must be derived from the actual loaded
 * scene and camera, not guessed from the screenshot.
 *
 * This verifies caller-provided pixels only. No GLB authentication, production
 * viewer autoload, physical downspout location, or HUMAN_REVIEW is proven.
 */
export const m5bScene60ProxyIds = Object.freeze([
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_1',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_2',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_3',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_CORNER_4',
  'M5B_VERTICAL_DOWNSPOUT_PROXY_SOUTH_FACADE_C_B',
]);
const idSet = new Set(m5bScene60ProxyIds);
const fail = (reason) => { throw new Error('M5B scene60 five-pixel gate: ' + reason); };
const check = (value, reason) => { if (!value) fail(reason); };
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const integer = Number.isSafeInteger;

const sourceCheck = (s) => check(record(s) &&
  s.sceneIndex === 60 &&
  s.candidateId === 'm5b-z2r-roof-stormwater-structural-rebuilt' &&
  s.reviewId === 'm5b-roof-stormwater-current-review' &&
  s.presentation === 'WORK_TEST_VIEW' &&
  s.targetKind === 'THICK_VISIBLE_TUBE_PROXY' &&
  s.exactXYClaim === false && s.exactZClaim === false &&
  s.currentGeometryClaim === false && s.asBuiltClaim === false &&
  s.canonical === false && s.publishToCURRENT === false &&
  s.humanReview === 'NOT_RUN',
  'wrong scene60 source or unsafe promotion');

function frameCheck(frame, width, height, cameraKey) {
  check(record(frame) && frame.width === width && frame.height === height &&
    frame.cameraKey === cameraKey &&
    (frame.rgba instanceof Uint8Array ||
     frame.rgba instanceof Uint8ClampedArray ||
     Array.isArray(frame.rgba)) &&
    frame.rgba.length === width * height * 4,
  'invalid RGBA dimensions or camera');
  if (Array.isArray(frame.rgba)) {
    check(frame.rgba.every(v => integer(v) && v >= 0 && v <= 255),
      'invalid RGBA byte');
  }
}

// The scene60 proxy material is blue #2fa8ff, with 0.8 opacity. Allow
// antialiasing and background blending without accepting generic gray walls.
function blue(p, i) {
  const r = p[i], g = p[i + 1], b = p[i + 2], a = p[i + 3];
  return a >= 230 && r <= 165 && g >= 95 && b >= 160 &&
    g - r >= 28 && b - g >= 26 && b - r >= 72;
}
function inside(x, y, region) {
  const dx = x - region.x, dy = y - region.y;
  return dx * dx + dy * dy <= region.radius * region.radius;
}

export function inspectM5BScene60FivePixelIsolation(evidence) {
  check(record(evidence), 'evidence missing');
  sourceCheck(evidence.source);
  const view = evidence.view;
  check(record(view) && integer(view.width) && integer(view.height) &&
    view.width >= 64 && view.width <= 2048 &&
    view.height >= 64 && view.height <= 2048 &&
    typeof view.cameraKey === 'string' && view.cameraKey.length >= 5 &&
    view.cameraKey.length <= 200 &&
    Array.isArray(view.projectedTargets) &&
    view.projectedTargets.length === 5 &&
    record(view.hiddenFrames) &&
    Object.keys(view.hiddenFrames).length === 5,
  'viewport, camera or exact five-target cardinality');

  const rois = new Map();
  for (const roi of view.projectedTargets) {
    check(record(roi) && idSet.has(roi.logicalProxyId) &&
      !rois.has(roi.logicalProxyId) &&
      integer(roi.x) && integer(roi.y) && integer(roi.radius) &&
      roi.radius >= 5 && roi.radius <= 96 &&
      roi.x - roi.radius >= 0 && roi.y - roi.radius >= 0 &&
      roi.x + roi.radius < view.width &&
      roi.y + roi.radius < view.height,
    'unknown, duplicate or clipped source proxy ROI');
    rois.set(roi.logicalProxyId, roi);
  }
  for (const id of m5bScene60ProxyIds) {
    check(rois.has(id) && own(view.hiddenFrames, id), 'missing source proxy ' + id);
  }
  const regions = [...rois.values()];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i], b = regions[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      check(dx * dx + dy * dy > (a.radius + b.radius) ** 2,
        'overlapping source target ROIs');
    }
  }
  frameCheck(view.baseline, view.width, view.height, view.cameraKey);

  const devices = [];
  for (const id of m5bScene60ProxyIds) {
    const hidden = view.hiddenFrames[id];
    frameCheck(hidden, view.width, view.height, view.cameraKey);
    const roi = rois.get(id);
    let lostBluePixels = 0, newBluePixels = 0, outsideChanges = 0;
    for (let y = 0; y < view.height; y++) {
      for (let x = 0; x < view.width; x++) {
        const i = (y * view.width + x) * 4;
        const selected = inside(x, y, roi);
        const before = blue(view.baseline.rgba, i);
        const after = blue(hidden.rgba, i);
        if (selected) {
          if (before && !after) lostBluePixels++;
          if (!before && after) newBluePixels++;
        } else if ([0, 1, 2, 3].some(c =>
          Math.abs(view.baseline.rgba[i + c] - hidden.rgba[i + c]) > 8)) {
          outsideChanges++;
        }
      }
    }
    check(lostBluePixels >= 18 && newBluePixels === 0 &&
      outsideChanges <= 2,
    'missing, swapped or nonlocal blue downspout pixel delta: ' + id);
    devices.push(Object.freeze({ logicalProxyId: id, lostBluePixels }));
  }
  return Object.freeze({
    sceneIndex: 60,
    sourceOnly: true,
    allFiveProxyPixelDeltasPresent: true,
    originalGlbAuthenticated: false,
    productionViewerAutoloadVerified: false,
    productionScreenshotVerified: false,
    canonical: false,
    asBuilt: false,
    humanReview: 'NOT_RUN',
    devices: Object.freeze(devices),
  });
}
