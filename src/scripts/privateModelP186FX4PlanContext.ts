import { THREE } from './threeRuntime';

/**
 * The X4 review must show the whole existing D1F plan, not only a tight crop
 * around the three room-level Themo work markers. The visual guide consumes
 * exactly the source-derived context meshes already selected by P186F.
 *
 * Green here means a drawing aid. It is not an approved wall host, a measured
 * 2026 installation location, or a replacement for P137E placement review.
 */
export const prepareP186FX4FloorPlanGuide = (sceneRoot: any, sourceTargetBounds: any) => {
  if (!sourceTargetBounds || sourceTargetBounds.isEmpty?.()) {
    throw new Error('P186F-X4 floor plan requires source-bound target bounds');
  }
  const floorPlanBounds = sourceTargetBounds.clone();
  let visualContextCount = 0;
  let roomFootprintCount = 0;
  let sourceWallGuideCount = 0;

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    const role = String(object?.userData?.p186fReviewRole ?? '');
    const isRoomFootprint = role === 'D_1F_ROOM_CONTEXT_20';
    const isSourceWall = role === 'D_1F_ARCH_CONTEXT_20';
    if (!object?.isMesh || !object.visible || (!isRoomFootprint && !isSourceWall)) return;

    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty() || ![
      bounds.min.x, bounds.min.y, bounds.min.z,
      bounds.max.x, bounds.max.y, bounds.max.z,
    ].every(Number.isFinite)) {
      throw new Error('P186F-X4 source plan context has invalid geometry');
    }

    // Only the viewer's material clones change; no GLB, source coordinates,
    // original room assignment, or device placement values are rewritten.
    const tint = (material: any) => {
      const clone = material.clone();
      clone.color?.setHex?.(0x16a34a);
      clone.emissive?.setHex?.(0x052e16);
      clone.transparent = true;
      clone.depthWrite = false;
      clone.needsUpdate = true;
      return clone;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(tint)
      : tint(object.material);
    object.userData = {
      ...(object.userData ?? {}),
      p186fX4GreenPlanGuide: true,
      p186fX4PlanGuideSourceKind: isRoomFootprint
        ? 'SOURCE_D1F_ROOM_FOOTPRINT_VISUAL_ONLY'
        : 'SOURCE_D1F_WALL_VISUAL_ONLY',
      viewerDerived: true,
      presentationOnly: true,
    };
    visualContextCount += 1;
    if (isRoomFootprint) roomFootprintCount += 1;
    else sourceWallGuideCount += 1;
    floorPlanBounds.union(bounds);
  });

  if (visualContextCount < 1) {
    throw new Error('P186F-X4 has no source-derived D1F plan context to display');
  }
  return {
    floorPlanBounds,
    visualContextCount,
    roomFootprintCount,
    sourceWallGuideCount,
    // Only approved P137E target+wall evidence can change this state.
    placementWallHostApproved: false,
    physicalDevicePlacementConfirmed: false,
  };
};
