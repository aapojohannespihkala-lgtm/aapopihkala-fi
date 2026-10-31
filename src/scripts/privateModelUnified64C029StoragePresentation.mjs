import { BoxGeometry } from 'three';

// D1F-WP3 / C80-029: 64-scene U64 active 1F60/BOTH63 omits the existing
// C80-029 west/north storage wall and roof source roots. The C80-047 white
// EAST doorwall is already present. Clone exact previously authored source
// objects, replacing only the two zero-depth sidewall geometries with
// the previously RELEASED 60mm C80-029 WORK_ASSUMPTION display boxes.
// No GLB/BIN mutations, no parallel old wall behind a corrected wall.
export const U64_C029_SHA =
  '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const SPECS=[
  {scene:60,from:8,door:6345,roots:49,
    items:[[5754,1725,'WEST'],[5755,1726,'NORTH'],[5757,514,'ROOF']]},
  {scene:63,from:9,door:6396,roots:84,
    items:[[5775,1725,'WEST'],[5776,1726,'NORTH'],[5778,514,'ROOF']]},
];
const SOURCE_NAMES={
  5754:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4978',
  5755:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4979',
  5757:'C80_029_HI13_D_STORAGE_ROOF_C_TO_D_SOURCE_ONLY_OPTIN_HOST_HOLD',
  5775:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4966',
  5776:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4967',
  5778:'C80_029_HI13_D_STORAGE_ROOF_C_TO_D_SOURCE_ONLY_OPTIN_HOST_HOLD',
};
const unavail=reason=>({
  available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{},
});
const close=(a,b,t=.00015)=>Number.isFinite(a)&&Math.abs(a-b)<=t;
const boxSpec=kind=>kind==='WEST'
  ?{min:[0,8.928,0],max:[.060,10.810,2.760],axis:'x',plane:0}
  :{min:[.060,10.750,0],max:[2.337,10.810,2.760],axis:'y',plane:10.810};
