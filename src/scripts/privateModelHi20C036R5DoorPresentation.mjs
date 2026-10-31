// C80-036 / 31.10.2026 owner photo: white, smooth interior door surfaces.
// Exact HI20 52scene, reversible WORK_TEST material only. No new door, host,
// geometry, handing or physical dimension assertion. Distinct from C80-035
// intentionally doorless lobby opening and C80-033 sauna-KPH glass door.
export const C036_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:50,node:5397,parent:5787},
  {scene:51,node:5380,parent:5791},
];
const NAME='HI09_R5_DOOR__D2015_1F_DOOR_LEAF_WC_PLAN_PROXY';
const SOURCE=[0.86,0.845,0.8,1];
const WHITE=[0.93,0.93,0.93]; // view presentation, NOT measured paint color
const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<0.0005;
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
export function createHi20C036R5DoorPresentation(gltf,sha){
  const json=gltf?.parser?.json, assoc=gltf?.parser?.associations;
  if(sha!==C036_SOURCE_SHA || gltf?.scenes?.length!==52 ||
     json?.scenes?.length!==52 || json?.asset?.version!=='2.0' ||
     json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false)
    return unavailable('source-sha-or-scenes');
  if(typeof assoc?.get!=='function')return unavailable('associations');
  const sourceMesh=json.meshes?.[1586],p=sourceMesh?.primitives?.[0],
    sourceMaterial=json.materials?.[67],rgba=sourceMaterial?.pbrMetallicRoughness?.baseColorFactor;
  if(sourceMesh?.primitives?.length!==1 || p?.material!==67 ||
     !Array.isArray(rgba)||rgba.length!==4||rgba.some((v,i)=>!near(v,SOURCE[i])) ||
     sourceMaterial?.alphaMode==='BLEND')return unavailable('source-mesh-material');
  const matches=[];
  for(const t of TARGETS){
    const n=json.nodes?.[t.node],parent=json.nodes?.[t.parent];
    if(n?.mesh!==1586||n?.name!==NAME||n?.extras?.sourceOnly!==true||
       n?.extras?.physicalHost!=='HOST_HOLD'||n?.extras?.asBuilt!==false||
       n?.extras?.current!==false||!parent?.children?.includes(t.node)||
       n?.extras?.sourceLinks?.[0]?.docId!=='DOC:13j0u0PYL_aYZr6PepcsbRxmD-8gAgD2y')
      return unavailable('source-node-parent-links');
    const found=[];
    gltf.scenes[t.scene]?.traverse?.(o=>{
      if(o?.isMesh===true&&o.name===NAME&&assoc.get(o)?.nodes===t.node &&
         assoc.get(o.parent)?.nodes===t.parent)found.push(o);
    });
    if(found.length!==1)return unavailable('rendered-node-parent');
    const obj=found[0],m=obj.material;
    if(!m||Array.isArray(m)||typeof m.clone!=='function'||
       typeof m.color?.setRGB!=='function'||!near(m.opacity,1)||
       !near(m.color.r,SOURCE[0])||!near(m.color.g,SOURCE[1])||
       !near(m.color.b,SOURCE[2]))return unavailable('rendered-material');
    matches.push({obj,original:m});
  }
  if(new Set(matches.map(v=>v.obj)).size!==2)return unavailable('shared-mesh-instance');
  let enabled=false;let clones=[];
  function setEnabled(next){
    if(!next){
      if(enabled){matches.forEach((x,i)=>{x.obj.material=x.original;clones[i].dispose?.();});
        clones=[];enabled=false;}
      return true;
    }
    if(enabled)return true;
    const made=[];
    try{
      for(const m of matches){
        const copy=m.original.clone();copy.color.setRGB(...WHITE);copy.needsUpdate=true;
        made.push(copy);
      }
    }catch{made.forEach(m=>m.dispose?.());return false;}
    matches.forEach((x,i)=>{x.obj.material=made[i]});
    clones=made;enabled=true;return true;
  }
  return {available:true,reason:null,count:2,get enabled(){return enabled;},
    setEnabled,dispose:()=>setEnabled(false)};
}
