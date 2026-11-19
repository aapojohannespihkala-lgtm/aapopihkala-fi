/** R21 owner review K1/K2/K6/K7/K9 only. Append-only WORK_TEST/HOST_HOLD. */
import {c80614Fnv32} from './privateModelC80614SourceProfile.mjs';
import {C80_620R21_GLB_SHA256,C80_620R21_DUCT_ROOT,C80_620R21_K10_VALVE_ROOT,C80_620R21_CLOSET_VALVE_ROOT,C80_620R21_STORE_GRILLE_ROOT,C80_620R21_ELECTRICAL_ROOTS} from './privateModelC80620R21SourceProfile.mjs';
export const C80_620R22_GLB_SHA256='9f4897cffd9316367e9d829fc0be14299ad3dc2836d2642f02638beeb584cc33';
export const C80_620R22_GLB_BYTES=60657872;
export const C80_620R22_ZIP_DRIVE_ID='1w0PMZTtRu6rH76LTP5bNZLR2V45Dhc37';
export const C80_620R22_ZIP_SHA256='b62dc039cb90b4b42e74aebc7dadd702339284d8d7dd625bec21445a71a68213';
export const C80_620R22_PARENT_GLB_SHA256=C80_620R21_GLB_SHA256;
export const C80_620R22_DUCT_ROOT=C80_620R21_DUCT_ROOT;
export const C80_620R22_K10_VALVE_ROOT=C80_620R21_K10_VALVE_ROOT;
export const C80_620R22_CLOSET_VALVE_ROOT=C80_620R21_CLOSET_VALVE_ROOT;
export const C80_620R22_STORE_GRILLE_ROOT=C80_620R21_STORE_GRILLE_ROOT;
export const C80_620R22_ELECTRICAL_ROOTS=C80_620R21_ELECTRICAL_ROOTS;
export const C80_620R22_TCOLLECTOR_ROOT=12952;
export const C80_620R22_TCOLLECTOR_NODE=12953;
export const C80_620R22_BACK_MAP=Object.freeze({
 "12952": 12951,
 "12953": 12854,
 "12954": 12855,
 "12955": 12856,
 "12956": 12857,
 "12957": 12858,
 "12958": 12859,
 "12959": 12860,
 "12960": 12861,
 "12961": 12862,
 "12962": 12863,
 "12963": 12864,
 "12964": 12865,
 "12965": 12866,
 "12966": 12555,
 "12967": 12868,
 "12968": 12869,
 "12969": 12870,
 "12970": 12871,
 "12971": 12872,
 "12972": 12873,
 "12973": 12874,
 "12974": 12875,
 "12975": 12876,
 "12976": 12877,
 "12977": 12878,
 "12978": 12879,
 "12979": 12880,
 "12980": 12881,
 "12981": 12882,
 "12982": 12883,
 "12983": 12884,
 "12984": 12885,
 "12985": 12886,
 "12986": 12887,
 "12987": 12888,
 "12988": 12889,
 "12989": 12890,
 "12990": 12891,
 "12991": 12892,
 "12992": 12893,
 "12993": 12894,
 "12994": 12895,
 "12995": 12896,
 "12996": 12897,
 "12997": 12898,
 "12998": 12899,
 "12999": 12900,
 "13000": 12901,
 "13001": 12902,
 "13002": 12903,
 "13003": 12904,
 "13004": 12905,
 "13005": 12906,
 "13006": 12907,
 "13007": 12908,
 "13008": 12909,
 "13009": 12910,
 "13010": 12911,
 "13011": 12912,
 "13012": 12913,
 "13013": 12914,
 "13014": 12915,
 "13015": 12916,
 "13016": 12917,
 "13017": 12918,
 "13018": 12919,
 "13019": 12920,
 "13020": 12921,
 "13021": 12922,
 "13022": 12923,
 "13023": 12924,
 "13024": 12925,
 "13025": 12926,
 "13026": 12927,
 "13027": 12928,
 "13028": 12929,
 "13029": 12930,
 "13030": 12931,
 "13031": 12932,
 "13032": 12933,
 "13033": 12934,
 "13034": 12935,
 "13035": 12936,
 "13036": 12937,
 "13037": 12938,
 "13038": 12939,
 "13039": 12940,
 "13040": 12941,
 "13041": 12942,
 "13042": 12943,
 "13043": 12944,
 "13044": 12945,
 "13045": 12556,
 "13046": 12947,
 "13047": 12948,
 "13048": 12949,
 "13049": 12950,
 "13050": 12644,
 "13051": 12645,
 "13052": 12646,
 "13053": 12647,
 "13054": 12648,
 "13055": 12649,
 "13056": 12650,
 "13057": 12651,
 "13058": 12652,
 "13059": 12653,
 "13060": 12654,
 "13061": 12655,
 "13062": 12656,
 "13063": 12657,
 "13064": 12658,
 "13065": 12659,
 "13066": 12660,
 "13067": 12661,
 "13068": 12662,
 "13069": 12663,
 "13070": 12664,
 "13071": 12665,
 "13072": 12666,
 "13073": 12667,
 "13074": 12668,
 "13075": 12669,
 "13076": 12670,
 "13077": 12671,
 "13078": 12672,
 "13079": 12673,
 "13080": 12674,
 "13081": 12675,
 "13082": 12676,
 "13083": 12677,
 "13084": 12678,
 "13085": 12679,
 "13086": 12680,
 "13087": 12681,
 "13088": 12682,
 "13089": 12683,
 "13090": 12684,
 "13091": 12685,
 "13092": 12686,
 "13093": 12687,
 "13094": 12688,
 "13095": 12689,
 "13096": 12690,
 "13097": 12691,
 "13098": 12692,
 "13099": 12693,
 "13100": 12694,
 "13101": 9480,
 "13102": 9481,
 "13103": 9482,
 "13104": 9483,
 "13105": 9484,
 "13106": 9485,
 "13107": 9486,
 "13108": 9487,
 "13109": 9488,
 "13110": 9489,
 "13111": 9490,
 "13112": 9491,
 "13113": 9492,
 "13114": 9493,
 "13115": 9494,
 "13116": 9495,
 "13117": 9496,
 "13118": 9497,
 "13119": 9498,
 "13120": 9499,
 "13121": 9500,
 "13122": 9501,
 "13123": 9502,
 "13124": 9503,
 "13125": 9504,
 "13126": 9505,
 "13127": 9506,
 "13128": 9507,
 "13129": 9508,
 "13130": 9509,
 "13131": 9510,
 "13132": 9511,
 "13133": 9512,
 "13134": 9513,
 "13135": 9514,
 "13136": 9515,
 "13137": 9516,
 "13138": 12563,
 "13139": 12562,
 "13140": 12559,
 "13141": 10951,
 "13142": 10950,
 "13143": 10953,
 "13144": 10954,
 "13145": 10955,
 "13146": 10957,
 "13147": 10959,
 "13148": 10960,
 "13149": 10961,
 "13150": 10963,
 "13151": 10965,
 "13152": 10966,
 "13153": 10967,
 "13154": 10969,
 "13155": 10971,
 "13156": 10972,
 "13157": 10973,
 "13161": 6377,
 "13162": 6629,
 "13163": 7645,
 "13164": 6433,
 "13165": 5880,
 "13166": 7646
});
export const C80_620R22_ROOT_REPLACEMENTS=Object.freeze({
 "5880": 13165,
 "6377": 13161,
 "6433": 13164,
 "7646": 13166,
 "9516": 13137,
 "10951": 13141,
 "12559": 13140,
 "12644": 13050,
 "12951": 12952
});
export const C80_620R22_APPENDED_ROOTS=Object.freeze({'1F':[],'2F':[],BOTH:[]});
export const C80_620R22_COUNTS=Object.freeze({
 "nodes": 13167,
 "meshes": 5085,
 "materials": 803,
 "accessors": 11071,
 "bufferViews": 11077,
 "textures": 6,
 "images": 6,
 "samplers": 4,
 "skins": 0,
 "cameras": 0,
 "animations": 0,
 "scenes": 692
});
export const C80_620R22_COW_ALIASES=Object.freeze(Object.fromEntries(Object.entries({
 "12348": {
  "orig": 11766,
  "fnv": "4c7c14b0"
 },
 "12350": {
  "orig": 11776,
  "fnv": "17f66a82"
 },
 "12355": {
  "orig": 11842,
  "fnv": "102c2d73"
 },
 "12390": {
  "orig": 11769,
  "fnv": "736115fb"
 },
 "12392": {
  "orig": 10895,
  "fnv": "94007e45"
 },
 "12393": {
  "orig": 10898,
  "fnv": "ef7dbea4"
 },
 "12394": {
  "orig": 10896,
  "fnv": "8b80ffe7"
 },
 "12397": {
  "orig": 11714,
  "fnv": "2874c4c1"
 },
 "12401": {
  "orig": 11729,
  "fnv": "fd75eaba"
 },
 "12403": {
  "orig": 9274,
  "fnv": "6eac80f9",
  "mesh": 4666
 },
 "12404": {
  "orig": 10535,
  "fnv": "0ff78903",
  "mesh": 4667
 },
 "12405": {
  "orig": 7289,
  "fnv": "6753296a"
 },
 "12406": {
  "orig": 9232,
  "fnv": "aa566e19"
 },
 "12407": {
  "orig": 9233,
  "fnv": "c7e280f4"
 },
 "12408": {
  "orig": 9250,
  "fnv": "f1a1276b"
 },
 "12409": {
  "orig": 9231,
  "fnv": "3fc94471"
 },
 "12410": {
  "orig": 7993,
  "fnv": "a1e65ff0",
  "mesh": 4668
 },
 "12411": {
  "orig": 7999,
  "fnv": "02023f14",
  "mesh": 4669
 },
 "12412": {
  "orig": 7994,
  "fnv": "1d455217"
 },
 "12413": {
  "orig": 7995,
  "fnv": "fdbef1a7"
 },
 "12414": {
  "orig": 7996,
  "fnv": "5fe2ed41"
 },
 "12415": {
  "orig": 9175,
  "fnv": "80e80376"
 },
 "12416": {
  "orig": 9375,
  "fnv": "1fc4bd0d",
  "mesh": 4670
 },
 "12417": {
  "orig": 9393,
  "fnv": "59e27397",
  "mesh": 4671
 },
 "12418": {
  "orig": 12130,
  "fnv": "7093d61c"
 },
 "12419": {
  "orig": 12111,
  "fnv": "eb28e271"
 },
 "12420": {
  "orig": 6350,
  "fnv": "c3b07140"
 },
 "12421": {
  "orig": 12331,
  "fnv": "e8d3dc46"
 },
 "12422": {
  "orig": 9209,
  "fnv": "29307f6f"
 },
 "12423": {
  "orig": 9210,
  "fnv": "2f597af9"
 },
 "12424": {
  "orig": 9211,
  "fnv": "6d7fea2b"
 },
 "12425": {
  "orig": 9212,
  "fnv": "489ea6d3"
 },
 "12426": {
  "orig": 9213,
  "fnv": "eb6e45a6"
 },
 "12427": {
  "orig": 9214,
  "fnv": "90cd566c"
 },
 "12428": {
  "orig": 9215,
  "fnv": "23b088f2"
 },
 "12429": {
  "orig": 9216,
  "fnv": "6bdfebba"
 },
 "12436": {
  "orig": 7221,
  "fnv": "aaff3018",
  "mesh": 4678
 },
 "12437": {
  "orig": 10794,
  "fnv": "8e1ca8d7",
  "mesh": 4679
 },
 "12438": {
  "orig": 9365,
  "fnv": "499e900d",
  "mesh": 4680
 },
 "12439": {
  "orig": 6376,
  "fnv": "bf17a8cf",
  "mesh": 4681
 },
 "12440": {
  "orig": 6432,
  "fnv": "af36b3aa",
  "mesh": 4682
 },
 "12446": {
  "orig": 11626,
  "fnv": "ecb2c663"
 },
 "12447": {
  "orig": 11627,
  "fnv": "3e2c170e"
 },
 "12448": {
  "orig": 11628,
  "fnv": "3a6c6c6a"
 },
 "12449": {
  "orig": 11629,
  "fnv": "ac53f0bf"
 },
 "12450": {
  "orig": 11630,
  "fnv": "f6e7425c"
 },
 "12451": {
  "orig": 11631,
  "fnv": "4e50f7ec"
 },
 "12452": {
  "orig": 11632,
  "fnv": "07749e9f"
 },
 "12453": {
  "orig": 11633,
  "fnv": "4e765499"
 },
 "12454": {
  "orig": 11634,
  "fnv": "c649cc84"
 },
 "12455": {
  "orig": 11635,
  "fnv": "eaf58bc9"
 },
 "12456": {
  "orig": 11636,
  "fnv": "f833c379"
 },
 "12457": {
  "orig": 11637,
  "fnv": "798af814"
 },
 "12458": {
  "orig": 11638,
  "fnv": "25e289f9"
 },
 "12459": {
  "orig": 11639,
  "fnv": "5ee78347"
 },
 "12460": {
  "orig": 11640,
  "fnv": "3861326e"
 },
 "12461": {
  "orig": 11641,
  "fnv": "38b8e9f7"
 },
 "12466": {
  "orig": 11642,
  "fnv": "4f233a5b"
 },
 "12485": {
  "orig": 12329,
  "fnv": "632cb46c",
  "name": "C80_620R11_K13_KPH_CONTROLS_COW_ROOT_ENCLOSURE_SPLIT_T10060_PRESERVED"
 },
 "12486": {
  "orig": 12096,
  "fnv": "9425daa0",
  "mesh": 4690,
  "name": "C80_620R13_K10_STORE_EXHAUST_DUCT_FLUSH_AT_FACADE_COW_WORK_TEST"
 },
 "12491": {
  "orig": 12219,
  "fnv": "60f4dfb2"
 },
 "12492": {
  "orig": 12220,
  "fnv": "1a871b17"
 },
 "12499": {
  "orig": 11316,
  "fnv": "96df8c72",
  "mesh": 4698
 },
 "12500": {
  "orig": 10122,
  "fnv": "bb8f367b",
  "mesh": 4699,
  "name": "C80_620R15_D2F_WC_EXHAUST_D125_SIMPLE_TRUNK_AND_CEILING_VALVE_BRANCH_WORK_TEST"
 },
 "12501": {
  "orig": 11714,
  "fnv": "92af8586"
 },
 "12502": {
  "orig": 11729,
  "fnv": "6d4b37f5"
 },
 "12506": {
  "orig": 11754,
  "fnv": "9e7fd687"
 },
 "12507": {
  "orig": 11740,
  "fnv": "6b7f6087",
  "mesh": 4703,
  "name": "C80_620R15_1F-PR-10_SOCKET_ON_BATHROOM_FACE_OF_PARTITION_X3888_WORK_TEST"
 },
 "12508": {
  "orig": 11741,
  "fnv": "0609e8f4",
  "mesh": 4704,
  "name": "C80_620R15_1F-PR-11_SOCKET_ON_BATHROOM_FACE_OF_PARTITION_X3888_WORK_TEST"
 },
 "12509": {
  "orig": 11743,
  "fnv": "1ed325c2",
  "mesh": 4705,
  "name": "C80_620R15_1F-PR-14_SOCKET_ON_WEST_WALL_X0220_WORK_TEST"
 },
 "12510": {
  "orig": 11739,
  "fnv": "5619a194"
 },
 "12512": {
  "orig": 12161,
  "fnv": "4b2bc58d",
  "mesh": 4707
 },
 "12513": {
  "orig": 12162,
  "fnv": "b7a86b5d"
 },
 "12514": {
  "orig": 12153,
  "fnv": "5663b2ab"
 },
 "12515": {
  "orig": 12163,
  "fnv": "51c11295"
 },
 "12517": {
  "orig": 10122,
  "fnv": "9dab18c8",
  "mesh": 4709,
  "name": "C80_620R16_D2F_WC_EXHAUST_D125_TWO_VALVES_ONE_DUCT_WORK_TEST"
 },
 "12518": {
  "orig": 11714,
  "fnv": "9eb6c237"
 },
 "12519": {
  "orig": 11729,
  "fnv": "84768d9f"
 },
 "12522": {
  "orig": 11918,
  "fnv": "f6e4062d"
 },
 "12523": {
  "orig": 11924,
  "fnv": "51078431"
 },
 "12524": {
  "orig": 11930,
  "fnv": "c3905ddb"
 },
 "12525": {
  "orig": 11936,
  "fnv": "856d8833"
 },
 "12526": {
  "orig": 11942,
  "fnv": "02841e91"
 },
 "12527": {
  "orig": 12278,
  "fnv": "d6632308"
 },
 "12528": {
  "orig": 12279,
  "fnv": "d7c3e3be"
 },
 "12529": {
  "orig": 12298,
  "fnv": "64439d7c"
 },
 "12530": {
  "orig": 1708,
  "fnv": "08a0f5af"
 },
 "12531": {
  "orig": 1709,
  "fnv": "15edbdfa"
 },
 "12532": {
  "orig": 1710,
  "fnv": "d035f41a"
 },
 "12533": {
  "orig": 1711,
  "fnv": "1f36fe41"
 },
 "12534": {
  "orig": 12329,
  "fnv": "50df9e36",
  "name": "C80_620R11_K13_KPH_CONTROLS_COW_ROOT_ENCLOSURE_SPLIT_T10060_PRESERVED"
 },
 "12542": {
  "orig": 12158,
  "fnv": "8b1a559b",
  "mesh": 4707,
  "name": "C80_620R17_PA2_1F_HOT_RISER_IN_WALL_COW_WORK_TEST_HOST_HOLD"
 },
 "12543": {
  "orig": 12159,
  "fnv": "595f036e",
  "name": "MJ64_REHOST__P02_1F_LV_KYTKENNAT_WORK_TEST_PA2_WC385_INTEGRATION_COW_PA2_ENDPOINT_REHOST_20261114_COW_HOT_COLD_CLEARANCE_428_COW_R17_1F_HOT_WALL_COW"
 },
 "12544": {
  "orig": 12160,
  "fnv": "c05c667c",
  "name": "MJ64_REHOST__P02_1F_KV_LV_CONNECTIONS_WORK_TEST_ROOT_PA2_WC385_INTEGRATION_COW_PA2_ENDPOINT_REHOST_20261114_COW_HOT_COLD_CLEARANCE_428_COW_R17_1F_HOT_WALL_COW"
 },
 "12615": {
  "orig": 11605,
  "fnv": "c7cff427",
  "name": "MJ04_2026_OWNER_S2_SAUNA_SIDE_OPEN_A_INLET_STUB_WORK_TEST_HOST_HOLD"
 },
 "12616": {
  "orig": 11606,
  "fnv": "3ffd511e",
  "name": "MJ04_2026_OWNER_S2_SAUNA_SIDE_OPEN_B_INLET_STUB_WORK_TEST_HOST_HOLD"
 },
 "12617": {
  "orig": 11607,
  "fnv": "046d5a37",
  "name": "MJ04_2026_OWNER_S1_GLASS_SIDE_OVERHEAD_AS9000_A_INLET_STUB_WORK_TEST_HOST_HOLD"
 },
 "12618": {
  "orig": 11608,
  "fnv": "18883ebc",
  "name": "MJ04_2026_OWNER_S1_GLASS_SIDE_OVERHEAD_AS9000_B_INLET_STUB_WORK_TEST_HOST_HOLD"
 },
 "12619": {
  "orig": 11609,
  "fnv": "cb6cd351",
  "name": "MJ04_OWNER2026_S1_GLASS_AS9000_S2_SAUNA_INLET_STUBS_COW_ROOT"
 },
 "12621": {
  "orig": 2220,
  "fnv": "751453cb",
  "name": "D1F_S1_GLASS_SIDE_SHOWER_CROMA_AS9000_R4_WORK_TEST_HOST_HOLD_ROOT"
 },
 "12622": {
  "orig": 12048,
  "fnv": "a41f04a4",
  "name": "SAVO_I7603_ISASC505_INSTALLED_HOOD_ROOT_WORK_TEST"
 },
 "12623": {
  "orig": 12053,
  "fnv": "d9786b9a",
  "mesh": 4771,
  "name": "SAVO_I7603_WHITE_LOWER_SHELL_560MM_VISUAL_PROXY_WORK_TEST"
 },
 "12624": {
  "orig": 12054,
  "fnv": "b63d1cc4",
  "mesh": 4772,
  "name": "SAVO_I7603_WHITE_UPPER_SHELL_315MM_HEIGHT_ASSUMED_WORK_TEST"
 },
 "12625": {
  "orig": 12055,
  "fnv": "aae0e2ce",
  "mesh": 4773,
  "name": "SAVO_I7603_VISIBLE_HORIZONTAL_BODY_JOIN_VISUAL_PROXY_WORK_TEST"
 },
 "12626": {
  "orig": 12056,
  "fnv": "ca07d46f",
  "mesh": 4774,
  "name": "SAVO_I7603_CEILING_FLUSH_JUNCTION_VISUAL_PROXY_WORK_TEST"
 },
 "12627": {
  "orig": 11577,
  "fnv": "7c24396b"
 },
 "12628": {
  "orig": 11583,
  "fnv": "4bada58e"
 },
 "12629": {
  "orig": 11576,
  "fnv": "08f89c4a"
 },
 "12633": {
  "orig": 10770,
  "fnv": "16dda684",
  "mesh": 4777,
  "name": "H1911_4_ISLAND_BODY_TWO_REAL_CAVITIES_WORKTEST",
  "building": true
 },
 "12634": {
  "orig": 12164,
  "fnv": "063c26bf",
  "mesh": 4778,
  "name": "H1911_4_ISLAND_PLINTH_WINE_FLOOR_CUT_WORKTEST"
 },
 "12635": {
  "orig": 10788,
  "fnv": "0ef3b8d5",
  "mesh": 4779,
  "name": "H1911_4_SHRUNK_CENTER_DRAWER_10788",
  "building": true
 },
 "12636": {
  "orig": 10789,
  "fnv": "fa8810f9",
  "mesh": 4780,
  "name": "H1911_4_SHRUNK_CENTER_DRAWER_10789",
  "building": true
 },
 "12637": {
  "orig": 10790,
  "fnv": "18e16030",
  "mesh": 4781,
  "name": "H1911_4_SHRUNK_CENTER_DRAWER_10790",
  "building": true
 },
 "12638": {
  "orig": 10791,
  "fnv": "b0ae273b",
  "mesh": 4782,
  "name": "H1911_4_SHRUNK_CENTER_DRAWER_10791",
  "building": true
 },
 "12639": {
  "orig": 10792,
  "fnv": "3d3013c6",
  "mesh": 4783,
  "name": "H1911_4_SHRUNK_CENTER_DRAWER_10792",
  "building": true
 },
 "12640": {
  "orig": 10851,
  "fnv": "e5bb6aaa",
  "name": "H1911_4_OPTIN_10851_R6_ISLAND_APPLIANCES_WITH_OVEN_LEFT_DOMETIC_RIGHT_SOURCE_WORK_TEST_K10_SAVO_SC17_HOOD_HIDDEN_AEG_WORK_TEST_SC0_HOB27_INTEGRATED_COW_HOB32_LIGHT_ISLAND_COW_PATH_V9COW_V9COW_AEG_OWNER_PRINT_COW_2F_20261102_V9COW_V51_WT_ONLY_COW_HOB_RELHEIGHT16_COW_V53_COHERENT_K17_ISLAND_HOB16"
 },
 "12641": {
  "orig": 10849,
  "fnv": "9f87432d",
  "name": "H1911_4_OPTIN_10849_R6_D2F_ISLAND_FRONT_PHOTO_CORRECTION_2024_WORK_TEST_K10_SAVO_SC17_HOOD_HIDDEN_AEG_WORK_TEST_SC0_HOB27_INTEGRATED_COW_HOB32_LIGHT_ISLAND_COW_PATH_V9COW_V9COW_AEG_OWNER_PRINT_COW_2F_20261102_V9COW_V51_WT_ONLY_COW_HOB_RELHEIGHT16_COW_V53_COHERENT_K17_ISLAND_HOB16"
 },
 "12642": {
  "orig": 12221,
  "fnv": "7f1407e8",
  "name": "H1911_4_OPTIN_12493_ROOM3_OWNERPHOTO20261114_COW_SCONCE_LAYER"
 },
 "12643": {
  "orig": 12222,
  "fnv": "a8bdd4e1",
  "name": "H1911_4_OPTIN_12494_ROOM3_OWNERPHOTO20261114_COW_2F_ROOT"
 },
 "12952": {
  "orig": 11728,
  "fnv": "c8535c83",
  "name": "C80_620R21_K14_ROOT_T110_VIEMARI_PLUS_G2S07_RK_XPLUS94MM_OPTIN_1F_BOTH_ROOT_K1_EASTWALL_COW_ROOT"
 },
 "12953": {
  "orig": 10060,
  "fnv": "98a8a483",
  "mesh": 3788
 },
 "12954": {
  "orig": 10062,
  "fnv": "3f13a77f",
  "mesh": 3660
 },
 "12955": {
  "orig": 10064,
  "fnv": "49b73e4d",
  "mesh": 3661
 },
 "12956": {
  "orig": 10066,
  "fnv": "0a4f991c",
  "mesh": 3662
 },
 "12957": {
  "orig": 10124,
  "fnv": "1b639de9",
  "mesh": 3691
 },
 "12958": {
  "orig": 10126,
  "fnv": "591fb337",
  "mesh": 3692
 },
 "12959": {
  "orig": 10130,
  "fnv": "0c932f52",
  "mesh": 3694
 },
 "12960": {
  "orig": 10132,
  "fnv": "cb9ec6d4",
  "mesh": 3695
 },
 "12961": {
  "orig": 10134,
  "fnv": "0c269f28",
  "mesh": 3696
 },
 "12962": {
  "orig": 10136,
  "fnv": "9abfed53",
  "mesh": 3697
 },
 "12963": {
  "orig": 10138,
  "fnv": "c6a0fb91",
  "mesh": 3698
 },
 "12964": {
  "orig": 10140,
  "fnv": "60c4983e",
  "mesh": 3699
 },
 "12965": {
  "orig": 10142,
  "fnv": "7e7f4a85",
  "mesh": 4991,
  "name": "M5_WW2015_D2F_C80_WC1_SOURCE_EXACT_WC1_V75_HOSTX_EXISTING_MESH5_INSTANCE_K1_CLIPPED_INBOARD_WORK_TEST"
 },
 "12966": {
  "orig": 10145,
  "fnv": "9f3cd5b1",
  "mesh": 3701,
  "name": "M5_WW2015_D2F_C80_WC1_SOURCE_EXACT_T110_VENT_HOSTX_EXISTING_DONOR_GEOMETRY_VIEMARI_SEMANTIC_REVIEW_OPTIN"
 },
 "12967": {
  "orig": 10148,
  "fnv": "e0c843e3",
  "mesh": 3702
 },
 "12968": {
  "orig": 10151,
  "fnv": "a827f88f",
  "mesh": 3703
 },
 "12969": {
  "orig": 11726,
  "fnv": "06dc8ea5",
  "mesh": 3708
 },
 "12970": {
  "orig": 10179,
  "fnv": "373e7e48",
  "mesh": 3712,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_6_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12971": {
  "orig": 10181,
  "fnv": "2db5ccb3",
  "mesh": 3713,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_6_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12972": {
  "orig": 10183,
  "fnv": "e913b9b9",
  "mesh": 3714,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12973": {
  "orig": 10185,
  "fnv": "c9a78e81",
  "mesh": 3715,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12974": {
  "orig": 10187,
  "fnv": "9bc61a76",
  "mesh": 3716,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_5_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12975": {
  "orig": 10189,
  "fnv": "158dc8e8",
  "mesh": 3717,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12976": {
  "orig": 10191,
  "fnv": "14137532",
  "mesh": 3718,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12977": {
  "orig": 10193,
  "fnv": "09a62b14",
  "mesh": 3719,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_4_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12978": {
  "orig": 10195,
  "fnv": "ff7f25bd",
  "mesh": 3720,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12979": {
  "orig": 10197,
  "fnv": "3595d9e9",
  "mesh": 3721,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12980": {
  "orig": 10199,
  "fnv": "fdcd2c2d",
  "mesh": 3722,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_3_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12981": {
  "orig": 10201,
  "fnv": "82776cf5",
  "mesh": 3723,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12982": {
  "orig": 10203,
  "fnv": "0efa2b67",
  "mesh": 3724,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12983": {
  "orig": 10205,
  "fnv": "165942fd",
  "mesh": 3725,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_2_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12984": {
  "orig": 10207,
  "fnv": "e9de82c2",
  "mesh": 3726,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12985": {
  "orig": 10209,
  "fnv": "7f74a312",
  "mesh": 3727,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12986": {
  "orig": 10211,
  "fnv": "308113b8",
  "mesh": 3728,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_OPEN_CIRCUIT_1_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12987": {
  "orig": 10213,
  "fnv": "c096f865",
  "mesh": 3729,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_LOWER_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12988": {
  "orig": 10215,
  "fnv": "92a9e496",
  "mesh": 3730,
  "name": "N_P185C_X2_BOARD_N_RK_NONRCD_UPPER_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12989": {
  "orig": 10217,
  "fnv": "c2672834",
  "mesh": 3731,
  "name": "N_P185C_X2_BOARD_N_RK_INTERFACE_ENCLOSURE_ESSV34536_PLAN_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12990": {
  "orig": 10219,
  "fnv": "331db156",
  "mesh": 3732,
  "name": "N_P185C_X2_BOARD_N_RK_FACE_SHEET_ASSUMED_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12991": {
  "orig": 10221,
  "fnv": "f3cdd264",
  "mesh": 3733,
  "name": "N_P185C_X2_BOARD_N_RCD_01_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12992": {
  "orig": 10223,
  "fnv": "a5ab0b7f",
  "mesh": 3734,
  "name": "N_P185C_X2_BOARD_N_RCD_01_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12993": {
  "orig": 10225,
  "fnv": "7b42c6c0",
  "mesh": 3735,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12994": {
  "orig": 10227,
  "fnv": "ba9105e3",
  "mesh": 3736,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12995": {
  "orig": 10229,
  "fnv": "410e93c7",
  "mesh": 3737,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12996": {
  "orig": 10231,
  "fnv": "f32aca1a",
  "mesh": 3738,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12997": {
  "orig": 10233,
  "fnv": "3a7c275c",
  "mesh": 3739,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12998": {
  "orig": 10235,
  "fnv": "d20000ad",
  "mesh": 3740,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_10_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "12999": {
  "orig": 10237,
  "fnv": "b7e1352d",
  "mesh": 3741,
  "name": "N_P185C_X2_BOARD_N_RCD_02_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13000": {
  "orig": 10239,
  "fnv": "e4be69d8",
  "mesh": 3742,
  "name": "N_P185C_X2_BOARD_N_RCD_02_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13001": {
  "orig": 10241,
  "fnv": "c464b8ac",
  "mesh": 3743,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13002": {
  "orig": 10243,
  "fnv": "a4534534",
  "mesh": 3744,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13003": {
  "orig": 10245,
  "fnv": "aea94cd0",
  "mesh": 3745,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_11_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13004": {
  "orig": 10247,
  "fnv": "286207ff",
  "mesh": 3746,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13005": {
  "orig": 10249,
  "fnv": "40cd2135",
  "mesh": 3747,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13006": {
  "orig": 10251,
  "fnv": "4d927731",
  "mesh": 3748,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_12_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13007": {
  "orig": 10253,
  "fnv": "d779ec40",
  "mesh": 3749,
  "name": "N_P185C_X2_BOARD_N_RCD_03_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13008": {
  "orig": 10255,
  "fnv": "a14eb41a",
  "mesh": 3750,
  "name": "N_P185C_X2_BOARD_N_RCD_03_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13009": {
  "orig": 10257,
  "fnv": "fe5373cc",
  "mesh": 3751,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13010": {
  "orig": 10259,
  "fnv": "bdb99c7c",
  "mesh": 3752,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13011": {
  "orig": 10261,
  "fnv": "2c2458c9",
  "mesh": 3753,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_13_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13012": {
  "orig": 10263,
  "fnv": "23a56493",
  "mesh": 3754,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13013": {
  "orig": 10265,
  "fnv": "dd7b70f5",
  "mesh": 3755,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13014": {
  "orig": 10267,
  "fnv": "176f5e9f",
  "mesh": 3756,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_14_3_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13015": {
  "orig": 10269,
  "fnv": "cb02e7e9",
  "mesh": 3757,
  "name": "N_P185C_X2_BOARD_N_RCD_04_MODULE_WORKTEST_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13016": {
  "orig": 10271,
  "fnv": "f579150d",
  "mesh": 3758,
  "name": "N_P185C_X2_BOARD_N_RCD_04_GROUP_RAIL_NOT_CONDUCTOR_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13017": {
  "orig": 10273,
  "fnv": "e80641fc",
  "mesh": 3759,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_15_1_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13018": {
  "orig": 10275,
  "fnv": "093561b9",
  "mesh": 3760,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_15_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13019": {
  "orig": 10277,
  "fnv": "d7200a95",
  "mesh": 3761,
  "name": "N_P185C_X2_BOARD_N_OPEN_CIRCUIT_16_2_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13020": {
  "orig": 10279,
  "fnv": "31cfe246",
  "mesh": 3762,
  "name": "N_P185C_X2_BOARD_N_OPEN_RCD_01_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13021": {
  "orig": 10281,
  "fnv": "dfb1ee0f",
  "mesh": 3763,
  "name": "N_P185C_X2_BOARD_N_OPEN_RCD_02_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13022": {
  "orig": 10283,
  "fnv": "42e1569b",
  "mesh": 3764,
  "name": "N_P185C_X2_BOARD_N_OPEN_RCD_03_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13023": {
  "orig": 10285,
  "fnv": "d84376b7",
  "mesh": 3765,
  "name": "N_P185C_X2_BOARD_N_OPEN_RCD_04_INPUT_R19_OWNER_PANEL_XPLUS94MM_OPTIN"
 },
 "13024": {
  "orig": 10310,
  "fnv": "c2cddfef",
  "mesh": 3766
 },
 "13025": {
  "orig": 10316,
  "fnv": "022d3ec0",
  "mesh": 3768
 },
 "13026": {
  "orig": 10322,
  "fnv": "e82b7521",
  "mesh": 3770
 },
 "13027": {
  "orig": 10356,
  "fnv": "1610017b",
  "mesh": 3772
 },
 "13028": {
  "orig": 10392,
  "fnv": "ea82ec14",
  "mesh": 3774
 },
 "13029": {
  "orig": 10402,
  "fnv": "eb57ce21",
  "mesh": 3778
 },
 "13030": {
  "orig": 10404,
  "fnv": "ee38cf9d",
  "mesh": 3779
 },
 "13031": {
  "orig": 10406,
  "fnv": "b1214be5",
  "mesh": 3780
 },
 "13032": {
  "orig": 10408,
  "fnv": "987ed0b9",
  "mesh": 3781
 },
 "13033": {
  "orig": 10410,
  "fnv": "83d2f428",
  "mesh": 3782
 },
 "13034": {
  "orig": 10412,
  "fnv": "f91e257d",
  "mesh": 3783
 },
 "13035": {
  "orig": 10414,
  "fnv": "f6956360",
  "mesh": 3784
 },
 "13036": {
  "orig": 10416,
  "fnv": "f257a050",
  "mesh": 3785
 },
 "13037": {
  "orig": 10418,
  "fnv": "ab64ea39",
  "mesh": 3786
 },
 "13038": {
  "orig": 10504,
  "fnv": "eab04ed3",
  "mesh": 3823
 },
 "13039": {
  "orig": 10506,
  "fnv": "99d33fc8",
  "mesh": 3824
 },
 "13040": {
  "orig": 10508,
  "fnv": "9bc06f5a",
  "mesh": 3825
 },
 "13041": {
  "orig": 11323,
  "fnv": "1566a17f"
 },
 "13042": {
  "orig": 11320,
  "fnv": "38bde5ee",
  "mesh": 460
 },
 "13043": {
  "orig": 11321,
  "fnv": "6976c2eb",
  "mesh": 461
 },
 "13044": {
  "orig": 11330,
  "fnv": "68657b0d",
  "mesh": 4206
 },
 "13045": {
  "orig": 11332,
  "fnv": "9c18158c",
  "mesh": 4207,
  "name": "V87_WW2015_D1F_T110_VENT_DOWN_TO_FLOOR_LINE_VIEMARI_SEMANTIC_REVIEW_OPTIN"
 },
 "13046": {
  "orig": 11334,
  "fnv": "a630d3aa",
  "mesh": 4992,
  "name": "V87_WW2015_D1F_V75_STACK_DOWN_TO_FLOOR_LINE_K1_CLIPPED_INBOARD_WORK_TEST"
 },
 "13047": {
  "orig": 11724,
  "fnv": "7e238a88",
  "mesh": 4209
 },
 "13048": {
  "orig": 11363,
  "fnv": "9c24b9f3",
  "mesh": 4234
 },
 "13049": {
  "orig": 11365,
  "fnv": "79bb7b93",
  "mesh": 4235
 },
 "13050": {
  "orig": 12644,
  "fnv": "8ba38c17",
  "name": "K6_AEG_BE3002401M_MAT_ZFIGHT_COW_ROOT_R21"
 },
 "13051": {
  "orig": 12645,
  "fnv": "b15dc2d7",
  "mesh": 4993,
  "name": "K6_COW_AEG_oven_rear_housing_proxy"
 },
 "13052": {
  "orig": 12646,
  "fnv": "d335ca90",
  "mesh": 4994,
  "name": "K6_COW_AEG_front_fascia_stainless_594x594_proxy"
 },
 "13053": {
  "orig": 12647,
  "fnv": "2704818c",
  "mesh": 4995,
  "name": "K6_COW_AEG_control_panel_stainless"
 },
 "13054": {
  "orig": 12648,
  "fnv": "fa07206b",
  "mesh": 4996,
  "name": "K6_COW_AEG_control_panel_lower_shadow"
 },
 "13055": {
  "orig": 12649,
  "fnv": "bc53ef3e",
  "mesh": 4997,
  "name": "K6_COW_AEG_inner_cavity_shadow_proxy"
 },
 "13056": {
  "orig": 12650,
  "fnv": "c0e57a83",
  "mesh": 4998,
  "name": "K6_COW_AEG_inner_cavity_rack_0.152"
 },
 "13057": {
  "orig": 12651,
  "fnv": "a40af421",
  "mesh": 4999,
  "name": "K6_COW_AEG_inner_cavity_rack_0.228"
 },
 "13058": {
  "orig": 12652,
  "fnv": "a604e816",
  "mesh": 5000,
  "name": "K6_COW_AEG_inner_cavity_rack_0.304"
 },
 "13059": {
  "orig": 12653,
  "fnv": "760565f5",
  "mesh": 5001,
  "name": "K6_COW_AEG_inner_cavity_vertical_rail_-0.237"
 },
 "13060": {
  "orig": 12654,
  "fnv": "3a69cd47",
  "mesh": 5002,
  "name": "K6_COW_AEG_inner_cavity_vertical_rail_0.237"
 },
 "13061": {
  "orig": 12655,
  "fnv": "58f814e7",
  "mesh": 5003,
  "name": "K6_COW_AEG_center_clock_black_display"
 },
 "13062": {
  "orig": 12656,
  "fnv": "c041608e",
  "mesh": 5004,
  "name": "K6_COW_AEG_display_reflection_proxy"
 },
 "13063": {
  "orig": 12657,
  "fnv": "17d762e7",
  "mesh": 5005,
  "name": "K6_COW_AEG_function_dial_knob_stainless"
 },
 "13064": {
  "orig": 12658,
  "fnv": "89e40580",
  "mesh": 5006,
  "name": "K6_COW_AEG_function_dial_face"
 },
 "13065": {
  "orig": 12659,
  "fnv": "c6c33140",
  "mesh": 5007,
  "name": "K6_COW_AEG_function_dial_bezel"
 },
 "13066": {
  "orig": 12660,
  "fnv": "c890d7a3",
  "mesh": 5008,
  "name": "K6_COW_AEG_function_dial_pointer"
 },
 "13067": {
  "orig": 12661,
  "fnv": "b1e39443",
  "mesh": 5009,
  "name": "K6_COW_AEG_function_dial_tick_0"
 },
 "13068": {
  "orig": 12662,
  "fnv": "4bc6a142",
  "mesh": 5010,
  "name": "K6_COW_AEG_function_dial_tick_45"
 },
 "13069": {
  "orig": 12663,
  "fnv": "e94f6afb",
  "mesh": 5011,
  "name": "K6_COW_AEG_function_dial_tick_90"
 },
 "13070": {
  "orig": 12664,
  "fnv": "ac0f377e",
  "mesh": 5012,
  "name": "K6_COW_AEG_function_dial_tick_135"
 },
 "13071": {
  "orig": 12665,
  "fnv": "963d7355",
  "mesh": 5013,
  "name": "K6_COW_AEG_function_dial_tick_180"
 },
 "13072": {
  "orig": 12666,
  "fnv": "8f0dacf8",
  "mesh": 5014,
  "name": "K6_COW_AEG_function_dial_tick_225"
 },
 "13073": {
  "orig": 12667,
  "fnv": "af7ac84d",
  "mesh": 5015,
  "name": "K6_COW_AEG_function_dial_tick_270"
 },
 "13074": {
  "orig": 12668,
  "fnv": "a96cf126",
  "mesh": 5016,
  "name": "K6_COW_AEG_function_dial_tick_315"
 },
 "13075": {
  "orig": 12669,
  "fnv": "6f5312b3",
  "mesh": 5017,
  "name": "K6_COW_AEG_temperature_dial_knob_stainless"
 },
 "13076": {
  "orig": 12670,
  "fnv": "cf544061",
  "mesh": 5018,
  "name": "K6_COW_AEG_temperature_dial_face"
 },
 "13077": {
  "orig": 12671,
  "fnv": "e9e41c88",
  "mesh": 5019,
  "name": "K6_COW_AEG_temperature_dial_bezel"
 },
 "13078": {
  "orig": 12672,
  "fnv": "02f6217f",
  "mesh": 5020,
  "name": "K6_COW_AEG_temperature_dial_pointer"
 },
 "13079": {
  "orig": 12673,
  "fnv": "194ffef1",
  "mesh": 5021,
  "name": "K6_COW_AEG_temperature_dial_tick_0"
 },
 "13080": {
  "orig": 12674,
  "fnv": "fd221e09",
  "mesh": 5022,
  "name": "K6_COW_AEG_temperature_dial_tick_45"
 },
 "13081": {
  "orig": 12675,
  "fnv": "dc99f96c",
  "mesh": 5023,
  "name": "K6_COW_AEG_temperature_dial_tick_90"
 },
 "13082": {
  "orig": 12676,
  "fnv": "efe812b1",
  "mesh": 5024,
  "name": "K6_COW_AEG_temperature_dial_tick_135"
 },
 "13083": {
  "orig": 12677,
  "fnv": "a189cbba",
  "mesh": 5025,
  "name": "K6_COW_AEG_temperature_dial_tick_180"
 },
 "13084": {
  "orig": 12678,
  "fnv": "4929a19f",
  "mesh": 5026,
  "name": "K6_COW_AEG_temperature_dial_tick_225"
 },
 "13085": {
  "orig": 12679,
  "fnv": "4d72c776",
  "mesh": 5027,
  "name": "K6_COW_AEG_temperature_dial_tick_270"
 },
 "13086": {
  "orig": 12680,
  "fnv": "4c9e88de",
  "mesh": 5028,
  "name": "K6_COW_AEG_temperature_dial_tick_315"
 },
 "13087": {
  "orig": 12681,
  "fnv": "3399a39c",
  "mesh": 5029,
  "name": "K6_COW_AEG_lower_door_border"
 },
 "13088": {
  "orig": 12682,
  "fnv": "25e6428a",
  "mesh": 5030,
  "name": "K6_COW_AEG_door_stainless_bottom"
 },
 "13089": {
  "orig": 12683,
  "fnv": "c08f4f5b",
  "mesh": 5031,
  "name": "K6_COW_AEG_door_stainless_top"
 },
 "13090": {
  "orig": 12684,
  "fnv": "ab0ac791",
  "mesh": 5032,
  "name": "K6_COW_AEG_door_frame_left"
 },
 "13091": {
  "orig": 12685,
  "fnv": "0e817229",
  "mesh": 5033,
  "name": "K6_COW_AEG_door_frame_right"
 },
 "13092": {
  "orig": 12686,
  "fnv": "1f35a1b4",
  "mesh": 5034,
  "name": "K6_COW_AEG_door_black_glass_outer"
 },
 "13093": {
  "orig": 12687,
  "fnv": "9ea6b739",
  "mesh": 5035,
  "name": "K6_COW_AEG_door_black_glass_inset"
 },
 "13094": {
  "orig": 12688,
  "fnv": "61a59a12",
  "mesh": 5036,
  "name": "K6_COW_AEG_interior_rack_ref_0.178"
 },
 "13095": {
  "orig": 12689,
  "fnv": "c80dae6b",
  "mesh": 5037,
  "name": "K6_COW_AEG_interior_rack_ref_0.24"
 },
 "13096": {
  "orig": 12690,
  "fnv": "44ff98ea",
  "mesh": 5038,
  "name": "K6_COW_AEG_interior_rack_ref_0.302"
 },
 "13097": {
  "orig": 12691,
  "fnv": "2bc6c57f",
  "mesh": 5039,
  "name": "K6_COW_AEG_door_handle_mount_-0.206"
 },
 "13098": {
  "orig": 12692,
  "fnv": "d21122a8",
  "mesh": 5040,
  "name": "K6_COW_AEG_door_handle_mount_0.206"
 },
 "13099": {
  "orig": 12693,
  "fnv": "f8ddb94a",
  "mesh": 5041,
  "name": "K6_COW_AEG_door_handle_bar"
 },
 "13100": {
  "orig": 12694,
  "fnv": "630a9e49",
  "mesh": 5042,
  "name": "K6_COW_AEG_door_bottom_black_line"
 },
 "13101": {
  "orig": 9480,
  "fnv": "12c071c4",
  "mesh": 5043,
  "name": "R21_K7_INDOOR_CABINET_ROUNDED_SHELL_SVM14016_ENVELOPE"
 },
 "13102": {
  "orig": 9481,
  "fnv": "bfc33231",
  "mesh": 5044,
  "name": "R21_K7_INDOOR_FRONT_CURVED_WHITE_PANEL_PHOTO_PROXY"
 },
 "13103": {
  "orig": 9482,
  "fnv": "d3d0731e",
  "mesh": 5045,
  "name": "R21_K7_INDOOR_SHADOW_GAP_TOP"
 },
 "13104": {
  "orig": 9483,
  "fnv": "d9ae5e68",
  "mesh": 5046,
  "name": "R21_K7_INDOOR_AIR_OUTLET_DARK_RECESS"
 },
 "13105": {
  "orig": 9484,
  "fnv": "aad0fa6c",
  "mesh": 5047,
  "name": "R21_K7_INDOOR_OUTLET_UPPER_RIM"
 },
 "13106": {
  "orig": 9485,
  "fnv": "89c7d357",
  "mesh": 5048,
  "name": "R21_K7_INDOOR_OUTLET_LOWER_RIM"
 },
 "13107": {
  "orig": 9486,
  "fnv": "da08edb4",
  "mesh": 5049,
  "name": "R21_K7_INDOOR_AIRFLOW_HORIZONTAL_RAIL_0"
 },
 "13108": {
  "orig": 9487,
  "fnv": "13caf92a",
  "mesh": 5050,
  "name": "R21_K7_INDOOR_AIRFLOW_HORIZONTAL_RAIL_1"
 },
 "13109": {
  "orig": 9488,
  "fnv": "441ad5a9",
  "mesh": 5051,
  "name": "R21_K7_INDOOR_AIRFLOW_HORIZONTAL_RAIL_2"
 },
 "13110": {
  "orig": 9489,
  "fnv": "dd9af9ca",
  "mesh": 5052,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_01"
 },
 "13111": {
  "orig": 9490,
  "fnv": "92d81ac4",
  "mesh": 5053,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_02"
 },
 "13112": {
  "orig": 9491,
  "fnv": "8c6c02a1",
  "mesh": 5054,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_03"
 },
 "13113": {
  "orig": 9492,
  "fnv": "3cedeb2e",
  "mesh": 5055,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_04"
 },
 "13114": {
  "orig": 9493,
  "fnv": "f7a336e3",
  "mesh": 5056,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_05"
 },
 "13115": {
  "orig": 9494,
  "fnv": "c6f5e528",
  "mesh": 5057,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_06"
 },
 "13116": {
  "orig": 9495,
  "fnv": "6bdc6aa5",
  "mesh": 5058,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_07"
 },
 "13117": {
  "orig": 9496,
  "fnv": "1f4adcc2",
  "mesh": 5059,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_08"
 },
 "13118": {
  "orig": 9497,
  "fnv": "477d280e",
  "mesh": 5060,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_09"
 },
 "13119": {
  "orig": 9498,
  "fnv": "7445a9d4",
  "mesh": 5061,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_10"
 },
 "13120": {
  "orig": 9499,
  "fnv": "c959fe79",
  "mesh": 5062,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_11"
 },
 "13121": {
  "orig": 9500,
  "fnv": "87182b22",
  "mesh": 5063,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_12"
 },
 "13122": {
  "orig": 9501,
  "fnv": "ebbc1fbf",
  "mesh": 5064,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_13"
 },
 "13123": {
  "orig": 9502,
  "fnv": "d5352808",
  "mesh": 5065,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_14"
 },
 "13124": {
  "orig": 9503,
  "fnv": "088ab22d",
  "mesh": 5066,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_15"
 },
 "13125": {
  "orig": 9504,
  "fnv": "aea460b6",
  "mesh": 5067,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_16"
 },
 "13126": {
  "orig": 9505,
  "fnv": "326ec3d3",
  "mesh": 5068,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_17"
 },
 "13127": {
  "orig": 9506,
  "fnv": "944338dc",
  "mesh": 5069,
  "name": "R21_K7_INDOOR_GRILLE_VERTICAL_FIN_18"
 },
 "13128": {
  "orig": 9507,
  "fnv": "b3e04c81",
  "mesh": 5070,
  "name": "R21_K7_INDOOR_GRILLE_END_L"
 },
 "13129": {
  "orig": 9508,
  "fnv": "337f523b",
  "mesh": 5071,
  "name": "R21_K7_INDOOR_GRILLE_END_R"
 },
 "13130": {
  "orig": 9509,
  "fnv": "d510fca5",
  "mesh": 5072,
  "name": "R21_K7_INDOOR_AIR_DEFLECTOR_CLOSED_MAIN"
 },
 "13131": {
  "orig": 9510,
  "fnv": "d3fe0aa7",
  "mesh": 5073,
  "name": "R21_K7_INDOOR_DEFLECTOR_EDGE_CLOSED"
 },
 "13132": {
  "orig": 9511,
  "fnv": "82f9f710",
  "mesh": 5074,
  "name": "R21_K7_INDOOR_TOSHIBA_LOGO_VISUAL_ONLY"
 },
 "13133": {
  "orig": 9512,
  "fnv": "f2dcc44d",
  "mesh": 5075,
  "name": "R21_K7_INDOOR_DAISEIKAI8_LABEL_VISUAL_ONLY"
 },
 "13134": {
  "orig": 9513,
  "fnv": "ffd7f31a",
  "mesh": 5076,
  "name": "R21_K7_INDOOR_OPERATION_INDICATOR_0"
 },
 "13135": {
  "orig": 9514,
  "fnv": "3df3ae5f",
  "mesh": 5077,
  "name": "R21_K7_INDOOR_OPERATION_INDICATOR_1"
 },
 "13136": {
  "orig": 9515,
  "fnv": "5303f70c",
  "mesh": 5078,
  "name": "R21_K7_INDOOR_OPERATION_INDICATOR_2"
 },
 "13137": {
  "orig": 9516,
  "fnv": "e9ac8b4b",
  "name": "C80_R21_K7_TOSHIBA_ILP_WHITE_CASE_OPTIN_1F_BOTH_ROOT"
 },
 "13138": {
  "orig": 12563,
  "fnv": "b9146f21",
  "mesh": 4724,
  "name": "C80_R21_K7_ILP_LOWER_RIGHT_HORIZONTAL_WHITE_COVER_TO_CORNER_VISUAL_OPTIN"
 },
 "13139": {
  "orig": 12562,
  "fnv": "f9adc0e1",
  "mesh": 4723,
  "name": "C80_R21_K7_CORNER_PASS_THROUGH_VISIBLE_CASE_LOWERED_VISUAL_OPTIN"
 },
 "13140": {
  "orig": 12559,
  "fnv": "d73a9376",
  "name": "C80_R21_K7_ILP_LOWER_DUCT_AND_CORNER_PASS_ROOT_1F_BOTH_OPTIN"
 },
 "13141": {
  "orig": 10951,
  "fnv": "0fd24bb3",
  "name": "K9_R21_20261119_HIGH4_4COL_X3_FACES_COW_ROOT_WORK_TEST_HOST_HOLD"
 },
 "13142": {
  "orig": 10950,
  "fnv": "dbe6494b",
  "name": "K9_PAKASTIN_595MM_3_FACES_COW"
 },
 "13143": {
  "orig": 10953,
  "fnv": "9757da74",
  "mesh": 3352,
  "name": "K9_PAKASTIN_PANEL_1_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13144": {
  "orig": 10954,
  "fnv": "da1d89ae",
  "mesh": 3352,
  "name": "K9_PAKASTIN_PANEL_2_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13145": {
  "orig": 10955,
  "fnv": "d1ff44ab",
  "mesh": 3352,
  "name": "K9_PAKASTIN_PANEL_3_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13146": {
  "orig": 10957,
  "fnv": "43637c0a",
  "name": "K9_JAAKAAPPI_595MM_3_FACES_COW"
 },
 "13147": {
  "orig": 10959,
  "fnv": "f842772b",
  "mesh": 3352,
  "name": "K9_JAAKAAPPI_PANEL_1_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13148": {
  "orig": 10960,
  "fnv": "2ea23184",
  "mesh": 3352,
  "name": "K9_JAAKAAPPI_PANEL_2_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13149": {
  "orig": 10961,
  "fnv": "5aa6de9d",
  "mesh": 3352,
  "name": "K9_JAAKAAPPI_PANEL_3_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13150": {
  "orig": 10963,
  "fnv": "d120e75c",
  "name": "K9_RUOKAKAAPPI_A_595MM_3_FACES_COW"
 },
 "13151": {
  "orig": 10965,
  "fnv": "fcfc856e",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_A_PANEL_1_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13152": {
  "orig": 10966,
  "fnv": "d64a2852",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_A_PANEL_2_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13153": {
  "orig": 10967,
  "fnv": "f590991f",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_A_PANEL_3_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13154": {
  "orig": 10969,
  "fnv": "8e42c3c0",
  "name": "K9_RUOKAKAAPPI_B_595MM_3_FACES_COW"
 },
 "13155": {
  "orig": 10971,
  "fnv": "0e2005da",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_B_PANEL_1_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13156": {
  "orig": 10972,
  "fnv": "b79247a4",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_B_PANEL_2_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13157": {
  "orig": 10973,
  "fnv": "92d272b3",
  "mesh": 3352,
  "name": "K9_RUOKAKAAPPI_B_PANEL_3_595W_TO_592P5W_2P5MM_JOINT_COW",
  "building": true
 },
 "13161": {
  "orig": 6377,
  "fnv": "7f50c3c1",
  "mesh": 5080,
  "name": "R22_K2_COW_HI04_C80R2_DC_PARTY_1F_PHYSICAL_WALL_SCENE1__D1F_C048_COW_WHITE",
  "building": true
 },
 "13162": {
  "orig": 6629,
  "fnv": "1a2112fd",
  "mesh": 5081,
  "name": "R22_K2_COW_C80R2_DC_PARTY_WALL_UNDER_NORTH_OVERHANG_1F_OPAQUE_WHITE_D1F_WORK_TEST"
 },
 "13163": {
  "orig": 7645,
  "fnv": "6740c69d",
  "mesh": 5082,
  "name": "R22_K2_COW_C80R2_DC_PARTY_WALL_TERRACE_SIDE_1F_OPAQUE_WHITE_D1F_WORK_TEST_V9_PHOTO_POS",
  "building": true
 },
 "13164": {
  "orig": 6433,
  "fnv": "9d3575d1",
  "mesh": 5083,
  "name": "R22_K2_COW_HI04_C80R2_DC_PARTY_2F_PHYSICAL_WALL_SCENE2__C80_043_WHITE_SC41__IN_44SCENE_2F__REBASED_IN_WP6WP8G3_46SCENE_6433",
  "building": true
 },
 "13165": {
  "orig": 5880,
  "fnv": "375f40b8",
  "mesh": 5084,
  "name": "R22_K2_COW_HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_24"
 },
 "13166": {
  "orig": 7646,
  "fnv": "f63af7ff",
  "name": "R22_K2_COW_C80R2_C050_GUIDES_FACADE_COW_DC_WHITE_D1F_6499_V9COW"
 }
}).map(([n,a])=>[n,Object.freeze(a)])));
export const C80_620R22_SCENES=Object.freeze(Object.fromEntries(Object.entries({
 "686": {
  "scene": 686,
  "parent": 680,
  "floor": "1F",
  "profile": "1F",
  "cutaway": false,
  "rootHash": "1f8bc33c",
  "parentRootHash": "82399bd3"
 },
 "687": {
  "scene": 687,
  "parent": 681,
  "floor": "2F",
  "profile": "2F",
  "cutaway": false,
  "rootHash": "f5f4c3ee",
  "parentRootHash": "8a518e86"
 },
 "688": {
  "scene": 688,
  "parent": 682,
  "floor": "BOTH",
  "profile": "BOTH_A",
  "cutaway": false,
  "rootHash": "4f6e83b6",
  "parentRootHash": "bdc1c165"
 },
 "689": {
  "scene": 689,
  "parent": 683,
  "floor": "BOTH",
  "profile": "BOTH_B",
  "cutaway": false,
  "rootHash": "18190f04",
  "parentRootHash": "714f0817"
 },
 "690": {
  "scene": 690,
  "parent": 684,
  "floor": "BOTH",
  "profile": "BOTH_C",
  "cutaway": false,
  "rootHash": "ce01e494",
  "parentRootHash": "6fa8504b"
 },
 "691": {
  "scene": 691,
  "parent": 685,
  "floor": "BOTH",
  "profile": "BOTH_D",
  "cutaway": true,
  "rootHash": "52a82072",
  "parentRootHash": "a56224e9"
 }
}).map(([n,s])=>[n,Object.freeze(s)])));
export function isC80620R22SourceScene(json,sha,sceneIndex,floor){
 const spec=C80_620R22_SCENES[sceneIndex],a=json?.asset?.extras;
 if(sha!==C80_620R22_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||json?.scene!==292||a?.ModelStage!=='WORK_TEST'||a.current!==false||a.asBuilt!==false||a.HUMAN_REVIEW!=='NOT_RUN')return false;
 if(Object.entries(C80_620R22_COUNTS).some(([k,n])=>(json[k]?.length??0)!==n))return false;
 const sc=json.scenes[sceneIndex],prior=json.scenes[spec.parent],e=sc?.extras;
 if(sc?.name!==`C80_620R22_OWNER_R21_K1K2K6K7K9_OPTIN_${spec.floor}__scene${sceneIndex}_WORK_TEST_HOST_HOLD`||!Array.isArray(sc.nodes)||!Array.isArray(prior?.nodes)||c80614Fnv32(sc.nodes)!==spec.rootHash||c80614Fnv32(prior.nodes)!==spec.parentRootHash||e?.C80_620R22_ownerReview20261119!==true||e.C80_620R22_parentGLBSHA256!==C80_620R22_PARENT_GLB_SHA256||e.C80_620R22_parentScene!==spec.parent||e.preserve620R21Geometry!==true||e.sourceLinksBound!==false||e.productionWebGLVerified!==false||e.HUMAN_REVIEW!=='NOT_RUN'||e.current!==false||e.asBuilt!==false||e.HOST_HOLD!==true)return false;
 const expected=prior.nodes.map(n=>C80_620R22_ROOT_REPLACEMENTS[n]??n);
 return expected.length===sc.nodes.length&&expected.every((n,i)=>n===sc.nodes[i]);
}
