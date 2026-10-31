// Existing 52scene C80-024 owner-photo material correction, ported ONLY to exact unified64 source.
// Same source mesh1664, node5631/5630, material216; no GLB geometry or shared material update.
// C80-024 / D2F-WP3 - photo-directed, reversible, display-only floor
// finish in the existing HI20 52-scene viewer. Owner photos 31.10.2026:
// 1000047536 + 1000047537 show a dark graphite textile-like floor.
// The numeric RGB is a WORK_ASSUMPTION, not field-measured material color.
// Never recolor shared source material216 (used by indoor 2F floors).
export const U64_C024_SOURCE_SHA='22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
export const C024_FINISH_RGB=[.20,.23,.28];
const TARGETS=[
 {scene:62,node:5631,name:'C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_SCENE2_WORK_TEST'},
 {scene:63,node:5630,name:'C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_SCENE0_WORK_TEST'},
];
const near=(a,b)=>typeof a==='number' && Number.isFinite(a) && Math.abs(a-b)<1e-5;
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function materialGuard(m) {
 const expected=[.78,.76,.72,1];
 return m?.name==='HI02_C80-015_2F_FLOOR_PALE_NEUTRAL_WORK_TEST' &&
  m?.alphaMode==='OPAQUE' && m?.doubleSided===true &&
  m?.extras?.presentationColorOnly===true &&
  Array.isArray(m?.pbrMetallicRoughness?.baseColorFactor) &&
  m.pbrMetallicRoughness.baseColorFactor.length===4 &&
  m.pbrMetallicRoughness.baseColorFactor.every((x,i)=>near(x,expected[i]));
}
function geometryGuard(g){
 const p=g?.getAttribute?.('position'),ix=g?.index;
 if(p?.count!==4||ix?.count!==6||!p.getX||!p.getY||!p.getZ||!ix.getX)
   return false;
 const corners=[[.22,2.76,0],[6.24,2.76,0],[6.24,2.76,1.565],[.22,2.76,1.565]];
 return corners.every((c,i)=>near(p.getX(i),c[0])&&near(p.getY(i),c[1])&&near(p.getZ(i),c[2])) &&
   [0,2,1,0,3,2].every((v,i)=>ix.getX(i)===v);
}
export function createUnified64C024BalconyFloorPresentation(gltf,sha){
 const j=gltf?.parser?.json,a=gltf?.parser?.associations;
 if(sha!==U64_C024_SOURCE_SHA||gltf?.scenes?.length!==64||j?.scenes?.length!==64||
    j?.scene!==0||j?.asset?.version!=='2.0'||
    j?.asset?.extras?.current!==false||j?.asset?.extras?.asBuilt!==false||
    typeof a?.get!=='function')return unavailable('sha-or-scene');
 const mesh=j.meshes?.[1664],p=mesh?.primitives?.[0];
 if(mesh?.name!=='C80_024_D_BALCONY_2F_FLOOR_FINISH_SURFACE_G1_WORK_TEST'||
    mesh?.primitives?.length!==1||mesh?.extras?.surfaceOnly!==true||
    mesh?.extras?.thicknessM!==null||mesh?.extras?.asBuilt!==false||
    mesh?.extras?.current!==false||mesh?.extras?.layerOwnership!=='D2F_BALCONY_C80_024'||
    p?.attributes?.POSITION!==2799||p?.indices!==2800||p?.material!==216||
    !materialGuard(j.materials?.[216]))return unavailable('source-mesh-material');
 const targets=[];
 for(const t of TARGETS) {
  const n=j.nodes?.[t.node];
  if(!j.scenes[t.scene]?.nodes?.includes(t.node)||
     n?.mesh!==1664||n?.name!==t.name||
     n?.extras?.changeId!=='C80-024-D2F-WP3-HI12-BALCONY-FLOOR-20261029'||
     n?.extras?.stage!=='WORK_TEST'||n?.extras?.sourceOnly!==false||
     n?.extras?.current!==false||n?.extras?.asBuilt!==false||
     n?.extras?.hostQuality!=='WORK_ASSUMPTION_HISTORICAL_PLAN_AND_KNOWN_GLAZING_ENVELOPE'||
     n?.extras?.sourceLinks?.length!==2||
     n.extras.sourceLinks[0]?.docId!=='1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI'||
     n.extras.sourceLinks[1]?.driveId!=='1Re8SKp3Uwxnb3jh-DZdDBlpOdJRQLECG')
    return unavailable('source-node-links');
  const found=[];
  gltf.scenes[t.scene]?.traverse?.(o=>{
   if(o?.isMesh===true&&o?.name===t.name&&a.get(o)?.nodes===t.node)found.push(o);
  });
  if(found.length!==1||found[0]?.visible!==true||Array.isArray(found[0].material)||
     typeof found[0].material?.clone!=='function'||
     typeof found[0].material?.color?.setRGB!=='function'||
     !geometryGuard(found[0].geometry))return unavailable('runtime-object-geometry');
  targets.push({obj:found[0],material:found[0].material});
 }
 if(targets.length!==2||targets[0].obj===targets[1].obj)return unavailable('runtime-roster');
 let enabled=false,clones=[];
 function setEnabled(want) {
  if(!want){
   if(enabled){
    targets.forEach((t,i)=>{t.obj.material=t.material;clones[i]?.dispose?.();});
    clones=[];enabled=false;
   }
   return true;
  }
  if(enabled)return true;
  const newMaterials=[];
  try{
   for(const t of targets){
    const m=t.material.clone();
    m.color.setRGB(...C024_FINISH_RGB);
    m.needsUpdate=true;
    newMaterials.push(m);
   }
  }catch{
   newMaterials.forEach(m=>m.dispose?.());return false;
  }
  targets.forEach((t,i)=>{t.obj.material=newMaterials[i];});
  clones=newMaterials;enabled=true;return true;
 }
 return {available:true,reason:null,count:2,get enabled(){return enabled;},
   setEnabled,dispose(){setEnabled(false);}};
}
