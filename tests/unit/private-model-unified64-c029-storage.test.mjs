import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Mesh, BufferGeometry, Float32BufferAttribute, Matrix4, MeshBasicMaterial, BoxGeometry } from 'three';
import { createUnified64C029StoragePresentation, U64_C029_SHA }
  from '../../src/scripts/privateModelUnified64C029StoragePresentation.mjs';

const N={
5754:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4978',
5755:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4979',
5757:'C80_029_HI13_D_STORAGE_ROOF_C_TO_D_SOURCE_ONLY_OPTIN_HOST_HOLD',
5775:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4966',
5776:'C80_029_D_STORAGE_VISIBLE_WALL_OPTIN_WORK_TEST__HI13_NODE_4967',
5778:'C80_029_HI13_D_STORAGE_ROOF_C_TO_D_SOURCE_ONLY_OPTIN_HOST_HOLD'
};
function fixture(){
 const scenes=Array.from({length:64},()=>new Scene());
 const model={asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:64},()=>({nodes:[]})),
    nodes:Array.from({length:6518},()=>({})),
    meshes:Array.from({length:1873},()=>({primitives:[]})),
    materials:Array.from({length:334},()=>({}))};
 const assoc=new Map();
 for(const [mesh,material] of [[1725,281],[1726,281],[514,85],[1820,333]]){
   model.meshes[mesh]={primitives:[{material}]};
 }
 model.materials[333]={pbrMetallicRoughness:{baseColorFactor:[.93,.93,.93,1]}};
 model.materials[85]={alphaMode:'BLEND',pbrMetallicRoughness:{baseColorFactor:[.86,.87,.88,.58]}};
 const srcMat=new MeshBasicMaterial({color:0x7799aa}),
       white=new MeshBasicMaterial({color:0xffffff}),
       roofMat=new MeshBasicMaterial({transparent:true,opacity:.58});
 const originalMatrix=[1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1];
 const specs=[
  {from:8,target:60,door:6345,roots:49,ids:[5754,5755,5757]},
  {from:9,target:63,door:6396,roots:84,ids:[5775,5776,5778]}
 ];
 const sources=[];
 for(const sp of specs){
  model.scenes[sp.target].nodes=[sp.door,...Array.from({length:sp.roots-1},(_,i)=>4000+i)];
  const doorName='C80_047_D1F_STORAGE_EAST_DOORWALL';
  model.nodes[sp.door]={name:doorName,mesh:1820,extras:{
    physicalHost:'HOST_HOLD',sourceNodeHI13:4980,
    sourceDriveId:'1OladB8m0WJYVkBJARTKsi1xYNoW8px1M'}};
  const d=new Mesh(new BoxGeometry(.10,2.75,2.3),white);
  d.name=doorName;scenes[sp.target].add(d);assoc.set(d,{nodes:sp.door});
  for(let i=1;i<sp.roots;i++)scenes[sp.target].add(new Mesh());
  for(let i=0;i<3;i++){
   const id=sp.ids[i],kind=i===0?'WEST':i===1?'NORTH':'ROOF';
   const xyz=kind==='WEST'?
     [[0,8.928,0],[0,10.810,0],[0,10.810,2.760],
      [0,8.928,0],[0,10.810,2.760],[0,8.928,2.760]]:
     [[0,10.810,0],[2.337,10.810,0],[2.337,10.810,2.760],
      [0,10.810,0],[2.337,10.810,2.760],[0,10.810,2.760]];
   const geo=kind==='ROOF'?new BoxGeometry(2.106,.001,1.616):
     new BufferGeometry();
   if(kind!=='ROOF')
     geo.setAttribute('position',new Float32BufferAttribute(xyz.flat(),3));
   const mesh=new Mesh(geo,kind==='ROOF'?roofMat:srcMat);
   mesh.name=N[id];mesh.matrixAutoUpdate=false;
   const matrix=kind==='ROOF'
     ?[2.106,0,0,0,0,0,-1.616,0,0,1,0,0,1.284,2.760,-9.736,1]
     :originalMatrix;
   mesh.matrix.fromArray(matrix);
   scenes[sp.from].add(mesh);assoc.set(mesh,{nodes:id});sources.push(mesh);
   model.scenes[sp.from].nodes.push(id);
   model.nodes[id]={name:N[id],mesh:kind==='ROOF'?514:kind==='WEST'?1725:1726,
      matrix,extras:{
        stage:'WORK_TEST',physicalHost:'HOST_HOLD',
        sourceLinksRequireRebind:true,sourceDriveId:'source-drive',
        ...(kind==='ROOF'?{roofHostValidated:false,sourceOnly:true}:{
          presentationOnly:true,sourceOnly:false,representationKind:'SOURCE_CONTEXT'})
      }};
  }
 }
 return {gltf:{scenes,parser:{json:model,associations:assoc}},
   source:sources,doors:[scenes[60].children[0],scenes[63].children[0]]};
}
test('real source WEST/NORTH/ROOF reused as six nonduplicated 1F+BOTH roots',()=>{
 const {gltf,source,doors}=fixture();
 const before=gltf.scenes.map(s=>s.children.length);
 const p=createUnified64C029StoragePresentation(gltf,U64_C029_SHA);
 assert.equal(p.available,true,p.reason);assert.equal(p.count,6);
 assert.equal(p.enabled,true);
 for(const [s,door] of [[60,doors[0]],[63,doors[1]]]){
   assert.equal(gltf.scenes[s].children.length,before[s]+3);
   assert.equal(gltf.scenes[s].children[0],door);
   const added=gltf.scenes[s].children.slice(-3);
   assert.deepEqual(added.map(o=>o.name.includes('ROOF')?'ROOF':
       o.name.includes('4978')||o.name.includes('4966')?'WEST':'NORTH'),
      ['WEST','NORTH','ROOF']);
   assert.equal(added[0].material,door.material);
   assert.equal(added[1].material,door.material);
   assert.equal(added[0].userData.c029WallThicknessM,.060);
   assert.equal(added[1].userData.c029WallThicknessM,.060);
   assert.equal(added[2].geometry,source[s===60?2:5].geometry);
 }
 assert.equal(gltf.scenes[62].children.length,before[62]);
 assert.equal(p.setEnabled(false),true);
 for(const s of [60,63])
   assert.ok(gltf.scenes[s].children.slice(-3).every(o=>o.visible===false));
 assert.equal(p.setEnabled(true),true);
 p.dispose();
 assert.deepEqual(gltf.scenes.map(s=>s.children.length),before);
 assert.equal(p.setEnabled(true),false);
 assert.ok(source.slice(0,3).every(o=>o.parent===gltf.scenes[8]));
 assert.ok(source.slice(3).every(o=>o.parent===gltf.scenes[9]));
});
test('source SHA/parent/host and active scene target guards fail closed',()=>{
 for(const edit of [
   g=>g.parser.json.nodes[5754].extras.physicalHost='CURRENT',
   g=>g.parser.json.nodes[5778].extras.roofHostValidated=true,
   g=>g.parser.json.scenes[60].nodes.push(5754),
   g=>g.parser.json.scenes[9].nodes=[],
   g=>g.parser.json.nodes[6345].mesh=1234,
   g=>g.parser.json.materials[333].pbrMetallicRoughness.baseColorFactor[0]=.8
 ]){
   const {gltf}=fixture();edit(gltf);
   const n=gltf.scenes[60].children.length;
   const p=createUnified64C029StoragePresentation(gltf,U64_C029_SHA);
   assert.equal(p.available,false,p.reason);
   assert.equal(gltf.scenes[60].children.length,n);
 }
 const g=fixture().gltf;
 assert.equal(createUnified64C029StoragePresentation(g,'wrong-sha').available,false);
});
test('idempotent dispose, independent 2F and no hidden old wall behind new',()=>{
 const {gltf}=fixture();const p=createUnified64C029StoragePresentation(gltf,U64_C029_SHA);
 assert.equal(p.available,true,p.reason);
 for(const sc of [60,63]){
   const clones=gltf.scenes[sc].children.filter(o=>o.userData.c029U64Clone===true);
   assert.equal(clones.length,3);
   assert.equal(clones.filter(x=>x.name.includes('WALL')).length,2);
   assert.ok(clones.every(x=>!gltf.parser.associations.has(x)));
 }
 const again=createUnified64C029StoragePresentation(gltf,U64_C029_SHA);
 assert.equal(again.available,false);
 p.dispose();p.dispose();
 assert.equal(gltf.scenes[60].children.some(o=>o.userData.c029U64Clone),false);
});

test('C80-029 exact U64 mesh roster: 1873 accepted, mistaken PR1646 1861 rejected',()=>{
 const valid=fixture().gltf;
 const ok=createUnified64C029StoragePresentation(valid,U64_C029_SHA);
 assert.equal(ok.available,true,ok.reason);
 assert.equal(ok.count,6);
 ok.dispose();
 const old=fixture().gltf;
 old.parser.json.meshes.length=1861;
 const denied=createUnified64C029StoragePresentation(old,U64_C029_SHA);
 assert.equal(denied.available,false);
 assert.equal(denied.reason,'exact-source');
 assert.equal(old.scenes[60].children.length,49);
 assert.equal(old.scenes[63].children.length,84);
});
