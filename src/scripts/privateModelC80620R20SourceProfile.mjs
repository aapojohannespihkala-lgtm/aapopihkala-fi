/**
 * C80 620R20 (Claude KANON-NEXT 19.11.2026) = C80 620R19 + six RELEASED High donors made on 620R19:
 * R20CAND (T110 vent VIEMARI names, ILP4 feet on the pavers), AV1-125 IV casing extension, H1811B-1R ILP refrigerant
 * duct, VM20 red valves in the WC meter cabinet, S1 Croma 160 + AS-9000 shower (owner S1/S2 mapping) and the Savo
 * I-7603 hood identity. The six 620R19 scenes 668..673 are copied to 674..679 with the donors' root edits merged.
 * All 620R19 data and its BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R19_GLB_SHA256, C80_620R19_SCENES, C80_620R19_COW_ALIASES, C80_620R19_DUCT_ROOT, C80_620R19_K10_VALVE_ROOT,
 C80_620R19_CLOSET_VALVE_ROOT, C80_620R19_STORE_GRILLE_ROOT, C80_620R19_ELECTRICAL_ROOTS,
} from './privateModelC80620R19SourceProfile.mjs';

export const C80_620R20_GLB_SHA256='55c74663cce04af482885b1ae4bf099327a282139e96a40ae24492e32767c422';
export const C80_620R20_GLB_BYTES=59438968;
export const C80_620R20_ZIP_SHA256='874d3d403f6c976072fc7e46f9a7ae307dad11a40db8d40199f692951d02a7d8';
export const C80_620R20_ZIP_DRIVE_ID='1V0aKvJBGH28404ZH22FCdIm-Pav81KoM';
export const C80_620R20_PARENT_GLB_SHA256=C80_620R19_GLB_SHA256;
export const C80_620R20_DUCT_ROOT=C80_620R19_DUCT_ROOT;
export const C80_620R20_K10_VALVE_ROOT=C80_620R19_K10_VALVE_ROOT;
export const C80_620R20_CLOSET_VALVE_ROOT=C80_620R19_CLOSET_VALVE_ROOT;
export const C80_620R20_STORE_GRILLE_ROOT=C80_620R19_STORE_GRILLE_ROOT;
export const C80_620R20_ELECTRICAL_ROOTS=C80_620R19_ELECTRICAL_ROOTS;
// K14/T-collector root 12467 is copied to 12557 (T110 vent children renamed VIEMARI); n10060 stays its child.
export const C80_620R20_TCOLLECTOR_ROOT=12557;
export const C80_620R20_ILP4_ROOT=12554;
// 2220 is not a root of the BOTH_D cutaway; 12048/12462..12465 (Savo) exist only in the 2F/BOTH scenes.
export const C80_620R20_ROOT_REPLACEMENTS=Object.freeze({12467:12557,12541:12554,2220:12621,11609:12619,
 12048:12622,12462:12623,12463:12624,12464:12625,12465:12626});
// New opt-in roots appended to the 1F/BOTH scenes: AV1 casing extension, ILP duct, VM20 valves.
export const C80_620R20_APPENDED_ROOTS=Object.freeze([12558,12559,12568]);
// Keyed by the receipt node that is copied; COW nodes keep its receipt identity.
const R20_ALIASES={
 2220:['12621',{"orig":2220,"fnv":"751453cb","name":"D1F_S1_GLASS_SIDE_SHOWER_CROMA_AS9000_R4_WORK_TEST_HOST_HOLD_ROOT"}],
 10145:['12555',{"orig":10145,"fnv":"9f3cd5b1","name":"M5_WW2015_D2F_C80_WC1_SOURCE_EXACT_T110_VENT_HOSTX_EXISTING_DONOR_GEOMETRY_VIEMARI_SEMANTIC_REVIEW_OPTIN"}],
 11332:['12556',{"orig":11332,"fnv":"9c18158c","name":"V87_WW2015_D1F_T110_VENT_DOWN_TO_FLOOR_LINE_VIEMARI_SEMANTIC_REVIEW_OPTIN"}],
 11605:['12615',{"orig":11605,"fnv":"c7cff427","name":"MJ04_2026_OWNER_S2_SAUNA_SIDE_OPEN_A_INLET_STUB_WORK_TEST_HOST_HOLD"}],
 11606:['12616',{"orig":11606,"fnv":"3ffd511e","name":"MJ04_2026_OWNER_S2_SAUNA_SIDE_OPEN_B_INLET_STUB_WORK_TEST_HOST_HOLD"}],
 11607:['12617',{"orig":11607,"fnv":"046d5a37","name":"MJ04_2026_OWNER_S1_GLASS_SIDE_OVERHEAD_AS9000_A_INLET_STUB_WORK_TEST_HOST_HOLD"}],
 11608:['12618',{"orig":11608,"fnv":"18883ebc","name":"MJ04_2026_OWNER_S1_GLASS_SIDE_OVERHEAD_AS9000_B_INLET_STUB_WORK_TEST_HOST_HOLD"}],
 11609:['12619',{"orig":11609,"fnv":"cb6cd351","name":"MJ04_OWNER2026_S1_GLASS_AS9000_S2_SAUNA_INLET_STUBS_COW_ROOT"}],
 11728:['12557',{"orig":11728,"fnv":"c0c1a4e6","name":"C80_620R19_T110_VIEMARI_SEMANTIC_OPTIN_1F_BOTH_ROOT"}],
 12048:['12622',{"orig":12048,"fnv":"a41f04a4","name":"SAVO_I7603_ISASC505_INSTALLED_HOOD_ROOT_WORK_TEST"}],
 12053:['12623',{"orig":12053,"fnv":"d9786b9a","mesh":4771,"name":"SAVO_I7603_WHITE_LOWER_SHELL_560MM_VISUAL_PROXY_WORK_TEST"}],
 12054:['12624',{"orig":12054,"fnv":"b63d1cc4","mesh":4772,"name":"SAVO_I7603_WHITE_UPPER_SHELL_315MM_HEIGHT_ASSUMED_WORK_TEST"}],
 12055:['12625',{"orig":12055,"fnv":"aae0e2ce","mesh":4773,"name":"SAVO_I7603_VISIBLE_HORIZONTAL_BODY_JOIN_VISUAL_PROXY_WORK_TEST"}],
 12056:['12626',{"orig":12056,"fnv":"ca07d46f","mesh":4774,"name":"SAVO_I7603_CEILING_FLUSH_JUNCTION_VISUAL_PROXY_WORK_TEST"}]
};
const superseded=new Set(Object.keys(R20_ALIASES).map(Number));
export const C80_620R20_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R19_COW_ALIASES).filter(([,a])=>!superseded.has(a.orig)),
 ...Object.values(R20_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
const rows=[
 [674,668,'1F','03302126'],
 [675,669,'2F','21de9390'],
 [676,670,'BOTH_A','68175f1e'],
 [677,671,'BOTH_B','a6be89bc'],
 [678,672,'BOTH_C','26f7875c'],
 [679,673,'BOTH_D','cb5654a2'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R20_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R19_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R20SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R20_SCENES[sceneIndex];
 if(sha!==C80_620R20_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==680||json.nodes?.length!==12627||json.meshes?.length!==4775||
    json.materials?.length!==776||json.accessors?.length!==10796||json.bufferViews?.length!==10802)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R20_ALL_R19_DONORS_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R20_donorIntegration20261119!==true||e?.C80_620R20_parentGLBSHA256!==C80_620R20_PARENT_GLB_SHA256||
    e?.C80_620R20_parentScene!==spec.parent||e?.preserve620R19Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.map(n=>C80_620R20_ROOT_REPLACEMENTS[n]??n);
 if(spec.floor!=='2F')expected.push(...C80_620R20_APPENDED_ROOTS);
 if(!eqList(roots,expected))return false;
 const kids=n=>json.nodes[n]?.children?.join();
 if(kids(12554)!=='12539,12553'||kids(12553)!=='12549,12550,12551,12552'||kids(12619)!=='12615,12616,12617,12618'||
    kids(12559)!=='12560,12561,12562,12563'||kids(12568)!=='12564,12565,12566,12567'||json.nodes[12558]?.mesh!==4720||
    json.nodes[12557]?.children?.length!==95||!json.nodes[12557].children.includes(12555)||!json.nodes[12557].children.includes(12556)||
    json.nodes[12621]?.children?.length!==59||!json.nodes[12621].children.includes(12620)||json.nodes[12622]?.children?.length!==29||
    [12623,12624,12625,12626].some((n,i)=>json.nodes[n]?.mesh!==4771+i))return false;
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R20_K10_VALVE_ROOT).length!==1||
    !json.nodes[12557]?.children?.includes(10060)))return false;
 return true;
}
