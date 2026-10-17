import { expect, test } from '@playwright/test';
import { chmodSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { delimiter, join } from 'node:path';
import { m5aZ2R1125CandidateId, m5aZ2R1125ReviewId } from '../../src/scripts/privateModelWorkTest';
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
  const refetch = workflow.indexOf('const assetResponse = await withGlbDeadline(page.evaluate(async (assetUrl) => {');
  expect(capture).toBeGreaterThan(-1);
  expect(navigation).toBeGreaterThan(capture);
  expect(snap).toBeGreaterThan(navigation);
  expect(refetch).toBeGreaterThan(snap);
  expect(workflow).toContain('duringViewerAutoload.length !== 1');
  expect(workflow).toContain("response.url() === P137E_SCENE67_PRODUCTION_GLB_URL");
  expect(workflow).toContain('viewerResponse.finished()');
  expect(workflow).toContain('viewerResponse.body()');
});

test('unfinished production GLB autoload leaves safe stages and fail-closed separate diagnostic', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const responseStart = workflow.indexOf('const viewerResponse = duringViewerAutoload[0]');
  const byteGate = workflow.indexOf('const viewerGlbBytes = await withGlbDeadline(', responseStart);
  expect(responseStart).toBeGreaterThan(-1);
  expect(byteGate).toBeGreaterThan(responseStart);
  const stages = workflow.slice(responseStart, byteGate);
  expect(stages).toContain("recordGlbResponseStage('HEADERS_RECEIVED')");
  expect(stages).toContain("recordGlbResponseStage('AUTOLOAD_INCOMPLETE', diagnostic)");
  expect(stages).toContain('viewerResponse.finished()');
  expect(stages).toContain("withGlbDeadline(page.evaluate(async (assetUrl) => {");
  expect(stages).toContain('}, P137E_SCENE67_PRODUCTION_GLB_URL)');
  expect(stages).toContain("const timer = setTimeout(() => controller.abort(), 10_000)");
  expect(stages).toContain("exactAssetUrlMatched: viewerResponse.url() === P137E_SCENE67_PRODUCTION_GLB_URL");
  expect(stages).toContain("contentType: glbHeaders['content-type'] ?? null");
  expect(stages).toContain("contentLength: glbHeaders['content-length'] ?? null");
  expect(stages).toContain('viewerAutoloadNetworkResponseVerified: false');
  expect(stages).toContain('individualDevicePixelsVerified: false');
  expect(stages).toContain("humanReview: 'NOT_RUN'");
  expect(stages).toContain('publishToCURRENT: false');
  expect(stages).toContain('throw error;');
  expect(stages).not.toContain("glbHeaders['set-cookie']");
  expect(stages).not.toContain("glbHeaders['authorization']");
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
  expect(workflow).toContain('p137eThreeHousingPixelEvidence.threeDistinctSourceHousingsVerifiedInThisProductionExecution');
  expect(workflow).toContain("actualProductionTwoFaceScreenshotsCaptured:true");
  expect(workflow).toContain("humanReview:'NOT_RUN',publishToCURRENT:false");
});

test('production P137E opens the real closed View menu for each two-face button, not during screenshots', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const captureNorth = workflow.indexOf("path: 'playwright-artifacts/production-review-before.png'");
  const buttons = workflow.indexOf("const southButton = page.locator('#p137e-south-face-button');");
  const openStatement = "await viewMenu.locator(':scope > summary').click();";
  const firstOpen = workflow.indexOf(openStatement, buttons);
  const northCheck = workflow.indexOf('!await northButton.isVisible() || !await southButton.isVisible()', firstOpen);
  const toSouth = workflow.indexOf('await southButton.click();', northCheck);
  const captureSouth = workflow.indexOf("path: 'playwright-artifacts/p137e-scene67-south.png'", toSouth);
  const secondOpen = workflow.indexOf(openStatement, captureSouth);
  const toNorth = workflow.indexOf('await northButton.click();', secondOpen);
  expect(captureNorth).toBeGreaterThan(-1);
  expect(buttons).toBeGreaterThan(captureNorth);
  expect(firstOpen).toBeGreaterThan(buttons);
  expect(northCheck).toBeGreaterThan(firstOpen);
  expect(toSouth).toBeGreaterThan(northCheck);
  expect(captureSouth).toBeGreaterThan(toSouth);
  expect(secondOpen).toBeGreaterThan(captureSouth);
  expect(toNorth).toBeGreaterThan(secondOpen);
  expect(workflow).toContain("const viewMenu = page.locator('#view-menu');");
  expect(workflow).toContain("if (!await viewMenu.evaluate((menu) => menu.open))");
});

