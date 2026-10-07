import { expect, test } from '@playwright/test';

import {
  m5aZ2AbsoluteZBasis,
  m5aZ2AbsoluteZContract,
  m5aZ2ExpectedTargetKeys,
  m5aZ2ReviewContextOpacity,
  m5aZ2ReviewTargetOpacity,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import { THREE } from '../../src/scripts/threeRuntime';

const common = {
  Pass: 'M5A-Z2',
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
  absoluteZContract: m5aZ2AbsoluteZContract,
};

const makeTarget = (key: string, index: number) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(index, 0, -2);
  const boundary = key.startsWith('boundary:');
  const well = key.startsWith('G2_DRAIN_WELL_');
  mesh.userData = boundary
    ? {
        ...common,
        representationKind: 'unresolvedBoundaryMarker',
        boundaryStatus: 'UNRESOLVED_BOUNDARY',
        boundaryRole: key.slice('boundary:'.length),
        physicalRouteClaim: false,
        externalNetworkConnectionClaim: false,
      }
    : {
        ...common,
        G2IdCandidate: key,
        representationKind: well ? 'wellMarkerWork' : 'referenceRouteWork',
        physicalWellGeometryClaim: well ? false : undefined,
        physicalRouteClaim: well ? undefined : false,
        exactSlopeClaim: well ? undefined : false,
        absoluteZBasis: m5aZ2AbsoluteZBasis,
      };
  return mesh;
};

test('M5A-Z2 review helper keeps exact 4+7+2 coverage and 80/20 no-promotion state', () => {
  const scene = new THREE.Group();
  const targets = m5aZ2ExpectedTargetKeys.map(makeTarget);
  scene.add(...targets);
  const context = new THREE.Mesh(
    new THREE.BoxGeometry(20, 5, 10),
    new THREE.MeshBasicMaterial(),
  );
  scene.add(context);

  const result = prepareM5AZ2SystemReviewPresentation(scene);

  expect(result.targetRenderableCount).toBe(13);
  expect(result.missingTargetKeys).toEqual([]);
  expect(result.duplicateTargetKeys).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.kindCounts).toEqual({
    wellMarkerWork: 4,
    referenceRouteWork: 7,
    unresolvedBoundaryMarker: 2,
  });
  expect(result.contextRenderableCount).toBe(1);
  expect(result.targetBounds).not.toBeNull();
  expect(result.reviewCamera).toMatchObject({
    coordinateFrame: 'YLIS-G1-LOCAL',
    projection: 'PERSPECTIVE',
    controls: 'FREE_ORBIT',
  });
  expect(result.sourceClassification).toContain('NOT_EXACT_Z');
  expect(result.sourceClassification).toContain('NOT_AS_BUILT');

  for (const target of targets) {
    expect((target.material as THREE.Material & { opacity: number }).opacity).toBe(
      m5aZ2ReviewTargetOpacity,
    );
  }
  expect((context.material as THREE.Material & { opacity: number }).opacity).toBe(
    m5aZ2ReviewContextOpacity,
  );
});

test('M5A-Z2 review helper rejects a promotion-like target', () => {
  const scene = new THREE.Group();
  const targets = m5aZ2ExpectedTargetKeys.map(makeTarget);
  targets[0].userData.currentGeometryClaim = true;
  scene.add(...targets);

  const result = prepareM5AZ2SystemReviewPresentation(scene);
  expect(result.semanticViolationCount).toBe(1);
});
