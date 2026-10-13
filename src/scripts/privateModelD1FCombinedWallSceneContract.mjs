/**
 * Fail-closed scene selector for the four D1F combined wall WORK_TEST alternatives.
 * Source/render identity is NOT established by this in-memory structural check.
 * The caller must separately authenticate original raw GLB bytes and prove
 * the wall and three corners with individual production pixel evidence.
 */
export const D1F_COMBINED_WALL_VARIANTS = Object.freeze([
  'WEST_ANCHOR_725_895_740',
  'WEST_ANCHOR_740_895_725',
  'EAST_ANCHOR_725_895_740',
  'EAST_ANCHOR_740_895_725',
]);
export const D1F_COMBINED_SCENE_START = 68;
const CORNERS = Object.freeze([
  'CORNER_NORTH_X2337',
  'CORNER_SOUTH_X2337',
  'CORNER_MIDDLE_X2589',
]);
const THEMOS = Object.freeze([1091, 1096, 1101]);
const fail = (reason) => { throw new Error('D1F_COMBINED_WALL_CONTRACT_REJECTED: ' + reason); };
const isWorkOnly = (u) =>
  u?.WORK_TEST_ONLY === true &&
  u?.current === false &&
  u?.Canonical === false &&
  u?.asBuilt === false &&
  u?.publishToCURRENT === false &&
  u?.HUMAN_REVIEW === 'NOT_RUN' &&
  u?.physicalAbsoluteXYZVerified === false;

const walk = (root) => {
  const seen = new Set();
  const result = [];
  const visit = (object) => {
    if (!object || typeof object !== 'object' || seen.has(object)) fail('scene graph cycle or shared node');
    seen.add(object);
    result.push(object);
    for (const child of object.children ?? []) visit(child);
  };
  visit(root);
  return result;
};

export function selectD1FCombinedWallWorkTestScene(gltf, requestedVariant) {
  const selectedIndex = D1F_COMBINED_WALL_VARIANTS.indexOf(requestedVariant);
  if (selectedIndex < 0) fail('variant must be one of four exact named alternatives');
  const json = gltf?.parser?.json;
  if (!Array.isArray(gltf?.scenes) || gltf.scenes.length !== 72 ||
      !Array.isArray(json?.scenes) || json.scenes.length !== 72 ||
      !Array.isArray(json.nodes) || json.nodes[798]?.mesh !== 406 ||
      !json.scenes[5]?.nodes?.includes(817) ||
      !json.nodes[817]?.children?.includes(798)) {
    fail('original D1F scene5/source carrier is absent or different');
  }
  if (!isWorkOnly(json.extras?.combined2990WallWorkTest)) fail('GLB family metadata not WORK_TEST only');

  const identified = new Set();
  for (let i = 0; i < D1F_COMBINED_WALL_VARIANTS.length; i++) {
    const variant = D1F_COMBINED_WALL_VARIANTS[i];
    const index = D1F_COMBINED_SCENE_START + i;
    const rawScene = json.scenes[index];
    const actualScene = gltf.scenes[index];
    const expectedName = 'D1F COMBINED 2990MM ' + variant + ' WORK_TEST NOT CURRENT';
    if (rawScene?.name !== expectedName ||
        actualScene?.name !== expectedName ||
        rawScene.nodes?.length !== 1 ||
        !isWorkOnly(rawScene.extras) ||
        rawScene.extras.sourceSceneIndex !== 5 ||
        rawScene.extras.variant !== variant ||
        rawScene.extras.physicalWidthAnchorResolved !== false ||
        rawScene.extras.saunaDoorHandResolved !== false ||
        actualScene.children?.length !== 1) fail('scene name, root, or source provenance');
    if (identified.has(rawScene.nodes[0])) fail('variant scenes share one source root');
    identified.add(rawScene.nodes[0]);
  }

  const scene = gltf.scenes[D1F_COMBINED_SCENE_START + selectedIndex];
  const root = scene.children[0];
  const expectedRootName =
    'P136B_VIEW_ROOT_D_CURRENT_INTERIOR_CORRECTED_BABYLON_Y_UP_COMBINED_' + requestedVariant;
  if (root.name !== expectedRootName ||
      root.userData?.sourceNodeIndex !== 817 ||
      !isWorkOnly(root.userData) ||
      root.userData.alignmentHypothesis !== 'WORK_MODEL_LOBBY_FACE_ANCHOR_FIXED' ||
      root.userData.physicalFinishedFloorSurfacesNotMaterialized !== true ||
      root.userData.sourceRootQuaternionPreserved !== true) fail('architecture root contract');

  const children = walk(root);
  const walls = children.filter(o => o.userData?.sourceNodeIndex === 798);
  if (walls.length !== 1 || !isWorkOnly(walls[0].userData) ||
      walls[0].userData.displayContextOnly !== false) fail('one actual replacement wall carrier required');
  const wall = walls[0];
  if (wall.visible === false) fail('target wall hidden');

  const corners = CORNERS.map(name => {
    const matches = children.filter(o => o.userData?.independentlyAddressableCorner === name);
    if (matches.length !== 1 || !isWorkOnly(matches[0].userData) ||
        matches[0].name !== name + '_' + requestedVariant ||
        matches[0].visible === false ||
        !wall.children?.includes(matches[0])) fail('corner missing, hidden, duplicated, or not on wall carrier: ' + name);
    return { name, object: matches[0] };
  });
  for (const sourceNodeId of THEMOS) {
    const matches = children.filter(o => o.userData?.sourceNodeIndex === sourceNodeId);
    if (matches.length !== 1 || !isWorkOnly(matches[0].userData) ||
        !root.children?.includes(matches[0])) fail('three original Themo hosts not preserved');
  }
  // Never make visual, publishing or physical-survey claims from metadata alone.
  return Object.freeze({
    scene, variant: requestedVariant, wall, corners,
    workTestOnly: true,
    absolutePhysicalXYVerified: false,
    rawGlbByteIdentityVerified: false,
    productionRenderedRoisVerified: false,
    humanReview: 'NOT_RUN',
  });
}
