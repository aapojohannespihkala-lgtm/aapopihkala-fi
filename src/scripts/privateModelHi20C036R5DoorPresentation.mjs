// C80-036 / 31.10.2026 owner photo: white WC door surfaces AND frames.
// Exact HI20 52scene, reversible WORK_TEST material only. No new door, host,
// geometry, handing or physical dimension assertion. Distinct from C80-035
// intentionally doorless lobby opening and C80-033 sauna-KPH glass door.
export const C036_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:50,node:5397,parent:5787},
  {scene:51,node:5380,parent:5791},
];
const FRAMES=[
  {scene:50,node:5409,mesh:1589,part:'WEST',sourceScene:1},
  {scene:50,node:5410,mesh:1590,part:'EAST',sourceScene:1},
  {scene:50,node:5411,mesh:1591,part:'HEAD',sourceScene:1},
  {scene:51,node:5392,mesh:1589,part:'WEST',sourceScene:0},
  {scene:51,node:5393,mesh:1590,part:'EAST',sourceScene:0},
  {scene:51,node:5394,mesh:1591,part:'HEAD',sourceScene:0},
];
const NAME='HI09_R5_DOOR__D2015_1F_DOOR_LEAF_WC_PLAN_PROXY';
const DOOR_COLOR=[0.86,0.845,0.8,1];
const FRAME_COLOR=[0.53,0.39,0.24,1];
const WHITE=[0.93,0.93,0.93]; // view presentation, NOT measured paint color
const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<0.0005;
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const matchesColor=(material,expected)=>
  !!material&&!Array.isArray(material)&&typeof material.clone==='function'&&
  typeof material.color?.setRGB==='function'&&near(material.opacity,1)&&
  near(material.color.r,expected[0])&&near(material.color.g,expected[1])&&
  near(material.color.b,expected[2]);
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
     !Array.isArray(rgba)||rgba.length!==4||rgba.some((v,i)=>!near(v,DOOR_COLOR[i])) ||
     sourceMaterial?.alphaMode==='BLEND')return unavailable('source-mesh-material');
  const frameMaterial=json.materials?.[226],frameRGBA=frameMaterial?.pbrMetallicRoughness?.baseColorFactor;
  if(frameMaterial?.name!=='HI09_R5_FRAME_WORK_VISUAL' ||
     frameMaterial?.extras?.sourceOnly!==true ||
     frameMaterial?.extras?.physicalHost!=='HOST_HOLD' ||
     frameMaterial?.extras?.physicalStructureApproved!==false ||
     !Array.isArray(frameRGBA)||frameRGBA.length!==4 ||
     frameRGBA.some((v,i)=>!near(v,FRAME_COLOR[i])))
    return unavailable('source-frame-material');
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
    if(!matchesColor(m,DOOR_COLOR))return unavailable('rendered-door-material');
    matches.push({obj,original:m});
  }
  // The six R5 frame elements are existing scene roots, not new geometry.
  // Require the exact frame roster, source document, inherited HOST_HOLD and
  // material before changing a single pane; do not color unrelated frames.
  for(const t of FRAMES){
    const n=json.nodes?.[t.node],mesh=json.meshes?.[t.mesh];
    const expectedName=`HI09_R5_FRAME_${t.part}_SCENE${t.sourceScene}`;
    if(n?.name!==expectedName || n?.mesh!==t.mesh ||
       n?.extras?.measurementRole!==`R5_FRAME_${t.part}` ||
       n?.extras?.ownerSourceDoc!=='1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU' ||
       n?.extras?.sourceOnly!==true || n?.extras?.physicalHost!=='HOST_HOLD' ||
       n?.extras?.physicalStructureApproved!==false ||
       n?.extras?.current!==false || n?.extras?.asBuilt!==false ||
       mesh?.primitives?.length!==1 || mesh?.primitives[0]?.material!==226 ||
       !json.scenes[t.scene]?.nodes?.includes(t.node))
      return unavailable('source-frame-node-scene');
    const found=gltf.scenes[t.scene]?.children?.filter(o=>
      o?.isMesh===true && o.name===expectedName && assoc.get(o)?.nodes===t.node);
    if(found?.length!==1)return unavailable('rendered-frame-node');
    if(!matchesColor(found[0].material,FRAME_COLOR))return unavailable('rendered-frame-material');
    matches.push({obj:found[0],original:found[0].material});
  }
  if(matches.length!==8||new Set(matches.map(v=>v.obj)).size!==8)
    return unavailable('shared-or-missing-instance');
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
  return {available:true,reason:null,count:8,get enabled(){return enabled;},
    setEnabled,dispose:()=>setEnabled(false)};
}
