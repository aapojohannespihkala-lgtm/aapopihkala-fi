import test from 'node:test';
import assert from 'node:assert/strict';
import {createUnified64C020BoardPresentation,C020_U64_BOARD_SOURCE_SHA} from '../../src/scripts/privateModelUnified64C020BoardPresentation.mjs';
const names=['C80_020_HI14_2F_BOARDING_WORK_TEST_NONCURRENT','C80_020_HI14_BOTH_BOARDING_WORK_TEST_NONCURRENT'];
function geom(){
  const positions=[],indices=[];
  for(let board=0;board<8;board++)for(let quad=0;quad<6;quad++){
    const x=board+quad*.12,z=quad*.1,i=positions.length;
    positions.push([x,0,z],[x+.1,0,z],[x,.1,z],[x+.1,.1,z]);
    indices.push(...(quad===0?[i,i+2,i+1,i+1,i+2,i+3]:[i,i+1,i+2,i+1,i+3,i+2]));
  }
  const p={count:192,getX:i=>positions[i][0],getY:i=>positions[i][1],getZ:i=>positions[i][2]};
  return {index:{count:288,getX:i=>indices[i]},getAttribute:n=>n==='position'?p:null,
    clone(){return geom();},setIndex(v){this.index={count:v.length,getX:i=>v[i]};},
    clearGroups(){this.groups=[];},addGroup(start,count,materialIndex){this.groups.push({start,count,materialIndex});},
    dispose(){this.disposed=true;}};
}
function fixture(){
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,
    scenes:Array.from({length:64},()=>({nodes:[]})),nodes:Array.from({length:5798},()=>({})),
    meshes:Array.from({length:1737},(_,i)=>i===1736?{
      name:'C80_020_HI14_8_LOWER_GLAZING_BOARD_SLATS_WORK_TEST',
      primitives:[{attributes:{POSITION:2881,NORMAL:2882},indices:2883,material:285}],
      extras:{physicalHost:'HOST_HOLD',current:false}}:{}),
    materials:Array.from({length:286},(_,i)=>i===285?{
      name:'C80_020_BALCONY_BOTTOM_DARK_BOARD_WORK_ASSUMPTION',
      pbrMetallicRoughness:{baseColorFactor:[.29,.25,.21,1]}}:{})};
  const scenes=Array.from({length:64},()=>({objects:[],traverse(fn){this.objects.forEach(fn);}}));
  const associations=new Map(),objects=[];
  [5795,5797].forEach((node,i)=>{
    const sc=i===0?62:63;
    json.nodes[node]={name:names[i],mesh:1736,extras:{physicalHost:'HOST_HOLD',sourceOnly:true,current:false,asBuilt:false}};
    json.scenes[sc].nodes.push(node);
    const material={color:{setRGB(...v){this.rgb=v;}},clone(){return {color:{setRGB(...v){this.rgb=v;}},dispose(){this.disposed=true;}}}};
    const obj={name:names[i],isMesh:true,visible:true,geometry:geom(),material};
    scenes[sc].objects.push(obj);associations.set(obj,{nodes:node});objects.push(obj);
  });
  return {gltf:{scenes,parser:{json,associations}},objects};
}
test('source-locked 2F and BOTH material split changes only inner 16 triangles, reversible',()=>{
  const {gltf,objects}=fixture();
  const source=objects.map(o=>({geometry:o.geometry,material:o.material}));
  const r=createUnified64C020BoardPresentation(gltf,C020_U64_BOARD_SOURCE_SHA);
  assert.equal(r.available,true);assert.equal(r.count,2);
  assert.equal(r.setEnabled(true),true);assert.equal(r.enabled,true);
  objects.forEach((o,i)=>{
    assert.notEqual(o.geometry,source[i].geometry);
    assert.equal(o.material[0],source[i].material);
    assert.deepEqual(o.material[1].color.rgb,[.78,.80,.76]);
    assert.deepEqual(o.geometry.groups,[{start:0,count:240,materialIndex:0},{start:240,count:48,materialIndex:1}]);
    assert.equal(source[i].geometry.index.count,288);
  });
  assert.equal(r.setEnabled(true),true);
  r.dispose();
  objects.forEach((o,i)=>{
    assert.equal(o.geometry,source[i].geometry);
    assert.equal(o.material,source[i].material);
  });
});
test('wrong SHA or scene topology rejects before writing',()=>{
  const {gltf,objects}=fixture(),original=objects[0].geometry;
  assert.equal(createUnified64C020BoardPresentation(gltf,'not-the-source').available,false);
  gltf.scenes[48].objects=[];
  assert.equal(createUnified64C020BoardPresentation(gltf,C020_U64_BOARD_SOURCE_SHA).available,false);
  assert.equal(objects[0].geometry,original);
});
test('source geometry with wrong triangle count fails closed',()=>{
  const {gltf,objects}=fixture();objects[1].geometry.index.count=9;
  assert.equal(createUnified64C020BoardPresentation(gltf,C020_U64_BOARD_SOURCE_SHA).available,false);
});

