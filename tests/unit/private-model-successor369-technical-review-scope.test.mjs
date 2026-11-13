import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {SUCCESSOR_R1_SHA256,SUCCESSOR_R1_DONORS,SUCCESSOR_R1_SCENES,isM6263Mj72Kiv005Pk1SuccessorSourceScene} from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import {TATE4_TECHNICAL_REVIEW_ROOTS} from '../../src/scripts/privateModelC80TateInteriorLayerSourceProfile.mjs';
import {successor369ReviewProfile,resolveTechnicalReviewRoots,createTechnicalReviewPresentation} from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

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


const awaitSourceGate=json=>isM6263Mj72Kiv005Pk1SuccessorSourceScene(json,SUCCESSOR_R1_SHA256,362);
const sourceDoc=()=>{
 const json=fixture();
 // Source-exact inherited TATE4 root labels are preserved in the successor.
 for(const x of TATE4_TECHNICAL_REVIEW_ROOTS[352]??[]){
   if(json.nodes[x.node])json.nodes[x.node].name=x.name;
 }
 // The generic successor fixture focuses on new donors, so the unchanged
 // MJ63 root names must be supplied from the SHA-verified original GLB.
 const mj63Names=[
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_SHAFT_1',
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_ARROW_1',
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_SHAFT_2',
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_ARROW_2',
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_SHAFT_3',
  'MJ63_D1F_STORAGE_DOOR_UNDERCUT_INLET_ARROW_3',
  'MJ63R2_WARDROBE_EXHAUST_VALVE_IN_ROOM_ADJACENT_TO_OUTDOOR_STORAGE',
 ];
 mj63Names.forEach((name,i)=>{json.nodes[12086+i].name=name;});
 json.nodes[12096].name='MJ63R2_INNER_ROOM_THROUGH_STORAGE_TO_OUTSIDE_SINGLE_SEALED_DUCT_WORK_TEST';
 return json;
};
test('successor exact SHA admits only technical roots, never cutaway building wrapper',()=>{
 const json=sourceDoc();
 const gate=(awaitSourceGate(json));
 assert.equal(gate,true,'canonical source fixture must pass before technical selection');
 const profile=successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,362);
 assert.ok(profile);
 assert.equal(profile.count,369);
 assert.deepEqual(profile.floors,{'1F':350,'2F':351,BOTH:352});
 const ids=profile.roots[362].map(x=>x.node);
 for(const n of [12086,12087,12088,12089,12090,12091,12092,12096,12098,12106]){
   assert.ok(ids.includes(n),'real technical root '+n);
 }
 for(const n of [2220,11613,11945])assert.ok(json.scenes[362].nodes.includes(n), 'composite non-technical source root '+n+' is active');
 for(const n of [12097,11542,8913,2220,11613,11945])assert.equal(ids.includes(n),false,'no architecture/superseded '+n);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(ids.every(n=>json.scenes[362].nodes.includes(n)));
});
test('PK1 service cutaway scene368 retains verified technical roots but never its architectural wrapper',()=>{
 const json=sourceDoc(),src=json.scenes[362],spec=SUCCESSOR_R1_SCENES[368];
 assert.ok(src.nodes.includes(2220),'physical parent includes C77 wrapper');
 const roots=src.nodes.map(id=>id===2220?12097:id);
 const old=src.extras.successorIntegration;
 json.scenes[368]={
  name:spec.name,nodes:roots,
  extras:{...src.extras,successorIntegration:{
   ...old,donorReplacementRoots:Object.fromEntries(Object.entries(spec.replacements).map(([k,v])=>[k,[...v]])),
   cutawayIsNonPhysical:true
  }}
 };
 assert.equal(isM6263Mj72Kiv005Pk1SuccessorSourceScene(json,SUCCESSOR_R1_SHA256,368,'BOTH','CLOSED',true),true);
 const profile=successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,368);
 assert.ok(profile);
 const ids=profile.roots[368].map(x=>x.node);
 for(const n of [12086,12092,12096,12098,12106])assert.ok(ids.includes(n));
 for(const n of [12097,2220,11613,11945,11542,8913])assert.equal(ids.includes(n),false);
 assert.equal(ids.length,new Set(ids).size);
});

test('SHA, stale scene, CURRENT promotion and unverified replacement reject all',()=>{
 const json=sourceDoc();
 assert.equal(successor369ReviewProfile(json,'8aaadccfaa880e7693337467a00d9efb53d4d5e332d377be10d1e353e87e25c5',362),null);
 assert.equal(successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,355),null);
 json.asset.extras.current=true;
 assert.equal(successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,362),null);
 json.asset.extras.current=false;
 json.scenes[362].extras.successorIntegration.sourceLinksBindingVerified=true;
 assert.equal(successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,362),null);
});
test('technical scene membership source gate returns only existing indexed scene roots',()=>{
 const json=sourceDoc();
 const roots=json.scenes[362].nodes;
 const map=new Map();
 const scene={children:[],name:json.scenes[362].name};
 for(const id of roots){
   const o={name:json.nodes[id]?.name??('NODE_'+id),parent:scene};
   scene.children.push(o);map.set(o,{nodes:id});
 }
 const gltf={scenes:Array.from({length:369},(_,i)=>i===362?scene:undefined),parser:{json,associations:map}};
 const kept=resolveTechnicalReviewRoots(gltf,scene,362,SUCCESSOR_R1_SHA256,SUCCESSOR_R1_SHA256);
 assert.ok(kept);
 assert.equal(kept.length,successor369ReviewProfile(json,SUCCESSOR_R1_SHA256,362).roots[362].length);
 assert.equal(kept.some(o=>map.get(o).nodes===12097),false);
 assert.equal(resolveTechnicalReviewRoots(gltf,scene,362,SUCCESSOR_R1_SHA256,'0'.repeat(64)),null);
 const bad=new Map(map);
 bad.delete(scene.children.find(o=>map.get(o).nodes===12098));
 assert.equal(resolveTechnicalReviewRoots({scenes:gltf.scenes,parser:{json,associations:bad}},scene,362,SUCCESSOR_R1_SHA256,SUCCESSOR_R1_SHA256),null);
});
