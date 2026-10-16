import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';

// Contract-level checks only. These do not prove an authenticated production render.
const workflow = readFileSync(resolve(
  process.cwd(), '.github/workflows/private-model-production-review-smoke.yml',
), 'utf8');
const originalAsset = '/private-model/work-test/m5a-r1125-pvk-diameter-source-split.glb';
const autoloadArtifact = 'playwright-artifacts/m5a-r1125-viewer-autoload-original-glb.json';
const location = (value: string) => workflow.indexOf(value);
const requiredLocation = (value: string) => {
  const index = location(value);
  expect(index, 'missing release gate: ' + value).toBeGreaterThanOrEqual(0);
  return index;
};

test('R1125 exact original GLB response is observed before viewer navigation', () => {
  expect(workflow).toContain("import { authenticateM5AR1125OriginalGlb, R1125_ORIGINAL_GLB }");
  expect(workflow).toContain(originalAsset);
  expect(workflow).toContain("new URL(");
  expect(workflow).toContain("reviewBaseUrl,");
  expect(workflow).toContain("const r1125ViewerAutoloadResponses = [];");
  expect(workflow).toContain("response.url() === r1125OriginalAutoloadUrl");
  expect(workflow).toContain("r1125ViewerAutoloadResponses.push(response)");
  expect(requiredLocation("page.on('response', (response) => {"))
    .toBeLessThan(requiredLocation("page.goto(reviewUrl,"));
  expect(requiredLocation("r1125ViewerAutoloadResponses.push(response)"))
    .toBeLessThan(requiredLocation("page.goto(reviewUrl,"));
});

test('R1125 actual viewer response must be unique, exact and complete HTTP 200', () => {
  expect(workflow).toContain("r1125ViewerAutoloadResponses.length !== 1");
  expect(workflow).toContain("const originalResponse = r1125ViewerAutoloadResponses[0]");
  expect(workflow).toContain("originalResponse.url() !== r1125OriginalAutoloadUrl");
  expect(workflow).toContain("originalResponse.status() !== 200");
  expect(workflow).toContain("originalResponse.finished()");
  expect(workflow).toContain("originalResponse.body()");
  expect(workflow).toContain("'viewer autoload response completion', 'R1125'");
  expect(workflow).toContain("'viewer autoload original bytes', 'R1125'");
});

test('raw GLB SHA and exact 13-scene identity gate precedes colored pixel claims', () => {
  const response = requiredLocation("r1125ViewerAutoloadResponses.length !== 1");
  const auth = requiredLocation("authenticateM5AR1125OriginalGlb(");
  const screenshot = requiredLocation("buildM5AR1125BrowserScreenshotProofExpression(");
  expect(response).toBeLessThan(auth);
  expect(auth).toBeLessThan(screenshot);
  expect(workflow).toContain("new Uint8Array(autoloadBytes)");
  expect(workflow).toContain("originalIdentity.sha256 !== R1125_ORIGINAL_GLB.sha256");
  expect(workflow).toContain("originalIdentity.sourceTargetCount !== 13");
  expect(workflow).toContain("originalIdentity.sourceSceneIndex !== 63");
  expect(workflow).toContain("originalIdentity.originalGlbDigestAuthenticated !== true");
  expect(workflow).toContain("originalIdentity.productionScreenshotVerified !== false");
  expect(workflow).toContain("originalIdentity.humanReview !== 'NOT_RUN'");
});

test('R1125 autoload artifact records digest only and does not elevate HUMAN_REVIEW', () => {
  const start = requiredLocation("fs.writeFileSync('" + autoloadArtifact + "'");
  const stop = workflow.indexOf("}, null, 2)", start);
  expect(stop).toBeGreaterThan(start);
  const artifact = workflow.slice(start, stop);
  expect(artifact).toContain("sha256: originalIdentity.sha256");
  expect(artifact).toContain("byteLength: autoloadBytes.length");
  expect(artifact).toContain("sourceSceneIndex: originalIdentity.sourceSceneIndex");
  expect(artifact).toContain("sourceTargetCount: originalIdentity.sourceTargetCount");
  expect(artifact).toContain("viewerAutoloadNetworkResponseVerified: true");
  expect(artifact).toContain("canvasUsedThoseBytesProvenByThisGate: false");
  expect(artifact).toContain("thirteenIndividualPixelIsolationsVerified: false");
  expect(artifact).toContain("humanReview: 'NOT_RUN'");
  expect(artifact).toContain("publishToCURRENT: false");
  expect(artifact).not.toMatch(/\b(?:cookie|authorization|password|bearerToken)\s*:/i);
  expect(artifact).not.toContain("autoloadBytes,");
});

test('R1125 added gate preserves P137E autoload and original pixel hard floors', () => {
  expect(workflow).toContain("p137eViewerAutoloadResponses.push(response)");
  expect(workflow).toContain("P137E_SCENE67_PRODUCTION_GLB_URL");
  expect(workflow).toContain("m5aR1125PixelEvidence.allSourceTargetsVisible !== true");
  expect(workflow).toContain("m5aR1125PixelEvidence.sourceRoiPixels?.length !== 13");
  expect(workflow).toContain("m5aR1125PixelEvidence.ambiguousSourceKeys?.length !== 0");
  expect(workflow).toContain("m5aR1125PixelEvidence.missingKeys?.length !== 0");
  expect(workflow).toContain("exactRawGlbByteReadbackVerified: false");
  expect(workflow).not.toMatch(/m5aR1125HumanReview:\s*'PASS'/);
});
