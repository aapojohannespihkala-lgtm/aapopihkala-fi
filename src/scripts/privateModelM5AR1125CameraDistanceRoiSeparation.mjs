import { deriveM5AR1125SourceCameraCenters } from './privateModelM5AR1125SourceCameraCenters.mjs';
import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

// Source-scene camera framing PRECONDITION for the existing 13-target R1125
// screenshot gate. Every trial is independently projected from the SAME real
// scene63 source objects: neither manual pixel points nor per-target synthetic
// substitutes can establish this gate. No model, production or review promotion.
const expectedKeys = Object.keys(m5aR1125SourcePixelKinds);
const allowedId = /^[a-zA-Z0-9_-]{1,64}$/;

export function chooseM5AR1125SeparatedCameraFraming({
  sceneRoot, THREE, sceneIndex, imageWidth, imageHeight, candidates,
  edgePaddingPx = 4,
}) {
  if (sceneIndex !== 63 ||
      !Number.isInteger(imageWidth) || imageWidth < 128 ||
      !Number.isInteger(imageHeight) || imageHeight < 128 ||
      imageWidth * imageHeight > 16_000_000 ||
      !Array.isArray(candidates) || candidates.length < 1 || candidates.length > 24 ||
      !Number.isInteger(edgePaddingPx) || edgePaddingPx < 0 || edgePaddingPx > 64) {
    throw new Error('R1125 requires scene63, bounded viewport and 1..24 camera trials');
  }
  let previousDistance = 0;
  const attempts = [];
  for (const item of candidates) {
    if (!item || !allowedId.test(String(item.id ?? '')) ||
        !Number.isFinite(item.distanceLocalUnits) ||
        item.distanceLocalUnits <= previousDistance ||
        item.distanceLocalUnits > 10_000 ||
        item.camera?.isPerspectiveCamera !== true) {
      throw new Error('R1125 camera trials must use strictly increasing finite perspective distances');
    }
    previousDistance = item.distanceLocalUnits;

    let sourceProof;
    try {
      sourceProof = deriveM5AR1125SourceCameraCenters({
        sceneRoot, camera: item.camera, THREE, sceneIndex, imageWidth, imageHeight,
      });
    } catch (error) {
      attempts.push({
        id: item.id, distanceLocalUnits: item.distanceLocalUnits,
        status: 'REJECTED_SOURCE_PROJECTION', reason: String(error?.message ?? error),
      });
      continue;
    }
    if (sourceProof.sourceTargetCount !== expectedKeys.length ||
        sourceProof.sourceSceneIndex !== 63 ||
        !Array.isArray(sourceProof.centers) ||
        sourceProof.centers.length !== expectedKeys.length ||
        sourceProof.originalGlbDigestAuthenticated !== false ||
        sourceProof.productionScreenshotVerified !== false ||
        sourceProof.humanReview !== 'NOT_RUN') {
      throw new Error('R1125 invalid or promoted source-camera proof');
    }

    const points = new Map();
    let margin = Infinity;
    for (const point of sourceProof.centers) {
      if (!expectedKeys.includes(point.key) || points.has(point.key) ||
          !Number.isFinite(point.u) || !Number.isFinite(point.v)) {
        throw new Error('R1125 missing or duplicate source-camera point');
      }
      const x = point.u * (imageWidth - 1), y = point.v * (imageHeight - 1);
      points.set(point.key, { x, y });
      margin = Math.min(margin, x, y, imageWidth - 1 - x, imageHeight - 1 - y);
    }
    if (points.size !== expectedKeys.length) {
      throw new Error('R1125 missing source camera IDs');
    }
    let nearestSamePalettePx = Infinity;
    for (let i = 0; i < expectedKeys.length; i++) {
      for (let j = i + 1; j < expectedKeys.length; j++) {
        const firstKey = expectedKeys[i], secondKey = expectedKeys[j];
        if (m5aR1125SourcePixelKinds[firstKey] !==
            m5aR1125SourcePixelKinds[secondKey]) continue;
        const a = points.get(firstKey), b = points.get(secondKey);
        nearestSamePalettePx = Math.min(
          nearestSamePalettePx, Math.hypot(a.x - b.x, a.y - b.y),
        );
      }
    }
    const minAllowedGapPx = sourceProof.radiusPx * 2 + 2;
    const minAllowedMarginPx = sourceProof.radiusPx + edgePaddingPx;
    if (nearestSamePalettePx <= minAllowedGapPx ||
        margin <= minAllowedMarginPx) {
      attempts.push({
        id: item.id, distanceLocalUnits: item.distanceLocalUnits,
        status: 'REJECTED_ROI_CLEARANCE',
        nearestSamePalettePx, marginPx: margin, minAllowedGapPx,
        minAllowedMarginPx,
      });
      continue;
    }

    attempts.push({
      id: item.id, distanceLocalUnits: item.distanceLocalUnits,
      status: 'SOURCE_ROI_CLEARANCE_READY',
    });
    // Sorted trial distances => first PASS is the tightest camera among these
    // actual caller-supplied trial cameras. Does NOT claim production pixels.
    return {
      sourceSceneIndex: 63,
      sourceTargetCount: 13,
      chosenCameraId: item.id,
      chosenDistanceLocalUnits: item.distanceLocalUnits,
      sourceCameraProjection: sourceProof,
      nearestSamePalettePx,
      minimumViewportMarginPx: margin,
      requiredPaletteSeparationPx: minAllowedGapPx,
      requiredViewportMarginPx: minAllowedMarginPx,
      attempts,
      sourceOnly: true,
      originalGlbDigestAuthenticated: false,
      productionScreenshotVerified: false,
      humanReview: 'NOT_RUN',
    };
  }
  throw new Error('R1125 no source-verified 13/13 ROI-separated camera among supplied trials: ' +
    attempts.map((t) => t.id + ':' + t.status).join(','));
}
