/**
 * C80 620R15 (Claude KANON-NEXT 17.11.2026, owner review 21.31-21.39 and open points of 19.20) on top of C80 620R14.
 * The six 620R14 scenes 638..643 are copied to 644..649 with copy-on-write roots: contour display 8757 without the
 * north paved area, double-sided bathroom ceiling 11316, simple 2F WC exhaust duct (roots 12397/12401), heat-lamp
 * cord along the floor line, mirror-cabinet socket in the right half with a conduit, TV point in line with the
 * sockets, owner-plan pins as wall sockets (PR-13 duplicate out) in group 11739, water root 12163 without the VP1
 * valve and with the hot riser inside the partition; added closet light (1F/BOTH) and conduit (2F/BOTH).
 * All 620R14 data and the 620R14 BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R14_GLB_SHA256, C80_620R14_SCENES, C80_620R14_COW_ALIASES, C80_620R14_DUCT_ROOT, C80_620R14_K10_VALVE_ROOT,
 C80_620R14_CLOSET_VALVE_ROOT, C80_620R14_STORE_GRILLE_ROOT,
} from './privateModelC80620R14SourceProfile.mjs';

export const C80_620R15_GLB_SHA256='a83959e3d859dc81a5214efe8579068166f443496b3d8455e9aef458f462e96d';
export const C80_620R15_GLB_BYTES=58314340;
export const C80_620R15_ZIP_SHA256='02795b5292b4ac3b5924dae86dfd199921861c9336cc3890aa9010c69ce54f9d';
export const C80_620R15_ZIP_DRIVE_ID='107y8zUKxsPx8zIPiC_0_qD2lSszT2ZDv';
export const C80_620R15_PARENT_GLB_SHA256=C80_620R14_GLB_SHA256;
export const C80_620R15_DUCT_ROOT=C80_620R14_DUCT_ROOT;
export const C80_620R15_K10_VALVE_ROOT=C80_620R14_K10_VALVE_ROOT;
export const C80_620R15_CLOSET_VALVE_ROOT=C80_620R14_CLOSET_VALVE_ROOT;
export const C80_620R15_STORE_GRILLE_ROOT=C80_620R14_STORE_GRILLE_ROOT;
// 620R14 root -> 620R15 COW root (only where the parent scene has it).
export const C80_620R15_ROOT_REPLACEMENTS=Object.freeze({
 8757:12498, 11316:12499, 12397:12501, 12401:12502, 12495:12503, 12496:12504, 11739:12510, 12163:12515,
});
export const C80_620R15_ADDED_1F_ROOTS=Object.freeze([12511]);   // closet ceiling light (1F/BOTH)
export const C80_620R15_ADDED_2F_ROOTS=Object.freeze([12505]);   // mirror-cabinet conduit (2F/BOTH)
export const C80_620R15_ELECTRICAL_ROOTS=Object.freeze([12497,12503,12504,12505,12511]);
// COW nodes keep the receipt identity of the node they copy (orig of the 620R14 alias where there was one).
const R15_ALIASES={
 11316:['12499',{"orig":11316,"fnv":"96df8c72","mesh":4698}],
 10122:['12500',{"orig":10122,"fnv":"bb8f367b","mesh":4699,"name":"C80_620R15_D2F_WC_EXHAUST_D125_SIMPLE_TRUNK_AND_CEILING_VALVE_BRANCH_WORK_TEST"}],
 12397:['12501',{"orig":11714,"fnv":"92af8586"}],
 12401:['12502',{"orig":11729,"fnv":"6d4b37f5"}],
 11754:['12506',{"orig":11754,"fnv":"9e7fd687"}],
 11740:['12507',{"orig":11740,"fnv":"6b7f6087","mesh":4703,"name":"C80_620R15_1F-PR-10_SOCKET_ON_BATHROOM_FACE_OF_PARTITION_X3888_WORK_TEST"}],
 11741:['12508',{"orig":11741,"fnv":"0609e8f4","mesh":4704,"name":"C80_620R15_1F-PR-11_SOCKET_ON_BATHROOM_FACE_OF_PARTITION_X3888_WORK_TEST"}],
 11743:['12509',{"orig":11743,"fnv":"1ed325c2","mesh":4705,"name":"C80_620R15_1F-PR-14_SOCKET_ON_WEST_WALL_X0220_WORK_TEST"}],
 11739:['12510',{"orig":11739,"fnv":"5619a194"}],
 12161:['12512',{"orig":12161,"fnv":"4b2bc58d","mesh":4707}],
 12162:['12513',{"orig":12162,"fnv":"b7a86b5d"}],
 12153:['12514',{"orig":12153,"fnv":"5663b2ab"}],
 12163:['12515',{"orig":12163,"fnv":"51c11295"}]
};
export const C80_620R15_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R14_COW_ALIASES),
 ...Object.values(R15_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
// [glTF scene, 620R14 parent scene, floorProfile, FNV root hash].
const rows=[
 [644,638,'1F','476b1c79'],
 [645,639,'2F','ff6b3a4f'],
 [646,640,'BOTH_A','d6714d4a'],
 [647,641,'BOTH_B','955b439e'],
 [648,642,'BOTH_C','d98119d4'],
 [649,643,'BOTH_D','4485849d'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R15_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R14_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R15SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R15_SCENES[sceneIndex];
 if(sha!==C80_620R15_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==650||json.nodes?.length!==12516||json.meshes?.length!==4708||
    json.materials?.length!==762||json.accessors?.length!==10657||json.bufferViews?.length!==10663)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R15_OWNER_REVIEW_1711_LATE_FIXES_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R15_ownerReview20261117Late!==true||e?.C80_620R15_parentGLBSHA256!==C80_620R15_PARENT_GLB_SHA256||
    e?.C80_620R15_parentScene!==spec.parent||e?.preserve620R14Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=[...prior.map(n=>C80_620R15_ROOT_REPLACEMENTS[n]??n),
  ...(spec.floor!=='2F'?C80_620R15_ADDED_1F_ROOTS:[]),...(spec.floor!=='1F'?C80_620R15_ADDED_2F_ROOTS:[])];
 if(!eqList(roots,expected))return false;
 if(json.nodes[12500]?.mesh!==4699||json.nodes[12500]?.matrix!==undefined||
    !json.nodes[12501]?.children?.includes(12500)||json.nodes[12501].children.includes(10122)||
    !json.nodes[12502]?.children?.includes(12500)||
    json.materials[json.meshes[json.nodes[12499]?.mesh]?.primitives?.[0]?.material]?.doubleSided!==true||
    json.nodes[12510]?.children?.includes(11742)||!json.nodes[12510]?.children?.includes(12506)||
    json.nodes[12514]?.children?.includes(12068)||!json.nodes[12515]?.children?.includes(12514)||
    !json.nodes[12513]?.children?.includes(12512)||json.nodes[12512]?.mesh!==4707)return false;
 // T-collector n10060 stays (owner 15.11.2026) under the K14 root in 1F/BOTH.
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R15_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
