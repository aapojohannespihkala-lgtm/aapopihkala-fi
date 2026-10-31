import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C045Presentation,C045_SOURCE_SHA} from '../../src/scripts/privateModelHi20C045Presentation.mjs';

function fixture() {
  const assoc=new Map();
  const scenes=Array.from({length:52},()=>({children:[]}));
  const defs=[
    [50,6380,1843,'C80-028_WEST_X0_TERRACE_SIDE_WALL_1F_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',3.635],
    [50,6457,1858,'HI20_C045_CLIPPED_OWNER_WHITE_C048_1F_OPTIN',1.709],
    [51,6395,1843,'C80-028_WEST_X0_TERRACE_SIDE_WALL_BOTH_WORK_TEST_OPTIN__D1F_C048_COW_WHITE',3.635],
    [51,6460,1858,'HI20_C045_CLIPPED_OWNER_WHITE_C048_BOTH_OPTIN',1.709],
  ];
  const nodes=new Map();
  for(const [scene,id,mesh,name,length] of defs){
    const o={name,isMesh:true,visible:true,geometry:{
      boundingBox:{min:{z:0},max:{z:length}},
      computeBoundingBox() {},
    }};
    scenes[scene].children.push(o);assoc.set(o,{nodes:id,meshes:mesh});nodes.set(id,o);
  }
  const gltf={scenes,parser:{json:{scenes:Array.from({length:52},()=>({}))},associations:assoc}};
  return {gltf,nodes,assoc};
}
test('exact source 1F50/BOTH51 suppresses ONLY old 3.635m, preserves new 1.709m',()=>{
  const f=fixture(),api=createHi20C045Presentation(f.gltf,C045_SOURCE_SHA);
  assert.equal(api.available,true);assert.equal(api.count,2);
  api.setCorrected(true);
  assert.equal(f.nodes.get(6380).visible,false);
  assert.equal(f.nodes.get(6395).visible,false);
  assert.equal(f.nodes.get(6457).visible,true);
  assert.equal(f.nodes.get(6460).visible,true);
  api.setCorrected(false);
  assert.equal(f.nodes.get(6380).visible,true);
  assert.equal(f.nodes.get(6395).visible,true);
  api.setCorrected(true);api.dispose();
  assert.equal(f.nodes.get(6380).visible,true);
  assert.equal(f.nodes.get(6395).visible,true);
});
test('fails closed on other SHA, missing scene, wrong node and wrong physical extent',()=>{
  const f=fixture();
  assert.equal(createHi20C045Presentation(f.gltf,'unrelated').available,false);
  assert(f.nodes.get(6380).visible);
  f.gltf.scenes.pop();
  assert.equal(createHi20C045Presentation(f.gltf,C045_SOURCE_SHA).available,false);
  f.gltf.scenes.push({children:[]});
  f.assoc.set(f.nodes.get(6380),{nodes:6380,meshes:777});
  assert.equal(createHi20C045Presentation(f.gltf,C045_SOURCE_SHA).available,false);
  f.assoc.set(f.nodes.get(6380),{nodes:6380,meshes:1843});
  f.nodes.get(6380).geometry.boundingBox.max.z=2.5;
  assert.equal(createHi20C045Presentation(f.gltf,C045_SOURCE_SHA).available,false);
  assert(f.nodes.get(6380).visible);
});
