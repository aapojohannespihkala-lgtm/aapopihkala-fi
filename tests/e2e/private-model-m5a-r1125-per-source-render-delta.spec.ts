import { expect, test } from '@playwright/test';
// @ts-ignore -- standalone source-bound JS pixel detector
import { detectM5AR1125PerSourceRenderDelta as prove } from '../../src/scripts/privateModelM5AR1125PerSourceRenderDelta.mjs';
// @ts-ignore -- already tested R1125 source class constants
import { m5aR1125SourcePixelKinds } from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// Synthetic regression only: no real GLB identity, renderer, authentication
// or HUMAN_REVIEW result may be inferred from these fixture pixels.
const width = 1000, height = 600;
const keys = Object.keys(m5aR1125SourcePixelKinds) as Array<keyof typeof m5aR1125SourcePixelKinds>;
const color = {
  wellGray: [150, 154, 159, 255],
  routeCyan: [18, 140, 180, 255],
  boundaryYellow: [200, 145, 65, 255],
};
const background = [5, 5, 5, 255];
const positions = keys.map((key, index) => ({
  key, x: 100 + index % 5 * 200, y: 100 + Math.floor(index / 5) * 200,
}));
const projections = positions.map(p => ({
  key: p.key, u: p.x / (width - 1), v: p.y / (height - 1),
}));
const patch = (frame: Uint8Array, x: number, y: number, pixel: number[]) => {
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const off = ((y + dy) * width + x + dx) * 4;
      for (let k = 0; k < 4; k++) frame[off + k] = pixel[k];
    }
  }
};
const fixture = () => {
  const baseline = new Uint8Array(width * height * 4);
  for (let i = 3; i < baseline.length; i += 4) baseline[i] = 255;
  for (const p of positions) {
    const kind = m5aR1125SourcePixelKinds[p.key] as keyof typeof color;
    patch(baseline, p.x, p.y, color[kind]);
  }
  const mutedFrames: Record<string, Uint8Array> = {};
  for (const p of positions) {
    mutedFrames[p.key] = baseline.slice();
    patch(mutedFrames[p.key], p.x, p.y, background);
  }
  // Each negative case mutates projected centers: never reuse the module-level array.
  return {
    baseline, mutedFrames,
    projections: projections.map(p => ({ ...p })),
    width, height,
  };
};

test('each of 13 separately muted original targets removes its OWN color pixels', () => {
  const result = prove(fixture());
  expect(result.requiredSourceCount).toBe(13);
  expect(result.sourceIsolation).toHaveLength(13);
  expect(result.allSourceTargetsIsolated).toBe(true);
  for (const p of result.sourceIsolation) {
    expect(p.originalClassPixels).toBe(121);
    expect(p.isolatedClassPixels).toBe(121);
    expect(p.remainingClassPixels).toBe(0);
    expect(p.peersPreserved).toBe(true);
    expect(Object.values(p.peerClassLossPixels)).toEqual(Array(12).fill(0));
    expect(p.outsideChangedPixels).toBe(0);
    expect(p.passed).toBe(true);
  }
  expect(result.productionProvenanceVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
});

test('same-colored unrelated geometry cannot substitute for a muted source', () => {
  const args = fixture();
  args.mutedFrames[keys[0]] = args.baseline.slice();
  let result = prove(args);
  expect(result.allSourceTargetsIsolated).toBe(false);
  expect(result.sourceIsolation.find((p: any) => p.key === keys[0])?.passed).toBe(false);
  const switched = fixture();
  switched.mutedFrames[keys[0]] = switched.mutedFrames[keys[1]];
  result = prove(switched);
  expect(result.allSourceTargetsIsolated).toBe(false);
  expect(result.sourceIsolation.find((p: any) => p.key === keys[0])?.passed).toBe(false);
});

test('a moving camera or background difference outside the object ROI fails closed', () => {
  const args = fixture();
  const frame = args.mutedFrames[keys[0]];
  for (let x = 0; x < 800; x++) {
    const off = x * 4;
    frame[off] = 225;
  }
  const result = prove(args);
  expect(result.allSourceTargetsIsolated).toBe(false);
  expect(result.sourceIsolation[0].outsideChangedPixels).toBeGreaterThan(600);
  expect(result.sourceIsolation[0].passed).toBe(false);
});

test('target partly hidden with enough lost pixels still fails closed', () => {
  const args = fixture();
  const first = positions[0];
  const isolated = args.baseline.slice();
  // Nine missing pixels meet the former 8-pixel loss gate, while 112 remain.
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const off = ((first.y + dy) * width + first.x + dx) * 4;
      for (let k = 0; k < 4; k++) isolated[off + k] = background[k];
    }
  }
  args.mutedFrames[keys[0]] = isolated;
  const result = prove(args);
  const firstResult = result.sourceIsolation.find((p: any) => p.key === keys[0]);
  expect(firstResult).toMatchObject({
    isolatedClassPixels: 9, remainingClassPixels: 112, passed: false,
  });
  expect(result.allSourceTargetsIsolated).toBe(false);
});

