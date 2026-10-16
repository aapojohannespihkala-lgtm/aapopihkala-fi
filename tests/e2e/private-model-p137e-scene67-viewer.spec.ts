import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
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
  const selected = 'const exactSource = selectP137EScene67FocusedReview(gltf);';
  const loading = "applyLoadedModel(gltf, 'work-test', `WORK_TEST: ${candidate.label}`";

  expect(runtime).toContain("const p137eScene67CandidateId = 'p137e-d1f-three-wall-mounted-themos';");
  expect(runtime).toContain('const p137eScene67ReviewId = `${p137eScene67CandidateId}-review`;');
  expect(runtime).toContain(predicate);
  expect(runtime).toContain("from '../../scripts/privateModelP137EScene67Selection'");
  expect(runtime).toContain(selected);
  expect(runtime).toContain('gltf.scene = exactSource.scene;');
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


test('p137e-walls-render mode is explicit main-only original GLB and real pixel guard', () => {
  const workflow = readFileSync(resolve(process.cwd(),
    '.github/workflows/private-model-production-review-smoke.yml'), 'utf8');
  const modeStart = workflow.indexOf('  verify-p137e-walls-render:\n');
  expect(modeStart).toBeGreaterThan(0);
  const onlyWalls = workflow.slice(modeStart);
  expect(workflow).toContain('          - p137e-walls-render\n');
  expect(onlyWalls).toContain("github.ref == 'refs/heads/main'");
  expect(onlyWalls).toContain("inputs.probe_mode == 'p137e-walls-render'");
  expect(onlyWalls).toContain("P137E_SCENE67_EXPECTED_GLB_SHA256 as expectedHash");
  expect(onlyWalls).toContain("P137E_SCENE67_EXPECTED_GLB_BYTES as expectedBytes");
  expect(onlyWalls).toContain("P137E_THREE_CORNER_MEASURED_SCENE_INDEX as sceneIndex");
  expect(onlyWalls).toContain('evidence.originalSourceAutoloadResponseVerified = true;');
  expect(onlyWalls).toContain('sourceResponses.length !== 1');
  expect(onlyWalls).toContain('p137eSourceCornerGapsClosed');
  expect(onlyWalls).toContain("p137eSourceCornerPatchWidthMm: '40'");
  expect(onlyWalls).toContain("p137eHumanReview: 'NOT_RUN'");
  expect(onlyWalls).toContain('pixels.nonBackgroundPixels < 1500');
  expect(onlyWalls).toContain('pixels.changedPixels < 750');
  expect(onlyWalls).toContain('threeIndividualCornerRenderedRoisVerified:false');
  expect(onlyWalls).not.toContain('pull_request:');
  expect(onlyWalls).not.toContain('publishToCURRENT:true');
  expect(onlyWalls).not.toContain('HUMAN_REVIEW: PASS');
});



const wallJobSource = () => readFileSync(resolve(process.cwd(),
  '.github/workflows/private-model-production-review-smoke.yml'), 'utf8')
  .split('  verify-p137e-walls-render:\n')[1];
const wallStageFunction = (name: string, endMarker: string) => {
  const source = wallJobSource().split('\n')
    .map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  // Execute the exact production driver's helper, rather than a test clone.
  return new Function('return (' + source.slice(start, end).trim() + ')')();
};

test('wall production deadline resolves its actual operation and propagates rejection', async () => {
  const deadline = wallStageFunction('withWallStageDeadline', '// END wall stage deadline helper.');
  await expect(deadline('SOURCE_GLB_BODY', () => Promise.resolve('actual-body'), 30))
    .resolves.toBe('actual-body');
  const originalFailure = new Error('synthetic operation rejected');
  await expect(deadline('SOURCE_GLB_BODY', () => Promise.reject(originalFailure), 30))
    .rejects.toBe(originalFailure);
});

test('wall production deadline rejects a hanging response body with a fixed safe code', async () => {
  const deadline = wallStageFunction('withWallStageDeadline', '// END wall stage deadline helper.');
  await expect(deadline('SOURCE_GLB_BODY', () => new Promise(() => {}), 15))
    .rejects.toMatchObject({ code: 'WALL_STAGE_TIMEOUT' });
  for (const invalid of [0, -1, NaN, Infinity, 45001]) {
    expect(() => deadline('SOURCE_GLB_BODY', () => Promise.resolve(), invalid)).toThrow();
  }
});

