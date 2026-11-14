import {inflateSync} from 'node:zlib';
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

 
// authentic source scene roots fixture: six old root arrays (glTF scenes
// 360/362/364/366/367/368) extracted from the 54,171,340-byte V27 GLB
// whose SHA256 is d07d22ad560b74f24229793dd3f7415205a30f6c29fc9f10142da3af2ca63b9b.
// Compact zlib+uint16LE only to avoid committing a private 54 MB GLB to tests.
// This tests successful receiver matching, not just negative mock rejection.
const authenticRootUint16ZlibBase64 = 'eNrt19lTlWUAx3GnLmqoSScOyPOe9z0v7/s858jvOc9yLEAOYGzBYXMBQQHZC8X2XItAcUktizat0Cyb1MmWsW2mmmnG8iIXnKnppousUDTBKMvMsCDLu2qmbrphxvd/+H1+M98A+ZzmMu6GXeFKV7najbhT3deu/spq90XJUNLXVr+VY+exXb6wX/ilX/m1P+I/RQbJgHXCOml9Y70f+jIpnvhIAmkhp6xUt9/pJIPWkHXaOuYcJcMWw2DSKIkZxcY+40PjR3qW/kTP0Z/pefoLHaEX6K/0NzpKx+jv9CKdwPYbaWaa+4qV7r5u5bOonWln2dl2zC4KSRZECFOQAiDDPe4MOEPOsHPGUazHPesUMJf1ukXsChqmikboaTqRccRYJstgOzGdbWEvsN3sZbaHvcr2sjfZW+xt9g4TwcXXfSoLcDMKUYQYilGCUpShHDMwE7MwGxWoxBxUoRpzMQ81qEUd5qMeDWhEE5rRglbcglvRhgVYiHYswm24HXfgTtyFu3EP7sViLMFSLMNyrMB9uB8deACd6MJKrEI3VmMN1mIdHsR6bMBGPISHsQmP4FH04DE8jifwJJ7CZmzB03gGz6IXW7ENz2E7nkeWucmFaBVhIYQUSmiRKrbJfG3IFJkhC2VMVslaWS8bZKNsks3ykDws++Rn8gt5Xl6Qo/KinKCuVGEVUWmqU3WplWqV6lar1Rq1Tq1XG1WP2qy2qh1qt9qjjqpzakTFaaHT9TSdoaM6U2fpbJ2rA96CLpsFfWC2xrXF2SSZOCSKj8yPzQNmn++g+YlvLGEk8ZDZl3gkUbPDJiV9ZoFdTEpIKSkj5WQZWU5WkL3GG8ZOsotU+o+YY6TEKDU4D/O24ILgwmB7sD9wLHA8MBA4ETgZGA1U8LBdY9fadXaEXZW8zy3V39Jh+h39np6hP1CwTCxl74beCzmhDkZDLOSGqvkB3s/3yyxkYzpuQg5ykYd87MCLeAnX8Ot5PPfxBJ7IJ/MkTrjB/dzkFg9wmydzh7uccsaDPMSn8BQO7ooUMU2UiXIxQ8wUs8RsUSEqxRxRJarFXDFP1IhaUSfmi3rRIBpFk2gWLWKinCTb5SLZIbtkt9wge+R22SsP/qe8dBVV2SpH5atCVamW/EPi2j8tXqv/rjFdXvI4Scdrn07QiXqyTtJEX/IZ9nx6Pse5T0/nX3VKz6fnc1z5vNxFKq11RE/VN+gbdapO+xefedrz6RXS/ykkb0Hew3uFNB4e/w/L5rUq';
function authenticSourceRootsFixture() {
  const zipped = inflateSync(Buffer.from(authenticRootUint16ZlibBase64,'base64'));
  const a=mock();
  let offset=0;
  for(const [idx,s] of Object.entries(P.sceneMap)){
    const roots = Array.from({length:s.count},()=>{
      if(offset+2>zipped.length) throw new Error('source roots data truncated');
      const n=zipped.readUInt16LE(offset); offset+=2; return n;
    });
    a.gltf.scenes[s.from]={nodes:roots};
    a.gltf.scenes[Number(idx)]={
      name:'C80_SOURCE__V27_SOIL_EAST_WALL_TRIM_WORK_TEST',
      nodes:roots.map(n=>n===P.oldRootNode?P.rootNode:n)
    };
  }
  assert.equal(offset,zipped.length);
  return a;
}
test('authentic source roots: accepts all six V27 no-trench opt-in scenes',()=>{
  const a=authenticSourceRootsFixture();
  const result=verifyV27NoTrenchSource(a);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.deepEqual(result.scenes,[369,370,371,372,373,374]);
  assert.equal(result.productionWebGL,'NOT_RUN');
  assert.equal(result.humanReview,'NOT_RUN');
});
test('authentic source roots: rejects altered scene roots and legacy replacement',()=>{
  const a=authenticSourceRootsFixture();
  a.gltf.scenes[370].nodes[25]=a.gltf.scenes[370].nodes[25]+1;
  assert.equal(verifyV27NoTrenchSource(a).reason,'SCENE_370_ROOT_MISMATCH');
  a.gltf.scenes[370].nodes[25]=a.gltf.scenes[362].nodes[25];
  a.gltf.scenes[373].nodes[107]=P.oldRootNode;
  assert.equal(verifyV27NoTrenchSource(a).reason,'SCENE_373_ROOT_MISMATCH');
});
