/**
 * Exact, SOURCE_ONLY receipt for K3 D1F-SW04 87 mm wall-switch reference.
 * Original G2b WORK_TEST/HOST_HOLD ZIP 1oi_64PQ5q38H-Kx_zSpxu3Z6sMMklJPq.
 * Caller must compute SHA256 from the complete original GLB bytes, not from
 * the filename or GLB extras. glTF sceneIndex is NOT a __sceneN filename.
 * No viewer model registration, sourceLinks publication, or CURRENT approval.
 */
export const K3_D1F_SW04_SOURCE = Object.freeze({
  zipDriveId: '1oi_64PQ5q38H-Kx_zSpxu3Z6sMMklJPq',
  zipSha256: 'b09bfa43064af9f2f3a16452d86712f2d7d7366a51748dadf0770d82245de83a',
  glbSha256: '0479e0227604e51ec6835a6e04549cb96ea7f826fcaa98a3d30e2b409f52907e',
  glbBytes: 63891856,
  parentZipDriveId: '1L7igjoQELiJVgqhiKsg9LgJbvzj-Y3ag',
  parentZipSha256: 'c9b73992ee912f843aaaed8337453870b98abea1a93a66f315b5417f90ca0e2e',
  parentGlbSha256: 'fba0e0aa4e8e59a9736aa27fa476ceb67446f07a6019f6ecde8653bd2d224326',
  defaultScene: 292,
  sceneCount: 785, nodeCount: 13525, meshCount: 5181,
  materialCount: 815, accessorCount: 11291, bufferViewCount: 11297,
  oldMarker: 11779, newRoot: 13522, children: Object.freeze([13523, 13524]),
  hostNode: 13495, hostMesh: 5165, hostPrimitive: 1, hostTriangle: 34,
  retainedRoots: Object.freeze([13507, 13510, 13513, 13516, 13519]),
  views: Object.freeze({
    normal: Object.freeze({
      sceneIndex: 783, parentScene: 781, role: 'NORMAL',
      rootCount: 500, parentRootCount: 499,
      rootFnv32: '4d58b6f3', parentRootFnv32: '306365f3',
      sceneName: 'Ylisrinne_C80_R31_BOTH_K3_D1F_SW04_1F_SW02_D2F_SW01_02_03_04_NORMAL_WORK_TEST_HOST_HOLD__scene783',
      plexi: true,
    }),
    service: Object.freeze({
      sceneIndex: 784, parentScene: 782, role: 'SERVICE',
      rootCount: 499, parentRootCount: 498,
      rootFnv32: 'de17efe0', parentRootFnv32: '60b58872',
      sceneName: 'Ylisrinne_C80_R31_BOTH_K3_D1F_SW04_1F_SW02_D2F_SW01_02_03_04_SERVICE_WORK_TEST_HOST_HOLD__scene784',
      plexi: false,
    }),
  }),
});
const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((value, index) => value === b[index]);
export function k3D1fSw04RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let hash = 2166136261;
  for (const root of roots) {
    if (!Number.isSafeInteger(root) || root < 0) return null;
    hash = Math.imul(hash ^ root, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
/**
 * Validate a JSON chunk whose original full GLB bytes were independently SHA
 * authenticated. This structural receipt cannot itself authenticate the bytes.
 */
export function isK3D1fSw04Scene783784Source(
  json, authenticatedGlbSha256, sceneIndex, role, floor,
) {
  const s = K3_D1F_SW04_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  const asset = json?.asset?.extras;
  if (!view || authenticatedGlbSha256 !== s.glbSha256 ||
      role !== view.role || floor !== 'D1F' ||
      json?.scene !== s.defaultScene || json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount || json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      asset?.ModelStage !== 'WORK_TEST' ||
      asset?.current !== false || asset?.asBuilt !== false ||
      asset?.HUMAN_REVIEW !== 'NOT_RUN') return false;
  const scene = json.scenes[sceneIndex];
  const parent = json.scenes[view.parentScene];
  const roots = scene?.nodes, former = parent?.nodes;
  const e = scene?.extras;
  if (scene?.name !== view.sceneName ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' || e?.role !== role ||
      e?.sourceParentScene !== view.parentScene ||
      e?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      e?.newD1FSW04Root !== s.newRoot || e?.ownerMarkerNode !== s.oldMarker ||
      e?.activeHostNodeID !== s.hostNode ||
      e?.activeHostPrimitive !== s.hostPrimitive ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.humanReview !== false || e?.productionWebGLVerified !== false ||
      e?.sourceLinksBoundToOutputSHA !== false ||
      !Array.isArray(roots) || !Array.isArray(former) ||
      roots.length !== view.rootCount || former.length !== view.parentRootCount ||
      new Set(roots).size !== roots.length || new Set(former).size !== former.length ||
      k3D1fSw04RootsFnv32(roots) !== view.rootFnv32 ||
      k3D1fSw04RootsFnv32(former) !== view.parentRootFnv32 ||
      !exact(roots, [...former, s.newRoot]) ||
      roots.includes(s.oldMarker) || former.includes(s.newRoot) ||
      !s.retainedRoots.every(i => roots.includes(i) && former.includes(i)) ||
      roots.includes(11625) !== view.plexi ||
      former.includes(11625) !== view.plexi) return false;
  const root = json.nodes[s.newRoot], x = root?.extras;
  if (root?.name !== 'K3_D1F_SW04_87MM_EXXACT_STYLE_REFERENCE_ACTIVE_WALL_WORK_TEST_HOST_HOLD' ||
      !exact(root.children, s.children) ||
      json.nodes[s.children[0]]?.mesh !== 5179 ||
      json.nodes[s.children[1]]?.mesh !== 5180 ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh ||
      json.nodes[s.oldMarker]?.extras?.stableID !== 'D1F-SW-04' ||
      x?.stableID !== 'D1F-SW-04' || x?.floor !== 'D1F' ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalZipSHA256 !== s.parentZipSha256 ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.sourceOwnerMarkerNode !== s.oldMarker ||
      !exact(x?.sourceOwnerMarkerPixel, [328, 921]) ||
      x?.historicalWallHostNodeNOTACTIVE !== 7221 ||
      x?.activeHostNodeID !== s.hostNode || x?.activeHostMeshID !== s.hostMesh ||
      x?.activeHostPrimitive !== s.hostPrimitive ||
      x?.activeHostTriangle !== s.hostTriangle ||
      x?.activeHostPlaneZ_m !== -5.032 ||
      !exact(x?.hostNormalWorld, [0, 0, 1]) ||
      !exact(x?.proxyCenterXYZ_m, [5.15, 1.175, -5.032]) ||
      x?.proxyFrameOuter_m !== 0.087 || x?.proxyVisibleRocker_m !== 0.069 ||
      x?.proxyWallGap_m_WORK_ASSUMPTION !== 0.001 ||
      x?.geometrySource !== 'PROCEDURAL_EXXACT_STYLE_VISUAL_REFERENCE_NOT_MANUFACTURER_CAD' ||
      x?.hostHold !== true || x?.current !== false || x?.asBuilt !== false ||
      x?.installedBrandNotVerified !== true || x?.installedSKUNotVerified !== true ||
      x?.physicalHostNotVerified !== true || x?.electricalCircuitNotVerified !== true ||
      x?.sourceLinksBoundToOutputSHA !== false ||
      x?.humanReview !== false || x?.productionWebGLVerified !== false ||
      !exact(x?.preservesOtherD1FSwitches, ['D1F-SW-01','D1F-SW-02','D1F-SW-03','D1F-SW-06']) ||
      !exact(x?.preservesD2FSwitches, ['D2F-SW-01','D2F-SW-02','D2F-SW-03','D2F-SW-04'])) return false;
  return true;
}
export function k3D1fSw04Scene783784SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3D1fSw04Scene783784Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false, publishAllowed: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
    current: false, asBuilt: false, physicalHostVerified: false,
    installedProductVerified: false,
  });
}
