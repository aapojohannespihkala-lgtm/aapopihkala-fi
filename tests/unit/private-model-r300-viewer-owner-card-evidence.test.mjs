import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R300_OWNER_GLB_SHA256,
  R300_OWNER_R31_772_GLB_SHA256,
  R300_OWNER_R31_774_GLB_SHA256,
  R300_OWNER_R32H_GLB_SHA256,
  R300_OWNER_CARD_REF,
} from '../../src/scripts/privateModelR300OwnerCardAdapter.mjs';
import { resolveR300ViewerOwnerCardEvidence as resolve } from '../../src/scripts/privateModelR300ViewerOwnerCardEvidence.mjs';

const oldSceneNames = {
  759:'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
  760:'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760',
};
const newSceneNames = {
  769:'Ylisrinne_C80_R31_R300_ROOF_VM20_CLOSED_2F_L12_V75V110_RK141_RK142_RK143_MJ83_BOTH_REVIEW_WORK_TEST_HOST_HOLD__scene769',
  770:'Ylisrinne_C80_R31_BOTH_R300_KUPARIT_HUOLTO_PLEKSI_POIS_RK141_RK142_RK143_MJ83_VM20_CLOSED_WORK_TEST_HOST_HOLD__scene770',
  771:'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_NORMAL_WORK_TEST_HOST_HOLD__scene771',
  772:'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_SERVICE_WORK_TEST_HOST_HOLD__scene772',
};
const latestSceneNames = {
  773:'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_NORMAL_PLEX_ON_WORK_TEST_HOST_HOLD__scene773',
  774:'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_SERVICE_PLEX_OFF_WORK_TEST_HOST_HOLD__scene774',
};
const r32hSceneNames = {
  814:'Ylisrinne_R32_HALLFACE_SW04SW05_BOTH_NORMAL_HALLFACE_WORK_TEST_HOST_HOLD__scene814',
  815:'Ylisrinne_R32_HALLFACE_SW04SW05_BOTH_SERVICE_HALLFACE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene815',
  816:'Ylisrinne_R32_HALLFACE_SW04SW05_2F_NORMAL_HALLFACE_WORK_TEST_HOST_HOLD__scene816',
  817:'Ylisrinne_R32_HALLFACE_SW04SW05_2F_SERVICE_HALLFACE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene817',
};
const rootCounts = {759:495,760:494,769:499,770:498,771:204,772:203,773:204,774:203,814:500,815:499,816:204,817:203};
const normalScenes = new Set([759,769,771,773]);
const card = Object.freeze({
 id:R300_OWNER_CARD_REF,title:'Suojattu R300-kohdekortti',
 status:'WORK_TEST / HOST_HOLD',facts:[
  {label:'Viimeinen huolto',value:'Ei tiedossa',kind:'unverified',evidence:'NOT_VERIFIED'},
 ],sources:[],notes:[],conflicts:[],
});
const protectedEvidence={state:'matched',cards:[card]};

