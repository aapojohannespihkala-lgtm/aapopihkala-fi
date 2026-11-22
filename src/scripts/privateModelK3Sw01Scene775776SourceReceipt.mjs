/**
 * Source-only receipt for the released K3 D2F-SW01 wall-host replacement.
 * This does NOT register the protected GLB in a viewer or publish source-cards.
 * The caller must authenticate SHA256 against the full original GLB bytes,
 * never a filename, catalog label or an untrusted JSON extras assertion.
 *
 * Source: G2b ZIP 1lu-qeiTmygOh-ZNJgZ_VPKK6tlORGnVL, WORK_TEST/HOST_HOLD.
 */
export const K3_SW01_775776_SOURCE = Object.freeze({
  zipDriveId: '1lu-qeiTmygOh-ZNJgZ_VPKK6tlORGnVL',
  zipSha256: 'f0d44fe1d0a700f8706e776961f18fca550b12cb63f1a2e66123a70a1db3f11f',
  glbSha256: '96677bd79cef10d4daf49c5a0143413c55c6481f400e189ae2884b9e9ccf5128',
  glbBytes: 63851640,
  parentZipDriveId: '14R1L7dFUyHrjSQoffVFfrcT_PtcmDkru',
  parentGlbSha256: 'aa56361ce355fdf31f0fbe301364156a6548eebd0ac1eb57bc25475acdca77c0',
  defaultScene: 292,
  sceneCount: 777,
  nodeCount: 13513,
  meshCount: 5173,
  materialCount: 815,
  accessorCount: 11275,
  bufferViewCount: 11281,
  oldRoot: 13242,
  newRoot: 13510,
  sw04Root: 13507,
  hostNode: 12437,
  hostMesh: 4679,
  views: Object.freeze({
    normal: Object.freeze({
      role: 'D2F_SW01_NORMAL', sceneIndex: 775, parentScene: 773,
      rootCount: 204, parentRootFnv32: '7b66d506', rootFnv32: '5b8ce47a',
      plexi: 'PLEX_ON',
      sceneName: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_SW01_WALLHOST_REF_NORMAL_PLEX_ON_WORK_TEST_HOST_HOLD__scene775',
    }),
    service: Object.freeze({
      role: 'D2F_SW01_SERVICE', sceneIndex: 776, parentScene: 774,
      rootCount: 203, parentRootFnv32: 'd53dce03', rootFnv32: '49c64a9f',
      plexi: 'PLEX_OFF',
      sceneName: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_SW01_WALLHOST_REF_SERVICE_PLEX_OFF_WORK_TEST_HOST_HOLD__scene776',
    }),
  }),
});

export function k3Sw01RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let result = 2166136261;
  for (const id of roots) {
    if (!Number.isSafeInteger(id) || id < 0) return null;
    result = Math.imul(result ^ id, 16777619) >>> 0;
  }
  return result.toString(16).padStart(8, '0');
}

const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((value, index) => value === b[index]);
const unique = (array) => Array.isArray(array) && new Set(array).size === array.length;

/**
 * @param {object} json Parsed, authenticated GLB JSON chunk.
 * @param {string} authenticatedGlbSha256 SHA-256 computed over full GLB bytes by caller.
 * @param {number} sceneIndex Actual glTF scene index, NOT just filename __sceneN.
 * @param {string} role Explicit source role, not inferred from scene suffix.
 * @param {string} floor Must be D2F.
 */
export function isK3Sw01Scene775776Source(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const s = K3_SW01_775776_SOURCE;
  const v = Object.values(s.views).find(view => view.sceneIndex === sceneIndex);
  const asset = json?.asset?.extras;
  if (!v || role !== v.role || floor !== 'D2F' || authenticatedGlbSha256 !== s.glbSha256 ||
      json?.scene !== s.defaultScene || json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount || json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount || json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.current !== false ||
      asset?.asBuilt !== false || asset?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const child = json.scenes[sceneIndex];
  const parent = json.scenes[v.parentScene];
  const roots = child?.nodes;
  const formerRoots = parent?.nodes;
  const e = child?.extras;
  const root = json.nodes[s.newRoot];
  const x = root?.extras;
  if (child?.name !== v.sceneName || e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.sourceScene !== v.parentScene || e?.sourceGLBsha256 !== s.parentGlbSha256 ||
      e?.sourceRootOFF !== s.oldRoot || e?.newRootON !== s.newRoot ||
      e?.sourceLinksNewSHA !== 'NOT_BOUND' || e?.sourceLinksNewShaBound !== false ||
      e?.['2026PhysicalSwitchPositionMeasured'] !== false ||
      e?.plexyState !== v.plexi || e?.productSkuInstalledVerified !== false ||
      e?.productionWebGL !== 'NOT_RUN' || e?.humanReview !== 'NOT_RUN' ||
      e?.current !== false || e?.asBuilt !== false ||
      !unique(roots) || !unique(formerRoots) || roots.length !== v.rootCount ||
      formerRoots.length !== v.rootCount ||
      k3Sw01RootsFnv32(roots) !== v.rootFnv32 ||
      k3Sw01RootsFnv32(formerRoots) !== v.parentRootFnv32 ||
      !formerRoots.includes(s.oldRoot) || formerRoots.includes(s.newRoot) ||
      !roots.includes(s.newRoot) || roots.includes(s.oldRoot) ||
      !roots.includes(s.sw04Root) || !formerRoots.includes(s.sw04Root) ||
      roots.includes(11625) !== (v.plexi === 'PLEX_ON') ||
      !exact(roots, formerRoots.map(id => id === s.oldRoot ? s.newRoot : id))) return false;

  if (root?.name !== 'K3_D2F_SW01_WHITE_EXXACT_STYLE_REFERENCE_87x87MM_WORLDHOST_WORK_TEST_HOST_HOLD' ||
      !exact(root?.children, [13511, 13512]) ||
      json.nodes[13511]?.mesh !== 5171 || json.nodes[13512]?.mesh !== 5172 ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh ||
      x?.stableID !== 'D2F-SW-01' || x?.floor !== 'D2F' ||
      x?.sourceOriginalZipDriveID !== s.parentZipDriveId ||
      x?.sourceOriginalGLBSHA256 !== s.parentGlbSha256 ||
      x?.sourcePreviousRoot !== s.oldRoot ||
      x?.activeHostNodeID !== s.hostNode || x?.activeHostMeshID !== s.hostMesh ||
      x?.activeHostPrimitive !== 2 || !exact(x?.activeHostTriangles, [12, 13]) ||
      x?.activeHostPlaneZ_m !== -5.005 || !exact(x?.hostNormalWorld, [0, 0, 1]) ||
      x?.proxyReferenceOuterM !== 0.087 ||
      x?.geometrySource !== 'PROCEDURAL_REFERENCE_NOT_MANUFACTURER_CAD' ||
      x?.hostHold !== true || x?.current !== false || x?.asBuilt !== false ||
      x?.sourceLinksBoundToOutputSHA !== false ||
      x?.productionWebGLVerified !== false || x?.humanReview !== false) return false;
  return true;
}

export function k3Sw01Scene775776SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3Sw01Scene775776Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false,
    publishAllowed: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    physicalHostVerified: false,
    installedProductVerified: false,
  });
}
