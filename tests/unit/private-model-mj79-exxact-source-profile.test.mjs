import test from 'node:test';
import assert from 'node:assert/strict';
import {
 MJ79_SOURCE_SHA256,MJ79_PARENT_SHA256,MJ79_SOURCE_SCENE_COUNT,
 MJ79_SOURCE_NODE_COUNT,MJ79_SOURCE_MESH_COUNT,MJ79_BASE_FLOORS,
 MJ79_FLOORS,MJ79_SCENES,MJ79_SOCKETS,MJ79_SOURCES,
 mj79RootFnv32,isMJ79SourceScene,
} from '../../src/scripts/privateModelMJ79ExxactSourceProfile.mjs';
// True ordered glTF root arrays from the source-verified MJ79 GLB; no lossy compression fixture.
const BASE=[6430,9175,9280,8746,8747,8748,8749,8750,8751,8752,8753,2220,7646,5224,6457,6377,7647,7648,7999,9281,5285,6955,6956,6957,6958,6959,6960,5733,6631,6632,7651,7652,7653,7654,9913,6365,6419,6420,6421,6497,7655,8756,8672,6524,7656,7657,7658,8673,6620,7660,10532,6376,6652,6727,6728,6847,6848,9201,9202,9203,9204,9205,9206,9207,9208,9209,9210,9211,9212,9213,9214,9215,9216,6850,7221,8757,7594,8758,7597,9282,7993,7994,7995,7996,8007,9798,9261,10533,10534,10535,10536,10537,8760,8674,8675,8681,8684,8687,9262,8846,8690,9283,9250,8857,9286,8962,9003,9006,9008,9194,9231,10538,9287,9274,9272,10660,9277,9365,9375,9382,9384,9385,9387,9391,9393,9394,9395,9396,9516,3698,11728,10563,10564,10565,10566,10567,10568,10569,10570,10571,10572,10573,10574,10575,10576,10577,10578,10579,10580,10581,10582,10583,10584,10585,10586,10587,10588,10589,10590,10591,10592,10593,10594,10595,10596,10597,10598,10599,10600,10601,10602,10603,10604,10605,10606,10607,10608,10609,10610,10611,10612,10613,10614,10615,10616,10617,10618,10619,10620,10621,10622,10623,10624,10625,10626,10627,10628,10629,10630,10631,10632,10633,10634,10635,10636,10637,10638,10639,10640,10641,10642,10643,10644,10645,10646,10647,10648,10649,10650,10651,10652,10653,10654,7227,8843,11305,11362,11307,11308,11309,11310,11311,11315,11316,11403,11675,11542,11546,11560,11576,11589,11591,11595,11604,11609,11612,11613,11614,11615,11616];
const ROOTS={372:[...BASE,...[11710,11721,11722,11723,11730,12049,11775,11944,11819,11824,11829,11901,11902,11903,11904,11905,11906,11907,11908,11910,11914,11920,11926,11932,11938,11952,11954,11956,11958,11960,11975,11980,11985]],373:[...BASE,...[7356,2658,2661,6431,6432,6433,10553,7361,7366,7367,5323,7368,5327,5629,5880,7369,5835,5836,9263,7370,6435,7371,8003,6472,6473,6474,6475,6476,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,10794,10795,9573,9574,9575,9576,7904,7905,7906,7907,7908,7909,7932,12038,10833,7979,8024,8025,8026,9264,8199,8895,8913,9195,9196,9197,9198,9199,9200,9257,10554,9332,9911,9912,9761,9338,9763,9764,9762,10837,10951,10976,11714,10555,10556,10557,10558,10559,10560,10561,10562,10656,10657,10659,10763,10770,10771,10772,10773,10774,10775,10776,10777,10778,10779,10780,10781,10782,10783,10784,10785,10786,10787,10788,10789,10790,10791,10792,10793,11298,11304,11319,11339,11340,11341,11342,11343,11344,11345,11346,11347,11348,11349,11350,11351,11352,11353,11354,11355,11356,11357,11358,11359,11360,11361,11535,11536,11624,11625,11642,11645,11648,11655,11913,11662,11677,11673,11717,11720,11721,11722,11723,11730,12049,11775,11944,11819,11824,11829,11845,11858,11891,11900,11901,11902,11903,11904,11905,11906,11907,11908,11910,11914,11920,11926,11932,11938,11574,11948,11952,11954,11956,11958,11960,11962,11964,11966,11968,11970,11975,11980,11985,11990,11995,12033,12034,12035,12036,12037]]};
const rootList=id=>[...ROOTS[id]];
const links=Object.values(MJ79_SOURCES).map(url=>({url}));
function fixture() {
 const nodes=Array.from({length:MJ79_SOURCE_NODE_COUNT},()=>({}));
 nodes[12049]={name:'MJ79_D1F_PR03_PR05_SOURCE_EXACT_TWO_ANGLED_DOUBLE_PROXY_COW_ROOT_20261112',
   children:[11740,11741,11742,11743,11744,11747,12043,12048,11754,11757,11760,11763],
   extras:{sourceRoot:11739,sourceParentGLBSHA256:MJ79_PARENT_SHA256,
      visualDiffOnly:'PR03_PR05_TWO_ANGLED_DOUBLE_SOCKETS',notInstalledSKU:true,
      asBuilt:false,sourceLinks:links}};
 for (const s of MJ79_SOCKETS) {
   nodes[s.root]={name:'WORK_TEST_OUTLET',children:[...s.children],extras:{
     stableID:s.stableID,oldRootNode:s.oldRoot,ModelStage:'WORK_TEST',
     RepresentationKind:'PHOTO2025_ANGLED_VISUAL_PROXY',socketCount:2,
     installedSKU:'UNKNOWN',current:false,asBuilt:false,measured:false,
     physicalElectricalValidated:false,sourcePhotoDate:'2025-04-26',sourceLinks:links}};
   for(let i=0;i<4;i++)nodes[s.children[i]]={
     name:'MJ79_D1F_'+s.stableID.slice(3)+'_PHOTO12_EXXACT_ANGLED_TWO_OUTLETS_PART_VISUAL_WORK_TEST',
     mesh:4539+i,extras:{installedSKU:'UNKNOWN',current:false,asBuilt:false,sourceLinks:links}};
 }
 const scenes=Array.from({length:MJ79_SOURCE_SCENE_COUNT},()=>({name:'old-scene',nodes:[]}));
 for(const [index,p] of Object.entries(MJ79_SCENES)) {
   scenes[index]={name:p.name,nodes:rootList(index),extras:{
     parentGlbSHA256:MJ79_PARENT_SHA256,parentSceneIndex:p.parentScene,
     integrationTask:'MJ79_PHOTO12_D1F_PR03_PR05_VISUAL_ONLY',
     floor:p.floor,modelStage:'WORK_TEST',HOST_HOLD:true,current:false,asBuilt:false,
     photo2025:true,owner2026GeneralFamilyReference:true,actualInstalledSKU:'UNKNOWN',
     exactXYZMeasured:false,physicalElectricalVerified:false,nodeCOW:[11739,12049],
     replacedOldActiveOutletRoots:[11748,11751],newOutletRoots:[12043,12048],
     sourceLinks:links}};
 }
 return {scene:292,scenes,nodes,
  meshes:Array.from({length:MJ79_SOURCE_MESH_COUNT},()=>({})),
  asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,canonical:false,
    viewerFloorScenes:{...MJ79_BASE_FLOORS}}}};
}
test('MJ79 authentic root snapshots and floor-scene bindings',()=>{
 const j=fixture();
 for(const [floor,index] of Object.entries(MJ79_FLOORS)){
   assert.equal(mj79RootFnv32(j.scenes[index].nodes),MJ79_SCENES[index].rootFnv);
   assert.equal(isMJ79SourceScene(j,MJ79_SOURCE_SHA256,index,floor),true);
 }
 assert.equal(isMJ79SourceScene(j,MJ79_SOURCE_SHA256,292),false);
});
test('MJ79 refuses wrong loaded SHA, floor, stale ordered roots and provenance',()=>{
 const j=fixture(),sha=MJ79_SOURCE_SHA256;
 assert.equal(isMJ79SourceScene(j,'0'.repeat(64),372,'1F'),false);
 assert.equal(isMJ79SourceScene(j,sha,373,'1F'),false);
 const ordered=structuredClone(j);ordered.scenes[372].nodes.reverse();
 assert.equal(isMJ79SourceScene(ordered,sha,372),false);
 const parent=structuredClone(j);parent.scenes[373].extras.parentGlbSHA256='0'.repeat(64);
 assert.equal(isMJ79SourceScene(parent,sha,373),false);
 const photo=structuredClone(j);photo.scenes[372].extras.sourceLinks=[];
 assert.equal(isMJ79SourceScene(photo,sha,372),false);
 const old=structuredClone(j);old.scenes[373].nodes[0]=11739;
 assert.equal(isMJ79SourceScene(old,sha,373),false);
});
test('MJ79 refuses superseded outlets, duplicate new outlets or as-built upgrade',()=>{
 const sha=MJ79_SOURCE_SHA256;
 const old=fixture();old.nodes[12049].children.push(11748);
 assert.equal(isMJ79SourceScene(old,sha,372),false);
 const duplicate=fixture();duplicate.nodes[12049].children.push(12043);
 assert.equal(isMJ79SourceScene(duplicate,sha,373),false);
 const fake=fixture();fake.nodes[12039].mesh=4538;
 assert.equal(isMJ79SourceScene(fake,sha,372),false);
 const sku=fixture();sku.nodes[12043].extras.installedSKU='WDE002682';
 assert.equal(isMJ79SourceScene(sku,sha,372),false);
 const current=fixture();current.asset.extras.current=true;
 assert.equal(isMJ79SourceScene(current,sha,373),false);
 const amended=fixture();amended.scenes[373].extras.physicalElectricalVerified=true;
 assert.equal(isMJ79SourceScene(amended,sha,373),false);
});
