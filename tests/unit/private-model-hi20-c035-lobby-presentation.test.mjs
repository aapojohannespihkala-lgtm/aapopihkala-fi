import test from 'node:test';
import assert from 'node:assert/strict';
import {C035_SOURCE_SHA,createHi20C035LobbyPresentation}
  from '../../src/scripts/privateModelHi20C035LobbyPresentation.mjs';

function material(transparent=false) {
  return {color:{r:0.93,g:0.93,b:0.93},transparent,opacity:transparent?0.83:1,
    depthWrite:!transparent, disposed:false,
    clone(){return material(this.transparent);},
    dispose(){this.disposed=true;}};
}
function fixture(){
  const associations=new Map(), nodes=Array.from({length:6463},()=>({}));
  const meshes=Array.from({length:1859},()=>({primitives:[]}));
  const scenes=Array.from({length:52},()=>({
    children:[],traverse(fn){for(const x of this.children) fn(x);},
  }));
  const objects=new Map();
  for(const [scene,root,ref,ids] of [
    [50,6349,6379,[6346,6347,6348]],
    [51,6400,6394,[6397,6398,6399]]
  ]){
    nodes[root]={children:ids};
    nodes[ref]={mesh:1835};
    const r={name:'wall reference',isMesh:true,material:material(),parent:scenes[scene]};
    scenes[scene].children.push(r);associations.set(r,{nodes:ref});objects.set(ref,r);
    for(let i=0;i<3;i++){
      const id=ids[i], idx=1730+i;
      nodes[id]={mesh:idx,extras:{sourceLinks:[{doc:'C80-035'}]}};
      meshes[idx]={primitives:[{material:224}]};
      const obj={isMesh:true,material:material(true),geometry:{identity:id},
        visible:true,parent:scenes[scene]};
      associations.set(obj,{nodes:id});
      scenes[scene].children.push(obj);objects.set(id,obj);
    }
  }
  meshes[1835]={primitives:[{material:335}]};
  const gltf={scenes,parser:{associations,json:{
    asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:52},()=>({})),nodes,meshes,
  }}};
  return {gltf,objects};
}
test('only six existing opening parts turn white, no new door or geometry, all restored',()=>{
  const f=fixture();const before=new Map([...f.objects].map(([id,obj])=>[id,obj.material]));
  const api=createHi20C035LobbyPresentation(f.gltf,C035_SOURCE_SHA);
  assert.equal(api.available,true);assert.equal(api.count,6);
  assert.equal(api.setEnabled(true),true);
  for(const id of [6346,6347,6348,6397,6398,6399]){
    const obj=f.objects.get(id);
    assert.notEqual(obj.material,before.get(id));
    assert.equal(obj.material.transparent,false);
    assert.equal(obj.geometry.identity,id);
    assert.equal(obj.visible,true);
    assert.deepEqual(f.gltf.parser.json.nodes[id].extras.sourceLinks,[{doc:'C80-035'}]);
  }
  for(const id of [6379,6394]) assert.equal(f.objects.get(id).material,before.get(id));
  assert.equal(api.setEnabled(true),true);
  api.dispose();
  for(const [id,obj] of f.objects) assert.equal(obj.material,before.get(id));
});
test('wrong SHA, missing root child or material => no partial presentation',()=>{
  const f=fixture();
  assert.equal(createHi20C035LobbyPresentation(f.gltf,'wrong').available,false);
  f.gltf.parser.json.nodes[6400].children.pop();
  const api=createHi20C035LobbyPresentation(f.gltf,C035_SOURCE_SHA);
  assert.equal(api.available,false);
  assert.equal(f.objects.get(6346).material.transparent,true);
  f.gltf.parser.json.nodes[6400].children.push(6399);
  f.gltf.parser.json.meshes[1730].primitives[0].material=999;
  assert.equal(createHi20C035LobbyPresentation(f.gltf,C035_SOURCE_SHA).available,false);
});
test('missing scene binding, failed clone, and disabled state preserve original',()=>{
  const f=fixture();
  f.gltf.parser.associations.delete(f.objects.get(6399));
  assert.equal(createHi20C035LobbyPresentation(f.gltf,C035_SOURCE_SHA).available,false);
  f.gltf.parser.associations.set(f.objects.get(6399),{nodes:6399});
  const api=createHi20C035LobbyPresentation(f.gltf,C035_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setEnabled(true),true);
  assert.equal(api.setEnabled(false),true);
  assert.equal(f.objects.get(6399).material.transparent,true);
});