test('actual production screenshot isolates each of three original Themo housings from the same auth-bound GLB', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const loaded = workflow.indexOf('const viewerNetworkAsset = inspectP137EScene67PublishedGlb(');
  const sourceRois = workflow.indexOf('const northSourceRois = validateProjectedSourceRois(');
  const probe = workflow.indexOf('const captureSourceHousingPixels = async (side, baselinePng, sourceRois) => {');
  const north = workflow.indexOf("const northHousingPixels = await captureSourceHousingPixels(");
  const toSouth = workflow.indexOf('await southButton.click();', north);
  const southCapture = workflow.indexOf("path: 'playwright-artifacts/p137e-scene67-south.png'", toSouth);
  const south = workflow.indexOf("const southHousingPixels = await captureSourceHousingPixels(", southCapture);
  const toNorth = workflow.indexOf('await northButton.click();', south);
  expect(loaded).toBeGreaterThan(-1);
  expect(sourceRois).toBeGreaterThan(loaded);
  expect(probe).toBeGreaterThan(sourceRois);
  expect(north).toBeGreaterThan(probe);
  expect(toSouth).toBeGreaterThan(north);
  expect(southCapture).toBeGreaterThan(toSouth);
  expect(south).toBeGreaterThan(southCapture);
  expect(toNorth).toBeGreaterThan(south);
  expect(workflow).toContain("window.dispatchEvent(new CustomEvent('p137e-scene67-housing-probe'");
  expect(workflow).toContain('sourceRois.projectedTargets.find(');
  expect(workflow).toContain("state.state !== 'SOURCE_ONLY_UNVERIFIED_PIXELS'");
  expect(workflow).toContain('state.hiddenId !== id');
  expect(workflow).toContain('pixels.inside < 48 || pixels.outside !== 0');
  expect(workflow).toContain('pixels.total !== 0');
  expect(workflow).toContain('restoredDiff.total !== 0');
  expect(workflow).toContain('if ((a.x-b.x)**2 + (a.y-b.y)**2 <= (a.radius+b.radius)**2)');
});

test('per-device production PNGs require decoded real RGBA changes, zero ghost pixels and no approval promotion', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const start = workflow.indexOf('const compareHousingPngRgba = async');
  const end = workflow.indexOf('// SOUTH click closed <details>', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const block = workflow.slice(start, end);
  expect(block).toContain("img.src = url; await img.decode()");
  expect(block).toContain("ctx.getImageData(0, 0, surface.width, surface.height).data");
  expect(block).toContain("Math.abs(a.rgba[k + c] - b.rgba[k + c]) >= 20");
  expect(block).toContain('region.radius ** 2');
  expect(block).toContain('for (const id of allHousingIds)');
  expect(block).toContain('const restoredPng = await page.screenshot({');
  expect(block).toContain('threeDistinctSourceHousingsVerifiedInThisProductionExecution: true');
  expect(block).toContain('syntheticFixture: false');
  expect(block).toContain("humanReview: 'NOT_RUN'");
  expect(block).toContain('publishToCURRENT: false');
  expect(block).toContain('p137e-scene67-three-housing-rgba.json');
  expect(workflow).not.toContain('HUMAN_REVIEW: PASS');
});


