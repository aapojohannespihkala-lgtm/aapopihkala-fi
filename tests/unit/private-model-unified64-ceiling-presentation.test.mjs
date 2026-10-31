import test from 'node:test';
import assert from 'node:assert/strict';
import {createC80R2Unified64CeilingPresentation,C030_U64_SOURCE_SHA}
  from '../../src/scripts/privateModelUnified64CeilingPresentation.mjs';
const ids={60:[6419,6420,6421,6497],63:[6423,6424,6425,6498]};
const names={
  6419:'HI20_D1F_WP6_C80_030_1F_WC_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6419',
  6420:'HI20_D1F_WP6_C80_030_1F_KPH_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6420',
  6421:'HI20_D1F_WP6_C80_030_1F_SAUNA_GHOST_PRESENTATION_ALPHA10__REBASED_ON_HI20_44SCENE_AS_6421',
  6497:'C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_1F_NONPHYSICAL_OPTIN',
  6423:'HI20_D1F_WP6_C80_030_BOTH_WC_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6423',
  6424:'HI20_D1F_WP6_C80_030_BOTH_KPH_GHOST_PRESENTATION_ALPHA18__REBASED_ON_HI20_44SCENE_AS_6424',
  6425:'HI20_D1F_WP6_C80_030_BOTH_SAUNA_GHOST_PRESENTATION_ALPHA10__REBASED_ON_HI20_44SCENE_AS_6425',
  6498:'C80_030_D1F_WP6_REMAINING_ROOMS_REFERENCE_CEILING_ALPHA012_BOTH_NONPHYSICAL_OPTIN',
};
function fixture(){
 const nodes=Array.from({length:6518},()=>({}));
 const meshes=Array.from({length:1873},()=>({}));
 const materials=Array.from({length:344},()=>({}));
 for(const [id,alpha] of [[338,.18],[339,.10],[343,.12]]){
   materials[id]={alphaMode:'BLEND',doubleSided:true,
     pbrMetallicRoughness:{baseColorFactor:[.86,.89,.91,alpha]}};
 }
 const scenes=Array.from({length:64},()=>({children:[],add(){},remove(){}}));
 const sj=Array.from({length:64},()=>({nodes:[]}));
 const associations=new Map();
 for(const scene of [60,63]){
   sj[scene].extras={stage:'WORK_TEST'};
   for(const id of ids[scene]){
     const mesh=id===6497||id===6498?1860:(id===6419||id===6423?1846:id===6420||id===6424?1847:1848);
     const mat=mesh===1860?343:mesh===1848?339:338;
     nodes[id]={mesh,name:names[id],extras:mesh===1860?
       {presentationOnly:true,physical:false,observation:'C80-030'}:{}};
     meshes[mesh]={primitives:[{material:mat}]};
     sj[scene].nodes.push(id);
     const obj={name:names[id],isMesh:true,visible:true};
     scenes[scene].children.push(obj);associations.set(obj,{nodes:id});
   }
 }
 const json={asset:{version:'2.0',extras:{asBuilt:false,current:false}},
   scene:0,scenes:sj,nodes,meshes,materials};
 return {scenes,parser:{json,associations}};
}
test('C030 U64 exact node/mat toggle affects only 1F and BOTH, reversible',()=>{
 const gltf=fixture(),original=gltf.scenes[60].children.slice();
 const state=createC80R2Unified64CeilingPresentation(gltf,C030_U64_SOURCE_SHA);
 assert.equal(state.available,true,state.reason);
 assert.equal(state.count,8);
 assert.equal(state.enabled,true);
 assert.ok(state.setEnabled(false));
 assert.equal(state.enabled,false);
 assert.ok(gltf.scenes[60].children.every(x=>!x.visible));
 assert.ok(gltf.scenes[63].children.every(x=>!x.visible));
 assert.equal(gltf.scenes[62].children.length,0);
 assert.ok(state.setEnabled(true));
 assert.ok(gltf.scenes[60].children.every(x=>x.visible));
 state.setEnabled(false);
 state.dispose();state.dispose();
 assert.equal(state.setEnabled(true),false);
 assert.ok(gltf.scenes[60].children.every(x=>x.visible));
 assert.deepEqual(gltf.scenes[60].children,original);
 assert.equal(gltf.parser.json.nodes[6497].mesh,1860);
});
test('fails closed for wrong SHA, missing selected ceiling or material mismatch',()=>{
 const gltf=fixture();
 assert.equal(createC80R2Unified64CeilingPresentation(gltf,'wrong').available,false);
 gltf.scenes[60].children.pop();
 assert.equal(createC80R2Unified64CeilingPresentation(gltf,C030_U64_SOURCE_SHA).available,false);
 gltf.scenes[60].children.push({name:names[6497],isMesh:true,visible:true});
 gltf.parser.json.materials[343].pbrMetallicRoughness.baseColorFactor[3]=1;
 assert.equal(createC80R2Unified64CeilingPresentation(gltf,C030_U64_SOURCE_SHA).available,false);
});
test('does not allow hidden physical sources to be toggled as C030 ceiling',()=>{
 const gltf=fixture();
 gltf.parser.json.nodes[6497].extras.physical=true;
 assert.equal(createC80R2Unified64CeilingPresentation(gltf,C030_U64_SOURCE_SHA).available,false);
});
