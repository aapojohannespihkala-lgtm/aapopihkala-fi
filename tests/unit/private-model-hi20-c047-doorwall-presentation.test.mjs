import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C047DoorWallPresentation,C047_SOURCE_SHA} from '../../src/scripts/privateModelHi20C047DoorWallPresentation.mjs';
const names=[
'C80_047_D1F_STORAGE_EAST_DOORWALL_DIMENSIONAL_DISPLAY_ONLY_WORK_TEST_HOST_HOLD',
'C80_047_D1F_STORAGE_EAST_DOORWALL_DIMENSIONAL_DISPLAY_ONLY_WORK_TEST_HOST_HOLD_INDEPENDENT_BOTH'];
function geometry() {
 const x=Array.from({length:84},(_,i)=>i<42?2.277:2.337);
 const p={count:84,getX:i=>x[i],setX:(i,v)=>{x[i]=v;},needsUpdate:false};
 const g={getAttribute:k=>k==='position'?p:null,computeBoundingBox(){this.boundingBox={min:{x:Math.min(...x),y:0,z:-10.81},max:{x:Math.max(...x),y:2.76,z:-8.928}};},computeBoundingSphere(){},dispose(){this.disposed=true;},clone(){const c=geometry();return c;}};
 g.computeBoundingBox();return g;
}
function fixture() {
 const ns=Array.from({length:6397},()=>({}));
 const scenes=Array.from({length:52},()=>({children:[]}));
 const assoc=new Map();
 const objects=[];
 [6345,6396].forEach((id,i)=>{
  ns[id]={mesh:1820,name:names[i],extras:{stage:'WORK_TEST',physicalHost:'HOST_HOLD',representationKind:'DISPLAY_VOLUME_NOT_PHYSICAL_STRUCTURE',asBuilt:false,current:false,sourceLinks:[{},{}]}};
  const obj={name:names[i],isMesh:true,geometry:geometry()};
  scenes[i?51:50].children.push(obj);
  assoc.set(obj,{nodes:id});
  objects.push(obj);
 });
 return {gltf:{scenes,parser:{json:{scenes:Array.from({length:52},()=>({})),nodes:ns,meshes:Array.from({length:1821},(_,i)=>i===1820?{name:'C80_047_D1F_STORAGE_EAST_DOORWALL_60MM_DISPLAY_EXTRUSION_ONLY',primitives:[{material:333}]}:{})},associations:assoc}},objects};
}
test('100mm exact wall COW, external face and door opening source geometry preserved',()=>{
 const {gltf,objects}=fixture(), original=objects.map(o=>o.geometry);
 const r=createHi20C047DoorWallPresentation(gltf,C047_SOURCE_SHA);
 assert.equal(r.available,true);assert.equal(r.count,2);
 assert.equal(r.setEnabled(true),true);
 for(let i=0;i<2;i++) {
  assert.notEqual(objects[i].geometry,original[i]);
  assert.ok(Math.abs(objects[i].geometry.boundingBox.min.x-2.237)<1e-5);
  assert.ok(Math.abs(objects[i].geometry.boundingBox.max.x-2.337)<1e-5);
  assert.equal(original[i].boundingBox.min.x,2.277);
 }
 r.dispose();
 objects.forEach((o,i)=>assert.equal(o.geometry,original[i]));
});
test('SHA and scene fail closed without touching source geometry',()=>{
 const {gltf,objects}=fixture(),g=objects[0].geometry;
 assert.equal(createHi20C047DoorWallPresentation(gltf,'wrong').available,false);
 gltf.scenes[50].children=[];
 assert.equal(createHi20C047DoorWallPresentation(gltf,C047_SOURCE_SHA).available,false);
 assert.equal(objects[0].geometry,g);
});
test('double toggle idempotent and missing sourceLinks fail closed',()=>{
 const {gltf,objects}=fixture(),r=createHi20C047DoorWallPresentation(gltf,C047_SOURCE_SHA);
 assert.equal(r.setEnabled(true),true);const v=objects[0].geometry;
 assert.equal(r.setEnabled(true),true);assert.equal(objects[0].geometry,v);
 assert.equal(r.setEnabled(false),true);assert.equal(objects[0].geometry!==v,true);
 gltf.parser.json.nodes[6345].extras.sourceLinks=[];
 assert.equal(createHi20C047DoorWallPresentation(gltf,C047_SOURCE_SHA).available,false);
});
