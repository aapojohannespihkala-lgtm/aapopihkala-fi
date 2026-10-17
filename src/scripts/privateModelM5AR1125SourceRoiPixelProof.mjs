// Isolated R1125 screenshot pixel-evidence helper. No production workflow, model
// or CURRENT/canonical state is changed or approved by this module.
// The caller must derive all 13 projected source centers from the authenticated
// original R1125 scene 63 and verify the GLB/scene provenance separately.
// Synthetic/caller-supplied centers cannot by themselves prove source identity.
export const m5aR1125SourcePixelKinds = Object.freeze({
  G2_DRAIN_WELL_SOK1_001: 'wellGray',
  G2_DRAIN_WELL_SOK2_001: 'wellGray',
  G2_DRAIN_WELL_SOK3_001: 'wellGray',
  G2_DRAIN_WELL_PVK_001: 'wellGray',
  G2_DRAIN_LINK_PVK_SOK1_001: 'routeCyan',
  G2_DRAIN_LINK_PVK_SOK3_001: 'routeCyan',
  G2_DRAIN_LINK_SOK1_SOK2_001: 'routeCyan',
  G2_DRAIN_LINK_SOK3_BUILDING_END_001: 'routeCyan',
  G2_DRAIN_LINK_SOK2_BUILDING_END_001: 'routeCyan',
  G2_DRAIN_LINK_PVK_DISCHARGE_001: 'routeCyan',
  G2_DRAIN_LINK_PVK_PARKING_001: 'routeCyan',
  'boundary:PVK_DISCHARGE': 'boundaryYellow',
  'boundary:PVK_PARKING': 'boundaryYellow',
});

/**
 * Detect visible class-specific screenshot pixels for each distinct source ID.
 * Never infer identity from connected components: antialiasing splits wells
 * and can join distinct cyan routes. Each qualifying pixel is assigned to
 * at most one source ID, based on nearest projected center of its color class.
 *
 * Input centers are normalized canvas coordinates, not surveyed XY/Z.
 * This helper is ONLY one technical gate, not authenticated production proof,
 * approved placement, physical diameter, actual outlet or HUMAN_REVIEW.
 */
