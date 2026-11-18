/**
 * C80 620R19 (Claude KANON-NEXT 18.11.2026) = C80 620R18 + two RELEASED High donors made on 620R18:
 * ILP4 (H1811-1: outdoor-unit stand with four legs, root 12483 -> 12541) and from 674R18 the 1F PA2 hot riser in the
 * wall (1F root 12160 -> 12544) and the D terrace L-step west wall (8747/8749/8751/8753 -> 12545..12548).
 * The six 620R18 scenes 662..667 are copied to 668..673. All 620R18 data and its BIN prefix are byte-exact.
 * WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R18_GLB_SHA256, C80_620R18_SCENES, C80_620R18_COW_ALIASES, C80_620R18_DUCT_ROOT, C80_620R18_K10_VALVE_ROOT,
 C80_620R18_CLOSET_VALVE_ROOT, C80_620R18_STORE_GRILLE_ROOT, C80_620R18_ELECTRICAL_ROOTS,
} from './privateModelC80620R18SourceProfile.mjs';

export const C80_620R19_GLB_SHA256='868f873288310e66d362ca1afa34d8b54ce1096504ab34b9514c09b4a109a5b4';
export const C80_620R19_GLB_BYTES=58622172;
export const C80_620R19_ZIP_SHA256='6eb75190a326f7e6a5f1f1c40f4fb2ba2dec0df0ddea771065272b8d6aedae0a';
export const C80_620R19_ZIP_DRIVE_ID='1mGczsHEhjXqiKDt-XYVQM83RhPlYyP-U';
export const C80_620R19_PARENT_GLB_SHA256=C80_620R18_GLB_SHA256;
export const C80_620R19_DUCT_ROOT=C80_620R18_DUCT_ROOT;
export const C80_620R19_K10_VALVE_ROOT=C80_620R18_K10_VALVE_ROOT;
export const C80_620R19_CLOSET_VALVE_ROOT=C80_620R18_CLOSET_VALVE_ROOT;
export const C80_620R19_STORE_GRILLE_ROOT=C80_620R18_STORE_GRILLE_ROOT;
export const C80_620R19_ELECTRICAL_ROOTS=C80_620R18_ELECTRICAL_ROOTS;
export const C80_620R19_ILP4_ROOT=12541;
// 12160 is a root only in the 1F scene; the BOTH scenes inherited R15's own PA2 COW root.
export const C80_620R19_ROOT_REPLACEMENTS=Object.freeze({12483:12541,12160:12544,8747:12545,8749:12546,8751:12547,8753:12548});
// Keyed by the 620R18 node that is copied; COW nodes keep its receipt identity (PA2 1F water layer).
const R19_ALIASES={
 12158:['12542',{"orig":12158,"fnv":"8b1a559b","mesh":4707,"name":"C80_620R17_PA2_1F_HOT_RISER_IN_WALL_COW_WORK_TEST_HOST_HOLD"}],
 12159:['12543',{"orig":12159,"fnv":"595f036e","name":"MJ64_REHOST__P02_1F_LV_KYTKENNAT_WORK_TEST_PA2_WC385_INTEGRATION_COW_PA2_ENDPOINT_REHOST_20261114_COW_HOT_COLD_CLEARANCE_428_COW_R17_1F_HOT_WALL_COW"}],
 12160:['12544',{"orig":12160,"fnv":"c05c667c","name":"MJ64_REHOST__P02_1F_KV_LV_CONNECTIONS_WORK_TEST_ROOT_PA2_WC385_INTEGRATION_COW_PA2_ENDPOINT_REHOST_20261114_COW_HOT_COLD_CLEARANCE_428_COW_R17_1F_HOT_WALL_COW"}]
};
export const C80_620R19_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R18_COW_ALIASES),
 ...Object.values(R19_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
const rows=[
 [668,662,'1F','57faf06d'],
 [669,663,'2F','bca19cae'],
 [670,664,'BOTH_A','50bf5073'],
 [671,665,'BOTH_B','aaef381d'],
 [672,666,'BOTH_C','f8b0ec89'],
 [673,667,'BOTH_D','e39efb1e'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R19_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R18_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R19SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R19_SCENES[sceneIndex];
 if(sha!==C80_620R19_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==674||json.nodes?.length!==12549||json.meshes?.length!==4716||
    json.materials?.length!==762||json.accessors?.length!==10676||json.bufferViews?.length!==10682)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R19_ILP4_PA2_LSTEP_DONORS_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R19_donorIntegration20261118!==true||e?.C80_620R19_parentGLBSHA256!==C80_620R19_PARENT_GLB_SHA256||
    e?.C80_620R19_parentScene!==spec.parent||e?.preserve620R18Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 if(!eqList(roots,prior.map(n=>C80_620R19_ROOT_REPLACEMENTS[n]??n)))return false;
 if(json.nodes[12541]?.children?.join()!=='12539,12540'||json.nodes[12539]?.children?.length!==7||
    json.nodes[12540]?.children?.length!==4||json.nodes[12544]?.children?.join()!=='12150,12543'||
    json.nodes[12542]?.mesh!==4707||[12545,12546,12547,12548].some((n,i)=>json.nodes[n]?.mesh!==4712+i))return false;
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R19_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
