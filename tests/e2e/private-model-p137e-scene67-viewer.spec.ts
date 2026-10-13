import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { routeScene67SyntheticHttpsAssets, SYNTHETIC_SCENE67_ORIGIN } from './p137eScene67SyntheticBrowserHarness';
import {
  getRequestedReviewCandidateId,
  isPrivateModelReviewRequested,
} from '../../src/scripts/privateModelWorkTest';
import {
  p137eFocusedReviewSceneIndex,
  p137eFocusedReviewSceneName,
} from '../../src/scripts/privateModelP137EScene67Selection';

const runtime = readFileSync(resolve(process.cwd(), 'src/pages/private-model/index.astro'), 'utf8');
const candidateId = 'p137e-d1f-three-wall-mounted-themos';
const reviewId = `${candidateId}-review`;

test('P137E review route resolves to exact candidate through existing one-link autoload', () => {
  expect(getRequestedReviewCandidateId(`?review=${reviewId}`)).toBe(candidateId);
  expect(isPrivateModelReviewRequested(`?review=${reviewId}`, reviewId)).toBe(true);
  expect(getRequestedReviewCandidateId('?review=p186f-x4-d-themo-door-plan-clear-work-assumption-review'))
    .not.toBe(candidateId);
  expect(isPrivateModelReviewRequested('?review=p137e-not-this-review', reviewId)).toBe(false);
  expect(getRequestedReviewCandidateId('?review=p137e-d1f-three-wall-mounted-themos')).toBeNull();
});

test('P137E scene67 loader selects source-bound focused root BEFORE model load', () => {
  const predicate = "candidate.id === p137eScene67CandidateId && isP137EScene67ReviewRequested()";
  const selected = 'gltf.scene = selectP137EScene67FocusedReview(gltf).scene;';
  const loading = "applyLoadedModel(gltf, 'work-test', `WORK_TEST: ${candidate.label}`);";

  expect(runtime).toContain("const p137eScene67CandidateId = 'p137e-d1f-three-wall-mounted-themos';");
  expect(runtime).toContain('const p137eScene67ReviewId = `${p137eScene67CandidateId}-review`;');
  expect(runtime).toContain(predicate);
  expect(runtime).toContain("from '../../scripts/privateModelP137EScene67Selection'");
  expect(runtime).toContain(selected);
  const branchStart = runtime.indexOf('} else if (isP137EScene67Review) {');
  expect(branchStart).toBeGreaterThan(0);
  expect(runtime.indexOf(selected, branchStart)).toBeGreaterThan(branchStart);
  expect(runtime.indexOf(selected, branchStart)).toBeLessThan(runtime.indexOf(loading, branchStart));
  expect(runtime).not.toContain('gltf.scene = gltf.scenes?.[67];');
});

test('P137E never replaces original wall by inherited full scene or room footprint', () => {
  expect(p137eFocusedReviewSceneIndex).toBe(67);
  expect(p137eFocusedReviewSceneName).toBe(
    'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP',
  );
  const start = runtime.indexOf('const applyP137EScene67ReviewState = () => {');
  expect(start).toBeGreaterThan(0);
  const end = runtime.indexOf("const applyP186fReviewState =", start);
  expect(end).toBeGreaterThan(start);
  const state = runtime.slice(start, end);
  expect(state).toContain("fullModelScene.children.length !== 4");
  expect(state).toContain("new THREE.Box3().setFromObject(fullModelScene)");
  expect(state).toContain("setModelScene(fullModelScene)");
  expect(state).toContain("p137eOriginalSourceWallNode: '798'");
  expect(state).toContain("p137eOriginalSourceWallMesh: '406'");
  expect(state).toContain("p137eWallMountedThemoCount: '3'");
  expect(state).toContain("p137eRoomFootprintCount: '0'");
  expect(state).not.toContain('prepareP186dD1fRoomContextBridge()');
  expect(state).not.toContain('prepareP186FX4FloorPlanGuide(');
});

