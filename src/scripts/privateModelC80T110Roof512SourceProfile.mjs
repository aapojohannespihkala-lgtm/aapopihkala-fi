/**
 * C80 512 T110 roof vent: source-only, fail-closed WORK_TEST receipt.
 * The SHA is calculated from the complete authenticated original GLB by the
 * receiver, never inferred from its filename, scene index or mesh name.
 * This module does not register a candidate, authorize sourceLinks or publish.
 */
export const C80_T110_512_GLB_SHA256 = '0fb646042b135f59dfade6ab88f09e5fe12a57a1a3f6fb1927d7a51cbee0f461';
export const C80_T110_512_GLB_BYTES = 55324372;
export const C80_T110_512_ZIP_SHA256 = 'cabbc09a23c751935e67cdee762d9b9d56e7aef1106ca60495079f6421522242';
export const C80_T110_512_ZIP_DRIVE_ID = '1nrEfTvZoKvrof1I_WWxGNrfJkT2Brfd9';
export const C80_T110_512_PARENT_GLB_SHA256 = '78fbc1c65d3a879a3097d16cc9646c098499c839828563ea23afab0ecf5214ab';
export const C80_T110_512_PARENT_ZIP_DRIVE_ID = '1mDeiKxODFn8xST6Y4soKMXjiDSXmnNNF';
export const C80_T110_512_SOURCE_PDF_ID = '1Guc8pv0oSw18bTxP0Rk4-aLtu5erPFWH';

