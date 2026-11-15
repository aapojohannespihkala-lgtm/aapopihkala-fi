/**
 * C80 542 K16 doorframe + K18 stair-wall combined source-only receiver.
 * This is an identity and scene-graph gate, NOT a viewer mount or approval.
 * Callers MUST independently SHA256-authenticate the complete original GLB bytes.
 */
export const C80_542_K16_K18_ZIP_DRIVE_ID = '1pgU2riJV94YJxntdefHIRoHz2xKWJAmi';
export const C80_542_K16_K18_ZIP_SHA256 = '3575106a71967c59da16d7051569ca40ad8f307ea2f820dbdd79c711c3894283';
export const C80_542_K16_K18_GLB_SHA256 = '283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260';
export const C80_542_K16_K18_GLB_BYTES = 55760700;
export const C80_542_K16_K18_K16_SHA256 = '5e2f0c561ac3db0cc1c6f171a14e50dc311ccccb89a28e69478bdef3fee805c3';
export const C80_542_K16_K18_K18_SHA256 = '118653c608ea3139007dfd4a2f51d6d81311eb93f425e4c032b1235c0f8a430b';
export const C80_542_K16_K18_ORIGINAL_SHA256 = '1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_542_K16_K18_OWNER_PDF_ID = '1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT';

// Exact glTF scene indices, not a file suffix, UI labels, or the default scene.
// Parent scenes 530-535 are K16 only, inherited exactly in this combined GLB.
const parentFns = ['d3214bba', 'b6394bd0', '8c0e83bc', '13d729cc', 'bf8b9dd2', '11164159'];
const outputFns = ['63ff303e', 'b6394bd0', '4f8b7108', 'a4ff7790', '4d2f3e6e', '0c8bff25'];
export const C80_542_K16_K18_SCENES = Object.freeze(Object.fromEntries(
 Array.from({length: 6}, (_, i) => [536 + i, Object.freeze({
  scene: 536 + i, parent: 530 + i, floor: i === 0 ? '1F' : i === 1 ? '2F' : 'BOTH',
  rootCount: i === 0 ? 294 : i === 1 ? 190 : 477,
  parentFnv: parentFns[i], rootFnv: outputFns[i], active: i !== 1
 })])
));

export function c80542RootFnv32(nodes) {
 if (!Array.isArray(nodes) || nodes.some(v => !Number.isInteger(v) || v < 0)) return null;
 let h = 2166136261;
 for (const id of nodes) h = Math.imul(h ^ id, 16777619) >>> 0;
 return h.toString(16).padStart(8, '0');
}
const eq = (a, b) => Array.isArray(a) && Array.isArray(b) &&
 a.length === b.length && a.every((v, i) => v === b[i]);
function reach(nodes, roots) {
 const seen = new Set(), stack = [...roots];
 while (stack.length) {
  const i = stack.pop();
  if (!Number.isInteger(i) || i < 0 || i >= nodes.length || !nodes[i]) return null;
  if (seen.has(i)) continue;
  seen.add(i);
  if (nodes[i].children !== undefined && !Array.isArray(nodes[i].children)) return null;
  if (nodes[i].children) stack.push(...nodes[i].children);
 }
 return seen;
}

export function isC80542K16K18GeometryEvidence(j) {
 if (j?.scene !== 292 || j.scenes?.length !== 542 || j.nodes?.length !== 12258 ||
     j.meshes?.length !== 4624 || j.accessors?.length !== 10411 ||
     j.bufferViews?.length !== 10415 || j.asset?.extras?.ModelStage !== 'WORK_TEST' ||
     j.asset.extras.current !== false || j.asset.extras.asBuilt !== false ||
     j.asset.extras.HUMAN_REVIEW !== 'NOT_RUN') return false;
 const [k16a, k16b, k18] = [j.nodes[12255], j.nodes[12256], j.nodes[12257]];
 if (k16a?.name !== 'K16_CORRECTED_V48_D1F_700_WEST_JAMB_X2620_2820' ||
     k16a.mesh !== 4621 || k16b?.name !== 'K16_CORRECTED_V48_D1F_700_OPENING_HEAD_ABOVE_Y2090' ||
     k16b.mesh !== 4622 ||
     k18?.name !== 'K16_K18_COFIT_WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL' ||
     k18.mesh !== 4623 || j.nodes[11309]?.mesh !== 4199) return false;
 for (const [node, oldNode, oldMesh, mesh, accessor] of [[k16a, 9382, 3332, 4621, 10408], [k16b, 9384, 3334, 4622, 10409]]) {
  const e = node.extras, p = j.meshes[mesh]?.primitives?.[0], a = j.accessors[accessor];
  if (e?.stage !== 'WORK_TEST_NONCURRENT' || e?.originalNodeIndex !== oldNode ||
      e?.originalMeshIndex !== oldMesh || e?.sourceFaceTemplateNodeIndex !== 9383 ||
      e?.ownerCorrection !== 'K16_20261115_DOOR_FACE_SPIKE_REPAIR' ||
      e?.repairedDamagedVertexCount !== 12 || e?.physicalHostVerified !== false ||
      e?.sourceLinksBound !== false || e?.current !== false || e?.asBuilt !== false ||
      j.nodes[oldNode]?.mesh !== oldMesh || p?.attributes?.POSITION !== accessor ||
      p?.attributes?.NORMAL !== 6325 || p?.indices !== 6326 || p?.material !== 333 ||
      a?.componentType !== 5126 || a?.type !== 'VEC3' || a?.count !== 24) return false;
 }
 const e = k18.extras, me = j.meshes[4623]?.extras, p = j.meshes[4623]?.primitives?.[0], a = j.accessors[10410];
 return e?.stage === 'WORK_TEST_HOST_HOLD' && e?.sourceNodeIndex === 11309 &&
  e?.sourceMeshIndex === 4199 && e?.preservedPatchTriangles === 10 &&
  e?.preservedSlabEdgeTriangles === 10 && e?.excludedUnderstairWallTriangles === 8 &&
  e?.ownerPDF === C80_542_K16_K18_OWNER_PDF_ID && e?.ownerPage === 18 &&
  e?.current === false && e?.asBuilt === false && e?.sourceLinksBound === false &&
  e?.HUMAN_REVIEW === 'NOT_RUN' && e?.productionWebGLVerified === false &&
  e?.cofitK16DonorGlbSHA256 === C80_542_K16_K18_K16_SHA256 &&
  e?.cofitK18DonorGlbSHA256 === C80_542_K16_K18_K18_SHA256 &&
  me?.stage === 'WORK_TEST_HOST_HOLD' && me?.originalMeshIndex === 4199 &&
  me?.originalNodeIndex === 11309 && me?.preservedTriangles === 20 &&
  me?.removedTriangles === 8 && eq(me?.retainedParts, ['HOLE_PATCH_10tri', 'SLAB_EDGE_10tri']) &&
  me?.sourceGLBSHA256 === C80_542_K16_K18_ORIGINAL_SHA256 && me?.notAsBuilt === true &&
  p?.attributes?.POSITION === 9129 && p?.indices === 10410 && p?.material === 333 &&
  a?.componentType === 5125 && a?.type === 'SCALAR' && a?.count === 60;
}