export function detectM5AR1125SourceProjectedPixels(rgba, width, height, projections) {
  if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    width * height > 2_304_000 ||
    rgba?.length !== width * height * 4
  ) throw new Error('R1125 pixel proof requires exact RGBA image dimensions');

  const expected = [
    ['G2_DRAIN_WELL_SOK1_001', 'wellGray'],
    ['G2_DRAIN_WELL_SOK2_001', 'wellGray'],
    ['G2_DRAIN_WELL_SOK3_001', 'wellGray'],
    ['G2_DRAIN_WELL_PVK_001', 'wellGray'],
    ['G2_DRAIN_LINK_PVK_SOK1_001', 'routeCyan'],
    ['G2_DRAIN_LINK_PVK_SOK3_001', 'routeCyan'],
    ['G2_DRAIN_LINK_SOK1_SOK2_001', 'routeCyan'],
    ['G2_DRAIN_LINK_SOK3_BUILDING_END_001', 'routeCyan'],
    ['G2_DRAIN_LINK_SOK2_BUILDING_END_001', 'routeCyan'],
    ['G2_DRAIN_LINK_PVK_DISCHARGE_001', 'routeCyan'],
    ['G2_DRAIN_LINK_PVK_PARKING_001', 'routeCyan'],
    ['boundary:PVK_DISCHARGE', 'boundaryYellow'],
    ['boundary:PVK_PARKING', 'boundaryYellow'],
  ];
  if (!Array.isArray(projections) || projections.length !== expected.length) {
    throw new Error('R1125 requires exact 13 source-projected targets');
  }

  const provided = new Map();
  for (const item of projections) {
    if (!item || typeof item !== 'object' ||
        typeof item.key !== 'string' || provided.has(item.key) ||
        !Number.isFinite(item.u) || !Number.isFinite(item.v) ||
        item.u <= 0 || item.u >= 1 || item.v <= 0 || item.v >= 1) {
      throw new Error('R1125 source projection is duplicate, invalid or out of frame');
    }
    provided.set(item.key, item);
  }
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
  const radiusSquared = radius * radius;
  const targets = expected.map(([key, kind]) => {
    const point = provided.get(key);
    if (!point) throw new Error('R1125 source projection missing exact source ID: ' + key);
    return {
      key, kind, x: Math.round(point.u * (width - 1)),
      y: Math.round(point.v * (height - 1)),
      classPixels: 0, minimumPixels: kind === 'boundaryYellow' ? 2 : 8,
    };
  });

  // A single visible color patch must not prove two nearby source identities.
  // Same-palette projected ROIs that overlap are ambiguous, even when their
  // nearest-center pixel counts each exceed the acceptance threshold.
  const ambiguousKeys = new Set();
  const minimumSeparationSquared = (radius * 2) ** 2;
  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const a = targets[i], b = targets[j];
      if (a.kind !== b.kind) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy <= minimumSeparationSquared) {
        ambiguousKeys.add(a.key);
        ambiguousKeys.add(b.key);
      }
    }
  }

  const classPixelCounts = { wellGray: 0, routeCyan: 0, boundaryYellow: 0 };
  for (let i = 0; i < width * height; i += 1) {
    const off = i * 4;
    const r = rgba[off], g = rgba[off + 1], b = rgba[off + 2];
    if (rgba[off + 3] < 220) continue;
    const gray = r > 75 && r < 215 && g > 80 && g < 225 &&
      b > 85 && b < 235 && Math.abs(r - g) < 42 && Math.abs(g - b) < 44;
    const cyan = g > 92 && b > 110 && r < g * 0.62 &&
      b > g * 1.04 && b < g * 1.9;
    const yellow = r > 120 && g > 78 && r > g * 1.07 &&
      b < g * 0.73 && r < g * 1.9;
    const kind = cyan ? 'routeCyan' : yellow ? 'boundaryYellow' :
      gray ? 'wellGray' : null;
    if (!kind) continue;
    classPixelCounts[kind] += 1;

    const x = i % width, y = Math.floor(i / width);
    let winner = null, bestDistance = radiusSquared + 1;
    for (const target of targets) {
      if (target.kind !== kind) continue;
      const dx = x - target.x, dy = y - target.y;
      const distance = dx * dx + dy * dy;
      // Strict less-than prevents one pixel from counting for two targets.
      if (distance <= radiusSquared && distance < bestDistance) {
        bestDistance = distance;
        winner = target;
      }
    }
    if (winner) winner.classPixels += 1;
  }

  const sourceRoiPixels = targets.map((target) => ({
    key: target.key,
    kind: target.kind,
    classPixels: target.classPixels,
    minimumPixels: target.minimumPixels,
  }));
  const missingKeys = sourceRoiPixels
    .filter((item) => item.classPixels < item.minimumPixels)
    .map((item) => item.key);
  const ambiguousSourceKeys = sourceRoiPixels
    .filter((item) => ambiguousKeys.has(item.key))
    .map((item) => item.key);
  return {
    requiredCounts: { wellGray: 4, routeCyan: 7, boundaryYellow: 2 },
    radiusPx: radius,
    classPixelCounts,
    sourceRoiPixels,
    missingKeys,
    ambiguousSourceKeys,
    allSourceTargetsVisible: missingKeys.length === 0 && ambiguousSourceKeys.length === 0,
    // Pixel-only: source authenticity and physical validity remain separate.
    productionProvenanceVerified: false,
    humanReview: 'NOT_RUN',
  };
}

/** Serializable, safely invoked Chromium proof for a captured PNG screenshot. */
export function buildM5AR1125BrowserScreenshotProofExpression(pngDataUrl, projections) {
  if (
    typeof pngDataUrl !== 'string' ||
    pngDataUrl.length > 12_000_000 ||
    !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(pngDataUrl) ||
    !Array.isArray(projections) || projections.length !== 13
  ) throw new Error('R1125 browser proof requires PNG data URL and 13 centers');
  return (
    '(async (url, centers) => {' +
    ' const image = new Image(); image.src = url; await image.decode();' +
    ' if (!Number.isInteger(image.width) || !Number.isInteger(image.height) ||' +
    '     image.width < 1 || image.height < 1 ||' +
    '     image.width * image.height > 2304000)' +
    '   throw new Error("R1125 PNG canvas pixel budget exceeded");' +
    ' const canvas = document.createElement("canvas");' +
    ' canvas.width = image.width; canvas.height = image.height;' +
    ' const context = canvas.getContext("2d");' +
    ' if (!context) throw new Error("R1125 PNG canvas unavailable");' +
    ' context.drawImage(image, 0, 0);' +
    ' const rgba = context.getImageData(0, 0, image.width, image.height).data;' +
    ' const detector = ' + detectM5AR1125SourceProjectedPixels.toString() + ';' +
    ' return detector(rgba, image.width, image.height, centers);' +
    '})(' + JSON.stringify(pngDataUrl) + ',' + JSON.stringify(projections) + ')'
  );
}
