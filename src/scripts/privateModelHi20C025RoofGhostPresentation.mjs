// C80-011/019/025: exact HI20 SOURCE_ONLY two-hole roof, viewer preview only.
// No source GLB, geometry, world transform, roof-visibility default or host change.
export const C025_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS=[{sourceScene:24,sourceNode:5846,targetScene:48},{sourceScene:25,sourceNode:5847,targetScene:51}];
const fail=reason=>({available:false,reason,count:0,visible:false,setVisible:()=>false,mountControl:()=>false,dispose:()=>{}});
export async function createHi20C025RoofGhostPresentation(gltf,sha){
  const parser=gltf?.parser,json=parser?.json;
  if(sha!==C025_SOURCE_SHA||json?.asset?.version!=='2.0'||json?.asset?.extras?.current!==false||
     json?.asset?.extras?.asBuilt!==false||json.scene!==0||json.scenes?.length!==52||
     gltf.scenes?.length!==52||typeof parser?.getDependency!=='function')
    return fail('source-sha-or-scenes');
  const mesh=json.meshes?.[1776],material=json.materials?.[323],rgba=material?.pbrMetallicRoughness?.baseColorFactor;
  if(mesh?.primitives?.length!==1||mesh.primitives[0]?.material!==323||
    mesh.extras?.existingHoleCount!==2||material?.alphaMode!=='BLEND'||
    material?.doubleSided!==true||!Array.isArray(rgba)||rgba.length!==4||
    Math.abs(rgba[3]-.2)>0.000001)return fail('two-hole-roof-mesh');
  for(const item of TARGETS){
    const node=json.nodes?.[item.sourceNode],meta=node?.extras;
    if(node?.mesh!==1776||
      !/^HI17_C80_019_025_ROOF_GHOST_ALPHA020_EXISTING_TWO_HOLES_SC(?:17|18)_OPTIN$/.test(node?.name||'')||
      meta?.sourceOnly!==true||meta?.presentationOnly!==true||
      meta?.explicitOptinRequired!==true||meta?.physicalHost!=='HOST_HOLD'||
      meta?.current!==false||meta?.asBuilt!==false||meta?.humanReview!=='NOT_RUN'||
      meta?.canPublish!==false||meta?.canApplyToViewer!==false||
      meta?.sourceMetadata?.ylisScopeGate?.gate!=='HOLD_SOURCE_NOT_PROVEN'||
      meta?.K5SkylightIdentityVerified!==false||
      typeof meta?.sourceDriveId!=='string'||meta?.sourceLinksPreserved!==true||
      !json.scenes[item.sourceScene]?.nodes?.includes(item.sourceNode)||
      json.scenes[item.targetScene]?.nodes?.includes(item.sourceNode)||
      !gltf.scenes[item.targetScene]?.isScene||
      gltf.scenes[item.targetScene].children.some(child=>
        child?.name===node.name&&child?.userData?.sourceDriveId===meta.sourceDriveId)||
      json.nodes.some(parent=>parent.children?.includes(item.sourceNode)))
      return fail('roof-provenance-or-scene-membership');
  }
  let sourceNodes;
  try{sourceNodes=await Promise.all(TARGETS.map(t=>parser.getDependency('node',t.sourceNode)));}
  catch{return fail('roof-loader');}
  if(sourceNodes.length!==2||sourceNodes[0]===sourceNodes[1]||
    sourceNodes.some((root,i)=>!root?.isMesh||
      root.name!==json.nodes[TARGETS[i].sourceNode].name||
      !root.geometry||!root.material||root.visible!==true||typeof root.clone!=='function'))
    return fail('roof-mesh-identity');
  const mounts=[];
  try{
    for(let i=0;i<TARGETS.length;i++){
      const destination=gltf.scenes[TARGETS[i].targetScene],original=sourceNodes[i];
      const copy=original.clone(false);
      if(!copy?.isMesh||copy.geometry!==original.geometry||
        copy.material!==original.material||copy.name!==original.name||
        copy.userData?.sourceDriveId!==original.userData?.sourceDriveId)
        throw Error('nonexact-source-roof-copy');
      copy.visible=false; // ROOF OFF and default remain unchanged until user opt-in.
      destination.add(copy);
      mounts.push({destination,copy});
    }
  }catch{
    for(const {destination,copy} of mounts)destination.remove(copy);
    return fail('roof-mount');
  }
  let visible=false,disposed=false,control=null,checkbox=null;
  const api={
    available:true,reason:null,count:2,
    get visible(){return visible;},
    setVisible(next){
      if(disposed)return false;
      visible=Boolean(next);
      for(const {copy} of mounts)copy.visible=visible;
      if(checkbox)checkbox.checked=visible;
      return true;
    },
    mountControl(anchor){
      if(disposed||control||!anchor||typeof document==='undefined')return false;
      const box=document.createElement('div');box.id='hi20-c025-two-hole-roof-ghost-layer';box.className='layer-section';
      const label=document.createElement('label');label.className='layer-row';
      const input=document.createElement('input');input.type='checkbox';input.checked=false;
      input.id='hi20-c025-two-hole-roof-ghost-visible';
      const name=document.createElement('span');
      name.textContent='Viitteellinen kaksiaukkoinen katto (20 %, C80-025)';
      const note=document.createElement('div');note.className='layer-note';
      note.textContent='Vain HI20 2F/BOTH WORK_TEST. SOURCE_ONLY / HOST_HOLD, aukkojen K5-vastaavuus vahvistamatta. Erillinen valinta, ROOF OFF/ON ennallaan.';
      label.append(input,name);box.append(label,note);
      input.addEventListener('change',()=>{
        if(disposed)return;
        visible=Boolean(input.checked);
        for(const {copy} of mounts)copy.visible=visible;
      });
      anchor.insertAdjacentElement('afterend',box);control=box;checkbox=input;
      return true;
    },
    dispose(){
      if(disposed)return;
      control?.remove();control=null;checkbox=null;
      for(const {destination,copy} of mounts)destination.remove(copy);
      disposed=true;visible=false;
    },
  };
  return api;
}
