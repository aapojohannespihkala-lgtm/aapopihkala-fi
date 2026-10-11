import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { runInNewContext } from 'node:vm';
import { expect, test, type Page } from '@playwright/test';
// Source-color-bound, synthetic pixel-only guard. This is NOT production render evidence.
// @ts-ignore - pure .mjs module has no TypeScript declaration
import { buildP186FX4BrowserScreenshotProofExpression, detectP186FX4CyanTargetComponents as detect } from '../../src/scripts/privateModelP186FX4CyanPixelProof.mjs';

const image = (width = 120, height = 60) => {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([242, 245, 249, 255], i);
  return { rgba, width, height };
};

const rectangle = (
  frame: ReturnType<typeof image>, x: number, y: number,
  w = 6, h = 5, color = [34, 211, 238, 255],
) => {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      frame.rgba.set(color, ((y + dy) * frame.width + x + dx) * 4);
    }
  }
};

const three = () => {
  const frame = image();
  rectangle(frame, 10, 15);
  rectangle(frame, 50, 15);
  rectangle(frame, 90, 15);
  return frame;
};

test('P186F-X4 requires three separate cyan scene66 viewer marker components', () => {
  const frame = three();
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.requiredCount).toBe(3);
  expect(result.minComponentPixels).toBe(20);
  expect(result.componentCount).toBe(3);
  expect(result.qualifyingColorPixels).toBe(90);
  expect(result.components.map((c: any) => c.pixels)).toEqual([30, 30, 30]);
  expect(result.components.map((c: any) => c.minX)).toEqual([10, 50, 90]);
});

test('P186F-X4 does not pass if a marker is missing or two targets merge', () => {
  const missing = image();
  rectangle(missing, 10, 15);
  rectangle(missing, 90, 15);
  expect(detect(missing.rgba, missing.width, missing.height).componentCount).toBe(2);

  const merged = three();
  rectangle(merged, 16, 15, 34, 5);
  expect(detect(merged.rgba, merged.width, merged.height).componentCount).toBe(2);
});

test('P186F-X4 ignores background, blue UI, pale cyan, tiny cyan noise and alpha noise', () => {
  const frame = three();
  rectangle(frame, 2, 2, 1, 1);
  rectangle(frame, 6, 42, 12, 10, [19, 101, 218, 255]);
  rectangle(frame, 27, 42, 12, 10, [130, 220, 239, 255]);
  rectangle(frame, 48, 42, 12, 10, [34, 211, 238, 180]);
  const result = detect(frame.rgba, frame.width, frame.height);
  expect(result.componentCount).toBe(3);
  expect(result.qualifyingColorPixels).toBe(91);
});

