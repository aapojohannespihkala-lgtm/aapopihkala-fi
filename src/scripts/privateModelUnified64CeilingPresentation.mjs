// C80-030 D1F-WP6: 64scene already includes all four 1F ceiling reference
// surfaces in each active 1F/BOTH scene. Toggle existing meshes, not geometry.
// Exactly G2b 64scene SHA-locked; no inferred source positions, CURRENT or as-built.
export const C030_U64_SOURCE_SHA =
  '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const SURFACES = Object.freeze([
  {scene:60, roots:[
    [6419,1846,338,0.18,'HI20_D1F_WP6_C80_030_1F_WC_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6419'],
    [6420,1847,338,0.18,'HI20_D1F_WP6_C80_030_1F_KPH_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6420'],
    [6421,1848,339,0.10,'HI20_D1F_WP6_C80_030_1F_SAUNA_GHOST_PRESENTATION_ALPHA10__REBASED_ON_HI20_44SCENE_AS_6421'],
    [6497,1860,343,0.12,'C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_1F_NONPHYSICAL_OPTIN'],
  ]},
  {scene:63, roots:[
    [6423,1846,338,0.18,'HI20_D1F_WP6_C80_030_BOTH_WC_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6423'],
    [6424,1847,338,0.18,'HI20_D1F_WP6_C80_030_BOTH_KPH_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6424'],
    [6425,1848,339,0.10,'HI20_D1F_WP6_C80_030_BOTH_SAUNA_GHOST_PRESENTATION_ALPHA10__REBASED_ON_HI20_44SCENE_AS_6425'],
    [6498,1860,343,0.12,'C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_BOTH_NONPHYSICAL_OPTIN'],
  ]},
]);
const unavailable=reason=>({
  available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{},
});
/** Reversible original-root visibility control; 2F62/C70/default untouched. */
export function createC80R2Unified64CeilingPresentation(gltf, verifiedSha){
  const json=gltf?.parser?.json;
  const association=gltf?.parser?.associations;
  if(verifiedSha!==C030_U64_SOURCE_SHA ||
     json?.asset?.version!=='2.0' || json?.scene!==0 ||
     json?.asset?.extras?.asBuilt!==false || json?.asset?.extras?.current!==false ||
     json?.scenes?.length!==64 || gltf?.scenes?.length!==64 ||
     json?.nodes?.length!==6518 || json?.meshes?.length!==1861 ||
     typeof association?.get!=='function')
    return unavailable('exact-source');
  const matched=[];
  for(const target of SURFACES){
    const sourceScene=json.scenes[target.scene];
    const scene=gltf.scenes[target.scene];
    if(sourceScene?.extras?.stage!=='WORK_TEST' ||
       !Array.isArray(sourceScene?.nodes) || !scene?.children ||
       !scene?.remove || !scene?.add || sourceScene.nodes.length!==scene.children.length)
      return unavailable('scene-identity');
    for(const [id,meshId,materialId,alpha,name] of target.roots){
      const node=json.nodes[id],mesh=json.meshes[meshId];
      const material=json.materials?.[materialId];
      if(!sourceScene.nodes.includes(id) ||
         node?.name!==name || node?.mesh!==meshId ||
         mesh?.primitives?.length!==1 || mesh.primitives[0].material!==materialId ||
         material?.alphaMode!=='BLEND' || material?.doubleSided!==true ||
         Math.abs((material?.pbrMetallicRoughness?.baseColorFactor?.[3]??-10)-alpha)>1e-7 ||
         (meshId===1860&&(node.extras?.presentationOnly!==true ||
           node.extras?.observation!=='C80-030'||node.extras?.physical!==false)))
        return unavailable('ceiling-source-identity');
      const found=scene.children.filter(obj=>
        obj?.isMesh===true && obj.name===name &&
        association.get(obj)?.nodes===id);
      if(found.length!==1 || found[0].visible!==true)
        return unavailable('ceiling-object-identity');
      matched.push({obj:found[0],original:true,id,scene:target.scene});
    }
  }
  if(matched.length!==8 || new Set(matched.map(x=>x.obj)).size!==8)
    return unavailable('ceiling-duplicate');
  let enabled=true,disposed=false;
  return {available:true,reason:null,count:8,
    get enabled(){return enabled;},
    setEnabled(value){
      if(disposed)return false;
      enabled=Boolean(value);
      for(const {obj} of matched)obj.visible=enabled;
      return true;
    },
    dispose(){
      if(disposed)return;
      disposed=true;enabled=false;
      for(const {obj,original} of matched)obj.visible=original;
    },
  };
}