test('production original P123C top plan executes three real source Themo crosses and four-click MITTAA', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const original = workflow.indexOf(
    "const viewerNetworkAsset = inspectP137EScene67PublishedGlb(");
  const threeHousing = workflow.indexOf(
    'const p137eThreeHousingPixelEvidence = {');
  const northRestore = workflow.indexOf(
    "await northButton.click();", threeHousing);
  const plan = workflow.indexOf(
    "const planButton = page.locator('#p137e-plan-face-button');", northRestore);
  const screenshot = workflow.indexOf(
    "path: 'playwright-artifacts/p137e-scene67-original-top-plan.png'", plan);
  const wallPixels = workflow.indexOf(
    "if (!planGreen?.passed)", screenshot);
  const place = workflow.indexOf(
    "await placeButton.click();", wallPixels);
  const separateCrosses = workflow.indexOf(
    "for (const [index, id] of targetIds.entries())", place);
  const measure = workflow.indexOf(
    "await measureButton.click();", separateCrosses);
  const mm = workflow.indexOf(
    "const mm = Number(await canvas.getAttribute('data-axis-measure-mm'));", measure);
  const measured = workflow.indexOf(
    "path: 'playwright-artifacts/p137e-scene67-source-plan-ruler-mm.png'", mm);
  const handoff = workflow.indexOf(
    "fs.writeFileSync('playwright-artifacts/p137e-scene67-plan-tools.json'", measured);
  for (const [earlier, later] of [
    [original, threeHousing], [threeHousing, northRestore],
    [northRestore, plan], [plan, screenshot], [screenshot, wallPixels],
    [wallPixels, place], [place, separateCrosses], [separateCrosses, measure],
    [measure, mm], [mm, measured], [measured, handoff],
  ]) {
    expect(earlier).toBeGreaterThan(-1);
    expect(later).toBeGreaterThan(earlier);
  }
  const body = workflow.slice(plan, handoff + 100);
  expect(body).toContain("canvas?.dataset.p137eScene67TopPlanToolsReady === 'true'");
  expect(body).toContain("planDataset.current !== 'false'");
  expect(body).toContain("planDataset.humanReview !== 'NOT_RUN'");
  expect(body).toContain("await targetSelector.selectOption(id);");
  expect(body).toContain("const sourcePlanCrossFractions = [0.55, 0.575, 0.60];");
  expect(body).toContain("await clickPlanFraction(sourcePlanCrossFractions[index], 0.49);");
  const chromiumFixture = readFileSync(
    "tests/e2e/private-model-p137e-scene67-browser-interaction.spec.ts", "utf8");
  expect(chromiumFixture).toContain("const sourcePlanCrossFractions = [0.55, 0.575, 0.60] as const;");
  expect(chromiumFixture).toContain("await clickPlan(sourcePlanCrossFractions[i], 0.49);");
  expect(chromiumFixture).toContain("box!.width * sourcePlanCrossFractions[i]");
  expect(body).toContain("String(index + 1)");
  expect(body).toContain("!placementState.includes('ei tallennettu G2:een')");
  expect(body).toContain("await clickPlanFraction(0.55, 0.49)");
  expect(body).toContain("await clickPlanFraction(0.575, 0.49)");
  expect(body).toContain("await clickPlanFraction(0.60, 0.49)");
  expect(body).toContain("await clickPlanFraction(0.56, 0.49)");
  expect(body).toContain("!rulerText.includes('mm (mallista)')");
  expect(body).toContain("persistedG2ByThisGate: false");
  expect(body).toContain("actualNativeG2Readback: 'NOT_RUN'");
  expect(body).toContain("humanReview: 'NOT_RUN'");
  expect(body).toContain("publishToCURRENT: false");
  expect(body).not.toContain("p137eG2Client.persist(");
  expect(body).not.toContain("HUMAN_REVIEW: 'PASS'");
});


test('P137E motion proof compares the SAME real NORTH source before and after permitted right pan', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const originalNorth = workflow.indexOf("const northHousingPixels = await captureSourceHousingPixels(");
  const south = workflow.indexOf("const southHousingPixels = await captureSourceHousingPixels(");
  const topPlan = workflow.indexOf("path: 'playwright-artifacts/p137e-scene67-original-top-plan.png'");
  const ruler = workflow.indexOf("path: 'playwright-artifacts/p137e-scene67-source-plan-ruler-mm.png'");
  const planTools = workflow.indexOf("fs.writeFileSync('playwright-artifacts/p137e-scene67-plan-tools.json'");
  const backToNorth = workflow.indexOf("const restoredFace = await readFace();", planTools);
  const northBeforePan = workflow.indexOf("path: 'playwright-artifacts/p137e-scene67-north-before-pan.png'", backToNorth);
  const rightPan = workflow.indexOf("const motionButton = p137eScene67SourceEvidence ? 'right' : pointerButton;", northBeforePan);
  const afterPan = workflow.indexOf("path: 'playwright-artifacts/production-review-after-orbit.png'", rightPan);
  const pixelReference = workflow.indexOf("(p137eScene67SameCameraPanBefore ?? before).toString('base64')", afterPan);
  for (const [earlier, later] of [
    [originalNorth, south], [south, topPlan], [topPlan, ruler],
    [ruler, planTools], [planTools, backToNorth],
    [backToNorth, northBeforePan], [northBeforePan, rightPan],
    [rightPan, afterPan], [afterPan, pixelReference],
  ]) {
    expect(earlier).toBeGreaterThan(-1);
    expect(later).toBeGreaterThan(earlier);
  }
  const src = workflow.slice(planTools, pixelReference + 120);
  expect(src).toContain("restoredFace.face !== 'NORTH'");
  expect(src).toContain("restoredFace.ids !== 'D_THEMO_CURRENT_LOBBY_01'");
  expect(src).toContain("restoredFace.sourceOnly !== 'true'");
  expect(src).toContain("restoredFace.render !== 'false'");
  expect(src).toContain("restoredFace.humanReview !== 'NOT_RUN'");
  expect(src).toContain("await page.mouse.down({ button: motionButton });");
  expect(src).toContain("await page.mouse.up({ button: motionButton });");
  expect(workflow).toContain("const pointerButton = isX4Themo ? 'right' : 'left'");
  expect(workflow).toContain('pixelEvidence.changedPixels < minChangedPixels');
  expect(workflow).toContain('pixelEvidence.nonBackgroundPixels < minNonBackgroundPixels');
  expect(workflow).not.toContain('HUMAN_REVIEW: PASS');
});


