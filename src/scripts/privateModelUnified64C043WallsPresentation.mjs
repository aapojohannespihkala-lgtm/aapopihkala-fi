// C80-043 owner white-wall baseline on exact 64-scene WORK_TEST source.
// COW existing materials only: 2F/BOTH K17 low wall 1125 mm, WC/ROOM34,
// WC door head and balcony west sidewall. Do not change mesh, sourceLinks,
// parent, host, GLB, 1F, default/C70, and do not claim as-built.
export const U64_C043_SHA='22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const SOURCES=[
 {scene:62,reference:6432,entries:[
  {id:6443,parent:6445,mesh:1855,mat:227,links:3,name:'D2015_2F_WALL3D_LOWWALL_STAIR_A_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'},
  {id:6444,parent:6445,mesh:1856,mat:227,links:3,name:'D2015_2F_WALL3D_LOWWALL_STAIR_B_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'},
  {id:5077,parent:6445,mesh:1541,mat:206,links:1,name:'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'},
  {id:5079,parent:6445,mesh:1543,mat:208,links:2,name:'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'},
  {id:5084,parent:6447,mesh:1546,mat:211,links:1,name:'D2F_WC_DOOR_TOP_DISPLAY_ONLY'},
  {id:5880,parent:null,mesh:1791,mat:284,links:null,name:'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_24'},
 ]},
 {scene:63,reference:6438,entries:[
  {id:6448,parent:6450,mesh:1855,mat:227,links:3,name:'D2015_2F_WALL3D_LOWWALL_STAIR_A_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'},
  {id:6449,parent:6450,mesh:1856,mat:227,links:3,name:'D2015_2F_WALL3D_LOWWALL_STAIR_B_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'},
  {id:5040,parent:6450,mesh:1531,mat:196,links:1,name:'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'},
  {id:5042,parent:6450,mesh:1533,mat:198,links:2,name:'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'},
  {id:5047,parent:6452,mesh:1536,mat:201,links:1,name:'D2F_WC_DOOR_TOP_DISPLAY_ONLY'},
  {id:5882,parent:null,mesh:1791,mat:284,links:null,name:'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_25'},
 ]},
];
const no=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const eq=(a,b)=>Array.isArray(a)&&a.length===b.length &&
  a.every((v,i)=>typeof v==='number'&&Math.abs(v-b[i])<1e-6);
function find(scene,id,assoc){
  const hits=[];
  scene?.traverse?.(obj=>{
    if(!obj?.isMesh)return;
    let p=obj;
    while(p&&p!==scene){
      if(assoc.get(p)?.nodes===id){hits.push(obj);break;}
      p=p.parent;
    }
  });
  return hits.length===1?hits[0]:null;
}
export function createUnified64C043WallsPresentation(gltf,sha){
  const json=gltf?.parser?.json,assoc=gltf?.parser?.associations;
  if(sha!==U64_C043_SHA ||json?.asset?.version!=='2.0'||
     json?.asset?.extras?.current!==false||json?.asset?.extras?.asBuilt!==false||
     json?.scene!==0||json?.scenes?.length!==64||gltf?.scenes?.length!==64||
     typeof assoc?.get!=='function')return no('source');
  const wmat=json.materials?.[340];
  if(wmat?.alphaMode!=='OPAQUE'||
     !eq(wmat?.pbrMetallicRoughness?.baseColorFactor,[.93,.93,.93,1]))
    return no('owner-white-reference');
  const picked=[];
  for(const group of SOURCES){
    const scene=gltf.scenes[group.scene],sc=json.scenes[group.scene],
      ref=json.nodes?.[group.reference];
    if(!scene||!sc?.nodes?.includes(group.reference)||
       ref?.extras?.physicalWall!==true||
       ref.extras?.workTestC80_043?.ownerConfirmedWhite!==true||
       json.meshes?.[ref.mesh]?.primitives?.[0]?.material!==340)
      return no('reference-anchor');
    const whiteObj=find(scene,group.reference,assoc);
    if(!whiteObj||Array.isArray(whiteObj.material)||
       !whiteObj.material?.color||typeof whiteObj.material.clone!=='function')
      return no('reference-runtime');
    for(const t of group.entries){
      const n=json.nodes?.[t.id],mesh=json.meshes?.[t.mesh],
        m=json.materials?.[t.mat],p=t.parent===null?null:json.nodes?.[t.parent];
      if(n?.mesh!==t.mesh||n.name!==t.name||
         mesh?.primitives?.length!==1||
         mesh.primitives[0].material!==t.mat||
         (t.parent===null?!sc.nodes.includes(t.id):!p?.children?.includes(t.id))||
         (t.links===null?
           n.extras?.physicalHost!=='HOST_HOLD':
           !Array.isArray(n.extras?.sourceLinks)||n.extras.sourceLinks.length!==t.links)||
         (t.mat===227?
           n.extras?.representationKind!=='wall3DPresentationProxy'||
           n.extras?.ModelStage!=='WORK_TEST':
           t.mat===284?n.extras?.asBuilt!==false||
           n.extras?.current!==false:
           m?.name!=='C80R1_D2015_2F_VISIBLE_WALLS_WORK_ASSUMPTION')||
         !eq(m?.pbrMetallicRoughness?.baseColorFactor,
           t.mat===227?[.72,.61,.49,1]:
           t.mat===284?[.87,.86,.82,1]:[.76,.83,.89,1]))
        return no('target-source-identity');
      const obj=find(scene,t.id,assoc);
      if(!obj||obj.visible!==true||Array.isArray(obj.material)||
         typeof obj.material?.clone!=='function')
        return no('target-runtime');
      picked.push({obj,original:obj.material,white:whiteObj.material});
    }
  }
  if(picked.length!==12||new Set(picked.map(t=>t.obj)).size!==12)
    return no('target-count');
  let enabled=false,clones=[];
  function setEnabled(value){
    const next=Boolean(value);
    if(next===enabled)return true;
    if(!next){
      picked.forEach((t,i)=>{t.obj.material=t.original;clones[i]?.dispose?.();});
      clones=[];enabled=false;return true;
    }
    const made=[];
    try{
      for(const t of picked){
        const m=t.white.clone();
        m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true;
        made.push(m);
      }
    }catch{made.forEach(m=>m.dispose?.());return false;}
    picked.forEach((t,i)=>{t.obj.material=made[i];});
    clones=made;enabled=true;return true;
  }
  return {available:true,reason:null,count:12,get enabled(){return enabled;},
    setEnabled,dispose(){setEnabled(false);}};
}
