/**
 * C80 620R10 (High KANON-NEXT GPT6-KANONNEXT-632R10-1611-2259-M4, RELEASED 16.11.2026 23:10) on top of the
 * owner-reviewed C80 614 R10. The six 614 R10 scenes 608..613 are copied to 614..619 and the RELEASED
 * 632R9 donor roles are added as append-only COW: J1 NIBE R200 + Savo IH7603W (2F), J2 K11 96 mm sauna bench,
 * K10 indoor-store exhaust (visible face only), K14 RK9 historical marker hidden (T-collector n10060 kept),
 * G2S09 Toshiba outdoor-unit bbox, K05 ROOM3 smooth handles (lever sides 9195/9196 dropped), K13 light
 * translucent KPH IV enclosure. All 614 R10 nodes/meshes/materials/accessors/bufferViews and the 614 R10
 * BIN prefix are byte-exact; nothing in the R10 stair/hall/ceiling is changed. WORK_TEST/HOST_HOLD.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import {
 C80_614_GLB_SHA256, C80_614_SCENES, C80_614_COW_ALIASES, C80_614_DUCT_ROOT, c80614Fnv32,
} from './privateModelC80614SourceProfile.mjs';

export const C80_620R10_GLB_SHA256='10eba5613aca712f1a7de67098c30a0d58a1291cc066bcc88bf5b921e30e12d4';
export const C80_620R10_GLB_BYTES=57583012;
export const C80_620R10_ZIP_SHA256='72fe3543e13def23bdb983bec7be44db4bffc91102d8851ba4da9b80075a1c23';
export const C80_620R10_ZIP_DRIVE_ID='1KErAxj9OYYt_zw0zYiNJ79xAMVWGVsxc';
export const C80_620R10_PARENT_GLB_SHA256=C80_614_GLB_SHA256;
export const C80_620R10_DONOR_GLB_SHA256='f911a41a4b2d33d419b93da14b869a7e48efae7c56e28a8c710aa47ac56c03e0';
export const C80_620R10_DUCT_ROOT=C80_614_DUCT_ROOT;
// 614 R10 scene root -> 620R10 COW root (where the parent scene has the root).
export const C80_620R10_ROOT_REPLACEMENTS=Object.freeze({
 11305:12445,  // J2 K11 96 mm sauna bench (replaces the V85 U deck)
 11642:12466,  // J1 NIBE R200 (COW children 12446..12461)
 12053:12462, 12054:12463, 12055:12464, 12056:12465, // J1 Savo IH7603W shells/lines
 11728:12467,  // K14 RK9 marker hidden; T-collector n10060 kept under the new root
 12329:12471,  // K13 KPH controls root with the translucent IV enclosure 12470
 12361:12469,  // G2S09 Toshiba outdoor unit bbox
 12396:12475,  // K05 ROOM3 2F root with smooth handles
});
// K05: the ROOM3 lever sides are not carried into the 620R10 scenes.
export const C80_620R10_DROPPED_ROOTS=Object.freeze([9195,9196]);
// K10 indoor-store exhaust: 1F/BOTH only.
export const C80_620R10_ADDED_1F_ROOTS=Object.freeze([12444]);
const NEW_ALIASES={
 12446:{orig:11626,fnv:'ecb2c663'},12447:{orig:11627,fnv:'3e2c170e'},12448:{orig:11628,fnv:'3a6c6c6a'},
 12449:{orig:11629,fnv:'ac53f0bf'},12450:{orig:11630,fnv:'f6e7425c'},12451:{orig:11631,fnv:'4e50f7ec'},
 12452:{orig:11632,fnv:'07749e9f'},12453:{orig:11633,fnv:'4e765499'},12454:{orig:11634,fnv:'c649cc84'},
 12455:{orig:11635,fnv:'eaf58bc9'},12456:{orig:11636,fnv:'f833c379'},12457:{orig:11637,fnv:'798af814'},
 12458:{orig:11638,fnv:'25e289f9'},12459:{orig:11639,fnv:'5ee78347'},12460:{orig:11640,fnv:'3861326e'},
 12461:{orig:11641,fnv:'38b8e9f7'},
 12462:{orig:12053,fnv:'06388792'},12463:{orig:12054,fnv:'1bf1bfef'},12464:{orig:12055,fnv:'c783b949'},
 12465:{orig:12056,fnv:'b718bb71'},12466:{orig:11642,fnv:'4f233a5b'},
 // Renamed COW roots: alias.name is the new node's own (pinned) name.
 12467:{orig:11728,fnv:'d8108384',name:'C80_R3_K14_RK9_HISTORICAL_MARKER_HIDDEN_OWNER_ROOT'},
 12469:{orig:12361,fnv:'2dd5665d',name:'C80_620C_TOSHIBA_G2S09_BBOX_ROOT_COW_FROM_608C_DONOR'},
 12471:{orig:12329,fnv:'07f83508',name:'C80_626R9_K13_KPH_CONTROLS_COW_ROOT_T10060_PRESERVED'},
 12472:{orig:12219,fnv:'a12d437d'},12473:{orig:12220,fnv:'40d7fcca'},
 12474:{orig:12221,fnv:'d332a84a'},12475:{orig:12222,fnv:'eeecb5d1'},
};
// 614 R10 aliases stay valid (their nodes are byte-exact); 12395/12396 are superseded by 12474/12475.
export const C80_620R10_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_614_COW_ALIASES).filter(([n])=>!['12395','12396'].includes(n)),
 ...Object.entries(NEW_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
// [glTF scene, 614 R10 parent scene, floorProfile, FNV root hash].
const rows=[
 [614,608,'1F','230e4012'],
 [615,609,'2F','87209d07'],
 [616,610,'BOTH_A','2f0ce142'],
 [617,611,'BOTH_B','781a09be'],
 [618,612,'BOTH_C','31304774'],
 [619,613,'BOTH_D','64cf4607'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R10_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_614_SCENES[parent].rootHash})];
 })));
const eqSet=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&b.every(n=>a.includes(n));
export function isC80620R10SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R10_SCENES[sceneIndex];
 if(sha!==C80_620R10_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==620||json.nodes?.length!==12476||json.meshes?.length!==4686||
    json.materials?.length!==759||json.accessors?.length!==10587||json.bufferViews?.length!==10593)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R10_OWNER614R10_J1J2_K10K14_G2S09_K05_K13_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R10_sourceExactRebase!==true||e?.ownerR10GLBSHA256!==C80_620R10_PARENT_GLB_SHA256||
    e?.releasedDonor632R9GLBSHA256!==C80_620R10_DONOR_GLB_SHA256||e?.sourceOwnerScene!==spec.parent||
    e?.preserveOwnerR10Geometry!==true||e?.notCanonical!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.filter(n=>!C80_620R10_DROPPED_ROOTS.includes(n)).map(n=>C80_620R10_ROOT_REPLACEMENTS[n]??n)
  .concat(spec.floor==='2F'?[]:C80_620R10_ADDED_1F_ROOTS);
 if(!eqSet(roots,expected))return false;
 // T-collector n10060 stays (owner 15.11.2026) under the K14 root in 1F/BOTH.
 if(spec.floor!=='2F'&&!json.nodes[12467]?.children?.includes(10060))return false;
 if(!json.nodes[12471]?.children?.includes(12470))return false;
 return true;
}
