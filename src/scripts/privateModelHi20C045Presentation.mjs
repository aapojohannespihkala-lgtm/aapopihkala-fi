import { createHi20C048WallHeadsPresentation } from './privateModelHi20C048WallHeadPresentation.mjs';
import { createHi20C046StoragePresentation } from './privateModelHi20C046StoragePresentation.mjs';
import { createHi20C035LobbyPresentation } from './privateModelHi20C035LobbyPresentation.mjs';
import { createHi20K17WhitePresentation } from './privateModelHi20K17WhitePresentation.mjs';
import { createHi20C002StorageRoofPresentation } from './privateModelHi20C002StorageRoofPresentation.mjs';
import { createHi20C047DoorWallPresentation } from './privateModelHi20C047DoorWallPresentation.mjs';
import { createHi20C036R5DoorPresentation } from './privateModelHi20C036R5DoorPresentation.mjs';
import { createHi20C020WhiteSideWallPresentation } from './privateModelHi20C020WhiteSideWallPresentation.mjs';
import { createHi20C020BoardPresentation } from './privateModelHi20C020BoardPresentation.mjs';
import { createHi20C026TerrainPresentation } from './privateModelHi20C026TerrainPresentation.mjs';
import { createHi20C027ContourPresentation } from './privateModelHi20C027ContourPresentation.mjs';
import { createHi20C049FenceJunctionPresentation } from './privateModelHi20C049FenceJunctionPresentation.mjs';
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
  // C80-035: independent existing doorless lobby opening, presentation-only.
  const lobby=createHi20C035LobbyPresentation(gltf, verifiedSha);
  const lobbyApplied=lobby.available && lobby.setEnabled(true);
  // Independently apply the owner's white-wall baseline to the 1125 mm K17 low wall.
  const k17White=createHi20K17WhitePresentation(gltf, verifiedSha);
  const k17WhiteApplied=k17White.available && k17White.setEnabled(true);
  // C80-002 FULL_CONTEXT scene3 storage roofs: previously reviewed
  // 5mm display-only separation, independent of the C045 terrace toggle.
  const storageRoofs=createHi20C002StorageRoofPresentation(gltf,verifiedSha);
  const storageRoofsApplied=storageRoofs.available && storageRoofs.setEnabled(true);
  // Independent 31.10 owner-approved 100 mm storage door-wall work assumption.
  const doorWall=createHi20C047DoorWallPresentation(gltf,verifiedSha);
  const doorWallApplied=doorWall.available && doorWall.setEnabled(true);
  // C80-036: source-bounded R5 WC door white presentation, independent of terrace toggle.
  const r5WhiteDoor=createHi20C036R5DoorPresentation(gltf,verifiedSha);
  const r5WhiteDoorApplied=r5WhiteDoor.available && r5WhiteDoor.setEnabled(true);
  // Owner C80-043 white baseline on the existing 220 mm balcony endwall.
  // Independent of the C045 terrace wall toggle; no geometry change.
  const whiteSideWall=createHi20C020WhiteSideWallPresentation(gltf,verifiedSha);
  const whiteSideWallApplied=whiteSideWall.available && whiteSideWall.setEnabled(true);
  // C80-020: eight existing balcony boards, pale inner and dark outer faces.
  // Independent reversible COW, no added overlapping geometry.
  const balconyBoards=createHi20C020BoardPresentation(gltf,verifiedSha);
  const balconyBoardsApplied=balconyBoards.available && balconyBoards.setEnabled(true);
  // C80-026: use the exact validated 56scene terrain patches in the existing
  // 52scene 1F/BOTH viewer, WITHOUT altering source terrain or 1F geometry.
  // The remaining white source-clip region stays unfilled (HOST_HOLD).
  const terrain=createHi20C026TerrainPresentation(gltf,verifiedSha);
  const terrainApplied=terrain.available && terrain.setEnabled(true);
  // C80-027: source-locked 1m major / 0.5m minor contour display.
  // Independent reversible COW, no duplicate terrain geometry.
  const contours=createHi20C027ContourPresentation(gltf,verifiedSha);
  const contoursApplied=contours.available && contours.setEnabled(true);
  // C80-049 D/C wall is already 46mm shorter. Its last source-only endcap
  // still competes with the exact screenpost bottom at world Z=1.704m.
  // Copy-on-write trims only the post-covered endcap, NOT the wall or posts.
  const fenceJunction=createHi20C049FenceJunctionPresentation(gltf,verifiedSha);
  const fenceJunctionApplied=fenceJunction.available && fenceJunction.setEnabled(true);
  const originals=roots.map(obj=>obj.visible);
  let corrected=false;
  return {
    available:true,reason:null,count:roots.length,
    c048WhiteHeadsApplied:whiteHeadsApplied,
    c048WhiteHeadsCount:whiteHeadsApplied?whiteHeads.count:0,
    c046StorageApplied:storageApplied,
    c046StorageCount:storageApplied?storage.count:0,
    c035LobbyApplied:lobbyApplied,
    c035LobbyCount:lobbyApplied?lobby.count:0,
    k17WhiteApplied,
    k17WhiteCount:k17WhiteApplied?k17White.count:0,
    c002StorageRoofsApplied:storageRoofsApplied,
    c002StorageRoofsCount:storageRoofsApplied?storageRoofs.count:0,
    c047StorageDoorWallApplied:doorWallApplied,
    c047StorageDoorWallCount:doorWallApplied?doorWall.count:0,
    c036R5WhiteDoorApplied:r5WhiteDoorApplied,
    c036R5WhiteDoorCount:r5WhiteDoorApplied?r5WhiteDoor.count:0,
    c020WhiteSideWallApplied:whiteSideWallApplied,
    c020WhiteSideWallCount:whiteSideWallApplied?whiteSideWall.count:0,
    c020BalconyBoardsApplied:balconyBoardsApplied,
    c020BalconyBoardsCount:balconyBoardsApplied?balconyBoards.count:0,
    c026TerrainApplied:terrainApplied,
    c026TerrainCount:terrainApplied?terrain.count:0,
    c027ContoursApplied:contoursApplied,
    c027ContoursCount:contoursApplied?contours.count:0,
    c049FenceJunctionApplied:fenceJunctionApplied,
    c049FenceJunctionCount:fenceJunctionApplied?fenceJunction.count:0,
    get corrected(){return corrected;},
    setCorrected(next){
      const enabled=Boolean(next);
      for (const root of roots) root.visible=enabled?false:true;
      corrected=enabled;
      return true;
    },
    dispose(){
      fenceJunction.dispose();
      contours.dispose();
      terrain.dispose();
      r5WhiteDoor.dispose();
      balconyBoards.dispose();
      whiteSideWall.dispose();
      doorWall.dispose();
      storageRoofs.dispose();
      k17White.dispose();
      lobby.dispose();
      storage.dispose();
      whiteHeads.dispose();
      roots.forEach((root,i)=>{root.visible=originals[i];});
      corrected=false;
    },
  };
}
