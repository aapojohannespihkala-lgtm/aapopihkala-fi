// D2F K5: recover five already-modelled kitchen lightwell parts in live 2F/BOTH.
// Exact HI20 source only, reversible WORK_TEST rendering. No roof boolean cut.
export const K5_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const ITEMS=[
  [3373,3666,520,88,'K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS'],
  [3374,3666,521,89,'K5_SC7_K5_D_KITCHEN_CURB_FRAME'],
  [3375,3666,522,90,'K5_SC7_K5_D_KITCHEN_RECESSED_GLASS_WORKTEST'],
  [3397,3411,636,88,'K8_SC13_K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS_EXTENDED_TO_2F_CEILING_WORK_ASSUMPTION'],
  [3398,3411,637,88,'K8_SC13_K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS_2F_CEILING_OPEN_FRAME_WORK_ASSUMPTION'],
];
const no=(reason)=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-7;
function identity(matrix){
 const a=matrix?.elements;
 return a?.length===16 && a.every((x,i)=>near(x,i%5===0?1:0));
}
function reachable(j,s,id){
 const stack=[...(j.scenes?.[s]?.nodes||[])],seen=new Set();
 while(stack.length){const n=stack.pop();if(n===id)return true;
   if(seen.has(n))continue;seen.add(n);
   for(const child of j.nodes?.[n]?.children||[])stack.push(child);}
 return false;
}
function exactMesh(scene,assoc,id,name){
 const matches=[];
 scene.traverse(o=>{if(o.isMesh&&o.name===name&&assoc.get(o)?.nodes===id)matches.push(o);});
 return matches.length===1?matches[0]:null;
}
export function createHi20K5KitchenWellPresentation(gltf,verifiedSha){
 const j=gltf?.parser?.json,scenes=gltf?.scenes,assoc=gltf?.parser?.associations;
 if(verifiedSha!==K5_SOURCE_SHA||j?.asset?.version!=='2.0'||
    j?.asset?.extras?.current!==false||j?.asset?.extras?.asBuilt!==false||
    j?.scene!==0||j?.scenes?.length!==52||scenes?.length!==52||
    j?.nodes?.length!==6463||j?.meshes?.length!==1859||
    typeof assoc?.get!=='function')return no('exact-source');
 const src=scenes[3];
 if(!src?.traverse||!src?.updateMatrixWorld)return no('full-context');
 for(const index of [48,51]){
   const target=scenes[index];target?.updateMatrixWorld?.(true);
   if(!target?.add||!target?.remove||!identity(target.matrixWorld))
      return no('target-world-transform');
 }
 src.updateMatrixWorld(true);
 const sourceObjects=[];
 for(const [id,parentId,meshId,materialId,name] of ITEMS){
   const node=j.nodes[id],parent=j.nodes[parentId];
   if(node?.name!==name||node?.mesh!==meshId||
      !parent?.children?.includes(id)||j.meshes[meshId]?.primitives?.length!==1||
      j.meshes[meshId].primitives[0].material!==materialId||
      (id<3397&&node.extras?.K5PhysicalRoofOpeningAuthorized!==true)||
      (id>=3397&&node.extras?.hostStatus!=='PHYSICAL_CEILING_OPENING_UNCUT_HOLD')||
      !reachable(j,3,id)||[48,51].some(s=>reachable(j,s,id)))
     return no('source-node-or-host-identity');
   const mesh=exactMesh(src,assoc,id,name);
   if(!mesh||!mesh.visible||!mesh.geometry||!mesh.material||
      typeof mesh.clone!=='function'||!mesh.matrixWorld?.elements?.every(Number.isFinite))
     return no('scene3-render-mesh');
   sourceObjects.push(mesh);
 }
 const mounted=[];
 try{
  for(const s of [48,51]){
    for(let i=0;i<ITEMS.length;i++){
       const source=sourceObjects[i],clone=source.clone(false);
       clone.name='HI20_K5_SC3_WORK_TEST_'+s+'_'+ITEMS[i][0];
       clone.matrixAutoUpdate=false;
       clone.matrix.copy(source.matrixWorld); // GLB world -> identity scene root
       clone.visible=false;
       clone.userData={...clone.userData,k5SourceNode:ITEMS[i][0],
         k5SourceScene:3,k5SourceSha:K5_SOURCE_SHA,
         physicalCeilingOpeningCut:false,asBuilt:false,current:false};
       scenes[s].add(clone);mounted.push({scene:scenes[s],clone});
    }
  }
 }catch{for(const {scene,clone} of mounted)scene.remove(clone);return no('mount-failed');}
 if(mounted.length!==10){for(const {scene,clone} of mounted)scene.remove(clone);return no('count');}
 let enabled=false,disposed=false;
 return {available:true,reason:null,count:10,
   get enabled(){return enabled;},
   setEnabled(next){if(disposed)return false;enabled=Boolean(next);
     for(const {clone} of mounted)clone.visible=enabled;return true;},
   dispose(){if(disposed)return;
     for(const {scene,clone} of mounted)scene.remove(clone);
     enabled=false;disposed=true;}
 };
}
