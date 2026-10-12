import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
// @ts-ignore - exact production workflow consumes the same untyped ESM helper.
import {
  inspectP137EScene67ProductionSmoke,
  inspectP137EScene67PublishedGlb,
  P137E_SCENE67_EXPECTED_GLB_BYTES,
  P137E_SCENE67_EXPECTED_GLB_SHA256,
  P137E_SCENE67_PRODUCTION_GLB_URL,
  P137E_SCENE67_PRODUCTION_DATASET,
  P137E_SCENE67_PRODUCTION_SMOKE_ID,
  P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
} from '../../src/scripts/privateModelP137EScene67ProductionSmokeGuard.mjs';

const source = () => ({ ...P137E_SCENE67_PRODUCTION_DATASET });
const verify = (dataset: Record<string, string>) =>
  inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    dataset,
  );

test('source-bound scene67 evidence is metadata-only, not 3/3 pixels or human approval', () => {
  const proof = verify(source());
  expect(proof).toMatchObject({
    candidateId: P137E_SCENE67_PRODUCTION_SMOKE_ID,
    sourceMetadataMatched: true,
    sceneIndex: 67,
    originalWallNode: 798,
    originalWallMesh: 406,
    expectedDeviceCount: 3,
    glbBytesAuthenticatedByThisGate: false,
    individualDevicePixelsVerified: false,
    publishToCURRENT: false,
    humanReview: 'NOT_RUN',
  });
});

test('unrelated review does not inherit P137E-only invariants', () => {
  expect(inspectP137EScene67ProductionSmoke('other-review', 'other-candidate', {}))
    .toBeNull();
});

test('missing canvas dataset fails before production review evidence', () => {
  expect(() => verify(null as unknown as Record<string, string>)).toThrow(/dataset missing/);
});

