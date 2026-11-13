// V27 no-trench soil/terrace join: source-exact WORK_TEST receiver only.
// A trusted caller must hash the full GLB bytes. ZIP "__sceneN" is not a glTF scene index.
// This file neither binds sourceLinks nor authorizes publishing, WebGL or human review.
export const V27_NO_TRENCH=Object.freeze({
  glbSha:'d07d22ad560b74f24229793dd3f7415205a30f6c29fc9f10142da3af2ca63b9b',
  glbBytes:54171340,zipSha:'c7adb98f4a72a89144827e88201959f5ab84c1ad34294d524343a667c5b91558',
  driveId:'1h9sTz9GyaAj-rO8ZhECKBEPLEyXow4HC',
  parentSha:'31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2',
  parentDriveId:'152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV',
  supersededSha:'0624f3a0eaed388a5c531dcceb20fdac2b25495ad0d0c01e5aa4419cdb82bb0f',
  supersededDriveId:'16vADafY95eb4ujPjZL-u9tby6w-OLriR',
  sceneCount:375,originalSceneCount:369,defaultScene:292,nodeCount:12111,meshCount:4558,
  soilNode:12108,soilMesh:4556,sealNode:12109,sealMesh:4557,rootNode:12110,
  priorSoilNode:8755,priorSoilMesh:3018,oldRootNode:9008,
  sceneMap:Object.freeze({
    369:{from:360,count:289,fnv:'72a45005'},
    370:{from:362,count:464,fnv:'99d36de0'},
    371:{from:364,count:464,fnv:'221ffe3c'},
    372:{from:366,count:464,fnv:'ac324950'},
    373:{from:367,count:289,fnv:'f4d640b0'},
    374:{from:368,count:464,fnv:'3a666fbf'}
  }),
  sourceLinks:'REBOUND_REQUIRED_NEW_SHA',productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',
  status:'WORK_TEST_HOST_HOLD_NONCURRENT_NOT_AS_BUILT'
});
export function v27NoTrenchRootHash(roots){
  if(!Array.isArray(roots)||roots.some(n=>!Number.isInteger(n)||n<0)) return null;
  let h=2166136261;
  for(const n of roots)h=Math.imul(h^n,16777619)>>>0;
  return h.toString(16).padStart(8,'0');
}
const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<1e-8;
const guarded=x=>x?.current===false&&x?.asBuilt===false&&x?.sourceOnly===true&&
  x?.presentationOnly===true&&x?.physicalHost==='HOST_HOLD'&&x?.humanReview==='NOT_RUN';
export function verifyV27NoTrenchSource({sha256,bytes,driveId,gltf}={}){
  const p=V27_NO_TRENCH;
  if(sha256!==p.glbSha||bytes!==p.glbBytes||driveId!==p.driveId)
    return {ok:false,reason:'SOURCE_IDENTITY_MISMATCH'};
  if(gltf?.scene!==p.defaultScene||gltf.scenes?.length!==p.sceneCount||
     gltf.nodes?.length!==p.nodeCount||gltf.meshes?.length!==p.meshCount)
    return {ok:false,reason:'STRUCTURE_MISMATCH'};
  const n=gltf.nodes,soil=n[p.soilNode],seal=n[p.sealNode],root=n[p.rootNode];
  const c=soil?.extras?.presentationClip20261114;
  if(soil?.mesh!==p.soilMesh||seal?.mesh!==p.sealMesh||
     soil?.name!=='HI12_SOIL_V27_EAST_WALL_HOST_FOOTPRINT_CLIP_NO_TRENCH_WORK_TEST'||
     root?.name!=='SOURCE_CONTEXT_V27_UNDERDECK_WALL_HOST_CLIP_ROOT_WORK_TEST'||
     !guarded(soil?.extras)||!guarded(root?.extras)||root?.extras?.groundNotASlab!==true||
     seal?.extras?.physicalFoundationClaim!==false||
     JSON.stringify(root?.children)!=='[9007,12108,5145,5148,5154,5167,5180,7318,12109]'||
     c?.operation!=='COW_GEOMETRIC_WALL_FOOTPRINT_CLIP_NO_HEIGHT_SHIFT'||
     c?.sourceNode!==p.priorSoilNode||c?.sourceMesh!==p.priorSoilMesh||
     c?.sourceSHA256!==p.parentSha||c?.metricElevationChangesInOriginalSource!==false||
     c?.localPresentationOnlySuppression!==true||c?.removedOnlyHostFootprint!==true||
     c?.terrainDepressionMeters!==0||!near(c?.cutXZ?.xmin,6.295)||
     !near(c?.cutXZ?.xmax,6.337)||!near(c?.cutXZ?.zmin,0.025)||
     !near(c?.cutXZ?.zmax,1.55))return {ok:false,reason:'WALL_SOIL_CLIP_MISMATCH'};
  for(const [i,s] of Object.entries(p.sceneMap)){
    const old=gltf.scenes[s.from]?.nodes,newRoots=gltf.scenes[Number(i)]?.nodes;
    if(!gltf.scenes[Number(i)]?.name?.endsWith('__V27_SOIL_EAST_WALL_TRIM_WORK_TEST')||
       old?.length!==s.count||newRoots?.length!==s.count||
       newRoots.some(x=>!Number.isInteger(x)||x<0||x>=p.nodeCount)||
       new Set(newRoots).size!==s.count||
       v27NoTrenchRootHash(newRoots)!==s.fnv||
       !old.includes(p.oldRootNode)||old.includes(p.rootNode)||
       newRoots.includes(p.oldRootNode)||!newRoots.includes(p.rootNode)||
       old.filter((x,k)=>x!==newRoots[k]).length!==1||
       old.indexOf(p.oldRootNode)!==newRoots.indexOf(p.rootNode))
      return {ok:false,reason:'SCENE_'+i+'_ROOT_MISMATCH'};
  }
  return {ok:true,scenes:Object.keys(p.sceneMap).map(Number),status:p.status,
    sourceLinks:p.sourceLinks,productionWebGL:p.productionWebGL,humanReview:p.humanReview};
}
