/**
 * SHA-bound SOURCE_ONLY receipt for the released K3 D2F-SW02 wall-host donor.
 *
 * No viewer registration, sourceLinks rebind, publisher permission or
 * as-built inference. The caller MUST hash the complete original GLB bytes
 * and supply that SHA, never trust JSON extras, a filename or a URL alone.
 * The original G2b ZIP and its prior QA are immutable.
 */
export const K3_SW02_777778_SOURCE = Object.freeze({
  zipDriveId: '1dxKQCkpiD8-cSrsEzv6RBdxzmW0hOsKJ',
  zipSha256: '2e726077fe93eef536b66741f3a41f715c8dcf96c82b911ee2110e43e469d333',
  glbSha256: '9e12d439ff220a96648d73eb805a759631d28fd9f53d3d366b9ce9a56fe279e9',
  glbBytes: 63860908,
  parentZipDriveId: '1lu-qeiTmygOh-ZNJgZ_VPKK6tlORGnVL',
  parentGlbSha256: '96677bd79cef10d4daf49c5a0143413c55c6481f400e189ae2884b9e9ccf5128',
  defaultScene: 292,
  sceneCount: 779,
  nodeCount: 13516,
  meshCount: 5175,
  materialCount: 815,
  oldRoot: 13243,
  newRoot: 13513,
  sw01Root: 13510,
  sw04Root: 13507,
  hostNode: 12437,
  hostMesh: 4679,
  views: Object.freeze({
    normal: Object.freeze({ role: 'D2F_SW02_NORMAL', sceneIndex: 777, parentScene: 775, plexi: 'PLEX_ON' }),
    service: Object.freeze({ role: 'D2F_SW02_SERVICE', sceneIndex: 778, parentScene: 776, plexi: 'PLEX_OFF' }),
  }),
});

const exact = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((value, index) => value === b[index]);
const unique = a => Array.isArray(a) && new Set(a).size === a.length;
const SHA64 = /^[0-9a-f]{64}$/;

/**
 * Strict source identity and scene/root provenance, not a publication gate.
 * A matching SHA is valid only if computed from all authenticated GLB bytes.
 * Scene indices here are glTF indices, not __sceneN filename guesses.
 */
export function isK3Sw02Scene777778Source(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const s = K3_SW02_777778_SOURCE;
  const v = Object.values(s.views).find(view => view.sceneIndex === sceneIndex);
  if (!v || role !== v.role || floor !== 'D2F' ||
      typeof authenticatedGlbSha256 !== 'string' ||
      !SHA64.test(authenticatedGlbSha256) ||
      authenticatedGlbSha256 !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.asset?.extras?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const child = json.scenes[sceneIndex];
  const parent = json.scenes[v.parentScene];
  const roots = child?.nodes;
  const former = parent?.nodes;
  const e = child?.extras;
  if (typeof child?.name !== 'string' ||
      !child.name.endsWith('__scene' + sceneIndex) ||
      !child.name.includes('SW02') ||
      !child.name.includes('WORK_TEST_HOST_HOLD') ||
      !unique(roots) || !unique(former) ||
      roots.length !== former.length ||
      !former.includes(s.oldRoot) || former.includes(s.newRoot) ||
      !roots.includes(s.newRoot) || roots.includes(s.oldRoot) ||
      !roots.includes(s.sw01Root) || !roots.includes(s.sw04Root) ||
      !former.includes(s.sw01Root) || !former.includes(s.sw04Root) ||
      roots.includes(11625) !== (v.plexi === 'PLEX_ON') ||
      !exact(roots, former.map(id => id === s.oldRoot ? s.newRoot : id)) ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.sourceScene !== v.parentScene ||
      e?.sourceGLBsha256 !== s.parentGlbSha256 ||
      e?.sourceLinksNewShaBound !== false ||
      e?.current !== false || e?.asBuilt !== false ||
      e?.productionWebGL !== 'NOT_RUN' || e?.humanReview !== 'NOT_RUN') return false;

  const node = json.nodes[s.newRoot];
  if (!exact(node?.children, [13514, 13515]) ||
      json.nodes[13514]?.mesh !== 5173 ||
      json.nodes[13515]?.mesh !== 5174 ||
      json.nodes[s.hostNode]?.mesh !== s.hostMesh) return false;

  const normal = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const service = json.scenes[s.views.service.sceneIndex]?.nodes;
  if (!unique(normal) || !unique(service) ||
      !normal.includes(11625) || service.includes(11625) ||
      !exact(normal.filter(id => id !== 11625), service)) return false;
  return true;
}

export function k3Sw02Scene777778SourceReceipt(json, authenticatedSha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3Sw02Scene777778Source(json, authenticatedSha, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD',
    sourceLinksBound: false,
    publishAllowed: false,
    viewerRegistered: false,
    productionWebGLVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    asBuilt: false,
    physicalHostVerified: false,
    installedProductVerified: false,
  });
}
