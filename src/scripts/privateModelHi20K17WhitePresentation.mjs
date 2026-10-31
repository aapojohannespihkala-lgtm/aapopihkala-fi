import { createHi20C037WasherTopPresentation } from './privateModelHi20C037WasherTopPresentation.mjs';
import { createHi20C043LegacyWallWhitePresentation } from './privateModelHi20C043LegacyWallWhitePresentation.mjs';
// C80-043 / K17: keep the owner's 1125 mm low stair-wall geometry,
// but use the same white WORK_TEST wall material as adjacent physical walls.
// Exact 52-scene HI20 only. No modifications to source GLB, sourceLinks,
// 1F, C70/default, geometry, door openings, other materials or CURRENT.
export const K17_WHITE_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  {scene:48, parent:6445, reference:6432, nodes:[6443,6444]},
  {scene:51, parent:6450, reference:6438, nodes:[6448,6449]},
];
const unavailable = (reason) => ({
  available:false, reason, count:0, enabled:false,
  setEnabled:()=>false, dispose:()=>{},
});
function exactMesh(scene,id,associations) {
  const found=[];
  scene?.traverse?.((object)=>{
    if (!object?.isMesh) return;
    let p=object;
    while (p && p!==scene) {
      if (associations.get(p)?.nodes===id) { found.push(object); break; }
      p=p.parent;
    }
  });
  return found.length===1 ? found[0] : null;
}
export function createHi20K17WhitePresentation(gltf, verifiedSha) {
  const json=gltf?.parser?.json;
  if (verifiedSha!==K17_WHITE_SOURCE_SHA ||
      json?.asset?.version!=='2.0' ||
      json?.asset?.extras?.current!==false ||
      json?.asset?.extras?.asBuilt!==false ||
      json?.scene!==0 || json?.scenes?.length!==52 ||
      gltf?.scenes?.length!==52)
    return unavailable('source-sha-or-scene');
  const associations=gltf?.parser?.associations;
  if (typeof associations?.get!=='function') return unavailable('associations');
  const white=json.materials?.[340];
  const color=white?.pbrMetallicRoughness?.baseColorFactor;
  if (white?.alphaMode!=='OPAQUE' ||
      !Array.isArray(color) || color.length!==4 ||
      color.some((v,i)=>Math.abs(v-[.93,.93,.93,1][i])>1e-6))
    return unavailable('white-reference-material');
  const targets=[];
  for (const t of TARGETS) {
    const scene=gltf.scenes[t.scene], parent=json.nodes?.[t.parent];
    if (!scene || !parent || !parent.name?.includes('K17_1125_COW') ||
        !Array.isArray(parent.children) ||
        !t.nodes.every(id=>parent.children.includes(id)) ||
        new Set(parent.children).size!==parent.children.length)
      return unavailable('k17-parent');
    const referenceNode=json.nodes?.[t.reference];
    if (!referenceNode?.extras?.physicalWall ||
        referenceNode.extras?.workTestC80_043?.ownerConfirmedWhite!==true ||
        json.meshes?.[referenceNode.mesh]?.primitives?.[0]?.material!==340)
      return unavailable('white-wall-reference');
    const reference=exactMesh(scene,t.reference,associations);
    if (!reference || Array.isArray(reference.material) ||
        !reference.material?.color ||
        typeof reference.material.clone!=='function')
      return unavailable('reference-object');
    for (let i=0;i<2;i++) {
      const id=t.nodes[i], node=json.nodes?.[id], meshIndex=1855+i;
      if (node?.mesh!==meshIndex ||
          !node?.name?.includes('_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST') ||
          node?.extras?.representationKind!=='wall3DPresentationProxy' ||
          node?.extras?.ModelStage!=='WORK_TEST' ||
          !Array.isArray(node?.extras?.sourceLinks) ||
          node.extras.sourceLinks.length!==3 ||
          json.meshes?.[meshIndex]?.primitives?.length!==1 ||
          json.meshes[meshIndex].primitives[0].material!==227)
        return unavailable('k17-node-or-material');
      const obj=exactMesh(scene,id,associations);
      if (!obj || obj.visible!==true ||
          Array.isArray(obj.material) ||
          typeof obj.material?.clone!=='function')
        return unavailable('k17-object');
      targets.push({obj, original:obj.material, white:reference.material});
    }
  }
  if (targets.length!==4 ||
      new Set(targets.map(t=>t.obj)).size!==4)
    return unavailable('incomplete-k17-roster');
  // Independent C80-043 baseline on six existing 2F WC/Room34 wall panels.
  // The independent helper is fail-closed and never changes K17 geometry.
  const legacyWhite=createHi20C043LegacyWallWhitePresentation(gltf,verifiedSha);
  const legacyWhiteApplied=legacyWhite.available && legacyWhite.setEnabled(true);
  // C80-037 is an independent 1F/BOTH exact-SHA presentation fix.
  // Reuse the already tested PR1602 geometry guard and reversible COW index,
  // without altering the source GLB, the 2F scene, or the K17 wall.
  const washerTop=createHi20C037WasherTopPresentation(gltf,verifiedSha);
  const washerTopApplied=washerTop.available && washerTop.setEnabled(true);
  let enabled=false;
  const restore=()=>{
    if(!enabled) return;
    targets.forEach(t=>{
      const temporary=t.obj.material;
      t.obj.material=t.original;
      temporary.dispose?.();
    });
    enabled=false;
  };
  return {
    available:true, reason:null, count:4,
    c037WasherTopApplied:washerTopApplied,
    c037WasherTopCount:washerTopApplied?washerTop.count:0,
    c043LegacyWallWhiteApplied:legacyWhiteApplied,
    c043LegacyWallWhiteCount:legacyWhiteApplied?legacyWhite.count:0,
    get enabled(){return enabled;},
    setEnabled(next){
      if(!next){restore();return true;}
      if(enabled) return true;
      const clones=[];
      try {
        for(const t of targets) {
          const m=t.white.clone();
          m.transparent=false; m.opacity=1; m.depthWrite=true;
          m.needsUpdate=true; clones.push(m);
        }
      } catch {
        clones.forEach(m=>m.dispose?.());
        return false;
      }
      targets.forEach((t,i)=>{t.obj.material=clones[i];});
      enabled=true;
      return true;
    },
    dispose(){restore();legacyWhite.dispose();washerTop.dispose();},
  };
}
