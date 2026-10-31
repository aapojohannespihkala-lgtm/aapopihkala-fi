import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C036R5DoorPresentation,C036_SOURCE_SHA} from '../../src/scripts/privateModelHi20C036R5DoorPresentation.mjs';
const mat=(r,g,b)=>({opacity:1,
 color:{r,g,b,setRGB(a,c,d){this.r=a;this.g=c;this.b=d;return this;}},
 clone(){return {...this,color:{...this.color},dispose(){this.disposed=true;}};}});
function fixture(){
 const objects=new Map(),associations=new Map();
 const scenes=Array.from({length:52},()=>({traverse(){},children:[]}));
 const original=mat(.86,.845,.8),frameMaterial=mat(.53,.39,.24);
 const nodes=Array.from({length:5792},()=>({}));
 for(const [sc,id,parent] of [[50,5397,5787],[51,5380,5791]]){
  nodes[id]={mesh:1586,name:'HI09_R5_DOOR__D2015_1F_DOOR_LEAF_WC_PLAN_PROXY',extras:{sourceOnly:true,physicalHost:'HOST_HOLD',current:false,asBuilt:false,sourceLinks:[{docId:'DOC:13j0u0PYL_aYZr6PepcsbRxmD-8gAgD2y'}]}};
  nodes[parent]={children:[id]};
  const parentObj={};associations.set(parentObj,{nodes:parent});
  const obj={isMesh:true,parent:parentObj,name:nodes[id].name,material:original};associations.set(obj,{nodes:id});
  objects.set(id,obj);scenes[sc].traverse=fn=>fn(obj);
 }
 const frameEntries=[[50,5409,1589,'WEST',1],[50,5410,1590,'EAST',1],[50,5411,1591,'HEAD',1],[51,5392,1589,'WEST',0],[51,5393,1590,'EAST',0],[51,5394,1591,'HEAD',0]];
 for(const [sc,id,mesh,part,srcScene] of frameEntries){
  nodes[id]={mesh,name:'HI09_R5_FRAME_'+part+'_SCENE'+srcScene,
   extras:{measurementRole:'R5_FRAME_'+part,ownerSourceDoc:'1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU',sourceOnly:true,physicalHost:'HOST_HOLD',physicalStructureApproved:false,asBuilt:false,current:false}};
  const obj={isMesh:true,name:nodes[id].name,material:frameMaterial};associations.set(obj,{nodes:id});
  objects.set(id,obj);scenes[sc].children.push(obj);
 }
 const meshes=Array.from({length:1592},()=>({}));
 meshes[1586]={primitives:[{material:67}]};
 for(const i of [1589,1590,1591])meshes[i]={primitives:[{material:226}]};
 const materials=Array.from({length:227},()=>({}));
 materials[67]={pbrMetallicRoughness:{baseColorFactor:[.86,.845,.8,1]}};
 materials[226]={name:'HI09_R5_FRAME_WORK_VISUAL',pbrMetallicRoughness:{baseColorFactor:[.53,.39,.24,1]},
  extras:{sourceOnly:true,physicalHost:'HOST_HOLD',physicalStructureApproved:false}};
 const srcScenes=Array.from({length:52},()=>({nodes:[]}));
 for(const [sc,id] of frameEntries)srcScenes[sc].nodes.push(id);
 const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scenes:srcScenes,nodes,meshes,materials};
 return {gltf:{scenes,parser:{json,associations}},original,frameMaterial,objects};
}
test('exact 1F/BOTH R5 leaf and all six frames turn white and restore without shared material edits',()=>{
 const f=fixture(),p=createHi20C036R5DoorPresentation(f.gltf,C036_SOURCE_SHA);
 assert.equal(p.available,true,p.reason);assert.equal(p.count,8);assert.equal(p.setEnabled(true),true);
 for(const obj of f.objects.values())assert.equal(obj.material.color.r,.93);
 assert.equal(f.original.color.r,.86);assert.equal(f.frameMaterial.color.r,.53);
 p.dispose();
 for(const [id,obj] of f.objects)assert.equal(obj.material,id===5397||id===5380?f.original:f.frameMaterial);
});
test('wrong SHA and lost door provenance reject without partial presentation',()=>{
 const f=fixture();assert.equal(createHi20C036R5DoorPresentation(f.gltf,'wrong').available,false);
 f.gltf.parser.json.nodes[5397].extras.sourceLinks=[];
 assert.equal(createHi20C036R5DoorPresentation(f.gltf,C036_SOURCE_SHA).available,false);
 assert.equal(f.objects.get(5409).material,f.frameMaterial);
});
test('frame roster, source material or scene membership mismatch fails closed',()=>{
 const f=fixture();f.gltf.scenes[50].children.pop();
 assert.equal(createHi20C036R5DoorPresentation(f.gltf,C036_SOURCE_SHA).available,false);
 const g=fixture();g.gltf.parser.json.scenes[51].nodes=[];
 assert.equal(createHi20C036R5DoorPresentation(g.gltf,C036_SOURCE_SHA).available,false);
 const h=fixture();h.gltf.parser.json.materials[226].pbrMetallicRoughness.baseColorFactor[0]=.7;
 assert.equal(createHi20C036R5DoorPresentation(h.gltf,C036_SOURCE_SHA).available,false);
});