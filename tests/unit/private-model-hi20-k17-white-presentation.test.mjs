import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20K17WhitePresentation,K17_WHITE_SOURCE_SHA}
  from '../../src/scripts/privateModelHi20K17WhitePresentation.mjs';

function material(white=false) {
  return {
    color:white?{r:.93,g:.93,b:.93}:{r:.72,g:.61,b:.49},
    transparent:false,opacity:1,depthWrite:true,disposed:false,
    clone(){return material(true);},
    dispose(){this.disposed=true;},
  };
}
function fixture() {
  const nodes=Array.from({length:6463},()=>({}));
  const meshes=Array.from({length:1859},()=>({primitives:[]}));
  const scenes=Array.from({length:52},()=>({
    children:[],traverse(fn){for(const obj of this.children) fn(obj);},
  }));
  const associations=new Map(),objects=new Map();
  for(const [sceneId,parent,ref,ids] of [
    [48,6445,6432,[6443,6444]],
    [51,6450,6438,[6448,6449]],
  ]) {
    nodes[parent]={name:'K7E_D2F_NINE_WALLS_SOUTH_SHIFTED_SUBROOT_K17_1125_COW',children:ids};
    nodes[ref]={mesh:1850,extras:{physicalWall:true,workTestC80_043:{ownerConfirmedWhite:true}}};
    meshes[1850]={primitives:[{material:340}]};
    const scene=scenes[sceneId];
    const white={isMesh:true,material:material(true),visible:true,parent:scene};
    scene.children.push(white);associations.set(white,{nodes:ref});objects.set(ref,white);
    ids.forEach((id,i)=>{
      const mesh=1855+i;
      nodes[id]={
        name:'D2015_2F_WALL3D_LOWWALL_STAIR_A_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST',
        mesh,extras:{representationKind:'wall3DPresentationProxy',
          ModelStage:'WORK_TEST',sourceLinks:[{role:'primary'},{role:'support'},{role:'support'}]},
      };
      meshes[mesh]={primitives:[{material:227}]};
      const obj={isMesh:true,material:material(),visible:true,
        geometry:{originalNode:id},parent:scene};
      scene.children.push(obj);associations.set(obj,{nodes:id});objects.set(id,obj);
    });
  }
  const gltf={scenes,parser:{associations,json:{
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:52},()=>({})),nodes,meshes,
    materials:Array.from({length:341},(_,i)=>i===340?{
      alphaMode:'OPAQUE',
      pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1]},
    }:{}),
  }}};
  return {gltf,objects};
}
test('2F and BOTH each recolor only the two verified K17 leaves and restore them',()=>{
  const f=fixture(),original=new Map([...f.objects].map(([id,o])=>[id,o.material]));
  const api=createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA);
  assert.equal(api.available,true);assert.equal(api.count,4);
  assert.equal(api.setEnabled(true),true);
  assert.equal(api.setEnabled(true),true);
  for(const id of [6443,6444,6448,6449]){
    const obj=f.objects.get(id);
    assert.notEqual(obj.material,original.get(id));
    assert.equal(obj.material.color.r,.93);
    assert.equal(obj.geometry.originalNode,id);
    assert.equal(obj.visible,true);
    assert.equal(f.gltf.parser.json.nodes[id].mesh,[6443,6448].includes(id)?1855:1856);
  }
  for(const id of [6432,6438]) assert.equal(f.objects.get(id).material,original.get(id));
  api.setEnabled(false);
  for(const [id,obj] of f.objects) assert.equal(obj.material,original.get(id));
  api.setEnabled(true);api.dispose();
  for(const [id,obj] of f.objects) assert.equal(obj.material,original.get(id));
});
test('wrong SHA, missing child/sourceLink/material/association fail without partial change',()=>{
  const f=fixture(),n=f.gltf.parser.json.nodes;
  assert.equal(createHi20K17WhitePresentation(f.gltf,'other').available,false);
  n[6450].children.pop();
  assert.equal(createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA).available,false);
  n[6450].children.push(6449);
  n[6448].extras.sourceLinks=[];
  assert.equal(createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA).available,false);
  n[6448].extras.sourceLinks=[{},{},{}];
  f.gltf.parser.json.meshes[1855].primitives[0].material=999;
  assert.equal(createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA).available,false);
  f.gltf.parser.json.meshes[1855].primitives[0].material=227;
  f.gltf.parser.associations.delete(f.objects.get(6449));
  assert.equal(createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA).available,false);
  assert.equal(f.objects.get(6443).material.color.r,.72);
});
test('clone failure has no partial material mutation',()=>{
  const f=fixture(),ref=f.objects.get(6438);
  ref.material.clone=()=>{throw Error('simulated clone error');};
  const api=createHi20K17WhitePresentation(f.gltf,K17_WHITE_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setEnabled(true),false);
  assert.equal(f.objects.get(6443).material.color.r,.72);
  assert.equal(f.objects.get(6448).material.color.r,.72);
});
