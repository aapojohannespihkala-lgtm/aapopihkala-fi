import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';
// C80-016: reversible 260 mm north-wall correction from the already QA-verified donor.
// Exact immutable HI20 52-scene source; G1 source geometry +Y = north, GLB rendered Y-up.
export const C016_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const T=[
 {scene:48,node:5079,parent:6445,mesh:1543,material:208},
 {scene:51,node:5042,parent:6450,mesh:1533,material:198}
];
const NAME='D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY';
const MESH_NAME='ROOM34_BETWEEN_SOURCE_FACES_PROXY_3D_WORK_TEST';
const REF='G2_WALLREF_D_2F_ROOM34_LONGITUDINAL_2015_001';
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<0.00016;
const no=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
export function createHi20C016NorthWallPresentation(gltf,verifiedSha){
 const j=gltf?.parser?.json,assoc=gltf?.parser?.associations;
 if(verifiedSha!==C016_SOURCE_SHA||gltf?.scenes?.length!==52||
    j?.scenes?.length!==52||j?.nodes?.length!==6463||
    j?.asset?.extras?.current!==false||j?.asset?.extras?.asBuilt!==false||
    typeof assoc?.get!=='function')return no('exact-source');
 const targets=[];
 for(const t of T){
  const n=j.nodes[t.node],parent=j.nodes[t.parent],m=j.meshes?.[t.mesh];
  if(n?.name!==NAME||n?.mesh!==t.mesh||
    n.extras?.G2Id!==REF||n.extras?.currentAsBuilt!==false||
    n.extras?.representationKind!=='wall3DPresentationProxy'||
    n.extras?.sourceDerivedPlanSegment?.b?.[1]!==10.82||
    n.extras?.sourceDerivedPlanSegment?.a?.[1]!==7.366||
    n.extras?.sourceLinks?.length!==2||
    !parent?.children?.includes(t.node)||m?.name!==MESH_NAME||
    m?.primitives?.length!==1||m.primitives[0].attributes?.POSITION!==971||
    m.primitives[0].indices!==972||m.primitives[0].material!==t.material)
    return no('node-mesh-parent-source');
  const matches=[];
  gltf.scenes[t.scene]?.traverse?.(o=>{
   if(o.isMesh&&sameSourceName(o.name,NAME)&&assoc.get(o)?.nodes===t.node)matches.push(o);
  });
  if(matches.length!==1)return no('scene-instance');
  const obj=matches[0],geo=obj.geometry,p=geo?.getAttribute?.('position');
  if(!p||p.count!==8||typeof p.getY!=='function'||typeof p.setY!=='function'||
     geo?.index?.count!==36||typeof geo.clone!=='function')return no('vertex-layout');
  let south=0,north=0;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(!(near(x,3.549)||near(x,3.635))||
      !(near(z,2.76)||near(z,5.11)))return no('face-extent');
   if(near(y,7.366))south++;
   else if(near(y,10.82))north++;
   else return no('north-south-extent');
  }
  if(north!==4||south!==4)return no('endpoint-count');
  targets.push({obj,original:geo});
 }
 let enabled=false,clones=[],disposed=false;
 function setEnabled(next){
  if(disposed)return false;
  const want=Boolean(next);if(want===enabled)return true;
  if(!want){targets.forEach((t,i)=>{t.obj.geometry=t.original;clones[i]?.dispose?.();});
   clones=[];enabled=false;return true;}
  const made=[];
  try{
   for(const t of targets){
    const g=t.original.clone(),p=g.getAttribute('position');let changed=0;
    for(let i=0;i<p.count;i++)if(near(p.getY(i),10.82)){
     p.setY(i,10.56);changed++;
    }
    if(changed!==4)throw Error('endpoint-count');
    p.needsUpdate=true;g.computeBoundingBox?.();g.computeBoundingSphere?.();
    if(!g.boundingBox||!near(g.boundingBox.max.y,10.56)||
      !near(g.boundingBox.min.y,7.366))throw Error('clone-bounds');
    made.push(g);
   }
  }catch{made.forEach(g=>g.dispose?.());return false;}
  targets.forEach((t,i)=>{t.obj.geometry=made[i];});
  clones=made;enabled=true;return true;
 }
 return {available:true,reason:null,count:2,get enabled(){return enabled;},
  setEnabled,dispose(){if(disposed)return;setEnabled(false);disposed=true;}};
}