// Read the actual dispatch defaults and execute the exact Python validator
// that the main-only production job runs, without Access secrets or a browser.
const productionDispatchSource = () =>
  readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
const dispatchDefault = (name: string) => {
  const workflow = productionDispatchSource();
  const inputs = workflow.split('  workflow_dispatch:\n')[1]?.split('\npermissions:')[0];
  if (!inputs) throw new Error('Production dispatch inputs missing');
  const lines = inputs.split('\n');
  const start = lines.indexOf('      ' + name + ':');
  if (start < 0) throw new Error('Production input missing: ' + name);
  const next = lines.findIndex((line, i) => i > start && /^      [a-z_]+:$/.test(line));
  const raw = lines.slice(start + 1, next < 0 ? undefined : next)
    .find(line => line.startsWith('        default: '))?.slice('        default: '.length);
  if (!raw) throw new Error('Production input has no default: ' + name);
  if (raw.startsWith("'")) return raw.slice(1, -1).replaceAll("''", "'");
  return raw.startsWith('"') ? JSON.parse(raw) : raw;
};
const productionInputEnvironment = () => {
  const workflow = productionDispatchSource().split('  verify-production:\n')[1];
  const floor = (key: string) => {
    const match = workflow.match(new RegExp("^      " + key + ": '([0-9]+)'$", 'm'));
    if (!match) throw new Error('Production hard floor missing: ' + key);
    return match[1];
  };
  return {
    REVIEW_BASE_URL: 'https://aapopihkala.fi/private-model/',
    REVIEW_ID: dispatchDefault('review_id'),
    CANDIDATE_ID: dispatchDefault('candidate_id'),
    EXPECTED_DATASET_JSON: dispatchDefault('expected_dataset_json'),
    REQUESTED_MIN_NON_BACKGROUND_PIXELS: dispatchDefault('min_non_background_pixels'),
    REQUESTED_MIN_CHANGED_PIXELS: dispatchDefault('min_changed_pixels'),
    MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR: floor('MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR'),
    MIN_CHANGED_PIXELS_HARD_FLOOR: floor('MIN_CHANGED_PIXELS_HARD_FLOOR'),
  };
};
const runActualProductionInputValidator = (override: Record<string, string> = {}) => {
  const workflow = productionDispatchSource();
  const start = workflow.indexOf('      - name: Validate generic production review inputs and hard floors');
  const end = workflow.indexOf('      - name:', start + 20);
  if (start < 0 || end < 0) throw new Error('Actual production input step missing');
  const block = workflow.slice(start, end);
  const program = block.match(/python3 - <<'PY'\n([\s\S]*?)\n {10}PY/)?.[1];
  if (!program) throw new Error('Actual production input Python missing');
  const result = spawnSync('python3', ['-c', program.replace(/^ {10}/gm, '')], {
    encoding: 'utf8', timeout: 10_000,
    env: { PATH: process.env.PATH, ...productionInputEnvironment(), ...override },
  });
  if (result.error) throw result.error;
  return result;
};

