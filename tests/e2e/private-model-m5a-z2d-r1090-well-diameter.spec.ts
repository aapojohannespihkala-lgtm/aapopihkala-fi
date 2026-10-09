import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import { m5aZ2ExpectedTargetKeys, prepareM5AZ2SystemReviewPresentation } from '../../src/scripts/privateModelM5AZ2ReviewPresentation';
import { getUndrawableM5AZ2TargetKeys } from '../../src/scripts/privateModelM5AZ2SystemReviewRuntime';

const makeSuccessor = () => {
  const scene = new THREE.Group();
  for (const key of m5aZ2ExpectedTargetKeys) {
    const isWell = key.startsWith('G2_DRAIN_WELL_');
    const isBoundary = key.startsWith('boundary:');
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), new THREE.MeshBasicMaterial());
    mesh.userData = {
      Pass: isWell ? 'M5A-Z2D-R1090' : 'M5A-Z2D-R1036',
      representationKind: isWell ? 'wellDiameterPresentationWork' : isBoundary ? 'unresolvedBoundaryMarker' : 'pipeDiameterPresentationWork',
      Canonical: false, presentationOnly: true, workAssumption: true, sourceDerivedTopology: true,
      exactXYClaim: false, exactZClaim: false, physicalElevationClaim: false,
      currentGeometryClaim: false, asBuiltClaim: false, publishToCURRENT: false,
      absoluteZContract: 'G2_R896',
      ...(isWell ? { physicalWellGeometryClaim: false } : isBoundary ?
        { boundaryRole: key.slice(9), boundaryStatus: 'UNRESOLVED_BOUNDARY', physicalRouteClaim: false, externalNetworkConnectionClaim: false } :
        { physicalRouteClaim: false, exactSlopeClaim: false }),
      ...(!isBoundary ? { G2IdCandidate: key } : {}),
      ...(!isBoundary ? { absoluteZBasis: 'HIGH_CONFIDENCE_DERIVED_HOST_FLOOR_DATUM_BRIDGE' } : {}),
    };
    scene.add(mesh);
  }
  return scene;
};

test('R1090 well diameter nodes count as four wells without skipping seven pipes or two boundaries', () => {
  const scene = makeSuccessor();
  expect(getUndrawableM5AZ2TargetKeys(scene)).toEqual([]);
  const result = prepareM5AZ2SystemReviewPresentation(scene);
  expect(result.targetRenderableCount).toBe(13);
  expect(result.missingTargetKeys).toEqual([]);
  expect(result.duplicateTargetKeys).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);
  expect(result.kindCounts).toEqual({ wellMarkerWork: 4, referenceRouteWork: 7, unresolvedBoundaryMarker: 2 });
});

test('R1090 rejects promoted or geometrically empty diameter wells', () => {
  const scene = makeSuccessor();
  scene.children[0].userData.physicalWellGeometryClaim = true;
  expect(prepareM5AZ2SystemReviewPresentation(scene).semanticViolationCount).toBe(1);
  const empty = makeSuccessor();
  (empty.children[0] as THREE.Mesh).geometry.setDrawRange(0, 0);
  expect(getUndrawableM5AZ2TargetKeys(empty)).toEqual(['G2_DRAIN_WELL_SOK1_001']);
});