test('P137E view selects existing D1F orthographic camera and retains no-promotion gates', () => {
  const start = runtime.indexOf('const applyP137EScene67ReviewState = () => {');
  const end = runtime.indexOf('const applyP186fReviewState =', start);
  const state = runtime.slice(start, end);
  expect(state).toContain("applyStandardViewPreset('d-1f')");
  expect(state).toContain('activePlanFocusBounds = bounds;');
  expect(state).toContain('fitPlanCamera();');
  expect(state).toContain("p137ePresentationOnly: 'true'");
  expect(state).toContain("p137eWorkTestOnly: 'true'");
  expect(state).toContain("p137eExactXYClaim: 'false'");
  expect(state).toContain("p137eExactZClaim: 'false'");
  expect(state).toContain("p137eCurrentClaim: 'false'");
  expect(state).toContain("p137eCanonical: 'false'");
  expect(state).toContain("p137eAsBuiltClaim: 'false'");
  expect(state).toContain("p137eHumanReview: 'NOT_RUN'");
  expect(state).toContain("p137eReviewCameraMode: 'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP'");
  expect(runtime).toContain('applyP137EScene67ReviewState();');
});

test('P137E route does not alter older X4 or salaoja scene routing', () => {
  expect(runtime).toContain('candidate.id === p186fX4CandidateId && isP186fX4ThemoRoomReviewRequested()');
  expect(runtime).toContain('const reviewScene = gltf.scenes?.[p186fX4ReviewSceneIndex];');
  expect(runtime).toContain('applyP186fReviewState(\'X4\')');
  expect(runtime).toContain('selectM5AR1125SourceBoundReviewScene(gltf)');
  expect(runtime).toContain("p186fHumanReview: 'NOT_RUN'");
});

test('source-bound scene67 top plan shares the same viewer as wall-side review without synthetic footprint', () => {
  const a = runtime.indexOf('const applyP137EScene67TopPlan = () => {');
  const b = runtime.indexOf('const applyP137EScene67ReviewState = () => {', a);
  expect(a).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(a);
  const plan = runtime.slice(a, b);
  expect(plan).toContain('modelRoot.children[0] !== fullModelScene');
  expect(plan).toContain('setModelScene(fullModelScene)');
  expect(plan).toContain('fitPlanCamera()');
  expect(plan).toContain("activateDCoordinateReview('1F')");
  expect(plan).toContain("p137eReviewCameraMode = 'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP'");
  expect(plan).not.toContain('referenceFootprint');
  expect(plan).not.toContain('currentGeometry: true');
  expect(runtime).toContain("p137eLoadedCandidateId !== p137eScene67CandidateId");
});


test('P137E optional scene69 constructs verified source corners and measured I03 without replacing scene67/68', () => {
  const reviewStart = runtime.indexOf('const loadWorkTestCandidate = async');
  const reviewEnd = runtime.indexOf("applyLoadedModel(gltf, 'work-test'", reviewStart);
  const loaderBranch = runtime.slice(reviewStart, reviewEnd);
  expect(loaderBranch).toContain('fetchP137EScene67VerifiedGlb(candidate.path)');
  expect(loaderBranch).toContain('isP137EThreeCornerMeasuredReviewRequested()');
  expect(loaderBranch).toContain('makeP137EThreeCornerMeasuredWorkTest(verifiedP137EOriginal)');
  expect(loaderBranch).toContain('makeP137EFieldMeasuredWallWorkTest(verifiedP137EOriginal)');
  expect(loaderBranch).toContain('selectP137EScene67FocusedReview(gltf)');
  expect(loaderBranch).toContain('gltf.scenes?.[P137E_THREE_CORNER_MEASURED_SCENE_INDEX]');
  expect(loaderBranch).toContain('P137E_THREE_CORNER_MEASURED_REVIEW_ROOT');
  expect(loaderBranch).toContain("userData?.sourceCornerGapsClosed !== 3");
  expect(loaderBranch).toContain("P137E_THREE_CORNER_SOURCE_PATCHES");
  expect(loaderBranch).toContain('gltf.scene = combinedScene;');
  expect(loaderBranch).toContain('gltf.scene = measuredScene;');
  expect(loaderBranch).toContain('gltf.scene = exactSource.scene;');
  const stateStart = runtime.indexOf('const applyP137EMeasuredWallReviewState = () => {');
  const stateEnd = runtime.indexOf('const applyP137EScene67ReviewState = () => {', stateStart);
  const state = runtime.slice(stateStart, stateEnd);
  expect(state).toContain('isP137EThreeCornerMeasuredReviewRequested()');
  expect(state).toContain('p137eSourceCornerGapsClosed');
  expect(state).toContain('p137eSourceCornerPatchWidthMm');
  expect(state).toContain("p137eMeasuredWallLobbyGapMm: '1020'");
  expect(state).toContain("p137eCurrentClaim: 'false'");
  expect(state).toContain("p137eCanonical: 'false'");
  expect(state).toContain("p137eAsBuiltClaim: 'false'");
  expect(state).toContain("p137eHumanReview: 'NOT_RUN'");
  expect(runtime).toContain(
    "const p137eThreeCornerMeasuredVariant = 'd1f-three-source-corners-and-i03-20261013';",
  );
});

