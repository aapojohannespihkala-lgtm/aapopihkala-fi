import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
// @ts-ignore - protected production probe is an ESM file with pure exported checkers.
import {
  SOURCE156, Source156PixelFailure,
  verifySource156Projection, verifySource156FrameTriplet,
  verifySource156OriginalGlb,
} from '../../.github/scripts/private-model-d1f-source156-seven-production-probe.mjs';

// Synthetic checks run without CF Access and do not constitute production WebGL proof.
const projection = (focused: string) => ({
  sourceSceneIndex: 156, originalTargetCount: 7,
  productionPixelsVerified: false, humanReview: 'NOT_RUN',
  centers: SOURCE156.keys.map((key: string, i: number) => ({
    key, u: key === focused ? 0.5 : 1.2 + i * 0.1,
    v: 0.5, onScreen: key === focused,
  })),
});
const frames = (key = 'wc') => {
  const width = 256, height = 256;
  const blank = () => ({ width, height, rgba: new Uint8Array(width * height * 4) });
  const before = blank(), hidden = blank(), restored = blank();
  for (let y = 124; y < 132; y++) for (let x = 124; x < 132; x++)
    hidden.rgba[(y * width + x) * 4] = 190;
  return { before, hidden, restored,
    center: { key, u: 0.5, v: 0.5, onScreen: true } };
};
test('seven original targets use seven distinct cameras without requiring six other groups on screen', () => {
  expect(SOURCE156.keys).toHaveLength(7);
  for (const key of SOURCE156.keys) {
    const p = projection(key);
    const focused = verifySource156Projection(p, key);
    expect(focused).toMatchObject({ key, onScreen: true });
    expect(p.centers.filter(c => c.onScreen)).toHaveLength(1);
  }
});
test('source identity, wrong key, forged order and offscreen focused target fail closed', () => {
  for (const mutate of [
    (p: ReturnType<typeof projection>) => { p.sourceSceneIndex = 155; },
    (p: ReturnType<typeof projection>) => { p.productionPixelsVerified = true; },
    (p: ReturnType<typeof projection>) => { p.humanReview = 'PASS'; },
    (p: ReturnType<typeof projection>) => { p.centers[0].key = 'FAKE'; },
    (p: ReturnType<typeof projection>) => { p.centers[1].key = p.centers[0].key; },
    (p: ReturnType<typeof projection>) => { p.centers[1].u = Number.NaN; },
  ]) {
    const p = projection('wc'); mutate(p);
    expect(() => verifySource156Projection(p, 'wc')).toThrow(Source156PixelFailure);
  }
  const alsoVisible = projection('wc');
  alsoVisible.centers[3].onScreen = true;
  expect(verifySource156Projection(alsoVisible, 'wc').key).toBe('wc');
  expect(() => verifySource156Projection(projection('wc'), 'MISSING'))
    .toThrow(Source156PixelFailure);
  expect(() => verifySource156Projection(projection('wc'), 'sauna-u'))
    .toThrow(Source156PixelFailure);
});
test('real RGB HIDE 64 pixels and byte-exact restoration pass only as untrusted synthetic evidence', () => {
  for (const key of SOURCE156.keys) {
    const out = verifySource156FrameTriplet(frames(key));
    expect(out).toMatchObject({ key, changedRgbPixels: 64,
      roiChangedRgbPixels: 64, restoredRgbaDiffPixels: 0,
      authenticatedProduction: false, humanReview: 'NOT_RUN' });
  }
});
test('alpha-only, off-center, broad scene drift and incomplete restoration all fail closed', () => {
  const alpha = frames();
  for (let y = 124; y < 132; y++) for (let x = 124; x < 132; x++) {
    const at = (y * 256 + x) * 4;
    alpha.hidden.rgba[at] = 0;
    alpha.hidden.rgba[at + 3] = 190;
  }
  expect(() => verifySource156FrameTriplet(alpha)).toThrow(Source156PixelFailure);
  const offcenter = frames();
  offcenter.center.u = 0.1;
  expect(() => verifySource156FrameTriplet(offcenter)).toThrow(Source156PixelFailure);
  const drift = frames();
  for (let y = 0; y < 140; y++) for (let x = 0; x < 140; x++)
    drift.hidden.rgba[(y * 256 + x) * 4] = 190;
  expect(() => verifySource156FrameTriplet(drift)).toThrow(Source156PixelFailure);
  const unreturned = frames();
  unreturned.restored.rgba[(126 * 256 + 126) * 4] = 1;
  expect(() => verifySource156FrameTriplet(unreturned)).toThrow(Source156PixelFailure);
});
test('original raw GLB identity rejects synthetic or corrupted data', () => {
  expect(() => verifySource156OriginalGlb(Buffer.alloc(SOURCE156.bytes)))
    .toThrow(Source156PixelFailure);
});
test('production browser runner actually focuses each original target before fresh baseline and HIDE', () => {
  const source = readFileSync(new URL(
    '../../.github/scripts/private-model-d1f-source156-seven-production-probe.mjs',
    import.meta.url), 'utf8');
  expect(source).toContain('for(const key of SOURCE156.keys)');
  expect(source).toContain('.d1fSource156FocusOriginalTarget(key)');
  expect(source).toContain('verifySource156Projection(projected.projection,key)');
  expect(source.indexOf('const before=await capture()'))
    .toBeGreaterThan(source.indexOf('.d1fSource156FocusOriginalTarget(key)'));
  expect(source.indexOf('const before=await capture()'))
    .toBeLessThan(source.indexOf("d1fSource156SetOriginalVisibility(key,'HIDE')"));
  expect(source).toContain("GITHUB_REF==='refs/heads/main'");
  expect(source).toContain("GITHUB_EVENT_NAME==='workflow_dispatch'");
  expect(source).toContain("actualProductionWebglSourcePixelsVerified:false");
});
