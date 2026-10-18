import { expect, test } from '@playwright/test';
import { m5aZ2ExpectedTargetKeys } from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
// @ts-ignore - the separately tested JS screenshot detector has no TS declaration
import {
  detectM5AR1125SourceProjectedPixels as detect,
  buildM5AR1125BrowserScreenshotProofExpression as buildExpression,
  m5aR1125SourcePixelKinds,
} from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// Synthetic-only pixels. This is not original GLB provenance, authenticated
// production evidence, a physical survey, or a HUMAN_REVIEW decision.
const width = 300;
const height = 160;
const keys = [...m5aZ2ExpectedTargetKeys];
const locations = keys.map((key, i) => ({
  key, cx: 28 + (i % 5) * 48, cy: 26 + Math.floor(i / 5) * 54,
}));
const centers = locations.map(({ key, cx, cy }) => ({
  key, u: cx / (width - 1), v: cy / (height - 1),
}));
const color = (index: number) => index < 4
  ? [160, 172, 180, 255] : index < 11
  ? [25, 180, 220, 255] : [235, 181, 36, 255];

const syntheticPixels = (omit: number[] = [], wrongColorIndex = -1) => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels.set([245, 249, 251, 255], i);
  }
  locations.forEach(({ cx, cy }, index) => {
    if (omit.includes(index)) return;
    const fill = index === wrongColorIndex ? [25, 180, 220, 255] : color(index);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        pixels.set(fill, ((cy + dy) * width + cx + dx) * 4);
      }
    }
  });
  return pixels;
};

