/**
 * C80 620R21 (Claude KANON-NEXT 19.11.2026) = C80 620R20 + four RELEASED High donors made on 620R19 that R20 lacked:
 * G2S06 Themo sensor links, closed WC H24 service hatch, H1911-4 kitchen island AEG oven + Dometic D50 cavities and
 * G2S07 2015 RK board interior +0.094 m X. The K14 root (R20 12557) is merged with the G2S07 clone into 12951 so the
 * R20 T110 VIEMARI nodes 12555/12556 stay. The six 620R20 scenes 674..679 are copied to 680..685 with these edits.
 * All 620R20 data and its BIN prefix are byte-exact. WORK_TEST/HOST_HOLD.
 */
import { c80614Fnv32 } from './privateModelC80614SourceProfile.mjs';
import {
 C80_620R20_GLB_SHA256, C80_620R20_SCENES, C80_620R20_COW_ALIASES, C80_620R20_DUCT_ROOT, C80_620R20_K10_VALVE_ROOT,
 C80_620R20_CLOSET_VALVE_ROOT, C80_620R20_STORE_GRILLE_ROOT, C80_620R20_ELECTRICAL_ROOTS,
} from './privateModelC80620R20SourceProfile.mjs';

export const C80_620R21_GLB_SHA256='0655896b613563f893a806c8e997d199e91640dfc98c14f1fea759e7e3433d4e';
export const C80_620R21_GLB_BYTES=59878620;
export const C80_620R21_ZIP_SHA256='256bcf8f0dbaf2a7f3b7aacdcb57cf97dca8d424f6eef98d01df3191f0dbfd84';
export const C80_620R21_ZIP_DRIVE_ID='13C8IM3I7PXqUSP16khOAKiPGBB4Gf8Cq';
export const C80_620R21_PARENT_GLB_SHA256=C80_620R20_GLB_SHA256;
export const C80_620R21_DUCT_ROOT=C80_620R20_DUCT_ROOT;
export const C80_620R21_K10_VALVE_ROOT=C80_620R20_K10_VALVE_ROOT;
export const C80_620R21_CLOSET_VALVE_ROOT=C80_620R20_CLOSET_VALVE_ROOT;
export const C80_620R21_STORE_GRILLE_ROOT=C80_620R20_STORE_GRILLE_ROOT;
export const C80_620R21_ELECTRICAL_ROOTS=C80_620R20_ELECTRICAL_ROOTS;
// K14 root: R20 12557 + G2S07 clone of all its children; the T-collector n10060 is cloned to 12854.
export const C80_620R21_TCOLLECTOR_ROOT=12951;
export const C80_620R21_TCOLLECTOR_NODE=12854;
export const C80_620R21_ROOT_REPLACEMENTS=Object.freeze({11576:12629,12557:12951,10770:12633,10788:12635,10789:12636,
 10790:12637,10791:12638,10792:12639,12164:12634,12494:12643});
