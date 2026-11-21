import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R300_OWNER_GLB_SHA256,
  R300_OWNER_R31_772_GLB_SHA256,
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
const rootCounts = {759:495,760:494,769:499,770:498,771:204,772:203};
const card = Object.freeze({
 id:R300_OWNER_CARD_REF,title:'Suojattu R300-kohdekortti',
 status:'WORK_TEST / HOST_HOLD',facts:[
  {label:'Viimeinen huolto',value:'Ei tiedossa',kind:'unverified',evidence:'NOT_VERIFIED'},
 ],sources:[],notes:[],conflicts:[],
});
const protectedEvidence={state:'matched',cards:[card]};

function fixture(sha=R300_OWNER_GLB_SHA256,sceneIndex=759){
 const newer=sha===R300_OWNER_R31_772_GLB_SHA256;
 const scenes=Array.from({length:newer?773:761},()=>({name:'unrelated',nodes:[]}));
 const nodes=Array.from({length:newer?13507:13495},()=>({}));
 const meshes=Array.from({length:newer?5169:5165},()=>({}));
 const name=(newer?newSceneNames:oldSceneNames)[sceneIndex];
 scenes[sceneIndex]={name,nodes:[13488,...Array.from({length:rootCounts[sceneIndex]-1},(_,i)=>i)]};
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
test('one protected source card is preserved for old normal/service and latest 4 scenes',()=>{
 for(const [sha,scenes] of [[R300_OWNER_GLB_SHA256,[759,760]],[R300_OWNER_R31_772_GLB_SHA256,[769,770,771,772]]]){
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
 assert.equal(resolve({...f,selectedObject:{isMesh:true,name:'UI_HELPER'}}).state,'unbound');
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
