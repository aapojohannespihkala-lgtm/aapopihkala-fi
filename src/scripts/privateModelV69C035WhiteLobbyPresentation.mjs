// Exact V69 WORK_TEST viewer-only C80-035/048 white doorless lobby finish.
// Source geometry, aperture, doors and GLB bytes are deliberately untouched.
export const V69_C035_LOBBY_SHA = '5b720c9b9f87358867463e725b1500c63bafd9de15d121cdf6c36a3e23ca36fd';
const TARGET_SCENES = [290, 292];
const TARGETS = [
  {node:9382,mesh:3332,material:504,name:'V48_D1F_700_WEST_JAMB_X2620_2820'},
  {node:9384,mesh:3334,material:504,name:'V48_D1F_700_OPENING_HEAD_ABOVE_Y2090'},
  {node:9391,mesh:3341,material:509,name:'V49_D1F_RIGHT_JAMB_105MM_COVERS_POST_THERMOSTAT_FACE_3512'},
  {node:9394,mesh:3344,material:512,name:'V50_D1F_LEFT_JAMB_UPPER_CONTINUITY_TO_ASSUMED_SLAB_BOTTOM_Y2500'},
  {node:9395,mesh:3345,material:513,name:'V50_D1F_RIGHT_JAMB_UPPER_CONTINUITY_105MM_TO_Y2500'},
  {node:9396,mesh:3346,material:514,name:'V50_D1F_DOORLESS_700MM_HEADER_UPPER_CONTINUITY_Y2500'},
];
const unavailable = reason => ({available:false,reason,count:0,applied:false,setApplied:()=>false,dispose:()=>{}});
const close = (actual,expected) => typeof actual==='number' && Math.abs(actual-expected)<0.00001;
// GLTFLoader r185 reduces parser.associations after each loaded scene.
// Earlier scenes can therefore lose their node mappings even though their
// runtime roots are intact. GLTFLoader preserves the source root-node order.
// Only use that fallback for exact root mesh leaves under this pinned GLB.
function exactMesh(scene,sourceNode,sourceRoots,sourceName,associations){
  if(!Array.isArray(sourceRoots) || scene?.children?.length!==sourceRoots.length)return null;
  const ordinal=sourceRoots.indexOf(sourceNode);
  if(ordinal<0 || sourceRoots.lastIndexOf(sourceNode)!==ordinal)return null;
  const root=scene.children[ordinal];
  const loaderName=root?.name;
  const instanceSuffix=typeof loaderName==='string'?loaderName.slice(sourceName.length):'';
  const nameMatches=loaderName===sourceName ||
    (loaderName?.startsWith(sourceName) && /^_instance_[0-9]+$/.test(instanceSuffix));
  if(!root?.isMesh || root.children?.length!==0 || !nameMatches)return null;
  // An available association is authoritative. Only a missing association
  // may use the validated source-root ordinal fallback.
  const mapping=associations.get(root);
  if(mapping && mapping.nodes!==sourceNode)return null;
  return root;
}
export function createV69C035WhiteLobbyPresentation(gltf,loadedSha,expectedSha){
  const json=gltf?.parser?.json,assoc=gltf?.parser?.associations;
  const white=json?.materials?.[333];
  const whitePbr=white?.pbrMetallicRoughness;
  if(loadedSha!==V69_C035_LOBBY_SHA || expectedSha!==loadedSha ||
     json?.asset?.version!=='2.0' || json?.asset?.extras?.current!==false ||
     json?.asset?.extras?.asBuilt!==false || json?.scene!==292 ||
     json?.scenes?.length!==293 || gltf?.scenes?.length!==293 ||
     json?.nodes?.length!==9914 || json?.meshes?.length!==3592 ||
     white?.alphaMode!=='OPAQUE' || white?.doubleSided!==true ||
     whitePbr?.baseColorFactor?.length!==4 ||
     !whitePbr.baseColorFactor.every((v,i)=>close(v,i===3?1:0.93)) ||
     !close(whitePbr.roughnessFactor,0.96) || !close(whitePbr.metallicFactor,0) ||
     typeof assoc?.get!=='function')return unavailable('source-sha-or-white-reference');
  const targets=[];
  for(const sceneIndex of TARGET_SCENES){
    const scene=gltf.scenes[sceneIndex],roots=json.scenes[sceneIndex]?.nodes;
    if(!scene || !Array.isArray(roots) ||
       !json.scenes[sceneIndex].name?.startsWith('C80R2_V69_') ||
       !TARGETS.every(t=>roots.includes(t.node)))return unavailable('source-scene-roots');
    for(const target of TARGETS){
      const node=json.nodes[target.node],sourceMesh=json.meshes[target.mesh];
      const primitive=sourceMesh?.primitives?.[0];
      if(node?.name!==target.name || node?.mesh!==target.mesh ||
         sourceMesh?.primitives?.length!==1 || primitive?.material!==target.material ||
         json.materials?.[target.material]?.alphaMode!=='OPAQUE' ||
         node?.extras?.asBuilt===true || node?.extras?.current===true)
        return unavailable('source-node-mesh-material');
      if(node?.children?.length)return unavailable('source-node-has-children');
      const obj=exactMesh(scene,target.node,roots,target.name,assoc);
      if(!obj || Array.isArray(obj.material) ||
         typeof obj.material?.clone!=='function' ||
         typeof obj.material?.color?.setRGB!=='function')
        return unavailable('source-runtime-object');
      targets.push({object:obj,original:obj.material});
    }
  }
  if(targets.length!==12 || new Set(targets.map(t=>t.object)).size!==12)
    return unavailable('source-objects-not-unique');
  let applied=false;
  const restore=()=>{
    if(!applied)return;
    for(const target of targets){
      const clone=target.object.material;
      target.object.material=target.original;
      clone.dispose?.();
    }
    applied=false;
  };
  return {available:true,reason:null,count:12,get applied(){return applied;},
    setApplied(next){
      if(!next){restore();return true;}
      if(applied)return true;
      const clones=[];
      try{
        for(const target of targets){
          const material=target.original.clone();
          material.color.setRGB(...whitePbr.baseColorFactor.slice(0,3));
          material.metalness=whitePbr.metallicFactor;
          material.roughness=whitePbr.roughnessFactor;
          material.transparent=false;
          material.opacity=1;
          material.depthWrite=true;
          material.needsUpdate=true;
          clones.push(material);
        }
      }catch{
        for(const material of clones)material.dispose?.();
        return false;
      }
      for(let i=0;i<targets.length;i++)targets[i].object.material=clones[i];
      applied=true;
      return true;
    },
    dispose:restore,
  };
}