test('scene69 opt-in retains exact scene67 WORK_TEST one-link request without loading CURRENT', async ({ page }) => {
  test.setTimeout(45_000);
  const currentRequests: string[] = [];
  const reviewGlbRequests: string[] = [];
  const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
  await routeScene67SyntheticHttpsAssets(page);
  await page.route('**/private-model/model.glb', route => {
    currentRequests.push(route.request().url());
    return route.abort();
  });
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: 'P137E scene69 synthetic fixture', path: candidatePath }] }),
    }));
  await page.route('**' + candidatePath, route => {
    reviewGlbRequests.push(route.request().url());
    // Request-ordering test only: invalid bytes cannot establish any rendered geometry.
    return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'not-a-glb' });
  });
  await page.goto(SYNTHETIC_SCENE67_ORIGIN + '/private-model/?review=' + reviewId
    + '&wallMetric=d1f-three-source-corners-and-i03-20261013');
  await expect.poll(() => reviewGlbRequests.length, { timeout: 15_000 }).toBe(1);
  expect(currentRequests).toEqual([]);
  await expect(page.locator('#private-model-canvas')).not.toHaveAttribute('data-p137e-human-review', 'PASS');
});

test('exact Themo one-link review loads WORK_TEST directly without a redundant CURRENT GLB request', async ({ page }) => {
  test.setTimeout(45_000);
  const currentRequests: string[] = [];
  const reviewGlbRequests: string[] = [];
  const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
  await routeScene67SyntheticHttpsAssets(page);
  await page.route('**/private-model/model.glb', route => {
    currentRequests.push(route.request().url());
    return route.abort();
  });
  await page.route('**/private-model/work-test/catalog.json', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: 'P137E WORK_TEST fixture', path: candidatePath }] }),
    }));
  await page.route('**' + candidatePath, route => {
    reviewGlbRequests.push(route.request().url());
    // Deliberately invalid bytes: this test proves the *request ordering*,
    // not scene67 geometry, authenticated GLB identity or rendered pixels.
    return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'not-a-glb' });
  });

  await page.goto(SYNTHETIC_SCENE67_ORIGIN + '/private-model/?review=' + reviewId);
  await expect.poll(() => reviewGlbRequests.length, { timeout: 15_000 }).toBe(1);
  expect(currentRequests).toEqual([]);
  expect(reviewGlbRequests[0]).toContain(candidatePath);
  await expect(page.locator('#private-model-canvas')).not.toHaveAttribute('data-p137e-human-review', 'PASS');
});

test('other viewer routes retain the original CURRENT-first model loader', async ({ page }) => {
  const currentRequests: string[] = [];
  await page.route('**/private-model/model.glb', route => {
    currentRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('/private-model/');
  await expect.poll(() => currentRequests.length, { timeout: 15_000 }).toBe(1);
});
