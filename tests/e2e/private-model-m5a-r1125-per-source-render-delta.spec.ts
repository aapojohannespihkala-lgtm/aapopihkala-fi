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
