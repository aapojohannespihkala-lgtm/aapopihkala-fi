import test from 'node:test';
import assert from 'node:assert/strict';
import {createUnified64C024BalconyFloorPresentation,U64_C024_SOURCE_SHA,C024_FINISH_RGB}
  from '../../src/scripts/privateModelUnified64C024BalconyFloorPresentation.mjs';
function fixture() {
 const nodes=Array.from({length:5632},()=>({}));
 const scenes=Array.from({length:64},()=>({nodes:[]}));
 const world=Array.from({length:64},()=>({objects:[],traverse(fn){for(const o of this.objects)fn(o);}}));
 const a=new Map(),found=[];
 const mesh={name:'C80_024_D_BALCONY_2F_FLOOR_FINISH_SURFACE_G1_WORK_TEST',
  extras:{surfaceOnly:true,thicknessM:null,asBuilt:false,current:false,layerOwnership:'D2F_BALCONY_C80_024'},
  primitives:[{attributes:{POSITION:2799},indices:2800,material:216}]};
 const materials=Array.from({length:217},()=>({}));
 materials[216]={name:'HI02_C80-015_2F_FLOOR_PALE_NEUTRAL_WORK_TEST',
  alphaMode:'OPAQUE',doubleSided:true,extras:{presentationColorOnly:true},
  pbrMetallicRoughness:{baseColorFactor:[.78,.76,.72,1]}};
 const xyz=[[.22,2.76,0],[6.24,2.76,0],[6.24,2.76,1.565],[.22,2.76,1.565]];
 const corners={count:4,getX:i=>xyz[i][0],getY:i=>xyz[i][1],getZ:i=>xyz[i][2]};
 const index={count:6,getX:i=>[0,2,1,0,3,2][i]};
 const geo={getAttribute:n=>n==='position'?corners:null,index};
 function material(){
  const m={color:{setRGB(...v){this.rgb=v;}},clone:material,dispose(){this.disposed=true;}};
  return m;
 }
 for(const t of [{scene:62,node:5631,code:'SCENE2'},{scene:63,node:5630,code:'SCENE0'}]){
  const name='C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_'+t.code+'_WORK_TEST';
  nodes[t.node]={mesh:1664,name,extras:{
    changeId:'C80-024-D2F-WP3-HI12-BALCONY-FLOOR-20261029',
    stage:'WORK_TEST',sourceOnly:false,current:false,asBuilt:false,
    hostQuality:'WORK_ASSUMPTION_HISTORICAL_PLAN_AND_KNOWN_GLAZING_ENVELOPE',
    sourceLinks:[{docId:'1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI'},
      {driveId:'1Re8SKp3Uwxnb3jh-DZdDBlpOdJRQLECG'}]}};
  scenes[t.scene].nodes=[t.node];
  const obj={name,isMesh:true,visible:true,geometry:geo,material:material()};
  world[t.scene].objects.push(obj);
  a.set(obj,{nodes:t.node});found.push(obj);
 }
 const j={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,scenes,nodes,
   meshes:Array.from({length:1664},()=>({})).concat([mesh]),materials};
 return {gltf:{parser:{json:j,associations:a},scenes:world},objects:found};
}
test('only 2F and BOTH balcony floor gets photo-derived dark finish, reversible',()=>{
 const {gltf,objects}=fixture(),originals=objects.map(o=>o.material);
 const o=createUnified64C024BalconyFloorPresentation(gltf,U64_C024_SOURCE_SHA);
 assert.equal(o.available,true,o.reason);assert.equal(o.count,2);
 assert.equal(o.setEnabled(true),true);assert.equal(o.enabled,true);
 objects.forEach((obj,i)=>{
  assert.notEqual(obj.material,originals[i]);assert.deepEqual(obj.material.color.rgb,C024_FINISH_RGB);
  assert.equal(obj.geometry,objects[0].geometry);
 });
 assert.equal(gltf.parser.json.materials[216].pbrMetallicRoughness.baseColorFactor[0],.78);
 assert.equal(o.setEnabled(true),true);
 o.dispose();
 objects.forEach((obj,i)=>assert.equal(obj.material,originals[i]));
 assert.equal(o.enabled,false);
});
test('wrong source, metadata, floor geometry or photograph-independent host fails closed',()=>{
 for(const tweak of [
   g=>g.parser.json.scenes[62].nodes=[],
   g=>g.parser.json.nodes[5630].mesh=1551,
   g=>g.parser.json.nodes[5631].extras.sourceLinks=[],
   g=>g.parser.json.nodes[5631].extras.hostQuality='CURRENT',
   g=>g.parser.json.materials[216].pbrMetallicRoughness.baseColorFactor[0]=.11,
   g=>g.scenes[63].objects[0].visible=false,
   g=>g.scenes[62].objects[0].geometry.getAttribute=()=>({count:5}),
 ]){
  const {gltf,objects}=fixture(),saved=objects.map(o=>o.material);
  tweak(gltf);
  const o=createUnified64C024BalconyFloorPresentation(gltf,U64_C024_SOURCE_SHA);
  assert.equal(o.available,false,o.reason);
  objects.forEach((obj,i)=>assert.equal(obj.material,saved[i]));
 }
 assert.equal(createUnified64C024BalconyFloorPresentation(fixture().gltf,'wrong SHA').available,false);
});