test('wall failure evidence redacts upstream text and cannot promote render or human review', () => {
  const sanitize = wallStageFunction('sanitizedWallStageFailure', '// END wall safe failure helper.');
  const secret = 'TEST_ONLY_SECRET_CANARY_DO_NOT_EXPORT';
  const failure = sanitize({ message: secret, stack: secret, headers: { cookie: secret },
    code: 'WALL_STAGE_TIMEOUT' }, 'SOURCE_GLB_BODY');
  expect(failure).toMatchObject({result:'FAIL',phase:'SOURCE_GLB_BODY',
    failureCode:'WALL_STAGE_DEADLINE_EXCEEDED',
    threeIndividualCornerRenderedRoisVerified:false,measuredWallIndividualRoiVerified:false,
    actualHumanVisualReview:false,humanReview:'NOT_RUN',current:false,asBuilt:false});
  expect(JSON.stringify(failure)).not.toContain(secret);
  expect(sanitize(new Error(secret), secret)).toMatchObject({
    phase:'PREFLIGHT',failureCode:'WALL_PROBE_REJECTED'});
});

test('wall actual driver writes safe success and failure evidence after bounded byte and pixel operations', () => {
  const actual = wallJobSource();
  expect(actual).toContain('node-version: 24.20.0');
  expect(actual).toContain("withWallStageDeadline('SOURCE_GLB_BODY',");
  expect(actual).toContain('() => assetResponse.body(), 25000');
  expect(actual).toContain("withWallStageDeadline('RGBA_EVALUATION',");
  expect(actual).toContain('sanitizedWallStageFailure(error, evidence.phase)');
  expect(actual).toContain('Object.assign(evidence, failure);\n            writeEvidence();');
  expect(actual).toContain('process.exitCode = 1;');
  expect(actual).not.toContain('console.error(error)');
  expect(actual).not.toContain('JSON.stringify(error)');
  expect(actual).toContain('pixels.nonBackgroundPixels < 1500');
  expect(actual).toContain('pixels.changedPixels < 750');
});

test('exact executable wall driver rejects HTTP, byte, pixel and identity failures without leaking upstream text', async () => {
  const job = wallJobSource();
  const actual = job.split("node --input-type=module <<'NODE'\n")[1]
    .split('          NODE')[0].split('\n').map(line => line.slice(10)).join('\n')
    .replace(/^import[\s\S]*?from '[^']+';\s*/gm, '');
  const bytes = Buffer.from('SYNTHETIC_TEST_ONLY_GLB_RESPONSE');
  const canary = 'SYNTHETIC_UPSTREAM_SECRET_TEXT';
  for (const kind of ['success', 'http', 'body', 'digest', 'pixels', 'identity'] as const) {
    let dataset: Record<string,string> = {};
    let responseCallback: ((value: any) => void) | undefined;
    let requestedUrl = '';
    let closed = false;
    const writes: string[] = [];
    const logs: string[] = [];
    const syntheticProcess: { env: Record<string,string>, exitCode?: number } = {
      env: {CF_ACCESS_VIEWER_PROBE_CLIENT_ID:'TEST_ONLY_ID',
        CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET:canary},
    };
    const page = {
      on: (_event: string, callback: (value: any) => void) => { responseCallback = callback; },
      goto: async (url: string) => {
        requestedUrl = url;
        responseCallback?.({
          url: () => 'https://aapopihkala.fi/private-model/work-test/' + candidateId + '.glb',
          status: () => 200,
          body: async () => {
            if (kind === 'body') throw new Error(canary);
            return kind === 'digest' ? Buffer.from('wrong-source') : bytes;
          },
        });
        return {status: () => kind === 'http' ? 403 : 200};
      },
      url: () => requestedUrl,
      waitForFunction: async (_fn: unknown, required: Record<string,string>) => {
        dataset = {...required};
      },
      locator: () => ({
        evaluate: async (fn: (element: any) => unknown) => fn({dataset:
          kind === 'identity' ? {...dataset,p137eCurrentClaim:'true'} : dataset}),
        boundingBox: async () => ({x:0,y:0,width:1536,height:900}),
      }),
      waitForTimeout: async () => {},
      screenshot: async () => Buffer.from('SYNTHETIC_TEST_ONLY_PNG_INPUT'),
      mouse: {move:async () => {},wheel:async () => {}},
      evaluate: async () => ({width:1536,height:900,
        nonBackgroundPixels:kind === 'pixels' ? 0 : 2000,changedPixels:1000}),
    };
    const context = {
      fs: {mkdirSync: () => {},readFileSync: () =>
        "const p137eThreeCornerMeasuredVariant = 'd1f-three-source-corners-and-i03-20261013';",
        writeFileSync: (_path: string, value: string) => writes.push(value)},
      createHash,Buffer,URL,setTimeout,clearTimeout,process:syntheticProcess,
      console:{log:(value: string) => logs.push(value),error:(value: string) => logs.push(value)},
      candidateId,reviewId,sceneIndex:69,expectedBytes:bytes.length,
      expectedHash:createHash('sha256').update(bytes).digest('hex'),
      originalAsset:'https://aapopihkala.fi/private-model/work-test/' + candidateId + '.glb',
      measured:{kphSideLength:960,wcSideVisible:710,thickness:205,lobbyClearGap:1020},
      chromium:{launch:async () => ({newContext:async () => ({route:async () => {},
        newPage:async () => page}),close:async () => {closed = true;}})},
    };
    // This is a synthetic driver invocation, never production render evidence.
    await runInNewContext('(async () => {' + actual + '\n})()', context);
    expect(closed).toBe(true);
    expect(writes).toHaveLength(1);
    const evidence = JSON.parse(writes[0]);
    expect(evidence.result).toBe(kind === 'success' ? 'PASS' : 'FAIL');
    expect(evidence.threeIndividualCornerRenderedRoisVerified).toBe(false);
    expect(evidence.measuredWallIndividualRoiVerified).toBe(false);
    expect(evidence.humanReview).toBe('NOT_RUN');
    expect(writes.join('\n') + logs.join('\n')).not.toContain(canary);
    if (kind === 'success') expect(syntheticProcess.exitCode).toBeUndefined();
    else expect(syntheticProcess.exitCode).toBe(1);
    if (kind === 'body' || kind === 'digest') expect(evidence.phase).toBe('SOURCE_GLB_BODY');
    if (kind === 'http') expect(evidence.phase).toBe('VIEWER_HTTP');
    if (kind === 'pixels') expect(evidence.phase).toBe('RGBA_EVALUATION');
    if (kind === 'identity') expect(evidence.phase).toBe('IDENTITY_READBACK');
  }
});


