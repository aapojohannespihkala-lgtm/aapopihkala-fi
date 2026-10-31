import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C036R5DoorPresentation,C036_SOURCE_SHA} from '../../src/scripts/privateModelHi20C036R5DoorPresentation.mjs';
function fixture(){
 const objects=new Map(),associations=new Map();
 const scenes=Array.from({length:52},()=>({traverse(){}}));
 const original={opacity:1,color:{r:.86,g:.845,b:.8,setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}},
  clone(){return {...this,color:{...this.color},dispose(){this.disposed=true;}};}};
 const nodes=Array.from({length:5792},()=>({}));
 for(const [sc,id,parent] of [[50,5397,5787],[51,5380,5791]]){
  nodes[id]={mesh:1586,name:'HI09_R5_DOOR__D2015_1F_DOOR_LEAF_WC_PLAN_PROXY',extras:{sourceOnly:true,physicalHost:'HOST_HOLD',current:false,asBuilt:false,sourceLinks:[{docId:'DOC:13j0u0PYL_aYZr6PepcsbRxmD-8gAgD2y'}]}};
  nodes[parent]={children:[id]};
  const parentObj={};associations.set(parentObj,{nodes:parent});
  const obj={isMesh:true,name:nodes[id].name,parent:parentObj,material:original};associations.set(obj,{nodes:id});
  objects.set(sc,obj);scenes[sc]={traverse(fn){fn(obj)}};
 }
 const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scenes:Array(52).fill({}),nodes,
  meshes:Array.from({length:1587},(_,i)=>i===1586?{primitives:[{material:67}]}:{}),
  materials:Array.from({length:68},(_,i)=>i===67?{pbrMetallicRoughness:{baseColorFactor:[.86,.845,.8,1]}}:{})};
 return {gltf:{scenes,parser:{json,associations}},original,objects};
}
test('only exact 1F/BOTH R5 WC door instances become white and restore',()=>{
 const f=fixture(),p=createHi20C036R5DoorPresentation(f.gltf,C036_SOURCE_SHA);
 assert.equal(p.available,true);assert.equal(p.count,2);assert.equal(p.setEnabled(true),true);
 for(const o of f.objects.values()){assert.equal(o.material.color.r,.93);assert.notEqual(o.material,f.original);}
 assert.equal(f.original.color.r,.86);p.dispose();
 for(const o of f.objects.values())assert.equal(o.material,f.original);
});
test('fail closed on wrong SHA, incomplete source links, scene/mesh identity',()=>{
 const f=fixture();assert.equal(createHi20C036R5DoorPresentation(f.gltf,'wrong').available,false);
 f.gltf.parser.json.nodes[5397].extras.sourceLinks=[];
 assert.equal(createHi20C036R5DoorPresentation(f.gltf,C036_SOURCE_SHA).available,false);
 assert.equal(f.objects.get(50).material,f.original);
});
