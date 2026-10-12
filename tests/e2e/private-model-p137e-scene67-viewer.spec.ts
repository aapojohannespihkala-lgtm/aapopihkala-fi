import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
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
