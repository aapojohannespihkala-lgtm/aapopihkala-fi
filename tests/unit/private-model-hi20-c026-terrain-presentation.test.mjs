import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BufferGeometry,Mesh,MeshStandardMaterial,Group,Float32BufferAttribute} from 'three';
import {C026_SOURCE_SHA,C026_DONOR_SHA,C026_PATCHES,createHi20C026TerrainPresentation}
 from '../../src/scripts/privateModelHi20C026TerrainPresentation.mjs';
function source(){
 const scenes=Array.from({length:52},()=>new Group());
 const nodes=Array.from({length:6463},()=>({}));
 const meshes=Array.from({length:1859},()=>({}));
 const sj=Array.from({length:52},()=>({nodes:[]}));
 const materials=Array.from({length:213},()=>({}));
 materials[212]={name:'P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_MATERIAL',
   alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[.34,.42,.28,.58]}};
 const assoc=new Map();
 for(const [s,id,name] of [[50,5141,'HI12_SITE_V7_SCALGO_TERRAIN_SCENE1_WORK_TEST'],[51,5100,'HI12_SITE_V7_SCALGO_TERRAIN_SCENE0_WORK_TEST']]){
    nodes[id]={mesh:1547,name};
    sj[s].nodes=[id];
    const root=new Group();root.name=name;
    const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0,0,0,1],3));
    const mat=new MeshStandardMaterial({transparent:true,opacity:.58});
    mat.name=materials[212].name;
    root.add(new Mesh(geo,mat));scenes[s].add(root);assoc.set(root,{nodes:id});
 }
 return {scenes,parser:{json:{scene:0,nodes,meshes,materials,scenes:sj},associations:assoc}};
}
test('donor packed positions byte-identical to verified 56scene meshes',()=>{
 for(const p of C026_PATCHES){
  const bytes=Buffer.from(p.b64,'base64');
  assert.equal(bytes.length,p.count*12);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha);
 }
 assert.equal(C026_DONOR_SHA,'5f293f76efce1cdf86d5d46b8123987d804391a82a0ee8443a9b0d5f3c602df7');
});
test('exact 52scene 1F/BOTH attaches four distinct source-backed meshes, reversible',()=>{
 const g=source();const original=g.scenes[50].children[0];
 const p=createHi20C026TerrainPresentation(g,C026_SOURCE_SHA);
 assert.equal(p.available,true,p.reason);assert.equal(p.count,4);
 assert.equal(g.scenes[50].children.length,3);assert.equal(g.scenes[51].children.length,3);
 assert.equal(g.scenes[49].children.length,0);
 assert.equal(g.scenes[50].children[0],original);
 assert.ok(g.scenes[50].children.slice(1).every(m=>m.isMesh&&!m.visible));
 assert.ok(p.setEnabled(true));assert.ok(g.scenes[50].children.slice(1).every(m=>m.visible));
 for(const [s,id] of [[50,5141],[51,5100]]){
   const members=g.scenes[s].children.slice(1);
   assert.deepEqual(members.map(m=>m.geometry.attributes.position.count),[96,63]);
   assert.ok(members.every(m=>m.material.name==='P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_MATERIAL'));
   assert.ok(members.every(m=>m.userData.asBuilt===false && m.userData.current===false));
   assert.ok(members.every(m=>m.geometry.boundingSphere!==null||m.geometry.boundingSphere===null));
   assert.equal(g.parser.json.nodes[id].mesh,1547);
 }
 p.setEnabled(false);assert.ok(g.scenes[51].children.slice(1).every(m=>!m.visible));
 p.dispose();p.dispose();
 assert.equal(g.scenes[50].children.length,1);assert.equal(g.scenes[51].children.length,1);
 assert.equal(p.setEnabled(true),false);
});
test('fails closed on SHA, missing parent, wrong source terrain and pre-integrated mesh',()=>{
 const g=source();
 assert.equal(createHi20C026TerrainPresentation(g,'wrong').available,false);
 g.parser.json.nodes[5141].mesh=42;
 assert.equal(createHi20C026TerrainPresentation(g,C026_SOURCE_SHA).available,false);
 g.parser.json.nodes[5141].mesh=1547;
 g.parser.json.nodes.push({name:'C80-026_TERRACE_SOURCE_FRINGE_PATCH_SCENE52'});
 assert.equal(createHi20C026TerrainPresentation(g,C026_SOURCE_SHA).available,false);
 assert.equal(g.scenes[50].children.length,1);
});
