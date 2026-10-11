import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { runInNewContext } from 'node:vm';
import { expect, test, type Page } from '@playwright/test';
// @ts-ignore - JavaScript screenshot detector has no TypeScript declaration
import { detectM5BR1109CyanLocatorComponents } from '../../src/scripts/privateModelR1109CyanLocatorProof.mjs';

// This test deliberately EXECUTES the actual JavaScript embedded in the authenticated
// production-smoke workflow. A string-presence/contract test cannot detect the
// previous page.evaluate(function-as-string) -> undefined regression.
const workflowPath = '.github/workflows/private-model-production-review-smoke.yml';
const begin = 'const fn = detectM5BR1109CyanLocatorComponents.toString();';
const end = "fs.writeFileSync('playwright-artifacts/m5b-r1109-five-pixels.json',";

const liveProofSource = () => {
  const workflow = readFileSync(workflowPath, 'utf8');
  const start = workflow.indexOf(begin);
  const stop = workflow.indexOf(end, start);
  if (start < 0 || stop <= start || workflow.indexOf(begin, start + begin.length) !== -1) {
    throw new Error('Cannot uniquely extract the real production M5B screenshot invocation');
  }
  return workflow.slice(start, stop);
};

async function actualScreenshot(page: Page, count: number) {
  const base64 = await page.evaluate((n) => {
    const surface = document.createElement('canvas');
    surface.width = 120;
    surface.height = 60;
    const context = surface.getContext('2d');
    if (!context) throw new Error('Chromium PNG canvas unavailable');
    context.fillStyle = '#f1f3f7';
    context.fillRect(0, 0, surface.width, surface.height);
    context.fillStyle = '#00eaff';
    for (let i = 0; i < n; i++) {
      context.fillRect(6 + i * 21, 12, 5, 5);
    }
    return surface.toDataURL('image/png').split(',')[1];
  }, count);
  return Buffer.from(base64, 'base64');
}

type PixelResult = {
  requiredCount: number;
  componentCount: number;
  qualifyingColorPixels: number;
};

const executeExactProductionCode = (
  page: Page,
  before: Buffer,
  source: string,
): Promise<PixelResult> => {
  // The selected block is checked-in application source, not user-supplied code.
  // It includes the *actual* page.evaluate call and runtime result guard.
  const code = '(async () => { let m5bPixelEvidence = null;\n' +
    source + '\nreturn m5bPixelEvidence; })()';
  return runInNewContext(code, {
    page,
    before,
    detectM5BR1109CyanLocatorComponents,
    Buffer,
  }) as Promise<PixelResult>;
};

test('exact production screenshot invocation returns five actual Chromium pixel components', async ({ page }) => {
  const result = await executeExactProductionCode(page, await actualScreenshot(page, 5), liveProofSource());
  expect(result).toBeDefined();
  expect(result.requiredCount).toBe(5);
  expect(result.componentCount).toBe(5);
  expect(result.qualifyingColorPixels).toBe(125);
});

test('exact production screenshot invocation detects a missing fifth component', async ({ page }) => {
  const result = await executeExactProductionCode(page, await actualScreenshot(page, 4), liveProofSource());
  expect(result.requiredCount).toBe(5);
  expect(result.componentCount).toBe(4);
  expect(result.qualifyingColorPixels).toBe(100);
});

test('original uninvoked browser function can never pass the production regression', async ({ page }) => {
  const real = liveProofSource();
  const invoked = "script + '(' + JSON.stringify(screenshotDataUrl) + ')'";
  expect(real).toContain(invoked);
  const broken = real.replace(invoked, 'script');
  expect(broken).not.toBe(real);
  let caught: unknown;
  try {
    await executeExactProductionCode(page, await actualScreenshot(page, 5), broken);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  expect(String(caught)).toContain('M5B R1109 screenshot detector returned no pixel result');
});
