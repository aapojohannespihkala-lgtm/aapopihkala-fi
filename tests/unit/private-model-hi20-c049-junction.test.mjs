import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C049FenceJunctionPresentation,C049_SOURCE_SHA}
 from '../../src/scripts/privateModelHi20C049FenceJunctionPresentation.mjs';

function attr(vertices) {
 return {count:vertices.length, getX:i=>vertices[i][0],
  getY:i=>vertices[i][1],getZ:i=>vertices[i][2],
  setY(i,y){vertices[i][1]=y;},clone:()=>attr(vertices.map(x=>[...x]))};
}
const cap=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],
           [-.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
function geo(){
 const v=Array.from({length:30},(_,i)=>[
  i&1?.5:-.5, i&2?.5:-.5, i&4?.5:-.5]).concat(cap.map(x=>[...x]));
 const p=attr(v); const index={count:36,getX:i=>i};
 return {index,getAttribute:n=>n==='position'?p:null,
  clone(){return {index,getAttribute:n=>n==='position'?p.clone():null,
   computeBoundingBox(){},computeBoundingSphere(){},dispose(){this.disposed=true;}};},
  dispose(){this.disposed=true;}};
}
const mat=(size,mid)=>({elements:[
 size[0],0,0,0,0,size[1],0,0,0,0,size[2],0,...mid,1]});
function fixture(){
 const json={scene:0,asset:{version:'2.0',extras:{current:false,asBuilt:false}},
  scenes:Array.from({length:52},()=>({nodes:[]})),
  nodes:Array.from({length:6463},()=>({})),
  meshes:Array.from({length:1859},()=>({})),
  materials:Array.from({length:283},()=>({}))};
 json.meshes[1728]={name:'C80-028_D_C_K3_EXISTING_SOURCE_MESH_OPAQUE_OPTIN_REVIEW',
  primitives:[{attributes:{POSITION:2567},indices:2568,material:282}]};
 json.materials[282]={name:'C80-028_D_C_BOUNDARY_OPAQUE_REVIEW_MATERIAL_SOURCE_ONLY',
  doubleSided:true,extras:{physicalHost:'HOST_HOLD'}};
 const scenes=Array.from({length:52},()=>({objects:[],updateMatrixWorld(){},
  traverse(fn){this.objects.forEach(fn);}})),associations=new Map(),targets=[];
 const specs=[
  [50,6459,6458,1451,1463,'1F'],
  [51,6462,6461,192,204,'BOTH']];
 const wallMat=mat([.25,2.91,1.704],[6.375,1.305,.852]);
 const postMat=mat([.25,1.54,.092],[6.375,.66,1.75]);
 const lowerMat=mat([.25,.3410914,.092],[6.375,-.2655457,1.75]);
 for(const [scene,root,node,post,lower,scope] of specs){
  const name='HI20_INTEGRATED_C045_C049_K14_C80-049_COW_DC_WALL_SOURCE_CONTEXT_SCREENPOST_Z1704_'+scope+'_WORK_TEST_HOST_HOLD';
  json.scenes[scene].nodes=[root];
  json.nodes[root]={children:[node]};
  json.nodes[node]={name,mesh:1728,extras:{sourceOnly:true,presentationOnly:true,
   physicalHost:'HOST_HOLD',canApplyToViewer:false,representationKind:'SOURCE_CONTEXT',
   sourceDriveId:'1OladB8m0WJYVkBJARTKsi1xYNoW8px1M',
   sourceGLBSHA256:'145398c5fee2fccbedb820c4049117795fa1035265696511c854ba617ffe7b71'}};
  json.nodes[post]={mesh:288}; json.nodes[lower]={mesh:300};
  function obj(id,n,geoObj,m){
   const o={name:n,isMesh:true,visible:true,geometry:geoObj,matrixWorld:m};
   associations.set(o,{nodes:id});scenes[scene].objects.push(o);return o;
  }
  const wall=obj(node,name,geo(),wallMat);targets.push(wall);
  obj(post,'screen-post',geo(),postMat);obj(lower,'lower-extension',geo(),lowerMat);
 }
 return {gltf:{scenes,parser:{json,associations}},targets};
}
test('C049 removes only physically covered source-only cap segment in both mounted scenes',()=>{
 const {gltf,targets}=fixture(),original=targets.map(x=>x.geometry);
 const s=createHi20C049FenceJunctionPresentation(gltf,C049_SOURCE_SHA);
 assert.equal(s.available,true,s.reason);assert.equal(s.count,2);
 assert.equal(s.setEnabled(true),true);assert.equal(s.enabled,true);
 for(let i=0;i<2;i++){
  const g=targets[i].geometry,p=g.getAttribute('position');
  assert.notEqual(g,original[i]);
  assert.ok(Math.abs(p.getY(24)-(1.43-1.305)/2.91)<1e-7);
  assert.ok(Math.abs(p.getY(25)-(1.43-1.305)/2.91)<1e-7);
  for(let n=0;n<24;n++)assert.equal(p.getY(n),original[i].getAttribute('position').getY(n));
  assert.equal(original[i].getAttribute('position').getY(24),-.5);
 }
 assert.equal(s.setEnabled(true),true);
 s.dispose();assert.equal(s.enabled,false);
 targets.forEach((x,i)=>assert.equal(x.geometry,original[i]));
});
test('C049 rejects unverified source, node, parent, post, or cap coordinates',()=>{
 const tweaks=[
  g=>g.parser.json.nodes[6459].children=[],
  g=>g.parser.json.nodes[6458].extras.sourceOnly=false,
  g=>g.parser.json.nodes[6461].extras.sourceDriveId='wrong',
  g=>g.parser.json.nodes[192].mesh=1,
  g=>g.scenes[50].objects[1].visible=false,
  g=>g.scenes[51].objects[0].geometry.getAttribute('position').setY(24,123),
 ];
 for(const tweak of tweaks){
  const {gltf,targets}=fixture(),src=targets.map(x=>x.geometry);tweak(gltf);
  const x=createHi20C049FenceJunctionPresentation(gltf,C049_SOURCE_SHA);
  assert.equal(x.available,false,x.reason);targets.forEach((t,i)=>assert.equal(t.geometry,src[i]));
 }
 assert.equal(createHi20C049FenceJunctionPresentation(fixture().gltf,'wrong').available,false);
});
