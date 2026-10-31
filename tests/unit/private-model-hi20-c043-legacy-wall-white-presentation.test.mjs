import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C043LegacyWallWhitePresentation,C043_LEGACY_SOURCE_SHA}
  from '../../src/scripts/privateModelHi20C043LegacyWallWhitePresentation.mjs';

function material(color='old'){
  return {color:{name:color},opacity:1,transparent:false,depthWrite:true,
    clone(){return material('white');},dispose(){this.disposed=true;}};
}
function fixture(){
  const nodes=Array.from({length:6463},()=>({}));
  const meshes=Array.from({length:1859},()=>({primitives:[]}));
  const materials=Array.from({length:341},()=>({}));
  const scenes=Array.from({length:52},()=>({
    children:[],traverse(fn){this.children.forEach(fn);},
  }));
  const associations=new Map(),objects=new Map();
  materials[340]={alphaMode:'OPAQUE',pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1]}};
  for(const [scene,wallParent,doorParent,reference,walls,door] of [
    [48,6445,6447,6432,[[5077,1541,206,1,'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'],
                              [5079,1543,208,2,'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY']],
      [5084,1546,211,1,'D2F_WC_DOOR_TOP_DISPLAY_ONLY']],
    [51,6450,6452,6438,[[5040,1531,196,1,'D2015_2F_WALL3D_WC_HOST_ABOVE_OPENING'],
                              [5042,1533,198,2,'D2015_2F_WALL3D_ROOM34_BETWEEN_SOURCE_FACES_PROXY']],
      [5047,1536,201,1,'D2F_WC_DOOR_TOP_DISPLAY_ONLY']],
  ]){
    nodes[wallParent]={children:walls.map(x=>x[0])};
    nodes[doorParent]={children:[door[0]]};
    nodes[reference]={mesh:1850,extras:{physicalWall:true,workTestC80_043:{ownerConfirmedWhite:true}}};
    meshes[1850]={primitives:[{material:340}]};
    const root=scenes[scene];
    const refObj={isMesh:true,parent:root,visible:true,material:material('white'),geometry:{reference}};
    root.children.push(refObj);associations.set(refObj,{nodes:reference});objects.set(reference,refObj);
    for(const [id,meshId,matId,links,name] of [...walls,door]){
      nodes[id]={mesh:meshId,name,extras:{sourceLinks:Array.from({length:links},()=>({role:'source'})),
        representationKind:id===door[0]?'doorHeadWorkProxy':'wall3DPresentationProxy',modelStage:'WORK_TEST'}};
      meshes[meshId]={primitives:[{material:matId}]};
      materials[matId]={name:'C80R1_D2015_2F_VISIBLE_WALLS_WORK_ASSUMPTION',
        pbrMetallicRoughness:{baseColorFactor:[.76,.83,.89,1]}};
      const obj={isMesh:true,parent:root,visible:true,material:material(),geometry:{sourceNode:id}};
      root.children.push(obj);associations.set(obj,{nodes:id});objects.set(id,obj);
    }
  }
  const gltf={scenes,parser:{associations,json:{asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:52},()=>({})),nodes,meshes,materials}}};
  return {gltf,objects};
}
test('2F48 and BOTH51 six source wall surfaces recolor white without changing geometry',()=>{
  const f=fixture(),before=new Map([...f.objects].map(([id,x])=>[id,x.material]));
  const api=createHi20C043LegacyWallWhitePresentation(f.gltf,C043_LEGACY_SOURCE_SHA);
  assert.equal(api.available,true,api.reason);
  assert.equal(api.count,6);
  assert.equal(api.setEnabled(true),true);
  assert.equal(api.setEnabled(true),true);
  for(const id of [5077,5079,5084,5040,5042,5047]){
    const o=f.objects.get(id);
    assert.notEqual(o.material,before.get(id));
    assert.equal(o.material.color.name,'white');
    assert.equal(o.geometry.sourceNode,id);
  }
  for(const id of [6432,6438])assert.equal(f.objects.get(id).material,before.get(id));
  api.dispose();
  for(const [id,o] of f.objects)assert.equal(o.material,before.get(id));
});
test('SHA, material, missing sourceLinks and parent guards prevent any mutation',()=>{
  const f=fixture(),m=f.gltf.parser.json;
  assert.equal(createHi20C043LegacyWallWhitePresentation(f.gltf,'wrong').available,false);
  m.materials[208].pbrMetallicRoughness.baseColorFactor[0]=.74;
  assert.equal(createHi20C043LegacyWallWhitePresentation(f.gltf,C043_LEGACY_SOURCE_SHA).available,false);
  m.materials[208].pbrMetallicRoughness.baseColorFactor[0]=.76;
  m.nodes[5079].extras.sourceLinks=[];
  assert.equal(createHi20C043LegacyWallWhitePresentation(f.gltf,C043_LEGACY_SOURCE_SHA).available,false);
  m.nodes[5079].extras.sourceLinks=[{},{}];
  m.nodes[6450].children=[];
  assert.equal(createHi20C043LegacyWallWhitePresentation(f.gltf,C043_LEGACY_SOURCE_SHA).available,false);
  assert.equal(f.objects.get(5079).material.color.name,'old');
});
test('clone exception leaves all six materials untouched',()=>{
  const f=fixture(),ref=f.objects.get(6438);
  ref.material.clone=()=>{throw Error('clone failed');};
  const api=createHi20C043LegacyWallWhitePresentation(f.gltf,C043_LEGACY_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setEnabled(true),false);
  for(const id of [5077,5079,5084,5040,5042,5047])
    assert.equal(f.objects.get(id).material.color.name,'old');
});