test('prefilled Themo dispatch passes the actual production input step and exact source identity gate', () => {
  const defaults = productionInputEnvironment();
  const result = runActualProductionInputValidator();
  expect(result.status).toBe(0);
  const accepted = JSON.parse(result.stdout);
  expect(accepted).toMatchObject({
    reviewId: P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID,
    candidateId: P137E_SCENE67_PRODUCTION_SMOKE_ID,
    pixelThresholds: { nonBackgroundPixels: 1500, changedPixels: 750 },
    hardFloors: { nonBackgroundPixels: 1500, changedPixels: 750 },
  });
  const specific = JSON.parse(defaults.EXPECTED_DATASET_JSON);
  const reserved = new Set(['workTestReviewAutoload', 'modelSource',
    'workTestReviewMode', 'workTestReviewCandidate']);
  expect(specific).toEqual(Object.fromEntries(Object.entries(
    P137E_SCENE67_PRODUCTION_DATASET).filter(([key]) => !reserved.has(key))));
  expect(inspectP137EScene67ProductionSmoke(defaults.REVIEW_ID, defaults.CANDIDATE_ID, {
    workTestReviewAutoload: 'true', modelSource: 'work-test',
    workTestReviewMode: defaults.REVIEW_ID, workTestReviewCandidate: defaults.CANDIDATE_ID,
    ...specific,
  })).toMatchObject({ sourceMetadataMatched: true,
    individualDevicePixelsVerified: false, humanReview: 'NOT_RUN', publishToCURRENT: false });
});

test('actual prefilled production input step still rejects wrong host and invalid or reserved datasets', () => {
  const cases: Array<Record<string, string>> = [
    { REVIEW_BASE_URL: 'https://evil.example/private-model/' },
    { EXPECTED_DATASET_JSON: '{broken' },
    { EXPECTED_DATASET_JSON: '{}' },
    { EXPECTED_DATASET_JSON: '{"modelSource":"current"}' },
  ];
  for (const override of cases) {
    expect(runActualProductionInputValidator(override).status).not.toBe(0);
  }
});

test('prefilled dispatch cannot reduce either production pixel hard floor', () => {
  const defaults = productionInputEnvironment();
  const cases: Array<Record<string, string>> = [
    { REQUESTED_MIN_NON_BACKGROUND_PIXELS: String(Number(defaults.MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR) - 1) },
    { REQUESTED_MIN_CHANGED_PIXELS: String(Number(defaults.MIN_CHANGED_PIXELS_HARD_FLOOR) - 1) },
  ];
  for (const override of cases) {
    const result = runActualProductionInputValidator(override);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cannot be lower than hard floor');
  }
});


test('manual production dispatch cannot be preempted by secretless pull-request checks', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const scheduling = workflow.split('\nconcurrency:\n')[1]?.split('\njobs:\n')[0];
  expect(scheduling).toBeDefined();
  expect(scheduling).toContain(
    "group: private-model-production-review-smoke-${{ github.event_name }}-${{ github.ref }}");
  expect(scheduling).toContain(
    "cancel-in-progress: ${{ github.event_name == 'pull_request' }}");
  expect(scheduling).not.toMatch(/^  group: private-model-production-review-smoke$/m);
  expect(workflow).toContain("if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
  expect(workflow).toContain("if: github.event_name == 'pull_request'");
});

test('production scene67 original GLB proof fails closed on stalled network/body instead of job timeout', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const source = workflow.split('      - name: Verify exact autoload and rendered production canvas')[1];
  expect(source).toBeDefined();
  expect(source).toContain("const withGlbDeadline = async (promise, stage, identity = 'P137E') =>");
  expect(source).toContain("viewerResponse.finished(), 'autoload response completion'");
  expect(source).toContain("viewerResponse.body(), 'autoload response bytes'");
  expect(source).toContain("45_000");
  expect(source).toContain('signal: controller.signal,');
  expect(source).toContain("controller.abort()");
  expect(source).toContain("'independent no-cache fetch'");
  expect(source).toContain("inspectP137EScene67PublishedGlb(");
  expect(source).toContain("p137e-scene67-exact-production-glb.json");
  expect(source).toContain("p137e-scene67-viewer-autoload-glb.json");
  expect(source).toContain("individualDevicePixelsVerified: false");
  expect(workflow).toContain("MIN_NON_BACKGROUND_PIXELS_HARD_FLOOR: '1500'");
  expect(workflow).toContain("MIN_CHANGED_PIXELS_HARD_FLOOR: '750'");
  expect(workflow).not.toContain('HUMAN_REVIEW: PASS');
});


