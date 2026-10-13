import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
// @ts-ignore -- standalone source-bound M5A JS camera solver
import { chooseM5AR1125SeparatedCameraFraming } from '../../src/scripts/privateModelM5AR1125CameraDistanceRoiSeparation.mjs';
// @ts-ignore -- existing immutable source target palette contract
import { m5aR1125SourcePixelKinds } from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// Synthetic geometry verifies a camera-choice precondition ONLY. It is not
// authenticated original GLB, a real screenshot, or HUMAN_REVIEW evidence.
const width = 1000, height = 700;
const keys = Object.keys(m5aR1125SourcePixelKinds) as Array<keyof typeof m5aR1125SourcePixelKinds>;
const makeScene = () => {
  const root = new THREE.Group();
  root.userData = {
    sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown: '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    // The source-camera guard now checks root provenance as strictly as children.
    // This is synthetic WORK_TEST data, not an original GLB approval.
    Canonical: false, presentationOnly: true, workAssumption: true,
    humanReview: 'NOT_RUN',
    currentGeometryClaim: false, asBuiltClaim: false, publishToCURRENT: false,
  };
  for (let i = 0; i < keys.length; i++) {
    const kind = m5aR1125SourcePixelKinds[keys[i]];
    const object = kind === 'wellGray'
      ? new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.6, 0.6),
          new THREE.MeshBasicMaterial({ color: 0x999999 }),
        )
      : new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(0.2, 0, 0),
          ]),
          new THREE.LineBasicMaterial({ color: 0x00bbdd }),
        );
    object.name = 'SYNTHETIC_TEST_ONLY_' + i;
    object.position.set((i % 5 - 2) * 8, 0, (Math.floor(i / 5) - 1) * 12);
    object.userData = {
      Pass: 'M5A-Z2D-R1090',
      ...(kind === 'boundaryYellow'
        ? { representationKind: 'unresolvedBoundaryMarker',
            boundaryRole: keys[i].slice('boundary:'.length),
            boundaryStatus: 'UNRESOLVED_BOUNDARY' }
        : { G2IdCandidate: keys[i], representationKind: kind === 'wellGray'
            ? 'wellDiameterPresentationWork' : 'pipeDiameterPresentationWork' }),
      Canonical: false, presentationOnly: true, workAssumption: true,
      exactXYClaim: false, exactZClaim: false,
      currentGeometryClaim: false, asBuiltClaim: false, publishToCURRENT: false,
    };
    root.add(object);
  }
  return root;
};
const cameraTrial = (distanceLocalUnits: number, fov = 38) => {
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 1000);
  camera.position.set(0, 35, distanceLocalUnits);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { id: 'camera-' + distanceLocalUnits, distanceLocalUnits, camera };
};
const choose = (sceneRoot: THREE.Group, candidates: ReturnType<typeof cameraTrial>[],
  extra: Record<string, unknown> = {}) =>
  chooseM5AR1125SeparatedCameraFraming({
    sceneRoot, THREE, sceneIndex: 63, imageWidth: width, imageHeight: height,
    candidates, ...extra,
  });

test('R1125 searches real source-scene projected centers and selects nearest safe 13/13 view', () => {
  const proof = choose(makeScene(), [
    cameraTrial(25, 5), // closer but must clip source targets
    cameraTrial(75, 38),
    cameraTrial(150, 38),
  ]);
  expect(proof.chosenCameraId).toBe('camera-75');
  expect(proof.sourceTargetCount).toBe(13);
  expect(proof.sourceCameraProjection.centers.map((p: { key: string }) => p.key))
    .toEqual(keys);
  expect(proof.attempts[0].status).toBe('REJECTED_SOURCE_PROJECTION');
  expect(proof.attempts[1].status).toBe('SOURCE_ROI_CLEARANCE_READY');
  expect(proof.nearestSamePalettePx).toBeGreaterThan(proof.requiredPaletteSeparationPx);
  expect(proof.minimumViewportMarginPx).toBeGreaterThan(proof.requiredViewportMarginPx);
  expect(proof.originalGlbDigestAuthenticated).toBe(false);
  expect(proof.productionScreenshotVerified).toBe(false);
  expect(proof.humanReview).toBe('NOT_RUN');
});

test('R1125 cannot present an accepted camera if every true source projection is clipped', () => {
  expect(() => choose(makeScene(), [cameraTrial(25, 5), cameraTrial(75, 5)]))
    .toThrow('no source-verified 13/13');
});

test('R1125 rejects missing, duplicate and unsafe original source object identities', () => {
  const missing = makeScene();
  missing.remove(missing.children[0]);
  expect(() => choose(missing, [cameraTrial(75)])).toThrow('no source-verified 13/13');

  const duplicate = makeScene();
  const copy = (duplicate.children[0] as THREE.Mesh).clone();
  duplicate.add(copy);
  expect(() => choose(duplicate, [cameraTrial(75)])).toThrow('no source-verified 13/13');

  const promoted = makeScene();
  promoted.children[0].userData.currentGeometryClaim = true;
  expect(() => choose(promoted, [cameraTrial(75)])).toThrow('no source-verified 13/13');
});

test('R1125 fails closed on unsorted distances and viewport/source contract mismatch', () => {
  const scene = makeScene();
  expect(() => choose(scene, [cameraTrial(75), cameraTrial(25)])).toThrow('strictly increasing');
  expect(() => choose(scene, [cameraTrial(75)], { sceneIndex: 64 })).toThrow('scene63');
  expect(() => choose(scene, [cameraTrial(75)], { imageWidth: 1 })).toThrow('bounded');
  const wrongSource = makeScene();
  wrongSource.userData.sourceDiameterCorrectionContract = 'UNVERIFIED';
  expect(() => choose(wrongSource, [cameraTrial(75)])).toThrow('no source-verified 13/13');
});

test('R1125 does not accept screenshot ROI margins that cross the canvas border', () => {
  const scene = makeScene();
  expect(() => choose(scene, [cameraTrial(75, 18)], { edgePaddingPx: 64 }))
    .toThrow('no source-verified 13/13');
});

test('R1125 validates every camera before returning an earlier safe projection', () => {
  const scene = makeScene();
  const firstSafe = cameraTrial(75);
  // Earlier implementation returned the first passing source ROI and silently
  // missed an unsorted, duplicate or unusable later candidate.
  expect(() => choose(scene, [firstSafe, cameraTrial(25)])).toThrow('strictly increasing');
  expect(() => choose(scene, [
    firstSafe, { ...cameraTrial(150), id: firstSafe.id },
  ])).toThrow('unique IDs');
  expect(() => choose(scene, [
    firstSafe, { ...cameraTrial(150), distanceLocalUnits: Number.NaN },
  ])).toThrow('finite perspective distances');
  expect(() => choose(scene, [
    firstSafe, { ...cameraTrial(150), camera: { isPerspectiveCamera: false } as unknown as THREE.PerspectiveCamera },
  ])).toThrow('finite perspective distances');
});
