import test from 'node:test';
import assert from 'node:assert/strict';
import {createUnified64C035LobbyPresentation,U64_C035_SHA}
 from '../../src/scripts/privateModelUnified64C035LobbyPresentation.mjs';
function fixture(){
  const nodes=Array.from({length:6518},()=>({}));
  const scenes=Array.from({length:64},()=>({children:[],traverse(cb){
    for(const o of this.children){cb(o);for(const child of o.children||[])cb(child);
  }}));
  const sources=Array.from({length:64},()=>({nodes:[]}));
  const materials=Array.from({length:350},()=>({alphaMode:'OPAQUE'}));
  materials[335]={alphaMode:'OPAQUE',pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1]}};
  const meshes=Array.from({length:1860},()=>({primitives:[]}));
  meshes[1835]={primitives:[{material:335}]};
  for(let i=0;i<3;i++)meshes[1730+i]={primitives:[{material:224}]};
  const assoc=new Map(),jambs=[];
  for(const [scene,root,ref,ids] of [[60,6349,6379,[6346,6347,6348]],[63,6400,6394,[6397,6398,6399]]]){
    sources[scene].nodes.push(root,ref);
    nodes[root]={name:'C80-035_D1F_LOBBY_CORRIDOR_DOORLESS',children:ids,
      extras:{ownerCorrection:'2026-10-30 NO DOOR',current:false,asBuilt:false}};
    nodes[ref]={mesh:1835};
    const sceneObj=scenes[scene];
    const reference={isMesh:true,parent:sceneObj,
      material:{transparent:false,clone(){return {color:'white',dispose(){}}}}};
    sceneObj.children.push(reference);assoc.set(reference,{nodes:ref});
    for(let i=0;i<3;i++){
      nodes[ids[i]]={name:'C80-035_HI16_'+i,mesh:1730+i,
        extras:{workAssumption:true,sourceLinks:[{role:'primary'},{role:'support'}]}};
      const original={name:'beige',clone(){return {color:'white',dispose(){this.disposed=true;}}}};
      const mesh={isMesh:true,parent:sceneObj,material:original};
      sceneObj.children.push(mesh);assoc.set(mesh,{nodes:ids[i]});jambs.push({mesh,original});
    }
  }
  return {gltf:{scenes,parser:{associations:assoc,json:{asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:sources,nodes,meshes,materials}}},jambs};
}
test('six exact white passage surfaces in both 1F and BOTH, reversible and idempotent',()=>{
  const f=fixture(),api=createUnified64C035LobbyPresentation(f.gltf,U64_C035_SHA);
  assert.equal(api.available,true);assert.equal(api.count,6);
  assert(api.setEnabled(true));assert(api.setEnabled(true));
  for(const j of f.jambs){assert.equal(j.mesh.material.color,'white');assert.equal(j.mesh.material.opacity,1);}
  assert(api.setEnabled(false));
  for(const j of f.jambs)assert.equal(j.mesh.material,j.original);
  api.dispose();
});
test('wrong source SHA or missing root or changed material fail closed',()=>{
  const f=fixture();assert.equal(createUnified64C035LobbyPresentation(f.gltf,'other').available,false);
  f.gltf.parser.json.scenes[60].nodes=[];
  assert.equal(createUnified64C035LobbyPresentation(f.gltf,U64_C035_SHA).available,false);
  assert(f.jambs.every(x=>x.mesh.material===x.original));
  f.gltf.parser.json.scenes[60].nodes=[6349,6379];
  f.gltf.parser.json.meshes[1730].primitives[0].material=15;
  assert.equal(createUnified64C035LobbyPresentation(f.gltf,U64_C035_SHA).available,false);
});
test('restores after dispose without modifying other model scenes',()=>{
  const f=fixture(),other={isMesh:true,material:{color:'other'}};
  f.gltf.scenes[62].children.push(other);
  const api=createUnified64C035LobbyPresentation(f.gltf,U64_C035_SHA);
  assert(api.setEnabled(true));api.dispose();
  assert.equal(other.material.color,'other');
  assert(f.jambs.every(x=>x.mesh.material===x.original));
});
