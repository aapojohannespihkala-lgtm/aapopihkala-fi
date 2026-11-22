/**
 * C80 620R11 (Claude KANON-NEXT 17.11.2026) on top of C80 620R10. The six 620R10 scenes 614..619 are
 * copied to 620..625 with three append-only COW clearance fixes and nothing else:
 * K13 KPH IV enclosure split at the partition X3.788..3.888 (new node 12478 under COW root 12479),
 * K10 indoor-store exhaust root lowered 6 mm below the ceiling plane (COW root 12477),
 * K11 sauna bench ends 1 mm clear of the side panelling (COW node 12476, mesh 4686).
 * All 620R10 nodes/meshes/materials/accessors/bufferViews and the 620R10 BIN prefix are byte-exact.
 * WORK_TEST/HOST_HOLD. Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R10_GLB_SHA256, C80_620R10_SCENES, C80_620R10_COW_ALIASES, C80_620R10_DUCT_ROOT,
} from './privateModelC80620R10SourceProfile.mjs';

export const C80_620R11_GLB_SHA256='8632ed927f05e36edf689c44cdef0dc5fac3fc7161c8790cfcb02e2661005b4e';
export const C80_620R11_GLB_BYTES=57681492;
export const C80_620R11_ZIP_SHA256='498d3831244827c25b7d13c28b1ac8eed066f46cdfce29d04c3ef0a93da0cfc6';
export const C80_620R11_ZIP_DRIVE_ID='1OKA0QPhnwrLvdcg5aNM7pFdoENgpT_dd';
export const C80_620R11_PARENT_GLB_SHA256=C80_620R10_GLB_SHA256;
export const C80_620R11_DUCT_ROOT=C80_620R10_DUCT_ROOT;
// 620R10 scene root -> 620R11 COW root (1F/BOTH scenes only; the 2F scene has none of them).
export const C80_620R11_ROOT_REPLACEMENTS=Object.freeze({
 12445:12476,  // K11 sauna bench, ends clamped to X3.899..6.243
 12444:12477,  // K10 indoor-store exhaust, lowered 6 mm
 12471:12479,  // K13 KPH controls root with the split IV enclosure 12478
});
export const C80_620R11_VALVE_TRANSLATION=Object.freeze([0,-0.006,0]);
// 620R10 aliases stay valid (their nodes are byte-exact); 12471 is superseded by 12479.
export const C80_620R11_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R10_COW_ALIASES).filter(([n])=>n!=='12471'),
 ['12479',Object.freeze({orig:12329,fnv:'1fb0946b',
  name:'C80_620R11_K13_KPH_CONTROLS_COW_ROOT_ENCLOSURE_SPLIT_T10060_PRESERVED'})],
]));
// [glTF scene, 620R10 parent scene, floorProfile, FNV root hash].
const rows=[
 [620,614,'1F','77ceb6f0'],
 [621,615,'2F','87209d07'],
 [622,616,'BOTH_A','1f433c10'],
 [623,617,'BOTH_B','9180d11c'],
 [624,618,'BOTH_C','72b7dcf2'],
 [625,619,'BOTH_D','94f4ddd9'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R11_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R10_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R11SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R11_SCENES[sceneIndex];
 if(sha!==C80_620R11_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==626||json.nodes?.length!==12480||json.meshes?.length!==4688||
    json.materials?.length!==759||json.accessors?.length!==10590||json.bufferViews?.length!==10596)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R11_K13_K10_K11_CLEARANCE_FIXES_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R11_clearanceFixes!==true||e?.C80_620R11_parentGLBSHA256!==C80_620R11_PARENT_GLB_SHA256||
    e?.C80_620R11_parentScene!==spec.parent||e?.preserve620R10Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 // Same root order as the 620R10 parent scene, only the three COW roots swapped.
 if(!eqList(roots,prior.map(n=>C80_620R11_ROOT_REPLACEMENTS[n]??n)))return false;
 const enclosureRoot=json.nodes[12479]?.children,valve=json.nodes[12477];
 if(!enclosureRoot?.includes(12478)||enclosureRoot.includes(12470)||json.nodes[12478]?.mesh!==4687||
    json.nodes[12476]?.mesh!==4686||!eqList(valve?.translation??[],C80_620R11_VALVE_TRANSLATION)||
    !eqList(valve?.children??[],json.nodes[12444]?.children??[null]))return false;
 // T-collector n10060 stays (owner 15.11.2026) under the K14 root in 1F/BOTH.
 if(spec.floor!=='2F'&&!json.nodes[12467]?.children?.includes(10060))return false;
 return true;
}
