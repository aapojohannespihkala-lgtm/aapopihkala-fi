import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { D1F_COMBINED_WALL_VARIANTS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

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

test('source-specific canvas capture has 25s bound; driver keeps global 300s fail-closed deadline', () => {
  expect(driver.match(/canvas\.screenshot\(\{timeout:25000\}\)/g)).toHaveLength(1);
  expect(driver).not.toContain('canvas.screenshot({timeout:15000})');
  expect(driver).toContain('},300000)');
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
