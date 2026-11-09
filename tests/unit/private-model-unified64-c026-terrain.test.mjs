import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,Mesh,MeshStandardMaterial,BufferGeometry,Float32BufferAttribute} from 'three';
import {createUnified64C026TerrainPresentation,U64_C026_SHA}
  from '../../src/scripts/privateModelUnified64C026TerrainPresentation.mjs';

function fixture(){
  const scenes=Array.from({length:64},()=>new Group());
  const nodes=Array.from({length:6518},()=>({}));
  const meshes=Array.from({length:1873},()=>({}));
  meshes[1547]={primitives:[{material:212},{material:212}]};
  const name='P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_MATERIAL';
  const materials=Array.from({length:213},()=>({}));
  materials[212]={name,alphaMode:'BLEND',
    pbrMetallicRoughness:{baseColorFactor:[.34,.42,.28,.58]},
    extras:{physicalGroundSurfaceClaim:false}};
  const js=Array.from({length:64},()=>({nodes:[]}));
  const associations=new Map(),originals=[];
  for(const [sc,id,parent,suffix] of [[60,5141,6454,'SCENE1'],[63,5100,6456,'SCENE0']]){
    const nName='HI12_SITE_V7_SCALGO_TERRAIN_'+suffix+'_WORK_TEST';
    const pName='C80R1_SCALGO_SITE_CONTEXT_'+suffix;
    nodes[id]={name:nName,mesh:1547,extras:{sourceOnly:true,physicalHost:'HOST_HOLD',physicalStructureApproved:false}};
    nodes[parent]={name:pName,children:[id]};
    js[sc].nodes.push(parent);
    const p=new Group();p.name=pName;scenes[sc].add(p);associations.set(p,{nodes:parent});
    const terrain=new Group();terrain.name=nName;p.add(terrain);associations.set(terrain,{nodes:id});
    const geom=new BufferGeometry();
    geom.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
    const mat=new MeshStandardMaterial();mat.name=name;
    terrain.add(new Mesh(geom,mat));originals.push({scene:sc,children:scenes[sc].children.length});
  }
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:js,nodes,meshes,materials};
  return {gltf:{scenes,parser:{json,associations}},originals};
}
test('U64 1F60+BOTH63 use four donor patches and restore exact original roots',()=>{
  const f=fixture();
  const x=createUnified64C026TerrainPresentation(f.gltf,U64_C026_SHA);
  assert.equal(x.available,true,x.reason);assert.equal(x.count,4);
  assert.equal(f.gltf.scenes[60].children.length,3);
  assert.equal(f.gltf.scenes[63].children.length,3);
  assert.equal(f.gltf.scenes[62].children.length,0);
  assert.equal(x.setEnabled(true),true);
  for(const sc of [60,63]){
    const patch=f.gltf.scenes[sc].children.slice(1);
    assert.deepEqual(patch.map(m=>m.geometry.getAttribute('position').count),[96,63]);
    assert.ok(patch.every(m=>m.visible&&m.userData.physicalHost==='HOST_HOLD'));
  }
  x.dispose();x.dispose();
  for(const sc of [60,63])assert.equal(f.gltf.scenes[sc].children.length,1);
  assert.equal(x.setEnabled(true),false);
});
test('wrong 64scene SHA and node-parent-scene provenance fail closed',()=>{
  const f=fixture();
  assert.equal(createUnified64C026TerrainPresentation(f.gltf,'invalid').available,false);
  f.gltf.parser.json.nodes[6454].children=[];
  const p=createUnified64C026TerrainPresentation(f.gltf,U64_C026_SHA);
  assert.equal(p.available,false);
  assert.equal(f.gltf.scenes[60].children.length,1);
});
test('material identity and prior imported patches fail closed',()=>{
  const f=fixture();
  f.gltf.parser.json.materials[212].pbrMetallicRoughness.baseColorFactor[3]=1;
  assert.equal(createUnified64C026TerrainPresentation(f.gltf,U64_C026_SHA).available,false);
  const z=fixture();
  z.gltf.parser.json.nodes[100].name='C80-026_D_ADJACENT_TERRAIN_REMAINDER_1F_ALREADY_PRESENT';
  assert.equal(createUnified64C026TerrainPresentation(z.gltf,U64_C026_SHA).available,false);
});