// Opt-in roots appended after R20's: H24 closed hatch (1F/BOTH), AEG oven and Dometic D50 (2F/BOTH).
export const C80_620R21_APPENDED_ROOTS=Object.freeze({'1F':[12632],'2F':[12644,12695],BOTH:[12632,12644,12695]});
// Keyed by the receipt node that is copied; COW nodes keep its receipt identity.
// building:true = H1911-4 island body and drawers: same fixtures with cavity-edited meshes.
const R21_ALIASES={
 10060:['12854',{"orig":10060,"fnv":"98a8a483"}],
 10062:['12855',{"orig":10062,"fnv":"3f13a77f"}],
 10064:['12856',{"orig":10064,"fnv":"49b73e4d"}],
 10066:['12857',{"orig":10066,"fnv":"0a4f991c"}],
 10124:['12858',{"orig":10124,"fnv":"1b639de9"}],
 10126:['12859',{"orig":10126,"fnv":"591fb337"}],
 10130:['12860',{"orig":10130,"fnv":"0c932f52"}],
 10132:['12861',{"orig":10132,"fnv":"cb9ec6d4"}],
 10134:['12862',{"orig":10134,"fnv":"0c269f28"}],
 10136:['12863',{"orig":10136,"fnv":"9abfed53"}],
 10138:['12864',{"orig":10138,"fnv":"c6a0fb91"}],
 10140:['12865',{"orig":10140,"fnv":"60c4983e"}],
 10142:['12866',{"orig":10142,"fnv":"15099e97"}],
 10148:['12868',{"orig":10148,"fnv":"e0c843e3"}],
 10151:['12869',{"orig":10151,"fnv":"a827f88f"}],
 10179:['12871',{"orig":10179,"fnv":"373e7e48","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_6_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10181:['12872',{"orig":10181,"fnv":"2db5ccb3","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_6_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10183:['12873',{"orig":10183,"fnv":"e913b9b9","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10185:['12874',{"orig":10185,"fnv":"c9a78e81","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10187:['12875',{"orig":10187,"fnv":"9bc61a76","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10189:['12876',{"orig":10189,"fnv":"158dc8e8","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10191:['12877',{"orig":10191,"fnv":"14137532","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10193:['12878',{"orig":10193,"fnv":"09a62b14","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10195:['12879',{"orig":10195,"fnv":"ff7f25bd","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10197:['12880',{"orig":10197,"fnv":"3595d9e9","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10199:['12881',{"orig":10199,"fnv":"fdcd2c2d","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10201:['12882',{"orig":10201,"fnv":"82776cf5","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10203:['12883',{"orig":10203,"fnv":"0efa2b67","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10205:['12884',{"orig":10205,"fnv":"165942fd","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10207:['12885',{"orig":10207,"fnv":"e9de82c2","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10209:['12886',{"orig":10209,"fnv":"7f74a312","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10211:['12887',{"orig":10211,"fnv":"308113b8","name":"N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10213:['12888',{"orig":10213,"fnv":"c096f865","name":"N_P185C_X2_BOARD_N_RK_NONRCD_LOWER_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10215:['12889',{"orig":10215,"fnv":"92a9e496","name":"N_P185C_X2_BOARD_N_RK_NONRCD_UPPER_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10217:['12890',{"orig":10217,"fnv":"c2672834","name":"N_P185C_X2_BOARD_N_RK_INTERFACE_ENCLOSURE_ESSV34536_PLAN_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10219:['12891',{"orig":10219,"fnv":"331db156","name":"N_P185C_X2_BOARD_N_RK_FACE_SHEET_ASSUMED_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10221:['12892',{"orig":10221,"fnv":"f3cdd264","name":"N_P185C_X2_BOARD_N_RCD_01_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10223:['12893',{"orig":10223,"fnv":"a5ab0b7f","name":"N_P185C_X2_BOARD_N_RCD_01_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10225:['12894',{"orig":10225,"fnv":"7b42c6c0","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10227:['12895',{"orig":10227,"fnv":"ba9105e3","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10229:['12896',{"orig":10229,"fnv":"410e93c7","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10231:['12897',{"orig":10231,"fnv":"f32aca1a","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10233:['12898',{"orig":10233,"fnv":"3a7c275c","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10235:['12899',{"orig":10235,"fnv":"d20000ad","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10237:['12900',{"orig":10237,"fnv":"b7e1352d","name":"N_P185C_X2_BOARD_N_RCD_02_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10239:['12901',{"orig":10239,"fnv":"e4be69d8","name":"N_P185C_X2_BOARD_N_RCD_02_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10241:['12902',{"orig":10241,"fnv":"c464b8ac","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10243:['12903',{"orig":10243,"fnv":"a4534534","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10245:['12904',{"orig":10245,"fnv":"aea94cd0","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10247:['12905',{"orig":10247,"fnv":"286207ff","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10249:['12906',{"orig":10249,"fnv":"40cd2135","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10251:['12907',{"orig":10251,"fnv":"4d927731","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10253:['12908',{"orig":10253,"fnv":"d779ec40","name":"N_P185C_X2_BOARD_N_RCD_03_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10255:['12909',{"orig":10255,"fnv":"a14eb41a","name":"N_P185C_X2_BOARD_N_RCD_03_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10257:['12910',{"orig":10257,"fnv":"fe5373cc","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10259:['12911',{"orig":10259,"fnv":"bdb99c7c","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10261:['12912',{"orig":10261,"fnv":"2c2458c9","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10263:['12913',{"orig":10263,"fnv":"23a56493","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10265:['12914',{"orig":10265,"fnv":"dd7b70f5","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10267:['12915',{"orig":10267,"fnv":"176f5e9f","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10269:['12916',{"orig":10269,"fnv":"cb02e7e9","name":"N_P185C_X2_BOARD_N_RCD_04_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10271:['12917',{"orig":10271,"fnv":"f579150d","name":"N_P185C_X2_BOARD_N_RCD_04_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10273:['12918',{"orig":10273,"fnv":"e80641fc","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_15_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10275:['12919',{"orig":10275,"fnv":"093561b9","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_15_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10277:['12920',{"orig":10277,"fnv":"d7200a95","name":"N_P185C_X2_BOARD_N_OPEN_CIRCUIT_16_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10279:['12921',{"orig":10279,"fnv":"31cfe246","name":"N_P185C_X2_BOARD_N_OPEN_RCD_01_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10281:['12922',{"orig":10281,"fnv":"dfb1ee0f","name":"N_P185C_X2_BOARD_N_OPEN_RCD_02_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10283:['12923',{"orig":10283,"fnv":"42e1569b","name":"N_P185C_X2_BOARD_N_OPEN_RCD_03_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10285:['12924',{"orig":10285,"fnv":"d84376b7","name":"N_P185C_X2_BOARD_N_OPEN_RCD_04_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"}],
 10310:['12925',{"orig":10310,"fnv":"c2cddfef"}],
 10316:['12926',{"orig":10316,"fnv":"022d3ec0"}],
 10322:['12927',{"orig":10322,"fnv":"e82b7521"}],
 10356:['12928',{"orig":10356,"fnv":"1610017b"}],
 10392:['12929',{"orig":10392,"fnv":"ea82ec14"}],
 10402:['12930',{"orig":10402,"fnv":"eb57ce21"}],
 10404:['12931',{"orig":10404,"fnv":"ee38cf9d"}],
 10406:['12932',{"orig":10406,"fnv":"b1214be5"}],
 10408:['12933',{"orig":10408,"fnv":"987ed0b9"}],
 10410:['12934',{"orig":10410,"fnv":"83d2f428"}],
 10412:['12935',{"orig":10412,"fnv":"f91e257d"}],
 10414:['12936',{"orig":10414,"fnv":"f6956360"}],
 10416:['12937',{"orig":10416,"fnv":"f257a050"}],
 10418:['12938',{"orig":10418,"fnv":"ab64ea39"}],
 10504:['12939',{"orig":10504,"fnv":"eab04ed3"}],
 10506:['12940',{"orig":10506,"fnv":"99d33fc8"}],
 10508:['12941',{"orig":10508,"fnv":"9bc06f5a"}],
 10770:['12633',{"orig":10770,"fnv":"16dda684","mesh":4777,"name":"H1911_4_ISLAND_BODY_TWO_REAL_CAVITIES_WORKTEST","building":true}],
 10788:['12635',{"orig":10788,"fnv":"0ef3b8d5","mesh":4779,"name":"H1911_4_SHRUNK_CENTER_DRAWER_10788","building":true}],
 10789:['12636',{"orig":10789,"fnv":"fa8810f9","mesh":4780,"name":"H1911_4_SHRUNK_CENTER_DRAWER_10789","building":true}],
 10790:['12637',{"orig":10790,"fnv":"18e16030","mesh":4781,"name":"H1911_4_SHRUNK_CENTER_DRAWER_10790","building":true}],
 10791:['12638',{"orig":10791,"fnv":"b0ae273b","mesh":4782,"name":"H1911_4_SHRUNK_CENTER_DRAWER_10791","building":true}],
 10792:['12639',{"orig":10792,"fnv":"3d3013c6","mesh":4783,"name":"H1911_4_SHRUNK_CENTER_DRAWER_10792","building":true}],
 10849:['12641',{"orig":10849,"fnv":"9f87432d","name":"H1911_4_OPTIN_10849_R6_D2F_ISLAND_FRONT_PHOTO_CORRECTION_2024_WORK_TEST_K10_SAVO_SC17_HOOD_HIDDEN_AEG_WORK_TEST_SC0_HOB27_INTEGRATED_COW_HOB32_LIGHT_ISLAND_COW_PATH_V9COW_V9COW_AEG_OWNER_PRINT_COW_2F_20261102_V9COW_V51_WT_ONLY_COW_HOB_RELHEIGHT16_COW_V53_COHERENT_K17_ISLAND_HOB16"}],
 10851:['12640',{"orig":10851,"fnv":"e5bb6aaa","name":"H1911_4_OPTIN_10851_R6_ISLAND_APPLIANCES_WITH_OVEN_LEFT_DOMETIC_RIGHT_SOURCE_WORK_TEST_K10_SAVO_SC17_HOOD_HIDDEN_AEG_WORK_TEST_SC0_HOB27_INTEGRATED_COW_HOB32_LIGHT_ISLAND_COW_PATH_V9COW_V9COW_AEG_OWNER_PRINT_COW_2F_20261102_V9COW_V51_WT_ONLY_COW_HOB_RELHEIGHT16_COW_V53_COHERENT_K17_ISLAND_HOB16"}],
 11320:['12943',{"orig":11320,"fnv":"38bde5ee"}],
 11321:['12944',{"orig":11321,"fnv":"6976c2eb"}],
 11323:['12942',{"orig":11323,"fnv":"2f5a0b91"}],
 11330:['12945',{"orig":11330,"fnv":"68657b0d"}],
 11334:['12947',{"orig":11334,"fnv":"29662a39"}],
 11363:['12949',{"orig":11363,"fnv":"9c24b9f3"}],
 11365:['12950',{"orig":11365,"fnv":"79bb7b93"}],
 11576:['12629',{"orig":11576,"fnv":"08f89c4a"}],
 11577:['12627',{"orig":11577,"fnv":"7c24396b"}],
 11583:['12628',{"orig":11583,"fnv":"4bada58e"}],
 11724:['12948',{"orig":11724,"fnv":"7e238a88"}],
 11726:['12870',{"orig":11726,"fnv":"06dc8ea5"}],
 11728:['12951',{"orig":11728,"fnv":"903c16a2","name":"C80_620R21_K14_ROOT_T110_VIEMARI_PLUS_G2S07_RK_XPLUS94MM_OPTIN_1F_BOTH_ROOT"}],
 12164:['12634',{"orig":12164,"fnv":"063c26bf","mesh":4778,"name":"H1911_4_ISLAND_PLINTH_WINE_FLOOR_CUT_WORKTEST"}],
 12221:['12642',{"orig":12221,"fnv":"7f1407e8","name":"H1911_4_OPTIN_12493_ROOM3_OWNERPHOTO20261114_COW_SCONCE_LAYER"}],
 12222:['12643',{"orig":12222,"fnv":"a8bdd4e1","name":"H1911_4_OPTIN_12494_ROOM3_OWNERPHOTO20261114_COW_2F_ROOT"}]
};
const superseded=new Set(Object.keys(R21_ALIASES).map(Number));
export const C80_620R21_COW_ALIASES=Object.freeze(Object.fromEntries([
 ...Object.entries(C80_620R20_COW_ALIASES).filter(([,a])=>!superseded.has(a.orig)),
 ...Object.values(R21_ALIASES).map(([n,a])=>[n,Object.freeze(a)]),
]));
const rows=[
 [680,674,'1F','82399bd3'],
 [681,675,'2F','8a518e86'],
 [682,676,'BOTH_A','bdc1c165'],
 [683,677,'BOTH_B','714f0817'],
 [684,678,'BOTH_C','6fa8504b'],
 [685,679,'BOTH_D','a56224e9'],
];
const FLOOR_NAME={'1F':'1F','2F':'2F'};
export const C80_620R21_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,profile,rootHash])=>{
  const floor=profile.startsWith('BOTH')?'BOTH':FLOOR_NAME[profile];
  return [scene,Object.freeze({scene,parent,profile,floor,cutaway:profile==='BOTH_D',rootHash,
   parentRootHash:C80_620R20_SCENES[parent].rootHash})];
 })));
const eqList=(a,b)=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function isC80620R21SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R21_SCENES[sceneIndex];
 if(sha!==C80_620R21_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||json?.asset?.extras?.ModelStage!=='WORK_TEST'||
    json.asset.extras.current!==false||json.asset.extras.asBuilt!==false||
    json.asset.extras.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==686||json.nodes?.length!==12952||json.meshes?.length!==4991||
    json.materials?.length!==787||json.accessors?.length!==11053||json.bufferViews?.length!==11059)return false;
 const scene=json.scenes[sceneIndex],parent=json.scenes[spec.parent];
 const roots=scene?.nodes,prior=parent?.nodes,e=scene?.extras;
 const tag=spec.floor==='BOTH'?'BOTH':spec.floor;
 if(scene?.name!==`C80_620R21_R20_PLUS_R19_DONORS_OPTIN_${tag}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||
    !Array.isArray(roots)||!Array.isArray(prior)||
    c80614Fnv32(roots)!==spec.rootHash||c80614Fnv32(prior)!==spec.parentRootHash||
    e?.C80_620R21_donorIntegration20261119!==true||e?.C80_620R21_parentGLBSHA256!==C80_620R21_PARENT_GLB_SHA256||
    e?.C80_620R21_parentScene!==spec.parent||e?.preserve620R20Geometry!==true||
    e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||e?.asBuilt!==false||e?.HOST_HOLD!==true)return false;
 const expected=prior.map(n=>C80_620R21_ROOT_REPLACEMENTS[n]??n);
 expected.push(...C80_620R21_APPENDED_ROOTS[spec.floor]);
 if(!eqList(roots,expected))return false;
 const kids=json.nodes[12951]?.children;
 if(!Array.isArray(kids)||kids.length!==95||!kids.includes(12555)||!kids.includes(12556)||!kids.includes(12854)||
    json.nodes[12854]?.mesh!==json.nodes[10060]?.mesh||json.nodes[12854]?.name!==json.nodes[10060]?.name||
    json.nodes[12629]?.children?.join()!=='12627,11580,12628'||json.nodes[12632]?.children?.join()!=='12630,12631'||
    json.nodes[12643]?.children?.join()!=='12642')return false;
 if(spec.floor!=='2F'&&roots.filter(n=>n===C80_620R21_K10_VALVE_ROOT).length!==1)return false;
 return true;
}
