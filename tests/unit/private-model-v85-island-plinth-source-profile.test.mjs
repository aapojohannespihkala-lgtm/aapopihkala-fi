import test from 'node:test';
import assert from 'node:assert/strict';
import {V85_WHITE_PLINTH as P,verifyV85WhitePlinthSource,v85ActiveSceneNodes}
  from '../../src/scripts/privateModelV85IslandPlinthSourceProfile.mjs';
function fixture(){
  const nodes=Array.from({length:P.nodeCount},()=>({}));
  const meshes=Array.from({length:P.meshCount},()=>({}));
  const scenes=Array.from({length:P.sceneCount},()=>({nodes:[]}));
  const materials=Array.from({length:P.materialCount},()=>({}));
  nodes[P.oldNode]={name:'V85_D2F_ISLAND_PLINTH_100MM_DARK_RECESSED_30MM',mesh:P.oldMesh};
  nodes[P.newNode]={name:'V85_D2F_ISLAND_PLINTH_100MM_WHITE_RECESSED_30MM_OWNER_WORK_TEST',
    mesh:P.newMesh,extras:{current:false,asBuilt:false,ownerCorrection:'plinth same white'}};
  meshes[P.oldMesh]={primitives:[{attributes:{POSITION:9106},indices:9072,material:P.oldMaterial}]};
  meshes[P.newMesh]={primitives:[{attributes:{POSITION:9106},indices:9072,material:P.whiteMaterial}]};
  materials[P.whiteMaterial]={name:'C80R2_V17_KVIK_FRONT_BRIGHT_WHITE_VIEW',
    pbrMetallicRoughness:{baseColorFactor:[0.97,0.97,0.965,1]}};
  for(const [key,m] of Object.entries(P.sceneMap)){
    const i=Number(key);
    const oldRoots=Array.from({length:m.rootCount},(_,k)=>k+1);
    oldRoots[m.replacedAt]=P.oldNode;scenes[m.from]={nodes:oldRoots};
    const newRoots=[...oldRoots];newRoots[m.replacedAt]=P.newNode;
    scenes[i]={nodes:newRoots,extras:{islandPlinthCorrection:{
      parentScene:m.from,originalNode:P.oldNode,replacementNode:P.newNode,
      originalMesh:P.oldMesh,replacementMesh:P.newMesh,
      originalMaterial:P.oldMaterial,replacementMaterial:P.whiteMaterial,
      geometryChanged:false,sourceGlbSha256:P.parentGlbSha256,
      productionWebGLVerified:false,humanReview:'NOT_RUN',stage:P.stage}}};
  }
  return {sha256:P.glbSha256,bytes:P.glbBytes,driveId:P.driveId,
    gltf:{scene:P.defaultScene,scenes,nodes,meshes,materials}};
}
test('seven material-only active scenes with source exact identity',()=>{
  const r=verifyV85WhitePlinthSource(fixture());
  assert.equal(r.ok,true,r.reason);
  assert.deepEqual(r.scenes,[369,370,371,372,373,374,375]);
  assert.equal(r.sourceLinks,'NOT_BOUND_NEW_SHA');
  assert.equal(r.productionWebGL,'NOT_RUN');
  assert.equal(r.humanReview,'NOT_RUN');
});
test('wrong SHA, bytes, Drive ID or default scene fails closed',()=>{
  const f=fixture();
  for(const wrong of [{sha256:P.parentGlbSha256},{bytes:P.glbBytes+1},
                     {driveId:P.parentDriveId}])
    assert.equal(verifyV85WhitePlinthSource({...f,...wrong}).reason,'SOURCE_IDENTITY_MISMATCH');
  f.gltf.scene=369;
  assert.equal(verifyV85WhitePlinthSource(f).reason,'STRUCTURE_MISMATCH');
});
test('only the original indices and POSITION may be reused, not altered',()=>{
  const f=fixture();
  f.gltf.meshes[P.newMesh].primitives[0].attributes.POSITION=9107;
  assert.equal(verifyV85WhitePlinthSource(f).reason,'MATERIAL_ONLY_COW_MISMATCH');
  f.gltf.meshes[P.newMesh].primitives[0].attributes.POSITION=9106;
  f.gltf.nodes[P.newNode].translation=[1,0,0];
  assert.equal(verifyV85WhitePlinthSource(f).reason,'PLINTH_TRANSFORM_MISMATCH');
});
test('inactive exploded-island legacy nodes are not active scene members',()=>{
  const f=fixture(),a=v85ActiveSceneNodes(f.gltf,369);
  assert.equal(a.ok,true);
  assert.equal(a.nodes.has(P.newNode),true);
  assert.equal(a.nodes.has(P.oldNode),false);
  assert.equal(a.nodes.has(9258),false);
  assert.equal(a.nodes.has(9399),false);
  f.gltf.scenes[369].nodes.push(9399);
  assert.equal(verifyV85WhitePlinthSource(f).reason,'SCENE_369_ROOT_MISMATCH');
});
test('invalid child references and cycles fail closed',()=>{
  const f=fixture();
  f.gltf.nodes[1].children=[1];
  assert.equal(v85ActiveSceneNodes(f.gltf,369).reason,'SCENE_CYCLE');
  assert.equal(verifyV85WhitePlinthSource(f).reason,'SCENE_369_VISIBILITY_MISMATCH');
  f.gltf.nodes[1].children=[P.nodeCount];
  assert.equal(v85ActiveSceneNodes(f.gltf,369).reason,'INVALID_NODE_INDEX');
});
test('no CURRENT, as-built or human-review promotion',()=>{
  const f=fixture();
  f.gltf.nodes[P.newNode].extras.current=true;
  assert.equal(verifyV85WhitePlinthSource(f).reason,'MATERIAL_ONLY_COW_MISMATCH');
  assert.equal(P.current,false);assert.equal(P.asBuilt,false);
  assert.equal(P.humanReview,'NOT_RUN');
});
