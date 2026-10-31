import { createUnified64C043WallsPresentation } from './privateModelUnified64C043WallsPresentation.mjs';

// C80-042: existing C80R2 64scene source contains a KIV100 #003
// WORK_TEST reference in a window opening. Hide only that unhosted root
// in 1F60/BOTH63. Preserve actual GLB nodes, all nine other KIV vents,
// sourceLinks, transforms, C70 and all alternate scene content.
export const U64_KIV003_SHA =
  '22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const NAME='K10_R3_WORLD10_SC19_K10_R3_D1F_KIV100_ANCHOR_003_WORK_TEST_SLEEVE_COVER_ORIENT';
const TARGETS=[
  {scene:60, parent:1663, node:1622, parentCount:5},
  {scene:63, parent:6057, node:616, parentCount:10},
];
const no=(reason)=>({
  available:false,reason,count:0,corrected:false,
  setCorrected:()=>false,dispose:()=>{},
});
const exact=(parent,id,name,associations)=>{
  const hits=parent?.children?.filter(o=>o?.name===name &&
    associations.get(o)?.nodes===id);
  return hits?.length===1?hits[0]:null;
};
export function createUnified64Kiv003Presentation(gltf,verifiedSha){
  const parser=gltf?.parser, json=parser?.json,assoc=parser?.associations;
  if(verifiedSha!==U64_KIV003_SHA || json?.asset?.version!=='2.0' ||
    json?.asset?.extras?.current!==false ||
    json?.asset?.extras?.asBuilt!==false ||json?.scene!==0 ||
    gltf?.scenes?.length!==64 ||json?.scenes?.length!==64 ||
    typeof assoc?.get!=='function')
    return no('SHA-or-scene');
  const found=[];
  for(const t of TARGETS){
    const roots=json.scenes[t.scene]?.nodes;
    const p=json.nodes?.[t.parent],n=json.nodes?.[t.node];
    if(!Array.isArray(roots)||!roots.includes(t.parent) ||
      p?.children?.length!==t.parentCount ||
      p.children.filter(i=>i===t.node).length!==1 ||
      !p.name?.startsWith('K10_SC25_KIV100x10_WORLD_YUP_AXIS_REPLACEMENT_') ||
      p.extras?.modelStage!=='WORK_TEST' ||
      p.extras?.physicalWallCuts!=='NOT_VERIFIED' ||
      n?.name!==NAME||n.children?.length!==19 ||
      new Set(n.children).size!==19 ||
      n.extras?.realWallHostVerified!==false ||
      n.extras?.sourceAnchorCoverNode!==1151 ||
      n.extras?.sourceAnchorSleeveNode!==1150 ||
      n.extras?.C78SourceNode?.sourceScene!==77 ||
      n.extras?.C78SourceNode?.sourceNode!==20509 ||
      !n.children.every(i=>Number.isInteger(json.nodes?.[i]?.mesh) &&
        json.nodes[i].name?.startsWith(NAME+'__')))
      return no('source-node-or-parent-guard');
    const scene=gltf.scenes[t.scene];
    const pObj=exact(scene,t.parent,p.name,assoc);
    const nObj=exact(pObj,t.node,NAME,assoc);
    if(!pObj||!nObj || nObj.visible!==true||
      nObj.userData?.realWallHostVerified!==false ||
      nObj.children?.length!==19 ||
      !nObj.children.every((o,i)=>
        assoc.get(o)?.nodes===n.children[i]))
      return no('runtime-source-binding');
    found.push({obj:nObj,visible:nObj.visible});
  }
  if(found.length!==2 ||found[0].obj===found[1].obj)return no('shared-root');
  // U64 C80-043: original 52scene white-wall fixes cannot affect this 64scene source.
  // Mount independent source-locked material-only COW in the existing U64 lifecycle.
  const whiteWalls=createUnified64C043WallsPresentation(gltf,verifiedSha);
  let corrected=false,disposed=false;
  const setCorrected=next=>{
    if(disposed)return false;
    corrected=Boolean(next);
    for(const {obj,visible} of found)obj.visible=corrected?false:visible;
    if(whiteWalls.available)whiteWalls.setEnabled(corrected);
    return true;
  };
  return {
    available:true,reason:null,count:2,
    get c043WhiteWallsApplied(){return whiteWalls.enabled;},
    get c043WhiteWallsCount(){return whiteWalls.enabled?whiteWalls.count:0;},
    get corrected(){return corrected;},
    setCorrected,
    dispose(){
      if(disposed)return;
      setCorrected(false);
      whiteWalls.dispose();
      disposed=true;
    },
  };
}
