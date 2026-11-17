/**
 * C80 620R16 (Claude KANON-NEXT 17.11.2026, owner review 22.18-22.24) on top of C80 620R15.
 * The six 620R15 scenes 644..649 are copied to 650..655: the bathroom ceiling 12499 (bound to the hidden-by-default
 * 'Sisakatot' layer) is replaced by an unbound white ceiling 12516 facing down like the 1F ceiling 12430; the 2F WC
 * exhaust is one D125 duct 12517 for the WC ceiling valve and the stair-hall KSO125 wall valve (roots 12501/12502
 * copied), and the old twin-T leg root 12400 leaves the 2F/BOTH scenes.
 * All 620R15 data and the 620R15 BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R15_GLB_SHA256, C80_620R15_SCENES, C80_620R15_COW_ALIASES, C80_620R15_DUCT_ROOT, C80_620R15_K10_VALVE_ROOT,
 C80_620R15_CLOSET_VALVE_ROOT, C80_620R15_STORE_GRILLE_ROOT, C80_620R15_ELECTRICAL_ROOTS,
} from './privateModelC80620R15SourceProfile.mjs';

export const C80_620R16_GLB_SHA256='adad0a40ec64d423d2abc720a467125cc5dea2eb498f69fbdfd324a89d71030a';
export const C80_620R16_GLB_BYTES=58386412;
export const C80_620R16_ZIP_SHA256='61794ca3f6f6494d00cd688fee875226c690f5108c6469cf423c71ab5ea01617';
export const C80_620R16_ZIP_DRIVE_ID='1cpiNXr9rW_MuVxrJpLEAhYgaWsLI_Oro';
export const C80_620R16_PARENT_GLB_SHA256=C80_620R15_GLB_SHA256;
export const C80_620R16_DUCT_ROOT=C80_620R15_DUCT_ROOT;
export const C80_620R16_K10_VALVE_ROOT=C80_620R15_K10_VALVE_ROOT;
export const C80_620R16_CLOSET_VALVE_ROOT=C80_620R15_CLOSET_VALVE_ROOT;
export const C80_620R16_STORE_GRILLE_ROOT=C80_620R15_STORE_GRILLE_ROOT;
export const C80_620R16_ELECTRICAL_ROOTS=C80_620R15_ELECTRICAL_ROOTS;
export const C80_620R16_BATH_CEILING_ROOT=12516;
// 620R15 root -> 620R16 root (only where the parent scene has it); 12400 leaves the new scenes.
export const C80_620R16_ROOT_REPLACEMENTS=Object.freeze({12499:12516, 12501:12518, 12502:12519});
export const C80_620R16_REMOVED_ROOTS=Object.freeze([12400]);
// Keyed by the 620R15 node that is copied; COW nodes keep its receipt identity (orig of the 620R15 alias).
const R16_ALIASES={
 12500:['12517',{"orig":10122,"fnv":"9dab18c8","mesh":4709,"name":"C80_620R16_D2F_WC_EXHAUST_D125_TWO_VALVES_ONE_DUCT_WORK_TEST"}],
 12501:['12518',{"orig":11714,"fnv":"9eb6c237"}],
 12502:['12519',{"orig":11729,"fnv":"84768d9f"}],
};
export const C80_620R16_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R15_COW_ALIASES),
 ...Object.values(R16_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
// [glTF scene, 620R15 parent scene, floorProfile, FNV root hash].
const rows=[
 [650,644,'1F','eaacb39a'],
 [651,645,'2F','bca19cae'],
 [652,646,'BOTH_A','1cb7cb98'],
 [653,647,'BOTH_B','12ee3f40'],
 [654,648,'BOTH_C','a295001e'],
 [655,649,'BOTH_D','0f757d2d'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R16_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R15_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R16SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R16_SCENES[sceneIndex];
 if(sha!==C80_620R16_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==656||json.nodes?.length!==12520||json.meshes?.length!==4710||
    json.materials?.length!==762||json.accessors?.length!==10666||json.bufferViews?.length!==10672)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R16_OWNER_REVIEW_1711_BATH_CEILING_KSO125_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R16_ownerReview20261117Night!==true||e?.C80_620R16_parentGLBSHA256!==C80_620R16_PARENT_GLB_SHA256||
    e?.C80_620R16_parentScene!==spec.parent||e?.preserve620R15Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.filter(n=>!C80_620R16_REMOVED_ROOTS.includes(n)).map(n=>C80_620R16_ROOT_REPLACEMENTS[n]??n);
 if(!eqList(roots,expected))return false;
 if(json.nodes[12517]?.mesh!==4709||!json.nodes[12518]?.children?.includes(12517)||json.nodes[12518].children.includes(12500)||
    !json.nodes[12519]?.children?.includes(12517)||json.nodes[12516]?.mesh!==4708||json.nodes[12516].extras?.singleSidedDown!==true||
    json.materials[json.meshes[4708]?.primitives?.[0]?.material]?.doubleSided!==false)return false;
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R16_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