test('G2 exact three-observation readback is explicit main-only and distinct from render', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  expect(workflow).toContain('          - g2-records-readback');
  expect(workflow).toContain("inputs.probe_mode == 'full-render'");
  expect(workflow).toContain("inputs.probe_mode == 'g2-readiness'");
  const job = workflow.split('  verify-g2-observations-readback:')[1];
  expect(job).toBeDefined();
  expect(job).toContain("github.event_name == 'workflow_dispatch'");
  expect(job).toContain("github.ref == 'refs/heads/main'");
  expect(job).toContain("inputs.probe_mode == 'g2-records-readback'");
  expect(job).not.toContain('pull_request');
  expect(job).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_ID:');
  expect(job).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET:');
});

test('G2 per-record probe calls only immutable exact GET routes without another Docs write', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const job = workflow.split('  verify-g2-observations-readback:')[1] ?? '';
  const ids = [
    'P137E_G2_2ea51c8886014d7abe51f4f7915da068',
    'P137E_G2_ad31cfc5497548a98e4dd400f1acdc48',
    'P137E_G2_11262097b6124ba68ea4fdbdbc0bed32',
  ];
  for (const id of ids) expect(job.split(id)).toHaveLength(2);
  expect(job).toContain('const allowedUrls = new Set(records.map(record => route + record.id))');
  expect(job).toContain("options.method !== 'GET'");
  expect(job).toContain('options.body !== undefined');
  expect(job).toContain('await client.readback(record.id)');
  expect(job).not.toContain('client.persist(');
  expect(job).not.toContain("method: 'POST'");
  expect(job).not.toContain('batchUpdateDocument(');
  expect(job).toContain("newObservationCreated: false");
  expect(job).toContain("nativeG2WriteAttempted: false");
});

test('G2 observation readback does not promote approximate pins or leak private evidence', () => {
  const workflow = readFileSync('.github/workflows/private-model-production-review-smoke.yml', 'utf8');
  const job = workflow.split('  verify-g2-observations-readback:')[1] ?? '';
  for (const requirement of [
    "a?.approximate !== true",
    "a?.exactXY !== false",
    "observed?.height?.zM !== null",
    "p.resolution?.status !== 'UNMAPPED'",
    "p.resolution?.reason !== 'NO_APPROVED_HOST'",
    "p.resolution?.proposal !== null",
    "p.persisted !== false",
    "p.humanReview !== 'NOT_RUN'",
    "p.currentGeometry !== false",
    "p.canonical !== false",
    "p.asBuilt !== false",
    "evidence.failure = 'WORKER_READBACK_NOT_VERIFIED'",
    "humanReview: 'NOT_RUN'",
    "publishToCURRENT: false",
  ]) expect(job).toContain(requirement);
  expect(job).not.toContain('console.log(actual)');
  expect(job).not.toContain('console.log(error)');
  expect(job).not.toContain('response.headers.entries()');
  expect(job).toContain('JSON.stringify(evidence)');
  expect(job).toContain('if (!evidence.authenticatedWorkerGetVerified) process.exitCode = 1');
});

