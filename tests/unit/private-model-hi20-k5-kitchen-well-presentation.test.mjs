import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20K5KitchenWellPresentation,K5_SOURCE_SHA}
  from '../../src/scripts/privateModelHi20K5KitchenWellPresentation.mjs';
const ids=[3373,3374,3375,3397,3398],meshIds=[520,521,522,636,637];
const names=[
 'K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS',
 'K5_SC7_K5_D_KITCHEN_CURB_FRAME',
 'K5_SC7_K5_D_KITCHEN_RECESSED_GLASS_WORKTEST',
 'K8_SC13_K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS_EXTENDED_TO_2F_CEILING_WORK_ASSUMPTION',
 'K8_SC13_K5_SC7_K5_D_KITCHEN_WELL_OPENING_SIDEWALLS_2F_CEILING_OPEN_FRAME_WORK_ASSUMPTION',
];
const mat=[88,89,90,88,88];
const matrix=()=>({elements:Array.from({length:16},(_,i)=>i%5===0?1:0),
  copy(a){this.elements=[...a.elements];}});
function scene(){return {children:[],matrixWorld:matrix(),add(o){this.children.push(o);},
 remove(o){this.children=this.children.filter(v=>v!==o);},
 updateMatrixWorld(){},traverse(cb){for(const o of this.children)cb(o);}};}
function fixture(){
 const nodes=Array.from({length:6463},()=>({}));
 const meshes=Array.from({length:1859},()=>({primitives:[]}));
 const s=Array.from({length:52},scene);
 const js=Array.from({length:52},()=>({nodes:[]}));
 js[3].nodes=[3666,3411];
 nodes[3666]={children:ids.slice(0,3)};
 nodes[3411]={children:ids.slice(3)};
 const associations=new Map();
 ids.forEach((id,i)=>{
  nodes[id]={name:names[i],mesh:meshIds[i],
    extras:i<3?{K5PhysicalRoofOpeningAuthorized:true}
      :{hostStatus:'PHYSICAL_CEILING_OPENING_UNCUT_HOLD'}};
  meshes[meshIds[i]]={primitives:[{material:mat[i]}]};
  const object={isMesh:true,name:names[i],visible:true,geometry:{},material:{},
    matrixWorld:matrix(),userData:{sourceLinks:['same-source']},
    clone(){return {...this,matrix:matrix(),userData:{...this.userData}};}};
  s[3].add(object);associations.set(object,{nodes:id});
 });
 return {json:{asset:{version:'2.0',extras:{current:false,asBuilt:false}},
     scene:0,scenes:js,nodes,meshes},
   scenes:s,associations};
}
function gltf(f){return {scenes:f.scenes,parser:{json:f.json,associations:f.associations}};}
test('K5 exact 5 source meshes are present in 2F and BOTH, reversible and no original changes',()=>{
 const f=fixture();const original=ids.map(id=>structuredClone(f.json.nodes[id]));
 const api=createHi20K5KitchenWellPresentation(gltf(f),K5_SOURCE_SHA);
 assert.equal(api.available,true);assert.equal(api.count,10);
 assert.equal(f.scenes[3].children.length,5);
 assert.equal(f.scenes[48].children.length,5);
 assert.equal(f.scenes[51].children.length,5);
 assert.ok(f.scenes[48].children.every(o=>!o.visible));
 assert.ok(api.setEnabled(true));
 assert.equal(f.scenes[48].children.filter(o=>o.visible).length,5);
 assert.equal(f.scenes[51].children.filter(o=>o.visible).length,5);
 assert.ok(f.scenes[48].children.every(o=>o.userData.physicalCeilingOpeningCut===false));
 assert.ok(f.scenes[51].children.every(o=>o.geometry===f.scenes[3].children[ids.indexOf(o.userData.k5SourceNode)].geometry));
 api.setEnabled(false);assert.ok(f.scenes[48].children.every(o=>!o.visible));
 api.dispose();api.dispose();
 assert.equal(api.setEnabled(true),false);
 assert.equal(f.scenes[48].children.length,0);assert.equal(f.scenes[51].children.length,0);
 assert.deepEqual(ids.map(id=>f.json.nodes[id]),original);
});
test('fail-closed on wrong SHA, wrong mesh or accidental target duplicate',()=>{
 const f=fixture(),g=gltf(f);
 assert.equal(createHi20K5KitchenWellPresentation(g,'wrong').available,false);
 f.json.nodes[3373].mesh=999;
 assert.equal(createHi20K5KitchenWellPresentation(g,K5_SOURCE_SHA).available,false);
 f.json.nodes[3373].mesh=520;f.json.scenes[48].nodes.push(3373);
 assert.equal(createHi20K5KitchenWellPresentation(g,K5_SOURCE_SHA).available,false);
 assert.equal(f.scenes[48].children.length,0);
});
test('rejects unknown roof host, target world offset and missing source object',()=>{
 const f=fixture(),g=gltf(f);
 f.json.nodes[3398].extras.hostStatus='CURRENT';
 assert.equal(createHi20K5KitchenWellPresentation(g,K5_SOURCE_SHA).available,false);
 f.json.nodes[3398].extras.hostStatus='PHYSICAL_CEILING_OPENING_UNCUT_HOLD';
 f.scenes[51].matrixWorld.elements[12]=1;
 assert.equal(createHi20K5KitchenWellPresentation(g,K5_SOURCE_SHA).available,false);
 f.scenes[51].matrixWorld.elements[12]=0;f.scenes[3].children.pop();
 assert.equal(createHi20K5KitchenWellPresentation(g,K5_SOURCE_SHA).available,false);
});
