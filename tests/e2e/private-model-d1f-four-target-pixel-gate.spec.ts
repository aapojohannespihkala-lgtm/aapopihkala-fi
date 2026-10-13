import { test, expect } from '@playwright/test';
// @ts-ignore - pure Node/browser-safe pixel proof contract; no real browser render.
import {
  D1F_FOUR_PIXEL_TARGETS,
  D1F_PIXEL_SUPPRESSION,
  evaluateD1FFourTargetPixelGate,
} from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';

const W = 100, H = 80;
const digest = '1cb9a785e51a00b8abe9bbd81801c25326f5219740bdc18176649ee39b35b0a2';
const camera = 'same-projection-view-and-pose-01';
const regions = [
  { x: 12, y: 15, width: 15, height: 15 },
  { x: 40, y: 15, width: 15, height: 15 },
  { x: 65, y: 15, width: 15, height: 15 },
  { x: 40, y: 50, width: 15, height: 15 },
];

function rgba(r = 35, g = 40, b = 48) {
  const pixels = new Uint8Array(W * H * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
  }
  return pixels;
}
const alter = (data: Uint8Array, area: typeof regions[number], color = 235) => {
  for (let y = area.y; y < area.y + area.height; y++)
    for (let x = area.x; x < area.x + area.width; x++)
      data[(y * W + x) * 4] = color;
};
function proof(i: number) {
  const targetId = D1F_FOUR_PIXEL_TARGETS[i] as keyof typeof D1F_PIXEL_SUPPRESSION;
  const baseline = { width: W, height: H, rgba: rgba(), cameraFingerprint: camera,
    glbSha256: digest, variant: 'WEST_ANCHOR_725_895_740' };
  const suppressed = { ...baseline, rgba: rgba() };
  alter(suppressed.rgba, regions[i]);
  return {
    targetId, baseline, suppressed, roi: { ...regions[i] },
    suppressionMethod: String(D1F_PIXEL_SUPPRESSION[targetId]),
    targetIdentityVerified: true,
    roiProvenance: 'PROJECTED_EXACT_TARGET_GEOMETRY',
    suppressionRestored: true,
  };
}
const allProofs = () => [0, 1, 2, 3].map(proof);

test('four separately zoomed source targets pass only scoped pixel-change math, never production', () => {
  const result = evaluateD1FFourTargetPixelGate(allProofs());
  expect(result.gate).toBe('PASS_FOUR_INDEPENDENT_DIFFERENTIAL_PIXEL_CONTRACTS_ONLY');
  expect(result.targets.map((x: any) => x.targetId)).toEqual(D1F_FOUR_PIXEL_TARGETS);
  expect(result.targets.every((x: any) =>
    x.changedInside === 225 && x.changedOutside === 0 &&
    x.result === 'PASS_TARGET_DIFFERENTIAL_PIXELS_ONLY')).toBe(true);
  expect(result).toMatchObject({
    checkedTargetCount: 4, originalGlbBytesAuthenticatedByThisFunction: false,
    actualBrowserWebGlVerifiedByThisFunction: false,
    productionPublicationVerifiedByThisFunction: false, humanReview: 'NOT_RUN',
  });
});

test('rejects generic WebGL screen change outside actual target ROI', () => {
  const p = allProofs();
  // Deliberate entire-frame change (e.g., camera orbit, global repaint).
  p[0].suppressed.rgba = rgba(255, 1, 1);
  expect(() => evaluateD1FFourTargetPixelGate(p))
    .toThrow('unrelated canvas change detected outside target ROI');
});

test('rejects a visually present but unchanged target ROI', () => {
  const p = allProofs();
  p[2].suppressed.rgba = rgba();
  expect(() => evaluateD1FFourTargetPixelGate(p))
    .toThrow('not enough changed pixels inside exact target ROI');
});

test('rejects canvas changing somewhere else even when baseline has visible pixels', () => {
  const p = allProofs();
  p[1].suppressed.rgba = rgba();
  alter(p[1].suppressed.rgba, regions[3]);
  expect(() => evaluateD1FFourTargetPixelGate(p))
    .toThrow('not enough changed pixels inside exact target ROI');
});

test('rejects camera drift or source SHA/variant change between before and after', () => {
  const p = allProofs();
  p[1].suppressed.cameraFingerprint = 'different-camera-fingerprint-02';
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('camera, GLB or variant changed');
  p[1].suppressed.cameraFingerprint = camera;
  p[1].suppressed.glbSha256 = 'a'.repeat(64);
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('camera, GLB or variant changed');
  p[1].suppressed.glbSha256 = digest;
  p[1].suppressed.variant = 'EAST_ANCHOR_740_895_725';
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('camera, GLB or variant changed');
});

test('rejects duplicate corners or absence of I03', () => {
  const p = allProofs();
  p[0].targetId = p[1].targetId;
  expect(() => evaluateD1FFourTargetPixelGate(p))
    .toThrow('four distinct I03 and original corner targets required');
});

test('rejects visibility suppression of whole I03 + sauna mesh instead of I03 triangles', () => {
  const p = allProofs();
  p[0].suppressionMethod = 'WHOLE_WALL_AND_SAUNA_VISIBILITY';
  expect(() => evaluateD1FFourTargetPixelGate(p))
    .toThrow('suppression/ROI provenance not verified');
});

test('rejects unsupported ROI provenance, target identity or unrecovered visibility', () => {
  const p = allProofs();
  p[1].roiProvenance = 'GENERIC_CANVAS_RECT';
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('suppression/ROI provenance not verified');
  p[1].roiProvenance = 'PROJECTED_EXACT_TARGET_GEOMETRY';
  p[1].targetIdentityVerified = false;
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('suppression/ROI provenance not verified');
  p[1].targetIdentityVerified = true;
  p[1].suppressionRestored = false;
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('suppression/ROI provenance not verified');
});

test('rejects a clipped or fabricated out-of-image ROI', () => {
  const p = allProofs();
  p[3].roi.x = 98;
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('ROI invalid or clipped');
});

test('rejects lenient pixel thresholds and incomplete evidence', () => {
  const p = allProofs();
  expect(() => evaluateD1FFourTargetPixelGate(p.slice(0, 3)))
    .toThrow('four separate samples');
  expect(() => evaluateD1FFourTargetPixelGate(p, { minRoiChangedPixels: 1 }))
    .toThrow('four separate samples');
  expect(() => evaluateD1FFourTargetPixelGate(p, { outsideChangeAllowance: 999 }))
    .toThrow('four separate samples');
});

test('rejects invalid screenshot dimensions and non-RGBA frame buffers', () => {
  const p = allProofs();
  p[0].suppressed.width++;
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('image size, camera, GLB or variant changed');
});

test('legacy first-36 mask cannot be asserted as source-identified I03', () => {
  const p = allProofs();
  p[0].suppressionMethod = 'I03_FIRST_36_INDEXED_TRIANGLES_ONLY';
  expect(() => evaluateD1FFourTargetPixelGate(p)).toThrow('suppression/ROI provenance not verified');
});
