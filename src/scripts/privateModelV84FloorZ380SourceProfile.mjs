// Source-exact read-only receiver for the V84 wall top + floor z-fight WORK_TEST.
// Caller must independently hash the entire inner GLB before supplying loadedSha.
// This is NOT a sourceLinks binding, model publication, WebGL or human acceptance.
export const V84_FLOORZ380_DRIVE_ID='1P6W3EVr1F6PzZXnd1MTudqbuHb5Kjnfp';
export const V84_FLOORZ380_ZIP_SHA256='2710c548fff5e441dcd341566c99290513ffc0803b66f9efc0025da53a765112';
export const V84_FLOORZ380_GLB_SHA256='7a63c0cba58c62d7b6c9521e6fb2b1c2f07c66bd8e41e67f7157b962349302aa';
export const V84_FLOORZ380_GLB_BYTES=54081264;
export const V84_FLOORZ380_BASE_SHA256='31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2';
export const V84_FLOORZ380_WALL_DONOR_SHA256='3ec257e8df3dae29c562baaa58ad8040c1ac72c5322e642e773de30d83aee7f4';
export const V84_FLOORZ380_FLOOR_DONOR_SHA256='5784807c11ddc2011b813ae9ce3c81dd7ce44b8eb5f0e8660a0f1f0cbc2ad72f';
export const V84_FLOORZ380_DEFAULT_SCENE=292;
export const V84_FLOORZ380_COUNTS=Object.freeze({scenes:380,nodes:12110,meshes:4558,accessors:10206});
const prefix='OM_WALLTOP5MM_FLOOR_ZFIGHT_COFIT__OM_WALLTOP_V84_5MM_C80_M6263_MJ72_KIV005_';
const suffix='_WORK_TEST_HOST_HOLD_20261113';
// Four authored INTERNAL glTF scenes, not the ZIP filename's __scene376.
export const V84_FLOORZ380_SCENES=Object.freeze({
  376:Object.freeze({name:prefix+'BOTH_CLOSED'+suffix,glazing:'CLOSED',cutaway:false,sourceScene:362,wallScene:370,floorScene:369,fnv:'abb00df9'}),
  377:Object.freeze({name:prefix+'BOTH_ONE_OPEN'+suffix,glazing:'ONE_OPEN',cutaway:false,sourceScene:364,wallScene:372,floorScene:370,fnv:'b59f123b'}),
  378:Object.freeze({name:prefix+'BOTH_STACKED'+suffix,glazing:'STACKED',cutaway:false,sourceScene:366,wallScene:374,floorScene:371,fnv:'8402cc59'}),
  379:Object.freeze({name:prefix+'PK1_CUTAWAY_BOTH_CLOSED'+suffix,glazing:'CLOSED',cutaway:true,sourceScene:368,wallScene:375,floorScene:372,fnv:'c14adfe2'}),
});
export function v84FloorZ380RootsFnv32(roots){
  if(!Array.isArray(roots))return null;
  let hash=2166136261;
  for(const id of roots){
    if(!Number.isInteger(id)||id<0)return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
export function resolveV84FloorZ380SceneIndex(sha,floor,glazing='CLOSED',cutaway=false){
  if(sha!==V84_FLOORZ380_GLB_SHA256||floor!=='BOTH'||
     !['CLOSED','ONE_OPEN','STACKED'].includes(glazing)||typeof cutaway!=='boolean')return null;
  const hits=Object.entries(V84_FLOORZ380_SCENES).filter(([,s])=>s.glazing===glazing&&s.cutaway===cutaway);
  return hits.length===1?Number(hits[0][0]):null;
}
export function isV84FloorZ380SourceScene(gltf,loadedSha,index,floor=null,glazing=null,cutaway=null){
  const spec=V84_FLOORZ380_SCENES[index],s=gltf?.scenes?.[index],a=gltf?.asset?.extras;
  const combined=s?.extras?.ownerWallFloorCofit20261114,wall=s?.extras?.ownerWallTopCorrection;
  if(loadedSha!==V84_FLOORZ380_GLB_SHA256||!spec||!s||
     (floor!==null&&floor!=='BOTH')||
     (glazing!==null&&glazing!==spec.glazing)||
     (cutaway!==null&&cutaway!==spec.cutaway)||
     gltf?.scene!==V84_FLOORZ380_DEFAULT_SCENE||
     gltf?.scenes?.length!==V84_FLOORZ380_COUNTS.scenes||
     gltf?.nodes?.length!==V84_FLOORZ380_COUNTS.nodes||
     gltf?.meshes?.length!==V84_FLOORZ380_COUNTS.meshes||
     gltf?.accessors?.length!==V84_FLOORZ380_COUNTS.accessors||
     a?.Canonical!==false||a?.ModelStage!=='WORK_TEST'||a?.current!==false||a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
     s.name!==spec.name||!Array.isArray(s.nodes)||s.nodes.length!==464||new Set(s.nodes).size!==464||
     s.nodes.some(id=>!Number.isInteger(id)||id<0||id>=V84_FLOORZ380_COUNTS.nodes)||
     v84FloorZ380RootsFnv32(s.nodes)!==spec.fnv||
     ![9257,12108,12109].every(id=>s.nodes.includes(id))||
     [10793,9913].some(id=>s.nodes.includes(id))||
     s.extras?.stage!=='WORK_TEST_HOST_HOLD'||s.extras?.current!==false||s.extras?.asBuilt!==false||
     s.extras?.humanReview!=='NOT_RUN'||s.extras?.productionWebGL!=='NOT_RUN'||
     combined?.stage!=='WORK_TEST_HOST_HOLD'||combined?.sourceScene!==spec.sourceScene||
     combined?.priorWallTopScene!==spec.wallScene||combined?.priorFloorZFightScene!==spec.floorScene||
     combined?.wallTopRootClone!==12108||combined?.floorNoCapRootClone!==12109||
     combined?.wallTopCorrectionMeters!==0.005||combined?.floorTopOverlapBeforeMeters!==0.0005||
     combined?.sourceLinksBound!==false||combined?.productionWebGL!=='NOT_RUN'||
     combined?.humanReview!=='NOT_RUN'||combined?.current!==false||combined?.asBuilt!==false||
     wall?.sourceNode!==10793||wall?.newNode!==12108||wall?.sourceMesh!==4187||wall?.newMesh!==4556||
     wall?.newAccessor!==10204||wall?.oldZUI!==5.275||wall?.newZUI!==5.28||
     wall?.sourceLinksNotBound!==true||wall?.webglNotVerified!==true||
     s.extras?.successorIntegration?.sourceLinksBindingVerified!==false)return false;
  const n=gltf.nodes,m=gltf.meshes,ac=gltf.accessors;
  const f=n[12109]?.extras?.floorZFightFix;
  return n[9257]?.mesh===3271&&n[12108]?.mesh===4556&&n[12109]?.mesh===4557&&
    n[12108]?.extras?.sourceGlbSha256===V84_FLOORZ380_BASE_SHA256&&
    n[12108]?.extras?.correctionDeltaMeters===0.005&&
    n[12108]?.extras?.current===false&&n[12109]?.extras?.asBuilt===false&&
    n[12109]?.extras?.cofitBaseGlbSHA256===V84_FLOORZ380_WALL_DONOR_SHA256&&
    n[12109]?.extras?.cofitFloorDonorGlbSHA256===V84_FLOORZ380_FLOOR_DONOR_SHA256&&
    f?.oldNode===9913&&f?.oldMesh===3591&&f?.newNode===12109&&f?.newMesh===4557&&
    f?.floorNode===9257&&JSON.stringify(f?.oldUpperCapTriangles)==='[24,25]'&&
    f?.floorY_M===2.763&&f?.wallTopCapY_M===2.7625&&f?.gapM===0.0005&&
    f?.status==='WORK_TEST_HOST_HOLD'&&f?.realWorldGeometryApproval===false&&
    m[3271]?.name==='C80R2_V33_D2F_PALE_PLANK_FLOOR_SINGLE_PLANE_LIGHT_GAPS'&&
    m[4556]?.primitives?.[0]?.attributes?.POSITION===10204&&
    m[4557]?.primitives?.[0]?.indices===10205&&
    m[4557]?.primitives?.[0]?.attributes?.POSITION===m[3591]?.primitives?.[0]?.attributes?.POSITION&&
    ac[10205]?.count===78&&ac[3031]?.count===84;
}