function fixture(sha=R300_OWNER_GLB_SHA256,sceneIndex=759){
 const r32h=sha===R300_OWNER_R32H_GLB_SHA256;
 const latest=sha===R300_OWNER_R31_774_GLB_SHA256;
 const newer=latest || sha===R300_OWNER_R31_772_GLB_SHA256;
 const scenes=Array.from({length:r32h?818:latest?775:newer?773:761},()=>({name:'unrelated',nodes:[]}));
 const nodes=Array.from({length:r32h?13840:latest?13510:newer?13507:13495},()=>({}));
 const meshes=Array.from({length:r32h?5237:latest?5171:newer?5169:5165},()=>({}));
 const name=r32h ? r32hSceneNames[sceneIndex] : latest
  ? (latestSceneNames[sceneIndex] ?? newSceneNames[sceneIndex] ?? oldSceneNames[sceneIndex])
  : (newer?newSceneNames:oldSceneNames)[sceneIndex];
 const plexi=(r32h && (sceneIndex===814 || sceneIndex===816)) ||
   (latest && normalScenes.has(sceneIndex));
 scenes[sceneIndex]={name,nodes:[13488,...(plexi?[11625]:[]),
  ...Array.from({length:rootCounts[sceneIndex] - 1 - Number(plexi)},(_,i)=>i)]};
 nodes[13488]={name:'NIBE_COMPACT_R300_FRONT_NORTH_WC_WORK_TEST_HOST_HOLD',children:[13487,13429,13430]};
 nodes[13487]={name:'R300_CASING_TURNED_180_TO_FACE_WC',children:Array.from({length:10},(_,i)=>13415+i)};
 for(let i=0;i<10;i++)nodes[13415+i]={
  name:`R300_OWNER_OPTION__H32_NIBE_R300_LEAF_${i}_WORK_TEST`,mesh:4368+i,
 };
 const scene={name,children:[]};
 const root={name:nodes[13488].name,parent:scene};
 const casing={name:nodes[13487].name,parent:root};
 const leaf={isMesh:true,name:nodes[13415].name,parent:casing};
 const gltf={scenes,parser:{json:{scene:292,scenes,nodes,meshes,asset:{
  extras:{ModelStage:'WORK_TEST',asBuilt:false,current:false,HUMAN_REVIEW:'NOT_RUN'},
 }},associations:new Map([
  [root,{nodes:13488}],[casing,{nodes:13487}],[leaf,{nodes:13415,meshes:4368}],
 ])}};
 const originalSceneDef=scenes[sceneIndex];
 scene.nodes=originalSceneDef.nodes;
 gltf.scenes[sceneIndex]=scene;
 return {gltf,loadedGlbSha256:sha,mountedScene:scene,selectedObject:leaf,protectedEvidence};
}
test('one protected source card is preserved for three exact SHAs and all eight successor scenes',()=>{
 for(const [sha,scenes] of [[R300_OWNER_GLB_SHA256,[759,760]],[R300_OWNER_R31_772_GLB_SHA256,[769,770,771,772]],
   [R300_OWNER_R31_774_GLB_SHA256,[759,760,769,770,771,772,773,774]]]){
  for(const scene of scenes){
   const result=resolve(fixture(sha,scene));
   assert.equal(result.state,'matched',`scene ${scene}`);
   assert.equal(result.cards[0],card);
   assert.match(result.version,new RegExp('scene '+scene));
   assert.equal(result.cards[0].facts[0].value,'Ei tiedossa');
  }
 }
});
test('SHA, genuine scene mount and runtime association path are mandatory',()=>{
 const f=fixture();
 assert.equal(resolve({...f,loadedGlbSha256:'0'.repeat(64)}),null);
 assert.equal(resolve({...f,mountedScene:{}}),null);
 const otherScene=fixture();
 assert.equal(resolve({...otherScene,mountedScene:otherScene.gltf.scenes[760]}).state,'unbound',
   'a stale selection from scene759 must not pass while scene760 is mounted');
 assert.equal(resolve({...f,selectedObject:{isMesh:true,name:'UI_HELPER'}}),null);
 const wrongParent=fixture();
 wrongParent.gltf.parser.associations.set(wrongParent.selectedObject.parent,{nodes:13429});
 assert.equal(resolve(wrongParent).state,'unbound');
 const wrongMesh=fixture();
 wrongMesh.gltf.parser.associations.set(wrongMesh.selectedObject,{nodes:13415,meshes:4424});
 assert.equal(resolve(wrongMesh).state,'unbound');
 const wrongSourceName=fixture();
 wrongSourceName.selectedObject.name='SOME_OTHER_MODEL';
 assert.equal(resolve(wrongSourceName).state,'unbound');
});
test('missing protected provider and other object types fail closed without invented data',()=>{
 const f=fixture();
 assert.equal(resolve({...f,protectedEvidence:{state:'unavailable',cards:[]}}).state,'unavailable');
 assert.equal(resolve({...f,protectedEvidence:{state:'matched',cards:[{...card,id:'WRONG'}]}}).state,'unavailable');
 assert.equal(resolve({...f,selectedObject:{...f.selectedObject,isMesh:false}}).state,'unbound');
 const overlay=fixture();
 const fake={isMesh:true,name:'FAKE_OVERLAY',parent:overlay.selectedObject};
 assert.equal(resolve({...overlay,selectedObject:fake}).state,'unbound');
});

