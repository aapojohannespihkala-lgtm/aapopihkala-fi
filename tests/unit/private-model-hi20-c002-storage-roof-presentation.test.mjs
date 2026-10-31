import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C002StorageRoofPresentation,C002_SOURCE_SHA,C002_VISUAL_OFFSET_M}
 from '../../src/scripts/privateModelHi20C002StorageRoofPresentation.mjs';
const ids=[3740,3744,3748,3756];
const names=[
 'K3_AC_STORAGE_P169A_C_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
 'K3_AC_STORAGE_P169A_B_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
 'K3_AC_STORAGE_P169A_A_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
 'K3_D_STORAGE_FROM_C_P169A_C_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE',
];
function fixture(){
 const associations=new Map(),nodes=Array.from({length:6463},()=>({}));
 const scenes=Array.from({length:52},()=>({children:[]}));
 const jsonScenes=Array.from({length:52},()=>({nodes:[]}));
 const roofs=[];
 for(let i=0;i<4;i++){
   const y=i===1||i===2?1.76:2.76;
   nodes[ids[i]]={name:names[i],mesh:514,matrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,y,0,1],
     extras:{presentationOnly:true,sourceNodeIndex:[978,983,988,978][i],sourceDriveId:'source'}};
   jsonScenes[3].nodes.push(ids[i]);
   const obj={name:names[i],isMesh:true,position:{y},material:{opacity:.58},
     updateMatrix(){},updateMatrixWorld(){}};
   scenes[3].children.push(obj);associations.set(obj,{nodes:ids[i]});roofs.push(obj);
 }
 const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,
  scenes:jsonScenes,nodes,
  meshes:Array.from({length:1859},(_,i)=>i===514?{primitives:[{material:85}]}:{}),
  materials:Array.from({length:342},(_,i)=>i===85?{alphaMode:'BLEND',doubleSided:true,
    pbrMetallicRoughness:{baseColorFactor:[.86,.87,.88,.58]}}:{})};
 return {gltf:{scenes,parser:{json,associations}},roofs};
}
test('four exact scene3 roof references receive one reversible 5mm bias',()=>{
 const f=fixture(),api=createHi20C002StorageRoofPresentation(f.gltf,C002_SOURCE_SHA);
 assert.equal(api.available,true);assert.equal(api.count,4);
 const old=f.roofs.map(o=>o.position.y);
 assert.equal(api.setEnabled(true),true);
 assert.equal(api.setEnabled(true),true);
 for(let i=0;i<4;i++) assert.equal(f.roofs[i].position.y,old[i]+C002_VISUAL_OFFSET_M);
 assert.deepEqual(f.gltf.parser.json.scenes[50].nodes,[]);
 assert.deepEqual(f.gltf.parser.json.scenes[51].nodes,[]);
 assert.equal(f.gltf.parser.json.nodes[3740].matrix[13],2.76);
 api.dispose();assert.deepEqual(f.roofs.map(o=>o.position.y),old);
});
test('wrong source SHA, scene membership and material fail closed',()=>{
 const f=fixture();
 assert.equal(createHi20C002StorageRoofPresentation(f.gltf,'wrong').available,false);
 f.gltf.parser.json.scenes[3].nodes.pop();
 assert.equal(createHi20C002StorageRoofPresentation(f.gltf,C002_SOURCE_SHA).available,false);
 assert.deepEqual(f.roofs.map(o=>o.position.y),[2.76,1.76,1.76,2.76]);
 f.gltf.parser.json.scenes[3].nodes.push(3756);
 f.gltf.parser.json.materials[85].pbrMetallicRoughness.baseColorFactor[3]=.45;
 assert.equal(createHi20C002StorageRoofPresentation(f.gltf,C002_SOURCE_SHA).available,false);
});
test('does not touch 1F and reset restores original positions',()=>{
 const f=fixture(),other={position:{y:2.76}};
 f.gltf.scenes[50].children.push(other);
 const api=createHi20C002StorageRoofPresentation(f.gltf,C002_SOURCE_SHA);
 assert.equal(api.available,true);assert(api.setEnabled(true));
 assert.equal(other.position.y,2.76);
 assert(api.setEnabled(false));assert.equal(api.enabled,false);
});
