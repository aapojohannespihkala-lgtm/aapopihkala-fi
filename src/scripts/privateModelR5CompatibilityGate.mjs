// SOURCE_ONLY preflight, not a runtime loader or permission to publish/apply metadata.
// Requires the caller to calculate SHA-256 independently over raw GLB and R5 ZIP bytes.
export const r5Lock = Object.freeze({
  glb: 'ebff62cbf081473101c5842a55e35707bce07872a36d673ce1a87e3afb63a7d3',
  zip: '2421dcedd1dc9f2c4c4e65c2b3a46ec51c65a059883360f379f3e6a0f1ac458c',
  sidecar: '14869e6b3b3712b76d8a2054a2b905bf86951fa5f35c067f705a1525a86986b6',
  scene: 32, active: 2166, old: 2024, ready: 134, held: 8, retired: 75,
});
const held = new Set([2762,2763,2764,2765,2784,2785,2786,2787]);
const statuses = ['R4C_IDENTICAL_WORLD_AND_CORE','SCENE32_NEW_SOURCE_GATE_READY','SCENE32_NEW_SOURCE_GATE_STOREY_ROLE_HOLD'];
export function auditR5ForLoadedGlb({manifest, records, activeNodeIndices, loadedGlbSha256, sidecarZipSha256, loadedScene, retiredOldCount}={}) {
  const errors=[], fail = (s) => errors.push(s), lock=r5Lock;
  if(loadedGlbSha256!==lock.glb) fail('SOURCE_GLB_SHA_MISMATCH');
  if(sidecarZipSha256!==lock.sidecar) fail('R5_ZIP_SHA_MISMATCH');
  if(loadedScene!==lock.scene) fail('SCENE_MISMATCH');
  if(!manifest || manifest.version!=='20261026_R5_CANDIDATE' || manifest.stage!=='SOURCE_ONLY_WORK_TEST_STAGING_HOLD' ||
    manifest.targetScene!==lock.scene || manifest.publishReady!==false || manifest.viewerReady!==false ||
    manifest.containsModelGLB!==false || manifest.mutatesGeometry!==false || manifest.scene32GLBExtrasModified!==false ||
    !Array.isArray(manifest.sourceGlbSha256) || manifest.sourceGlbSha256[1]!==lock.glb ||
    !Array.isArray(manifest.sourceZipSha256) || manifest.sourceZipSha256[1]!==lock.zip ||
    manifest.activeScopeObjects!==lock.active || manifest.copiedOriginalScopeObjects!==lock.old ||
    manifest.newScopeObjects!==lock.ready+lock.held || manifest.newSourceGated!==lock.ready ||
    manifest.newUnresolved!==lock.held || manifest.inactiveOriginalScopeObjects!==lock.retired) fail('MANIFEST_MISMATCH');
  if(retiredOldCount!==lock.retired) fail('RETIRED_COUNT_MISMATCH');
  if(!Array.isArray(records) || records.length!==lock.active) fail('RECORD_COUNT_MISMATCH');
  if(!Array.isArray(activeNodeIndices) || activeNodeIndices.length!==lock.active ||
    new Set(activeNodeIndices).size!==lock.active ||
    !activeNodeIndices.every(i=>Number.isSafeInteger(i)&&i>=0)) fail('ACTIVE_NODE_SET_INVALID');
  const indices=new Set(), keys=new Set(), counts={};
  for(const row of Array.isArray(records)?records:[]) {
    if(!row || typeof row!=='object') { fail('INVALID_RECORD'); continue; }
    const m=row.r5Mapping, n=m?.targetNodeIndex, status=m?.status;
    if(!Number.isSafeInteger(n) || n<0 || indices.has(n) || row.sourceNodeIndex!==n ||
       m?.targetScene!==lock.scene || !Number.isSafeInteger(m?.targetMeshIndex) ||
       row.sourceMeshIndex!==m.targetMeshIndex) fail('NODE_IDENTITY_INVALID');
    indices.add(n);
    if(typeof row.objectKey!=='string' || !row.objectKey || keys.has(row.objectKey)) fail('OBJECT_KEY_INVALID');
    keys.add(row.objectKey);
    if(!statuses.includes(status)) fail('MAPPING_STATUS_INVALID');
    counts[status]=(counts[status]||0)+1;
    if(status===statuses[0]) {
      // Exactly 21 R4C source objects are HISTORICAL, not present-day claims.
      if(!['ACTIVE_IN_SELECTED_WORKTEST','HISTORICAL'].includes(row.phaseScope) ||
        held.has(n) || m.originalR4CObjectKey!==row.objectKey) fail('OLD_SOURCE_INVALID');
    } else {
      if(row.phaseScope!=='ACTIVE_IN_SELECTED_WORKTEST' ||
         row.identityKind!=='SCENE32_SHA_LOCKED_NEW_NODE' ||
         row.objectKey!==('node@'+lock.glb+':n'+n)) fail('NEW_SOURCE_IDENTITY_INVALID');
      // 98 source-backed K14/K16a nodes may reference earlier nodes. 36 terrace parts
      // and 8 unresolved K14 parts are not required to have an earlier node.
      const old=m?.sourceOldNodeIndex;
      if(old!==null && (!Number.isSafeInteger(old)||old<0||old>=n||
        !Array.isArray(row.scopeEvidence)||!row.scopeEvidence.some(e=>e?.sourceNodeIndex===old))) fail('SOURCE_PROVENANCE_INVALID');
      if(held.has(n)) {
        if(status!==statuses[2] || row.storeyScope!=='UNKNOWN' || row.role!=='UNCLASSIFIED') fail('EIGHT_HOLD_BYPASS');
      } else if(status!==statuses[1] || row.storeyScope==='UNKNOWN' || row.role==='UNCLASSIFIED') fail('NEW_SCOPE_NOT_READY');
    }
  }
  if(Array.isArray(activeNodeIndices) &&
    (indices.size!==activeNodeIndices.length || activeNodeIndices.some(i=>!indices.has(i)))) fail('ACTIVE_JOIN_MISMATCH');
  if((counts[statuses[0]]||0)!==lock.old || (counts[statuses[1]]||0)!==lock.ready ||
     (counts[statuses[2]]||0)!==lock.held || [...held].some(i=>!indices.has(i))) fail('2024_134_8_MISMATCH');
  return {ok:errors.length===0,errors:[...new Set(errors)],checkedRecords:Array.isArray(records)?records.length:0,
    canApply:false,browserTested:false,status:errors.length?'SOURCE_PREFLIGHT_REJECTED':'SOURCE_PREFLIGHT_PASS_ONLY'};
}
