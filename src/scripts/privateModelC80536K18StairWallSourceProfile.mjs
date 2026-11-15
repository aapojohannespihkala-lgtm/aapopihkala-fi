/**
 * C80 536 WP-D K18 stair/under-stair-wall source-only receiver.
 * A verified GLB SHA is required; this module is deliberately NOT wired to
 * viewer mount, sourceLinks, publication or physical approval.
 */
import {c80530Fnv32 as fnv} from './privateModelC80530V27SourceProfile.mjs';

export const C80_536_K18_GLB_SHA256='118653c608ea3139007dfd4a2f51d6d81311eb93f425e4c032b1235c0f8a430b';
export const C80_536_K18_GLB_BYTES=55664888;
export const C80_536_K18_ZIP_SHA256='403a2c70098eb1ddc58745e0e5012802034875ca137321308aabe16a236826bd';
export const C80_536_K18_ZIP_DRIVE_ID='180BpviPo47Ct3KoU-dGs55MP8_MViPYZ';
export const C80_536_K18_PARENT_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
export const C80_536_K18_PARENT_ZIP_ID='1p0TAFQ5d2shItVg9JuvMls-hz21ScN6s';
export const C80_536_K18_OWNER_PDF_ID='1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT';

// Exact glTF scene indices, not UI label or default-scene indices.
// [new scene, source scene, floor, roots, root FNV32, parent-root FNV32, K18 active]
const rows=[
 [530,524,'1F',294,'ada3bdcd','ef21913f',true],
 [531,525,'2F',190,'b6394bd0','b6394bd0',false],
 [532,526,'BOTH',477,'a760040d','6847aefb',true],
 [533,527,'BOTH',477,'509288d9','9d3081c3',true],
 [534,528,'BOTH',477,'5a719f37','c0e4d46d',true],
 [535,529,'BOTH',477,'3aabf140','2b0e6572',true],
];
export const C80_536_K18_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,rootCount,rootHash,parentRootHash,k18Active])=>
 [scene,Object.freeze({scene,parent,floor,rootCount,rootHash,parentRootHash,k18Active})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
function reach(nodes,roots){
 const seen=new Set(),stack=[...roots];
 while(stack.length){
  const i=stack.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes?.length||!nodes[i])return null;
  if(seen.has(i))continue;
  seen.add(i);
  const children=nodes[i].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)stack.push(...children);
 }
 return seen;
}
export function isC80536K18GeometryEvidence(json){
 const nodes=json?.nodes,meshes=json?.meshes,a=json?.accessors;
 const old=nodes?.[11309],nu=nodes?.[12255],mesh=meshes?.[4621],oldMesh=meshes?.[4199];
 const p=mesh?.primitives?.[0],op=oldMesh?.primitives?.[0],e=nu?.extras,me=mesh?.extras;
 if(!Array.isArray(nodes)||nodes.length!==12256||!Array.isArray(meshes)||meshes.length!==4622||
    !Array.isArray(a)||a.length!==10409||json.bufferViews?.length!==10413||
    old?.name!=='V86_D1F_K17_STAIR_HOLE_FILL_UNDERSTAIR_WALL_SLAB_EDGE'||old.mesh!==4199||
    nu?.name!=='WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL'||
    nu.mesh!==4621||nu.children!==undefined||
    op?.attributes?.POSITION!==9129||op?.indices!==9130||op.material!==333||
    p?.attributes?.POSITION!==9129||p.indices!==10408||p.material!==333||
    mesh.primitives.length!==1||oldMesh.primitives.length!==1||
    a[9129]?.count!==56||a[9130]?.count!==84||a[10408]?.count!==60||
    a[10408]?.componentType!==5125||a[10408]?.type!=='SCALAR'||
    e?.stage!=='WORK_TEST_HOST_HOLD'||!eq(e.ownerPointG1,[2.299,6.429,1.448])||
    e.sourceNodeIndex!==11309||e.sourceMeshIndex!==4199||
    e.preservedPatchTriangles!==10||e.preservedSlabEdgeTriangles!==10||
    e.excludedUnderstairWallTriangles!==8||
    e.ownerPDF!==C80_536_K18_OWNER_PDF_ID||e.ownerPage!==18||
    e.current!==false||e.asBuilt!==false||e.sourceLinksBound!==false||
    e.HUMAN_REVIEW!=='NOT_RUN'||e.productionWebGLVerified!==false||
    me?.stage!=='WORK_TEST_HOST_HOLD'||me.originalMeshIndex!==4199||
    me.originalNodeIndex!==11309||me.originalVertexAccessorIndex!==9129||
    me.originalMaterialIndex!==333||me.preservedTriangles!==20||me.removedTriangles!==8||
    !eq(me.retainedParts,['HOLE_PATCH_10tri','SLAB_EDGE_10tri'])||
    me.ownerEvidencePDFDriveID!==C80_536_K18_OWNER_PDF_ID||
    me.ownerEvidencePage!==18||me.sourceGLBSHA256!==C80_536_K18_PARENT_SHA256||
    me.notAsBuilt!==true)return false;
 return true;
}
export function isC80536K18SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_536_K18_SCENES[sceneIndex],asset=json?.asset?.extras;
 if(sha!==C80_536_K18_GLB_SHA256||!spec||
    (floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json.scenes?.length!==536||
    asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||
    asset?.asBuilt!==false||asset?.HUMAN_REVIEW!=='NOT_RUN'||
    !isC80536K18GeometryEvidence(json))return false;
 const s=json.scenes[sceneIndex],prev=json.scenes[spec.parent],e=s?.extras;
 const roots=s?.nodes,old=prev?.nodes;
 if(s?.name!=='OWNER_WPD_K18_EXTRANEOUS_STAIR_WALL_REMOVED_C80_536_FROM_'+spec.parent+'_'+spec.floor+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(roots)||!Array.isArray(old)||roots.length!==spec.rootCount||
    old.length!==spec.rootCount||fnv(roots)!==spec.rootHash||
    fnv(old)!==spec.parentRootHash||new Set(roots).size!==roots.length||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e.sourceSceneIndex!==spec.parent||
    e.targetSceneIndex!==sceneIndex||e.floor!==spec.floor||
    e.ownerK18PDFDriveId!==C80_536_K18_OWNER_PDF_ID||
    e.ownerK18SourcePage!==18||
    e.sourceGLBSHA256!==C80_536_K18_PARENT_SHA256||
    e.sourceZIPDriveId!==C80_536_K18_PARENT_ZIP_ID||
    e.originalNode!==11309||e.newNode!==(spec.k18Active?12255:null)||
    e.removedUnderStairWallFacesOnly!==spec.k18Active||
    e.originalHolePatchAndSlabPreserved!==true||
    e.current!==false||e.asBuilt!==false||e.sourceLinksBound!==false||
    e.HUMAN_REVIEW!=='NOT_RUN'||e.productionWebGLVerified!==false||
    e.publishAllowed!==false)return false;
 const expected=spec.k18Active?old.map(v=>v===11309?12255:v):old;
 if(!eq(roots,expected)|| (spec.k18Active&&old.filter(v=>v===11309).length!==1))return false;
 const live=reach(json.nodes,roots);
 if(!live||live.has(11309)||live.has(12255)!==spec.k18Active)return false;
 return true;
}
export function c80536K18Receipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80536K18SourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,sourceLinksBound:false,
  publishAllowed:false,current:false,asBuilt:false,
  physicalWallVerified:false,physicalHoleVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
}
