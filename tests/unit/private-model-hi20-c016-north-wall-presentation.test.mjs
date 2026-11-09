import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C016NorthWallPresentation,C016_SOURCE_SHA} from '../../src/scripts/privateModelHi20C016NorthWallPresentation.mjs';
const NAME='D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY';
function geometry(){
 const vertices=[];for(const z of [2.76,5.11])for(const y of [7.366,10.82])for(const x of [3.549,3.635])vertices.push([x,y,z]);
 const pos={count:8,getX:i=>vertices[i][0],getY:i=>vertices[i][1],
  getZ:i=>vertices[i][2],setY:(i,y)=>{vertices[i][1]=y},needsUpdate:false};
 const g={index:{count:36},getAttribute:k=>k==='position'?pos:null,
  clone(){return geometry()},dispose(){this.disposed=true},
  computeBoundingBox(){this.boundingBox={min:{y:Math.min(...vertices.map(v=>v[1]))},
    max:{y:Math.max(...vertices.map(v=>v[1]))}}},computeBoundingSphere(){}};
 g.computeBoundingBox();return g;
}
function fixture(){
 const j={asset:{extras:{current:false,asBuilt:false}},
  scenes:Array.from({length:52},()=>({})),nodes:Array.from({length:6463},()=>({})),
  meshes:Array.from({length:1859},()=>({}))};
 const scenes=Array.from({length:52},()=>({traverse(fn){this.obj&&fn(this.obj)}}));
 const assoc=new Map(),objects=[];
 for(const t of [{s:48,n:5079,p:6445,m:1543,mat:208},
                  {s:51,n:5042,p:6450,m:1533,mat:198}]){
  j.nodes[t.p]={children:[t.n]};j.nodes[t.n]={name:NAME,mesh:t.m,extras:{
   G2Id:'G2_WALLREF_D_2F_ROOM34_LONGITUDINAL_2015_001',currentAsBuilt:false,
   representationKind:'wall3DPresentationProxy',sourceDerivedPlanSegment:{
   a:[3.549,7.366],b:[3.549,10.82]},sourceLinks:[{},{}]}};
  j.meshes[t.m]={name:'ROOM34_BETWEEN_SOURCE_FACES_PROXY_3D_WORK_TEST',
   primitives:[{attributes:{POSITION:971},indices:972,material:t.mat}]};
  const obj={isMesh:true,name:NAME,geometry:geometry()};scenes[t.s].obj=obj;
  assoc.set(obj,{nodes:t.n});objects.push(obj);
 }
 return {gltf:{scenes,parser:{json:j,associations:assoc}},objects};
}
test('exact C016 52-scene COW 260mm trim in 2F/BOTH; original restored',()=>{
 const {gltf,objects}=fixture(),orig=objects.map(o=>o.geometry);
 const r=createHi20C016NorthWallPresentation(gltf,C016_SOURCE_SHA);
 assert.equal(r.available,true);assert.equal(r.count,2);assert.equal(r.setEnabled(true),true);
 objects.forEach((o,i)=>{assert.notEqual(o.geometry,orig[i]);
  assert.equal(o.geometry.boundingBox.max.y,10.56);
  assert.equal(o.geometry.boundingBox.min.y,7.366);
  assert.equal(orig[i].boundingBox.max.y,10.82)});
 r.dispose();objects.forEach((o,i)=>assert.equal(o.geometry,orig[i]));
 assert.equal(r.setEnabled(true),false);
});
test('wrong SHA, parent and provenance fail closed',()=>{
 const {gltf,objects}=fixture(),original=objects[0].geometry;
 assert.equal(createHi20C016NorthWallPresentation(gltf,'wrong').available,false);
 gltf.parser.json.nodes[6445].children=[];
 assert.equal(createHi20C016NorthWallPresentation(gltf,C016_SOURCE_SHA).available,false);
 assert.equal(objects[0].geometry,original);
 const f=fixture();f.gltf.parser.json.nodes[5079].extras.sourceLinks=[];
 assert.equal(createHi20C016NorthWallPresentation(f.gltf,C016_SOURCE_SHA).available,false);
});
test('repeated on/off is safe; dispose releases cloned geometry',()=>{
 const {gltf,objects}=fixture(),original=objects[1].geometry;
 const r=createHi20C016NorthWallPresentation(gltf,C016_SOURCE_SHA);
 assert.equal(r.setEnabled(true),true);const clone=objects[1].geometry;
 assert.equal(r.setEnabled(true),true);assert.equal(objects[1].geometry,clone);
 assert.equal(r.setEnabled(false),true);assert.equal(objects[1].geometry,original);
 assert.equal(clone.disposed,true);assert.equal(r.setEnabled(true),true);
 r.dispose();assert.equal(objects[1].geometry,original);
});
