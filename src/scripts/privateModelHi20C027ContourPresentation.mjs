// C80-027 / D1F-WP1: source-only terrain contour presentation.
// Make the existing 1m major lines dark (52mm) and 0.5m intermediate
// lines lighter and thinner (26mm). LOCAL work datum, not N2000 survey.
// Copy-on-write on exact HI20 source; no extra mesh/terrain geometry.
export const C027_CONTOUR_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:50,parent:6454,node:6453,part:'1F'},
  {scene:51,parent:6456,node:6455,part:'BOTH'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const near=(a,b,e=1e-4)=>Number.isFinite(a)&&Math.abs(a-b)<e;
function classifySegments(geometry) {
  const p=geometry?.getAttribute?.('position'),ix=geometry?.index;
  if(p?.count!==7788||ix?.count!==11682||
     typeof p.getX!=='function'||typeof p.getY!=='function'||typeof p.getZ!=='function'||
     typeof ix.getX!=='function'||typeof geometry.clone!=='function')return null;
  const major=[],minor=[];
  for(let seg=0;seg<1947;seg++) {
    const base=seg*4,level=(p.getZ(base)-.03);
    const half=Math.round(level*2)/2;
    if(!near(level,half,0.00015))return null;
    for(let k=1;k<4;k++)if(!near(p.getZ(base+k),p.getZ(base),0.00015))return null;
    const six=Array.from({length:6},(_,k)=>ix.getX(seg*6+k));
    if(six.some(x=>!Number.isInteger(x)||x<base||x>=base+4)||
       new Set(six).size!==4)return null;
    (near(half,Math.round(half))?major:minor).push(...six);
  }
  if(major.length!==5970||minor.length!==5712)return null;
  return {major,minor};
}
function findExactObject(scene,parentId,nodeId,nodeName,parentName,assoc) {
  let result=null,count=0;
  scene?.traverse?.(o=>{
    if(o?.isMesh!==true||o.name!==nodeName||assoc.get(o)?.nodes!==nodeId)return;
    if(assoc.get(o.parent)?.nodes!==parentId||o.parent?.name!==parentName)return;
    result=o;count++;
  });
  return count===1?result:null;
}
export function createHi20C027ContourPresentation(gltf,verifiedSha){
  const j=gltf?.parser?.json,assoc=gltf?.parser?.associations;
  if(verifiedSha!==C027_CONTOUR_SOURCE_SHA||gltf?.scenes?.length!==52||
     j?.scenes?.length!==52||j?.asset?.version!=='2.0'||j?.scene!==0||
     j?.asset?.extras?.asBuilt!==false||j?.asset?.extras?.current!==false||
     typeof assoc?.get!=='function')return unavailable('sha-scenes');
  const mesh=j.meshes?.[1857],m=j.materials?.[341],prim=mesh?.primitives?.[0];
  const color=m?.pbrMetallicRoughness?.baseColorFactor;
  if(mesh?.name!=='C80_027_HI20_EXISTING_0P5M_CONTOUR_TRIANGLE_RIBBONS_DISPLAY_ONLY'||
     mesh.primitives?.length!==1||mesh.extras?.originalSegments!==1947||
     mesh.extras?.newTriangles!==3894||prim?.indices!==3060||
     prim?.attributes?.POSITION!==3058||prim?.material!==341||
     !Array.isArray(color)||!color.every((v,i)=>near(v,[.105,.155,.165,1][i],1e-6))||
     m?.extras?.datum!=='MODEL_LOCAL_ONLY')return unavailable('source-mesh-material');
  const targets=[];
  for(const t of TARGETS) {
    const scene=gltf.scenes[t.scene],node=j.nodes?.[t.node],parent=j.nodes?.[t.parent];
    if(!j.scenes[t.scene]?.nodes?.includes(t.parent) ||
       parent?.children?.filter(x=>x===t.node)?.length!==1||
       node?.mesh!==1857||
       !node?.name?.startsWith('C80_027_HI20_MODEL_LOCAL_0P5M_CONTOURS_THICKENED_DISPLAY_ONLY_'+t.part)||
       node.extras?.representationKind!=='DERIVED_TERRAIN_ISOLINES_ONLY'||
       node.extras?.physicalHost!=='HOST_HOLD'||node.extras?.sourceOnly!==true||
       node.extras?.current!==false||node.extras?.asBuilt!==false||
       node.extras?.sourceLinks?.length!==1||
       node.extras.sourceLinks[0]?.driveId!=='1XOld_YLurqS-NHzXWotzywD0YiP4nFOK'||
       node.extras?.contourIntervalModelMeters!==.5)return unavailable('source-parent-node');
    const o=findExactObject(scene,t.parent,t.node,node.name,parent.name,assoc);
    if(!o||o.visible!==true||Array.isArray(o.material)||
       typeof o.material?.clone!=='function'||typeof o.material?.color?.setRGB!=='function')
      return unavailable('runtime-object-material');
    const segments=classifySegments(o.geometry);
    if(!segments)return unavailable('runtime-geometry');
    targets.push({o,originalGeometry:o.geometry,originalMaterial:o.material,segments});
  }
  if(targets.length!==2||targets[0].o===targets[1].o)return unavailable('roster');
  let enabled=false,created=[];
  function disable(){
    if(!enabled)return true;
    targets.forEach((t,i)=>{
      t.o.geometry=t.originalGeometry;t.o.material=t.originalMaterial;
      created[i].geometry?.dispose?.();created[i].light?.dispose?.();
    });
    created=[];enabled=false;return true;
  }
  function setEnabled(want){
    if(!want)return disable();
    if(enabled)return true;
    const clones=[];
    try{
      for(const t of targets){
        const geometry=t.originalGeometry.clone(),pos=geometry.getAttribute('position');
        // Each source ribbon segment has four private vertices; retain its
        // centreline and source height while halving only minor-line width.
        for(let seg=0;seg<1947;seg++){
          if(near(pos.getZ(seg*4)-.03,Math.round(pos.getZ(seg*4)-.03)))continue;
          const start=seg*4;
          let mx=0,my=0;
          for(let k=0;k<4;k++){mx+=pos.getX(start+k);my+=pos.getY(start+k);}
          mx/=4;my/=4;
          for(let k=0;k<4;k++){
            pos.setXY(start+k,mx+(pos.getX(start+k)-mx)*.5,my+(pos.getY(start+k)-my)*.5);
          }
        }
        pos.needsUpdate=true;
        geometry.setIndex([...t.segments.major,...t.segments.minor]);
        geometry.clearGroups();
        geometry.addGroup(0,5970,0);geometry.addGroup(5970,5712,1);
        geometry.computeBoundingBox?.();geometry.computeBoundingSphere?.();
        const light=t.originalMaterial.clone();
        light.color.setRGB(.58,.64,.63);
        light.needsUpdate=true;
        clones.push({geometry,light});
      }
    }catch{
      clones.forEach(x=>{x.geometry?.dispose?.();x.light?.dispose?.();});
      return false;
    }
    targets.forEach((t,i)=>{t.o.geometry=clones[i].geometry;t.o.material=[t.originalMaterial,clones[i].light];});
    created=clones;enabled=true;return true;
  }
  return {available:true,reason:null,count:2,majorSegments:995,minorSegments:952,
    get enabled(){return enabled;},setEnabled,dispose:disable};
}
