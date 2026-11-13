import test from 'node:test';
import assert from 'node:assert/strict';
import {V27_NO_TRENCH as P,verifyV27NoTrenchSource,v27NoTrenchRootHash} from '../../src/scripts/privateModelV27NoTrenchSourceProfile.mjs';
function mock(){
  const nodes=Array.from({length:P.nodeCount},()=>({}));
  const scenes=Array.from({length:P.sceneCount},()=>({nodes:[]}));
  nodes[P.soilNode]={mesh:P.soilMesh,name:'HI12_SOIL_V27_EAST_WALL_HOST_FOOTPRINT_CLIP_NO_TRENCH_WORK_TEST',
    extras:{current:false,asBuilt:false,sourceOnly:true,presentationOnly:true,physicalHost:'HOST_HOLD',humanReview:'NOT_RUN',
    presentationClip20261114:{operation:'COW_GEOMETRIC_WALL_FOOTPRINT_CLIP_NO_HEIGHT_SHIFT',
      sourceNode:P.priorSoilNode,sourceMesh:P.priorSoilMesh,sourceSHA256:P.parentSha,
      metricElevationChangesInOriginalSource:false,localPresentationOnlySuppression:true,
      removedOnlyHostFootprint:true,terrainDepressionMeters:0,cutXZ:{xmin:6.295,xmax:6.337,zmin:0.025,zmax:1.55}}}};
  nodes[P.sealNode]={mesh:P.sealMesh,extras:{physicalFoundationClaim:false}};
  nodes[P.rootNode]={name:'SOURCE_CONTEXT_V27_UNDERDECK_WALL_HOST_CLIP_ROOT_WORK_TEST',
    extras:{current:false,asBuilt:false,sourceOnly:true,presentationOnly:true,physicalHost:'HOST_HOLD',humanReview:'NOT_RUN',groundNotASlab:true},
    children:[9007,12108,5145,5148,5154,5167,5180,7318,12109]};
  for(const [i,s] of Object.entries(P.sceneMap)){
    const arr=Array.from({length:s.count},(_,k)=>k+1000);arr[0]=P.oldRootNode;
    scenes[s.from]={nodes:arr};
    scenes[i]={name:'V27__V27_SOIL_EAST_WALL_TRIM_WORK_TEST',nodes:[P.rootNode,...arr.slice(1)]};
  }
  return {sha256:P.glbSha,bytes:P.glbBytes,driveId:P.driveId,gltf:{scene:292,scenes,nodes,meshes:Array.from({length:P.meshCount},()=>({}))}};
}
test('acceptance is source SHA, byte length and original Drive ID locked',()=>{
  const a=mock();
  assert.equal(verifyV27NoTrenchSource({...a,sha256:P.supersededSha}).reason,'SOURCE_IDENTITY_MISMATCH');
  assert.equal(verifyV27NoTrenchSource({...a,driveId:P.supersededDriveId}).reason,'SOURCE_IDENTITY_MISMATCH');
  assert.equal(verifyV27NoTrenchSource({...a,bytes:P.glbBytes-1}).reason,'SOURCE_IDENTITY_MISMATCH');
});
test('never accepts physical terrain depression or CURRENT flag',()=>{
  const a=mock(),c=a.gltf.nodes[P.soilNode].extras.presentationClip20261114;
  c.terrainDepressionMeters=.35;
  assert.equal(verifyV27NoTrenchSource(a).reason,'WALL_SOIL_CLIP_MISMATCH');
  c.terrainDepressionMeters=0;
  a.gltf.nodes[P.rootNode].extras.current=true;
  assert.equal(verifyV27NoTrenchSource(a).reason,'WALL_SOIL_CLIP_MISMATCH');
});
test('wrong scene roots and guessed scene indices fail closed',()=>{
  const a=mock();
  assert.equal(verifyV27NoTrenchSource(a).reason,'SCENE_369_ROOT_MISMATCH');
  assert.equal(v27NoTrenchRootHash([1,-1]),null);
  assert.deepEqual(Object.keys(P.sceneMap).map(Number),[369,370,371,372,373,374]);
  assert.equal(P.defaultScene,292);
});
test('sourceLinks, WebGL and human approval remain separate',()=>{
  assert.equal(P.sourceLinks,'REBOUND_REQUIRED_NEW_SHA');
  assert.equal(P.productionWebGL,'NOT_RUN');
  assert.equal(P.humanReview,'NOT_RUN');
});
