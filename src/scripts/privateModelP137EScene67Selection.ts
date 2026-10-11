/**
 * P137E source-bound D1F viewer candidate selector (WORK_TEST only).
 *
 * This selects just the EXISTING original P123C wall presentation instance
 * and three wall-contact Themo objects from scene 67. It never modifies the
 * GLB, persists an observation, promotes CURRENT or marks HUMAN_REVIEW PASS.
 * Caller must separately prove approved candidate SHA, authenticated autoload
 * and real rendered pixels before opening a human placement review.
 *
 * Evidence: persisted P137E Drive GLB 1gtAdJRncQ5qgwO6YRZ7zpwt2ZsTIjPhx
 * SHA256 d691dd756b0b1b2b95b68251b5d1fddfa6bc67c94b7ddb253bb1c3318c490b9c.
 */
export const p137eFocusedReviewSceneIndex = 67;
export const p137eFocusedReviewSceneName =
  'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP';
export const p137eFocusedRootName =
  'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP';
export const p137eFocusedRootIndex = 1107;
export const p137eFocusedOriginalWallIndex = 1106;
export const p137eFocusedSourceWallIndex = 798;
export const p137eFocusedSourceWallMeshIndex = 406;

const targetRecords = Object.freeze([
  { nodeIndex: 1091, name: 'P137E_THEMO_LOBBY_WALL_CONTACT_WORK_TEST',
    logicalDeviceId: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH', faceYM: 5.112 },
  { nodeIndex: 1096, name: 'P137E_THEMO_BEDROOM_WALL_CONTACT_WORK_TEST',
    logicalDeviceId: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH', faceYM: 5.032 },
  { nodeIndex: 1101, name: 'P137E_THEMO_BATHROOM_WALL_CONTACT_WORK_TEST',
    logicalDeviceId: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH', faceYM: 5.032 },
] as const);

export type P137EFocusedReviewSelection = {
  /** Existing glTF scene-root child: only the original wall and 3 Themos. */
  scene: any;
  sceneIndex: 67;
  sourceWallNode: 798;
  sourceWallMesh: 406;
  logicalDeviceIds: readonly string[];
  representationKind: 'P137E_SOURCE_WALL_AND_THREE_THEMOS_WORK_TEST';
  humanReview: 'NOT_RUN';
  currentGeometry: false;
  canonical: false;
  asBuilt: false;
};

const assert = (pass: boolean, reason: string): void => {
  if (!pass) throw new Error('P137E scene67 focused source mismatch: ' + reason);
};
const isNoPromotion = (record: any): boolean =>
  record?.current === false &&
  record?.Canonical === false &&
  record?.asBuilt === false &&
  record?.publishToCURRENT === false &&
  record?.HUMAN_REVIEW === 'NOT_RUN';

export const selectP137EScene67FocusedReview = (gltf: any): P137EFocusedReviewSelection => {
  const manifest = gltf?.parser?.json;
  const nodes = manifest?.nodes;
  const sourceScene = manifest?.scenes?.[p137eFocusedReviewSceneIndex];
  assert(Array.isArray(nodes) && Array.isArray(manifest?.scenes),
    'original glTF manifest unavailable');
  assert(gltf?.scenes?.[p137eFocusedReviewSceneIndex] != null, 'scene 67 unavailable');
  assert(sourceScene?.name === p137eFocusedReviewSceneName, 'scene 67 identity');
  assert(sourceScene?.extras?.sourceSceneIndex === 66 &&
    sourceScene?.extras?.sourceOriginalWallMeshIndex === 406 &&
    sourceScene?.extras?.targetLogicalDeviceCount === 3 &&
    sourceScene?.extras?.workTestOnly === true &&
    sourceScene?.extras?.noCurrentPromotion === true &&
    sourceScene?.extras?.HUMAN_REVIEW === 'NOT_RUN', 'scene 67 provenance or promotion');
  assert(Array.isArray(sourceScene.nodes) &&
    sourceScene.nodes.filter((nodeIndex: any) => nodeIndex === p137eFocusedRootIndex).length === 1,
    'focused root missing or duplicated in scene 67');

  const rootNode = nodes[p137eFocusedRootIndex];
  assert(rootNode?.name === p137eFocusedRootName &&
    rootNode?.extras?.Pass === 'P137E' &&
    rootNode?.extras?.sourceOriginalWallNode === p137eFocusedSourceWallIndex &&
    rootNode?.extras?.sourceOriginalWallMesh === p137eFocusedSourceWallMeshIndex &&
    rootNode?.extras?.WORK_TEST_ONLY === true &&
    rootNode?.extras?.oldMarkersSuppressedInNewSceneOnly === true &&
    isNoPromotion(rootNode?.extras), 'focused root source metadata');
  assert(Array.isArray(rootNode.children) &&
    rootNode.children.length === 4 &&
    [1106, 1091, 1096, 1101].every(id => rootNode.children.includes(id)) &&
    new Set(rootNode.children).size === 4,
    'focused root must contain one wall and three exact Themos');

  const sourceWall = nodes[p137eFocusedSourceWallIndex];
  const wall = nodes[p137eFocusedOriginalWallIndex];
  assert(sourceWall?.mesh === p137eFocusedSourceWallMeshIndex &&
    wall?.mesh === sourceWall.mesh &&
    wall?.extras?.sourceNodeIndex === p137eFocusedSourceWallIndex &&
    wall?.extras?.sourceMeshIndex === p137eFocusedSourceWallMeshIndex &&
    wall?.extras?.originalSourceGeometryUnmodified === true &&
    wall?.extras?.presentationOnly === true,
    'original P123C wall mesh source');
  assert(wall?.name === 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE',
    'original P123C wall instance identity');

  for (const expected of targetRecords) {
    const node = nodes[expected.nodeIndex];
    const metadata = node?.extras;
    assert(node?.name === expected.name &&
      metadata?.logicalDeviceId === expected.logicalDeviceId &&
      metadata?.representationKind === 'photoReferencedThermostatWallMountWorkTest' &&
      metadata?.sourceFaceMeshIndex === p137eFocusedSourceWallMeshIndex &&
      metadata?.sourceFaceNodeIndex === p137eFocusedSourceWallIndex &&
      metadata?.sourceFaceSide === expected.side &&
      metadata?.sourceFaceYM === expected.faceYM &&
      metadata?.backplateContactYM === expected.faceYM &&
      metadata?.wallBackplateAirGapM === 0 &&
      metadata?.fitOriginalPresentationSourceWallPlanePassed === true &&
      metadata?.fitExactPhysicalWallHostVerified === false &&
      metadata?.exactXYClaim === false &&
      metadata?.exactZClaim === false &&
      metadata?.currentGeometryClaim === false &&
      metadata?.wallHostPhysicalAsBuiltClaim === false &&
      metadata?.presentationOnly === true &&
      isNoPromotion(metadata), 'Themo source/wall-face contract ' + expected.logicalDeviceId);
  }

  // The GLTFLoader scene can have 20+ unrelated inherited source roots.
  // Never hand the entire scene67 carrier to the narrow D1F placement review.
  const scene67 = gltf.scenes[p137eFocusedReviewSceneIndex];
  const matches = (scene67.children ?? []).filter(
    (child: any) => child?.name === p137eFocusedRootName,
  );
  assert(matches.length === 1, 'focused viewer root missing or duplicated');
  const focused = matches[0];
  assert(focused.userData?.Pass === 'P137E' &&
    focused.userData?.WORK_TEST_ONLY === true &&
    isNoPromotion(focused.userData), 'runtime root promotion');
  assert(Array.isArray(focused.children) && focused.children.length === 4,
    'unexpected objects in focused viewer root');
  for (const childId of [p137eFocusedOriginalWallIndex, ...targetRecords.map(t => t.nodeIndex)]) {
    const expectedName = nodes[childId].name;
    const visibleMatches = focused.children.filter((child: any) => child?.name === expectedName);
    assert(visibleMatches.length === 1, 'runtime missing/duplicate child ' + childId);
    const observed = visibleMatches[0];
    assert(
      childId === p137eFocusedOriginalWallIndex
        ? observed.userData?.sourceMeshIndex === p137eFocusedSourceWallMeshIndex
        : observed.userData?.logicalDeviceId === nodes[childId].extras.logicalDeviceId,
      'runtime child does not match source node ' + childId,
    );
  }
  assert(
    !(focused.children ?? []).some((child: any) =>
      child.userData?.representationKind === 'referenceFootprint'),
    'room footprint instead of original P123C wall',
  );
  // A caller may attach this subtree to its render scene. No mutation here.
  return {
    scene: focused, sceneIndex: 67, sourceWallNode: 798, sourceWallMesh: 406,
    logicalDeviceIds: targetRecords.map(t => t.logicalDeviceId),
    representationKind: 'P137E_SOURCE_WALL_AND_THREE_THEMOS_WORK_TEST',
    humanReview: 'NOT_RUN', currentGeometry: false, canonical: false, asBuilt: false,
  };
};
