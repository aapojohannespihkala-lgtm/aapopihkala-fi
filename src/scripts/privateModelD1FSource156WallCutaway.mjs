/** SOURCE156 source-linked presentation cutaway for an obscuring WORK_TEST wall.
 * Viewer-only optional helper; no current, canonical, as-built, pixel or human
 * review claim. Never changes glTF geometry, source GLB or permanent model state.
 *
 * Call only after the existing SOURCE156 authenticated raw SHA verification.
 * The caller is responsible for restoring on model switch and review exit.
 */
export const SOURCE156_WALL_CUTAWAY = Object.freeze({
  candidateId: 'd1f-source156-mirror305-k2-oak-u-two-pulls-20261018',
  sourceSha256: '14eed1eff91785682ac7d5c7cd0e9dec6b2ba053f41f539242e2ab120a29af51',
  sceneIndex: 156,
  sceneCount: 158,
  gltfRootNodeIds: Object.freeze([2855, 2615, 2640, 2653, 2707, 2771, 2772]),
  wallNodeId: 2448,
  wallMeshId: 773,
  originalPrimitiveMaterialIds: Object.freeze([106, 128, 129, 130]),
  wallName:
    'D1F_WC_CONTINUOUS_WALL_WEST_ANCHOR_725_895_740_SERVICE_WC3530_CENTERED_LID450_PHOTO_WALL_TILES',
  presentationOnly: true,
  physicalAbsoluteXYZVerified: false,
  current: false,
  canonical: false,
  asBuilt: false,
  humanReview: 'NOT_RUN',
});
export class Source156CutawayError extends Error {
  constructor(code) {
    super('D1F_SOURCE156_CUTAWAY_' + code);
    this.code = code;
  }
}
const must = (ok, code) => {
  if (!ok) throw new Source156CutawayError(code);
};

/** Locate exactly one original GLTFLoader object. A stale canvas dataset
 * string alone cannot prove the model; the authenticating loader supplies
 * its own checked SHA and matching parsed glTF scene.
 */
export function createSource156WallCutaway({
  gltf, authenticatedSourceSha256, candidateId,
} = {}) {
  const s = SOURCE156_WALL_CUTAWAY;
  const parsed = gltf?.parser?.json;
  const scene = gltf?.scene;
  must(authenticatedSourceSha256 === s.sourceSha256 &&
    candidateId === s.candidateId, 'SOURCE_IDENTITY');
  must(parsed?.scene === s.sceneIndex &&
    parsed.scenes?.length === s.sceneCount &&
    gltf.scenes?.[s.sceneIndex] === scene &&
    JSON.stringify(parsed.scenes[s.sceneIndex]?.nodes) ===
      JSON.stringify(s.gltfRootNodeIds), 'ORIGINAL_SCENE');
  const wall = parsed.nodes?.[s.wallNodeId];
  const primitiveMaterials = parsed.meshes?.[s.wallMeshId]?.primitives
    ?.map(x => x.material);
  must(wall?.name === s.wallName && wall.mesh === s.wallMeshId &&
    !wall.children?.length && wall.extras?.WORK_TEST_ONLY === true &&
    wall.extras?.asBuilt === false &&
    wall.extras?.HUMAN_REVIEW === 'NOT_RUN' &&
    JSON.stringify(primitiveMaterials) ===
      JSON.stringify(s.originalPrimitiveMaterialIds),
    'EXACT_ORIGINAL_WALL_4_PRIMITIVES');
  must(typeof scene?.traverse === 'function' &&
    typeof gltf.parser.associations?.get === 'function',
    'NO_GLTFLOADER_ASSOCIATIONS');
  let wallObject = null;
  let matches = 0;
  scene.traverse(object => {
    if (gltf.parser.associations.get(object)?.nodes !== s.wallNodeId)
      return;
    matches++;
    wallObject = object;
  });
  must(matches === 1 && wallObject?.name === s.wallName &&
    wallObject.visible === true, 'WALL_SOURCE_NODE_NOT_PRISTINE');

  let hidden = false;
  const result = action => Object.freeze({
    key: 'source156-wall2448', action,
    originalWallNodeId: s.wallNodeId,
    originalPrimitiveCount: 4,
    presentationCutawayActive: hidden,
    persistentModelChanged: false,
    originalGeometryChanged: false,
    productionPixelsVerified: false,
    current: false, canonical: false, asBuilt: false,
    humanReview: 'NOT_RUN',
  });
  const setPresentation = action => {
    must(action === 'HIDE_FOR_PRESENTATION' ||
      action === 'RESTORE_ORIGINAL', 'UNKNOWN_ACTION');
    if (action === 'HIDE_FOR_PRESENTATION') {
      must(!hidden && wallObject.visible === true, 'NOT_PRISTINE');
      wallObject.visible = false;
      hidden = true;
    } else {
      must(hidden && wallObject.visible === false, 'INVALID_RESTORE');
      wallObject.visible = true;
      hidden = false;
    }
    return result(action);
  };
  const restore = () => {
    if (hidden) {
      wallObject.visible = true;
      hidden = false;
    }
    return result('RESTORE_ORIGINAL');
  };
  const state = () => result(hidden ? 'HIDE_FOR_PRESENTATION' : 'RESTORE_ORIGINAL');
  return Object.freeze({setPresentation, restore, state});
}
