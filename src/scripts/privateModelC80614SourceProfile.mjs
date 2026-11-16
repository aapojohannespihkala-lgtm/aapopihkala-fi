/**
 * C80 614 (Claude, owner review 15.11.2026 #2) on top of C80 608C:
 * T-collector n10060 restored (608C removed it by mistake), 1F wet-core
 * ghost planes 6419/6420 ("black hatching") dropped, 1F SW-02 and 2F SW-03
 * moved to the owner's marked points, 2F kitchen Exxact outlet moved from
 * behind the tall cabinet to Y2.336, 2F WC exhaust rebuilt as two clean d125
 * runs (KSO125 wall valve + ceiling valve above the door) with the duplicate
 * hall valve and B47K flex fourway dropped; the V86 hanging stair hole-fill
 * block removed (slab-edge band kept), and the hall door wall moved to X2.444
 * in front of the locked stair opening (X0.229-2.424) with the niche front fitted.
 * 614 R3: shoe-rack gap closed by a white wall at X1.642, 2F newel post cut at
 * Z2.43, and an opaque 1F ceiling at Z2.43 (visible from below) replaces ghost 6497.
 * 614 R4 (owner 16.11 #3): the R3 X1.642 wall dropped; the 9798 gap-back wall completed to the winder
 * treads and the Y6.326 wall; straight turn end panel + rail with a gap above the treads (10538); the whole
 * newel post bottom at Z2.43; 1F partitions (7221) and jamb 12135 up to the ceiling Z2.43; ceiling ring
 * around the stair opening filled and the locked opening cut exactly.
 * 614 R5 (owner field dimensions 16.11 #4): the D stair rebuilt as new nodes 12413-12417 in every new
 * scene (14 treads, rise ~183, going 290 / top 270, 2F floor drop 200, 40 mm wood boards with 20 mm
 * nosing, wedge winders, white risers/board ends, closed white stepped side walls to the floor, re-pitched
 * niche, one 28x150 handrail section on all flights, 2F floor-edge L trim); the old stair roots, the duplicate
 * 2F tread set and the R4 rail/gap-wall COWs are dropped. Append-only COW; scenes 0..607
 * and the 608C BIN prefix are unchanged. WORK_TEST/HOST_HOLD.
 * 614 R6 (owner R5 review 16.11 #5): railing posts outside the tread ends (no overlap), full-length white rails
 * to the posts, turn handrail with the same vertical height, dark niche end strip, tread nosings clipped to the
 * walls; hall door wall straight to Y8.79 (the R4/R5 skewed segment fixed) and the entry boxout 5 cm in front
 * of it (X2.444-2.494) with the electric centre, casing, switch, front-door reveals and door moved +0.094.
 * 614 R7 (owner R6 review 16.11 #6): risers clear of the closed side walls (no coplanar seams), dark niche end only
 * toward the hall, bevelled tops on the three lower posts, top post at the 2F low wall line (wall 9764/cap 9763 end
 * shortened) with handrail + rails in front of the wall end; hall south wall one plane Y5.032/5.092 (V48/V49/V47
 * pieces behind, hosted socket/fan/thermostat moved); VH and KPH door levers mirrored to the photographed side.
 * 614 R8 (owner R7 review 16.11 #7): handrails in the post line (between posts), rails on the stair-side faces, top post
 * west of the untouched 2F low wall/cap (north face Y6.325, lower top), treads notched at the upper posts, full-width risers
 * with riser slots in the side walls (no seam lines), dark niche only vertical + sloped, V46 box inside the wall (no flicker),
 * ceiling cut behind the north wall over the stair, niche floor joint lines. Nodes: hall 12417-12425, KPH lever 12426-12433,
 * jamb 12434, ceiling 12435, stair 12436-12440.
 * 614 R9 (owner R8 review 16.11 #8): handrails on the posts' stair-side faces (lower south, upper north, turn west) full
 * length; 700 opening cut in the wall itself at the casing line X2.82-3.52 (V48/V49 jambs 12332/12333/12135 dropped);
 * one seamless 1F ceiling polygon (no slit/overlap/T-junctions, band underside removed); niche floor joint on the tiles;
 * bulkhead down to the soffit and to Y6.32 (no gap, no dark strip); stairwell north wall 1F/2F seam shares edges.
 * Nodes: hall 12403-12430, ceiling 12431, stair 12432-12436, walls 7221->12437, 10794->12438.
 * Caller supplies SHA256 of the complete original GLB, never an inferred name.
 */
import { C80_608C_GLB_SHA256 } from './privateModelC80608CSourceProfile.mjs';

