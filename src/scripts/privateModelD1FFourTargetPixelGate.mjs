import { D1F_COMBINED_WALL_ASSETS } from './privateModelD1FCombinedWallSceneContract.mjs';

/**
 * D1F I03 + 3 corners differential screenshot contract (NOT production proof).
 *
 * The authenticated browser owner must FIRST verify the exact GLB bytes and
 * the target object identity, make before/after captures with the same camera,
 * and restore the target. This pure helper only inspects the supplied RGBA
 * pixels; it cannot authenticate a browser, GLB source or suppression action.
 *
 * For I03, suppress the 36 source indices (12 triangles) using original
 * vertices 128..135. The first 36 indices in the 115/100 successor belong to
 * the separate left wall. Never suppress the whole combined primitive. For corners, hide only the
 * corresponding independent source-derived corner node.
 */
export const D1F_FOUR_PIXEL_TARGETS = Object.freeze([
  'I03',
  'CORNER_NORTH_X2337',
  'CORNER_SOUTH_X2337',
  'CORNER_MIDDLE_X2589',
]);
export const D1F_FIVE_PIXEL_TARGETS = Object.freeze([...D1F_FOUR_PIXEL_TARGETS, 'BASIN']);
const MEASURED_SOURCE_SHA = D1F_COMBINED_WALL_ASSETS['d1f-measured-wall-140-100-2350-b710-basin-20261014'].sha256;
export const D1F_PIXEL_SUPPRESSION = Object.freeze({
  I03: 'I03_SOURCE_VERTEX_128_135_TRIANGLES_ONLY',
  CORNER_NORTH_X2337: 'CORNER_NODE_VISIBILITY_ONLY',
  CORNER_SOUTH_X2337: 'CORNER_NODE_VISIBILITY_ONLY',
  CORNER_MIDDLE_X2589: 'CORNER_NODE_VISIBILITY_ONLY',
});
const D1F_MEASURED_PIXEL_SUPPRESSION = Object.freeze({
  ...D1F_PIXEL_SUPPRESSION,
  BASIN: 'BASIN_NODE_VISIBILITY_ONLY',
});
const fail = (reason) => { throw new Error('D1F_FOUR_TARGET_PIXEL_GATE_REJECTED: ' + reason); };
const validDigest = (d) => typeof d === 'string' && /^[a-f0-9]{64}$/.test(d);
const integer = (x) => Number.isSafeInteger(x) && x >= 0;
const validFrame = (f) =>
  f && integer(f.width) && integer(f.height) &&
  f.width >= 32 && f.height >= 32 &&
  f.width * f.height <= 10_000_000 &&
  f.rgba instanceof Uint8Array &&
  f.rgba.length === f.width * f.height * 4 &&
  typeof f.cameraFingerprint === 'string' && f.cameraFingerprint.length >= 8 &&
  validDigest(f.glbSha256) &&
  typeof f.variant === 'string' && f.variant.length > 0;

const pixelDelta = (a, b, offset, threshold) =>
  Math.max(Math.abs(a[offset] - b[offset]),
    Math.abs(a[offset + 1] - b[offset + 1]),
    Math.abs(a[offset + 2] - b[offset + 2])) >= threshold;

function verifySample(sample, minRoiChangedPixels, outsideChangeAllowance,
  targetIds = D1F_FOUR_PIXEL_TARGETS, suppression = D1F_PIXEL_SUPPRESSION, requiredSha = null) {
  const { targetId, baseline, suppressed, roi } = sample;
  if (!targetIds.includes(targetId)) fail('unknown target ID');
  if (sample.suppressionMethod !== suppression[targetId] ||
      sample.targetIdentityVerified !== true ||
      sample.suppressionRestored === false ||
      sample.suppressionRestored !== true ||
      sample.roiProvenance !== 'PROJECTED_EXACT_TARGET_GEOMETRY') {
    fail(targetId + ': suppression/ROI provenance not verified');
  }
  if (!validFrame(baseline) || !validFrame(suppressed) ||
      baseline.width !== suppressed.width ||
      baseline.height !== suppressed.height ||
      baseline.cameraFingerprint !== suppressed.cameraFingerprint ||
      baseline.glbSha256 !== suppressed.glbSha256 ||
      baseline.variant !== suppressed.variant ||
      (requiredSha && (baseline.glbSha256 !== requiredSha || suppressed.glbSha256 !== requiredSha))) {
    fail(targetId + ': image size, camera, GLB or variant changed');
  }
  if (!roi || !integer(roi.x) || !integer(roi.y) ||
      !integer(roi.width) || !integer(roi.height) ||
      roi.width < 8 || roi.height < 8 ||
      roi.x + roi.width > baseline.width ||
      roi.y + roi.height > baseline.height) {
    fail(targetId + ': ROI invalid or clipped');
  }

  let changedInside = 0;
  let changedOutside = 0;
  const a = baseline.rgba, b = suppressed.rgba;
  for (let y = 0; y < baseline.height; y++) {
    for (let x = 0; x < baseline.width; x++) {
      const offset = 4 * (y * baseline.width + x);
      if (!pixelDelta(a, b, offset, 28)) continue;
      const inside = x >= roi.x && x < roi.x + roi.width &&
        y >= roi.y && y < roi.y + roi.height;
      if (inside) changedInside++;
      else changedOutside++;
    }
  }
  if (changedInside < minRoiChangedPixels) {
    fail(targetId + ': not enough changed pixels inside exact target ROI');
  }
  if (changedOutside > outsideChangeAllowance ||
      changedOutside > Math.floor(changedInside * 0.08)) {
    fail(targetId + ': unrelated canvas change detected outside target ROI');
  }
  return {
    targetId, changedInside, changedOutside,
    roi: { x: roi.x, y: roi.y, width: roi.width, height: roi.height },
    suppressionMethod: sample.suppressionMethod,
    // These assertions prove numerical change only, not live WebGL identity.
    result: 'PASS_TARGET_DIFFERENTIAL_PIXELS_ONLY',
  };
}

