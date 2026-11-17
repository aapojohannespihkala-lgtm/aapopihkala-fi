/**
 * C80 620R18 (Claude KANON-NEXT 18.11.2026, owner 00.07: bathroom room height about 2350 mm) on top of C80 620R17.
 * The six 620R17 scenes 656..661 are copied to 662..667: bathroom ceiling 12521 at Z2.430 (floor 0.080 + 2.350),
 * SG Junistar roots and K02 P08 +0.168 m, measured IV_2 valve back to source height, 2015 Helmi out of root 12485.
 * All 620R17 data and the 620R17 BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R17_GLB_SHA256, C80_620R17_SCENES, C80_620R17_COW_ALIASES, C80_620R17_DUCT_ROOT, C80_620R17_K10_VALVE_ROOT,
 C80_620R17_CLOSET_VALVE_ROOT, C80_620R17_STORE_GRILLE_ROOT, C80_620R17_ELECTRICAL_ROOTS,
} from './privateModelC80620R17SourceProfile.mjs';

export const C80_620R18_GLB_SHA256='5951c731fb8f48b9c8b03ba23f83805883463ad5e8ef91653735517fc266ba6e';
export const C80_620R18_GLB_BYTES=58529876;
export const C80_620R18_ZIP_SHA256='feb6526eaf94760ebf57f6bf055373e9505ea1dbcf1acb992b835676c423229d';
export const C80_620R18_ZIP_DRIVE_ID='12Tz3iQhbQjL8TMYsay5Nk5FF4LppYt9M';
export const C80_620R18_PARENT_GLB_SHA256=C80_620R17_GLB_SHA256;
export const C80_620R18_DUCT_ROOT=C80_620R17_DUCT_ROOT;
export const C80_620R18_K10_VALVE_ROOT=C80_620R17_K10_VALVE_ROOT;
export const C80_620R18_CLOSET_VALVE_ROOT=C80_620R17_CLOSET_VALVE_ROOT;
export const C80_620R18_STORE_GRILLE_ROOT=C80_620R17_STORE_GRILLE_ROOT;
export const C80_620R18_ELECTRICAL_ROOTS=C80_620R17_ELECTRICAL_ROOTS;
export const C80_620R18_BATH_CEILING_ROOT=12521;
export const C80_620R18_ROOT_REPLACEMENTS=Object.freeze({12520:12521,11918:12522,11924:12523,11930:12524,11936:12525,11942:12526,12298:12529,12485:12534});
// Keyed by the 620R17 node that is copied; COW nodes keep its receipt identity. The ceiling stays unbound.
const R18_ALIASES={
 1708:['12530',{"orig":1708,"fnv":"08a0f5af"}],
 1709:['12531',{"orig":1709,"fnv":"15edbdfa"}],
 1710:['12532',{"orig":1710,"fnv":"d035f41a"}],
 1711:['12533',{"orig":1711,"fnv":"1f36fe41"}],
 11918:['12522',{"orig":11918,"fnv":"f6e4062d"}],
 11924:['12523',{"orig":11924,"fnv":"51078431"}],
 11930:['12524',{"orig":11930,"fnv":"c3905ddb"}],
 11936:['12525',{"orig":11936,"fnv":"856d8833"}],
 11942:['12526',{"orig":11942,"fnv":"02841e91"}],
 12278:['12527',{"orig":12278,"fnv":"d6632308"}],
 12279:['12528',{"orig":12279,"fnv":"d7c3e3be"}],
 12298:['12529',{"orig":12298,"fnv":"64439d7c"}],
 12485:['12534',{"orig":12329,"fnv":"50df9e36","name":"C80_620R11_K13_KPH_CONTROLS_COW_ROOT_ENCLOSURE_SPLIT_T10060_PRESERVED"}]
};
export const C80_620R18_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R17_COW_ALIASES),
 ...Object.values(R18_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
const rows=[
 [662,656,'1F','bba8b5fb'],
 [663,657,'2F','bca19cae'],
 [664,658,'BOTH_A','2b084b51'],
 [665,659,'BOTH_B','908f7017'],
 [666,660,'BOTH_C','f915d63b'],
 [667,661,'BOTH_D','9e06ed18'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R18_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R17_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R18SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R18_SCENES[sceneIndex];
 if(sha!==C80_620R18_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==668||json.nodes?.length!==12535||json.meshes?.length!==4712||
    json.materials?.length!==762||json.accessors?.length!==10672||json.bufferViews?.length!==10678)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R18_OWNER_1811_BATH_ROOM_HEIGHT_2350_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R18_ownerRoomHeight20261118!==true||e?.C80_620R18_parentGLBSHA256!==C80_620R18_PARENT_GLB_SHA256||
    e?.C80_620R18_parentScene!==spec.parent||e?.preserve620R17Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 if(!eqList(roots,prior.map(n=>C80_620R18_ROOT_REPLACEMENTS[n]??n)))return false;
 if(json.nodes[12521]?.mesh!==4711||json.nodes[12521].extras?.singleSidedDown!==true||
    json.materials[json.meshes[4711]?.primitives?.[0]?.material]?.doubleSided!==false||
    json.nodes[12534]?.children?.includes(1745)||!json.nodes[12534]?.children?.includes(12530)||
    json.nodes[12530]?.matrix!==undefined)return false;
 if(spec.floor!=='2F'&&(roots.filter(n=>n===C80_620R18_K10_VALVE_ROOT).length!==1||
    !json.nodes[12467]?.children?.includes(10060)))return false;
 return true;
}
