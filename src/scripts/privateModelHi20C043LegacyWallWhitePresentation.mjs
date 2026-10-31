// C80-043 / D2F-WP1: recolor only three existing blue-gray 2F WC/Room34
// WORK_TEST wall presentation meshes and their BOTH equivalents. The owner's
// baseline is white. Keep all source GLB geometry, opening, K17, SHA and
// sourceLinks unchanged; restore the original materials at disposal.
export const C043_LEGACY_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:48,wallParent:6445,doorParent:6447,reference:6432,
    walls:[{id:5077,mesh:1541,material:206,links:1,name:'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'},
           {id:5079,mesh:1543,material:208,links:2,name:'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'}],
    door:{id:5084,mesh:1546,material:211,links:1,name:'D2F_WC_DOOR_TOP_DISPLAY_ONLY'}},
  {scene:51,wallParent:6450,doorParent:6452,reference:6438,
    walls:[{id:5040,mesh:1531,material:196,links:1,name:'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'},
           {id:5042,mesh:1533,material:198,links:2,name:'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'}],
    door:{id:5047,mesh:1536,material:201,links:1,name:'D2F_WC_DOOR_TOP_DISPLAY_ONLY'}},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function exactMesh(scene,id,associations){
  const matches=[];
  scene?.traverse?.(mesh=>{
    if(!mesh?.isMesh)return;
    let item=mesh;
    while(item && item!==scene){
      if(associations.get(item)?.nodes===id){matches.push(mesh);break;}
      item=item.parent;
    }
  });
  return matches.length===1?matches[0]:null;
}
function nearColor(value,color){
  return Array.isArray(value) && value.length===4 &&
    value.every((v,i)=>typeof v==='number' && Math.abs(v-color[i])<1e-6);
}
export function createHi20C043LegacyWallWhitePresentation(gltf,sourceSha){
  const json=gltf?.parser?.json,associations=gltf?.parser?.associations;
  if(sourceSha!==C043_LEGACY_SOURCE_SHA ||
      json?.asset?.version!=='2.0' ||
      json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false ||
      json?.scene!==0 || json?.scenes?.length!==52 || gltf?.scenes?.length!==52 ||
      typeof associations?.get!=='function') return unavailable('source-sha-or-scene');
  const white=json.materials?.[340];
  if(white?.alphaMode!=='OPAQUE' ||
     !nearColor(white?.pbrMetallicRoughness?.baseColorFactor,[.93,.93,.93,1]))
    return unavailable('white-baseline');
  const originals=[];
  for(const t of TARGETS){
    const scene=gltf.scenes[t.scene],w=json.nodes?.[t.wallParent],d=json.nodes?.[t.doorParent];
    const ref=json.nodes?.[t.reference];
    if(!scene || !w?.children || !d?.children ||
       !t.walls.every(x=>w.children.includes(x.id)) ||
       !d.children.includes(t.door.id) ||
       !ref?.extras?.physicalWall ||
       ref.extras?.workTestC80_043?.ownerConfirmedWhite!==true ||
       json.meshes?.[ref.mesh]?.primitives?.[0]?.material!==340)
      return unavailable('parent-or-white-reference');
    const reference=exactMesh(scene,t.reference,associations);
    if(!reference || Array.isArray(reference.material) ||
       typeof reference.material?.clone!=='function' || !reference.material?.color)
      return unavailable('reference-object');
    for(const x of [...t.walls,t.door]){
      const node=json.nodes?.[x.id],mesh=json.meshes?.[x.mesh],
            material=json.materials?.[x.material];
      if(node?.mesh!==x.mesh || node?.name!==x.name ||
         !Array.isArray(node.extras?.sourceLinks) ||
         node.extras.sourceLinks.length!==x.links ||
         mesh?.primitives?.length!==1 ||
         mesh.primitives[0].material!==x.material ||
         material?.name!=='C80R1_D2015_2F_VISIBLE_WALLS_WORK_ASSUMPTION' ||
         !nearColor(material.pbrMetallicRoughness?.baseColorFactor,[.76,.83,.89,1]) ||
         (x===t.door ? node.extras?.modelStage!=='WORK_TEST' :
          node.extras?.representationKind!=='wall3DPresentationProxy'))
        return unavailable('legacy-node-mesh-material');
      const object=exactMesh(scene,x.id,associations);
      if(!object || !object.visible || Array.isArray(object.material) ||
         typeof object.material?.clone!=='function')
        return unavailable('legacy-loaded-object');
      originals.push({object,material:object.material,white:reference.material});
    }
  }
  if(originals.length!==6 || new Set(originals.map(x=>x.object)).size!==6)
    return unavailable('duplicate-or-incomplete');
  let enabled=false,temporary=[];
  function setEnabled(next){
    if(Boolean(next)===enabled) return true;
    if(!next){
      originals.forEach((x,i)=>{
        x.object.material=x.material;
        temporary[i]?.dispose?.();
      });
      temporary=[];enabled=false;return true;
    }
    const clones=[];
    try{
      for(const x of originals){
        const material=x.white.clone();
        material.transparent=false;
        material.opacity=1;
        material.depthWrite=true;
        material.needsUpdate=true;
        clones.push(material);
      }
    }catch{
      clones.forEach(x=>x.dispose?.());
      return false;
    }
    originals.forEach((x,i)=>{x.object.material=clones[i];});
    temporary=clones;enabled=true;return true;
  }
  return {available:true,reason:null,count:6,get enabled(){return enabled;},
    setEnabled,dispose(){setEnabled(false);}};
}
