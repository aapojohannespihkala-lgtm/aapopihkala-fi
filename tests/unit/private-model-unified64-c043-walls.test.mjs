import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnified64C043WallsPresentation,U64_C043_SHA } from
  '../../src/scripts/privateModelUnified64C043WallsPresentation.mjs';
const groups=[
 {scene:62,ref:6432,items:[
  [6443,6445,1855,227,3,'D2015_2F_WALL3D_LOWWALL_STAIR_A_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'],
  [6444,6445,1856,227,3,'D2015_2F_WALL3D_LOWWALL_STAIR_B_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'],
  [5077,6445,1541,206,1,'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'],
  [5079,6445,1543,208,2,'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'],
  [5084,6447,1546,211,1,'D2F_WC_DOOR_TOP_DISPLAY_ONLY'],
  [5880,null,1791,284,null,'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_24'],
 ]},
 {scene:63,ref:6438,items:[
  [6448,6450,1855,227,3,'D2015_2F_WALL3D_LOWWALL_STAIR_A_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'],
  [6449,6450,1856,227,3,'D2015_2F_WALL3D_LOWWALL_STAIR_B_K17_1125MM_OWNER_MEASURED_AB_UNVERIFIED_WORK_TEST'],
  [5040,6450,1531,196,1,'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'],
  [5042,6450,1533,198,2,'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY'],
  [5047,6452,1536,201,1,'D2F_WC_DOOR_TOP_DISPLAY_ONLY'],
  [5882,null,1791,284,null,'HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_25'],
 ]}
];
const matColors={227:[.72,.61,.49,1],284:[.87,.86,.82,1]};
for(const n of [206,208,211,196,198,201])matColors[n]=[.76,.83,.89,1];
function material(rgb){
 return {color:{r:rgb[0],g:rgb[1],b:rgb[2]},opacity:rgb[3],transparent:false,
  depthWrite:true,clone(){return material(rgb);},dispose(){this.disposed=true;}};
}
function fixture(){
 const assoc=new Map(), nodes=Array.from({length:6518},()=>({})),
   meshes=Array.from({length:1873},()=>({})),
   materials=Array.from({length:344},()=>({})),
   sourceScenes=Array.from({length:64},()=>({nodes:[]})),
   scenes=Array.from({length:64},()=>({children:[],traverse(fn){fn(this);for(const x of this.children)fn(x);}}));
 materials[340]={alphaMode:'OPAQUE',pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1]}};
 for(const [id,color] of Object.entries(matColors)){
  materials[id]={name:Number(id)===227?'C80R2_HI11_LOW_STAIR_WALL_OPAQUE_DISPLAY_ONLY':
   Number(id)===284?'C80_020_BALCONY_SIDE_VISUAL_WORK_ASSUMPTION':
   'C80R1_D2015_2F_VISIBLE_WALLS_WORK_ASSUMPTION',
   pbrMetallicRoughness:{baseColorFactor:color}};
 }
 meshes[1850]={primitives:[{material:340}]};
 const objects=[];
 for(const g of groups){
   sourceScenes[g.scene].nodes.push(g.ref);
   nodes[g.ref]={mesh:1850,name:'WHITE_REF',extras:{physicalWall:true,workTestC80_043:{ownerConfirmedWhite:true}}};
   const ref={isMesh:true,name:'WHITE_REF',material:material([.93,.93,.93,1]),parent:scenes[g.scene],geometry:{id:'reference'}};
   scenes[g.scene].children.push(ref);assoc.set(ref,{nodes:g.ref});
   for(const [id,parent,mesh,mat,links,name] of g.items){
     nodes[id]={mesh,name,extras:links===null?
       {physicalHost:'HOST_HOLD',current:false,asBuilt:false}:
       {sourceLinks:Array.from({length:links},()=>({docId:'SOURCE'})),
        ModelStage:'WORK_TEST',representationKind:'wall3DPresentationProxy'}};
     meshes[mesh]={primitives:[{material:mat}]};
     if(parent===null)sourceScenes[g.scene].nodes.push(id);
     else (nodes[parent].children??=[]).push(id);
     const obj={isMesh:true,name,visible:true,material:material(matColors[mat]),
       parent:scenes[g.scene],geometry:{unique:id}};
     scenes[g.scene].children.push(obj);assoc.set(obj,{nodes:id});
     objects.push({obj,id,original:obj.material,geometry:obj.geometry});
   }
 }
 const gltf={scenes,parser:{associations:assoc,json:{asset:{version:'2.0',extras:{current:false,asBuilt:false}},
   scene:0,nodes,meshes,materials,scenes:sourceScenes}}};
 return {gltf,objects};
}
test('64-scene only recolors 12 exact original 2F/BOTH targets, keeps K17 geometry',()=>{
 const {gltf,objects}=fixture(),fix=createUnified64C043WallsPresentation(gltf,U64_C043_SHA);
 assert.equal(fix.available,true,fix.reason);assert.equal(fix.count,12);
 assert.equal(fix.setEnabled(true),true);assert.equal(fix.enabled,true);
 for(const x of objects){
  assert.notEqual(x.obj.material,x.original);
  assert.deepEqual(x.obj.material.color,{r:.93,g:.93,b:.93});
  assert.equal(x.obj.geometry,x.geometry);
 }
 assert.equal(gltf.scenes[60].children.length,0);assert.equal(gltf.scenes[61].children.length,0);
 assert.equal(fix.setEnabled(true),true);
 const saved=objects[0].obj.material;
 assert.equal(fix.setEnabled(false),true);
 assert.equal(saved.disposed,true);
 for(const x of objects)assert.equal(x.obj.material,x.original);
 fix.dispose();assert.equal(fix.enabled,false);
});
test('source SHA, scene, wrong material and missing source link fail closed',()=>{
 for(const fail of ['sha','scene','material','sourceLinks','parent','white']){
  const {gltf,objects}=fixture(),orig=objects[0].obj.material;
  if(fail==='scene')gltf.parser.json.scenes.length=63;
  if(fail==='material')gltf.parser.json.meshes[1855].primitives[0].material=340;
  if(fail==='sourceLinks')gltf.parser.json.nodes[6443].extras.sourceLinks=[];
  if(fail==='parent')gltf.parser.json.nodes[6445].children=[];
  if(fail==='white')gltf.parser.json.materials[340].pbrMetallicRoughness.baseColorFactor=[.9,.9,.9,1];
  const f=createUnified64C043WallsPresentation(gltf,fail==='sha'?'wrong':U64_C043_SHA);
  assert.equal(f.available,false,fail);assert.equal(f.setEnabled(true),false);
  assert.equal(objects[0].obj.material,orig);
 }
});
