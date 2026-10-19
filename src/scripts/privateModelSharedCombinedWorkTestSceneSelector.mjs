/** Source-exact, noncanonical combined D1F+M5A+M5B presentation selector.
 * Call only AFTER authenticated raw GLB SHA verification and GLTFLoader.parse.
 * Not production/WebGL pixel/physical-asBuilt evidence.
 */
export class SharedWorkTestSceneError extends Error {
  constructor(code) {
    super('SHARED_WORK_TEST_SCENE_' + code);
    this.name = 'SharedWorkTestSceneError';
    this.code = code;
  }
}
const must = (value, code) => {
  if (!value) throw new SharedWorkTestSceneError(code);
};

/** Pass only trusted source-registry values, NEVER URL query or source-provided
 * claimed SHA/index/name. New source GLB versions require new trusted contracts.
 */
export function createSharedCombinedSceneSelector(source) {
  must(source && typeof source === 'object', 'MISSING_TRUSTED_CONTRACT');
  const { candidateId, rawGlbSha256, sceneIndex, sceneName,
    rootNodeIds, expectedDefaultSceneIndex, expectedSceneCount } = source;
  must(typeof candidateId === 'string' && /^[a-z0-9-]{10,}$/.test(candidateId), 'INVALID_CANDIDATE_ID');
  must(typeof rawGlbSha256 === 'string' && /^[0-9a-f]{64}$/.test(rawGlbSha256), 'INVALID_RAW_SHA');
  must(Number.isInteger(sceneIndex) && sceneIndex > 65 &&
    Number.isInteger(expectedDefaultSceneIndex) && expectedDefaultSceneIndex >= 0 &&
    sceneIndex !== expectedDefaultSceneIndex &&
    Number.isInteger(expectedSceneCount) && expectedSceneCount > sceneIndex,
    'INVALID_SCENE_INDEX');
  must(typeof sceneName === 'string' &&
    /^SHARED\d+_.*_WORK_TEST_\d{8}$/.test(sceneName),
    'INVALID_SCENE_NAME');
  must(Array.isArray(rootNodeIds) && rootNodeIds.length >= 8 &&
    rootNodeIds.every(id => Number.isInteger(id) && id >= 0) &&
    new Set(rootNodeIds).size === rootNodeIds.length, 'INVALID_SCENE_ROOTS');
  const expectedRoots = Object.freeze([...rootNodeIds]);
  const identity = Object.freeze({
    candidateId, rawGlbSha256, sceneIndex, sceneName,
    expectedDefaultSceneIndex, expectedSceneCount, rootNodeIds: expectedRoots,
    workTestOnly: true, physicalGeometryApproved: false, current: false,
    canonical: false, asBuilt: false, humanReview: 'NOT_RUN',
    productionPixelsVerified: false,
  });
  const select = ({ gltf, authenticatedCandidateId, authenticatedRawGlbSha256 } = {}) => {
    must(authenticatedCandidateId === identity.candidateId &&
      authenticatedRawGlbSha256 === identity.rawGlbSha256,
      'AUTHENTICATED_SOURCE_IDENTITY');
    const json = gltf?.parser?.json;
    must(json?.asset?.version === '2.0' &&
      json?.asset?.extras?.canonical === false &&
      json?.asset?.extras?.currentCandidateR730?.canonical === false &&
      json?.scene === identity.expectedDefaultSceneIndex &&
      json.scenes?.length === identity.expectedSceneCount &&
      gltf?.scenes?.length === identity.expectedSceneCount &&
      gltf.scene === gltf.scenes[identity.expectedDefaultSceneIndex],
      'ORIGINAL_NONCANONICAL_SOURCE');
    const sceneDef = json.scenes[identity.sceneIndex];
    const scene = gltf.scenes[identity.sceneIndex];
    must(sceneDef?.name === identity.sceneName &&
      JSON.stringify(sceneDef.nodes) === JSON.stringify(identity.rootNodeIds) &&
      Array.isArray(json.nodes) &&
      identity.rootNodeIds.every(id => !!json.nodes[id]) &&
      scene && Array.isArray(scene.children) &&
      scene.children.length === identity.rootNodeIds.length &&
      scene.children.every((child, i) =>
        gltf.parser.associations?.get(child)?.nodes === identity.rootNodeIds[i]),
      'EXACT_COMBINED_SCENE_ROOTS');
    // Presentation-only pointer: original scene objects and meshes untouched.
    const original = gltf.scene;
    let selected = false;
    return Object.freeze({
      identity,
      selectForPresentation() {
        must(!selected && gltf.scene === original,
          'ALREADY_SELECTED_OR_EXTERNAL_OWNER');
        gltf.scene = scene;
        selected = true;
        return Object.freeze({sceneIndex: identity.sceneIndex, selected: true,
          sourceVerified: true, productionPixelsVerified: false,
          current: false, canonical: false, asBuilt: false, humanReview: 'NOT_RUN'});
      },
      restoreOriginal() {
        if (selected) {
          must(gltf.scene === scene, 'EXTERNAL_SCENE_OWNER');
          gltf.scene = original;
          selected = false;
        }
        return Object.freeze({restored: true,
          originalDefaultSceneIndex: identity.expectedDefaultSceneIndex,
          productionPixelsVerified: false});
      },
    });
  };
  return Object.freeze({identity, select});
}