const cookieCanary = 'SYNTHETIC_COOKIE_NOT_A_CREDENTIAL_7d07';
const queryCanary = 'SYNTHETIC_REDIRECT_STATE_f566';
const accessUrl = 'https://fixture.cloudflareaccess.com/login?state=' + queryCanary;
const runActualResponsePreflight = (root: string, options: {
  status: number; body: string; redirect?: string; curlExit?: number;
}) => {
  const workflow = productionDispatchSource();
  const start = workflow.indexOf('      - name: Classify authenticated production viewer response');
  const end = workflow.indexOf('\n      - ', start + 20);
  const program = workflow.slice(start, end).split('        run: |\n')[1];
  if (start < 0 || end < 0 || !program) throw new Error('Actual response preflight missing');
  const bin = join(root, 'stub-bin');
  mkdirSync(bin, { recursive: true });
  const curl = join(bin, 'curl');
  writeFileSync(curl, `#!/usr/bin/env python3
import os, sys
from pathlib import Path
args = sys.argv[1:]
Path(args[args.index('--dump-header') + 1]).write_text(os.environ['FIXTURE_HEADERS'])
Path(args[args.index('--output') + 1]).write_text(os.environ['FIXTURE_BODY'])
print(os.environ['FIXTURE_STATUS'])
print('text/html')
print(os.environ['FIXTURE_REDIRECT'])
sys.exit(int(os.environ['FIXTURE_CURL_EXIT']))
`);
  chmodSync(curl, 0o755);
  const redirect = options.redirect ?? '';
  const result = spawnSync('bash', ['-s'], {
    cwd: root, input: program.replace(/^ {10}/gm, ''), encoding: 'utf8', timeout: 10_000,
    env: {
      PATH: bin + delimiter + (process.env.PATH ?? ''),
      REVIEW_ID: 'synthetic-review', REVIEW_BASE_URL: 'https://aapopihkala.fi/private-model/',
      CF_ACCESS_VIEWER_PROBE_CLIENT_ID: 'synthetic-client-id',
      CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET: 'synthetic-client-secret',
      FIXTURE_HEADERS: `HTTP/2 ${options.status}\r\nContent-Type: text/html\r\nSet-Cookie: CF_Authorization=${cookieCanary}; HttpOnly\r\nLocation: ${redirect}\r\n\r\n`,
      FIXTURE_BODY: options.body, FIXTURE_STATUS: String(options.status),
      FIXTURE_REDIRECT: redirect, FIXTURE_CURL_EXIT: String(options.curlExit ?? 0),
    },
  });
  if (result.error) throw result.error;
  const artifactDir = join(root, 'playwright-artifacts');
  const names = readdirSync(artifactDir);
  const evidence = [result.stdout, result.stderr,
    ...names.map(name => readFileSync(join(artifactDir, name), 'utf8'))].join('\n');
  return { result, names, evidence, privateDirs: readdirSync(root).filter(n => n.startsWith('.production-response.')) };
};
const expectSafeResponseArtifacts = (probe: ReturnType<typeof runActualResponsePreflight>) => {
  expect(probe.names).not.toContain('review-response-headers.txt');
  expect(probe.names).not.toContain('review-response-meta.txt');
  expect(probe.evidence).not.toContain(cookieCanary);
  expect(probe.evidence).not.toContain(queryCanary);
  expect(probe.privateDirs).toEqual([]);
};

test('response preflight keeps valid viewer classification without raw cookie artifacts', ({}, info) => {
  const probe = runActualResponsePreflight(info.outputPath('response'), {
    status: 200, body: '<canvas id="private-model-canvas"></canvas>',
  });
  expectSafeResponseArtifacts(probe);
  expect(probe.result.status).toBe(0);
  expect(probe.names.sort()).toEqual(['review-page.html', 'review-response-classification.txt']);
  expect(probe.evidence).toContain('classification=VIEWER_HTML');
});

for (const fixture of [
  { name: 'redirect', status: 302, body: 'Cloudflare Access', redirect: accessUrl, classification: 'ACCESS_REDIRECT' },
  { name: 'denial', status: 403, body: 'Forbidden', classification: 'ACCESS_DENIED' },
  { name: 'login HTML', status: 200, body: 'Cloudflare Access', classification: 'ACCESS_BODY' },
  { name: 'unrelated HTML', status: 200, body: '<html>unrelated</html>', classification: 'NON_VIEWER_200_BODY' },
]) {
  test(`response preflight rejects ${fixture.name} without leaking cookies or redirect state`, ({}, info) => {
    const probe = runActualResponsePreflight(info.outputPath('response'), fixture);
    expectSafeResponseArtifacts(probe);
    expect(probe.result.status).not.toBe(0);
    expect(probe.evidence).toContain('classification=' + fixture.classification);
  });
}

test('response preflight cleans private data when curl fails before classification', ({}, info) => {
  const probe = runActualResponsePreflight(info.outputPath('response'), {
    status: 0, body: '', redirect: accessUrl, curlExit: 7,
  });
  expectSafeResponseArtifacts(probe);
  expect(probe.result.status).toBe(7);
  expect(probe.names).toEqual(['review-page.html']);
});

const runActualR1125Preset = (root: string, routingOverride?: string) => {
  const workflow = productionDispatchSource();
  const start = workflow.indexOf('      - name: Resolve canonical R1125 render preset');
  const end = workflow.indexOf('\n      - ', start + 20);
  const block = workflow.slice(start, end);
  let program = block.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\n {10}NODE/)?.[1];
  if (start < 0 || !program) throw new Error('Actual R1125 preset missing');
  program = program.replace(/^ {10}/gm, '');
  if (routingOverride !== undefined) {
    program = program.replace("readFileSync('src/scripts/privateModelWorkTest.ts', 'utf8')", JSON.stringify(routingOverride));
  }
  mkdirSync(root, { recursive: true });
  const envFile = join(root, 'step.env');
  writeFileSync(envFile, '');
  const result = spawnSync(process.execPath, ['--input-type=module'], {
    input: program, encoding: 'utf8', timeout: 10_000,
    env: { PATH: process.env.PATH, GITHUB_ENV: envFile },
  });
  if (result.error) throw result.error;
  const values = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').filter(Boolean).map(line => {
    const split = line.indexOf('=');
    return [line.slice(0, split), line.slice(split + 1)];
  }));
  return { result, values };
};

