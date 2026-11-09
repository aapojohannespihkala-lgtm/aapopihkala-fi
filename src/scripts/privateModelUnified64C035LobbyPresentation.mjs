// C80-035: carry the already approved doorless, white passage presentation
// from the original HI20 52-scene viewer into the unified 64-scene 1F/BOTH.
// Only six existing WORK_TEST jamb/head material instances are changed.
export const U64_C035_SHA = '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const TARGETS = [
  {scene:60,root:6349,reference:6379,nodes:[6346,6347,6348]},
  {scene:63,root:6400,reference:6394,nodes:[6397,6398,6399]},
];
const no = reason => ({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function exactMesh(scene,id,associations) {
  const found=[];
  scene?.traverse?.(obj=>{
    if (!obj?.isMesh) return;
    let p=obj;
    while(p){
      if(associations.get(p)?.nodes===id){found.push(obj);break;}
      if(p===scene) break;
      p=p.parent;
    }
  });
  return found.length===1?found[0]:null;
}
export function createUnified64C035LobbyPresentation(gltf,verifiedSha) {
  const json=gltf?.parser?.json, assoc=gltf?.parser?.associations;
  if(verifiedSha!==U64_C035_SHA || json?.asset?.version!=='2.0' ||
     json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false ||
     json?.scene!==0 || json?.scenes?.length!==64 || gltf?.scenes?.length!==64 ||
     typeof assoc?.get!=='function') return no('sha-or-scenes');
  const targets=[];
  for(const t of TARGETS) {
    const scene=gltf.scenes[t.scene], root=json.nodes?.[t.root], ref=json.nodes?.[t.reference];
    if(!json.scenes[t.scene]?.nodes?.includes(t.root) ||
       !root?.name?.includes('C80-035_D1F_LOBBY_CORRIDOR_DOORLESS') ||
       !root?.extras?.ownerCorrection?.includes('NO DOOR') ||
       root.extras?.current!==false || root.extras?.asBuilt!==false ||
       root.children?.length!==3 || !t.nodes.every((id,i)=>root.children[i]===id) ||
       ref?.mesh!==1835 || json.meshes?.[1835]?.primitives?.[0]?.material!==335 ||
       json.meshes[1835].primitives.length!==1 ||
       json.materials?.[335]?.alphaMode!=='OPAQUE' ||
       ![.93,.93,.93].every((v,i)=>Math.abs(json.materials[335].pbrMetallicRoughness?.baseColorFactor?.[i]-v)<.00001))
      return no('parent-or-white-reference');
    const reference=exactMesh(scene,t.reference,assoc);
    if(!reference || reference.material?.transparent===true ||
       typeof reference.material?.clone!=='function') return no('white-reference-not-loaded');
    for(let i=0;i<3;i++) {
      const id=t.nodes[i], node=json.nodes?.[id], meshIndex=1730+i;
      if(node?.mesh!==meshIndex || !node?.name?.startsWith('C80-035_HI16_') ||
         node.extras?.workAssumption!==true ||
         node.extras?.sourceLinks?.length!==2 ||
         json.meshes?.[meshIndex]?.primitives?.length!==1 ||
         json.meshes[meshIndex].primitives[0].material!==224 ||
         json.materials?.[224]?.alphaMode!=='OPAQUE') return no('jamb-source-identity');
      const mesh=exactMesh(scene,id,assoc);
      if(!mesh || typeof mesh.material?.clone!=='function' || Array.isArray(mesh.material))
        return no('jamb-not-loaded');
      targets.push({mesh,original:mesh.material,reference:reference.material});
    }
  }
  if(targets.length!==6 || new Set(targets.map(x=>x.mesh)).size!==6)
    return no('shared-or-missing-objects');
  let enabled=false;
  const restore=()=>{
    if(!enabled)return;
    for(const t of targets){
      const temporary=t.mesh.material;
      t.mesh.material=t.original;
      temporary.dispose?.();
    }
    enabled=false;
  };
  return {available:true,reason:null,count:6,get enabled(){return enabled;},
    setEnabled(next){
      if(!next){restore();return true;}
      if(enabled)return true;
      const clones=[];
      try{
        for(const t of targets){
          const m=t.reference.clone();
          m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true;
          clones.push(m);
        }
      }catch{
        for(const m of clones)m.dispose?.();
        return false;
      }
      targets.forEach((t,i)=>{t.mesh.material=clones[i];});
      enabled=true;
      return true;
    },dispose:restore};
}
