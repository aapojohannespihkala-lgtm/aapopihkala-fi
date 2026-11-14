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

// Concealed-service normal/inspection behavior uses this existing required CI suite.
import { readFileSync } from 'node:fs';
import { resolveConcealedTechnicalObjects, createConcealedTechnicalPresentation } from '../../src/scripts/privateModelConcealedTechnicalPresentation.mjs';
import { SUCCESSOR_R1_SHA256 as SHA } from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import { TATE4_MJ6263_SOURCE_SHA256 as PREVIOUS_SHA } from '../../src/scripts/privateModelTate4Mj62Mj63SourceProfile.mjs';

// Minimal receipt extracted from original Drive ZIP152JZ... / inner SHA31dc12c4.
// Source values are independent of the presentation implementation.
const RECEIPT = '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';
// Original published M6263 receipt, independently fetched and SHA-verified.
const PREVIOUS_RECEIPT = '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';
function concealedFixture(index = 362) {
  const previous = index < 360;
  const sha = previous ? PREVIOUS_SHA : SHA;
  const receipt = JSON.parse(inflateSync(Buffer.from(previous ? PREVIOUS_RECEIPT : RECEIPT, 'base64')).toString());
  const json = { ...receipt, nodes: Array.from({length:previous ? 12097 : 12108}, () => ({})),
    meshes: Array.from({length:previous ? 4549 : 4556}, () => ({})), scenes: Array.from({length:previous ? 360 : 369}, () => ({nodes:[]})) };
  for (const [id, value] of Object.entries(receipt.nodes)) json.nodes[id] = value;
  for (const [id, value] of Object.entries(receipt.scenes)) json.scenes[id] = value;
  const associations = new Map(), byId = new Map();
  function build(id, parent) {
    const n = json.nodes[id];
    const object = { name:n.name, visible:true, isMesh:n.mesh !== undefined, parent, children:[],
      traverse(fn) { fn(this); for (const child of this.children) child.traverse(fn); } };
    associations.set(object, {nodes:id}); byId.set(id, object);
    // Only target ancestry is needed here, not the donor socket's full tree.
    if ([11730,11908,11912].includes(id)) {
      for (const child of n.children ?? []) object.children.push(build(child, object));
    }
    return object;
  }
  const scene = { children:[], traverse(fn) { fn(this); for (const child of this.children) child.traverse(fn); } };
  for (const id of json.scenes[index].nodes) scene.children.push(build(id, scene));
  const gltf = {scenes:Array.from({length:previous ? 360 : 369}, (_,i) => i === index ? scene : null), parser:{json,associations}};
  return {json,gltf,scene,byId,index,resolve() { return resolveConcealedTechnicalObjects(gltf,scene,index,sha,sha); }};
}

test('all nine source scenes mask only the seven declared concealed routes', () => {
  for (let index=360; index<=368; index++) {
    const f=concealedFixture(index), result=f.resolve();
    assert.ok(result, 'actual source receipt scene '+index);
    const ids=result.objects.map(object => f.gltf.parser.associations.get(object).nodes);
    const twoFloor = [361,363,365].includes(index);
    assert.deepEqual(ids, twoFloor ? [11829,11909,11911] : [11733,11737,11738,11829,11905,11909,11911]);
    assert.equal(result.diagnosticScene, index===367 || index===368);
    assert.equal(ids.includes(12098),false,'visible owner socket remains outside concealment');
    assert.equal(ids.includes(11636),false,'visible NIBE copper is not hidden by the word hidden in uncertainty');
  }
});

test('the seven already-published M6263 scenes use their own SHA and source gate', () => {
  for (let index=353; index<=359; index++) {
    const f=concealedFixture(index), result=f.resolve();
    assert.ok(result, 'published source scene '+index);
    const ids=result.objects.map(object => f.gltf.parser.associations.get(object).nodes);
    assert.deepEqual(ids,[354,356,358].includes(index) ? [11829,11909,11911] : [11733,11737,11738,11829,11905,11909,11911]);
    assert.equal(result.diagnosticScene,false);
    assert.equal(resolveConcealedTechnicalObjects(f.gltf,f.scene,index,SHA,SHA),null,'no inherited newer source identity');
  }
});

test('inspection respects layer and ancestor hides, then normal mode conceals again', () => {
  const f=concealedFixture(), result=f.resolve();
  f.byId.get(11909).visible=false; // Existing per-mesh Layers hide.
  f.byId.get(11912).visible=false; // Existing parent hide.
  const view=createConcealedTechnicalPresentation(result);
  view.apply(false);
  assert.ok(result.objects.every(object => !object.visible));
  assert.equal(f.byId.get(12098).visible,true,'real visible socket untouched');
  view.apply(true);
  assert.equal(f.byId.get(11829).visible,true);
  assert.equal(f.byId.get(11909).visible,false,'never reveal layer-hidden route');
  assert.equal(f.byId.get(11912).visible,false,'never reveal hidden parent');
  view.apply(false);
  assert.ok(result.objects.every(object => !object.visible));
  view.dispose();
  assert.equal(f.byId.get(11829).visible,true,'restore previous scene baseline');
  assert.equal(f.byId.get(11909).visible,false);
  view.apply(false);
  assert.equal(f.byId.get(11829).visible,true,'disposed controller does not mutate old scene');
});

test('PK1 diagnostic cutaway retains concealed routes at existing visibility baseline', () => {
  const f=concealedFixture(368), result=f.resolve();
  f.byId.get(11905).visible=false;
  const view=createConcealedTechnicalPresentation(result);
  view.apply(false);
  assert.equal(f.byId.get(11829).visible,true);
  assert.equal(f.byId.get(11905).visible,false);
  view.dispose();
});

test('wrong SHA, scene, source mesh, semantic flag, parent or duplicate association fails closed', () => {
  let f=concealedFixture();
  assert.equal(resolveConcealedTechnicalObjects(f.gltf,f.scene,362,SHA,'0'.repeat(64)),null);
  assert.equal(resolveConcealedTechnicalObjects(f.gltf,f.scene,355,SHA,SHA),null);
  f.json.nodes[11911].mesh=4515; assert.equal(f.resolve(),null);
  f=concealedFixture(); delete f.json.nodes[11829].extras.noVisibleRoomCable; assert.equal(f.resolve(),null);
  f=concealedFixture(); f.byId.get(11911).parent=f.scene; assert.equal(f.resolve(),null);
  f=concealedFixture(); f.gltf.parser.associations.delete(f.byId.get(11908)); assert.equal(f.resolve(),null);
  f=concealedFixture(); const copy={...f.byId.get(11911)};
  f.byId.get(11912).children.push(copy); f.gltf.parser.associations.set(copy,{nodes:11911});
  assert.equal(f.resolve(),null);
});

test('viewer disposes the concealment before Layers and blocks inspection under isolate/hide', () => {
  const source=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  const dispose=source.slice(source.indexOf('const disposeLayersPresentation = () => {'),source.indexOf('beforeLayersSceneChange = disposeLayersPresentation;'));
  assert.ok(dispose.indexOf('concealedTechnical?.dispose()') < dispose.indexOf('layersRuntime?.dispose()'));
  const change=source.slice(source.indexOf("technicalReviewInput.addEventListener('change'"),source.indexOf("layersContextInput.addEventListener('change'"));
  assert.ok(change.indexOf("objectVisibilityFilter === 'active'") < change.indexOf('concealedTechnical?.apply(technicalReviewOn)'));
  assert.ok(source.includes('concealedTechnical.apply(technicalReviewOn)'));
});
