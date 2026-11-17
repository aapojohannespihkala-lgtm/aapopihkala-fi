/**
 * C80 620R12 (Claude KANON-NEXT 17.11.2026, owner review of 620R11 at 09:30) on top of C80 620R11.
 * The six 620R11 scenes 620..625 are copied to 626..631 with two append-only fixes and nothing else:
 * K10 indoor-store exhaust: the sealed duct n12096 is moved onto the axis of the owner-point valve
 * (X0.36 Y8.79 Z2.36, valve root 12477 unchanged) as COW node 12480 (mesh 4688), and the duplicate
 * MJ63R2 valve root 12092 at the old assumed place X1.60 is left out of the new scenes.
 * ILP: the Toshiba outdoor unit is set on the pavers (new root 12483 with the lowering groups
 * 12481 case/posts/rails -127 mm and 12482 feet -113 mm; the part nodes themselves are unchanged).
 * All 620R11 nodes/meshes/materials/accessors/bufferViews and the 620R11 BIN prefix are byte-exact.
 * WORK_TEST/HOST_HOLD. Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R11_GLB_SHA256, C80_620R11_SCENES, C80_620R11_COW_ALIASES, C80_620R11_DUCT_ROOT,
} from './privateModelC80620R11SourceProfile.mjs';

export const C80_620R12_GLB_SHA256='3ce69727f65ddfc90468c13ed4a619b03fca92b194993d10c035db1a0aa387f1';
export const C80_620R12_GLB_BYTES=57740128;
export const C80_620R12_ZIP_SHA256='64688f20514ba11debd69ce6bf1c569f732807661bc9b3f093f68010fa36adc3';
export const C80_620R12_ZIP_DRIVE_ID='PLACEHOLDER_DRIVE_ID';
export const C80_620R12_PARENT_GLB_SHA256=C80_620R11_GLB_SHA256;
export const C80_620R12_DUCT_ROOT=C80_620R11_DUCT_ROOT;
// The one store exhaust valve (owner point); a technical root of its own from 620R12 on.
export const C80_620R12_K10_VALVE_ROOT=12477;
// 620R11 scene root -> 620R12 COW root (1F/BOTH scenes only; the 2F scene has none of them).
export const C80_620R12_ROOT_REPLACEMENTS=Object.freeze({
 12096:12480,  // K10 sealed store exhaust duct, moved to the valve axis
 12469:12483,  // Toshiba outdoor unit, set on the pavers
});
export const C80_620R12_REMOVED_ROOTS=Object.freeze([12092]);  // duplicate MJ63R2 valve
export const C80_620R12_ILP_DROPS=Object.freeze({12481:-0.127,12482:-0.113});
// 620R11 aliases stay valid (their nodes are byte-exact). The outdoor unit root 12469 is replaced by
// a regrouped root with no receipt identity; the moved duct keeps the identity of n12096.
export const C80_620R12_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R11_COW_ALIASES).filter(([n])=>n!=='12469'),
 ['12480',Object.freeze({orig:12096,fnv:'c57d7377',mesh:4688,
  name:'C80_620R12_K10_STORE_EXHAUST_SEALED_DUCT_AT_OWNER_POINT_COW_OF_MJ63R2_WORK_TEST'})],
]));
// [glTF scene, 620R11 parent scene, floorProfile, FNV root hash].
const rows=[
 [626,620,'1F','b1bac38c'],
 [627,621,'2F','87209d07'],
 [628,622,'BOTH_A','a0aff634'],
 [629,623,'BOTH_B','67248be2'],
 [630,624,'BOTH_C','0bba88d2'],
 [631,625,'BOTH_D','2d40dec7'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R12_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R11_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R12SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R12_SCENES[sceneIndex];
 if(sha!==C80_620R12_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==632||json.nodes?.length!==12484||json.meshes?.length!==4689||
    json.materials?.length!==759||json.accessors?.length!==10591||json.bufferViews?.length!==10597)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R12_K10_DUCT_AT_OWNER_POINT_ILP_GROUNDED_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R12_ownerReview20261117!==true||e?.C80_620R12_parentGLBSHA256!==C80_620R12_PARENT_GLB_SHA256||
    e?.C80_620R12_parentScene!==spec.parent||e?.preserve620R11Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 // Same root order as the 620R11 parent scene: duplicate valve dropped, two COW roots swapped.
 if(!eqList(roots,prior.filter(n=>!C80_620R12_REMOVED_ROOTS.includes(n))
    .map(n=>C80_620R12_ROOT_REPLACEMENTS[n]??n)))return false;
 const unit=json.nodes[12483],upper=json.nodes[12481],feet=json.nodes[12482],old=json.nodes[12469]?.children??[];
 if(json.nodes[12480]?.mesh!==4688||json.nodes[12480]?.children!==undefined||
    !eqList(unit?.children??[],[12481,12482])||unit.translation!==undefined||
    !eqList(upper?.translation??[],[0,C80_620R12_ILP_DROPS[12481],0])||
    !eqList(feet?.translation??[],[0,C80_620R12_ILP_DROPS[12482],0])||
    !eqList([...(upper.children??[]),...(feet.children??[])],old)||!eqList(feet.children??[],[12388,12389]))return false;
 // One valve at the owner point with its duct in 1F/BOTH; T-collector n10060 stays (owner 15.11.2026).
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R12_K10_VALVE_ROOT).length!==1||!roots.includes(12480)||
    !roots.includes(12483)||!json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
