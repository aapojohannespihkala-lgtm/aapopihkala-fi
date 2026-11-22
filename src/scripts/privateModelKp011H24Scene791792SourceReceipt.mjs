/**
 * Fail-closed, SOURCE_ONLY receipt for the real G2b KP-011 H24 visual comparison.
 * The caller must SHA256-authenticate all ORIGINAL GLB bytes before passing
 * their decoded JSON chunk and the verified digest here. A supplied digest
 * string does not, by itself, authenticate the source.
 *
 * This contract does NOT register a viewer scene, permit publication or
 * establish actual hatch opening, removal, swing, service clearance or as-built.
 */
export const H24_VISUAL_REMOVED_SOURCE = Object.freeze({
  zipDriveId: '130eDZnJGp4VghK4uLttSkPKuSdPDdZHN',
  zipSha256: '3ba14463b98fa19adc9cce4a973ce50cbf843fe16bb570244a764b5090a4fbed',
  glbSha256: '4463143e0592ce1c360bb2adb9f3999fb8b759ca3c5529634e02a005a1de7e9c',
  glbBytes: 63940824,
  originalZipDriveId: '1SyK3Tj8Jjb8LC_G4D8Zjhr6uJOmlSVA6',
  originalZipSha256: '6fadf4dfb3f483cd16f111fd0fa51480984a1f264ece26e1e26bd3b234cb286e',
  originalGlbSha256: '9966103080fb273e3bb20076618b6a3afd111e9ba42f3ed20109f2b6528223b9',
  defaultScene: 292, scenes: 793, nodes: 13534, meshes: 5187,
  materials: 815, accessors: 11303, bufferViews: 11309,
  removedDoorRoot: 12632, doorLeaf: 12630, knobLeaf: 12631,
  frame: 12238, frameMesh: 4417, wcRoot: 13167, wcBowl: 1664, wcBowlMesh: 768,
  plexi: 11625,
  switches: Object.freeze([13522,13519,13525,13528,13507,13510,13513,13516,13531]),
  views: Object.freeze({
    normal: Object.freeze({
      index: 791, parent: 789, role: 'NORMAL',
      roots: 499, parentRoots: 500, fnv: '02393009', parentFnv: '70a1e1b9',
      name: 'Ylisrinne_C80_R31_KP011_H24_LOWER_VISUAL_DOOR_REMOVED_NORMAL_WORK_TEST_HOST_HOLD__scene791',
      plexi: true,
    }),
    service: Object.freeze({
      index: 792, parent: 790, role: 'SERVICE',
      roots: 498, parentRoots: 499, fnv: 'c5c0363c', parentFnv: '07e86b62',
      name: 'Ylisrinne_C80_R31_KP011_H24_LOWER_VISUAL_DOOR_REMOVED_SERVICE_WORK_TEST_HOST_HOLD__scene792',
      plexi: false,
    }),
  }),
});
const same = (a,b) => Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((x,i) => x === b[i]);
export function h24RootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let hash = 2166136261;
  for (const value of roots) {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    hash = Math.imul(hash ^ value, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8,'0');
}
export function isH24VisualRemovedSceneSource(json, verifiedOriginalGlbSha256, sceneIndex, role, floor) {
  const spec = H24_VISUAL_REMOVED_SOURCE;
  const view = Object.values(spec.views).find(v => v.index === sceneIndex);
  const asset = json?.asset?.extras;
  if (!view || verifiedOriginalGlbSha256 !== spec.glbSha256 ||
      role !== view.role || floor !== 'D1F' ||
      json?.scene !== spec.defaultScene ||
      json?.scenes?.length !== spec.scenes ||
      json?.nodes?.length !== spec.nodes ||
      json?.meshes?.length !== spec.meshes ||
      json?.materials?.length !== spec.materials ||
      json?.accessors?.length !== spec.accessors ||
      json?.bufferViews?.length !== spec.bufferViews ||
      asset?.ModelStage !== 'WORK_TEST' || asset?.current !== false ||
      asset?.asBuilt !== false || asset?.HUMAN_REVIEW !== 'NOT_RUN' ||
      asset?.canonical !== false) return false;

  const s = json.scenes[view.index], p = json.scenes[view.parent];
  const e = s?.extras, roots = s?.nodes, source = p?.nodes;
  if (s?.name !== view.name || p?.extras?.role !== view.role ||
      e?.stage !== 'WORK_TEST_HOST_HOLD' || e?.nonCurrent !== true ||
      e?.sourceZipDriveID !== spec.originalZipDriveId ||
      e?.sourceZipSHA256 !== spec.originalZipSha256 ||
      e?.sourceGLBSHA256 !== spec.originalGlbSha256 ||
      e?.sourceSceneIndex !== view.parent ||
      e?.removedVisualOnlyRoot !== spec.removedDoorRoot ||
      !same(e?.removedLeaves,[spec.doorLeaf,spec.knobLeaf]) ||
      e?.retainedHatchFrameNode !== spec.frame ||
      e?.noNewGeometry !== true ||
      e?.noAssumedSwingHingeOrRemovalPath !== true ||
      e?.physicalServiceAccessVerified !== false ||
      e?.sourceLinksOutputSHA !== 'NOT_BOUND' ||
      e?.productionWebGLVerified !== false ||
      e?.humanReview !== false ||
      !Array.isArray(roots) || !Array.isArray(source) ||
      roots.length !== view.roots || source.length !== view.parentRoots ||
      new Set(roots).size !== roots.length ||
      new Set(source).size !== source.length ||
      h24RootsFnv32(roots) !== view.fnv ||
      h24RootsFnv32(source) !== view.parentFnv ||
      source.filter(x => x === spec.removedDoorRoot).length !== 1 ||
      !same(roots, source.filter(x => x !== spec.removedDoorRoot)) ||
      roots.includes(spec.removedDoorRoot) ||
      roots.includes(spec.plexi) !== view.plexi ||
      source.includes(spec.plexi) !== view.plexi ||
      !roots.includes(spec.frame) || !roots.includes(spec.wcRoot) ||
      !spec.switches.every(x => roots.includes(x) && source.includes(x))) return false;

  const nodes = json.nodes, door = nodes[spec.removedDoorRoot], frame = nodes[spec.frame];
  if (!same(door?.children,[spec.doorLeaf,spec.knobLeaf]) ||
      door?.extras?.ownerPhotoDriveId !== '16vATBxFzEd1270VKv4wvxCRHYu3O8O5l' ||
      door?.extras?.closedVisualOnly !== true ||
      door?.extras?.doorSwingAndRemovalNotTested !== true ||
      door?.extras?.realHostAndServiceClearanceHold !== true ||
      nodes[spec.doorLeaf]?.mesh !== 4775 ||
      nodes[spec.knobLeaf]?.mesh !== 4776 ||
      frame?.mesh !== spec.frameMesh ||
      frame?.extras?.hostStatus !== 'HOST_HOLD' ||
      frame?.extras?.physicalLocationMeasured !== false ||
      !same(nodes[spec.wcRoot]?.children?.filter(x => x === spec.wcBowl),[spec.wcBowl]) ||
      nodes[spec.wcBowl]?.mesh !== spec.wcBowlMesh) return false;
  return true;
}
export function h24VisualRemovedReceipt(json, sha, sceneIndex, role, floor) {
  return Object.freeze({
    exactSource: isH24VisualRemovedSceneSource(json,sha,sceneIndex,role,floor),
    stage: 'WORK_TEST_HOST_HOLD', sourceLinksBound: false,
    publishAllowed: false, current: false, asBuilt: false,
    productionWebGLVerified: false, humanReview: 'NOT_RUN',
    physicalServiceAccessVerified: false,
  });
}
