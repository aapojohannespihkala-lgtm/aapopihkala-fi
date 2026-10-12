import { Box3, Vector3 } from 'three';
import {
  p137eFocusedRootName,
  p137eFocusedSourceWallMeshIndex,
} from './privateModelP137EScene67Selection';

/**
 * A pair of source-derived D1F WORK_TEST view descriptors, never review approval.
 * Caller must use the exact focused scene67 root selected by the existing
 * source guard and still prove authenticated render pixels for all three.
 *
 * The original glTF is Babylon Y-up: source +Y becomes render-world -Z,
 * while source +Z becomes render-world +Y after its actual root rotation.
 * Only the original P123C wall mesh406 and three Themo housings are expected.
 */
export const p137eTwoFaceTargets = Object.freeze([
  { id: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH', faceYM: 5.112, frontSign: 1 },
  { id: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH', faceYM: 5.032, frontSign: -1 },
  { id: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH', faceYM: 5.032, frontSign: -1 },
] as const);

export type P137ETwoFaceDescriptor = Readonly<{
  face: 'NORTH' | 'SOUTH';
  sourceIds: readonly string[];
  eye: readonly [number, number, number];
  target: readonly [number, number, number];
  up: readonly [number, number, number];
  orthoHalfHeight: number;
  sourceOnly: true;
  productionRenderVerified: false;
}>;

const fail = (condition: unknown, reason: string): void => {
  if (!condition) throw new Error('P137E two-face WORK_TEST source mismatch: ' + reason);
};
const safe = (record: any): boolean =>
  record?.current !== true &&
  record?.Canonical === false &&
  record?.asBuilt === false &&
  record?.publishToCURRENT === false &&
  record?.HUMAN_REVIEW === 'NOT_RUN';
const tuple = (v: Vector3): readonly [number, number, number] =>
  [v.x, v.y, v.z] as const;

export function deriveP137ETwoFaceSourceCameras(
  focusedRoot: any,
  aspect: number,
): Readonly<{
  sourceSceneIndex: 67;
  sourceWallMesh: 406;
  north: P137ETwoFaceDescriptor;
  south: P137ETwoFaceDescriptor;
  humanReview: 'NOT_RUN';
  productionRenderVerified: false;
}> {
  fail(Number.isFinite(aspect) && aspect >= 0.5 && aspect <= 4,
    'camera viewport aspect');
  fail(focusedRoot?.name === p137eFocusedRootName &&
    focusedRoot?.userData?.Pass === 'P137E' &&
    focusedRoot?.userData?.sourceOriginalWallNode === 798 &&
    focusedRoot?.userData?.sourceOriginalWallMesh === 406 &&
    focusedRoot?.userData?.WORK_TEST_ONLY === true &&
    safe(focusedRoot.userData) &&
    Array.isArray(focusedRoot.children) &&
    focusedRoot.children.length === 4 &&
    typeof focusedRoot.updateMatrixWorld === 'function',
  'exact source root and WORK_TEST restrictions');

  const wallMatches = focusedRoot.children.filter((child: any) =>
    child?.name === 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE' &&
    child?.userData?.sourceNodeIndex === 798 &&
    child?.userData?.sourceMeshIndex === p137eFocusedSourceWallMeshIndex &&
    child?.userData?.originalSourceGeometryUnmodified === true &&
    child?.userData?.presentationOnly === true);
  fail(wallMatches.length === 1 && wallMatches[0].visible !== false,
    'single original P123C source wall');

  focusedRoot.updateMatrixWorld(true);
  const normalNorth = new Vector3(0, 1, 0)
    .transformDirection(focusedRoot.matrixWorld);
  const up = new Vector3(0, 0, 1)
    .transformDirection(focusedRoot.matrixWorld);
  fail(Math.abs(normalNorth.length() - 1) < 1e-6 &&
    normalNorth.z < -0.98 && Math.abs(normalNorth.x) < 0.05 &&
    up.y > 0.98 && Math.abs(normalNorth.dot(up)) < 1e-6,
  'original Babylon-to-world orientation');

  const devices = new Map<string, { center: Vector3; bounds: Box3; side: string }>();
  for (const child of focusedRoot.children) {
    if (child === wallMatches[0]) continue;
    const metadata = child?.userData;
    const expected = p137eTwoFaceTargets.find(x => x.id === metadata?.logicalDeviceId);
    if (!expected || devices.has(expected.id)) {
      throw new Error('P137E two-face WORK_TEST source mismatch: logical device uniqueness');
    }
    fail(child.visible !== false &&
      metadata?.representationKind === 'photoReferencedThermostatWallMountWorkTest' &&
      metadata?.sourceFaceSide === expected.side &&
      metadata?.frontFacesTowardYSign === expected.frontSign &&
      metadata?.sourceFaceYM === expected.faceYM &&
      metadata?.backplateContactYM === expected.faceYM &&
      metadata?.wallBackplateAirGapM === 0 &&
      metadata?.sourceFaceNodeIndex === 798 &&
      metadata?.sourceFaceMeshIndex === 406 &&
      metadata?.fitOriginalPresentationSourceWallPlanePassed === true &&
      metadata?.fitExactPhysicalWallHostVerified === false &&
      metadata?.presentationOnly === true &&
      metadata?.exactXYClaim === false &&
      metadata?.exactZClaim === false &&
      metadata?.currentGeometryClaim === false &&
      metadata?.wallHostPhysicalAsBuiltClaim === false &&
      safe(metadata),
    'original surface and no-promotion for ' + expected.id);
    const bounds = new Box3().setFromObject(child);
    fail(!bounds.isEmpty(), 'actual Themo mesh bounds missing');
    const center = bounds.getCenter(new Vector3());
    fail([center.x, center.y, center.z].every(Number.isFinite),
      'nonfinite source device location');
    devices.set(expected.id, { center, bounds, side: expected.side });
  }
  fail(devices.size === 3, 'three actual source Themos');

  const build = (face: 'NORTH' | 'SOUTH'): P137ETwoFaceDescriptor => {
    const selected = p137eTwoFaceTargets.filter(x => x.side === face);
    const union = new Box3();
    for (const item of selected) union.union(devices.get(item.id)!.bounds);
    const center = union.getCenter(new Vector3());
    const size = union.getSize(new Vector3());
    const eye = center.clone().addScaledVector(
      normalNorth, face === 'NORTH' ? 0.65 : -0.65,
    );
    // Include the full two-device horizontal span, not the entire building.
    const halfHeight = Math.max(0.36, size.y * 0.85,
      (size.x * 0.7) / aspect);
    fail(halfHeight <= 5 && [eye.x, eye.y, eye.z].every(Number.isFinite),
      'bounded source face camera');
    return Object.freeze({
      face,
      sourceIds: Object.freeze(selected.map(x => x.id)),
      eye: tuple(eye),
      target: tuple(center),
      up: tuple(up),
      orthoHalfHeight: halfHeight,
      sourceOnly: true as const,
      productionRenderVerified: false as const,
    });
  };

  return Object.freeze({
    sourceSceneIndex: 67 as const,
    sourceWallMesh: 406 as const,
    north: build('NORTH'),
    south: build('SOUTH'),
    humanReview: 'NOT_RUN' as const,
    productionRenderVerified: false as const,
  });
}