test('latest 773/774 require the precise source profile, plexi role and selected casing',()=>{
 for (const sceneIndex of [773,774]) {
  const f=fixture(R300_OWNER_R31_774_GLB_SHA256,sceneIndex);
  assert.equal(resolve(f).state,'matched');
  assert.equal(resolve({...f,loadedGlbSha256:R300_OWNER_R31_772_GLB_SHA256}),null);
  f.gltf.parser.json.scenes[sceneIndex].name='UNRELATED_SCENE';
  assert.equal(resolve(f).state,'unbound');
  f.gltf.parser.json.scenes[sceneIndex].name=latestSceneNames[sceneIndex];
  const roots=f.gltf.parser.json.scenes[sceneIndex].nodes;
  if (sceneIndex===773) roots.splice(roots.indexOf(11625),1,42);
  else roots[1]=11625;
  assert.equal(resolve(f).state,'unbound','plexi root cannot change normal/service role');
 }
});

test('canonical R32H original SHA accepts only ten R300 casing leaves across BOTH and 2F normal/service scenes',()=>{
 for (const sceneIndex of [814,815,816,817]) {
  for (let leaf=13415;leaf<=13424;leaf++) {
   const f=fixture(R300_OWNER_R32H_GLB_SHA256,sceneIndex);
   const associations=f.gltf.parser.associations;
   const oldLeaf=f.selectedObject;
   const newLeaf={isMesh:true,name:`R300_OWNER_OPTION__H32_NIBE_R300_LEAF_${leaf-13415}_WORK_TEST`,parent:oldLeaf.parent};
   associations.delete(oldLeaf);
   associations.set(newLeaf,{nodes:leaf,meshes:4368+leaf-13415});
   f.gltf.parser.json.nodes[leaf]={name:newLeaf.name,mesh:4368+leaf-13415};
   assert.equal(resolve({...f,selectedObject:newLeaf}).state,'matched',
    `R32H scene ${sceneIndex} source node ${leaf}`);
  }
 }
});

test('R32H must fail closed on wrong SHA, scene/root/plexi or GLTFLoader parent/mesh',()=>{
 const f=fixture(R300_OWNER_R32H_GLB_SHA256,814);
 assert.equal(resolve(f).state,'matched');
 assert.equal(resolve({...f,loadedGlbSha256:R300_OWNER_R31_774_GLB_SHA256}),null);
 assert.equal(resolve({...f,mountedScene:{name:f.mountedScene.name}}),null);
 const wrongSource=fixture(R300_OWNER_R32H_GLB_SHA256,814);
 wrongSource.gltf.parser.json.scenes[814].name+='-UNVERIFIED';
 assert.equal(resolve(wrongSource).state,'unbound');
 const wrongPlexi=fixture(R300_OWNER_R32H_GLB_SHA256,815);
 wrongPlexi.gltf.parser.json.scenes[815].nodes[1]=11625;
 assert.equal(resolve(wrongPlexi).state,'unbound');
 const wrongRoots=fixture(R300_OWNER_R32H_GLB_SHA256,816);
 wrongRoots.gltf.parser.json.scenes[816].nodes.shift();
 assert.equal(resolve(wrongRoots).state,'unbound');
 const wrongParent=fixture(R300_OWNER_R32H_GLB_SHA256,817);
 wrongParent.gltf.parser.associations.set(wrongParent.selectedObject.parent,{nodes:13429});
 assert.equal(resolve(wrongParent).state,'unbound');
 const wrongMesh=fixture(R300_OWNER_R32H_GLB_SHA256,814);
 wrongMesh.gltf.parser.associations.set(wrongMesh.selectedObject,{nodes:13415,meshes:4424});
 assert.equal(resolve(wrongMesh).state,'unbound');
 const wrongEvidence=fixture(R300_OWNER_R32H_GLB_SHA256,815);
 wrongEvidence.protectedEvidence={state:'matched',cards:[{...card,id:'OTHER_CARD'}]};
 assert.equal(resolve(wrongEvidence).state,'unavailable');
});

test('unrelated R32H building selections preserve existing protected source cards',()=>{
 const f=fixture(R300_OWNER_R32H_GLB_SHA256,814);
 const root={name:'OTHER_BUILDING_SOURCE',parent:f.mountedScene};
 const mesh={isMesh:true,name:'OTHER_WALL',parent:root};
 f.gltf.parser.associations.set(root,{nodes:12437});
 f.gltf.parser.associations.set(mesh,{nodes:12438,meshes:5000});
 const old={state:'matched',cards:[{id:'EXISTING_WALL_PROTECTED_CARD'}]};
 const result=resolve({...f,selectedObject:mesh,protectedEvidence:old});
 assert.equal(result,null);
 assert.equal((result??old).cards[0].id,'EXISTING_WALL_PROTECTED_CARD');
});