test('cross-palette peer disappearing inside the target ROI cannot pass', () => {
  const args = fixture();
  const well = positions[0], farRoute = positions[4];
  // Bring one cyan peer into the gray well circular ROI without overlap of
  // its 11x11 patch with the gray pixels themselves.
  const nearRoute = { x: well.x + 15, y: well.y + 15 };
  const frames = [args.baseline, ...Object.values(args.mutedFrames)];
  for (const frame of frames) {
    patch(frame, farRoute.x, farRoute.y, background);
    patch(frame, nearRoute.x, nearRoute.y, color.routeCyan);
  }
  // Only the cyan peer's own frame is allowed to hide it.
  patch(args.mutedFrames[keys[4]], nearRoute.x, nearRoute.y, background);
  // Malicious: hiding the well also removes the cyan peer in overlapping ROIs.
  patch(args.mutedFrames[keys[0]], nearRoute.x, nearRoute.y, background);
  args.projections[4] = {
    ...args.projections[4],
    u: nearRoute.x / (width - 1),
    v: nearRoute.y / (height - 1),
  };
  const result = prove(args);
  const first = result.sourceIsolation.find((p: any) => p.key === keys[0]);
  expect(first.peerClassLossPixels[keys[4]]).toBe(121);
  expect(first.peersPreserved).toBe(false);
  expect(first.passed).toBe(false);
});

test('peer color-class loss below RGB noise threshold still fails', () => {
  const args = fixture();
  const frame = args.mutedFrames[keys[0]];
  const route = positions[4];
  // b: 180 -> 145 is <=36/channel but no longer matches cyan b>1.04*g.
  patch(frame, route.x, route.y, [18, 140, 145, 255]);
  const result = prove(args);
  const well = result.sourceIsolation.find((p: any) => p.key === keys[0]);
  expect(well.outsideChangedPixels).toBe(0);
  expect(well.peerClassLossPixels[keys[4]]).toBe(121);
  expect(well.peersPreserved).toBe(false);
  expect(well.passed).toBe(false);
});

test('one borderline RGB sample is not both yellow and gray source evidence', () => {
  const args = fixture();
  const well = positions[0];
  // Qualifies as gray AND yellow in the old independent predicates.
  // Exact source ROI precedence is yellow > gray.
  patch(args.baseline, well.x, well.y, [180, 145, 105, 255]);
  const result = prove(args);
  expect(result.sourceIsolation[0].originalClassPixels).toBe(0);
  expect(result.sourceIsolation[0].passed).toBe(false);
});

test('missing or malformed isolated source frames cannot pass', () => {
  const args = fixture();
  delete args.mutedFrames[keys[0]];
  expect(() => prove(args)).toThrow('source');
  const wrongSize = fixture();
  wrongSize.mutedFrames[keys[0]] = new Uint8Array(9);
  expect(() => prove(wrongSize)).toThrow('source');
  const foreign = fixture();
  foreign.mutedFrames.untrusted = foreign.mutedFrames[keys[0]];
  expect(() => prove(foreign)).toThrow('source');
});

test('duplicate, out-of-frame and same-color ambiguous projected centers fail', () => {
  const dup = fixture();
  dup.projections[1] = { ...dup.projections[1], key: keys[0] };
  expect(() => prove(dup)).toThrow('duplicate');
  const out = fixture();
  out.projections[1] = { ...out.projections[1], u: 1.5 };
  expect(() => prove(out)).toThrow('duplicate');
  const ambiguous = fixture();
  ambiguous.projections[1] = {
    ...ambiguous.projections[1],
    u: ambiguous.projections[0].u + 0.005,
    v: ambiguous.projections[0].v,
  };
  expect(() => prove(ambiguous)).toThrow('ambiguous');
});
