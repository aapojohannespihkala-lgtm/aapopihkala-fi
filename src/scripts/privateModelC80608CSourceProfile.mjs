/**
 * C80 608C (Claude, owner request 15.11.2026) on top of C80 602:
 * T-collector n10060 removed, 8 light switches re-hosted to the owner's
 * Johdotus.me drawing, 2F WC LED moved, KSO125 exhaust connection duct and
 * the Toshiba outdoor unit (PHOTO12 root 12116) added. Append-only COW;
 * scenes 0..601 and the 602 BIN prefix are unchanged. WORK_TEST/HOST_HOLD.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { C80_602_GLB_SHA256 } from './privateModelC80602SourceProfile.mjs';

export const C80_608C_GLB_SHA256='eadb96e656174e556c2692953808ce535cf75cee649a137f6627032d3bba4006';
export const C80_608C_GLB_BYTES=56931072;
export const C80_608C_ZIP_SHA256='faed9fb607778b89c0b86cc2ea75b20f48cd521009f640b13afe122229ca608f';
export const C80_608C_ZIP_DRIVE_ID='1H8ggOaFX-xfaJhLOzplN0jBYDLhECVaR';
export const C80_608C_PARENT_GLB_SHA256=C80_602_GLB_SHA256;
export const C80_608C_DUCT_ROOT=12360;
export const C80_608C_ILP_ROOT=12361;
// Root replacements (parent 602 node -> 608C COW node) per new scene.
export const C80_608C_ROOT_REPLACEMENTS=Object.freeze({
 11728:12347,                       // T-collector 10060 removed
 11766:12348,11769:12349,11776:12350, // 1F switches SW-01..03
 12340:12351,12343:12352,12346:12353,12337:12354,11842:12355, // 2F switches
 12311:12358,                       // K02 markers with moved WC LED
});
// COW nodes that keep the C80 437 receipt identity of their original node.
// The whole-GLB SHA authenticates bytes; the FNV pins each new node JSON.
export const C80_608C_COW_ALIASES=Object.freeze({
 12347:Object.freeze({orig:11728,fnv:'03eb4a77'}),
 12348:Object.freeze({orig:11766,fnv:'4c7c14b0'}),
 12349:Object.freeze({orig:11769,fnv:'4af22aa5'}),
 12350:Object.freeze({orig:11776,fnv:'17f66a82'}),
 12355:Object.freeze({orig:11842,fnv:'102c2d73'}),
});
// [glTF scene, parent scene, floorProfile, FNV root hash, parent hash].
const rows=[
 [602,596,'1F','6767bb3e','b1a93af0'],
 [603,597,'2F','8ca9b0d5','1e7d348d'],
 [604,598,'BOTH_A','8001baa9','8ff773e7'],
 [605,599,'BOTH_B','f17c16e3','86e37071'],
 [606,600,'BOTH_C','1e2e3cc3','4a369f9d'],
 [607,601,'BOTH_D','14ca1974','1526d9e2'],
];
export const C80_608C_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash,parentRootHash])=>
 [scene,Object.freeze({scene,parent,profile,floor:profile.startsWith('BOTH')?'BOTH':profile,
  rootHash,parentRootHash})]
)));
export function c80608CFnv32(ids) {
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80608CSourceScene(json,sha,sceneIndex,floor){
 const spec=C80_608C_SCENES[sceneIndex];
 if(sha!==C80_608C_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==608||json.nodes?.length!==12390||json.meshes?.length!==4663||
    json.materials?.length!==758||json.accessors?.length!==10491||json.bufferViews?.length!==10497)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_608C_OWNER_FIXES_SWITCHES_LED_DUCT_ILP_TCOLLECTOR_FROM_${spec.parent}_${spec.floor}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80608CFnv32(roots)!==spec.rootHash||c80608CFnv32(prior)!==spec.parentRootHash||
    new Set(roots).size!==roots.length||
    e?.C80608CParentSceneIndex!==spec.parent||e?.C80608CParentGLBSHA256!==C80_608C_PARENT_GLB_SHA256||
    e?.physicalVerified!==false||e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.CURRENT!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const added=[...(spec.floor!=='1F'?[C80_608C_DUCT_ROOT]:[]),...(spec.floor!=='2F'?[C80_608C_ILP_ROOT]:[])];
 const expected=[...prior.map(n=>C80_608C_ROOT_REPLACEMENTS[n]??n),...added];
 if(!eq(roots,expected)||!eq(e?.C80608CAddedRoots,added))return false;
 // COW nodes keep their original names; the T-collector root only loses 10060.
 for(const [from,to] of Object.entries(C80_608C_ROOT_REPLACEMENTS)){
  if(!prior.includes(Number(from)))continue;
  if(json.nodes[to]?.name!==json.nodes[from]?.name)return false;
 }
 const tc=json.nodes[12347]?.children,orig=json.nodes[11728]?.children;
 if(!Array.isArray(tc)||!eq(tc,(orig??[]).filter(n=>n!==10060)))return false;
 return true;
}