test('production probe checks exact P137E user one-link TOP before the original 3 housing proof', () => {
  const yaml=readFileSync(resolve(process.cwd(),
    '.github/workflows/private-model-production-review-smoke.yml'),'utf8');
  const prod=yaml.split('  verify-production:\n')[1]?.split('\n  verify-p137e-walls-render:')[0] || '';
  expect(prod).toContain("reviewId === 'p137e-d1f-three-wall-mounted-themos-review'");
  expect(prod).toContain("candidateId === 'p137e-d1f-three-wall-mounted-themos'");
  expect(prod).toContain("(exactD1fOneLink ? '&view=d1f-plan' : '')");
  expect(prod).toContain("finalUrl.searchParams.get('view') !== 'd1f-plan'");
  const auth=prod.indexOf('p137eScene67AssetEvidence = inspectP137EScene67PublishedGlb(');
  const initial=prod.indexOf('const initial = await canvas.evaluate');
  const pixels=prod.indexOf('const greenTop=await page.evaluate');
  const north=prod.indexOf("page.locator('#p137e-north-face-button').click()");
  const existing=prod.indexOf('const readFace = () => canvas.evaluate');
  expect(auth).toBeGreaterThan(0);
  expect(auth).toBeLessThan(initial);
  expect(initial).toBeLessThan(pixels);
  expect(pixels).toBeLessThan(north);
  expect(north).toBeLessThan(existing);
  expect(prod).toContain("initial.camera !== 'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP'");
  expect(prod).toContain("initial.tools !== 'true'");
  expect(prod).toContain("initial.wall !== '406'");
  expect(prod).toContain("initial.devices !== '3'");
  expect(prod).toContain("if (!greenTop?.passed)");
  expect(prod).toContain('individualThemoPixelsByThisInitialGate:false');
  expect(prod).toContain("nativeG2Readback:'NOT_RUN',humanReview:'NOT_RUN',publishToCURRENT:false");
  expect(prod).toContain('p137eScene67TwoFaceEvidence');
  expect(prod).toContain('p137e-scene67-three-housing-rgba.json');
  expect(prod).toContain('P137E MITTAA fourth click reset disturbed three crosses');
});