// authenticatedSha must be computed on complete GLB bytes by the caller.
export function isC80542K16K18SourceScene(json, authenticatedSha, sceneIndex, floor = null) {
 const selected = C80_542_K16_K18_SCENES[sceneIndex];
 if (!selected || authenticatedSha !== C80_542_K16_K18_GLB_SHA256 ||
     (floor !== null && floor !== selected.floor) || !isC80542K16K18GeometryEvidence(json)) return false;
 for (const row of Object.values(C80_542_K16_K18_SCENES)) {
  const before = json.scenes[row.parent], after = json.scenes[row.scene];
  const old = before?.nodes, next = after?.nodes, e = after?.extras, co = e?.cofitK16K18;
  if (before?.name !== 'C80_536_K16_DOOR_HEAD_WESTJAMB_RECTIFIED_FROM_530_SCENE_' + (row.parent - 6) + '_WORK_TEST_HOST_HOLD' ||
      after?.name !== 'C80_542_WPD_K16_DOOR_K18_STAIR_COFIT_FROM_C80_536_SCENE_' + row.parent + '_' + row.floor + '_WORK_TEST_HOST_HOLD' ||
      !Array.isArray(old) || !Array.isArray(next) || old.length !== row.rootCount ||
      next.length !== row.rootCount || new Set(old).size !== row.rootCount ||
      new Set(next).size !== row.rootCount ||
      c80542RootFnv32(old) !== row.parentFnv || c80542RootFnv32(next) !== row.rootFnv ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' || e?.floor !== row.floor ||
      e?.sourceSceneIndex !== row.parent || e?.sourceLinksBindingVerified !== false ||
      e?.physicalHiddenRouteVerified !== false || e?.productionWebGLVerified !== false ||
      e?.humanReviewApproved !== false || e?.asBuilt !== false ||
      co?.parentScene !== row.parent || co?.parentGLBSHA256 !== C80_542_K16_K18_K16_SHA256 ||
      co?.K18DonorScene !== row.parent || co?.K18DonorGLBSHA256 !== C80_542_K16_K18_K18_SHA256 ||
      co?.K18CorrectedNode !== (row.active ? 12257 : null) ||
      co?.K18OriginalSourceNode !== (row.active ? 11309 : null) ||
      !eq(co?.K16CorrectedNodes, row.active ? [12255, 12256] : []) ||
      co?.originalC80530GLBSHA256 !== C80_542_K16_K18_ORIGINAL_SHA256 ||
      co?.K18WallTrianglesOmitted !== (row.active ? 8 : 0) ||
      co?.K18HolePatchTrianglesPreserved !== (row.active ? 10 : 0) ||
      co?.K18SlabEdgeTrianglesPreserved !== (row.active ? 10 : 0) || co?.current !== false ||
      co?.asBuilt !== false || co?.sourceLinksBound !== false ||
      co?.physicalHostVerified !== false || co?.productionWebGLVerified !== false ||
      co?.humanReview !== 'NOT_RUN' || co?.publishAllowed !== false) return false;
  const expected = row.active ? old.map(v => v === 11309 ? 12257 : v) : old;
  if (!eq(next, expected) || (row.active && old.filter(v => v === 11309).length !== 1)) return false;
  const live = reach(json.nodes, next);
  if (!live || live.has(11309) || live.has(12257) !== row.active ||
      live.has(12255) !== row.active || live.has(12256) !== row.active) return false;
 }
 return true;
}

export function c80542K16K18SourceReceipt(json, sha, sceneIndex, floor) {
 return Object.freeze({
  exactSource: isC80542K16K18SourceScene(json, sha, sceneIndex, floor),
  sourceOnly: true, sourceLinksBound: false, publishAllowed: false,
  current: false, asBuilt: false, physicalHostVerified: false,
  productionWebGLVerified: false, humanReview: 'NOT_RUN'
 });
}
