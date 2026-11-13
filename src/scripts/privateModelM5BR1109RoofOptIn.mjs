// Immutable R1109 opt-in review selector: source GLB checksum is enforced by
// the existing WORK_TEST transport before GLTFLoader. This checks scene semantics,
// not real-world pipe routes, installation or production WebGL pixels.
export const m5bR1109RoofOptInSha256 =
  'b6b5b14c3c7dc63ec492a20aa3c74403de3ca4acfff8a99e5e37e5b295bcb2f8';
export const m5bR1109RoofParentSha256 =
  '92275bb2ecf61054c0bb015d69800b85a899d11f9170a485ccbf62238373fc10';

const variants = Object.freeze({
  64: Object.freeze({
    roots: [1021, 1123, 1102],
    phase: 'CURRENT_SOURCE_PRESENCE_SCOPED',
    reviewType: 'SOURCE_PRESENCE_PLUS_CURRENT_REFERENCE',
    markerCount: 5,
    currentRouteCount: 2,
    plannedCount: 0,
  }),
  65: Object.freeze({
    roots: [1021, 1123, 1103],
    phase: 'PLANNED_NOT_ORDERED_NOT_IMPLEMENTED',
    reviewType: 'SOURCE_PRESENCE_PLUS_EXPLICIT_PLANNED_COMPARISON',
    markerCount: 5,
    currentRouteCount: 0,
    plannedCount: 2,
  }),
});

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fails = (reason) => {
  throw new Error('M5B_R1109_SCENE64_65_SOURCE_GUARD:' + reason);
};

// Explicitly select a loaded, SHA-gated WORK_TEST scene, never the inherited
// default scene63. This is intentionally distinct from the old R1109 review.
export function selectM5BR1109RoofOptInScene(gltf, requestedIndex) {
  const expected = variants[requestedIndex];
  if (!expected) fails('unknown-scene');
  const json = gltf?.parser?.json;
  if (!json || json.scene !== 63 || json.scenes?.length !== 66 ||
      json.nodes?.length !== 1124 || json.meshes?.length !== 567 ||
      !isEqual(json.scenes?.[63]?.nodes, [1021, 1123]))
    fails('source-identity');
  // Exact source glTF parent-child lists (not ZIP __sceneNN labels).
  if (!isEqual(json.nodes?.[1123]?.children, [1118, 1119, 1120, 1121, 1122]) ||
      !isEqual(json.nodes?.[1102]?.children, [1097, 1098]) ||
      !isEqual(json.nodes?.[1103]?.children, [1099, 1100, 1101]))
    fails('source-parentage');

  const scene = json.scenes?.[requestedIndex];
  const extras = scene?.extras;
  if (!isEqual(scene?.nodes, expected.roots) ||
      extras?.parentSourceGLBSha256 !== m5bR1109RoofParentSha256 ||
      extras?.ModelStage !== 'WORK_TEST_VIEW' ||
      extras?.phase !== expected.phase ||
      extras?.reviewType !== expected.reviewType ||
      extras?.sourcePresenceTargetCount !== expected.markerCount ||
      !isEqual(extras?.sourcePresenceZoneNodeIds, [1118, 1119, 1120, 1121, 1122]) ||
      extras?.presentationOnly !== true || extras?.workAssumption !== true ||
      extras?.oneToOneDownspoutToRouteLinks !== 0 ||
      extras?.unsupportedPhysicalRouteLinks !== 0 ||
      extras?.physicalDownspoutHostClaim !== false ||
      extras?.physicalPipeOrGutterGeometryAdded !== false ||
      extras?.sourceSceneDefaultIndex !== 63 ||
      extras?.exactXYClaim !== false ||
      extras?.exactZClaim !== false ||
      extras?.physicalDiameterClaim !== false ||
      extras?.physicalRouteClaim !== false ||
      extras?.hydraulicConnectionToM5A !== false ||
      extras?.asBuiltClaim !== false ||
      extras?.currentGeometryClaim !== false ||
      extras?.canonical !== false ||
      extras?.publishToCURRENT !== false ||
      extras?.humanReview !== 'NOT_RUN' ||
      extras?.productionWebGL !== 'NOT_VERIFIED')
    fails('scene-contract');
  if (requestedIndex === 64 &&
      (!isEqual(extras?.directCurrentRouteNodes, [1097, 1098]) ||
       extras?.currentReferenceRouteCount !== 2 ||
       extras?.plannedEntitiesInReview !== 0))
    fails('current-only');
  if (requestedIndex === 65 &&
      (!isEqual(extras?.plannedDirectNodes, [1099, 1100]) ||
       extras?.plannedCount !== 2 ||
       extras?.plannedOrdered !== false ||
       extras?.plannedImplemented !== false ||
       extras?.currentSOK1ReferenceContextNode !== 1101))
    fails('planned-only');

  const selected = gltf.scenes?.[requestedIndex];
  if (!selected || typeof selected.traverse !== 'function')
    fails('renderable-scene-missing');
  return {
    scene: selected,
    sceneIndex: requestedIndex,
    phase: expected.phase,
    parentSha256: m5bR1109RoofParentSha256,
    workTest: true,
    humanReview: 'NOT_RUN',
    productionWebGL: 'NOT_VERIFIED',
  };
}