export const C80_614_GLB_SHA256='588ddf3402ca02747614eeecca0f60c775f3ee35945d119013d315c636e2f47f';
export const C80_614_GLB_BYTES=57343040;
export const C80_614_ZIP_SHA256='d4dbf54daaa36adcedb4618ed551097a52f402dc9a250ec9fccd355ac38e810a';
export const C80_614_ZIP_DRIVE_ID='10x8QTefHPwoYr2Xt7fRf92TcqmuD10Qj';
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
 // Stair east wall line (owner photos 16.11): door wall to X2.444, niche bulkhead fitted.
 // 614 R9: 7221 also carries the 700 opening (X2.82-3.52) and the stairwell north wall top Z2.76; 10794 shares that edge.
 7221:12437, 10794:12438, 9274:12403, 10535:12404, 9250:12408, 9231:12409,
 // 614 R7: hall south wall one plane, hosted items, KPH lever mirrored.
 9375:12416, 9393:12417, 9365:12418, 12130:12419, 12111:12420, 12331:12422,
 9209:12423, 9210:12424, 9211:12425, 9212:12426, 9213:12427, 9214:12428, 9215:12429, 9216:12430,
 // 614 R6: entry boxout 5 cm in front of the door wall; panel/casing/switch, front-door reveals and door +0.094.
 7993:12410, 7999:12411, 7994:12412, 7995:12413, 7996:12414, 9175:12415,
});
// 608C roots that are not carried into the 614 scenes.
export const C80_614_DROPPED_ROOTS=Object.freeze([6419,6420,12044,6497,
 // 614 R5: old stair (1F + duplicate 2F tread sets, risers, side walls, niche soffit, stringer band, railing, top angle)
 9798,10532,10533,10534,10536,10537,10538,10553,10554,
 // 614 R9: separate 700-opening jambs/head (the wall itself now has the opening at the casing line)
 12332,12333,12135]);
// 1F/BOTH addition: the opaque 1F ceiling Z2.43 (R4: stair opening cut exactly).
export const C80_614_ADDED_1F_ROOTS=Object.freeze([12431]);
// 614 R5: the rebuilt stair in every new scene (1F, 2F, BOTH): treads, sides, niche, railing, 2F edge trim.
export const C80_614_ADDED_ALL_ROOTS=Object.freeze([12432,12433,12434,12435,12436]);
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
 12403:Object.freeze({orig:9274,fnv:'6eac80f9',mesh:4666}),
 12404:Object.freeze({orig:10535,fnv:'0ff78903',mesh:4667}),
 12405:Object.freeze({orig:7289,fnv:'6753296a'}),
 12406:Object.freeze({orig:9232,fnv:'aa566e19'}),
 12407:Object.freeze({orig:9233,fnv:'c7e280f4'}),
 12408:Object.freeze({orig:9250,fnv:'f1a1276b'}),
 12409:Object.freeze({orig:9231,fnv:'3fc94471'}),
 12410:Object.freeze({orig:7993,fnv:'a1e65ff0',mesh:4668}),
 12411:Object.freeze({orig:7999,fnv:'02023f14',mesh:4669}),
 12412:Object.freeze({orig:7994,fnv:'1d455217'}),
 12413:Object.freeze({orig:7995,fnv:'fdbef1a7'}),
 12414:Object.freeze({orig:7996,fnv:'5fe2ed41'}),
 12415:Object.freeze({orig:9175,fnv:'80e80376'}),
 12416:Object.freeze({orig:9375,fnv:'1fc4bd0d',mesh:4670}),
 12417:Object.freeze({orig:9393,fnv:'59e27397',mesh:4671}),
 12418:Object.freeze({orig:9365,fnv:'c750ebbc',mesh:4672}),
 12419:Object.freeze({orig:12130,fnv:'7093d61c'}),
 12420:Object.freeze({orig:12111,fnv:'eb28e271'}),
 12421:Object.freeze({orig:6350,fnv:'c3b07140'}),
 12422:Object.freeze({orig:12331,fnv:'dec75dd5'}),
 12423:Object.freeze({orig:9209,fnv:'29307f6f'}),
 12424:Object.freeze({orig:9210,fnv:'2f597af9'}),
 12425:Object.freeze({orig:9211,fnv:'6d7fea2b'}),
 12426:Object.freeze({orig:9212,fnv:'489ea6d3'}),
 12427:Object.freeze({orig:9213,fnv:'eb6e45a6'}),
 12428:Object.freeze({orig:9214,fnv:'90cd566c'}),
 12429:Object.freeze({orig:9215,fnv:'23b088f2'}),
 12430:Object.freeze({orig:9216,fnv:'6bdfebba'}),
 12437:Object.freeze({orig:7221,fnv:'948cec0a',mesh:4679}),
 12438:Object.freeze({orig:10794,fnv:'a1905da7',mesh:4680}),
});
// [glTF scene, parent scene, floorProfile, FNV root hash, parent hash].
const rows=[
 [608,602,'1F','0511b123','6767bb3e'],
 [609,603,'2F','58a42967','8ca9b0d5'],
 [610,604,'BOTH_A','97ac78ba','8001baa9'],
 [611,605,'BOTH_B','f886df10','f17c16e3'],
 [612,606,'BOTH_C','aa7e58c4','1e2e3cc3'],
 [613,607,'BOTH_D','a20a4ddb','14ca1974'],
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
    json.scenes?.length!==614||json.nodes?.length!==12439||json.meshes?.length!==4681||
    json.materials?.length!==758||json.accessors?.length!==10566||json.bufferViews?.length!==10572)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 if(scene?.name!==`C80_614_OWNER_FIXES2_TCOLLECTOR_GHOST_SWITCHES_OUTLET_WC_EXHAUST_FROM_${spec.parent}_${spec.floor}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    new Set(roots).size!==roots.length||
    e?.C80614ParentSceneIndex!==spec.parent||e?.C80614ParentGLBSHA256!==C80_614_PARENT_GLB_SHA256||
    e?.physicalVerified!==false||e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.CURRENT!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.filter(n=>!C80_614_DROPPED_ROOTS.includes(n)).map(n=>C80_614_ROOT_REPLACEMENTS[n]??n)
  .concat(spec.floor==='2F'?[]:C80_614_ADDED_1F_ROOTS).concat(C80_614_ADDED_ALL_ROOTS);
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
