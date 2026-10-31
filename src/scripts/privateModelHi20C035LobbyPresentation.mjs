// C80-035: make the six EXISTING lobby-to-bedroom-corridor opening
// jamb/head surfaces white in verified HI20 52-scene WORK_TEST.
// It is an intentionally DOORLESS opening. No mesh, opening, wall depth,
// sourceLinks, GLB, other room, or physical as-built claim changes.
export const C035_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  { scene:50, root:6349, ref:6379, nodes:[6346,6347,6348] },
  { scene:51, root:6400, ref:6394, nodes:[6397,6398,6399] },
];
const unavailable = (reason) => ({
  available:false,reason,count:0,enabled:false,
  setEnabled:()=>false,dispose:()=>{},
});
function exactMesh(scene,id,associations) {
  const found=[];
  scene?.traverse?.((mesh)=>{
    if (!mesh?.isMesh) return;
    let p=mesh;
    while(p) {
      if (associations.get(p)?.nodes===id) {found.push(mesh);break;}
      if(p===scene) break;
      p=p.parent;
    }
  });
  return found.length===1?found[0]:null;
}
export function createHi20C035LobbyPresentation(gltf,verifiedSha) {
  const json=gltf?.parser?.json;
  if(verifiedSha!==C035_SOURCE_SHA || json?.asset?.version!=='2.0' ||
     json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false ||
     json?.scene!==0 || json?.scenes?.length!==52 || gltf?.scenes?.length!==52)
    return unavailable('source-sha-or-scene');
  const associations=gltf?.parser?.associations;
  if(typeof associations?.get!=='function') return unavailable('associations');
  const targets=[];
  for (const t of TARGETS) {
    const scene=gltf.scenes[t.scene];
    const root=json.nodes?.[t.root];
    const ref=json.nodes?.[t.ref];
    if(!scene || !root || !Array.isArray(root.children) ||
       !t.nodes.every(id=>root.children.includes(id)) ||
       new Set(root.children).size!==root.children.length ||
       ref?.mesh!==1835 ||
       json.meshes?.[1835]?.primitives?.length!==1 ||
       json.meshes[1835].primitives[0].material!==335)
      return unavailable('parent-or-reference-identity');
    const white=exactMesh(scene,t.ref,associations);
    if(!white || Array.isArray(white.material) ||
       typeof white.material?.clone!=='function' ||
       !white.material?.color || white.material.transparent===true)
      return unavailable('reference-material');
    for(let i=0;i<3;i++){
      const id=t.nodes[i], meshIndex=1730+i, node=json.nodes?.[id];
      const primitives=json.meshes?.[meshIndex]?.primitives;
      if(node?.mesh!==meshIndex || primitives?.length!==1 ||
         primitives[0].material!==224)
        return unavailable('opening-node-identity');
      const mesh=exactMesh(scene,id,associations);
      if(!mesh || Array.isArray(mesh.material) ||
         typeof mesh.material?.clone!=='function')
        return unavailable('opening-object');
      targets.push({mesh,original:mesh.material,reference:white.material});
    }
  }
  if(targets.length!==6 || new Set(targets.map(t=>t.mesh)).size!==6)
    return unavailable('incomplete-or-shared-opening');
  let enabled=false;
  const restore=()=>{
    if(!enabled) return;
    for(const target of targets){
      const temporary=target.mesh.material;
      target.mesh.material=target.original;
      temporary.dispose?.();
    }
    enabled=false;
  };
  return {
    available:true,reason:null,count:targets.length,
    get enabled(){return enabled;},
    setEnabled(next){
      if(!next){restore();return true;}
      if(enabled) return true;
      const whites=[];
      try {
        for(const t of targets) {
          const material=t.reference.clone();
          material.transparent=false;
          material.opacity=1;
          material.depthWrite=true;
          material.needsUpdate=true;
          whites.push(material);
        }
      } catch {
        for(const material of whites) material.dispose?.();
        return false;
      }
      targets.forEach((t,i)=>{t.mesh.material=whites[i];});
      enabled=true;
      return true;
    },
    dispose:restore,
  };
}
