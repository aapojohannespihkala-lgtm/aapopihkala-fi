/**
 * Source-only association for existing D1F-SW-05: two stacked photo rockers in
 * ONE visible frame. No new switch geometry or electrical circuit inference.
 *
 * Caller MUST authenticate the SHA256 of all original GLB bytes separately.
 * A filename, __sceneNN label, metadata assertion or a matching node name does
 * not authenticate a source. This module cannot publish or bind sourceLinks.
 */
export const K3_D1F_SW05_VISUAL_SOURCE = Object.freeze({
  zipDriveId: '12hlWp4-qZgBbqkwAS3sXBKQvRhRrRvVh',
  zipSha256: 'c1fac317e60d637e8cb23192943448aeea61fc5db9d7b9b5cb39d22bb5742928',
  glbSha256: 'e16bb80f8bee2eeeeecdf1d3de1e5c2f392b224ea77fb164e208ea37dc4d3a8f',
  glbBytes: 63919056,
  defaultScene: 292, sceneCount: 789, nodeCount: 13531,
  meshCount: 5185, materialCount: 815, accessorCount: 11299,
  bufferViewCount: 11305,
  parentGlbSha256: '4393ec07c62d0eabf434d76609f61e072454be0a89d4586d9f4a78af0a3e18a2',
  marker: 11772, visualRoot: 12134,
  visualChildren: Object.freeze([12131, 12132, 12133]),
  visualMeshes: Object.freeze([4565, 4566, 4567]),
  inactiveSchematicNodes: Object.freeze([11772, 13203, 13204]),
  retainedSwitchRoots: Object.freeze([13507,13510,13513,13516,13519,13522,13525,13528]),
  photoSourceDriveId: '1nUwNXJnIzkKgimJiXEopwpyYm9pkY57C',
  views: Object.freeze({
    normal: Object.freeze({
      index: 787, parent: 785, role: 'NORMAL',
      roots: 500, parentRoots: 499,
      rootFnv: '1b3d1b1a', parentFnv: '9f0a6466', plexi: true,
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_NORMAL_WORK_TEST_HOST_HOLD__scene787',
    }),
    service: Object.freeze({
      index: 788, parent: 786, role: 'SERVICE',
      roots: 499, parentRoots: 498,
      rootFnv: '0ed8f1e1', parentFnv: '97b603e3', plexi: false,
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_SERVICE_WORK_TEST_HOST_HOLD__scene788',
    }),
  }),
});
const exact = (a,b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((v,i) => v === b[i]);
export function sw05RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let hash = 2166136261;
  for (const id of roots) {
    if (!Number.isSafeInteger(id) || id < 0) return null;
    hash = Math.imul(hash ^ id, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8,'0');
}
/** The original GLB SHA must be independently authenticated over complete bytes. */
export function isK3D1fSw05VisualSource(
  json, authenticatedGlbSha256, sceneIndex, role, floor,
) {
  const s=K3_D1F_SW05_VISUAL_SOURCE;
  const v=Object.values(s.views).find(x=>x.index===sceneIndex);
  const asset=json?.asset?.extras;
  if (!v || role!==v.role || floor!=='D1F' ||
      authenticatedGlbSha256!==s.glbSha256 ||
      json?.scene!==s.defaultScene ||
      json?.scenes?.length!==s.sceneCount ||
      json?.nodes?.length!==s.nodeCount ||
      json?.meshes?.length!==s.meshCount ||
      json?.materials?.length!==s.materialCount ||
      json?.accessors?.length!==s.accessorCount ||
      json?.bufferViews?.length!==s.bufferViewCount ||
      asset?.ModelStage!=='WORK_TEST' || asset?.current!==false ||
      asset?.asBuilt!==false || asset?.HUMAN_REVIEW!=='NOT_RUN') return false;
  const scene=json.scenes[sceneIndex], parent=json.scenes[v.parent];
  const roots=scene?.nodes, old=parent?.nodes, e=scene?.extras;
  if (scene?.name!==v.name || e?.stage!=='WORK_TEST_HOST_HOLD' ||
      e?.role!==v.role || e?.sourceParentScene!==v.parent ||
      e?.sourceOriginalGLBSHA256!==s.parentGlbSha256 ||
      e?.newD1FSW04Root!==13528 ||
      e?.current!==false || e?.asBuilt!==false ||
      e?.humanReview!==false || e?.productionWebGLVerified!==false ||
      e?.sourceLinksBoundToOutputSHA!==false ||
      !Array.isArray(roots) || !Array.isArray(old) ||
      roots.length!==v.roots || old.length!==v.parentRoots ||
      new Set(roots).size!==roots.length || new Set(old).size!==old.length ||
      sw05RootsFnv32(roots)!==v.rootFnv || sw05RootsFnv32(old)!==v.parentFnv ||
      !exact(roots,[...old,13528]) ||
      !roots.includes(s.visualRoot) || !old.includes(s.visualRoot) ||
      !s.retainedSwitchRoots.every(n=>roots.includes(n)) ||
      s.inactiveSchematicNodes.some(n=>roots.includes(n) || old.includes(n)) ||
      roots.includes(11625)!==v.plexi ||
      old.includes(11625)!==v.plexi) return false;
  const marker=json.nodes[s.marker], mx=marker?.extras;
  const root=json.nodes[s.visualRoot], rx=root?.extras;
  if (marker?.name!=='D1F-SW-05_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT' ||
      mx?.stableID!=='D1F-SW-05' || mx?.floor!=='D1F' ||
      !exact(mx?.sourceMarkerCenter_px,[657,977]) ||
      mx?.physicalWallHost!=='HOLD_UNVERIFIED' ||
      mx?.current!==false || mx?.asBuilt!==false ||
      root?.name!=='MJ89_D_D1F_SW05_EXISTING_SINGLE_SWITCH_CORRECTED_TO_TWO_ROCKER_ONE_FRAME_HOST_WORK_TEST_HOLD' ||
      !exact(root?.children,s.visualChildren) ||
      !exact(root?.translation,[0,0,0.269]) ||
      rx?.sourceRootIndex!==s.marker || rx?.noSecondDevice!==true ||
      rx?.photoMorphology!=='TWO_STACKED_ROCKERS_ONE_SWITCH_FRAME' ||
      rx?.sourceBackWallNode!==7221 ||
      rx?.sourceWallFaceGLTF_Z_m!==-5.092 ||
      rx?.correctedFrameBackZ_m!==-5.093 ||
      rx?.shiftZ_m_WORK_ASSUMPTION!==0.269 ||
      rx?.physicalXYZ!=='UNKNOWN' || rx?.electricalCircuit!=='UNKNOWN' ||
      rx?.sourceLinksBindingVerified!==false ||
      rx?.stage!=='PHOTO_RELATIVE_WORK_TEST_HOST_HOLD' ||
      rx?.current!==false || rx?.asBuilt!==false) return false;
  for (let i=0;i<s.visualChildren.length;i++) {
    const node=json.nodes[s.visualChildren[i]];
    if (node?.mesh!==s.visualMeshes[i] ||
        node?.extras?.photoSource!==s.photoSourceDriveId ||
        (i>0 && node?.extras?.asBuilt!==false) ||
        (i===0 && (node?.extras?.sameMeshAsSource!==true ||
          node?.extras?.sourceNodeIndex!==11773))) return false;
  }
  return true;
}
export function k3D1fSw05VisualSourceReceipt(
  json, authenticatedSha, sceneIndex, role, floor,
) {
  return Object.freeze({
    exactSource: isK3D1fSw05VisualSource(json,authenticatedSha,sceneIndex,role,floor),
    stage:'WORK_TEST_HOST_HOLD',
    association: 'D1F-SW-05_VISIBLE_ROOT_12134_ONE_FRAME_TWO_ROCKERS',
    sourceLinksBound:false, publishAllowed:false, current:false, asBuilt:false,
    physicalHostVerified:false, electricalCircuitVerified:false,
    productionWebGLVerified:false, humanReview:'NOT_RUN',
  });
}
