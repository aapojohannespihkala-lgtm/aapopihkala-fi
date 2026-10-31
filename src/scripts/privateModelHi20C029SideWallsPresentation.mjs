import { BoxGeometry } from 'three';

// Owner C80-029: the two original HI20 52-scene storage context walls are
// still zero-thickness planes. COW the SAME four source mesh objects into
// 60 mm closed DISPLAY_ONLY volumes, instead of adding overlapping walls.
// 60 mm was the independently released 30.10 local WORK_ASSUMPTION, not a
// field measurement; C047 EAST door wall keeps its separate 100 mm assumption.
export const C029_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[
  {scene:50,node:5754,mesh:1725,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4978',kind:'WEST'},
  {scene:50,node:5755,mesh:1726,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4979',kind:'NORTH'},
  {scene:51,node:5775,mesh:1725,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4966',kind:'WEST'},
  {scene:51,node:5776,mesh:1726,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4967',kind:'NORTH'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const near=(a,b,t=0.00015)=>Number.isFinite(a)&&Math.abs(a-b)<=t;
function expectedBox(kind) {
  // Local G1-derived source geometry. The original node's exact Y-up
  // glTF world matrix remains unchanged and performs the original rotation.
  // WEST: exterior X=0, 60 mm inward. NORTH: exterior local Y=10.810,
  // inward to 10.750, starting at X=.060 to meet the WEST solid without overlap.
  return kind==='WEST'
    ? {min:[0,8.928,0],max:[0.060,10.810,2.760],sourceAxis:0,plane:0}
    : {min:[0.060,10.750,0],max:[2.337,10.810,2.760],sourceAxis:1,plane:10.810};
}
function findSource(scene,association,node) {
  const found=[];
  scene?.traverse?.(o=>{if(o?.isMesh===true && association.get(o)?.nodes===node)found.push(o);});
  return found.length===1?found[0]:null;
}
export function createHi20C029SideWallsPresentation(gltf,sha) {
  const json=gltf?.parser?.json, association=gltf?.parser?.associations;
  if(sha!==C029_SOURCE_SHA || json?.asset?.version!=='2.0' || json?.scene!==0 ||
     json?.asset?.extras?.current!==false || json?.asset?.extras?.asBuilt!==false ||
     json?.scenes?.length!==52 || gltf?.scenes?.length!==52 ||
     typeof association?.get!=='function') return unavailable('sha-or-loader');
  const targets=[];
  for(const t of TARGETS) {
    const n=json.nodes?.[t.node], mesh=json.meshes?.[t.mesh];
    if(n?.name!==t.name || n.mesh!==t.mesh ||
       n.extras?.stage!=='WORK_TEST' || n.extras?.presentationOnly!==true ||
       n.extras?.representationKind!=='SOURCE_CONTEXT' ||
       n.extras?.physicalHost!=='HOST_HOLD' ||
       n.extras?.asBuilt!==false || n.extras?.current!==false ||
       mesh?.primitives?.length!==1 || mesh.primitives[0].material!==281)
      return unavailable('source-identity');
    const obj=findSource(gltf.scenes[t.scene],association,t.node);
    if(!obj || obj.name!==t.name || obj.visible!==true) return unavailable('scene-identity');
    const geometry=obj.geometry, position=geometry?.getAttribute?.('position');
    if(position?.count!==6 || typeof geometry?.computeBoundingBox!=='function')
      return unavailable('source-geometry');
    geometry.computeBoundingBox();
    const b=geometry.boundingBox, ex=expectedBox(t.kind);
    if(!b || !near(b.min[ex.sourceAxis===0?'x':'y'],ex.plane) ||
       !near(b.max[ex.sourceAxis===0?'x':'y'],ex.plane) ||
       !near(b.min.z,0) || !near(b.max.z,2.76) ||
       (t.kind==='WEST' && (!near(b.min.y,8.928)||!near(b.max.y,10.810))) ||
       (t.kind==='NORTH' && (!near(b.min.x,0)||!near(b.max.x,2.337))))
      return unavailable('source-bounds');
    targets.push({obj,original:geometry,kind:t.kind});
  }
  if(new Set(targets.map(t=>t.obj)).size!==4) return unavailable('duplicate-source');
  let enabled=false,clones=[];
  function setEnabled(next) {
    if(Boolean(next)===enabled) return true;
    if(!next) {
      targets.forEach((t,i)=>{t.obj.geometry=t.original;clones[i]?.dispose?.();});
      clones=[];enabled=false;return true;
    }
    const made=[];
    try {
      for(const t of targets) {
        const b=expectedBox(t.kind),min=b.min,max=b.max;
        const w=max.map((v,i)=>v-min[i]),center=max.map((v,i)=>(v+min[i])/2);
        const g=new BoxGeometry(w[0],w[1],w[2]);
        g.translate(center[0],center[1],center[2]);
        g.computeBoundingBox();
        if(!near(g.boundingBox.min.x,min[0]) || !near(g.boundingBox.max.x,max[0]) ||
           !near(g.boundingBox.min.y,min[1]) || !near(g.boundingBox.max.y,max[1]) ||
           !near(g.boundingBox.min.z,min[2]) || !near(g.boundingBox.max.z,max[2])) {
          g.dispose();throw new Error('new-box-bounds');
        }
        made.push(g);
      }
    }catch{made.forEach(g=>g.dispose());return false;}
    targets.forEach((t,i)=>{t.obj.geometry=made[i];});
    clones=made;enabled=true;return true;
  }
  return {available:true,reason:null,count:4,get enabled(){return enabled;},
    setEnabled,dispose(){setEnabled(false);}};
}
