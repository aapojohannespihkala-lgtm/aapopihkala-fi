import assert from 'node:assert/strict';
import { test } from 'node:test';
import { C004_SOURCE_SHA, createUnified64C004SourceContextPresentation } from '../../src/scripts/privateModelUnified64C004SourceContextPresentation.mjs';
const targets = [
  [60,6499,5741,1485,183,.18,'C80_SOURCE_CONTEXT__1F_G1_GROUND_REFERENCE__C80_029_HI13_CLONE'],
  [60,6499,5743,1657,182,.30,'C80_SOURCE_CONTEXT__1F_K3_SHARED_DC_CONTEXT__C80_029_HI13_CLONE'],
  [63,6500,5759,1485,183,.18,'C80_SOURCE_CONTEXT__1F_G1_GROUND_REFERENCE__C80_029_HI13_CLONE'],
  [63,6500,5761,1657,182,.30,'C80_SOURCE_CONTEXT__1F_K3_SHARED_DC_CONTEXT__C80_029_HI13_CLONE'],
  [63,6500,5763,1721,184,.13,'C80_SOURCE_CONTEXT__ATTIC_K14_GABLE_CONTEXT__C80_029_HI13_CLONE'],
  [63,6500,5764,1500,184,.13,'C80_SOURCE_CONTEXT__ATTIC_SHARED_DC_CONTEXT__C80_029_HI13_CLONE'],
];
const source = () => {
  const nodes=Array.from({length:6518},()=>({})), meshes=Array.from({length:1873},()=>({primitives:[]}));
  const materials=Array.from({length:342},()=>({}));
  const scenes=Array.from({length:64},()=>({nodes:[]}));
  const runtimeScenes=Array.from({length:64},()=>({traverse:()=>{}}));
  const associations=new Map(), objects=[];
  for(const [s,p,n,m,mat,alpha,name] of targets){
    scenes[s].nodes=[p];
    nodes[p]={children:[...targets.filter(t=>t[0]===s).map(t=>t[2])],
      extras:{sourceOnly:true,contextOnly:true}};
    nodes[n]={name,mesh:m,extras:{sourceOnly:true,presentationOnly:true,physicalHost:'HOST_HOLD'}};
    meshes[m]={primitives:[{material:mat}]};
    materials[mat]={alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[.5,.5,.5,alpha]}};
    const o={visible:true,name},obj={s,n,o}; objects.push(obj);associations.set(o,{nodes:n});
  }
  for(const s of [60,63]) runtimeScenes[s]={traverse:fn=>objects.filter(x=>x.s===s).forEach(x=>fn(x.o))};
  const json={scene:0,asset:{version:'2.0',extras:{current:false,asBuilt:false}},nodes,meshes,materials,scenes};
  return {gltf:{parser:{json,associations},scenes:runtimeScenes},objects};
};
test('C004: six exact context faces toggle OFF/ON, unrelated scene/site objects remain unchanged, dispose restores',()=>{
  const {gltf,objects}=source();
  const physical={visible:true};const terrain={visible:true};const tree={visible:true};const bedroomDoor={visible:true};
  const p=createUnified64C004SourceContextPresentation(gltf,C004_SOURCE_SHA);
  assert.equal(p.available,true);assert.equal(p.count,6);
  assert.deepEqual(p.setSourceContextVisible(false),{applied:true,visible:false,count:6});
  assert.ok(objects.every(x=>x.o.visible===false));
  assert.ok([physical,terrain,tree,bedroomDoor].every(x=>x.visible===true));
  assert.equal(p.setSourceContextVisible(true).applied,true);
  assert.ok(objects.every(x=>x.o.visible===true));
  p.dispose();assert.ok(objects.every(x=>x.o.visible===true));
  assert.equal(p.setSourceContextVisible(false).applied,false);
});
test('C004: wrong SHA, missing node, changed material or absent runtime association fails closed',()=>{
  for(const issue of ['sha','parent','material','association']){
    const {gltf,objects}=source();
    if(issue==='parent')gltf.parser.json.nodes[6499].children=[5741];
    if(issue==='material')gltf.parser.json.materials[184].alphaMode='OPAQUE';
    if(issue==='association')gltf.parser.associations.delete(objects[0].o);
    const p=createUnified64C004SourceContextPresentation(gltf,issue==='sha'?'wrong':C004_SOURCE_SHA);
    assert.equal(p.available,false,issue);
    assert.equal(p.setSourceContextVisible(false).applied,false);
    assert.ok(objects.every(x=>x.o.visible===true),issue);
  }
});
test('C004: OFF retains original already-hidden state on ON and dispose',()=>{
  const {gltf,objects}=source();objects[0].o.visible=false;
  const p=createUnified64C004SourceContextPresentation(gltf,C004_SOURCE_SHA);
  assert.equal(p.available,true);
  p.setSourceContextVisible(false);p.setSourceContextVisible(true);
  assert.equal(objects[0].o.visible,false);
  assert.ok(objects.slice(1).every(x=>x.o.visible));
  p.dispose();assert.equal(objects[0].o.visible,false);
});
