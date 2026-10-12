import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import {
  m5bCurrentVerticalDownspoutProxyIds,
  prepareM5BReviewPresentation,
} from '../../src/scripts/privateModelM5BReviewPresentation';
import {
  m5bCandidateId,
  m5bCurrentReviewId,
} from '../../src/scripts/privateModelWorkTest';
import { deriveM5BScene60SourceRegions as derive } from
  '../../src/scripts/privateModelM5BScene60SourceRegions';

// Real THREE scene/camera projections on synthetic building geometry.
// No authenticated source GLB, actual production renderer or 5/5 pixel proof.
const fixture = () => {
  const sceneRoot = new THREE.Group();
  sceneRoot.name = 'M5B current scene60 review context';
  sceneRoot.userData = {
    WORK_TEST_ONLY: true,
    Canonical: false,
    publishToCURRENT: false,
    HUMAN_REVIEW: 'NOT_RUN',
  };
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(10, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0xcccccc }),
  );
  building.name = 'M5B_BUILDING_WALL_CONTEXT';
  building.position.set(0, 2, 0);
  building.userData = { role: 'building-wall-context' };
  sceneRoot.add(building);
  const presentation = prepareM5BReviewPresentation(sceneRoot, 'CURRENT');
  expect(presentation.verticalDownspoutProxyCount).toBe(5);
  expect(presentation.semanticViolationCount).toBe(0);

  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 120);
  camera.position.set(19, 16, 28);
  camera.lookAt(0, 2, 0);
  camera.updateProjectionMatrix();
  return {
    sceneRoot, camera,
    sceneIndex: 60, candidateId: m5bCandidateId,
    reviewId: m5bCurrentReviewId, imageWidth: 1920, imageHeight: 1080,
  };
};
const findProxy = (f: ReturnType<typeof fixture>, index: number) =>
  f.sceneRoot.children.find(
    object => object.name === m5bCurrentVerticalDownspoutProxyIds[index],
  ) as THREE.Mesh;

test('real THREE camera derives five unique regions in original scene60 proxy order', () => {
  const f = fixture();
  const result = derive(f);
  expect(result.projectedTargets.map(x => x.logicalProxyId))
    .toEqual([...m5bCurrentVerticalDownspoutProxyIds]);
  expect(result.sourceProxyCount).toBe(5);
  expect(result.sourceOnly).toBe(true);
  expect(result.originalGlbAuthenticated).toBe(false);
  expect(result.productionScreenshotVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
  for (const region of result.projectedTargets) {
    expect(region.radius).toBeGreaterThanOrEqual(5);
    expect(region.x).toBeGreaterThan(region.radius);
    expect(region.y).toBeGreaterThan(region.radius);
  }
  expect(new Set(result.projectedTargets.map(x => x.x + ':' + x.y)).size).toBe(5);
});

test('source camera region centers change with actual THREE mesh geometry, not hardcoded pixels', () => {
  const f = fixture();
  const before = derive(f);
  findProxy(f, 4).position.x += 0.5;
  const after = derive(f);
  expect(after.projectedTargets[4].x).not.toBe(before.projectedTargets[4].x);
  for (let i = 0; i < 4; i++) {
    expect(after.projectedTargets[i]).toEqual(before.projectedTargets[i]);
  }
});

test('same scene with changed actual camera produces new camera identity and projected pixels', () => {
  const f = fixture();
  const a = derive(f);
  f.camera.position.x += 3;
  f.camera.lookAt(0, 2, 0);
  const b = derive(f);
  expect(b.cameraKey).not.toBe(a.cameraKey);
  expect(b.projectedTargets.map(x => x.x)).not.toEqual(a.projectedTargets.map(x => x));
});

test('missing or duplicated original proxy IDs fail closed', () => {
  const missing = fixture();
  missing.sceneRoot.remove(findProxy(missing, 4));
  expect(() => derive(missing)).toThrow(/missing one or more/);
  const duplicate = fixture();
  duplicate.sceneRoot.add(findProxy(duplicate, 0).clone());
  expect(() => derive(duplicate)).toThrow(/duplicate exact/);
});

test('hidden, replaced, wrong-material or physically promoted 3D proxy fails closed', () => {
  const hidden = fixture();
  findProxy(hidden, 1).visible = false;
  expect(() => derive(hidden)).toThrow(/unsafe|hidden/);
  const fake = fixture();
  findProxy(fake, 2).geometry = new THREE.BoxGeometry(0.16, 2, 0.16);
  expect(() => derive(fake)).toThrow(/unsafe/);
  const goneBlue = fixture();
  const mat = findProxy(goneBlue, 0).material as THREE.Material;
  mat.opacity = 0;
  expect(() => derive(goneBlue)).toThrow(/unsafe/);
  const promotion = fixture();
  findProxy(promotion, 4).userData.publishToCURRENT = true;
  expect(() => derive(promotion)).toThrow(/unsafe/);
  const mainPromoted = fixture();
  mainPromoted.sceneRoot.userData.Canonical = true;
  expect(() => derive(mainPromoted)).toThrow(/unsafe source scene root/);
});

test('wrong review, invalid screenshot size or camera aspect cannot borrow the regions', () => {
  const wrong = fixture();
  wrong.sceneIndex = 63;
  expect(() => derive(wrong)).toThrow(/wrong original/);
  const id = fixture();
  id.reviewId = 'm5b-planned-other-review';
  expect(() => derive(id)).toThrow(/wrong original/);
  const aspect = fixture();
  aspect.camera.aspect = 1;
  expect(() => derive(aspect)).toThrow(/aspect/);
  const small = fixture();
  small.imageHeight = 110;
  expect(() => derive(small)).toThrow(/size/);
});

test('behind-camera, clipped camera and two overlapped proxy regions fail closed', () => {
  const behind = fixture();
  behind.camera.position.set(0, 2, 0);
  behind.camera.lookAt(0, 2, -80);
  expect(() => derive(behind)).toThrow(/camera|clipped|behind/);
  const clipped = fixture();
  findProxy(clipped, 0).position.x += 200;
  expect(() => derive(clipped)).toThrow(/clipped/);
  const overlap = fixture();
  findProxy(overlap, 4).position.copy(findProxy(overlap, 0).position);
  expect(() => derive(overlap)).toThrow(/overlap/);
});
