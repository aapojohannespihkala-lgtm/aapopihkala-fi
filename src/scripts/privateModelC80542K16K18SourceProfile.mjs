// C80 542 K16+K18: source-exact receipt for two joined owner geometry corrections.
// The SHA argument must come from hashing the COMPLETE original GLB bytes.
// This never registers a sourceCard, mounts the viewer or authorizes publication.
export const C80_WPD_K16K18_ZIP_DRIVE_ID='1pgU2riJV94YJxntdefHIRoHz2xKWJAmi';
export const C80_WPD_K16K18_ZIP_SHA256='3575106a71967c59da16d7051569ca40ad8f307ea2f820dbdd79c711c3894283';
export const C80_WPD_K16K18_GLB_SHA256='283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260';
export const C80_WPD_K16K18_GLB_BYTES=55760700;
export const C80_WPD_K16_GLBSHA256='5e2f0c561ac3db0cc1c6f171a14e50dc311ccccb89a28e69478bdef3fee805c3';
export const C80_WPD_K18_GLBSHA256='118653c608ea3139007dfd4a2f51d6d81311eb93f425e4c032b1235c0f8a430b';
export const C80_WPD_ORIGINAL_530_GLBSHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_WPD_K16K18_SOURCE_ONLY=true;
export const C80_WPD_K16K18_SOURCE_LINKS_BOUND=false;
export const C80_WPD_K16K18_PUBLISH_ALLOWED=false;

