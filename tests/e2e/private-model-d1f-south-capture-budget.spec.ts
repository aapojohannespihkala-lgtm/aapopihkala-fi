import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import { D1F_COMBINED_WALL_ASSETS, D1F_COMBINED_WALL_VARIANTS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const driver = readFileSync('.github/scripts/private-model-d1f-combined-production-probe.mjs','utf8');
const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml','utf8');

test('all four exact D1F variants retain isolated authenticated browser jobs', () => {
  const section = workflow.split('  verify-d1f-combined-pixels:\n')[1];
  expect(section).toBeTruthy();
  const job = section.split(/^  [a-z][\w-]*:\s*$/m)[0];
  expect(job).not.toContain('d1f-measured-production-pixels-');
  expect(job).toContain('fail-fast: false');
  const variants = [...job.matchAll(/^          - ((?:WEST|EAST)_ANCHOR_\d+_\d+_\d+)$/gm)]
    .map(match => match[1]);
  expect(variants).toEqual([...D1F_COMBINED_WALL_VARIANTS]);
  expect(job).toContain("github.ref == 'refs/heads/main'");
  expect(job).toContain('D1F_COMBINED_VARIANT: ${{ matrix.variant }}');
});

test('source-specific canvas capture keeps 25s bound within a finite 9min driver budget', () => {
  expect(driver.match(/canvas\.screenshot\(\{timeout:25000\}\)/g)).toHaveLength(1);
  expect(driver).not.toContain('canvas.screenshot({timeout:15000})');
  expect(driver).toContain('},540000)');
  expect(driver).not.toContain('},300000)');
  const job = workflow.split('  verify-d1f-combined-pixels:\n')[1]
    .split(/^  [a-z][\w-]*:\s*$/m)[0];
  const workflowMs = Number(job.match(/timeout-minutes: (\d+)/)?.[1]) * 60000;
  expect(workflowMs - 540000).toBeGreaterThanOrEqual(300000);
  expect(driver).toContain("failureCode:'D1F_DRIVER_DEADLINE_EXCEEDED'");
  expect(driver).toContain("const requestedVariant = process.env.D1F_COMBINED_VARIANT;");
  expect(driver).toContain('for(const variant of [requestedVariant])');
  expect(driver).toContain("evidence.allFourVariantsVerifiedByThisJob = false");
});

test('SOUTH failure must never become completion or HUMAN_REVIEW success', () => {
  expect(driver).toContain("evidence.phase='FOUR_SOURCE_TARGET_PIXELS'");
  expect(driver).toContain('const pixels=evaluateD1FFourTargetPixelGate(samples)');
  expect(driver).toContain("check(accepted)");
  expect(driver).toContain("evidence.result='FAIL'");
  expect(driver).toContain("humanReview: 'NOT_RUN'");
  expect(driver).toContain('productionPublicationVerifiedByThisFunction = false');
  expect(driver).toContain('raw.length===ASSET.bytes && hash(raw)===ASSET.sha256');
});

test('actual driver watchdog persists FAIL and clears prior verification on expiry', () => {
  const outerTry = driver.indexOf('\ntry {\n  check(process.env.GITHUB_REF');
  expect(outerTry).toBeGreaterThan(0);
  const source = driver.slice(0, outerTry).replace(/^import .*;\n/gm, '');
  const timers: Array<{ callback: () => void, delay: number }> = [];
  const writes: Array<{ path: string, data: string }> = [];
  const messages: string[] = [];
  const exits: number[] = [];
  const context = createContext({
    fs: {
      mkdirSync: () => undefined,
      writeFileSync: (path: string, data: string) => writes.push({ path, data }),
    },
    createHash,
    D1F_COMBINED_WALL_ASSETS,
    console: { log: (message: string) => messages.push(message) },
    process: { exit: (code: number) => exits.push(code) },
    setTimeout: (callback: () => void, delay: number) => {
      timers.push({ callback, delay });
      return timers.length;
    },
  });
  runInContext(source, context);
  expect(timers).toHaveLength(1);
  expect(timers[0].delay).toBe(540000);
  // Prove that expiry overrides prior progress instead of leaving a false PASS.
  runInContext("Object.assign(evidence, { result: 'PASS', authenticatedAutoloadVerified: true, actualBrowserWebGlVerified: true, fourTargetsRenderedVerified: true })", context);
  timers[0].callback();
  expect(exits).toEqual([1]);
  expect(writes).toHaveLength(1);
  expect(writes[0].path).toBe('test-results/d1f-combined-production/evidence.json');
  const evidence = JSON.parse(writes[0].data);
  expect(evidence.result).toBe('FAIL');
  expect(evidence.failureCode).toBe('D1F_DRIVER_DEADLINE_EXCEEDED');
  expect(evidence.authenticatedAutoloadVerified).toBe(false);
  expect(evidence.actualBrowserWebGlVerified).toBe(false);
  expect(evidence.fourTargetsRenderedVerified).toBe(false);
  expect(evidence.humanReview).toBe('NOT_RUN');
  expect(evidence.current).toBe(false);
  expect(evidence.asBuilt).toBe(false);
  expect(JSON.parse(messages[0])).toEqual(evidence);
});
