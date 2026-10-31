import test from 'node:test';
import assert from 'node:assert/strict';
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Scene } from 'three';
import { createHi20C029SideWallsPresentation, C029_SOURCE_SHA } from
  '../../src/scripts/privateModelHi20C029SideWallsPresentation.mjs';

const targets=[
 {scene:50,id:5754,mi:1725,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4978',kind:'W'},
 {scene:50,id:5755,mi:1726,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4979',kind:'N'},
 {scene:51,id:5775,mi:1725,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4966',kind:'W'},
 {scene:51,id:5776,mi:1726,name:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4967',kind:'N'},
];
function sourceGeometry(kind) {
 const v=kind==='W'?
   [0,8.928,0, 0,10.81,0, 0,10.81,2.76, 0,8.928,0, 0,10.81,2.76, 0,8.928,2.76]:
   [0,10.81,0, 2.337,10.81,0, 2.337,10.81,2.76,
    0,10.81,0, 2.337,10.81,2.76, 0,10.81,2.76];
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(v,3));return g;
}
function fixture() {
 const scenes=Array.from({length:52},()=>new Scene()),nodes=Array.from({length:6397},()=>({}));
 const meshes=Array.from({length:1821},()=>({}));
 for(const mi of [1725,1726]) meshes[mi]={primitives:[{material:281}]};
 const associations=new Map(),objects=[];
 for(const t of targets) {
   nodes[t.id]={mesh:t.mi,name:t.name,extras:{
     stage:'WORK_TEST',presentationOnly:true,physicalHost:'HOST_HOLD',
     representationKind:'SOURCE_CONTEXT',asBuilt:false,current:false
   }};
   const obj=new Mesh(sourceGeometry(t.kind),new MeshBasicMaterial());
   obj.name=t.name;scenes[t.scene].add(obj);associations.set(obj,{nodes:t.id});
   objects.push(obj);
 }
 const gltf={scenes,parser:{json:{asset:{version:'2.0',extras:{current:false,asBuilt:false}},
   scene:0,scenes:Array.from({length:52},()=>({})),nodes,meshes},associations}};
 return {gltf,objects};
}

test('four original storage walls become separate, closed 60 mm display solids',()=>{
 const {gltf,objects}=fixture(),originals=objects.map(o=>o.geometry);
 const fix=createHi20C029SideWallsPresentation(gltf,C029_SOURCE_SHA);
 assert.equal(fix.available,true);assert.equal(fix.count,4);
 assert.equal(fix.setEnabled(true),true);assert.equal(fix.enabled,true);
 for(const [i,obj] of objects.entries()) {
   assert.notEqual(obj.geometry,originals[i]);
   const b=obj.geometry.boundingBox;
   assert.equal(obj.geometry.index.count,36); // 12 closed box triangles
   if(i%2===0) {
     assert.ok(Math.abs(b.min.x-0)<1e-6);
     assert.ok(Math.abs(b.max.x-0.06)<1e-6);
     assert.ok(Math.abs(b.min.y-8.928)<1e-6);
     assert.ok(Math.abs(b.max.y-10.81)<1e-6);
   }else{
     assert.ok(Math.abs(b.min.x-0.06)<1e-6);
     assert.ok(Math.abs(b.max.x-2.337)<1e-6);
     assert.ok(Math.abs(b.min.y-10.75)<1e-6);
     assert.ok(Math.abs(b.max.y-10.81)<1e-6);
   }
   assert.ok(Math.abs(b.min.z)<1e-6);
   assert.ok(Math.abs(b.max.z-2.76)<1e-6);
 }
 assert.equal(fix.setEnabled(true),true);
 fix.dispose();assert.equal(fix.enabled,false);
 objects.forEach((o,i)=>assert.equal(o.geometry,originals[i]));
 assert.equal(gltf.scenes[48].children.length,0);
});
test('SHA, node identity, missing source and stage all fail closed',()=>{
 for(const problem of ['sha','node','missing','stage','bbox']){
   const {gltf,objects}=fixture(),original=objects[0].geometry;
   if(problem==='node')gltf.parser.json.nodes[5754].mesh=1726;
   if(problem==='missing')gltf.scenes[50].remove(objects[0]);
   if(problem==='stage')gltf.parser.json.nodes[5754].extras.stage='CURRENT';
   if(problem==='bbox')objects[0].geometry.translate(0.1,0,0);
   const fix=createHi20C029SideWallsPresentation(gltf,problem==='sha'?'wrong':C029_SOURCE_SHA);
   assert.equal(fix.available,false,problem);
   assert.equal(fix.setEnabled(true),false);
   assert.equal(objects[0].geometry,original);
 }
});
