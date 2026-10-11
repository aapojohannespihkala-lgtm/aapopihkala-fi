import { test, expect } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
// @ts-ignore - new standalone ESM implementation is verified by these browser regressions
import { deriveM5AR1125SourceCameraCenters as derive } from
  '../../src/scripts/privateModelM5AR1125SourceCameraCenters.mjs';
// @ts-ignore - published R1125 pixel detector is ESM without a TS declaration
import { m5aR1125SourcePixelKinds } from
  '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys = Object.keys(m5aR1125SourcePixelKinds);
const size = { imageWidth: 1200, imageHeight: 800 };

const fixture = () => {
  const sceneRoot = new THREE.Group();
  sceneRoot.name = 'M5A R1125 exact scene63 source-only';
  sceneRoot.userData = {
    sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown:
      '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
  };
  const camera = new THREE.PerspectiveCamera(50, 1200 / 800, 0.1, 100);
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const targets = new Map<string, THREE.Object3D>();
  keys.forEach((key, i) => {
    const kind = m5aR1125SourcePixelKinds[key] as string;
    const geometry = kind === 'wellGray'
      ? new THREE.BoxGeometry(0.35, 0.35, 0.35)
      : new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.2, 0, 0),
          new THREE.Vector3(0.2, 0, 0),
        ]);
    const material = kind === 'wellGray'
      ? new THREE.MeshBasicMaterial({ color: 0xaab0b7 })
      : new THREE.LineBasicMaterial({ color: 0x00aacc });
    const object = kind === 'wellGray'
      ? new THREE.Mesh(geometry, material)
      : new THREE.LineSegments(geometry, material);
    object.name = 'R1125_SOURCE_' + i;
    object.position.set(-3 + (i % 5) * 1.5, 1.5 - Math.floor(i / 5) * 1.5, 0);
    object.userData = {
      Pass: 'M5A-Z2D-R1036',
      representationKind: kind === 'wellGray'
        ? 'wellMarkerWork'
        : kind === 'routeCyan'
          ? 'referenceRouteWork' : 'unresolvedBoundaryMarker',
      ...(kind === 'boundaryYellow'
        ? { boundaryRole: key.replace('boundary:', ''),
            boundaryStatus: 'UNRESOLVED_BOUNDARY' }
        : { G2IdCandidate: key }),
      Canonical: false,
      presentationOnly: true,
      workAssumption: true,
      exactXYClaim: false,
      exactZClaim: false,
      currentGeometryClaim: false,
      asBuiltClaim: false,
      publishToCURRENT: false,
    };
    sceneRoot.add(object);
    targets.set(key, object);
  });
  return { sceneRoot, camera, targets, ...size, sceneIndex: 63, THREE };
};

test('R1125 source metadata binds exact 13 projected IDs and order', () => {
  const data = fixture();
  const result = derive(data);
  expect(result.sourceSceneIndex).toBe(63);
  expect(result.sourceTargetCount).toBe(13);
  expect(result.centers.map((p: { key: string }) => p.key)).toEqual(keys);
  expect(result.centers.every((p: { u: number; v: number }) =>
    p.u > 0 && p.u < 1 && p.v > 0 && p.v < 1)).toBe(true);
  expect(result.originalGlbDigestAuthenticated).toBe(false);
  expect(result.productionScreenshotVerified).toBe(false);
  expect(result.humanReview).toBe('NOT_RUN');
});

test('R1125 camera NDC moves with an actual source primitive', () => {
  const input = fixture();
  const before = derive(input);
  const first = input.targets.get(keys[0]!)!;
  first.position.x += 0.4;
  const after = derive(input);
  expect(after.centers[0].u).toBeGreaterThan(before.centers[0].u);
  expect(after.centers[0].v).toBeCloseTo(before.centers[0].v, 4);
  expect(after.centers[1]).toEqual(before.centers[1]);
});

test('R1125 absent, duplicate or foreign source target fails closed', () => {
  const missing = fixture();
  missing.sceneRoot.remove(missing.targets.get(keys[3]!)!);
  expect(() => derive(missing)).toThrow(/missing exact source targets/);

  const dup = fixture();
  dup.sceneRoot.add(dup.targets.get(keys[0]!)!.clone());
  expect(() => derive(dup)).toThrow(/duplicate source target/);

  const bad = fixture();
  bad.targets.get(keys[0]!)!.userData.G2IdCandidate = 'FOREIGN_ID';
  expect(() => derive(bad)).toThrow(/missing exact source targets/);
});

test('R1125 wrong source scene, source role or promotion flags fail closed', () => {
  const wrongScene = fixture();
  expect(() => derive({ ...wrongScene, sceneIndex: 64 })).toThrow(/scene63/);

  const wrongContract = fixture();
  wrongContract.sceneRoot.userData.sourceDiameterCorrectionContract = 'G2_R1115';
  expect(() => derive(wrongContract)).toThrow(/contract mismatch/);

  const wrongKind = fixture();
  wrongKind.targets.get(keys[2]!)!.userData.representationKind =
    'pipeDiameterPresentationWork';
  expect(() => derive(wrongKind)).toThrow(/source kind mismatch/);

  const promoted = fixture();
  promoted.targets.get(keys[2]!)!.userData.publishToCURRENT = true;
  expect(() => derive(promoted)).toThrow(/unsafe source primitive/);
});

test('R1125 hidden and transparent target pixels cannot be treated as visible', () => {
  const hidden = fixture();
  hidden.targets.get(keys[7]!)!.visible = false;
  expect(() => derive(hidden)).toThrow(/invisible or unsafe/);

  const transparent = fixture();
  const material = transparent.targets.get(keys[5]!)!.material as THREE.Material;
  material.opacity = 0;
  expect(() => derive(transparent)).toThrow(/invisible or unsafe/);
});

test('R1125 behind-camera, out-of-frame and wrong screenshot aspect fail', () => {
  const behind = fixture();
  behind.targets.get(keys[0]!)!.position.z = 100;
  expect(() => derive(behind)).toThrow(/behind camera/);

  const out = fixture();
  out.targets.get(keys[0]!)!.position.x = 100;
  expect(() => derive(out)).toThrow(/outside viewport/);

  const aspect = fixture();
  aspect.camera.aspect = 2.0;
  expect(() => derive(aspect)).toThrow(/aspect mismatch/);
});

test('R1125 one source-color patch cannot count for two nearby source IDs', () => {
  const overlap = fixture();
  overlap.targets.get(keys[1]!)!.position.copy(
    overlap.targets.get(keys[0]!)!.position,
  );
  expect(() => derive(overlap)).toThrow(/ambiguous same-palette/);
});

test('R1125 unresolved boundaries require original line and UNRESOLVED flag', () => {
  const boundary = fixture();
  boundary.targets.get('boundary:PVK_DISCHARGE')!.userData.boundaryStatus = 'RESOLVED';
  expect(() => derive(boundary)).toThrow(/source kind mismatch/);

  const noLine = fixture();
  const old = noLine.targets.get('boundary:PVK_PARKING')!;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xffff00 }),
  );
  mesh.userData = { ...old.userData };
  mesh.position.copy(old.position);
  noLine.sceneRoot.remove(old);
  noLine.sceneRoot.add(mesh);
  expect(() => derive(noLine)).toThrow(/source kind mismatch/);
});