const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const counts=[294,190,477,477,477,477];
const parentFnv=['d3214bba','b6394bd0','8c0e83bc','13d729cc','bf8b9dd2','11164159'];
const joinedFnv=['63ff303e','b6394bd0','4f8b7108','a4ff7790','4d2f3e6e','0c8bff25'];
export const C80_WPD_K16K18_SCENES=Object.freeze(Object.fromEntries(
  floors.map((floor,n)=>[536+n,Object.freeze({
    parentScene:530+n, floor, rootCount:counts[n], rootFnv:joinedFnv[n]
  })])
));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function c80WpdK16K18RootFnv32(ids) {
  if(!Array.isArray(ids))return null;
  let h=2166136261;
  for(const id of ids) {
    if(!Number.isInteger(id)||id<0)return null;
    h=Math.imul(h^id,16777619)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function safeMeta(s,floor,src) {
  return !!s&&s.extras?.stage==='WORK_TEST_HOST_HOLD'&&s.extras?.floor===floor&&
    s.extras?.sourceSceneIndex===src&&
    s.extras?.sourceLinksBindingVerified===false&&
    s.extras?.sourceLinksBound===false&&s.extras?.current===false&&
    s.extras?.asBuilt===false&&s.extras?.humanReviewApproved===false&&
    s.extras?.physicalHiddenRouteVerified===false&&
    s.extras?.productionWebGLVerified===false;
}
function goodK16Node(j,id,source,originalMesh,meshId,positionAccessor){
  const node=j.nodes?.[id], x=node?.extras,mesh=j.meshes?.[meshId],
    prim=mesh?.primitives?.[0],a=j.accessors?.[positionAccessor];
  return node?.mesh===meshId&&
    node.name===(id===12255?
      'K16_CORRECTED_V48_D1F_700_WEST_JAMB_X2620_2820':
      'K16_CORRECTED_V48_D1F_700_OPENING_HEAD_ABOVE_Y2090')&&
    j.nodes?.[source]?.mesh===originalMesh&&
    j.nodes?.[9383]?.mesh===3333&&x?.originalNodeIndex===source&&
    x?.originalMeshIndex===originalMesh&&
    x?.ownerCorrection==='K16_20261115_DOOR_FACE_SPIKE_REPAIR'&&
    x?.sourceFaceTemplateNodeIndex===9383&&
    x?.repairedDamagedVertexCount===12&&
    x?.stage==='WORK_TEST_NONCURRENT'&&x?.physicalHostVerified===false&&
    x?.sourceLinksBound===false&&x?.current===false&&x?.asBuilt===false&&
    mesh.primitives.length===1&&prim.mode===4&&
    prim.material===333&&prim.indices===6326&&
    prim.attributes?.NORMAL===6325&&prim.attributes?.POSITION===positionAccessor&&
    a?.componentType===5126&&a?.count===24&&a?.type==='VEC3'&&
    a?.bufferView===(id===12255?10412:10413)&&
    Math.abs(a.max?.[2]-a.min?.[2]-0.065)<0.00001;
}
function goodK18Node(j){
  const n=j.nodes?.[12257],x=n?.extras,m=j.meshes?.[4623],p=m?.primitives?.[0],
    e=m?.extras,a=j.accessors?.[10410],bv=j.bufferViews?.[10414];
  return n?.mesh===4623&&n.name==='K16_K18_COFIT_WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL'&&
    j.nodes?.[11309]?.mesh===4199&&x?.stage==='WORK_TEST_HOST_HOLD'&&
    x?.sourceNodeIndex===11309&&x?.sourceMeshIndex===4199&&
    x?.preservedPatchTriangles===10&&x?.preservedSlabEdgeTriangles===10&&
    x?.excludedUnderstairWallTriangles===8&&
    x?.sourceLinksBound===false&&x?.current===false&&x?.asBuilt===false&&
    x?.productionWebGLVerified===false&&x?.HUMAN_REVIEW==='NOT_RUN'&&
    m.primitives.length===1&&p?.attributes?.POSITION===9129&&
    p?.indices===10410&&p?.material===333&&
    e?.originalMeshIndex===4199&&e?.preservedTriangles===20&&
    e?.removedTriangles===8&&e?.notAsBuilt===true&&
    a?.componentType===5125&&a?.count===60&&a?.type==='SCALAR'&&
    a?.bufferView===10414&&eq(a?.min,[0])&&eq(a?.max,[55])&&
    bv?.byteOffset===32988732&&bv?.byteLength===240&&bv?.target===34963;
}
function goodJoinedMeta(extras,parentIndex,has1F){
  const x=extras?.cofitK16K18;
  return x?.stage==='WORK_TEST_HOST_HOLD'&&
    x.parentScene===parentIndex&&x.K18DonorScene===parentIndex&&
    x.parentGLBSHA256===C80_WPD_K16_GLBSHA256&&
    x.K18DonorGLBSHA256===C80_WPD_K18_GLBSHA256&&
    x.originalC80530GLBSHA256===C80_WPD_ORIGINAL_530_GLBSHA256&&
    eq(x.K16CorrectedSourceNodes,has1F?[9382,9384]:[])&&
    eq(x.K16CorrectedNodes,has1F?[12255,12256]:[])&&
    x.K18OriginalSourceNode===(has1F?11309:null)&&
    x.K18CorrectedNode===(has1F?12257:null)&&
    x.K18WallTrianglesOmitted===(has1F?8:0)&&
    x.K18HolePatchTrianglesPreserved===(has1F?10:0)&&
    x.K18SlabEdgeTrianglesPreserved===(has1F?10:0)&&
    x.sourceLinksBound===false&&x.current===false&&x.asBuilt===false&&
    x.physicalHostVerified===false&&x.productionWebGLVerified===false&&
    x.humanReview==='NOT_RUN'&&x.publishAllowed===false;
}
// Even when checking one opt-in scene, all six parent/target transitions must agree.
export function isC80WpdK16K18SourceScene(gltf,authenticatedGlbSha256,index,floor=null){
  const profile=C80_WPD_K16K18_SCENES[index];
  if(authenticatedGlbSha256!==C80_WPD_K16K18_GLB_SHA256||!profile||
      (floor!==null&&profile.floor!==floor)||
      gltf?.scene!==292||gltf?.scenes?.length!==542||
      gltf?.nodes?.length!==12258||gltf?.meshes?.length!==4624||
      gltf?.accessors?.length!==10411||gltf?.bufferViews?.length!==10415||
      gltf?.buffers?.[0]?.byteLength!==32988972||
      gltf?.asset?.extras?.ModelStage!=='WORK_TEST'||
      gltf?.asset?.extras?.Canonical!==false||
      gltf?.asset?.extras?.current!==false||
      gltf?.asset?.extras?.asBuilt!==false||
      gltf?.asset?.extras?.HUMAN_REVIEW!=='NOT_RUN'||
      !goodK16Node(gltf,12255,9382,3332,4621,10408)||
      !goodK16Node(gltf,12256,9384,3334,4622,10409)||
      !goodK18Node(gltf))return false;
  for(let n=0;n<6;n++){
    const pidx=530+n,tidx=536+n,p=gltf.scenes[pidx],s=gltf.scenes[tidx];
    const has1F=n!==1,sourcePidx=524+n;
    if(!p||!s||
        p.name!==`C80_536_K16_DOOR_HEAD_WESTJAMB_RECTIFIED_FROM_530_SCENE_${sourcePidx}_WORK_TEST_HOST_HOLD`||
        s.name!==`C80_542_WPD_K16_DOOR_K18_STAIR_COFIT_FROM_C80_536_SCENE_${pidx}_${floors[n]}_WORK_TEST_HOST_HOLD`||
        !safeMeta(p,floors[n],sourcePidx)||!safeMeta(s,floors[n],pidx)||
        !goodJoinedMeta(s.extras,pidx,has1F)||
        p.nodes?.length!==counts[n]||s.nodes?.length!==counts[n]||
        new Set(p.nodes).size!==counts[n]||new Set(s.nodes).size!==counts[n]||
        p.nodes.some(id=>!Number.isInteger(id)||id<0||id>=12257)||
        s.nodes.some(id=>!Number.isInteger(id)||id<0||id>=12258)||
        c80WpdK16K18RootFnv32(p.nodes)!==parentFnv[n]||
        c80WpdK16K18RootFnv32(s.nodes)!==joinedFnv[n])return false;
    const expected=has1F?p.nodes.map(i=>i===11309?12257:i):p.nodes;
    if(!eq(s.nodes,expected)||p.nodes.includes(12257)||p.nodes.includes(9382)||
        p.nodes.includes(9384)||
        (has1F&&(!p.nodes.includes(11309)||
          !p.nodes.includes(12255)||!p.nodes.includes(12256)||
          !s.nodes.includes(12255)||!s.nodes.includes(12256)||
          !s.nodes.includes(12257)||s.nodes.includes(11309)))||
        (!has1F&&(s.nodes.includes(12255)||s.nodes.includes(12256)||
          s.nodes.includes(12257)||s.nodes.includes(11309))))return false;
  }
  return true;
}
export function resolveC80WpdK16K18SceneIndex(sha,parentScene,floor){
  if(sha!==C80_WPD_K16K18_GLB_SHA256||!Number.isInteger(parentScene))return null;
  const target=parentScene+6;
  return C80_WPD_K16K18_SCENES[target]?.parentScene===parentScene&&
    C80_WPD_K16K18_SCENES[target].floor===floor?target:null;
}
export function c80WpdK16K18SourceReceipt(gltf,sha,index){
  return Object.freeze({exactSource:isC80WpdK16K18SourceScene(gltf,sha,index),
    sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN',physicalHostVerified:false});
}
