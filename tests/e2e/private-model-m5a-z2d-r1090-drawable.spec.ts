import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { THREE } from '../../src/scripts/threeRuntime';
import {
  m5aZ2ExpectedTargetKeys,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import { getUndrawableM5AZ2TargetKeys } from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';

type TargetOptions = {
  pass?: string;
  routeKind?: 'referenceRouteWork' | 'pipeDiameterPresentationWork';
};

const makeTarget = (key: string, options: TargetOptions = {}) => {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.32, 0.22),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  const boundary = key.startsWith('boundary:');
  const well = key.startsWith('G2_DRAIN_WELL_');
  const route = !boundary && !well;
  object.userData = {
    Pass: options.pass ?? 'M5A-Z2',
    representationKind: boundary
      ? 'unresolvedBoundaryMarker'
      : well ? 'wellMarkerWork' : options.routeKind ?? 'referenceRouteWork',
    Canonical: false,
    presentationOnly: true,
    workAssumption: true,
    sourceDerivedTopology: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalElevationClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
    absoluteZContract: 'G2_R896',
    ...(well
      ? {
          physicalWellGeometryClaim: false,
          absoluteZBasis: 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE',
        }
      : {}),
    ...(route
      ? {
          physicalRouteClaim: false,
          exactSlopeClaim: false,
          absoluteZBasis: 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE',
        }
      : {}),
    ...(boundary
      ? {
          boundaryRole: key.slice('boundary:'.length),
          boundaryStatus: 'UNRESOLVED_BOUNDARY',
          physicalRouteClaim: false,
          externalNetworkConnectionClaim: false,
        }
      : { G2IdCandidate: key }),
  };
  return object;
};

const makeScene = (options: TargetOptions = {}) => {
  const scene = new THREE.Group();
  for (const key of m5aZ2ExpectedTargetKeys) scene.add(makeTarget(key, options));
  return scene;
};

test('R1090 accepts all thirteen source-keyed targets only when they have drawable material and world geometry', () => {
  const scene = makeScene();
  expect(scene.children).toHaveLength(13);
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual([]);
});

test('R1090 accepts successor pass tokens and pipe presentation routes in the review presentation guard', () => {
  const scene = makeScene({
    pass: 'M5A-Z2D-R1036',
    routeKind: 'pipeDiameterPresentationWork',
  });
  const presentation = prepareM5AZ2SystemReviewPresentation(scene);
  expect(presentation.targetRenderableCount).toBe(13);
  expect(presentation.missingTargetKeys).toEqual([]);
  expect(presentation.duplicateTargetKeys).toEqual([]);
  expect(presentation.semanticViolationCount).toBe(0);
  expect(presentation.kindCounts).toEqual({
    wellMarkerWork: 4,
    referenceRouteWork: 7,
    unresolvedBoundaryMarker: 2,
  });
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual([]);
});

test('R1090 refuses a well with no triangle draw range while retaining the other 12', () => {
  const scene = makeScene();
  (scene.children[0] as THREE.Mesh).geometry.setDrawRange(0, 0);
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual(['G2_DRAIN_WELL_SOK1_001']);
});

test('R1090 refuses a non-finite route and an empty unresolved-boundary mesh', () => {
  const scene = makeScene();
  scene.children[4].position.set(Number.NaN, 0, 0);
  (scene.children[12] as THREE.Mesh).geometry.deleteAttribute('position');
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual([
    'G2_DRAIN_LINK_PVK_SOK1_001',
    'boundary:PVK_PARKING',
  ]);
});

test('R1090 rejects hidden or unpainted candidates instead of trusting their source IDs', () => {
  const scene = makeScene();
  scene.children[1].visible = false;
  ((scene.children[5] as THREE.Mesh).material as THREE.Material).visible = false;
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual([
    'G2_DRAIN_WELL_SOK2_001',
    'G2_DRAIN_LINK_PVK_SOK3_001',
  ]);
});

test('R1090 viewer ready state checks drawable target keys before ready is set', () => {
  const runtime = readFileSync(
    resolve(process.cwd(), 'src/pages/private-model/index.astro'),
    'utf8',
  );
  const from = runtime.indexOf("const applyM5aDrainageReviewState =");
  const to = runtime.indexOf("const applyP186fReviewState =", from);
  expect(from).toBeGreaterThan(0);
  expect(to).toBeGreaterThan(from);
  const review = runtime.slice(from, to);
  expect(review).toContain('getUndrawableM5AZ2TargetKeys(fullModelScene)');
  expect(review.indexOf('undrawableTargetKeys.length !== 0')).toBeLessThan(
    review.indexOf("const m5aZ2ReviewState = 'ready'"),
  );
  expect(review).toContain("m5aHumanReview: 'NOT_RUN'");
  expect(review).toContain("m5aPublishToCurrent: 'false'");
});
