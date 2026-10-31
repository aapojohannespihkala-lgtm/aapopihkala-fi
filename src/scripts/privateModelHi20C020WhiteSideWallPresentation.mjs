// C80-020 / C80-043: existing 220 mm west balcony sidewall adopts the
// owner's unified white physical-wall presentation. Exact HI20 52-scene
// WORK_TEST only. Geometry, sourceLinks and original GLB remain unchanged.
export const C020_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:48,node:5880,reference:6431,name:'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_24'},
  {scene:51,node:5882,reference:6437,name:'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_25'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function findNode(scene,id,associations){
  const found=[];
  scene?.traverse?.(object=>{
    if(object?.isMesh && associations.get(object)?.nodes===id) found.push(object);
  });
  return found.length===1?found[0]:null;
}
export function createHi20C020WhiteSideWallPresentation(gltf,sourceSha){
  const json=gltf?.parser?.json,associations=gltf?.parser?.associations;
  if(sourceSha!==C020_SOURCE_SHA || gltf?.scenes?.length!==52 ||
     json?.scenes?.length!==52 || json?.scene!==0 ||
     json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false ||
     typeof associations?.get!=='function') return unavailable('source-sha-or-scenes');
  const sideMesh=json.meshes?.[1791],whiteMesh=json.meshes?.[1849];
  if(sideMesh?.name!=='HI20_WP3_C80-020_X0_ENDWALL_220MM_OUTERFACE_FIXED_COW' ||
     sideMesh.primitives?.length!==1 || sideMesh.primitives[0].material!==284 ||
     sideMesh.extras?.ownerMeasuredThicknessMm!==220 ||
     sideMesh.extras?.physicalHost!=='HOST_HOLD' ||
     !Array.isArray(sideMesh.extras?.sourceLinks) || sideMesh.extras.sourceLinks.length!==2 ||
     whiteMesh?.primitives?.length!==1 || whiteMesh.primitives[0].material!==340 ||
     json.materials?.[284]?.name!=='C80_020_BALCONY_SIDE_VISUAL_WORK_ASSUMPTION' ||
     json.materials?.[340]?.name!=='C80-043_OWNER_UNIFIED_WHITE_PHYSICAL_2F_WALL_WORK_TEST' ||
     JSON.stringify(json.materials[284].pbrMetallicRoughness?.baseColorFactor)!=='[0.87,0.86,0.82,1]' ||
     JSON.stringify(json.materials[340].pbrMetallicRoughness?.baseColorFactor)!=='[0.93,0.93,0.93,1]')
    return unavailable('source-mesh-and-material');
  const targets=[];
  for(const t of TARGETS){
    const node=json.nodes?.[t.node],ref=json.nodes?.[t.reference];
    if(node?.name!==t.name || node.mesh!==1791 ||
       node.extras?.measuredX0EnvelopeM!==0.22 ||
       node.extras?.physicalHost!=='HOST_HOLD' ||
       node.extras?.current!==false || node.extras?.asBuilt!==false ||
       ref?.mesh!==1849)
      return unavailable('node-identity');
    const scene=gltf.scenes[t.scene];
    const side=findNode(scene,t.node,associations);
    const white=findNode(scene,t.reference,associations);
    if(!side || !white || Array.isArray(side.material) ||
       Array.isArray(white.material) || !side.material?.color ||
       !white.material?.color || typeof white.material.clone!=='function')
      return unavailable('loaded-meshes');
    targets.push({side,white,original:side.material});
  }
  if(targets.length!==2 || targets[0].side===targets[1].side)
    return unavailable('duplicate-target');
  let enabled=false,clones=[];
  function setEnabled(next){
    if(Boolean(next)===enabled) return true;
    if(!next){
      targets.forEach((t,i)=>{t.side.material=t.original;clones[i]?.dispose?.();});
      clones=[];enabled=false;return true;
    }
    const made=[];
    try {
      for(const t of targets){
        const material=t.white.material.clone();
        material.transparent=false;
        material.opacity=1;
        material.depthWrite=true;
        material.needsUpdate=true;
        made.push(material);
      }
    }catch{
      made.forEach(material=>material.dispose?.());
      return false;
    }
    targets.forEach((t,i)=>{t.side.material=made[i];});
    clones=made;enabled=true;return true;
  }
  return {available:true,reason:null,count:2,get enabled(){return enabled;},
    setEnabled,dispose(){setEnabled(false);}};
}
