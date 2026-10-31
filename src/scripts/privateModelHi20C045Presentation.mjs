import { createHi20C048WallHeadsPresentation } from './privateModelHi20C048WallHeadPresentation.mjs';
import { createHi20C046StoragePresentation } from './privateModelHi20C046StoragePresentation.mjs';
// C80-045: WORK_TEST presentation only, immutable original 52-scene GLB.
// The 3.635 m old terrace wall must not be rendered together with the existing
// 1.709 m replacement. Never change geometry, source links or default/C70.
export const C045_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  {scene:50, old:6380, replacement:6457,
    oldName:'C80-028_WEST_X0_TERRACE_SIDE_WALL_1F_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',
    newName:'HI20_C045_CLIPPED_OWNER_WHITE_C048_1F_OPTIN'},
  {scene:51, old:6395, replacement:6460,
    oldName:'C80-028_WEST_X0_TERRACE_SIDE_WALL_BOTH_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',
    newName:'HI20_C045_CLIPPED_OWNER_WHITE_C048_BOTH_OPTIN'},
];
function unavailable(reason) {
  return {available:false,reason,count:0,corrected:false,setCorrected:()=>false,dispose:()=>{}};
}
export function createHi20C045Presentation(gltf, verifiedSha) {
  if (verifiedSha!==C045_SOURCE_SHA || gltf?.scenes?.length!==52 ||
      gltf?.parser?.json?.scenes?.length!==52) return unavailable('sha-or-scenes');
  const association=gltf?.parser?.associations;
  if (typeof association?.get!=='function') return unavailable('associations');
  const roots=[];
  for (const target of TARGETS) {
    const scene=gltf.scenes[target.scene];
    const find=(id,name,meshIndex)=>{
      const found=scene?.children?.filter(obj=>
        obj?.name===name && obj?.isMesh===true &&
        association.get(obj)?.nodes===id &&
        gltf.parser.json.nodes?.[id]?.mesh===meshIndex);
      if (found?.length!==1) return null;
      const obj=found[0];
      obj.geometry?.computeBoundingBox?.();
      const b=obj.geometry?.boundingBox;
      if (!b || !Number.isFinite(b.max?.z-b.min?.z)) return null;
      return {obj,length:b.max.z-b.min.z};
    };
    const old=find(target.old,target.oldName,1843);
    const replacement=find(target.replacement,target.newName,1858);
    // These are source mesh lengths, not new field measurements.
    if (!old || !replacement || Math.abs(old.length-3.635)>0.002 ||
        Math.abs(replacement.length-1.709)>0.002 ||
        old.obj.visible!==true || replacement.obj.visible!==true)
      return unavailable('old-or-corrected-wall-not-exact');
    roots.push(old.obj);
  }
  // C80-048 is an independent existing donor correction, applied in the same
  // verified HI20 source lifecycle without modifying index.astro (reserved by
  // the parallel C80-050 viewer task). It does NOT follow the C045 checkbox.
  const whiteHeads=createHi20C048WallHeadsPresentation(gltf, verifiedSha);
  const whiteHeadsApplied=whiteHeads.available && whiteHeads.setEnabled(true);
  // Independent WORK_TEST view fix: suppress verified duplicate storage
  // presentations only when the existing C047 door wall is already present.
  const storage=createHi20C046StoragePresentation(gltf, verifiedSha);
  const storageApplied=storage.available && storage.setCleaned(true);
  const originals=roots.map(obj=>obj.visible);
  let corrected=false;
  return {
    available:true,reason:null,count:roots.length,
    c048WhiteHeadsApplied:whiteHeadsApplied,
    c048WhiteHeadsCount:whiteHeadsApplied?whiteHeads.count:0,
    c046StorageApplied:storageApplied,
    c046StorageCount:storageApplied?storage.count:0,
    get corrected(){return corrected;},
    setCorrected(next){
      const enabled=Boolean(next);
      for (const root of roots) root.visible=enabled?false:true;
      corrected=enabled;
      return true;
    },
    dispose(){
      storage.dispose();
      whiteHeads.dispose();
      roots.forEach((root,i)=>{root.visible=originals[i];});
      corrected=false;
    },
  };
}
