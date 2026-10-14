import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';
import {
  D1F_FOUR_PIXEL_TARGETS, D1F_FIVE_PIXEL_TARGETS, D1F_SEVEN_PIXEL_TARGETS,
  D1F_PIXEL_SUPPRESSION,
  evaluateD1FOneTargetPixelSample, evaluateD1FOneMeasuredTargetPixelSample, evaluateD1FFourTargetPixelGate,
  evaluateD1FFiveTargetPixelGate, evaluateD1FSevenTargetPixelGate,
} from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';

const candidate = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const oldCandidate = 'd1f-combined-wall-115-100-20261013';
const sha = D1F_COMBINED_WALL_ASSETS[candidate].sha256;
const variant = 'WEST_ANCHOR_725_895_740';
const measuredMethods = { ...D1F_PIXEL_SUPPRESSION, BASIN: 'BASIN_NODE_VISIBILITY_ONLY' };

function sample(targetId: string, digest: string = sha, selectedVariant: string = variant) {
  const width = 64, height = 64, roi = { x: 20, y: 20, width: 12, height: 12 };
  const baseline = new Uint8Array(width * height * 4).fill(60);
  const suppressed = baseline.slice();
  for(let y = 20; y < 32; y++) for(let x = 20; x < 32; x++) {
    const pos = 4 * (y * width + x);
    suppressed[pos] = 190; suppressed[pos + 1] = 180; suppressed[pos + 2] = 190;
  }
  const identity = { width, height, cameraFingerprint: 'source-camera-123456',
    glbSha256: digest, variant: selectedVariant };
  return {
    targetId, baseline: { ...identity, rgba: baseline },
    suppressed: { ...identity, rgba: suppressed },
    roi, suppressionMethod: measuredMethods[targetId as keyof typeof measuredMethods],
    targetIdentityVerified: true, roiProvenance: 'PROJECTED_EXACT_TARGET_GEOMETRY',
    suppressionRestored: true,
  };
}

test('five independent source-locked ROI deltas include BASIN without changing legacy four', () => {
  expect(D1F_FIVE_PIXEL_TARGETS).toEqual([...D1F_FOUR_PIXEL_TARGETS, 'BASIN']);
  expect(D1F_PIXEL_SUPPRESSION).not.toHaveProperty('BASIN');
  const five = D1F_FIVE_PIXEL_TARGETS.map(id => sample(id));
  const result = evaluateD1FFiveTargetPixelGate(five);
  expect(result).toMatchObject({
    checkedTargetCount: 5, originalGlbBytesAuthenticatedByThisFunction: false,
    actualBrowserWebGlVerifiedByThisFunction: false,
    productionPublicationVerifiedByThisFunction: false, humanReview: 'NOT_RUN',
  });
  expect(result.targets.map((t: { targetId: string }) => t.targetId)).toEqual(D1F_FIVE_PIXEL_TARGETS);
  expect(result.targets.every((t: { changedInside: number; changedOutside: number }) => t.changedInside === 144 && t.changedOutside === 0)).toBe(true);
  expect(() => evaluateD1FOneTargetPixelSample(sample('BASIN'))).toThrow('unknown target ID');
  expect(evaluateD1FOneMeasuredTargetPixelSample(sample('BASIN')).changedInside).toBe(144);
  expect(() => evaluateD1FFourTargetPixelGate(five)).toThrow();
  const old = D1F_FOUR_PIXEL_TARGETS.map(id =>
    sample(id, D1F_COMBINED_WALL_ASSETS[oldCandidate].sha256));
  expect(evaluateD1FFourTargetPixelGate(old).checkedTargetCount).toBe(4);
});

test('missing basin, mixed source, wrong variant, and forged basin suppression fail closed', () => {
  const five = D1F_FIVE_PIXEL_TARGETS.map(id => sample(id));
  expect(() => evaluateD1FFiveTargetPixelGate(five.slice(0,4))).toThrow();
  expect(() => evaluateD1FFiveTargetPixelGate([...five.slice(0,4), five[0]])).toThrow();
  expect(() => evaluateD1FFiveTargetPixelGate([
    ...five.slice(0,4), sample('BASIN', D1F_COMBINED_WALL_ASSETS[oldCandidate].sha256),
  ])).toThrow();
  expect(() => evaluateD1FFiveTargetPixelGate([
    ...five.slice(0,4), sample('BASIN', sha, 'EAST_ANCHOR_740_895_725'),
  ])).toThrow();
  expect(() => evaluateD1FFiveTargetPixelGate([
    ...five.slice(0,4), { ...five[4], suppressionMethod: 'I03_SOURCE_VERTEX_128_135_TRIANGLES_ONLY' },
  ])).toThrow();
  expect(() => evaluateD1FFiveTargetPixelGate(five, { minRoiChangedPixels: 20 })).toThrow();
});