test('review/candidate swap is never accepted', () => {
  expect(() => inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID, 'another-candidate', source(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67ProductionSmoke(
    'another-review', P137E_SCENE67_PRODUCTION_SMOKE_ID, source(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67ProductionSmoke(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID + '-forged',
    P137E_SCENE67_PRODUCTION_SMOKE_ID + '-forged', source(),
  )).toThrow(/identity mismatch/);
});

test('wrong default scene or focused original wall identity fails', () => {
  for (const [key, bad] of [
    ['p137eSceneIndex', '64'],
    ['p137eFocusedRootCount', '4'],
    ['p137eOriginalSourceWallNode', '799'],
    ['p137eOriginalSourceWallMesh', '407'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('missing or duplicate Themo count and nonempty room footprint fail', () => {
  for (const [key, bad] of [
    ['p137eWallMountedThemoCount', '2'],
    ['p137eWallMountedThemoCount', '4'],
    ['p137eRoomFootprintCount', '7'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('WORK_TEST cannot be reclassified as CURRENT or as-built', () => {
  for (const [key, bad] of [
    ['p137eWorkTestOnly', 'false'],
    ['p137eCurrentClaim', 'true'],
    ['p137eCanonical', 'true'],
    ['p137eAsBuiltClaim', 'true'],
    ['p137eExactXYClaim', 'true'],
    ['p137eExactZClaim', 'true'],
    ['p137eHumanReview', 'PASS'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});

test('wrong floor, camera and fake autoload fail', () => {
  for (const [key, bad] of [
    ['contentFloor', '2F'],
    ['p137eReviewCameraMode', 'ORTHOGRAPHIC_OTHER'],
    ['workTestReviewAutoload', 'false'],
    ['modelSource', 'current'],
    ['workTestReviewCandidate', 'other'],
  ] as const) {
    expect(() => verify({ ...source(), [key]: bad })).toThrow(new RegExp(key));
  }
});


const assetEvidence = () => ({
  url: P137E_SCENE67_PRODUCTION_GLB_URL,
  status: 200,
  byteLength: P137E_SCENE67_EXPECTED_GLB_BYTES,
  sha256: P137E_SCENE67_EXPECTED_GLB_SHA256,
});
const verifyAsset = (details = assetEvidence()) =>
  inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    details,
  );

test('published scene67 byte gate proves exact fetched asset but not visible devices', () => {
  const proof = verifyAsset();
  expect(proof).toMatchObject({
    productionAssetExactBytesVerified: true,
    browserCanvasUsesTheseBytesVerified: false,
    individualDevicePixelsVerified: false,
    humanReview: 'NOT_RUN',
    publishToCURRENT: false,
    bytes: 3_258_268,
    sha256: '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d',
  });
});

test('published scene67 byte gate rejects auth redirects, truncated and changed bytes', () => {
  const valid = assetEvidence();
  for (const invalid of [
    { ...valid, status: 302 },
    { ...valid, status: 403 },
    { ...valid, url: 'https://aapopihkala.fi/cdn-cgi/access/login' },
    { ...valid, url: 'https://evil.example/private-model/work-test/p137e-d1f-three-wall-mounted-themos.glb' },
    { ...valid, byteLength: valid.byteLength - 1 },
    { ...valid, sha256: '0'.repeat(64) },
    { ...valid, sha256: valid.sha256.toUpperCase() },
  ]) {
    expect(() => verifyAsset(invalid)).toThrow(/production GLB URL, HTTP status, full length or SHA256 mismatch/);
  }
});

test('published GLB verification is exact-candidate only, no alias or review promotion', () => {
  expect(inspectP137EScene67PublishedGlb('other-review', 'other', null)).toBeNull();
  expect(() => inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID + '-forged',
    P137E_SCENE67_PRODUCTION_SMOKE_ID,
    assetEvidence(),
  )).toThrow(/identity mismatch/);
  expect(() => inspectP137EScene67PublishedGlb(
    P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    P137E_SCENE67_PRODUCTION_SMOKE_ID + '-forged',
    assetEvidence(),
  )).toThrow(/identity mismatch/);
  expect(() => verifyAsset(null as unknown as ReturnType<typeof assetEvidence>))
    .toThrow(/production GLB/);
});


test('production workflow captures the original GLB during viewer autoload before independent refetch', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const capture = workflow.indexOf("page.on('response', (response) => {");
  const navigation = workflow.indexOf("await page.goto(reviewUrl, {");
  const snap = workflow.indexOf('const duringViewerAutoload = [...p137eViewerAutoloadResponses]');
  const refetch = workflow.indexOf('const assetResponse = await page.evaluate(async (assetUrl) => {');
  expect(capture).toBeGreaterThan(-1);
  expect(navigation).toBeGreaterThan(capture);
  expect(snap).toBeGreaterThan(navigation);
  expect(refetch).toBeGreaterThan(snap);
  expect(workflow).toContain('duringViewerAutoload.length !== 1');
  expect(workflow).toContain("response.url() === P137E_SCENE67_PRODUCTION_GLB_URL");
  expect(workflow).toContain('viewerResponse.finished()');
  expect(workflow).toContain('viewerResponse.body()');
});

test('viewer autoload evidence requires exact sha and never asserts device pixels or canvas byte equality', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const start = workflow.indexOf('const duringViewerAutoload = [...p137eViewerAutoloadResponses]');
  const end = workflow.indexOf('// In the SAME authenticated browser context', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const guard = workflow.slice(start, end);
  expect(guard).toContain('inspectP137EScene67PublishedGlb(');
  expect(guard).toContain("createHash('sha256').update(viewerGlbBytes).digest('hex')");
  expect(guard).toContain('byteLength: viewerGlbBytes.byteLength');
  expect(guard).toContain('status: viewerResponse.status()');
  expect(guard).toContain('viewerAutoloadNetworkResponseVerified: true');
  expect(guard).toContain('canvasUsedThoseBytesProvenByThisGate: false');
  expect(guard).toContain('individualDevicePixelsVerified: false');
  expect(guard).toContain("humanReview: 'NOT_RUN'");
});

test('production workflow checks merged original face mask source IDs, not old opaque aliases', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  expect(workflow).toContain("north.wall !== 'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED'");
  expect(workflow).toContain("south.wall !== 'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED'");
  expect(workflow).toContain("north.visibleIds !== 'D_THEMO_CURRENT_LOBBY_01'");
  expect(workflow).toContain("north.hiddenIds !== 'D_THEMO_CURRENT_BEDROOM_01,D_THEMO_CURRENT_BATHROOM_01'");
  expect(workflow).toContain("south.visibleIds !== 'D_THEMO_CURRENT_BEDROOM_01,D_THEMO_CURRENT_BATHROOM_01'");
  expect(workflow).toContain("south.hiddenIds !== 'D_THEMO_CURRENT_LOBBY_01'");
  expect(workflow).toContain("north.mask !== 'NORTH_SOURCE_ONLY_RESTOREABLE'");
  expect(workflow).toContain("south.mask !== 'SOUTH_SOURCE_ONLY_RESTOREABLE'");
  expect(workflow).not.toContain("north.wall !== 'NORTH_SOURCE_WALL_OPAQUE'");
  expect(workflow).not.toContain("south.wall !== 'SOUTH_SOURCE_WALL_ALPHA_0_38'");
  expect(workflow).toContain("await southButton.click()");
  expect(workflow).toContain("await northButton.click()");
});

test('authenticated two-face screenshot artifacts require source-bound 1N + 2S rectangles only', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  expect(workflow).toContain("const validateProjectedSourceRois = (state, side, expectedIds) => {");
  expect(workflow).toContain("state.roiStatus !== 'SOURCE_ONLY_PROJECTED'");
  expect(workflow).toContain("rois.cameraKey !== 'P137E_SCENE67_P123C_' + side");
  expect(workflow).toContain("rois.width !== Math.round(box.width)");
  expect(workflow).toContain("rois.individualRenderedPixelsVerified !== false");
  expect(workflow).toContain("roi.logicalDeviceId !== expectedIds[i]");
  expect(workflow).toContain("const northSourceRois = validateProjectedSourceRois(");
  expect(workflow).toContain("north, 'NORTH', ['D_THEMO_CURRENT_LOBBY_01']");
  expect(workflow).toContain("const southSourceRois = validateProjectedSourceRois(south, 'SOUTH', [");
  expect(workflow).toContain("projectedSourceHousingRois: { north:northSourceRois, south:southSourceRois }");
  expect(workflow).toContain("projectedRoisAreNotIndividualPixelProof:true");
  expect(workflow).toContain("threeIndividualThemoHousingPixelsVerified:false");
  expect(workflow).toContain("actualProductionTwoFaceScreenshotsCaptured:true");
  expect(workflow).toContain("humanReview:'NOT_RUN',publishToCURRENT:false");
});
