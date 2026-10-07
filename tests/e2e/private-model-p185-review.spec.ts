import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  getRequestedReviewCandidateId,
  p184hApplianceOnP185cReviewId,
  p185cCandidateId,
  p185cReviewId,
  p185cX2CandidateId,
  p185cX2ReviewId,
} from '../../src/scripts/privateModelWorkTest';
import {
  p185ReviewSourceOverlayScreenLineAidName,
  p185ReviewTargetOpacity,
  prepareP185X2ReviewPresentation,
} from '../../src/scripts/privateModelP185ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

test('P185C persisted overlay stays registered but its orientation-invalid position review alias is blocked', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(registry.candidates[p185cCandidateId]).toEqual({
    driveFileId: '1_w5gLNffz7DaAlZt_IcvQNV8TYKzdIn1',
  });
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBeNull();
  expect(getRequestedReviewCandidateId(`?review=${p184hApplianceOnP185cReviewId}`)).toBe(
    p185cCandidateId,
  );
});

test('P185C review identifier remains reserved for the invalidated historical route', () => {
  expect(p185cCandidateId).toBe('p185c-d2015-electrical-source-overlay');
  expect(p185cReviewId).toBe('p185c-d2015-electrical-source-overlay-review');
});


test('P185C-X2 corrected overlay owns a distinct review route while historical P185C stays blocked', () => {
  const registry = JSON.parse(readFileSync('.github/work-test-candidates.json', 'utf8'));
  expect(p185cX2CandidateId).toBe('p185c-x2-d2015-electrical-source-overlay-p28-corrected');
  expect(p185cX2ReviewId).toBe('p185c-x2-d2015-electrical-source-overlay-p28-corrected-review');
  expect(registry.candidates[p185cX2CandidateId]).toEqual({
    driveFileId: '1EQSaRlpgvUFGEWG9fmTiKwFuKwrUlyA6',
  });
  expect(getRequestedReviewCandidateId(`?review=${p185cX2ReviewId}`)).toBe(p185cX2CandidateId);
  expect(getRequestedReviewCandidateId(`?review=${p185cReviewId}`)).toBeNull();
});


test('P185C-X2 review focuses the plan camera on exact electrical target bounds', () => {
  const viewerSource = readFileSync('src/pages/private-model/index.astro', 'utf8');

  expect(viewerSource).toContain('let activePlanFocusBounds: any = null;');
  expect(viewerSource).toContain(
    'const box = activePlanFocusBounds ?? computeVisibleBounds(dInteriorScene, true);',
  );

  const x2StateStart = viewerSource.indexOf('const applyP185cX2ReviewState = () => {');
  const x2StateEnd = viewerSource.indexOf('const applyP186bReviewState = () => {', x2StateStart);
  expect(x2StateStart).toBeGreaterThan(-1);
  expect(x2StateEnd).toBeGreaterThan(x2StateStart);

  const x2State = viewerSource.slice(x2StateStart, x2StateEnd);
  expect(x2State).toContain('activePlanFocusBounds = presentation.targetBounds.clone();');
  expect(x2State).toContain('fitPlanCamera();');
  expect(x2State).toContain(
    "p185ReviewCameraMode: 'ORTHOGRAPHIC_D_1F_TARGET_BOUNDS_FOCUS'",
  );
  expect(x2State).toContain("p185ReviewCameraFocusApplied: 'true'");
});


test('P185C-X2 review presentation keeps high-contrast target materials', () => {
  const presentationSource = readFileSync(
    new URL('../../src/scripts/privateModelP185ReviewPresentation.ts', import.meta.url),
    'utf8',
  );

  expect(presentationSource).toContain('p185ReviewSourceOverlayColorHex = 0x7dd3fc');
  expect(presentationSource).toContain('p185ReviewPanelMarkerColorHex = 0xfacc15');
  expect(presentationSource).toContain('clone.depthTest = false');
  expect(presentationSource).toContain('clone.depthWrite = false');
  expect(presentationSource).toContain('clone.toneMapped = false');
  expect(presentationSource).toContain("electricalPanelSourceLabelAnchorMarker");
});


test('P185C-X2 derives one-pixel-safe source centerlines from indexed strip quads', () => {
  const scene = new THREE.Group();

  const positions = new Float32Array([
    0.0, 0.0, 0.018,
    0.012, 0.0, 0.018,
    0.012, 0.08, 0.018,
    0.0, 0.08, 0.018,
    0.20, 0.10, 0.018,
    0.212, 0.10, 0.018,
    0.212, 0.18, 0.018,
    0.20, 0.18, 0.018,
  ]);
  const overlayGeometry = new THREE.BufferGeometry();
  overlayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  overlayGeometry.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);

  const overlay = new THREE.Mesh(
    overlayGeometry,
    new THREE.MeshBasicMaterial({ color: 0xf05c19, transparent: true, opacity: 0.78 }),
  );
  overlay.userData = {
    Pass: 'P185C-X2',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'sourceVectorPlanOverlay',
    sourcePdfDriveId: '1vAyvAHdClqkXKIVNgKKUyOjMja-tzrok',
    sourceFragmentCount: 366,
    floorHeatingCableGeometryClaim: false,
    closedHeatingZoneClaim: false,
    Canonical: false,
    exactXYClaim: false,
    exactZClaim: false,
    physicalCableRouteClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  };

  const rk = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x2255ee }),
  );
  rk.userData = {
    Pass: 'P185C-X2',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'electricalPanelSourceLabelAnchorMarker',
    sourcePdfDriveId: '1dzzZsa9FCiyqmv8WholhLxba6Kxobspg',
    sourceText: 'RYHMäKESKUS RK',
    electricalPanelGeometryClaim: false,
    Canonical: false,
    exactXYClaim: false,
    exactZClaim: false,
    physicalCableRouteClaim: false,
    current: false,
    asBuilt: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  };

  scene.add(overlay, rk);
  const presentation = prepareP185X2ReviewPresentation(scene);

  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.targetRenderableCount).toBe(2);
  expect(presentation.sourceOverlayScreenLineAidCount).toBe(1);
  expect(presentation.sourceOverlayScreenLineCount).toBe(2);

  const aid = overlay.children.find(
    (child) => child.name === p185ReviewSourceOverlayScreenLineAidName,
  ) as any;
  expect(aid).toBeTruthy();
  expect(aid.isLineSegments).toBe(true);
  expect(aid.geometry.getAttribute('position').count).toBe(4);
  expect(aid.material.opacity).toBe(p185ReviewTargetOpacity);
  expect(aid.material.depthTest).toBe(false);
  expect(aid.material.depthWrite).toBe(false);
  expect(aid.userData.p185ReviewRole).toBe('QUESTION_TARGET_80_SCREEN_LINE_AID');

  const first = new THREE.Vector3().fromBufferAttribute(aid.geometry.getAttribute('position'), 0);
  const second = new THREE.Vector3().fromBufferAttribute(aid.geometry.getAttribute('position'), 1);
  expect(first.x).toBeCloseTo(0.006, 6);
  expect(second.x).toBeCloseTo(0.006, 6);
  expect(first.y).toBeCloseTo(0.0, 6);
  expect(second.y).toBeCloseTo(0.08, 6);

  const repeated = prepareP185X2ReviewPresentation(scene);
  expect(repeated.sourceOverlayScreenLineAidCount).toBe(1);
  expect(
    overlay.children.filter((child) => child.name === p185ReviewSourceOverlayScreenLineAidName),
  ).toHaveLength(1);
});
