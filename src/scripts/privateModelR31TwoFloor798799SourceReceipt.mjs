/** Fail-closed SOURCE_ONLY identity receipt for the authenticated R31 2F switch cofit.
 * Supply the SHA256 of independently authenticated GLB bytes, not a caller label.
 * This module is NOT wired to viewer runtime and cannot approve publication. */
export const R31_2F_798799 = Object.freeze({
  zipDriveId: '1SJlVaTJMEbsmIZazniy_AsP_eF1Rhzx6',
  zipSha256: '71530eb34b3e73339f10d1caf1146c00dd18c5e6d15ad79ae2948c4238d8ddfe',
  glbSha256: '615d3208f7bcad76082e250f81efff970b0346a9045b8ddbf3018865e7bf7059',
  glbBytes: 63981424,
  baseGlbSha256: 'caf2c958393c66303a868819d910f7030e3ebfa748b5d490878b49b8cde26c18',
  baseZipDriveId: '1TQg40S4NLZuxgRmedUH7GDj0PMZLfcJZ',
  donorGlbSha256: '5da15ed2717d07bf5645fd0bf32ed7b1b1c65665b621d0080bdf2b59d2d224df',
  donorZipDriveId: '1rhG9GYOVkwUtvDcXClu0dkQwkyLy9KUj',
  originalR31GlbSha256: '9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  defaultScene: 292, sceneCount: 800, nodeCount: 13535, meshCount: 5187,
  materialCount: 815, accessorCount: 11303, bufferViewCount: 11309,
  switchRoots: Object.freeze([
    Object.freeze({legacy:13242,active:13510,stableID:'D2F-SW-01',leaves:[5171,5172]}),
    Object.freeze({legacy:13243,active:13513,stableID:'D2F-SW-02',leaves:[5173,5174]}),
    Object.freeze({legacy:13244,active:13516,stableID:'D2F-SW-03',leaves:[5175,5176]}),
    Object.freeze({legacy:13245,active:13507,stableID:'D2F-SW-04',leaves:[5169,5170]}),
    Object.freeze({legacy:13246,active:13531,stableID:'D2F-SW-05',leaves:[5185,5186]})
  ]),
  protectedRoots: Object.freeze([10976,11727,12242,13505,13482]),
  views: Object.freeze({
    798: Object.freeze({role:'2F_NORMAL',floor:'2F',plexy:'PLEX_ON',parent:774,
      rootCount:204,rootFnv:'416f4f81'}),
    799: Object.freeze({role:'2F_SERVICE',floor:'2F',plexy:'PLEX_OFF',parent:775,
      rootCount:203,rootFnv:'e06c780c'})
  })
});
// Original ordered 2F source roots, not private vertices, models or photos.
const SOURCE_ROOTS_798 = Object.freeze('7356 2658 6431 12440 13164 7361 7366 7367 5323 7368 5327 5629 13165 7369 5835 5836 9263 7370 6435 7371 8003 6472 6473 6474 6475 6476 6517 6518 6519 6831 6832 6564 6565 6994 7372 6653 6729 6730 12437 10795 9573 9574 9575 9576 7904 7905 7906 7907 7908 7909 7932 12136 7979 8024 8025 8026 9264 8199 8895 12106 9197 9198 9199 9200 9257 9332 9911 9912 9761 9338 9763 9764 9762 13141 10976 13505 10555 10556 10557 10558 10559 10560 10561 10562 10656 10657 10659 10763 12633 10771 10772 10773 10774 10775 10776 10777 10778 10779 10780 10781 10782 10783 10784 10785 10786 10787 12635 12636 12637 12638 12639 12144 12634 11304 11319 11339 11340 11341 11342 11343 11344 11345 11346 11347 11348 13227 13228 13229 13230 13231 12264 12265 12266 12267 12268 12269 12270 12271 11535 11536 11624 11625 11645 11648 13319 11662 11677 12157 13491 11727 11721 11722 11723 13510 13513 13516 13507 13531 12358 11858 11891 11907 11574 12622 12051 12137 12165 12166 12167 12168 12242 12244 12246 12248 12315 12312 12316 12431 12432 12433 12434 12435 12643 12623 12624 12625 12626 13488 13494 12503 12504 12497 12505 13247 12695 13482 13252 13253 13309 13325 13499 13500 13502 13506'.split(' ').map(Number));
export const R31_2F_798799_ROOTS = Object.freeze({
  798: SOURCE_ROOTS_798,
  799: Object.freeze(SOURCE_ROOTS_798.filter(id => id !== 11625))
});
export function r31TwoFloorRootsFnv32(roots) {
  if (!Array.isArray(roots)) return null;
  let h=2166136261;
  for(const id of roots){
    if(!Number.isSafeInteger(id)||id<0) return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
export function isR31TwoFloor798799Source(json, authenticatedGlbSha256, sceneIndex, role, floor) {
  const c=R31_2F_798799,v=c.views[sceneIndex],a=json?.asset?.extras;
  if(!v||authenticatedGlbSha256!==c.glbSha256||role!==v.role||floor!==v.floor||
    json?.scene!==c.defaultScene||json?.scenes?.length!==c.sceneCount||
    json?.nodes?.length!==c.nodeCount||json?.meshes?.length!==c.meshCount||
    json?.materials?.length!==c.materialCount||json?.accessors?.length!==c.accessorCount||
    json?.bufferViews?.length!==c.bufferViewCount||
    a?.ModelStage!=='WORK_TEST'||a?.Canonical!==false||a?.current!==false||
    a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN')return false;
  const s=json.scenes[sceneIndex],r=s?.nodes,x=s?.extras;
  const expectedName='Ylisrinne_C80_R31_2F_K3_SW01_SW02_SW03_SW04_SW05_H18116_COFIT_'+
    (sceneIndex===798?'NORMAL':'SERVICE')+'_WORK_TEST_HOST_HOLD__scene'+sceneIndex;
  if(s?.name!==expectedName||x?.stage!=='WORK_TEST_HOST_HOLD'||
    x?.floor!=='2F'||x?.sceneRole!==v.role||x?.plexyState!==v.plexy||
    x?.sourceParentSceneIndex!==v.parent||
    x?.sourceParentGLBSHA256!==c.donorGlbSha256||
    x?.sourceParentZipID!==c.donorZipDriveId||
    x?.currentBaseSceneIndex!==797||x?.currentBaseGLBSHA256!==c.baseGlbSha256||
    x?.currentBaseZipID!==c.baseZipDriveId||
    x?.baseGlbSha256!==c.originalR31GlbSha256||
    x?.cofit!=='EXISTING_2F_ROOTS_SW01_TO_SW05_SOURCE_EXACT_NO_DUPLICATE'||
    x?.sourceLinksForOutputSHA!=='NOT_BOUND'||x?.sourceLinksOutputSHA!=='NOT_BOUND'||
    x?.sourceLinksOutputShaBound!==false||
    x?.current!==false||x?.asBuilt!==false||x?.canonical!==false||
    x?.physicalHostVerified!==false||x?.newGeometry!==false||
    x?.productionWebGL!=='NOT_RUN'||x?.humanReview!=='NOT_RUN'||x?.switchInstallationNotVerified!==true||
    x?.H18116SourceRoleRoot!==13482||
    !Array.isArray(r)||r.length!==v.rootCount||r31TwoFloorRootsFnv32(r)!==v.rootFnv||
    new Set(r).size!==r.length)return false;
  const expected=R31_2F_798799_ROOTS[sceneIndex];
  if(r.some((id,i)=>id!==expected[i]))return false;
  for(const id of c.protectedRoots)if(!r.includes(id))return false;
  if(r.includes(13176)||r.includes(12135)||r.includes(13466)||r.includes(13235))return false;
  if(x?.source2FOnlyRootsPreserved?.join(',')!=='10976,11727,12242,13505')return false;
  const mapping=x?.replaceOnlyLegacy2FSwitchRoots;
  const n=json.nodes;
  for(const sw of c.switchRoots){
    if(mapping?.[sw.legacy]!==sw.active||r.includes(sw.legacy)||!r.includes(sw.active))return false;
    const t=n[sw.active],e=t?.extras;
    if(e?.stableID!==sw.stableID||e?.floor!=='D2F'||e?.current!==false||
      e?.asBuilt!==false||!Array.isArray(t?.children)||t.children.length!==2||
      t.children.some((leaf,i)=>n[leaf]?.mesh!==sw.leaves[i]))return false;
  }
  const living=n[13482],le=living?.extras;
  if(living?.children?.length!==5||le?.presentationOnly!==true||
    le?.sourceLinksBound!==false||le?.exactPhysicalPositionVerified!==false||
    le?.current!==false||le?.asBuilt!==false)return false;
  return true;
}
export function r31TwoFloor798799Receipt(json,sha,sceneIndex,role,floor,component){
  const c=R31_2F_798799;
  const exactSource=isR31TwoFloor798799Source(json,sha,sceneIndex,role,floor);
  const selected=c.switchRoots.find(x=>x.stableID===component);
  return Object.freeze({
    exactSource,componentActive:exactSource&&Boolean(selected),
    rootNode:exactSource&&selected?selected.active:null,
    stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
    current:false,asBuilt:false,productionWebGLVerified:false,humanReview:'NOT_RUN'
  });
}
