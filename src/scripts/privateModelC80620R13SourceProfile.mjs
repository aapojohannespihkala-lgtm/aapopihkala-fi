/**
 * C80 620R13 (Claude KANON-NEXT 17.11.2026, owner review of 620R12 at 19.20-19.38) on top of C80 620R12.
 * The six 620R12 scenes 626..631 are copied to 632..637 with append-only fixes and nothing else:
 * K13 IV enclosure opaque (COW node 12484 under COW root 12485 of 12479); K10 store exhaust duct ends at the
 * storage facade (COW 12486 of 12480) with an outlet grille root 12487; solid sauna ceiling root 12488 replaces
 * the 10 % ghost root 6421; the IV end in the closet gets a visible valve root 12489 (instance of 12477 facing
 * west); the 2F ROOM3 door leaf gets a solid oak colour (COW chain 12490..12494 of 12195/12472..12475).
 * All 620R12 nodes/meshes/materials/accessors/bufferViews and the 620R12 BIN prefix are byte-exact.
 * WORK_TEST/HOST_HOLD. Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R12_GLB_SHA256, C80_620R12_SCENES, C80_620R12_COW_ALIASES, C80_620R12_DUCT_ROOT, C80_620R12_K10_VALVE_ROOT,
} from './privateModelC80620R12SourceProfile.mjs';

export const C80_620R13_GLB_SHA256='7e4a0cd2843355e3abdcd5ce37e6bdee2949763073b1b90e617b64cf781b9f23';
export const C80_620R13_GLB_BYTES=57823964;
export const C80_620R13_ZIP_SHA256='b60b8b7971b0fdbed431f67ddf7d2fd0af0e68c06f401293c3a0737837bea3b4';
export const C80_620R13_ZIP_DRIVE_ID='1XHMZiIvrSAPLa0WE1UGfBmHagR3QztEs';
export const C80_620R13_PARENT_GLB_SHA256=C80_620R12_GLB_SHA256;
export const C80_620R13_DUCT_ROOT=C80_620R12_DUCT_ROOT;
export const C80_620R13_K10_VALVE_ROOT=C80_620R12_K10_VALVE_ROOT;
export const C80_620R13_CLOSET_VALVE_ROOT=12489;
export const C80_620R13_STORE_GRILLE_ROOT=12487;
// 620R12 scene root -> 620R13 COW root (only where the parent scene has it).
export const C80_620R13_ROOT_REPLACEMENTS=Object.freeze({
 12479:12485,  // K13 KPH controls root with the opaque IV enclosure 12484
 12480:12486,  // K10 store exhaust duct ending at the facade
 12475:12494,  // 2F ROOM3 root with the oak-coloured leaf 12490
});
export const C80_620R13_REMOVED_ROOTS=Object.freeze([6421]);   // 10 % sauna ghost
export const C80_620R13_ADDED_ROOTS=Object.freeze([12487,12488,12489]);  // 1F/BOTH scenes only
// 620R12 aliases stay valid (their nodes are byte-exact); replaced COW roots keep their receipt identity.
const R13_ALIASES={
 12479:['12485',{orig:12329,fnv:'632cb46c',name:'C80_620R11_K13_KPH_CONTROLS_COW_ROOT_ENCLOSURE_SPLIT_T10060_PRESERVED'}],
 12480:['12486',{orig:12096,fnv:'9425daa0',mesh:4690,name:'C80_620R13_K10_STORE_EXHAUST_DUCT_FLUSH_AT_FACADE_COW_WORK_TEST'}],
 12472:['12491',{orig:12219,fnv:'60f4dfb2'}],
 12473:['12492',{orig:12220,fnv:'1a871b17'}],
 12474:['12493',{orig:12221,fnv:'29d891c8'}],
 12475:['12494',{orig:12222,fnv:'74c9d388'}],
};
export const C80_620R13_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R12_COW_ALIASES).filter(([n])=>!(n in R13_ALIASES)),
 ...Object.values(R13_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
// [glTF scene, 620R12 parent scene, floorProfile, FNV root hash].
const rows=[
 [632,626,'1F','d12add7b'],
 [633,627,'2F','3f5104ba'],
 [634,628,'BOTH_A','5ac912b0'],
 [635,629,'BOTH_B','3c85c49e'],
 [636,630,'BOTH_C','8ece0816'],
 [637,631,'BOTH_D','054085cb'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R13_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R12_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R13SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R13_SCENES[sceneIndex];
 if(sha!==C80_620R13_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==638||json.nodes?.length!==12495||json.meshes?.length!==4694||
    json.materials?.length!==761||json.accessors?.length!==10595||json.bufferViews?.length!==10601)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R13_OWNER_REVIEW_1711_EVENING_FIXES_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R13_ownerReview20261117Evening!==true||e?.C80_620R13_parentGLBSHA256!==C80_620R13_PARENT_GLB_SHA256||
    e?.C80_620R13_parentScene!==spec.parent||e?.preserve620R12Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 // Same root order as the 620R12 parent scene: ghost dropped, COW roots swapped, three roots appended (1F/BOTH).
 const expected=prior.filter(n=>!C80_620R13_REMOVED_ROOTS.includes(n)).map(n=>C80_620R13_ROOT_REPLACEMENTS[n]??n);
 if(!eqList(roots,spec.floor==='2F'?expected:[...expected,...C80_620R13_ADDED_ROOTS]))return false;
 const enclosure=json.nodes[12484],enclosureMaterial=json.materials[json.meshes[enclosure?.mesh]?.primitives?.[0]?.material];
 const closetValve=json.nodes[12489],door=json.nodes[12490];
 if(!json.nodes[12485]?.children?.includes(12484)||json.nodes[12485].children.includes(12478)||
    enclosureMaterial?.alphaMode!=='OPAQUE'||enclosureMaterial?.pbrMetallicRoughness?.baseColorFactor?.[3]!==1||
    json.nodes[12486]?.mesh!==4690||json.nodes[12487]?.mesh!==4691||json.nodes[12488]?.mesh!==4692||
    !eqList(closetValve?.children??[],[C80_620R13_K10_VALVE_ROOT])||closetValve?.matrix?.length!==16||
    door?.mesh!==4693||json.materials[json.meshes[4693]?.primitives?.[0]?.material]?.pbrMetallicRoughness?.baseColorTexture!==undefined||
    !json.nodes[12491]?.children?.includes(12490)||!json.nodes[12494]?.children?.includes(12493))return false;
 // T-collector n10060 stays (owner 15.11.2026) under the K14 root in 1F/BOTH.
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R13_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