function find(scene,associations,id,name){
  let result=null,count=0;
  scene?.traverse?.(o=>{
    if(o?.isMesh===true&&o.name===name&&associations.get(o)?.nodes===id){
      result=o;count++;
    }
  });
  return count===1?result:null;
}
function identity(m){
  const a=m?.elements;return a?.length===16 &&
    a.every((v,i)=>close(v,i%5===0?1:0,1e-7));
}
function sourceMatrixMatches(m,raw){
  const a=m?.elements;return raw?.length===16&&a?.length===16 &&
    a.every((v,i)=>close(v,raw[i],1e-7));
}
export function createUnified64C029StoragePresentation(gltf,sha){
  const j=gltf?.parser?.json,assoc=gltf?.parser?.associations,scenes=gltf?.scenes;
  if(sha!==U64_C029_SHA||j?.asset?.version!=='2.0'||
    j?.asset?.extras?.current!==false||j?.asset?.extras?.asBuilt!==false||
    j?.scene!==0||j?.scenes?.length!==64||scenes?.length!==64||
    j?.nodes?.length!==6518||j?.meshes?.length!==1861||
    typeof assoc?.get!=='function')return unavail('exact-source');
  if(j.meshes?.[1725]?.primitives?.[0]?.material!==281||
    j.meshes?.[1726]?.primitives?.[0]?.material!==281||
    j.meshes?.[514]?.primitives?.[0]?.material!==85||
    j.meshes?.[1820]?.primitives?.[0]?.material!==333||
    j.materials?.[333]?.pbrMetallicRoughness?.baseColorFactor?.some((v,i)=>
      !close(v,[.93,.93,.93,1][i],1e-6))||
    j.materials?.[85]?.alphaMode!=='BLEND'||
    !close(j.materials?.[85]?.pbrMetallicRoughness?.baseColorFactor?.[3],.58,1e-6))
    return unavail('source-material');
  const candidates=[];
  for(const spec of SPECS){
    const target=scenes[spec.scene],sourceScene=scenes[spec.from];
    if(j.scenes[spec.scene]?.nodes?.length!==spec.roots||
      !j.scenes[spec.scene]?.nodes?.includes(spec.door)||
      !target?.isScene||!sourceScene?.isScene||
      !identity(target.matrixWorld)||!identity(sourceScene.matrixWorld)||
      target.children?.length!==spec.roots ||
      target.children.some(o=>o?.userData?.c029U64Clone===true))
      return unavail('target-contract-or-duplicate');
    const dn=j.nodes[spec.door];
    if(dn?.mesh!==1820||dn?.extras?.physicalHost!=='HOST_HOLD'||
       dn?.extras?.sourceNodeHI13!==4980||
       dn?.extras?.sourceDriveId!=='1OladB8m0WJYVkBJARTKsi1xYNoW8px1M')
      return unavail('east-doorwall-existing');
    const door=find(target,assoc,spec.door,dn.name);
    if(!door||!door.material||Array.isArray(door.material))
      return unavail('east-doorwall-runtime');
    sourceScene.updateMatrixWorld?.(true);
    for(const [id,meshId,kind] of spec.items){
      const n=j.nodes[id],mesh=j.meshes[meshId],name=SOURCE_NAMES[id];
      if(n?.name!==name||n?.mesh!==meshId||
        n?.extras?.stage!=='WORK_TEST'||
        n?.extras?.physicalHost!=='HOST_HOLD'||
        n?.extras?.sourceLinksRequireRebind!==true||
        typeof n?.extras?.sourceDriveId!=='string'||
        mesh?.primitives?.length!==1||
        !j.scenes[spec.from]?.nodes?.includes(id)||
        j.scenes[spec.scene]?.nodes?.includes(id)||
        j.nodes.some(p=>p.children?.includes(id))||
        !sourceMatrixMatches({elements:n.matrix},n.matrix))
        return unavail('source-root-identity');
      if(kind==='ROOF' && (n.extras?.roofHostValidated!==false||
          n.extras?.sourceOnly!==true||
          !close(n.matrix?.[13],2.760)))
        return unavail('roof-source-host');
      if(kind!=='ROOF'&&(n.extras?.presentationOnly!==true||
          n.extras?.sourceOnly!==false||
          n.extras?.representationKind!=='SOURCE_CONTEXT'))
        return unavail('wall-source-host');
      const original=find(sourceScene,assoc,id,name);
      if(!original?.geometry||!original?.material||
        !original.visible||typeof original.clone!=='function'||
        !sourceMatrixMatches(original.matrix,n.matrix))
        return unavail('source-runtime-node');
      if(kind!=='ROOF'){
        const g=original.geometry,pos=g?.getAttribute?.('position');
        if(pos?.count!==6||typeof g?.computeBoundingBox!=='function')
          return unavail('source-plane-geometry');
        g.computeBoundingBox();
        const b=g.boundingBox,ex=boxSpec(kind);
        if(!b||!close(b.min[ex.axis],ex.plane)||
          !close(b.max[ex.axis],ex.plane)||
          !close(b.min.z,0)||!close(b.max.z,2.76)||
          (kind==='WEST'&&(!close(b.min.y,8.928)||!close(b.max.y,10.810)))||
          (kind==='NORTH'&&(!close(b.min.x,0)||!close(b.max.x,2.337))))
          return unavail('source-plane-bounds');
      }else if(!original.isMesh ||original.geometry!==original.geometry)
        return unavail('source-roof-mesh');
      candidates.push({target,original,door,kind,id});
    }
  }
  if(candidates.length!==6||
    new Set(candidates.map(x=>x.original)).size!==6)
    return unavail('source-roster');
  const created=[];
  try{
    for(const {target,original,door,kind,id} of candidates){
      const clone=original.clone(false);
      if(!clone.isMesh||clone.name!==original.name)
        throw Error('root-clone');
      let ownGeometry=null;
      if(kind!=='ROOF'){
        const {min,max}=boxSpec(kind),size=max.map((v,i)=>v-min[i]);
        const center=min.map((v,i)=>(v+max[i])/2);
        ownGeometry=new BoxGeometry(...size);
        ownGeometry.translate(...center);ownGeometry.computeBoundingBox();
        for(const axis of ['x','y','z']){
          const i={x:0,y:1,z:2}[axis];
          if(!close(ownGeometry.boundingBox.min[axis],min[i])||
            !close(ownGeometry.boundingBox.max[axis],max[i]))
            throw Error('C029-wall-box-bounds');
        }
        clone.geometry=ownGeometry;
        clone.material=door.material; // existing owner-WHITE C047, no global mutation
      }else if(clone.geometry!==original.geometry||
        clone.material!==original.material)throw Error('roof-mesh-copy');
      clone.userData={...clone.userData,c029U64Clone:true,
        c029SourceNode:id,c029SourceScene:candidates.find(x=>x.id===id)?.kind?(
          id<5775?8:9):null,c029DisplayOnly:true,
        c029WallThicknessM:kind==='ROOF'?null:.060,
        physicalHost:'HOST_HOLD',current:false,asBuilt:false};
      clone.visible=true;target.add(clone);
      created.push({target,clone,ownGeometry});
    }
  }catch{
    for(const {target,clone,ownGeometry} of created){target.remove(clone);ownGeometry?.dispose?.();}
    return unavail('clone-or-box');
  }
  let enabled=true,disposed=false;
  function setEnabled(next){
    if(disposed)return false;
    enabled=Boolean(next);
    for(const {clone} of created)clone.visible=enabled;
    return true;
  }
  function dispose(){
    if(disposed)return;
    for(const {target,clone,ownGeometry} of created){
      target.remove(clone);ownGeometry?.dispose?.();
    }
    disposed=true;enabled=false;
  }
  return {available:true,reason:null,count:6,get enabled(){return enabled;},
    setEnabled,dispose};
}
