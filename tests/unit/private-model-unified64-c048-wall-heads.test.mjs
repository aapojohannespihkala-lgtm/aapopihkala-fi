import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnified64C048WallHeadsPresentation, C048_U64_SOURCE_SHA }
  from '../../src/scripts/privateModelUnified64C048WallHeadsPresentation.mjs';

const heads = [
  [60,1486,425,65,'D1F_V11_OPENING_HEAD_VH_WEST'],
  [60,1487,426,66,'D1F_V11_OPENING_HEAD_VH_NORTH'],
  [63,410,425,65,'D1F_V11_OPENING_HEAD_VH_WEST'],
  [63,411,426,66,'D1F_V11_OPENING_HEAD_VH_NORTH'],
];
function fakeMaterial({opacity,transparent,white=false}) {
  return {
    opacity,transparent,color:white?{r:.93,g:.93,b:.93}:null,
    disposed:false,
    clone(){return fakeMaterial({opacity:this.opacity,transparent:this.transparent,white:!!this.color});},
    dispose(){this.disposed=true;},
  };
}
function fixture() {
  const associations=new Map();
  const originalWhite=fakeMaterial({opacity:1,transparent:false,white:true});
  const originalTint=fakeMaterial({opacity:.83,transparent:true});
  const scenes=Array.from({length:64},()=>({children:[],traverse(fn){
    for(const obj of this.children) fn(obj);
  }}));
  const nodes=Array.from({length:6518},()=>({}));
  const meshes=Array.from({length:1873},()=>({primitives:[]}));
  const materials=Array.from({length:344},()=>({}));
  for(const [mi,mat] of [[425,65],[426,66],[1835,335]]) {
    meshes[mi]={primitives:[{material:mat}]};
  }
  for(const mat of [65,66]) {
    materials[mat]={alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[.93,.79,.51,.83]}};
  }
  for(const [scene,index] of [[60,6379],[63,6394]]) {
    nodes[index]={mesh:1835,name:'HI06_NORTH_APERTURED_FACADE'};
    const obj={name:nodes[index].name,isMesh:true,material:originalWhite,parent:scenes[scene]};
    associations.set(obj,{nodes:index});
    scenes[scene].children.push(obj);
  }
  const selected=[];
  for(const [si,id,mi,mat,name] of heads) {
    nodes[id]={mesh:mi,name,extras:{representationKind:'wallContinuationVisualProxy',sourceLinks:[{docId:'source1'},{docId:'source2'}],modelStage:'WORK_TEST'}};
    const mesh={name,isMesh:true,material:originalTint,geometry:{},parent:scenes[si]};
    associations.set(mesh,{nodes:id});
    scenes[si].children.push(mesh);
    selected.push(mesh);
  }
  return {gltf:{scenes,parser:{associations,json:{
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array(64).fill({}),nodes,meshes,materials,
  }}},selected,originalWhite,originalTint};
}
test('four exact V11 heads turn white, source materials and geometry remain untouched',()=>{
  const f=fixture(),api=createUnified64C048WallHeadsPresentation(f.gltf,C048_U64_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.count,4);
  assert.equal(api.setEnabled(true),true);
  for(const mesh of f.selected) {
    assert.notEqual(mesh.material,f.originalTint);
    assert.deepEqual(mesh.material.color,{r:.93,g:.93,b:.93});
    assert.equal(mesh.material.opacity,1);
    assert.equal(mesh.material.transparent,false);
  }
  assert.equal(f.originalTint.opacity,.83);
  assert.equal(f.originalTint.transparent,true);
  assert.equal(f.originalWhite.opacity,1);
  assert.equal(api.setEnabled(false),true);
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
  api.setEnabled(true);
  api.dispose();
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
});
test('fail closed for wrong GLB, mutated material or missing source object',()=>{
  const f=fixture();
  assert.equal(createUnified64C048WallHeadsPresentation(f.gltf,'not-the-exact-SHA').available,false);
  f.gltf.parser.json.materials[66].alphaMode='OPAQUE';
  assert.equal(createUnified64C048WallHeadsPresentation(f.gltf,C048_U64_SOURCE_SHA).available,false);
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
  f.gltf.parser.json.materials[66].alphaMode='BLEND';
  f.gltf.parser.associations.delete(f.selected[0]);
  assert.equal(createUnified64C048WallHeadsPresentation(f.gltf,C048_U64_SOURCE_SHA).available,false);
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
});
test('64-scene identity mismatch and mutated provenance fail closed',()=>{
  const f=fixture();
  f.gltf.parser.json.scenes.pop();
  assert.equal(createUnified64C048WallHeadsPresentation(f.gltf,C048_U64_SOURCE_SHA).available,false);
  f.gltf.parser.json.scenes.push({});
  f.gltf.parser.json.nodes[1486].extras.sourceLinks=[];
  assert.equal(createUnified64C048WallHeadsPresentation(f.gltf,C048_U64_SOURCE_SHA).available,false);
});
