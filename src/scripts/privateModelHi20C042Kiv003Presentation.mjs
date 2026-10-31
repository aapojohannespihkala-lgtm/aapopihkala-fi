// C80-042 / D1F-WP7: hide only the unhosted #003 KIV-100 in the window
// in HI20's active 1F/BOTH presentations. The KIV object, geometry and
// metadata remain intact for later measured wall-host placement.
export const C042_KIV003_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const NAME = 'K10_R3_WORLD10_SC19_K10_R3_D1F_KIV100_ANCHOR_003_WORK_TEST_SLEEVE_COVER_ORIENT';
const TARGETS = [
  {scene:50, parent:1663, node:1622, parentCount:5},
  {scene:51, parent:6057, node:616, parentCount:10},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
function exactChild(sceneRoot, id, name, assoc) {
  const found=sceneRoot?.children?.filter(o=>o?.name===name && assoc.get(o)?.nodes===id);
  return found?.length===1 ? found[0] : null;
}
export function createHi20C042Kiv003Presentation(gltf, verifiedSha) {
  const json=gltf?.parser?.json, assoc=gltf?.parser?.associations;
  if (verifiedSha!==C042_KIV003_SOURCE_SHA ||
      json?.asset?.version!=='2.0' || json?.asset?.extras?.asBuilt!==false ||
      json?.asset?.extras?.current!==false || json?.scene!==0 ||
      gltf?.scenes?.length!==52 || json?.scenes?.length!==52 ||
      typeof assoc?.get!=='function') return unavailable('sha-or-scene');
  const found=[];
  for(const t of TARGETS) {
    const scene=gltf.scenes[t.scene];
    const sceneRoot=json.scenes[t.scene]?.nodes;
    const parent=json.nodes?.[t.parent], target=json.nodes?.[t.node];
    if(!Array.isArray(sceneRoot)||!sceneRoot.includes(t.parent) ||
       !Array.isArray(parent?.children)||parent.children.length!==t.parentCount ||
       parent.children.filter(i=>i===t.node).length!==1 ||
       !parent.name?.startsWith('K10_SC25_KIV100x10_WORLD_YUP_AXIS_REPLACEMENT_') ||
       parent.extras?.modelStage!=='WORK_TEST' ||
       parent.extras?.physicalWallCuts!=='NOT_VERIFIED' ||
       target?.name!==NAME || !Array.isArray(target.children) ||
       target.children.length!==19 || new Set(target.children).size!==19 ||
       target.extras?.realWallHostVerified!==false ||
       target.extras?.sourceAnchorCoverNode!==1151 ||
       target.extras?.sourceAnchorSleeveNode!==1150 ||
       target.extras?.C78SourceNode?.sourceScene!==77 ||
       target.extras?.C78SourceNode?.sourceNode!==20509 ||
       !target.children.every(i=>Number.isInteger(json.nodes?.[i]?.mesh) &&
         json.nodes[i].name?.startsWith(NAME+'__')))
      return unavailable('source-root-target-or-host');
    const parentObject=exactChild(scene,t.parent,parent.name,assoc);
    const targetObject=exactChild(parentObject,t.node,NAME,assoc);
    if(!parentObject||!targetObject||targetObject.visible!==true ||
       targetObject.children?.length!==19 ||
       !targetObject.children.every((o,i)=>assoc.get(o)?.nodes===target.children[i]))
      return unavailable('runtime-object-or-parent');
    found.push({obj:targetObject,initial:targetObject.visible});
  }
  if(found[0].obj===found[1].obj)return unavailable('shared-runtime-object');
  let enabled=false;
  const setEnabled=next=>{
    enabled=Boolean(next);
    found.forEach(t=>{t.obj.visible=enabled?false:t.initial;});
    return true;
  };
  return {available:true,reason:null,count:2,get enabled(){return enabled;},
    setEnabled,dispose(){setEnabled(false);}};
}