test('distinct main-only measured production matrix has all variants and is never PR-credentialed', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const script = readFileSync('.github/scripts/private-model-d1f-measured-production-probe.mjs', 'utf8');
  expect(workflow).toContain('          - d1f-measured-pixels');
  const measured = workflow.split('  verify-d1f-measured-pixels:\n')[1];
  expect(measured).toBeTruthy();
  expect(measured).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
  expect(measured).toContain("inputs.probe_mode == 'd1f-measured-pixels'");
  for (const name of ['WEST_ANCHOR_725_895_740', 'WEST_ANCHOR_740_895_725',
    'EAST_ANCHOR_725_895_740', 'EAST_ANCHOR_740_895_725']) expect(measured).toContain(name);
  expect(measured).toContain('private-model-d1f-measured-production-probe.mjs');
  expect(measured).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_ID: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_ID }}');
  expect(measured).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET }}');
  expect(measured).toContain('d1f-measured-production-pixels-${{ matrix.variant }}');
  expect(script).toContain("const DEFAULT_ID = 'd1f-measured-wall-140-100-2350-b710-basin-20261014'");
  expect(script).toContain('const ID = process.env.D1F_MEASURED_CANDIDATE_ID ?? DEFAULT_ID');
  expect(measured).toContain('D1F_MEASURED_CANDIDATE_ID: ${{ inputs.measured_candidate }}');
  expect(script).toContain("PROBE_MODE === 'd1f-measured-pixels'");
  expect(script).toContain('for(const targetId of TARGETS)');
  expect(script).toContain('CORRECTIONS ? D1F_SEVEN_PIXEL_TARGETS : D1F_FIVE_PIXEL_TARGETS');
  expect(script).toContain('evaluateD1FOneMeasuredTargetPixelSample(sample,{candidateId:ID})');
  expect(script).toContain('evaluateD1FFiveTargetPixelGate(samples,{candidateId:ID})');
  expect(script).toContain("d1fCombinedWallPixelTargets:TARGETS.join(',')");
  expect(script).not.toContain('D1F_FOUR_PIXEL_TARGETS');
});

test('finished-face five-target proof accepts only its new digest and never inherits the old pixel PASS', () => {
  const candidateId='d1f-finished-face-2360-wall-basin-20261014';
  const digest=D1F_COMBINED_WALL_ASSETS[candidateId].sha256;
  const newSamples=D1F_FIVE_PIXEL_TARGETS.map(id=>sample(id,digest));
  expect(evaluateD1FFiveTargetPixelGate(newSamples,{candidateId}).checkedTargetCount).toBe(5);
  expect(evaluateD1FOneMeasuredTargetPixelSample(newSamples[4],{candidateId}).changedInside).toBe(144);
  expect(()=>evaluateD1FFiveTargetPixelGate(newSamples)).toThrow();
  expect(()=>evaluateD1FFiveTargetPixelGate(D1F_FIVE_PIXEL_TARGETS.map(id=>sample(id)),{candidateId})).toThrow();
  expect(()=>evaluateD1FFiveTargetPixelGate([...newSamples.slice(0,4),sample('BASIN')],{candidateId})).toThrow();
  expect(()=>evaluateD1FFiveTargetPixelGate(newSamples,{candidateId:'unknown'})).toThrow();
});


test('four reported corrections require seven distinct targets from the exact new source', () => {
  const candidateId = 'd1f-four-review-corrections-20261014';
  const digest = D1F_COMBINED_WALL_ASSETS[candidateId].sha256;
  const seven = D1F_SEVEN_PIXEL_TARGETS.map(id => sample(id, digest));
  expect(evaluateD1FSevenTargetPixelGate(seven,{candidateId}).checkedTargetCount).toBe(7);
  expect(()=>evaluateD1FFiveTargetPixelGate(seven.slice(0,5),{candidateId})).toThrow();
  for(const count of [4,5,6]) expect(()=>evaluateD1FSevenTargetPixelGate(seven.slice(0,count),{candidateId})).toThrow();
  expect(()=>evaluateD1FSevenTargetPixelGate([...seven.slice(0,6),seven[0]],{candidateId})).toThrow();
  expect(()=>evaluateD1FSevenTargetPixelGate([...seven.slice(0,6),sample('B_WALL_CONTINUITY',sha)],{candidateId})).toThrow();
  expect(()=>evaluateD1FSevenTargetPixelGate([...seven.slice(0,6),sample('B_WALL_CONTINUITY',digest,'EAST_ANCHOR_725_895_740')],{candidateId})).toThrow();
  const weak=seven.map(s=>({...s,suppressed:{...s.suppressed,rgba:s.baseline.rgba.slice()}}));
  expect(()=>evaluateD1FSevenTargetPixelGate(weak,{candidateId})).toThrow();
});