// Internal glTF indices, NOT the delivery filename's __scene suffix.
const rows = [
  [505,488,'2F',186,12242,'66050a9b'],
  [506,490,'2F',186,12242,'e786e529'],
  [507,492,'2F',186,12242,'ebfd3363'],
  [508,501,'BOTH',470,12239,'c7549659'],
  [509,502,'BOTH',470,12239,'fe8d62fd'],
  [510,503,'BOTH',470,12239,'86e93d97'],
  [511,504,'BOTH',470,12239,'2fa5923a'],
];
export const C80_T110_512_SCENES = Object.freeze(Object.fromEntries(rows.map(
  ([scene,parent,floor,rootCount,root,rootHash]) => [scene,Object.freeze({scene,parent,floor,rootCount,root,rootHash})],
)));
export function c80T110Roof512Fnv32(values) {
  if (!Array.isArray(values)) return null;
  let h = 2166136261;
  for (const n of values) {
    if (!Number.isInteger(n) || n < 0) return null;
    h = Math.imul(h ^ n, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8,'0');
}
function reach(nodes, roots) {
  const seen = new Set(), pending = [...roots];
  while (pending.length) {
    const n = pending.pop();
    if (!Number.isInteger(n) || n < 0 || n >= nodes.length) return null;
    if (seen.has(n)) continue;
    seen.add(n);
    const children = nodes[n]?.children;
    if (children !== undefined && !Array.isArray(children)) return null;
    if (children) pending.push(...children);
  }
  return seen;
}
const near = (a,b) => typeof a === 'number' && Number.isFinite(a) && Math.abs(a-b) < 0.000001;

export function isC80T110Roof512SourceScene(json, authenticatedSha, sceneIndex, floor) {
  const spec = C80_T110_512_SCENES[sceneIndex];
  if (authenticatedSha !== C80_T110_512_GLB_SHA256 || !spec ||
      (floor !== undefined && floor !== spec.floor) ||
      json?.scene !== 292 || json.asset?.extras?.ModelStage !== 'WORK_TEST' ||
      json.asset.extras.current !== false || json.asset.extras.asBuilt !== false ||
      json.asset.extras.HUMAN_REVIEW !== 'NOT_RUN' ||
      json.scenes?.length !== 512 || json.nodes?.length !== 12243 ||
      json.meshes?.length !== 4612) return false;
  const s = json.scenes[sceneIndex], p = json.scenes[spec.parent];
  const roots = s?.nodes, parentRoots = p?.nodes, e = s?.extras, delta = e?.t110RoofVentCofit;
  if (s?.name !== 'C80_512_T110_ROOF_VENT_FROM_SCENE_'+spec.parent+'_WORK_TEST_HOST_HOLD' ||
      !Array.isArray(roots) || !Array.isArray(parentRoots) ||
      roots.length !== spec.rootCount || parentRoots.length !== roots.length-1 ||
      !parentRoots.every((n,i) => n === roots[i]) || roots.at(-1) !== spec.root ||
      new Set(roots).size !== roots.length ||
      c80T110Roof512Fnv32(roots) !== spec.rootHash ||
      e.stage !== 'WORK_TEST_HOST_HOLD' || e.floor !== spec.floor ||
      e.current !== false || e.asBuilt !== false ||
      e.sourceLinks !== 'NOT_BOUND' || e.sourceLinksBoundForNewSHA !== false ||
      e.productionWebGLVerified !== false || e.humanReviewApproved !== false ||
      delta?.originalSceneIndex !== spec.parent || delta.appendedRoot !== spec.root ||
      delta.newTubeMesh !== 4611 ||
      delta.sourceExactGlbSha256 !== C80_T110_512_PARENT_GLB_SHA256 ||
      delta.sourceT110Node !== 10145 || delta.sourceRoofNode !== 6642 ||
      delta.modelStage !== 'WORK_TEST_HOST_HOLD' ||
      delta.sourceLinksBound !== false || delta.CURRENT !== false ||
      delta.asBuilt !== false || delta.physicalRoofOpeningVerified !== false) return false;
  const tube = json.nodes[spec.floor === '2F' ? 12240 : 12239];
  const childRoot = json.nodes[12242], oldClone = json.nodes[12241];
  if (tube?.mesh !== 4611 || tube.extras?.m5System !== 'VIEMARI' ||
      tube.extras?.sourceGlbSHA256 !== C80_T110_512_PARENT_GLB_SHA256 ||
      tube.extras?.sourcePdfDriveId !== C80_T110_512_SOURCE_PDF_ID ||
      tube.extras?.existingT110Node !== 10145 ||
      tube.extras?.sourceRoofNode !== 6642 ||
      tube.extras?.roofOpeningCut !== false ||
      tube.extras?.insulationModeled !== false ||
      tube.extras?.flashingModeled !== false ||
      tube.extras?.capModeled !== false ||
      tube.extras?.physicalRoofPointVerified !== false ||
      tube.extras?.sourceLinksBoundForNewSHA !== false ||
      tube.extras?.current !== false || tube.extras?.asBuilt !== false ||
      !near(tube.extras?.visualProtrusionAboveRoof_m,0.45) ||
      !near(tube.extras?.centerWorldGlbXZ_m?.[0],6.315) ||
      !near(tube.extras?.centerWorldGlbXZ_m?.[1],-6.28) ||
      json.meshes[4611] == null ||
      JSON.stringify(childRoot?.children) !== '[12240,12241]' ||
      oldClone?.mesh !== 3701 || oldClone.extras?.m5System !== 'VIEMARI' ||
      oldClone.extras?.sourceNode !== 10145) return false;
  const active = reach(json.nodes,roots);
  if (!active || !active.has(spec.root) ||
      (spec.floor === '2F'
        ? (!active.has(12240) || !active.has(12241) || active.has(12239) || active.has(10145))
        : (!active.has(12239) || !active.has(10145) || active.has(12240) || active.has(12241))) ||
      [10156,10157,10158,10159].some(n=>active.has(n))) return false;
  return true;
}

export function c80T110Roof512Receipt(json, sha, sceneIndex, floor) {
  const exactSource = isC80T110Roof512SourceScene(json,sha,sceneIndex,floor);
  return Object.freeze({
    exactSource,
    stage:'WORK_TEST_HOST_HOLD',
    sourceLinksBound:false,
    publishAllowed:false,
    productionWebGLVerified:false,
    humanReview:'NOT_RUN',
    current:false,
    asBuilt:false,
    physicalRoofOpeningVerified:false,
  });
}
