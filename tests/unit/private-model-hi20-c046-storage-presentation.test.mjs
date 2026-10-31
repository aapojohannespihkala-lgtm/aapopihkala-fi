import test from 'node:test';
import assert from 'node:assert/strict';
import { createHi20C046StoragePresentation, C046_SOURCE_SHA }
  from '../../src/scripts/privateModelHi20C046StoragePresentation.mjs';

const targets=[
  [50,1488,'K7D_VARASTO_WALL_INFILL_WHITE_WORK_ASSUMPTION'],
  [50,5756,'C80_029_D_STORAGE_DOOR_WALL_SOURCE_ONLY_PREVIEW'],
  [50,6345,'HI20_C047_APERTURED_STORAGE_DOOR_WALL'],
  [51,412,'K7D_VARASTO_WALL_INFILL_WHITE_WORK_ASSUMPTION'],
  [51,5777,'C80_029_D_STORAGE_DOOR_WALL_SOURCE_ONLY_PREVIEW'],
  [51,6396,'HI20_C047_APERTURED_STORAGE_DOOR_WALL'],
];
function fixture(){
  const associations=new Map();
  const nodes=Array.from({length:6463},()=>({}));
  const scenes=Array.from({length:52},()=>({
    children:[], traverse(fn){for(const obj of this.children) fn(obj);},
  }));
  const objects=new Map();
  for(const [scene,id,name] of targets){
    nodes[id]={name,mesh:id};
    const obj={name,visible:true,isMesh:true,parent:scenes[scene]};
    scenes[scene].children.push(obj);
    associations.set(obj,{nodes:id});
    objects.set(id,obj);
  }
  const gltf={scenes,parser:{associations,json:{
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array(52).fill({}),nodes,
  }}};
  return {gltf,objects};
}
test('exact HI20 storage preview hides only 4 duplicate roots, restores all on dispose',()=>{
  const f=fixture();
  const other=f.objects.get(6345);
  const api=createHi20C046StoragePresentation(f.gltf,C046_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.count,4);
  assert.equal(api.setCleaned(true),true);
  for(const id of [1488,5756,412,5777]) assert.equal(f.objects.get(id).visible,false);
  for(const id of [6345,6396]) assert.equal(f.objects.get(id).visible,true);
  assert.equal(other.visible,true);
  api.setCleaned(false);
  assert([...f.objects.values()].every(o=>o.visible));
  api.setCleaned(true);
  api.dispose();
  assert([...f.objects.values()].every(o=>o.visible));
});
test('wrong SHA, missing corrected C047 wall or renamed source leaves all objects unchanged',()=>{
  const f=fixture();
  assert.equal(createHi20C046StoragePresentation(f.gltf,'wrong').available,false);
  f.gltf.parser.associations.delete(f.objects.get(6396));
  assert.equal(createHi20C046StoragePresentation(f.gltf,C046_SOURCE_SHA).available,false);
  f.gltf.parser.associations.set(f.objects.get(6396),{nodes:6396});
  f.gltf.parser.json.nodes[5756].name='UNKNOWN_WALL';
  assert.equal(createHi20C046StoragePresentation(f.gltf,C046_SOURCE_SHA).available,false);
  assert([...f.objects.values()].every(o=>o.visible));
});
test('no partial application when a legacy root is hidden or unavailable at load',()=>{
  const f=fixture();
  f.objects.get(1488).visible=false;
  assert.equal(createHi20C046StoragePresentation(f.gltf,C046_SOURCE_SHA).available,false);
  assert.equal(f.objects.get(5756).visible,true);
  assert.equal(f.objects.get(412).visible,true);
  assert.equal(f.objects.get(5777).visible,true);
});