import {createUnified64C024BalconyFloorPresentation} from '../../src/scripts/privateModelUnified64C024BalconyFloorPresentation.mjs';

test('existing U64 C024 lifecycle activates C020 board finish and disposes without changing source objects',()=>{
 const {gltf,objects}=fixture(),j=gltf.parser.json;
 j.meshes[1664]={
   name:'C80_024_D_BALCONY_2F_FLOOR_FINISH_SURFACE_G1_WORK_TEST',
   extras:{surfaceOnly:true,thicknessM:null,asBuilt:false,current:false,layerOwnership:'D2F_BALCONY_C80_024'},
   primitives:[{attributes:{POSITION:2799},indices:2800,material:216}],
 };
 j.materials[216]={
   name:'HI02_C80-015_2F_FLOOR_PALE_NEUTRAL_WORK_TEST',alphaMode:'OPAQUE',
   doubleSided:true,extras:{presentationColorOnly:true},
   pbrMetallicRoughness:{baseColorFactor:[.78,.76,.72,1]}
 };
 const corners=[[.22,2.76,0],[6.24,2.76,0],[6.24,2.76,1.565],[.22,2.76,1.565]],ids=[0,2,1,0,3,2];
 for(const [scene,id,name] of [
   [62,5631,'C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_SCENE2_WORK_TEST'],
   [63,5630,'C80_024_D2F_WP3_BALCONY_FINISH_FLOOR_SCENE0_WORK_TEST']
 ]){
   j.nodes[id]={name,mesh:1664,extras:{
     changeId:'C80-024-D2F-WP3-HI12-BALCONY-FLOOR-20261029',stage:'WORK_TEST',
     sourceOnly:false,current:false,asBuilt:false,
     hostQuality:'WORK_ASSUMPTION_HISTORICAL_PLAN_AND_KNOWN_GLAZING_ENVELOPE',
     sourceLinks:[{docId:'1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI'},{driveId:'1Re8SKp3Uwxnb3jh-DZdDBlpOdJRQLECG'}],
   }};
   j.scenes[scene].nodes.push(id);
   const material={color:{setRGB(...v){this.rgb=v;}},clone(){return {color:{setRGB(...v){this.rgb=v;}},dispose(){this.disposed=true;}}}};
   const obj={isMesh:true,visible:true,name,material,
     geometry:{index:{count:6,getX:i=>ids[i]},getAttribute:k=>k==='position'?
       {count:4,getX:i=>corners[i][0],getY:i=>corners[i][1],getZ:i=>corners[i][2]}:null}};
   gltf.scenes[scene].objects.push(obj);
   gltf.parser.associations.set(obj,{nodes:id});
 }
 const originals=objects.map(o=>({material:o.material,geometry:o.geometry}));
 const presentation=createUnified64C024BalconyFloorPresentation(gltf,C020_U64_BOARD_SOURCE_SHA);
 assert.equal(presentation.available,true);
 assert.equal(presentation.c020PaleInnerBoardsApplied,true);
 assert.equal(presentation.c020PaleInnerBoardsCount,2);
 objects.forEach(o=>assert.equal(Array.isArray(o.material),true));
 assert.equal(presentation.setEnabled(true),true);
 presentation.dispose();
 objects.forEach((o,i)=>{
   assert.equal(o.material,originals[i].material);
   assert.equal(o.geometry,originals[i].geometry);
 });
});