test('R1125 preset derives exact canonical routing and 13 source roles before the real input validator', ({}, info) => {
  const { result, values } = runActualR1125Preset(info.outputPath('preset'));
  expect(result.status).toBe(0);
  expect(values.REVIEW_ID).toBe(m5aZ2R1125ReviewId);
  expect(values.CANDIDATE_ID).toBe(m5aZ2R1125CandidateId);
  expect(JSON.parse(values.EXPECTED_DATASET_JSON)).toMatchObject({
    m5aReviewTargetRenderableCount: '13', m5aReviewExpectedTargetRenderableCount: '13',
    m5aReviewWellMarkerCount: '4', m5aReviewRouteCount: '7',
    m5aReviewUnresolvedBoundaryCount: '2', m5aR1125SourceSceneIndex: '63',
    m5aR1125SourceContract: 'G2_R1125', m5aHumanReview: 'NOT_RUN', m5aR1125HumanReview: 'NOT_RUN',
  });
  const validated = runActualProductionInputValidator(values);
  expect(validated.status).toBe(0);
  expect(JSON.parse(validated.stdout)).toMatchObject({
    reviewId: m5aZ2R1125ReviewId, candidateId: m5aZ2R1125CandidateId,
    pixelThresholds: { nonBackgroundPixels: 1500, changedPixels: 750 },
  });
});

test('R1125 preset fails without environment output when canonical declarations change or duplicate', ({}, info) => {
  const source = readFileSync('src/scripts/privateModelWorkTest.ts', 'utf8');
  const declaration = source.match(/^export const m5aZ2R1125CandidateId = .*;$/m)?.[0];
  if (!declaration) throw new Error('Canonical candidate declaration missing');
  for (const [index, changed] of [
    source.replace('`${m5aZ2R1125CandidateId}-review`', '`${m5aZ2R1125CandidateId}-unknown`'),
    source + '\n' + declaration,
  ].entries()) {
    const { result, values } = runActualR1125Preset(info.outputPath('invalid-' + index), changed);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('canonical identity declarations changed');
    expect(values).toEqual({});
  }
});

test('R1125 preset preserves production pixel floors and legacy Themo defaults', ({}, info) => {
  const { values } = runActualR1125Preset(info.outputPath('preset'));
  const lowerLimits: Array<Record<string, string>> = [
    { REQUESTED_MIN_NON_BACKGROUND_PIXELS: '1499' },
    { REQUESTED_MIN_CHANGED_PIXELS: '749' },
  ];
  for (const limits of lowerLimits) {
    const result = runActualProductionInputValidator({ ...values, ...limits });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cannot be lower than hard floor');
  }
  expect(dispatchDefault('probe_mode')).toBe('full-render');
  expect(dispatchDefault('review_id')).toBe(P137E_SCENE67_PRODUCTION_SMOKE_REVIEW_ID);
  expect(dispatchDefault('candidate_id')).toBe(P137E_SCENE67_PRODUCTION_SMOKE_ID);
});

test('R1125 preset remains main-only and resolves before validation and authentication', () => {
  const workflow = productionDispatchSource();
  expect(workflow).toContain('          - r1125-render');
  const job = workflow.split('  verify-production:\n')[1].split('  verify-g2-readiness:')[0];
  expect(job).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");
  expect(job).toContain("inputs.probe_mode == 'r1125-render'");
  expect(job).toContain("if: inputs.probe_mode == 'r1125-render'");
  expect(job.indexOf('Resolve canonical R1125 render preset')).toBeLessThan(job.indexOf('Validate generic production review inputs'));
  expect(job.indexOf('Validate generic production review inputs')).toBeLessThan(job.indexOf('Classify authenticated production viewer response'));
  expect(job).toContain('response_tmp="$(mktemp -d .production-response.XXXXXX)"');
});
