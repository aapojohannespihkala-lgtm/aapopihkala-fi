/**
 * SOURCE_ONLY identity gate for the exact original G2b H24 + D1F-SW-06
 * semantic opt-in scenes 793/794. This does not register viewer content.
 *
 * IMPORTANT: caller must authenticate SHA256 of the complete original GLB
 * bytes independently. Passing a matching SHA string alone does not prove
 * provenance. No output-SHA sourceLinks, physical host or publish approval.
 */
export const K3_SW06_H24_SCENE793794 = Object.freeze({
  zipDriveId: '1dJJc-_Niwshht_4FEjqfKz3Zgk1qV2D5',
  zipSha256: 'e9a378103fbf6ae7b93b5af559263b1a203dd6175cba44a471b9af257feddddc',
  glbSha256: '231bb4ff4298403475bf5dd507a92be0254b176f5bf96a5f2fd37822e183b3a4',
  glbBytes: 63950504,
  h24ZipDriveId: '130eDZnJGp4VghK4uLttSkPKuSdPDdZHN',
  h24GlbSha256: '4463143e0592ce1c360bb2adb9f3999fb8b759ca3c5529634e02a005a1de7e9c',
  ancestorZipDriveId: '1SyK3Tj8Jjb8LC_G4D8Zjhr6uJOmlSVA6',
  ancestorZipSha256: '6fadf4dfb3f483cd16f111fd0fa51480984a1f264ece26e1e26bd3b234cb286e',
  ancestorGlbSha256: '9966103080fb273e3bb20076618b6a3afd111e9ba42f3ed20109f2b6528223b9',
  defaultScene: 292, sceneCount: 795, nodeCount: 13535,
  meshCount: 5187, materialCount: 815, accessorCount: 11303, bufferViewCount: 11309,
  oldMarker: 11775, newMarker: 13534, wrongDrain: 11724,
  activeSwitch: 12414, historicalInactiveSwitch: 7996,
  hatchDoor: 12632, hatchFrame: 12238, hatchFrameMesh: 4417,
  wcRoot: 13167, wcBowl: 1664, wcBowlMesh: 768, plexi: 11625,
  views: Object.freeze({
    normal: Object.freeze({
      index: 793, parent: 791, role: 'NORMAL', plexi: true,
      roots: 499, fnv: '6df26af4', parentFnv: '02393009',
      name: 'Ylisrinne_C80_R31_K3_SW06_SEMANTIC_SOURCE_FIX_H24_VISUAL_REMOVAL_NORMAL_WORK_TEST_HOST_HOLD__scene793',
      parentName: 'Ylisrinne_C80_R31_KP011_H24_LOWER_VISUAL_DOOR_REMOVED_NORMAL_WORK_TEST_HOST_HOLD__scene791',
    }),
    service: Object.freeze({
      index: 794, parent: 792, role: 'SERVICE', plexi: false,
      roots: 498, fnv: 'a3a659b1', parentFnv: 'c5c0363c',
      name: 'Ylisrinne_C80_R31_K3_SW06_SEMANTIC_SOURCE_FIX_H24_VISUAL_REMOVAL_SERVICE_WORK_TEST_HOST_HOLD__scene794',
      parentName: 'Ylisrinne_C80_R31_KP011_H24_LOWER_VISUAL_DOOR_REMOVED_SERVICE_WORK_TEST_HOST_HOLD__scene792',
    }),
  }),
});
const same = (a, b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((value, i) => value === b[i]);
export function k3SW06H24RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let hash = 2166136261;
  for (const value of roots) {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    hash = Math.imul(hash ^ value, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
export function isK3SW06H24Scene793794Source(json, authenticatedGlbSHA256, sceneIndex, role, floor) {
  const S = K3_SW06_H24_SCENE793794;
  const view = Object.values(S.views).find(v => v.index === sceneIndex);
  const asset = json?.asset?.extras;
  if (!view || authenticatedGlbSHA256 !== S.glbSha256 ||
      role !== view.role || floor !== 'D1F' ||
      json?.scene !== S.defaultScene || json?.scenes?.length !== S.sceneCount ||
      json?.nodes?.length !== S.nodeCount || json?.meshes?.length !== S.meshCount ||
      json?.materials?.length !== S.materialCount ||
      json?.accessors?.length !== S.accessorCount ||
      json?.bufferViews?.length !== S.bufferViewCount ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.canonical !== false ||
      asset?.current !== false || asset?.asBuilt !== false ||
      asset?.HUMAN_REVIEW !== 'NOT_RUN') return false;
  const selected = json.scenes[view.index], parent = json.scenes[view.parent];
  const e = selected?.extras, pe = parent?.extras;
  const patch = e?.sw06SemanticMarkerPatch, roots = selected?.nodes, prev = parent?.nodes;
  if (selected?.name !== view.name || parent?.name !== view.parentName ||
      pe?.stage !== 'WORK_TEST_HOST_HOLD' ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' || e?.nonCurrent !== true ||
      e?.sourceZipDriveID !== S.ancestorZipDriveId ||
      e?.sourceZipSHA256 !== S.ancestorZipSha256 ||
      e?.sourceGLBSHA256 !== S.ancestorGlbSha256 ||
      e?.sourceSceneIndex !== (view.role === 'NORMAL' ? 789 : 790) ||
      e?.sourceH24ZipDriveId !== S.h24ZipDriveId ||
      e?.sourceH24GLBSHA256 !== S.h24GlbSha256 ||
      e?.sourceParentSceneIndex !== view.parent ||
      e?.removedVisualOnlyRoot !== S.hatchDoor ||
      !same(e?.removedLeaves, [12630, 12631]) ||
      e?.retainedHatchFrameNode !== S.hatchFrame ||
      e?.noNewGeometry !== true || e?.noAssumedSwingHingeOrRemovalPath !== true ||
      e?.physicalServiceAccessVerified !== false ||
      e?.sourceLinksOutputSHA !== 'NOT_BOUND' ||
      e?.productionWebGLVerified !== false || e?.humanReview !== false ||
      patch?.sourceParentSceneIndex !== view.parent ||
      patch?.originalMarkerNode !== S.oldMarker ||
      patch?.newMarkerNode !== S.newMarker ||
      patch?.historicalSourceSwitchNodeInactive !== S.historicalInactiveSwitch ||
      patch?.wrongDrainNodeInOldScene !== S.wrongDrain ||
      patch?.activeVisualSwitchNode !== S.activeSwitch ||
      patch?.sourceReceiptPR !== 'https://github.com/aapojohannespihkala-lgtm/aapopihkala-fi/pull/2172' ||
      patch?.physicalHostVerified !== false ||
      patch?.electricalCircuitVerified !== false ||
      patch?.sourceLinksOutputSHABound !== false ||
      !Array.isArray(roots) || !Array.isArray(prev) ||
      roots.length !== view.roots || prev.length !== view.roots ||
      new Set(roots).size !== roots.length || new Set(prev).size !== prev.length ||
      k3SW06H24RootsFnv32(roots) !== view.fnv ||
      k3SW06H24RootsFnv32(prev) !== view.parentFnv ||
      prev.filter(n => n === S.oldMarker).length !== 1 ||
      !same(roots, prev.map(n => n === S.oldMarker ? S.newMarker : n)) ||
      roots.includes(S.oldMarker) || !roots.includes(S.newMarker) ||
      roots.includes(S.plexi) !== view.plexi ||
      !roots.includes(S.activeSwitch) || !roots.includes(S.hatchFrame) ||
      !roots.includes(S.wcRoot) || roots.includes(S.hatchDoor)) return false;
  const old = json.nodes[S.oldMarker], marker = json.nodes[S.newMarker];
  const frame = json.nodes[S.hatchFrame], wc = json.nodes[S.wcRoot];
  if (old?.mesh !== undefined || marker?.mesh !== undefined ||
      old?.children !== undefined || marker?.children !== undefined ||
      marker?.name !== old?.name ||
      old?.extras?.stableID !== 'D1F-SW-06' ||
      old?.extras?.remapSourceGLBNodeId !== S.wrongDrain ||
      marker?.extras?.remapSourceGLBNodeId !== S.activeSwitch ||
      old?.extras?.existingSourceSwitchNode !== S.historicalInactiveSwitch ||
      marker?.extras?.existingSourceSwitchNode !== S.historicalInactiveSwitch ||
      marker?.extras?.modelAlreadyContainsGeometry !== true ||
      marker?.extras?.physicalWallHost !== 'HOLD_UNVERIFIED' ||
      marker?.extras?.electricalCircuit !== 'NOT_VERIFIED' ||
      marker?.extras?.current !== false || marker?.extras?.asBuilt !== false ||
      marker?.extras?.stage !== 'OWNER_2026_SOURCE_WORK_TEST_HOST_HOLD' ||
      JSON.stringify({ ...old.extras, remapSourceGLBNodeId: S.activeSwitch }) !==
        JSON.stringify(marker.extras) ||
      json.nodes[S.activeSwitch]?.mesh !== 2447 ||
      frame?.mesh !== S.hatchFrameMesh ||
      frame?.extras?.hostStatus !== 'HOST_HOLD' ||
      frame?.extras?.physicalLocationMeasured !== false ||
      !Array.isArray(wc?.children) || !wc.children.includes(S.wcBowl) ||
      json.nodes[S.wcBowl]?.mesh !== S.wcBowlMesh) return false;
  return true;
}
export function k3SW06H24SourceReceipt(json, digest, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isK3SW06H24Scene793794Source(json, digest, sceneIndex, role, floor),
    stage: 'WORK_TEST_HOST_HOLD', sourceLinksBound: false,
    publishAllowed: false, current: false, asBuilt: false,
    physicalHostVerified: false, electricalCircuitVerified: false,
    physicalServiceAccessVerified: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
  });
}
