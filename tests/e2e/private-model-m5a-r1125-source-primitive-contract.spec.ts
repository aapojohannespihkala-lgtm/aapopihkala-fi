import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import {
  m5aZ2AbsoluteZBasis,
  m5aZ2AbsoluteZContract,
  m5aZ2ExpectedTargetKeys,
  prepareM5AZ2SystemReviewPresentation,
} from '../../src/scripts/privateModelM5AZ2ReviewPresentation';

/**
 * Source-role regression for R1125 scene63, distinct from the older
 * all-orange-TRIANGLES browser fixture. The original GLB uses 4 gray
 * TRIANGLES well meshes, 7 cyan TRIANGLES pipe meshes, and 2 yellow
 * glTF mode=1 LINES boundary primitives. THREE.LineSegments is the
 * runtime shape of those line primitives. This is not a production
 * WebGL pixel proof and cannot release HUMAN_REVIEW.
 */
const palette = {
  well: [0.62, 0.67, 0.72],
  route: [0.09, 0.65, 0.82],
  boundary: [0.92, 0.72, 0.16],
} as const;

const noPromotion = {
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

const color = (channels: readonly number[]) =>
  new THREE.Color().setRGB(channels[0]!, channels[1]!, channels[2]!);

const triangle = () => new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-0.23, 0, -0.22),
  new THREE.Vector3(0.23, 0, -0.22),
  new THREE.Vector3(0, 0, 0.24),
]);
const line = () => new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-0.3, 0, 0),
  new THREE.Vector3(0.3, 0, 0),
]);

function buildSourcePaletteScene() {
  const root = new THREE.Group();
  root.userData = {
    sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown:
      '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    currentGeometryClaim: false,
    asBuiltClaim: false,
    publishToCURRENT: false,
  };

  const nodes = m5aZ2ExpectedTargetKeys.map((key, index) => {
    const isWell = index < 4;
    const isBoundary = index >= 11;
    const extras = isBoundary
      ? {
          ...noPromotion,
          Pass: 'M5A-Z2D-R1036',
          representationKind: 'unresolvedBoundaryMarker',
          boundaryStatus: 'UNRESOLVED_BOUNDARY',
          boundaryRole: key.slice('boundary:'.length),
          physicalRouteClaim: false,
          externalNetworkConnectionClaim: false,
        }
      : {
          ...noPromotion,
          Pass: 'M5A-Z2D-R1036',
          G2IdCandidate: key,
          representationKind: isWell
            ? 'wellDiameterPresentationWork' : 'pipeDiameterPresentationWork',
          absoluteZBasis: m5aZ2AbsoluteZBasis,
          ...(isWell
            ? { physicalWellGeometryClaim: false }
            : { physicalRouteClaim: false, exactSlopeClaim: false }),
        };
    const primitive = isBoundary
      ? new THREE.LineSegments(line(),
          new THREE.LineBasicMaterial({ color: color(palette.boundary) }))
      : new THREE.Mesh(triangle(),
          new THREE.MeshBasicMaterial({
            color: color(isWell ? palette.well : palette.route),
            side: THREE.DoubleSide,
          }));
    primitive.name = 'R1125_SOURCE_' + String(index + 1).padStart(2, '0');
    primitive.position.set((index % 5) * 2, 0.08, Math.floor(index / 5) * 2);
    primitive.userData = extras;
    root.add(primitive);
    return primitive;
  });

  const terrain = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.8, 12),
    new THREE.MeshBasicMaterial({ color: 0x334455 }),
  );
  terrain.name = 'R1125_TERRAIN_CONTEXT';
  terrain.position.set(4, 0, 2);
  root.add(terrain);
  return { root, nodes, terrain };
}

test('R1125 preserves source-like 4/7 TRIANGLES and two glTF LINES under 80/20 presentation', () => {
  const { root, nodes, terrain } = buildSourcePaletteScene();
  const verticesBefore = nodes.map((node) =>
    Array.from(node.geometry.getAttribute('position').array as ArrayLike<number>));
  const colorsBefore = nodes.map((node) =>
    (node.material as THREE.Material & { color: THREE.Color }).color.clone());

  expect(nodes.filter((n) => (n as THREE.Mesh).isMesh)).toHaveLength(11);
  expect(nodes.filter((n) => (n as THREE.LineSegments).isLineSegments)).toHaveLength(2);

  const result = prepareM5AZ2SystemReviewPresentation(root, {
    r1125TerrainResistantOverlay: true,
  });
  expect(result.targetRenderableCount).toBe(13);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.r1125TerrainResistantOverlayApplied).toBe(true);
  expect(result.kindCounts).toEqual({
    wellMarkerWork: 4,
    referenceRouteWork: 7,
    unresolvedBoundaryMarker: 2,
  });
  expect(result.missingTargetKeys).toEqual([]);
  expect(result.duplicateTargetKeys).toEqual([]);
  expect(result.semanticViolationCount).toBe(0);

  nodes.forEach((node, index) => {
    const mat = node.material as THREE.Material & { color: THREE.Color };
    expect(mat.opacity).toBe(0.8);
    expect(mat.depthTest).toBe(false);
    expect(mat.depthWrite).toBe(false);
    expect(node.renderOrder).toBe(2200);
    expect(node.userData.m5aZ2ReviewRole).toBe('QUESTION_TARGET_80');
    expect(node.userData.Canonical).toBe(false);
    expect(node.userData.publishToCURRENT).toBe(false);
    expect(Array.from(node.geometry.getAttribute('position').array as ArrayLike<number>))
      .toEqual(verticesBefore[index]);
    expect(mat.color.r).toBeCloseTo(colorsBefore[index]!.r, 6);
    expect(mat.color.g).toBeCloseTo(colorsBefore[index]!.g, 6);
    expect(mat.color.b).toBeCloseTo(colorsBefore[index]!.b, 6);
    if (index >= 11) {
      expect((node as THREE.LineSegments).isLineSegments).toBe(true);
      expect(node.geometry.getAttribute('position').count).toBe(2);
    } else {
      expect((node as THREE.Mesh).isMesh).toBe(true);
      expect(node.geometry.getAttribute('position').count).toBe(3);
    }
  });
  const context = terrain.material as THREE.Material;
  expect(context.opacity).toBe(0.2);
  expect(context.depthTest).toBe(true);
  expect(terrain.renderOrder).toBe(5);
});

test('R1125 refuses a missing yellow unresolved line, rather than claiming 13/13', () => {
  const { root, nodes } = buildSourcePaletteScene();
  root.remove(nodes[12]!);
  expect(() => prepareM5AZ2SystemReviewPresentation(root, {
    r1125TerrainResistantOverlay: true,
  })).toThrow(/requires exact scene63 13\/13 source-only review/);
});

test('R1125 refuses to turn a yellow unresolved line into a confirmed physical connection', () => {
  const { root, nodes } = buildSourcePaletteScene();
  nodes[11]!.userData.externalNetworkConnectionClaim = true;
  expect(() => prepareM5AZ2SystemReviewPresentation(root, {
    r1125TerrainResistantOverlay: true,
  })).toThrow(/requires exact scene63 13\/13 source-only review/);
});