test('P186F-X4 accepts anti-aliased target color and rejects invalid RGBA frames', () => {
  const frame = three();
  rectangle(frame, 90, 15, 6, 5, [48, 190, 225, 255]);
  expect(detect(frame.rgba, frame.width, frame.height).componentCount).toBe(3);
  expect(() => detect(frame.rgba, frame.width - 1, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(frame.rgba, frame.width + 0.5, frame.height)).toThrow(/exact RGBA/);
  expect(() => detect(null, frame.width, frame.height)).toThrow(/exact RGBA/);
});

// An actual Chromium evaluation guard: previous production smoke returned undefined
// because its string was a bare, non-invoked asynchronous function.
test('P186F-X4 screenshot proof executes in Chromium for 3 and 2 markers', async ({ page }) => {
  for (const markerCount of [3, 2]) {
    const png = await page.evaluate((count) => {
      const surface = document.createElement('canvas');
      surface.width = 120;
      surface.height = 60;
      const ctx = surface.getContext('2d');
      if (!ctx) throw new Error('canvas unavailable');
      ctx.fillStyle = '#f2f5f9';
      ctx.fillRect(0, 0, 120, 60);
      ctx.fillStyle = '#22d3ee';
      for (const x of [10, 50, 90].slice(0, count)) ctx.fillRect(x, 15, 6, 5);
      return surface.toDataURL('image/png');
    }, markerCount);
    const expression = buildP186FX4BrowserScreenshotProofExpression(png);
    const result = (await page.evaluate(expression)) as {
      requiredCount: number;
      componentCount: number;
      qualifyingColorPixels: number;
    } | undefined;
    expect(result).toBeDefined();
    expect(result?.requiredCount).toBe(3);
    expect(result?.componentCount).toBe(markerCount);
    expect(result?.qualifyingColorPixels).toBe(markerCount * 30);
  }
});


// The exact authenticated-production workflow code must execute in Chromium,
// not merely contain a static text marker. This rejects the former
// page.evaluate('(async (url) => {...})', png) => undefined regression.
const productionWorkflowPath = '.github/workflows/private-model-production-review-smoke.yml';
const productionX4Begin = 'const detectorFunctionSource =';
const productionX4End = "fs.writeFileSync(\n                'playwright-artifacts/x4-three-cyan-components.json'";

function getExactProductionX4Source() {
  const workflow = readFileSync(productionWorkflowPath, 'utf8');
  const begin = workflow.indexOf(productionX4Begin);
  const end = workflow.indexOf(productionX4End, begin);
  if (begin < 0 || end <= begin || workflow.indexOf(productionX4Begin, begin + productionX4Begin.length) !== -1) {
    throw new Error('Cannot uniquely extract real production X4 browser-evaluation code');
  }
  return workflow.slice(begin, end);
}

async function makeProductionRegressionPng(page: Page, count: number) {
  const data = await page.evaluate((visibleCount) => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('X4 browser regression canvas unavailable');
    ctx.fillStyle = '#f2f5f9';
    ctx.fillRect(0, 0, 120, 60);
    ctx.fillStyle = '#22d3ee';
    for (const x of [10, 50, 90].slice(0, visibleCount)) {
      ctx.fillRect(x, 15, 6, 5);
    }
    return canvas.toDataURL('image/png').split(',')[1];
  }, count);
  return Buffer.from(data, 'base64');
}

type ExactProductionX4Pixels = {
  requiredCount: number;
  componentCount: number;
  qualifyingColorPixels: number;
};

function runExactProductionX4Call(page: Page, before: Buffer, source: string) {
  // Source is a uniquely selected fragment of checked-in workflow code.
  // The real Playwright page instance handles its own browser evaluation.
  const executable = '(async () => { let cyanTargetEvidence = null;\n' +
    source + '\nreturn cyanTargetEvidence; })()';
  return runInNewContext(executable, {
    page,
    before,
    detectP186FX4CyanTargetComponents: detect,
    Buffer,
  }) as Promise<ExactProductionX4Pixels>;
}

test('exact production X4 screenshot invocation returns three real Chromium cyan components', async ({ page }) => {
  const result = await runExactProductionX4Call(page, await makeProductionRegressionPng(page, 3), getExactProductionX4Source());
  expect(result).toBeDefined();
  expect(result.requiredCount).toBe(3);
  expect(result.componentCount).toBe(3);
  expect(result.qualifyingColorPixels).toBe(90);
});

test('exact production X4 screenshot invocation detects a missing third component', async ({ page }) => {
  const result = await runExactProductionX4Call(page, await makeProductionRegressionPng(page, 2), getExactProductionX4Source());
  expect(result.requiredCount).toBe(3);
  expect(result.componentCount).toBe(2);
  expect(result.qualifyingColorPixels).toBe(60);
});

test('original uninvoked production X4 expression must fail closed in Chromium', async ({ page }) => {
  const source = getExactProductionX4Source();
  const invocation = "browserProof + '(' + JSON.stringify(x4ScreenshotDataUrl) + ')'";
  expect(source).toContain(invocation);
  const broken = source.replace(invocation, 'browserProof');
  expect(broken).not.toBe(source);
  await expect(runExactProductionX4Call(page, await makeProductionRegressionPng(page, 3), broken))
    .rejects.toThrow(/X4 screenshot detector returned no pixel result/);
});
