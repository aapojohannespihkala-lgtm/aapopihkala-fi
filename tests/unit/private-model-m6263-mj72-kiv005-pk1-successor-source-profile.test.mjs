import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
 SUCCESSOR_R1_SHA256,SUCCESSOR_R1_DONORS,SUCCESSOR_R1_SCENES,
 successorR1RootFnv32,isM6263Mj72Kiv005Pk1SuccessorSourceScene,
} from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';

// Ordered source-scene 355 roots from the existing exact M6263 test. The
// SHA31dc12c4 successor scene 362 replaces only the two donor roots.
const BASE355='eNotlskRHDEMAxPah6iDRywu55+GgR5/ujSSoIMisfsn71m/iXq/2b1+XTeNMtoY4XnghbGN89t7r1+lJr+97y/vq1+eKveB/tXMeNHQlH6/nAfSKKONEXL9Mk8YW1ptJNA6xv3NxNHyqQVuSHG1uSDFHe+mlXUqHTxr/yS97kuD0faAFkjOrN1iPe2k8+ow3kmyMnSi1vGF1slXGNs4xjUcp5VGGczzNWMZVoQVYUVYEVaENmpFsfYmijrWm+tWu+Wlejtix7jGM3Sl5Y1qvFEGJz/wwgcT+s10Od31GopJKviCP9t7pF6v/cA5Pm77kH7bfpxAA6Mps3zf5VsuXzDG9zjf5j4Ha5U7Fe5Yjqia6vQLzXEuHV1HuAafHp0wjuGB8YCuOE/hOakrRvgNtE1yx+SOyR2TO2bBb86YxWsWh+M0r9AW2kJbaAttoS20jbbRNtpG22gbbaNttI220Q7aQTtoB+2gHbSDdtAO2rE214IBieA68MIHExZsiDbQBtpAG2gDbaANtIE20AbajXaj3Wg32o12o91oN1reIjfag5YkcJWaaMnDJA+TPFRVQbQH7UV70V60F+1Fe9FetBftRXvRPrQP7UP70MoVVEzlfNZ3HEctjrLX7YINx3TUxIDaKVweEc+nEd3z7AtBrgRvHLxu8CpB9IOIBxEPIh5EPBzxOnKcbbPZmXamA7ZBZtjMjkYEz1Yqy4Toa7f06VAryZb73FJUBZtNel7Z9NSnVtgX5GjXfneLll247JB2tafXF9qQYbYP0z6MiypdU4nPHC/gkMr9NK945iKJy/XpahoX07iWxuGpWTaoZYNafJZhw1eQasiOPnYylVkvZZfwDK6iz1AddGv9trHLYJ6RRhmYjl112VkeBeSfgaO19VsQhlqVNhRbUilAwjW+7a0Z0mZ40qJA3qMwH4X5f10K81HU30/DZ7P5JRtpycxkTmFNhe0UtlPYTtXXT+SwncJ2CtspbKewncJ2CtspbKewncJ2CtspbKewncJ2Ctup+d4HLbZTtp3Y8yX7JcFJ+QMviX9JfJL9fOVymXkpGtL/XIrmss5F+9A+tA/tQ/vQPrQP7UP70D60FJOzXWV0KLVD2W2KZlM0nIfyD0o+kjWTIk7HLfyz7R+FBQNuSP+hn5tW8spJu5hDidf3+o58NJFpztCbNis4Wc2E9HO25mzNvRozGFu3+LU3PPDCBxMWlFb/HBjFhAYLGdtyDCcZzjDsPp8hFf3s7v8AXoF1/Bbihgde+CAz/Rb617Igo8VoMdofmdOs6bzSXxjmD+sP60/+/QcUa/+t';
const roots355=JSON.parse(inflateSync(Buffer.from(BASE355,'base64')).toString('utf8'));
const roots362=roots355.map(n=>n===11542?12098:n===8913?12106:n);
const PHOTO='https://drive.google.com/file/d/1Tlxfbs5f-vzkMRVVcWEpSqLyC-Kjwrer/view';
const DOC='https://docs.google.com/document/d/18_PBZ5QxJD_4X0vfxuQz5PTaWTNB-tDNWNs2FUu2SHI/edit';
const KIV='https://docs.google.com/document/d/1oUyzHXMLPGI1SU7Wf8lCCllmmCjc-bvNReIaP_b-rQE/edit';
function fixture(){
 const nodes=Array.from({length:12108},()=>({}));
 nodes[12097]={name:'PK1_INSPECT_1F_C77_WRAPPER_NO_PRESENTATION_CABINET_2202_WORK_TEST',
  children:Array.from({length:58},(_,i)=>3000+i),
  extras:{stage:'WORK_TEST_SOURCE_ONLY_STAGING_HOLD',current:false,asBuilt:false,canPublish:false,canApplyToViewer:false}};
 const links=[{role:'OWNER_PHOTO_VISIBLE_2026',url:PHOTO},{role:'MJ72_DOC_CURRENT_PHOTO',url:DOC}];
 nodes[12098]={name:'MJ72_OWNER2026_STORAGE_SOCKET_TWO_CLOSED_COVERS_UPPER_DOOR_WALL_COW_ROOT_WORK_TEST_HOST_HOLD',
  children:[12099,12100,12101,12102,12103,12104,12105],
  extras:{modelStage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,closedCoverCountVisible:2,
   exact2026XYZMeasured:false,physicalElectricalConnectionVerified:false,
   sourceLinksBindingNewSHA:'NOT_VERIFIED; source URL provenance only',sourceLinks:links}};
 const names=['HOUSING','LEFT_CLOSED_FLAP','RIGHT_CLOSED_FLAP','LEFT_TOP_HINGE','RIGHT_TOP_HINGE','LEFT_LOWER_TAB','RIGHT_LOWER_TAB'];
 for(let i=0;i<7;i++)nodes[12099+i]={
  name:'MJ72_OWNER2026_STORAGE_SOCKET_'+names[i]+'_WORK_TEST_HOST_HOLD',mesh:4549+i,
  extras:{sourceMJ72GLBSHA256:'43794ae5e2ded351cc0bff77cd352e8f010acb4d37e0416049f8c2c6ad6e69c8',
   currentGLBSourceLinksBindingVerified:false,physicalMountingHeightVerified:false,
   electricalCircuitVerified:false,sourceLinks:links}};
 nodes[12106]={name:'C80R2_V29_KIV_WALLFIT_2F_OWNER2026_KIV005_POINT_COW_GROUP_WORK_TEST_HOST_HOLD',
  children:[8908,8909,8910,8911,12107],
  extras:{notCurrent:true,notAsBuilt:true,humanReview:'NOT_RUN',sourceLinks:[{role:'OWNER2026_APPROX_VISUAL_MARK',link:KIV}]}};
 nodes[12107]={name:'KIV005__OWNER2026_POINT_X2897_Y10590_Z5045',
  extras:{realWallHostVerified:false}};
 const scenes=Array.from({length:369},()=>({nodes:[]}));
 const e=SUCCESSOR_R1_SCENES[362];
 scenes[362]={name:e.name,nodes:[...roots362],extras:{
   stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,physicalConnectionsVerified:0,
   productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',successorIntegration:{
    stage:'WORK_TEST_HOST_HOLD',defaultSceneUnchanged:true,sourceSceneInternal:e.parent,
    sourceGlbSha256:{...SUCCESSOR_R1_DONORS},
    donorReplacementRoots:Object.fromEntries(Object.entries(e.replacements).map(([k,v])=>[k,[...v]])),
    sourceLinksBindingVerified:false,productionWebGLVerified:false,
    humanReview:'NOT_RUN',current:false,asBuilt:false,cutawayIsNonPhysical:false}}};
 return {scene:292,scenes,nodes,meshes:Array.from({length:4556},()=>({})),
  asset:{extras:{Canonical:false,ModelStage:'WORK_TEST',current:false,asBuilt:false,
   HUMAN_REVIEW:'NOT_RUN',viewerFloorScenes:{'1F':350,'2F':351,BOTH:352}}}};
}
test('all nine real internal scene descriptors are pinned, no filename index inference',()=>{
 assert.deepEqual(Object.keys(SUCCESSOR_R1_SCENES).map(Number),[360,361,362,363,364,365,366,367,368]);
 assert.deepEqual(SUCCESSOR_R1_SCENES[367].replacements.PK1_CUTAWAY,[2220,12097]);
 assert.deepEqual(SUCCESSOR_R1_SCENES[368].replacements.KIV005,[8913,12106]);
});
test('exact source 355 -> successor 362 root substitutions and SHA lock',()=>{
 assert.equal(roots362.length,464);
 assert.equal(successorR1RootFnv32(roots362),'f787d22e');
 assert.equal(isM6263Mj72Kiv005Pk1SuccessorSourceScene(fixture(),SUCCESSOR_R1_SHA256,362,'BOTH','CLOSED',false),true);
});
test('wrong GLB SHA, old or unknown scene, wrong floor and mode fail closed',()=>{
 const g=fixture();
 for(const args of [[SUCCESSOR_R1_DONORS.base,362],[SUCCESSOR_R1_SHA256,355],
   [SUCCESSOR_R1_SHA256,369],[SUCCESSOR_R1_SHA256,362,'1F'],
   [SUCCESSOR_R1_SHA256,362,'BOTH','STACKED'],[SUCCESSOR_R1_SHA256,362,'BOTH','CLOSED',true]]){
  assert.equal(isM6263Mj72Kiv005Pk1SuccessorSourceScene(g,...args),false);
 }
});
test('changed root order, donor SHA, approximate/photo source or imported node fails closed',()=>{
 for(const mutate of [
  g=>g.scenes[362].nodes.reverse(),
  g=>{g.scenes[362].extras.successorIntegration.sourceGlbSha256.mj72='0'.repeat(64)},
  g=>{g.scenes[362].extras.successorIntegration.donorReplacementRoots.KIV005=[8913,11542]},
  g=>{g.nodes[12098].extras.sourceLinks=[]},
  g=>{g.nodes[12105].mesh=4540},
  g=>{g.nodes[12106].extras.notAsBuilt=false},
  g=>{g.nodes[12097].extras.canPublish=true},
 ]){
  const g=fixture();mutate(g);
  assert.equal(isM6263Mj72Kiv005Pk1SuccessorSourceScene(g,SUCCESSOR_R1_SHA256,362),false);
 }
});
test('no CURRENT, HUMAN_REVIEW, WebGL or sourceLinks promotion',()=>{
 for(const mutate of [
  g=>{g.asset.extras.current=true},
  g=>{g.scenes[362].extras.successorIntegration.sourceLinksBindingVerified=true},
  g=>{g.scenes[362].extras.successorIntegration.productionWebGLVerified=true},
  g=>{g.scenes[362].extras.successorIntegration.humanReview='PASS'},
 ]){
  const g=fixture();mutate(g);
  assert.equal(isM6263Mj72Kiv005Pk1SuccessorSourceScene(g,SUCCESSOR_R1_SHA256,362),false);
 }
});
