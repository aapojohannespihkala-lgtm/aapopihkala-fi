/**
 * Source-only K3 D1F-SW-06 correction for the immutable, SHA-locked C80
 * R31 scene787/788 GLB. The original GLB has historical marker metadata
 * pointing at a water pipe; never treat this field as the live switch node.
 *
 * The caller MUST authenticate SHA-256 over ALL original GLB bytes. This
 * module intentionally does not change glTF, viewer mappings or sourceLinks.
 */
export const K3_D1F_SW06_SOURCE = Object.freeze({
  zipDriveId: '12hlWp4-qZgBbqkwAS3sXBKQvRhRrRvVh',
  zipSha256: 'c1fac317e60d637e8cb23192943448aeea61fc5db9d7b9b5cb39d22bb5742928',
  glbSha256: 'e16bb80f8bee2eeeeecdf1d3de1e5c2f392b224ea77fb164e208ea37dc4d3a8f',
  glbBytes: 63919056,
  defaultScene: 292,
  sceneCount: 789,
  nodeCount: 13531,
  meshCount: 5185,
  materialCount: 815,
  accessorCount: 11299,
  bufferViewCount: 11305,
  markerNodeId: 11775,
  activeSwitchNodeId: 12414,
  historicalSwitchNodeId: 7996,
  erroneousWaterNodeId: 11724,
  activeSwitchMesh: 2447,
  erroneousWaterMesh: 4209,
  newCoexistingSw04Root: 13528,
  combinedBaseGlbSha256: '4393ec07c62d0eabf434d76609f61e072454be0a89d4586d9f4a78af0a3e18a2',
  sw04DonorGlbSha256: '0479e0227604e51ec6835a6e04549cb96ea7f826fcaa98a3d30e2b409f52907e',
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 787, parentScene: 785, role: 'NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 788, parentScene: 786, role: 'SERVICE', plexi: false }),
  }),
});
const HEX64 = /^[a-f0-9]{64}$/;
const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const sameSet = (a, b) =>
  unique(a) && unique(b) && a.length === b.length && a.every(x => b.includes(x));

/**
 * Source evidence only, not an authorization to rebind sourceLinks or publish.
 * The 11724 glTF node really is a V75 water drain in this exact GLB.
 */
