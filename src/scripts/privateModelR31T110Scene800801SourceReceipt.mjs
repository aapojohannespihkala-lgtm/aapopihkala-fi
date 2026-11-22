/** R31 T110 2F source-exact duplicate removal, SOURCE_ONLY WORK_TEST/HOST_HOLD.
 * The authenticated GLB SHA must be calculated from the raw GLB. This module
 * is not connected to the viewer or publisher and never authorizes publishing.
 */
export const R31_T110_800801 = Object.freeze({
  zipDriveId: '117pMxV_NkKip-5ZcWkM12wlt-sqMIV_L',
  zipSha256: '0bc2596d5e2ea0633f91ba2b951fc26ea70f89191f35c34766944a77d7f2ab0f',
  glbSha256: '3e96b551164eb05c3207d411e93b06188dae55aa027b73e23b6e310c72f58a87',
  glbBytes: 63990644,
  sourceGlbSha256: '615d3208f7bcad76082e250f81efff970b0346a9045b8ddbf3018865e7bf7059',
  defaultScene: 292, sceneCount: 802, nodeCount: 13536,
  meshCount: 5187, materialCount: 815, accessorCount: 11303, bufferViewCount: 11309,
  removedDuplicateRoot: 13505, replacementRoot: 13535,
  redundantWaterNode: 10146, retainedSewerNode: 12241,
  sewerRoot: 12242, roofVentNode: 12240, duplicateMesh: 3701, roofVentMesh: 4611,
  views: Object.freeze({
    800: Object.freeze({from: 798, role: '2F_NORMAL', plexy: 'PLEX_ON',
      sourceRoots: 204, sourceFnv: '416f4f81', roots: 204, outputFnv: '70a9afa3'}),
    801: Object.freeze({from: 799, role: '2F_SERVICE', plexy: 'PLEX_OFF',
      sourceRoots: 203, sourceFnv: 'e06c780c', roots: 203, outputFnv: 'ce36924a'})
  })
});
export function r31T110RootFnv32(ids) {
  if (!Array.isArray(ids)) return null;
  let h = 2166136261;
  for (const id of ids) {
    if (!Number.isSafeInteger(id) || id < 0) return null;
    h = Math.imul(h ^ id, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
const equalArray = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((value, i) => value === b[i]);

/** Only the exact authenticated bytes and their unchanged source graph pass. */
export function isR31T110Scene800801Source(json, authenticatedSha256, sceneIndex, role, floor) {
  const c = R31_T110_800801, view = c.views[sceneIndex], asset = json?.asset?.extras;
  if (!view || authenticatedSha256 !== c.glbSha256 || role !== view.role ||
      floor !== '2F' || json?.scene !== c.defaultScene ||
      json?.scenes?.length !== c.sceneCount || json?.nodes?.length !== c.nodeCount ||
      json?.meshes?.length !== c.meshCount || json?.materials?.length !== c.materialCount ||
      json?.accessors?.length !== c.accessorCount ||
      json?.bufferViews?.length !== c.bufferViewCount ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.Canonical !== false ||
      asset?.current !== false || asset?.asBuilt !== false ||
      asset?.HUMAN_REVIEW !== 'NOT_RUN') return false;

  const before = json.scenes[view.from], after = json.scenes[sceneIndex];
  const src = before?.nodes, dst = after?.nodes, m = after?.extras;
  if (!Array.isArray(src) || !Array.isArray(dst) ||
      src.length !== view.sourceRoots || dst.length !== view.roots ||
      r31T110RootFnv32(src) !== view.sourceFnv ||
      r31T110RootFnv32(dst) !== view.outputFnv ||
      new Set(src).size !== src.length || new Set(dst).size !== dst.length ||
      !src.includes(c.removedDuplicateRoot) || src.includes(c.replacementRoot) ||
      dst.includes(c.removedDuplicateRoot) || !dst.includes(c.replacementRoot) ||
      !src.includes(c.sewerRoot) || !dst.includes(c.sewerRoot) ||
      !dst.includes(13482) || [13510,13513,13516,13507,13531].some(id => !dst.includes(id)) ||
      [12135,13466,13235,13176].some(id => dst.includes(id))) return false;
  // The sole permitted source-root difference preserves order and all other roots.
  if (!src.every((id,i) => dst[i] ===
      (id === c.removedDuplicateRoot ? c.replacementRoot : id))) return false;

  const expectedName = 'Ylisrinne_R31_T110_D2F_2F_' +
    (sceneIndex === 800 ? 'NORMAL' : 'SERVICE') +
    '_SOURCE_DEDUP_WORK_TEST_HOST_HOLD__scene' + sceneIndex;
  if (after?.name !== expectedName ||
      m?.stage !== 'WORK_TEST_HOST_HOLD' || m?.floor !== '2F' ||
      m?.sceneRole !== view.role || m?.plexyState !== view.plexy ||
      m?.sourceScene !== view.from || m?.sourceRoot !== c.removedDuplicateRoot ||
      m?.newRoot !== c.replacementRoot ||
      m?.excludedDuplicateNode !== c.redundantWaterNode ||
      m?.retainedSourceNode !== c.retainedSewerNode ||
      m?.cofit !== 'EXISTING_2F_ROOTS_SW01_TO_SW05_SOURCE_EXACT_NO_DUPLICATE' ||
      m?.sourceLinksForOutputSHA !== 'NOT_BOUND' ||
      m?.sourceLinksOutputSHA !== 'NOT_BOUND' ||
      m?.sourceLinksOutputShaBound !== false ||
      m?.sourceLinksBoundForOutputSHA !== false ||
      m?.physicalHostVerified !== false || m?.newGeometry !== false ||
      m?.current !== false || m?.asBuilt !== false || m?.canonical !== false ||
      m?.productionWebGL !== 'NOT_RUN' || m?.humanReview !== 'NOT_RUN') return false;

  const nodes = json.nodes, old = nodes[c.removedDuplicateRoot],
    replacement = nodes[c.replacementRoot], water = nodes[c.redundantWaterNode],
    sewer = nodes[c.retainedSewerNode], sewerRoot = nodes[c.sewerRoot],
    roofVent = nodes[c.roofVentNode];
  if (!Array.isArray(old?.children) || old.children.length !== 33 ||
      old.children.filter(id => id === c.redundantWaterNode).length !== 1 ||
      !equalArray(replacement?.children,
        old.children.filter(id => id !== c.redundantWaterNode)) ||
      replacement.children.length !== 32 ||
      replacement?.extras?.stage !== 'WORK_TEST_HOST_HOLD' ||
      replacement?.extras?.current !== false || replacement?.extras?.asBuilt !== false ||
      water?.mesh !== c.duplicateMesh || sewer?.mesh !== c.duplicateMesh ||
      water?.extras?.m5System !== 'VESI' ||
      sewer?.extras?.m5System !== 'VIEMARI' ||
      !equalArray(water.matrix, sewer.matrix) ||
      !equalArray(sewerRoot?.children, [c.roofVentNode, c.retainedSewerNode]) ||
      roofVent?.mesh !== c.roofVentMesh ||
      roofVent?.extras?.m5System !== 'VIEMARI' ||
      roofVent?.extras?.asBuilt !== false) return false;
  return true;
}
export function r31T110Scene800801Receipt(json, sha, sceneIndex, role, floor) {
  const exactSource = isR31T110Scene800801Source(json,sha,sceneIndex,role,floor);
  return Object.freeze({exactSource, sourceScene: exactSource ? R31_T110_800801.views[sceneIndex].from : null,
    redundantMeshInstancesRemoved: exactSource ? 1 : 0,
    sourceLinksBound: false, publishAllowed: false,
    stage: 'WORK_TEST_HOST_HOLD', current: false, asBuilt: false,
    physicalRoofHostVerified: false, productionWebGLVerified: false, humanReview: 'NOT_RUN'});
}