test('R1125 exact 4 gray wells, 7 cyan routes and 2 yellow boundary source identities', () => {
  expect(Object.keys(m5aR1125SourcePixelKinds)).toEqual(keys);
  const proof = detect(syntheticPixels(), width, height, centers);
  expect(proof.requiredCounts).toEqual({ wellGray: 4, routeCyan: 7, boundaryYellow: 2 });
  expect(proof.sourceRoiPixels.map((p: { key: string }) => p.key)).toEqual(keys);
  expect(proof.sourceRoiPixels.map((p: { classPixels: number }) => p.classPixels))
    .toEqual(Array(13).fill(25));
  expect(proof.allSourceTargetsVisible).toBe(true);
  expect(proof.missingKeys).toEqual([]);
  expect(proof.ambiguousSourceKeys).toEqual([]);
  expect(proof.productionProvenanceVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('R1125 missing route, missing boundary and wrong source palette fail closed', () => {
  for (const missingIndex of [5, 12]) {
    const proof = detect(syntheticPixels([missingIndex]), width, height, centers);
    expect(proof.allSourceTargetsVisible).toBe(false);
    expect(proof.missingKeys).toEqual([keys[missingIndex]]);
  }
  const wrong = detect(syntheticPixels([], 11), width, height, centers);
  expect(wrong.allSourceTargetsVisible).toBe(false);
  expect(wrong.missingKeys).toContain(keys[11]);
});

test('R1125 one pixel cannot count for two identical gray source centers', () => {
  const near = centers.map((p, i) =>
    i === 1 ? { ...p, u: centers[0]!.u, v: centers[0]!.v } : p,
  );
  const proof = detect(syntheticPixels(), width, height, near);
  expect(proof.allSourceTargetsVisible).toBe(false);
  expect(proof.sourceRoiPixels[1].classPixels).toBe(0);
  expect(proof.ambiguousSourceKeys).toEqual([keys[0], keys[1]]);
});

test('R1125 rejects duplicate, absent, foreign and out-of-frame source IDs', () => {
  const pixels = syntheticPixels();
  expect(() => detect(pixels, width, height, centers.slice(1))).toThrow(/exact 13/);
  expect(() => detect(pixels, width, height, [
    ...centers.slice(0, 12), { ...centers[12], key: keys[0] },
  ])).toThrow(/duplicate/);
  expect(() => detect(pixels, width, height, [
    ...centers.slice(0, 12), { ...centers[12], key: 'NOT_SOURCE' },
  ])).toThrow(/missing exact source ID/);
  expect(() => detect(pixels, width, height, [
    { ...centers[0], u: 1.5 }, ...centers.slice(1),
  ])).toThrow(/out of frame/);
  expect(() => detect(pixels, width - 1, height, centers)).toThrow(/exact RGBA/);
});

test('R1125 dark blue contextual pixels do not invent missing cyan source pixels', () => {
  const pixels = syntheticPixels([10]);
  for (let y = 148; y < 156; y += 1) {
    for (let x = 220; x < 280; x += 1) {
      pixels.set([21, 107, 217, 255], (y * width + x) * 4);
    }
  }
  const proof = detect(pixels, width, height, centers);
  expect(proof.allSourceTargetsVisible).toBe(false);
  expect(proof.missingKeys).toEqual([keys[10]]);
});

test('R1125 exact PNG browser expression runs on decoded Chromium screenshot pixels', async ({ page }) => {
  for (const missingIndex of [-1, 5, 12]) {
    const png = await page.evaluate(({ locations, missingIndex, width, height }) => {
      const surface = document.createElement('canvas');
      surface.width = width;
      surface.height = height;
      const context = surface.getContext('2d');
      if (!context) throw new Error('PNG canvas unavailable');
      context.fillStyle = '#f5f9fb';
      context.fillRect(0, 0, width, height);
      locations.forEach(({ cx, cy }, i) => {
        if (i === missingIndex) return;
        context.fillStyle = i < 4 ? '#a0acb4' : i < 11 ? '#19b4dc' : '#ebb524';
        context.fillRect(cx - 2, cy - 2, 5, 5);
      });
      return surface.toDataURL('image/png');
    }, { locations, missingIndex, width, height });
    const proof = await page.evaluate(buildExpression(png, centers)) as {
      allSourceTargetsVisible: boolean;
      missingKeys: string[];
      sourceRoiPixels: Array<{ key: string }>;
      productionProvenanceVerified: boolean;
    };
    expect(proof.sourceRoiPixels).toHaveLength(13);
    expect(proof.allSourceTargetsVisible).toBe(missingIndex === -1);
    expect(proof.missingKeys).toEqual(missingIndex === -1 ? [] : [keys[missingIndex]]);
    expect(proof.productionProvenanceVerified).toBe(false);
  }
});

test('R1125 screenshot expression rejects non-PNG or script-tainted inputs', () => {
  expect(() => buildExpression('https://example.invalid/a.png', centers))
    .toThrow(/requires PNG data URL/);
  expect(() => buildExpression('data:image/png;base64,AAAA");alert(1)//', centers))
    .toThrow(/requires PNG data URL/);
  expect(() => buildExpression('data:image/png;base64,AAAA', centers.slice(1)))
    .toThrow(/13 centers/);
});

test('R1125 one real gray patch never proves two nearly coincident source IDs', () => {
  const coincident = centers.map((p, index) =>
    index === 1 ? { ...p, u: 29 / (width - 1), v: 26 / (height - 1) } : p,
  );
  const proof = detect(syntheticPixels([1]), width, height, coincident);
  // The original algorithm counted 15 and 10 pixels from one 25px patch:
  // both totals exceeded the 8px floor and could falsely pass 13/13.
  expect(proof.sourceRoiPixels[0].classPixels).toBeGreaterThanOrEqual(8);
  expect(proof.sourceRoiPixels[1].classPixels).toBeGreaterThanOrEqual(8);
  expect(proof.ambiguousSourceKeys).toEqual([keys[0], keys[1]]);
  expect(proof.allSourceTargetsVisible).toBe(false);
});

test('R1125 source detector accepts exact 2304000-pixel cap and rejects just above it', () => {
  const bounded = detect(new Uint8ClampedArray(1600 * 1440 * 4), 1600, 1440, centers);
  expect(bounded.sourceRoiPixels).toHaveLength(13);
  expect(bounded.allSourceTargetsVisible).toBe(false);
  expect(bounded.missingKeys).toEqual(keys);
  expect(() => detect(new Uint8ClampedArray(1600 * 1441 * 4), 1600, 1441, centers))
    .toThrow(/exact RGBA image dimensions/);
});

test('R1125 real Chromium rejects oversized decoded PNG before canvas RGBA allocation', async ({ page }) => {
  for (const pngHeight of [1440, 1441]) {
    const png = await page.evaluate(height => {
      const surface = document.createElement('canvas');
      surface.width = 1600;
      surface.height = height;
      return surface.toDataURL('image/png');
    }, pngHeight);
    const promise = page.evaluate(buildExpression(png, centers));
    if (pngHeight === 1441) {
      await expect(promise).rejects.toThrow(/R1125 PNG canvas pixel budget exceeded/);
    } else {
      const proof = await promise as {
        allSourceTargetsVisible: boolean;
        sourceRoiPixels: Array<{ key: string }>;
      };
      expect(proof.sourceRoiPixels).toHaveLength(13);
      expect(proof.allSourceTargetsVisible).toBe(false);
    }
  }
});
