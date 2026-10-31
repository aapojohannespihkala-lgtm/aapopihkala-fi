import test from 'node:test';
import assert from 'node:assert/strict';
import { createHi20C048WallHeadsPresentation, C048_SOURCE_SHA }
  from '../../src/scripts/privateModelHi20C048WallHeadPresentation.mjs';
import { createHi20C045Presentation }
  from '../../src/scripts/privateModelHi20C045Presentation.mjs';

const heads = [
  [50,1486,425,65,'D1F_V11_OPENING_HEAD_VH_WEST'],
  [50,1487,426,66,'D1F_V11_OPENING_HEAD_VH_NORTH'],
  [51,410,425,65,'D1F_V11_OPENING_HEAD_VH_WEST'],
  [51,411,426,66,'D1F_V11_OPENING_HEAD_VH_NORTH'],
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
  const scenes=Array.from({length:52},()=>({children:[],traverse(fn){
    for(const obj of this.children) fn(obj);
  }}));
  const nodes=Array.from({length:6463},()=>({}));
  const meshes=Array.from({length:1859},()=>({primitives:[]}));
  const materials=Array.from({length:342},()=>({}));
  for(const [mi,mat] of [[425,65],[426,66],[1835,335]]) {
    meshes[mi]={primitives:[{material:mat}]};
  }
  for(const mat of [65,66]) {
    materials[mat]={alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[.93,.79,.51,.83]}};
  }
  for(const [scene,index] of [[50,6379],[51,6394]]) {
    nodes[index]={mesh:1835,name:'HI06_NORTH_APERTURED_FACADE'};
    const obj={name:nodes[index].name,isMesh:true,material:originalWhite,parent:scenes[scene]};
    associations.set(obj,{nodes:index});
    scenes[scene].children.push(obj);
  }
  const selected=[];
  for(const [si,id,mi,mat,name] of heads) {
    nodes[id]={mesh:mi,name,extras:{representationKind:'wallContinuationVisualProxy'}};
    const mesh={name,isMesh:true,material:originalTint,geometry:{},parent:scenes[si]};
    associations.set(mesh,{nodes:id});
    scenes[si].children.push(mesh);
    selected.push(mesh);
  }
  // C045 helper expects source-scene roots. Keep its controls independent.
  for(const spec of [
    [50,6380,1843,'C80-028_WEST_X0_TERRACE_SIDE_WALL_1F_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',3.635],
    [50,6457,1858,'HI20_C045_CLIPPED_OWNER_WHITE_C048_1F_OPTIN',1.709],
    [51,6395,1843,'C80-028_WEST_X0_TERRACE_SIDE_WALL_BOTH_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',3.635],
    [51,6460,1858,'HI20_C045_CLIPPED_OWNER_WHITE_C048_BOTH_OPTIN',1.709],
  ]) {
    const [si,id,mi,name,length]=spec;
    nodes[id]={mesh:mi,name};
    const obj={name,isMesh:true,visible:true,parent:scenes[si],
      geometry:{boundingBox:{min:{z:0},max:{z:length}},computeBoundingBox(){}}};
    scenes[si].children.push(obj);
    associations.set(obj,{nodes:id});
  }
  return {gltf:{scenes,parser:{associations,json:{
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array(52).fill({}),nodes,meshes,materials,
  }}},selected,originalWhite,originalTint};
}
test('four exact V11 heads turn white, source materials and geometry remain untouched',()=>{
  const f=fixture(),api=createHi20C048WallHeadsPresentation(f.gltf,C048_SOURCE_SHA);
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
  assert.equal(createHi20C048WallHeadsPresentation(f.gltf,'not-the-exact-SHA').available,false);
  f.gltf.parser.json.materials[66].alphaMode='OPAQUE';
  assert.equal(createHi20C048WallHeadsPresentation(f.gltf,C048_SOURCE_SHA).available,false);
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
  f.gltf.parser.json.materials[66].alphaMode='BLEND';
  f.gltf.parser.associations.delete(f.selected[0]);
  assert.equal(createHi20C048WallHeadsPresentation(f.gltf,C048_SOURCE_SHA).available,false);
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
});
test('existing C045 controller composes C048 without coupling toggles',()=>{
  const f=fixture();
  const api=createHi20C045Presentation(f.gltf,C048_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.c048WhiteHeadsApplied,true);
  assert.equal(api.c048WhiteHeadsCount,4);
  assert(f.selected.every(mesh=>mesh.material!==f.originalTint));
  api.setCorrected(true);
  api.setCorrected(false);
  assert(f.selected.every(mesh=>mesh.material!==f.originalTint));
  api.dispose();
  assert(f.selected.every(mesh=>mesh.material===f.originalTint));
});
