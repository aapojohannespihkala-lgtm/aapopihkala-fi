/**
 * C80 620R17 (Claude KANON-NEXT 17.11.2026, owner 23.21 "katossa on reikä") on top of C80 620R16.
 * The six 620R16 scenes 650..655 are copied to 656..661; the unbound bathroom ceiling 12516 is replaced by 12520
 * without the north-wall notch (X4.355..5.98 N4.246..4.752 and X5.98..6.254 N4.62..4.752 filled).
 * All 620R16 data and the 620R16 BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R16_GLB_SHA256, C80_620R16_SCENES, C80_620R16_COW_ALIASES, C80_620R16_DUCT_ROOT, C80_620R16_K10_VALVE_ROOT,
 C80_620R16_CLOSET_VALVE_ROOT, C80_620R16_STORE_GRILLE_ROOT, C80_620R16_ELECTRICAL_ROOTS,
} from './privateModelC80620R16SourceProfile.mjs';

export const C80_620R17_GLB_SHA256='65813c08e6bdeadad5be4b08177926ca4f96c0f955eb33a58d22bbe9734d70c6';
export const C80_620R17_GLB_BYTES=58446852;
export const C80_620R17_ZIP_SHA256='8a4b936f8bdd4ba45436f1af31766addf74a392eeb8c9f9701039bb6a687624c';
export const C80_620R17_ZIP_DRIVE_ID='1P0NJ7MHhcfjA-cYM3VooPksgMEctXDo7';
export const C80_620R17_PARENT_GLB_SHA256=C80_620R16_GLB_SHA256;
export const C80_620R17_DUCT_ROOT=C80_620R16_DUCT_ROOT;
export const C80_620R17_K10_VALVE_ROOT=C80_620R16_K10_VALVE_ROOT;
export const C80_620R17_CLOSET_VALVE_ROOT=C80_620R16_CLOSET_VALVE_ROOT;
export const C80_620R17_STORE_GRILLE_ROOT=C80_620R16_STORE_GRILLE_ROOT;
export const C80_620R17_ELECTRICAL_ROOTS=C80_620R16_ELECTRICAL_ROOTS;
export const C80_620R17_BATH_CEILING_ROOT=12520;
export const C80_620R17_ROOT_REPLACEMENTS=Object.freeze({12516:12520});
// No node identity changes: the ceiling is deliberately unbound like the 1F ceiling 12430.
export const C80_620R17_COW_ALIASES=C80_620R16_COW_ALIASES;
const rows=[
 [656,650,'1F','3612f47e'],
 [657,651,'2F','bca19cae'],
 [658,652,'BOTH_A','e71db644'],
 [659,653,'BOTH_B','50141f44'],
 [660,654,'BOTH_C','6fb4714a'],
 [661,655,'BOTH_D','30c36461'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R17_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R16_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R17SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R17_SCENES[sceneIndex];
 if(sha!==C80_620R17_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==662||json.nodes?.length!==12521||json.meshes?.length!==4711||
    json.materials?.length!==762||json.accessors?.length!==10669||json.bufferViews?.length!==10675)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R17_OWNER_REVIEW_1711_BATH_CEILING_NO_HOLE_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R17_ownerReview20261117Hole!==true||e?.C80_620R17_parentGLBSHA256!==C80_620R17_PARENT_GLB_SHA256||
    e?.C80_620R17_parentScene!==spec.parent||e?.preserve620R16Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 if(!eqList(roots,prior.map(n=>C80_620R17_ROOT_REPLACEMENTS[n]??n)))return false;
 if(json.nodes[12520]?.mesh!==4710||json.nodes[12520].extras?.singleSidedDown!==true||
    json.materials[json.meshes[4710]?.primitives?.[0]?.material]?.doubleSided!==false)return false;
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R17_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
