// C80 596 has TWO original G2b ZIPs with identical geometry and different
// source metadata. Explicit SHA + glTF scene + node/mesh/parent binding only.
// SOURCE_ONLY. Never mount, rebind sourceLinks, mark CURRENT, or publish here.
export const C80596_PARENT_590_GLB_SHA256 =
  'ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9';
export const C80596_DONOR_542_GLB_SHA256 =
  '283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260';
export const C80596_SOURCE_ONLY = true;
export const C80596_SOURCE_LINKS_BOUND = false;
export const C80596_PUBLISH_ALLOWED = false;

export const C80596_VARIANTS = Object.freeze({
  first: Object.freeze({
    zipDriveId:'1q0XDvKkNYpWCw06m0gGp-woojo9E6a2y',
    zipSHA256:'3ad5fc8301a48c7c561aec951cdfa9fc5789398b56183b14b55ade249ea6768c',
    glbSHA256:'0d538978a33ab3066f703fb0c5fc787ad70680d89028ed992b70966eeaaecbc9',
    glbBytes:56705320, sceneMetadataKey:'cofitC80596'
  }),
  second: Object.freeze({
    zipDriveId:'1p74OzCIJRrtRhmsHSrYavH7lguZErys7',
    zipSHA256:'756b6f8ee2206815dd5249640b963760dd0f414eca91761ae9fe1025ad1ceaeb',
    glbSHA256:'10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3',
    glbBytes:56704588, sceneMetadataKey:'C80596K16K18Cofit'
  })
});
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const rootCounts=[293,191,477,477,477,477];
const parentFnv=['b9fa4dc2','922e7205','ab0f78e5','716a5adb','00330a53','630b1f2c'];
const resultFnv=['b1a93af0','922e7205','e18d79af','d5f94459','e3d2d665','ec7415aa'];
export const C80596_SCENES = Object.freeze(Object.fromEntries(floors.map((floor,n)=>
  [590+n,Object.freeze({parentScene:584+n,floor,rootCount:rootCounts[n],rootFnv:resultFnv[n]})]
)));
export function c80596RootFnv32(ids){
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const id of ids){
    if(!Number.isInteger(id)||id<0)return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function correctMesh(g,variant){
  const a=g.accessors,b=g.bufferViews,m=g.meshes;
  if(!a||!b||!m)return false;
  for(const [n,position,sourceMesh,view] of [[12332,10431,4632,10437],[12333,10432,4633,10438]]){
    const node=g.nodes[n],e=node?.extras,mesh=m[sourceMesh],p=mesh?.primitives?.[0],accessor=a[position],bv=b[view];
    const orig=n===12332?9382:9384;
    const name=n===12332?'WEST_JAMB_X2620_2820':'OPENING_HEAD_ABOVE_Y2090';
    if(node?.name!==(variant==='first'?'C80_596_COFIT_':'C80_596_')+
        'K16_CORRECTED_V48_D1F_700_'+name||
        node?.mesh!==sourceMesh||e?.stage!=='WORK_TEST_NONCURRENT'||
        e?.originalNodeIndex!==orig||
        e?.originalMeshIndex!==(n===12332?3332:3334)||
        e?.sourceFaceTemplateNodeIndex!==9383||
        e?.ownerCorrection!=='K16_20261115_DOOR_FACE_SPIKE_REPAIR'||
        e?.repairedDamagedVertexCount!==12||
        e?.asBuilt!==false||e?.current!==false||e?.sourceLinksBound!==false||
        e?.physicalHostVerified!==false||p?.mode!==4||p?.material!==333||
        p?.indices!==6326||p?.attributes?.NORMAL!==6325||
        p?.attributes?.POSITION!==position||mesh?.primitives?.length!==1||
        accessor?.bufferView!==view||accessor?.componentType!==5126||
        accessor?.count!==24||accessor?.type!=='VEC3'||
        Math.abs(accessor.max?.[2]-accessor.min?.[2]-0.065)>0.00001||
        bv?.buffer!==0||bv?.byteLength!==288||bv?.target!==34962||
        bv?.byteOffset!==33606136+(n===12332?0:288))return false;
    if(variant==='first' &&
      (e?.C80590ParentGLBSHA256!==C80596_PARENT_590_GLB_SHA256||
       e?.C80542K16K18DonorGLBSHA256!==C80596_DONOR_542_GLB_SHA256||
       mesh.extras!==undefined))return false;
    if(variant==='second' &&
      (e?.baseC80590GLBSHA256!==C80596_PARENT_590_GLB_SHA256||
       e?.donorC80542GLBSHA256!==C80596_DONOR_542_GLB_SHA256||
       mesh.extras?.C80542K16K18DonorGLBSHA256!==C80596_DONOR_542_GLB_SHA256))return false;
  }
  const n=g.nodes?.[12334],e=n?.extras,m18=m[4634],p=m18?.primitives?.[0],x=m18?.extras;
  const a18=a[10433],b18=b[10439];
  return n?.mesh===4634&&
    n.name===(variant==='first'?'C80_596_COFIT_':'C80_596_')+
      'K16_K18_COFIT_WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL'&&
    e?.stage==='WORK_TEST_HOST_HOLD'&&
    e?.sourceNodeIndex===11309&&e?.sourceMeshIndex===4199&&
    e?.preservedPatchTriangles===10&&e?.preservedSlabEdgeTriangles===10&&
    e?.excludedUnderstairWallTriangles===8&&
    e?.current===false&&e?.asBuilt===false&&e?.sourceLinksBound===false&&
    e?.physicalHostVerified===false&&
    e?.productionWebGLVerified===false&&e?.HUMAN_REVIEW==='NOT_RUN'&&
    m18?.primitives?.length===1&&p?.attributes?.POSITION===9129&&
    p?.indices===10433&&p?.material===333&&
    x?.originalMeshIndex===4199&&x?.originalNodeIndex===11309&&
    x?.preservedTriangles===20&&x?.removedTriangles===8&&x?.notAsBuilt===true&&
    a18?.bufferView===10439&&a18?.count===60&&a18?.componentType===5125&&
    a18?.type==='SCALAR'&&same(a18?.min,[0])&&same(a18?.max,[55])&&
    b18?.buffer===0&&b18?.byteOffset===33606712&&b18?.byteLength===240&&
    b18?.target===34963&&
    (variant==='first'?e?.C80542K16K18DonorGLBSHA256===C80596_DONOR_542_GLB_SHA256:
      e?.donorC80542GLBSHA256===C80596_DONOR_542_GLB_SHA256&&
      x?.C80542K16K18DonorGLBSHA256===C80596_DONOR_542_GLB_SHA256);
}
function stage(s,floor){
  const x=s?.extras;
  return x?.stage==='WORK_TEST_HOST_HOLD'&&x?.floor===floor&&
    x?.sourceLinksBound===false&&x?.current===false&&x?.asBuilt===false&&
    x?.productionWebGLVerified===false&&x?.HUMAN_REVIEW==='NOT_RUN';
}
function correctProvenance(s,variant,n,active){
  const x=s?.extras,meta=x?.[C80596_VARIANTS[variant].sceneMetadataKey];
  if(!meta||meta.stage!=='WORK_TEST_HOST_HOLD')return false;
  if(variant==='first'){
    return x.sourceSceneIndex===584+n&&x.sourceLinksBindingVerified===false&&
      x.humanReviewApproved===false&&
      meta.parentScene===584+n&&
      meta.parentC80590GLBSHA256===C80596_PARENT_590_GLB_SHA256&&
      meta.K16K18DonorC80542GLBSHA256===C80596_DONOR_542_GLB_SHA256&&
      same(meta.K16OriginalNodes,active?[9382,9384]:[])&&
      same(meta.K16RepairedNodes,active?[12332,12333]:[])&&
      meta.K18OriginalNode===(active?11309:null)&&
      meta.K18RepairedNode===(active?12334:null)&&
      meta.K18OmittedWallTriangles===(active?8:0)&&
      meta.K18PreservedPatchTriangles===(active?10:0)&&
      meta.K18PreservedSlabTriangles===(active?10:0)&&
      meta.sourceLinksBound===false&&meta.physicalHostVerified===false&&
      meta.current===false&&meta.asBuilt===false&&
      meta.productionWebGLVerified===false&&meta.publishAllowed===false&&
      meta.humanReview==='NOT_RUN';
  }
  return meta.parentSceneIndex===584+n&&meta.donorSceneIndex===536+n&&
    meta.sourceParentGLBSHA256===C80596_PARENT_590_GLB_SHA256&&
    meta.donorC80542GLBSHA256===C80596_DONOR_542_GLB_SHA256&&
    meta.activeCorrection===active&&
    same(meta.K16Replacements,active?[12332,12333]:[])&&
    meta.K18Replacement===(active?12334:null)&&
    meta.K18PreservedHoleAndSlabTriangles===(active?20:0)&&
    meta.K18RemovedWallTriangles===(active?8:0)&&
    meta.K09FrameX===(active?5.05:null)&&
    meta.bathThemoX===(active?5.05:null)&&
    meta.sourceLinksBoundNewSHA===false&&meta.CURRENT===false&&meta.asBuilt===false&&
    meta.humanReview==='NOT_RUN'&&meta.productionWebGL==='NOT_RUN';
}
export function c80596VariantForAuthenticatedSha(sha){
  return Object.keys(C80596_VARIANTS).find(k=>C80596_VARIANTS[k].glbSHA256===sha)??null;
}
export function isC80596TwinSourceScene(g,authenticatedSha,index,floor=null){
  const v=c80596VariantForAuthenticatedSha(authenticatedSha);
  if(!v||!C80596_SCENES[index]||(floor!==null&&C80596_SCENES[index].floor!==floor)||
    g?.scene!==292||g?.scenes?.length!==596||g?.nodes?.length!==12335||
    g?.meshes?.length!==4635||g?.accessors?.length!==10434||
    g?.bufferViews?.length!==10440||g?.buffers?.[0]?.byteLength!==33606952||
    g?.asset?.extras?.ModelStage!=='WORK_TEST'||
    g?.asset?.extras?.Canonical!==false||g?.asset?.extras?.current!==false||
    g?.asset?.extras?.asBuilt!==false||g?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    g?.nodes?.[9382]?.mesh!==3332||g?.nodes?.[9384]?.mesh!==3334||
    g?.nodes?.[11309]?.mesh!==4199||!correctMesh(g,v))return false;
  for(let n=0;n<6;n++){
    const parent=g.scenes[584+n],scene=g.scenes[590+n],active=n!==1;
    const name=v==='first'?
      `C80_596_ALL5_K12_K09_THEMO_K16_K18_FROM_C80_590_SCENE_${584+n}_${floors[n]}_WORK_TEST_HOST_HOLD`:
      `C80_596_ALL5_K12_K09_THEMO_K16_K18_COFIT_FROM_${584+n}_${floors[n]}_WORK_TEST_HOST_HOLD`;
    if(!parent||!scene||!stage(parent,floors[n])||!stage(scene,floors[n])||
      scene.name!==name||
      parent.nodes?.length!==rootCounts[n]||scene.nodes?.length!==rootCounts[n]||
      c80596RootFnv32(parent.nodes)!==parentFnv[n]||
      c80596RootFnv32(scene.nodes)!==resultFnv[n]||
      !correctProvenance(scene,v,n,active))return false;
    const expected=active?parent.nodes.map(i=>
      i===9382?12332:i===9384?12333:i===11309?12334:i):parent.nodes;
    if(!same(scene.nodes,expected)||new Set(scene.nodes).size!==rootCounts[n]||
      scene.nodes.some(i=>!Number.isInteger(i)||i<0||i>=g.nodes.length)||
      (active&&(!scene.nodes.includes(12332)||!scene.nodes.includes(12333)||
        !scene.nodes.includes(12334)||!scene.nodes.includes(12329)||
        !scene.nodes.includes(12331)))||
      (!active&&(scene.nodes.includes(12332)||scene.nodes.includes(12333)||
        scene.nodes.includes(12334)||scene.nodes.includes(12329)||
        scene.nodes.includes(12331))))return false;
  }
  return true;
}
export function c80596TwinSourceReceipt(g,sha,sceneIndex){
  const variant=isC80596TwinSourceScene(g,sha,sceneIndex)?
    c80596VariantForAuthenticatedSha(sha):null;
  return Object.freeze({exactSource:variant!==null,variant,
    sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false});
}