// A bounded camera search may inspect one sample; release still requires all four.
export function evaluateD1FOneTargetPixelSample(sample) { return verifySample(sample, 40, 8); }

function measuredSourceSha(candidateId) {
  const asset = Object.prototype.hasOwnProperty.call(D1F_COMBINED_WALL_ASSETS, candidateId)
    ? D1F_COMBINED_WALL_ASSETS[candidateId] : null;
  if (asset?.measuredCounter !== true) fail('unknown measured source candidate');
  return asset.sha256;
}

export function evaluateD1FOneMeasuredTargetPixelSample(sample, { candidateId = 'd1f-measured-wall-140-100-2350-b710-basin-20261014' } = {}) {
  return verifySample(sample, 40, 8,
    D1F_FIVE_PIXEL_TARGETS, D1F_MEASURED_PIXEL_SUPPRESSION, measuredSourceSha(candidateId));
}

export function evaluateD1FFourTargetPixelGate(
  samples, { minRoiChangedPixels = 40, outsideChangeAllowance = 8 } = {},
) {
  if (!Array.isArray(samples) || samples.length !== 4 ||
      !integer(minRoiChangedPixels) || minRoiChangedPixels < 40 ||
      !integer(outsideChangeAllowance) || outsideChangeAllowance > 8) {
    fail('four separate samples with fixed strict thresholds required');
  }
  const ids = samples.map(s => s?.targetId);
  if (new Set(ids).size !== 4 ||
      !D1F_FOUR_PIXEL_TARGETS.every(id => ids.includes(id))) {
    fail('four distinct I03 and original corner targets required');
  }
  const proofs = samples.map(s => verifySample(s, minRoiChangedPixels, outsideChangeAllowance));
  // No screenshot data, URLs or secret-bearing diagnostic values exported.
  return Object.freeze({
    gate: 'PASS_FOUR_INDEPENDENT_DIFFERENTIAL_PIXEL_CONTRACTS_ONLY',
    targets: proofs,
    checkedTargetCount: 4,
    originalGlbBytesAuthenticatedByThisFunction: false,
    actualBrowserWebGlVerifiedByThisFunction: false,
    productionPublicationVerifiedByThisFunction: false,
    humanReview: 'NOT_RUN',
  });
}

/** Source identity and screenshot ROI contract for the newer 80-scene measured work candidate.
 * Authentic publication, actual rendered pixels, camera provenance and target isolation
 * must still be proved independently by the trusted main browser runner.
 */
export function evaluateD1FFiveTargetPixelGate(
  samples, { minRoiChangedPixels = 40, outsideChangeAllowance = 8, candidateId = 'd1f-measured-wall-140-100-2350-b710-basin-20261014' } = {},
) {
  if (!Array.isArray(samples) || samples.length !== 5 ||
      !integer(minRoiChangedPixels) || minRoiChangedPixels < 40 ||
      !integer(outsideChangeAllowance) || outsideChangeAllowance > 8) {
    fail('five separate measured samples with fixed strict thresholds required');
  }
  const ids = samples.map(s => s?.targetId);
  if (new Set(ids).size !== 5 ||
      !D1F_FIVE_PIXEL_TARGETS.every(id => ids.includes(id))) {
    fail('five distinct measured I03, original corners and basin targets required');
  }
  // Per-frame source hashes do not prove the five samples share one scene.
  // Never combine different wall variants into a false five-target PASS.
  const variants = new Set(samples.map(s => s?.baseline?.variant));
  if (variants.size !== 1 || [...variants].some(v => typeof v !== 'string' || !v)) {
    fail('mixed or unknown measured wall variant');
  }
  const proofs = samples.map(s => verifySample(s, minRoiChangedPixels,
    outsideChangeAllowance, D1F_FIVE_PIXEL_TARGETS,
    D1F_MEASURED_PIXEL_SUPPRESSION, measuredSourceSha(candidateId)));
  return Object.freeze({
    gate: 'PASS_FIVE_INDEPENDENT_DIFFERENTIAL_PIXEL_CONTRACTS_ONLY',
    targets: proofs,
    checkedTargetCount: 5,
    originalGlbBytesAuthenticatedByThisFunction: false,
    actualBrowserWebGlVerifiedByThisFunction: false,
    productionPublicationVerifiedByThisFunction: false,
    humanReview: 'NOT_RUN',
  });
}
