/** Exact SOURCE_ONLY receipt for the combined R31 H1811-6 + KORJ7-04 + L5 GLB.
 * The caller must independently SHA256-hash actual authenticated GLB bytes.
 * A supplied SHA-shaped string is not provenance proof.
 * No viewer runtime, sourceLinks, publication or as-built approval. */
export const R31_3DONOR_UNIFIED = Object.freeze({
  zipDriveId:'1rhG9GYOVkwUtvDcXClu0dkQwkyLy9KUj',
  zipSha256:'393c4cd356f913e5b1c12896a232557b943451347a871423205620ba996442b9',
  glbSha256:'5da15ed2717d07bf5645fd0bf32ed7b1b1c65665b621d0080bdf2b59d2d224df',
  glbBytes:63862632,
  baseGlbSha256:'9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3',
  defaultScene:292,sceneCount:778,nodeCount:13507,meshCount:5169,
  materialCount:815,accessorCount:11267,bufferViewCount:11273,
  roots:Object.freeze({jamb:12135,legacyS1:13235,newS1:13466,oldKitchen:13176,living:13482}),
  views:Object.freeze({
    773:Object.freeze({role:'D1F_SOURCE_REVIEW',floor:'1F',rootCount:301,rootsFNV:'ad7b890a',active:['jamb','newS1']}),
    774:Object.freeze({role:'D2F_NORMAL',floor:'2F',rootCount:204,rootsFNV:'bf25f6fe',active:['living']}),
    775:Object.freeze({role:'D2F_SERVICE',floor:'2F',rootCount:203,rootsFNV:'7eaee9d7',active:['living']}),
    776:Object.freeze({role:'BOTH_NORMAL',floor:'BOTH',rootCount:500,rootsFNV:'03dd651d',active:['jamb','newS1','living']}),
    777:Object.freeze({role:'BOTH_SERVICE',floor:'BOTH',rootCount:499,rootsFNV:'5a6b8042',active:['jamb','newS1','living']}),
  }),
});
export function r31UnifiedRootsFnv32(roots){
  if(!Array.isArray(roots)) return null;
  let h=2166136261;
  for(const n of roots){
    if(!Number.isSafeInteger(n)||n<0) return null;
    h=Math.imul(h^n,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
export function isR31Unified3DonorSource(json,authenticatedGlbSha256,sceneIndex,role,floor){
  const c=R31_3DONOR_UNIFIED,v=c.views[sceneIndex],a=json?.asset?.extras;
  if(!v||authenticatedGlbSha256!==c.glbSha256||role!==v.role||floor!==v.floor||
    json?.scene!==c.defaultScene||json?.scenes?.length!==c.sceneCount||
    json?.nodes?.length!==c.nodeCount||json?.meshes?.length!==c.meshCount||
    json?.materials?.length!==c.materialCount||json?.accessors?.length!==c.accessorCount||
    json?.bufferViews?.length!==c.bufferViewCount||a?.ModelStage!=='WORK_TEST'||
    a?.Canonical!==false||a?.current!==false||a?.asBuilt!==false||
    a?.HUMAN_REVIEW!=='NOT_RUN')return false;
  const s=json.scenes[sceneIndex],roots=s?.nodes,x=s?.extras;
  const requiredName='Ylisrinne_C80_R31_3DONOR_COFIT_'+v.role+
    '_SOURCE_REVIEW_WORK_TEST_HOST_HOLD__scene'+sceneIndex;
  if(s?.name!==requiredName||x?.stage!=='WORK_TEST_HOST_HOLD'||x?.sceneRole!==v.role||
    x?.cofit!=='H1811-6+KORJ7-04+L5'||x?.baseGlbSha256!==c.baseGlbSha256||
    x?.current!==false||x?.asBuilt!==false||x?.humanReview!=='NOT_RUN'||
    (x?.sourceLinksOutputSHA!==undefined&&x?.sourceLinksOutputSHA!=='NOT_BOUND')||
    x?.sourceLinksOutputShaBound===true||x?.sourceLinksForNewShaBound===true||
    !Array.isArray(roots)||roots.length!==v.rootCount||new Set(roots).size!==roots.length||
    r31UnifiedRootsFnv32(roots)!==v.rootsFNV)return false;
  const n=json.nodes,r=c.roots;
  if(roots.includes(r.legacyS1)||roots.includes(r.oldKitchen))return false;
  for(const [key,id] of Object.entries(r)){
    if(roots.includes(id)!==v.active.includes(key))return false;
  }
  if(v.active.includes('jamb')){
    const t=n[r.jamb],e=t?.extras;
    if(t?.name!=='OM_KORJ7_04_V49_D1F_RIGHT_JAMB_COW_RECTANGULAR_WORK_TEST'||
      t?.mesh!==4568||e?.sourceLinksVerified!==false||e?.unmeasuredHost!==true||
      e?.current!==false||e?.asBuilt!==false||e?.humanReview!=='NOT_RUN')return false;
  }
  if(v.active.includes('newS1')){
    const t=n[r.newS1],e=t?.extras;
    if(t?.name!=='D1F_S1_OWNER_CONFIRMED_FOUR_HANDLES_R31_R300_E220S_WORK_TEST_HOST_HOLD_ROOT__scene749'||
      e?.owner4HandlesPhotoProxy?.ownerConfirmedCount!==4||
      e?.owner4HandlesPhotoProxy?.humanReview!=='NOT_RUN'||
      e?.canPublish!==false||e?.current!==false||e?.asBuilt!==false||
      !Array.isArray(t.children)||!t.children.includes(12620)||
      n[12620]?.extras?.physicalConnectionsVerified!==0)return false;
  }
  if(v.active.includes('living')){
    const t=n[r.living],e=t?.extras;
    if(t?.name!=='H18116_D2F_PINK_LIVING_EXPLICIT_RECLASSIFIED_VISUAL_ROOT_HOST_HOLD'||
      e?.identityStatus!=='SEPARATE_PHYSICAL_OUTLET_FROM_K5_2026_PHOTOS'||
      e?.exactPhysicalPositionVerified!==false||e?.presentationOnly!==true||
      e?.sourceLinksBound!==false||e?.current!==false||e?.asBuilt!==false||
      e?.humanReview!=='NOT_RUN'||t?.children?.length!==5)return false;
  }
  return true;
}
export function r31Unified3DonorReceipt(json,authenticatedGlbSha256,sceneIndex,role,floor,component){
  const c=R31_3DONOR_UNIFIED,v=c.views[sceneIndex];
  const exactSource=isR31Unified3DonorSource(json,authenticatedGlbSha256,sceneIndex,role,floor);
  const componentActive=exactSource&&Boolean(Object.hasOwn(c.roots,component)&&v.active.includes(component));
  return Object.freeze({exactSource,componentActive,rootNode:componentActive?c.roots[component]:null,
    stage:'WORK_TEST_HOST_HOLD',sourceLinksBound:false,publishAllowed:false,
    current:false,asBuilt:false,productionWebGLVerified:false,humanReview:'NOT_RUN'});
}
