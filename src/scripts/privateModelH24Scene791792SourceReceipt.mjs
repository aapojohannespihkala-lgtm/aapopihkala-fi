/**
 * H24 closed-hatch visually-removed comparison, original C80 R31 K3 donor.
 * SOURCE_ONLY. authenticatedGlbSha MUST be independently calculated from
 * complete original GLB bytes, never copied from filename/manifest/extras.
 * Scene 791/792 does not show physical removal, opening or service clearance.
 */
export const H24_SCENE791792_SOURCE = Object.freeze({
  zipDriveId: '130eDZnJGp4VghK4uLttSkPKuSdPDdZHN',
  zipSha256: '3ba14463b98fa19adc9cce4a973ce50cbf843fe16bb570244a764b5090a4fbed',
  glbSha256: '4463143e0592ce1c360bb2adb9f3999fb8b759ca3c5529634e02a005a1de7e9c',
  glbBytes: 63940824,
  parentZipDriveId: '1SyK3Tj8Jjb8LC_G4D8Zjhr6uJOmlSVA6',
  parentGlbSha256: '9966103080fb273e3bb20076618b6a3afd111e9ba42f3ed20109f2b6528223b9',
  sceneCount: 793, nodeCount: 13534, meshCount: 5187,
  materialCount: 815, accessorCount: 11303, bufferViewCount: 11309,
  defaultScene: 292,
  hatchRoot: 12632, hatchDoor: 12630, hatchKnob: 12631,
  doorMesh: 4775, knobMesh: 4776,
  hatchFrame: 12238, hatchFrameMesh: 4417,
  wcBowl: 1664, wcBowlMesh: 768,
  plexi: 11625,
  views: Object.freeze({
    normal: Object.freeze({ sceneIndex: 791, parentScene: 789, role: 'NORMAL', plexi: true }),
    service: Object.freeze({ sceneIndex: 792, parentScene: 790, role: 'SERVICE', plexi: false }),
  }),
});
const SHA64 = /^[a-f0-9]{64}$/;
const unique = xs => Array.isArray(xs) && xs.every(x => Number.isInteger(x) && x >= 0) && new Set(xs).size === xs.length;
const sameSet = (a, b) => unique(a) && unique(b) && a.length === b.length && a.every(x => b.includes(x));
/** Structural guard AFTER raw byte authentication, not an authentication function. */
export function isH24Scene791792Source(json, authenticatedGlbSha, sceneIndex, role) {
  const s = H24_SCENE791792_SOURCE;
  const view = Object.values(s.views).find(v => v.sceneIndex === sceneIndex);
  if (!view || view.role !== role || typeof authenticatedGlbSha !== 'string' ||
      !SHA64.test(authenticatedGlbSha) || authenticatedGlbSha !== s.glbSha256 ||
      json?.scene !== s.defaultScene ||
      json?.scenes?.length !== s.sceneCount ||
      json?.nodes?.length !== s.nodeCount ||
      json?.meshes?.length !== s.meshCount ||
      json?.materials?.length !== s.materialCount ||
      json?.accessors?.length !== s.accessorCount ||
      json?.bufferViews?.length !== s.bufferViewCount) return false;
  const original = json.scenes[view.parentScene]?.nodes;
  const compared = json.scenes[view.sceneIndex];
  const active = compared?.nodes;
  if (!unique(original) || !unique(active) ||
      !original.includes(s.hatchRoot) || active.includes(s.hatchRoot) ||
      !sameSet(active, original.filter(x => x !== s.hatchRoot)) ||
      ![s.hatchFrame, s.wcBowl].every(id => original.includes(id) && active.includes(id)) ||
      !compared?.name?.includes('H24') ||
      !compared.name.includes('DOOR_VISUALLY_REMOVED') ||
      !compared.name.includes(view.role) ||
      !compared.name.endsWith('__scene' + view.sceneIndex) ||
      original.includes(s.plexi) !== view.plexi ||
      active.includes(s.plexi) !== view.plexi) return false;
  const hatch = json.nodes[s.hatchRoot];
  if (!sameSet(hatch?.children, [s.hatchDoor, s.hatchKnob]) ||
      json.nodes[s.hatchDoor]?.mesh !== s.doorMesh ||
      json.nodes[s.hatchKnob]?.mesh !== s.knobMesh ||
      json.nodes[s.hatchFrame]?.mesh !== s.hatchFrameMesh ||
      json.nodes[s.wcBowl]?.mesh !== s.wcBowlMesh) return false;
  // NORMAL/SERVICE may differ only in the pre-existing plexiglass root.
  const n = json.scenes[s.views.normal.sceneIndex]?.nodes;
  const v = json.scenes[s.views.service.sceneIndex]?.nodes;
  return unique(n) && unique(v) && n.includes(s.plexi) && !v.includes(s.plexi) &&
    sameSet(n.filter(x => x !== s.plexi), v);
}
export function h24Scene791792SourceReceipt(json, authenticatedGlbSha, sceneIndex, role) {
  return Object.freeze({
    exactSource: isH24Scene791792Source(json, authenticatedGlbSha, sceneIndex, role),
    stage: 'WORK_TEST_HOST_HOLD',
    visualComparisonOnly: true, viewerRegistered: false, publishAllowed: false,
    sourceLinksBound: false, productionWebGLVerified: false,
    humanReview: 'NOT_RUN', current: false, asBuilt: false,
    physicalHatchOpeningVerified: false, physicalServiceClearanceVerified: false,
  });
}