export function isK3D1fSw06ActiveSource(json, authenticatedGlbSha, sceneIndex, role, floor) {
  const s = K3_D1F_SW06_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  if (!view || floor !== 'D1F' || role !== view.role ||
      typeof authenticatedGlbSha !== 'string' || !HEX64.test(authenticatedGlbSha) ||
      authenticatedGlbSha !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const scene = json.scenes[sceneIndex];
  const parent = json.scenes[view.parentScene];
  const roots = scene?.nodes;
  const parentRoots = parent?.nodes;
  if (typeof scene?.name !== 'string' ||
      !scene.name.endsWith('__scene' + sceneIndex) ||
      !scene.name.includes('K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04') ||
      !scene.name.includes('_' + view.role + '_WORK_TEST_HOST_HOLD') ||
      !unique(roots) || !unique(parentRoots) ||
      !roots.includes(s.markerNodeId) || !parentRoots.includes(s.markerNodeId) ||
      !roots.includes(s.activeSwitchNodeId) || !parentRoots.includes(s.activeSwitchNodeId) ||
      roots.includes(s.historicalSwitchNodeId) ||
      roots.includes(s.erroneousWaterNodeId) ||
      roots.includes(11625) !== view.plexi ||
      !roots.includes(s.newCoexistingSw04Root) ||
      parentRoots.includes(s.newCoexistingSw04Root) ||
      !sameSet(roots, [...parentRoots, s.newCoexistingSw04Root].filter(
        x => x !== 11779
      )) ||
      scene?.extras?.stage !== 'WORK_TEST_HOST_HOLD' ||
      scene?.extras?.role !== view.role ||
      scene?.extras?.sourceParentScene !== view.parentScene ||
      scene?.extras?.sourceOriginalGLBSHA256 !== s.combinedBaseGlbSha256 ||
      scene?.extras?.donorOriginalGLBSHA256 !== s.sw04DonorGlbSha256 ||
      scene?.extras?.newD1FSW04Root !== s.newCoexistingSw04Root ||
      scene?.extras?.sourceLinksBoundToOutputSHA !== false ||
      scene?.extras?.current !== false || scene?.extras?.asBuilt !== false ||
      scene?.extras?.productionWebGLVerified !== false ||
      scene?.extras?.humanReview !== false) return false;

  const marker = json.nodes[s.markerNodeId];
  const historical = json.nodes[s.historicalSwitchNodeId];
  const active = json.nodes[s.activeSwitchNodeId];
  const drain = json.nodes[s.erroneousWaterNodeId];
  const mx = marker?.extras;
  if (marker?.mesh != null ||
      marker?.name !== 'D1F-SW-06_OWNER_CONFIRMED_MARKER_LINK_TO_EXISTING_MODEL_SWITCH_7996' ||
      mx?.stableID !== 'D1F-SW-06' || mx?.floor !== 'D1F' ||
      mx?.role !== 'SEMANTIC_LINK_TO_SOURCE_EXISTING_SWITCH_NO_DUPLICATE_MESH' ||
      mx?.existingSourceSwitchNode !== s.historicalSwitchNodeId ||
      mx?.remapSourceGLBNodeId !== s.erroneousWaterNodeId ||
      mx?.modelAlreadyContainsGeometry !== true ||
      mx?.physicalWallHost !== 'HOLD_UNVERIFIED' ||
      mx?.electricalCircuit !== 'NOT_VERIFIED' ||
      mx?.current !== false || mx?.asBuilt !== false ||
      historical?.mesh !== s.activeSwitchMesh ||
      historical?.name !== 'C80R2_V15_D1F_ENTRY_SWITCH_WORK_TEST' ||
      active?.mesh !== s.activeSwitchMesh ||
      active?.name !== 'C80R2_V15_D1F_ENTRY_SWITCH_WORK_TEST' ||
      active?.extras?.C80614R6?.dxG1 !== 0.094 ||
      active?.extras?.current !== false || active?.extras?.asBuilt !== false ||
      drain?.mesh !== s.erroneousWaterMesh ||
      typeof drain?.name !== 'string' ||
      !drain.name.includes('P02_P03_KITCHEN_V75_DOWN') ||
      drain?.extras?.m5System !== 'VESI' ||
      json.meshes[s.activeSwitchMesh]?.name !== 'C80R2_V15_SWITCH_MESH' ||
      json.meshes[s.activeSwitchMesh]?.primitives?.length !== 6 ||
      json.nodes[s.newCoexistingSw04Root]?.extras?.stableID !== 'D1F-SW-04') return false;

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  return unique(normal) && unique(service) &&
    normal.includes(11625) && !service.includes(11625) &&
    sameSet(normal.filter(id => id !== 11625), service);
}

/**
 * A valid receipt points exclusively to rendered switch 12414.
 * The historical 7996 and erroneous water 11724 must never be returned as
 * selection targets. No viewer or publication permission is conveyed.
 */
export function resolveK3D1fSw06SourceAssociation(json, authenticatedSha, sceneIndex, role, floor) {
  if (!isK3D1fSw06ActiveSource(json, authenticatedSha, sceneIndex, role, floor)) return null;
  const s = K3_D1F_SW06_SOURCE;
  return Object.freeze({
    stableID: 'D1F-SW-06',
    markerNodeId: s.markerNodeId,
    activeRenderableNodeId: s.activeSwitchNodeId,
    activeRenderableMeshId: s.activeSwitchMesh,
    historicalSwitchNodeId: s.historicalSwitchNodeId,
    rejectedLegacyWaterNodeId: s.erroneousWaterNodeId,
    stage: 'WORK_TEST_HOST_HOLD',
    sourceOnly: true,
    sourceLinksBound: false,
    viewerRegistered: false,
    publishAllowed: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    installedProductVerified: false,
    physicalHostVerified: false,
    electricalCircuitVerified: false,
  });
}
