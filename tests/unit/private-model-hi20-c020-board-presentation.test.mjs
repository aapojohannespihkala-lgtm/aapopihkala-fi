import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C020BoardPresentation,C020_BOARD_SOURCE_SHA} from '../../src/scripts/privateModelHi20C020BoardPresentation.mjs';
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
    scenes:Array.from({length:52},()=>({nodes:[]})),nodes:Array.from({length:5798},()=>({})),
    meshes:Array.from({length:1737},(_,i)=>i===1736?{
      name:'C80_020_HI14_8_LOWER_GLAZING_BOARD_SLATS_WORK_TEST',
      primitives:[{attributes:{POSITION:2881,NORMAL:2882},indices:2883,material:285}],
      extras:{physicalHost:'HOST_HOLD',current:false}}:{}),
    materials:Array.from({length:286},(_,i)=>i===285?{
      name:'C80_020_BALCONY_BOTTOM_DARK_BOARD_WORK_ASSUMPTION',
      pbrMetallicRoughness:{baseColorFactor:[.29,.25,.21,1]}}:{})};
  const scenes=Array.from({length:52},()=>({objects:[],traverse(fn){this.objects.forEach(fn);}}));
  const associations=new Map(),objects=[];
  [5795,5797].forEach((node,i)=>{
    const sc=i===0?48:51;
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
  const r=createHi20C020BoardPresentation(gltf,C020_BOARD_SOURCE_SHA);
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
  assert.equal(createHi20C020BoardPresentation(gltf,'not-the-source').available,false);
  gltf.scenes[48].objects=[];
  assert.equal(createHi20C020BoardPresentation(gltf,C020_BOARD_SOURCE_SHA).available,false);
  assert.equal(objects[0].geometry,original);
});
test('source geometry with wrong triangle count fails closed',()=>{
  const {gltf,objects}=fixture();objects[1].geometry.index.count=9;
  assert.equal(createHi20C020BoardPresentation(gltf,C020_BOARD_SOURCE_SHA).available,false);
});
