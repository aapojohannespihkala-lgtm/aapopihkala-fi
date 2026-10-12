import { THREE } from './threeRuntime';
import { normalizeSceneName } from './privateModelSceneSemantics';

// Existing X4 GLB, source scene 5, node 798. Not a room-footprint proxy.
export const p186fX4D1fGreenWallName = 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER';
export const p186fX4D1fGreenWallMaterial = 'P123C_D_REVIEW_WALL_TRANSPARENT';

export const prepareP186FX4FloorPlanGuide = (
  sceneRoot: any,
  dInteriorSourceScene: any,
  targetBounds: any,
) => {
  // GLTFLoader may sanitize a scene's display name; its source scene is
  // already resolved against gltf.parser.json.scenes by findSourceNamedScene.
  // Keep the exact original wall mesh/material/metadata guards below.
  if (normalizeSceneName(dInteriorSourceScene?.name) !==
        normalizeSceneName('D CURRENT INTERIOR - BABYLON Y-UP') ||
      !sceneRoot || !targetBounds || targetBounds.isEmpty()) {
    throw new Error('P186F-X4 exact D1F green-wall source unavailable');
  }
  const originals: any[] = [];
  dInteriorSourceScene.traverse((object: any) => {
    if (object.name === p186fX4D1fGreenWallName) originals.push(object);
  });
  if (originals.length !== 1) throw new Error('P186F-X4 original D1F wall missing/duplicated');
  const source = originals[0];
  const data = source.userData ?? {};
  if (!source.isMesh || data.Pass !== '123C' ||
      Number(data.sourceP123BNode) !== 434 ||
      Number(data.windowOpeningCount) !== 3 || Number(data.doorCutoutCount) !== 0 ||
      source.geometry?.getAttribute?.('position')?.count !== 176 ||
      source.material?.name !== p186fX4D1fGreenWallMaterial) {
    throw new Error('P186F-X4 original green D1F wall identity mismatch');
  }

  // These seven diagnostic room-area shapes are NOT architecture.
  // Suppress only the legacy P117D referenceFootprint bridges, not actual floor slabs.
  let suppressedRoomFootprints = 0;
  sceneRoot.traverse((object: any) => {
    const d = object.userData ?? {};
    if (d.p186fReviewRole === 'D_1F_ROOM_CONTEXT_20' &&
        d.p186dReviewRoomContextBridge === true &&
        d.representationKind === 'referenceFootprint') {
      object.visible = false;
      d.p186fX4SuppressedRoomFootprint = true;
      suppressedRoomFootprints++;
    }
  });
  if (suppressedRoomFootprints !== 7) {
    throw new Error('P186F-X4 did not suppress all seven source room-footprints');
  }

  let proxy = (sceneRoot.children ?? []).filter(
    (object: any) => object.userData?.p186fX4OriginalGreenWallBridge === true,
  );
  if (proxy.length > 1) throw new Error('P186F-X4 duplicate original wall bridge');
  let wall = proxy[0];
  if (!wall) {
    // Clone the original geometry/material identity. Do not recolor, redraw or reshape.
    dInteriorSourceScene.updateWorldMatrix(true, true);
    sceneRoot.updateWorldMatrix(true, true);
    source.updateWorldMatrix(true, false);
    wall = source.clone(false);
    wall.name = p186fX4D1fGreenWallName + '__EXACT_SOURCE_X4_VIEW';
    wall.matrixAutoUpdate = false;
    wall.matrix.copy(
      new THREE.Matrix4().copy(sceneRoot.matrixWorld).invert().multiply(source.matrixWorld),
    );
    wall.visible = true;
    wall.renderOrder = 20;
    wall.userData = {
      ...data,
      viewerDerived: true,
      presentationOnly: true,
      p186fX4OriginalGreenWallBridge: true,
      sourceNodeIndex: 798,
      physicalWallHostClaim: false,
      currentGeometryClaim: false,
      asBuilt: false,
      publishToCURRENT: false,
    };
    sceneRoot.add(wall);
  }
  const bounds = new THREE.Box3().setFromObject(wall);
  if (bounds.isEmpty() || ![
    bounds.min.x, bounds.min.y, bounds.min.z,
    bounds.max.x, bounds.max.y, bounds.max.z,
  ].every(Number.isFinite)) {
    throw new Error('P186F-X4 original wall has no valid bounds');
  }

  return {
    floorPlanBounds: targetBounds.clone().union(bounds),
    originalGreenWallCount: 1,
    visualContextCount: 1,
    sourceWallGuideCount: 1,
    roomFootprintCount: 0,
    suppressedRoomFootprintCount: suppressedRoomFootprints,
    physicalDevicePlacementConfirmed: false,
    placementWallHostApproved: false,
  };
};
