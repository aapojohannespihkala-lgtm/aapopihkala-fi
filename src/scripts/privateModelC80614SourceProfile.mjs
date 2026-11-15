/**
 * C80 614 (Claude, owner review 15.11.2026 #2) on top of C80 608C:
 * T-collector n10060 restored (608C removed it by mistake), 1F wet-core
 * ghost planes 6419/6420 ("black hatching") dropped, 1F SW-02 and 2F SW-03
 * moved to the owner's marked points, 2F kitchen Exxact outlet moved from
 * behind the tall cabinet to Y2.336, 2F WC exhaust rebuilt as two clean d125
 * runs (KSO125 wall valve + ceiling valve above the door) with the duplicate
 * hall valve and B47K flex fourway dropped; the V86 hanging stair hole-fill
 * block removed (slab-edge band kept), and the hall door wall moved to X2.444
 * in front of the locked stair opening (X0.229-2.424) with the niche front fitted. Append-only COW; scenes 0..607
 * and the 608C BIN prefix are unchanged. WORK_TEST/HOST_HOLD.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { C80_608C_GLB_SHA256 } from './privateModelC80608CSourceProfile.mjs';

export const C80_614_GLB_SHA256='93a133ec8177dc84240779e217eb58a57ae4d413395de4f1134873c6b148fca9';
export const C80_614_GLB_BYTES=57216336;
export const C80_614_ZIP_SHA256='139f9a1344d2719919bce7290f92607794f1b461f17238970c4622cc92245992';
export const C80_614_ZIP_DRIVE_ID='1MOS8Cc22LLo94GZQsYp1HovrkS7sHbO_';
export const C80_614_PARENT_GLB_SHA256=C80_608C_GLB_SHA256;
export const C80_614_DUCT_ROOT=12400;
export const C80_614_ILP_ROOT=12361;
// Root replacements (608C scene root -> 614 node) per new scene.
export const C80_614_ROOT_REPLACEMENTS=Object.freeze({
 12347:11728,           // original T-collector root (n10060 restored)
 12349:12390,           // 1F SW-02
 12353:12391,           // 2F SW-03
 12222:12396,           // 2F kitchen R19 Exxact outlet moved
 11714:12397,           // 2F IV root (BOTH) without duplicate hall valve 11617-11619
 11729:12401,           // 2F IV root (2F) without duplicate hall valve 11617-11619
 12360:12400,           // 2F WC exhaust: two d125 runs
 12334:12402,           // stair: V86 hanging hole-fill block removed (owner 15.11 #2)
 // Stair east wall line (owner photos 16.11): door wall to X2.444, niche front fitted.
 7221:12403, 9274:12404, 10534:12405, 10535:12406, 10536:12407, 9250:12411, 9231:12412,
});
// 608C roots that are not carried into the 614 scenes.
export const C80_614_DROPPED_ROOTS=Object.freeze([6419,6420,12044]);
// COW nodes that keep the C80 437 receipt identity of their original node.
// The whole-GLB SHA authenticates bytes; the FNV pins each new node JSON.
export const C80_614_COW_ALIASES=Object.freeze({
 12348:Object.freeze({orig:11766,fnv:'4c7c14b0'}),
 12350:Object.freeze({orig:11776,fnv:'17f66a82'}),
 12355:Object.freeze({orig:11842,fnv:'102c2d73'}),
 12390:Object.freeze({orig:11769,fnv:'736115fb'}),
 12392:Object.freeze({orig:10895,fnv:'94007e45'}),
 12393:Object.freeze({orig:10898,fnv:'ef7dbea4'}),
 12394:Object.freeze({orig:10896,fnv:'8b80ffe7'}),
 12395:Object.freeze({orig:12221,fnv:'d6456d92'}),
 12396:Object.freeze({orig:12222,fnv:'7a5d51ab'}),
 12397:Object.freeze({orig:11714,fnv:'2874c4c1'}),
 12401:Object.freeze({orig:11729,fnv:'fd75eaba'}),
 // Geometry COWs: the new node also carries a new mesh (alias.mesh).
 12403:Object.freeze({orig:7221,fnv:'cdaced55',mesh:4666}),
 12404:Object.freeze({orig:9274,fnv:'5c279970',mesh:4667}),
 12405:Object.freeze({orig:10534,fnv:'822a694d',mesh:4668}),
 12406:Object.freeze({orig:10535,fnv:'d6bbd451',mesh:4669}),
 12407:Object.freeze({orig:10536,fnv:'0c859814',mesh:4670}),
 12408:Object.freeze({orig:7289,fnv:'6753296a'}),
 12409:Object.freeze({orig:9232,fnv:'9ea9fa48'}),
 12410:Object.freeze({orig:9233,fnv:'b11efca7'}),
 12411:Object.freeze({orig:9250,fnv:'c25be18f'}),
 12412:Object.freeze({orig:9231,fnv:'9e35072b'}),
});
// [glTF scene, parent scene, floorProfile, FNV root hash, parent hash].
const rows=[
 [608,602,'1F','53609bc6','6767bb3e'],
 [609,603,'2F','86883039','8ca9b0d5'],
 [610,604,'BOTH_A','46cd1d7a','8001baa9'],
 [611,605,'BOTH_B','f371369c','f17c16e3'],
 [612,606,'BOTH_C','a5f737a0','1e2e3cc3'],
 [613,607,'BOTH_D','597a72e1','14ca1974'],
];
export const C80_614_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash,parentRootHash])=>
 [scene,Object.freeze({scene,parent,profile,floor:profile.startsWith('BOTH')?'BOTH':profile,
  cutaway:profile==='BOTH_D',rootHash,parentRootHash})]
)));
export function c80614Fnv32(ids) {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80614SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_614_SCENES[sceneIndex];
 if(sha!==C80_614_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==614||json.nodes?.length!==12413||json.meshes?.length!==4671||
    json.materials?.length!==758||json.accessors?.length!==10522||json.bufferViews?.length!==10528)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_614_OWNER_FIXES2_TCOLLECTOR_GHOST_SWITCHES_OUTLET_WC_EXHAUST_FROM_${spec.parent}_${spec.floor}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    new Set(roots).size!==roots.length||
    e?.C80614ParentSceneIndex!==spec.parent||e?.C80614ParentGLBSHA256!==C80_614_PARENT_GLB_SHA256||
    e?.physicalVerified!==false||e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.CURRENT!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.filter(n=>!C80_614_DROPPED_ROOTS.includes(n)).map(n=>C80_614_ROOT_REPLACEMENTS[n]??n);
 if(!eq(roots,expected))return false;
 // COW nodes keep their original names; the T-collector is back under 11728.
 for(const [from,to] of Object.entries(C80_614_ROOT_REPLACEMENTS)){
  if(!prior.includes(Number(from))||Number(from)===12360)continue;
  if(json.nodes[to]?.name!==json.nodes[from]?.name)return false;
 }
 if(spec.floor!=='2F'&&!json.nodes[11728]?.children?.includes(10060))return false;
 for(const [cow,orig] of [[12397,11714],[12401,11729]]){
  const iv=json.nodes[cow]?.children,ivOrig=json.nodes[orig]?.children;
  if(!Array.isArray(iv)||!eq(iv,(ivOrig??[]).filter(n=>![11617,11618,11619].includes(n))))return false;
 }
 return true;
}
