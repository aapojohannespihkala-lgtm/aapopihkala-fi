/**
 * C80 620R14 (Claude KANON-NEXT 17.11.2026, owner electrical checklist at 20.32) on top of C80 620R13.
 * The six 620R13 scenes 632..637 are copied to 638..643: the duplicate K12 soffit light root 2661 leaves the
 * 2F/BOTH scenes, and three electrical roots are appended there: the balcony heat-lamp cord 12495 to the 2F
 * outdoor socket and owner sockets in the 2F WC mirror cabinet (12496) and above the fridge-freezer (12497).
 * The 1F scene is unchanged. All 620R13 data and the 620R13 BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R13_GLB_SHA256, C80_620R13_SCENES, C80_620R13_COW_ALIASES, C80_620R13_DUCT_ROOT, C80_620R13_K10_VALVE_ROOT,
 C80_620R13_CLOSET_VALVE_ROOT, C80_620R13_STORE_GRILLE_ROOT,
} from './privateModelC80620R13SourceProfile.mjs';

export const C80_620R14_GLB_SHA256='71eff60eafa7744e915d6ec0903d330ab0c8bda637635b4adc375e82d0544297';
export const C80_620R14_GLB_BYTES=57891940;
export const C80_620R14_ZIP_SHA256='d728f2d865fca4657d21b63592e81f74a47025b8d906b12fba5979bdf0ed5e21';
export const C80_620R14_ZIP_DRIVE_ID='1Dh39QRIoDu0WPewl_1pLoVGNAN0qHT0O';
export const C80_620R14_PARENT_GLB_SHA256=C80_620R13_GLB_SHA256;
export const C80_620R14_DUCT_ROOT=C80_620R13_DUCT_ROOT;
export const C80_620R14_K10_VALVE_ROOT=C80_620R13_K10_VALVE_ROOT;
export const C80_620R14_CLOSET_VALVE_ROOT=C80_620R13_CLOSET_VALVE_ROOT;
export const C80_620R14_STORE_GRILLE_ROOT=C80_620R13_STORE_GRILLE_ROOT;
export const C80_620R14_REMOVED_ROOTS=Object.freeze([2661]);   // K12 soffit light, duplicate of the balcony lamp
export const C80_620R14_ADDED_ROOTS=Object.freeze([12495,12496,12497]);  // 2F/BOTH scenes only
export const C80_620R14_ELECTRICAL_ROOTS=C80_620R14_ADDED_ROOTS;
// No node is replaced: the 620R13 aliases apply unchanged.
export const C80_620R14_COW_ALIASES=C80_620R13_COW_ALIASES;
// [glTF scene, 620R13 parent scene, floorProfile, FNV root hash].
const rows=[
 [638,632,'1F','d12add7b'],
 [639,633,'2F','006979bd'],
 [640,634,'BOTH_A','e4e2a643'],
 [641,635,'BOTH_B','7e8ed225'],
 [642,636,'BOTH_C','93e850fd'],
 [643,637,'BOTH_D','397713f4'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R14_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R13_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R14SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R14_SCENES[sceneIndex];
 if(sha!==C80_620R14_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==644||json.nodes?.length!==12498||json.meshes?.length!==4697||
    json.materials?.length!==761||json.accessors?.length!==10610||json.bufferViews?.length!==10616)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R14_OWNER_CHECKLIST_1711_ELECTRICAL_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R14_ownerChecklist20261117!==true||e?.C80_620R14_parentGLBSHA256!==C80_620R14_PARENT_GLB_SHA256||
    e?.C80_620R14_parentScene!==spec.parent||e?.preserve620R13Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.filter(n=>!C80_620R14_REMOVED_ROOTS.includes(n));
 if(!eqList(roots,spec.floor==='1F'?expected:[...expected,...C80_620R14_ADDED_ROOTS]))return false;
 if(json.nodes[12495]?.mesh!==4694||json.nodes[12496]?.mesh!==4695||json.nodes[12497]?.mesh!==4696||
    json.nodes[12495]?.extras?.m5System!=='SAHKO'||json.nodes[12496]?.extras?.m5System!=='SAHKO'||
    json.nodes[12497]?.extras?.m5System!=='SAHKO')return false;
 // T-collector n10060 stays (owner 15.11.2026) under the K14 root in 1F/BOTH.
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R14_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
