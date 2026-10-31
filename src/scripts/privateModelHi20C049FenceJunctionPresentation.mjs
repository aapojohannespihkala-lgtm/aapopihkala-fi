// C80-049: two coplanar, opposite-facing endcaps at the 1F terrace
// screenpost / D-C source-only wall junction cause depth-buffer competition.
// Original C049 already cut the source wall to Z=1.704m: do not repeat it.
// Clip only the *uncovered part* of its final cap to Y=[1.43,2.76] world.
// Keep the 10 other wall faces and 2 opaque posts untouched.
// Source EXPLICIT WORK_TEST/HOST_HOLD/NONCURRENT, no as-built claim.
export const C049_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const SPECS=[
 {scene:50,root:6459,node:6458,post:1451,lower:1463,
  name:'HI20_INTEGRATED_C045_C049_K14_C80-049_COW_DC_WALL_SOURCE_CONTEXT_SCREENPOST_Z1704_1F_WORK_TEST_HOST_HOLD'},
 {scene:51,root:6462,node:6461,post:192,lower:204,
  name:'HI20_INTEGRATED_C045_C049_K14_C80-049_COW_DC_WALL_SOURCE_CONTEXT_SCREENPOST_Z1704_BOTH_WORK_TEST_HOST_HOLD'},
];
const near=(a,b,t=.00005)=>Number.isFinite(a)&&Math.abs(a-b)<t;
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function bounds(obj) {
 const p=obj?.geometry?.getAttribute?.('position'),e=obj?.matrixWorld?.elements;
 if(!p||p.count<3||!e||e.length!==16)return null;
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.count;i++) {
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const q=[e[0]*x+e[4]*y+e[8]*z+e[12],
    e[1]*x+e[5]*y+e[9]*z+e[13],
    e[2]*x+e[6]*y+e[10]*z+e[14]];
  if(q.some(v=>!Number.isFinite(v)))return null;
  for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],q[a]);hi[a]=Math.max(hi[a],q[a]);}
 }
 return {lo,hi};
}
function boxIs(b,lo,hi) {
 return !!b&&lo.every((v,i)=>near(b.lo[i],v,.0003))&&hi.every((v,i)=>near(b.hi[i],v,.0003));
}
function capGuard(geo) {
 const p=geo?.getAttribute?.('position'),ix=geo?.index;
 if(!p||p.count!==36||!ix||ix.count!==36||
    typeof geo?.clone!=='function'||typeof ix.getX!=='function'||
    typeof p.getX!=='function'||typeof p.getY!=='function'||typeof p.getZ!=='function')return false;
 if(Array.from({length:36},(_,i)=>ix.getX(i)).some((x,i)=>x!==i))return false;
 const cap=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],
            [-.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
 return cap.every((c,i)=>near(p.getX(i+24),c[0],1e-6)&&
   near(p.getY(i+24),c[1],1e-6)&&near(p.getZ(i+24),c[2],1e-6));
}
export function createHi20C049FenceJunctionPresentation(gltf,sha) {
 const j=gltf?.parser?.json,assoc=gltf?.parser?.associations;
 if(sha!==C049_SOURCE_SHA||j?.asset?.version!=='2.0'||
    j?.asset?.extras?.current!==false||j?.asset?.extras?.asBuilt!==false||
    j?.scenes?.length!==52||gltf?.scenes?.length!==52||
    typeof assoc?.get!=='function')return unavailable('source-sha-or-scenes');
 const p=j.meshes?.[1728]?.primitives?.[0];
 if(j.meshes?.[1728]?.name!=='C80-028_D_C_K3_EXISTING_SOURCE_MESH_OPAQUE_OPTIN_REVIEW'||
    j.meshes[1728].primitives?.length!==1||
    p?.attributes?.POSITION!==2567||p?.indices!==2568||p?.material!==282||
    j.materials?.[282]?.name!=='C80-028_D_C_BOUNDARY_OPAQUE_REVIEW_MATERIAL_SOURCE_ONLY'||
    j.materials[282]?.doubleSided!==true||
    j.materials[282]?.extras?.physicalHost!=='HOST_HOLD')
  return unavailable('source-primitive');
 const targets=[];
 for(const t of SPECS) {
  const n=j.nodes?.[t.node],root=j.nodes?.[t.root],sn=j.scenes?.[t.scene];
  if(n?.mesh!==1728||n?.name!==t.name||
    !sn?.nodes?.includes(t.root)||!root?.children?.includes(t.node)||
    n?.extras?.sourceOnly!==true||n.extras?.presentationOnly!==true||
    n.extras?.physicalHost!=='HOST_HOLD'||n.extras?.canApplyToViewer!==false||
    n.extras?.representationKind!=='SOURCE_CONTEXT'||
    n.extras?.sourceDriveId!=='1OladB8m0WJYVkBJARTKsi1xYNoW8px1M'||
    n.extras?.sourceGLBSHA256!=='145398c5fee2fccbedb820c4049117795fa1035265696511c854ba617ffe7b71'||
    j.nodes[t.post]?.mesh!==288||j.nodes[t.lower]?.mesh!==300)
    return unavailable('source-node-parent-provenance');
  const sc=gltf.scenes[t.scene],objects=new Map();
  sc?.updateMatrixWorld?.(true);
  sc?.traverse?.(obj=>{
    const ix=assoc.get(obj)?.nodes;
    if(obj?.isMesh===true&&[t.node,t.post,t.lower].includes(ix)){
      if(objects.has(ix))objects.set(ix,null);else objects.set(ix,obj);
    }
  });
  const wall=objects.get(t.node),post=objects.get(t.post),lower=objects.get(t.lower);
  if(!wall||!post||!lower||wall.name!==t.name||!wall.visible||
     !post.visible||!lower.visible||!capGuard(wall.geometry)||
     !boxIs(bounds(wall),[6.25,-.15,0],[6.5,2.76,1.704])||
     !boxIs(bounds(post),[6.25,-.11,1.704],[6.5,1.43,1.796])||
     !boxIs(bounds(lower),[6.25,-.4360914,1.704],[6.5,-.095,1.796]))
    return unavailable('runtime-coplanar-geometry');
  // The original wall Y center/scale -0.15..2.76 is verified above.
  // World post union covers wall cap Y<=1.43, retain only Y=1.43..2.76.
  const m=wall.matrixWorld.elements;
  if(!near(m[5],2.91)||!near(m[13],1.305)||!near(m[10],1.704)||!near(m[14],.852)||
     !near(m[0],.25)||!near(m[12],6.375))
    return unavailable('world-transform');
  targets.push({wall,original:wall.geometry});
 }
 if(targets.length!==2||targets[0].wall===targets[1].wall)return unavailable('roster');
 let enabled=false,clones=[];
 function setEnabled(next) {
  if(!next) {
   if(enabled){targets.forEach((t,i)=>{t.wall.geometry=t.original;clones[i]?.dispose?.();});clones=[];enabled=false;}
   return true;
  }
  if(enabled)return true;
  const made=[];
  try{
   const localY=(1.43-1.305)/2.91;
   for(const t of targets) {
    const g=t.original.clone(),pos=g.getAttribute('position');
    if(!pos||pos.count!==36||pos===t.original.getAttribute('position'))throw Error('clone-failed');
    for(let i=24;i<30;i++)
      if(near(pos.getY(i),-.5))pos.setY(i,localY);
    pos.needsUpdate=true;
    g.computeBoundingBox?.();g.computeBoundingSphere?.();
    made.push(g);
   }
  }catch{made.forEach(g=>g.dispose?.());return false;}
  targets.forEach((t,i)=>{t.wall.geometry=made[i];});
  clones=made;enabled=true;return true;
 }
 return {available:true,reason:null,count:2,get enabled(){return enabled;},setEnabled,dispose(){setEnabled(false);}};
}
