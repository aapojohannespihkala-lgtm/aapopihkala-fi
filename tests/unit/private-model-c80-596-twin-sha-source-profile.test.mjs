import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {
 C80596_VARIANTS,C80596_SCENES,C80596_SOURCE_ONLY,
 c80596VariantForAuthenticatedSha,isC80596TwinSourceScene,c80596TwinSourceReceipt
} from '../../src/scripts/privateModelC80596TwinShaSourceProfile.mjs';
const parentRoots=JSON.parse(inflateSync(Buffer.from('eNrtmU2OJTcMgy9Ui5L/JJ+lMfe/RsjPs+gBJkgH6EUm8IbwK5tlW7JoFt7Hxxr9fXbkfHar96kcy5CGMmzBdMcMQzP0p7X2Prk0eLY2njVmPqtn+hlQT+69/dLQkJrP2hNYhjSUYQvW+6zVw9DE1UQCWt0wnmgxprB70AhxhqYX+Of2fHq31qWlr2yPyMPPloHeckfXBKxa88U7NZdWrOV4LtHSoDWVNiAorf0NQzN0wzA4Uu8ypIFx3mi8BjPCjDAjzAgzQhOV4pitEUcta+7hVrnlV1VzzLphGKZBW3o9UW5PtIKVd3CAE1ygs6bNaa/DoJgshV/gn+U5lvJXTvHaXm55kc5uTVagjq0h+/V+X+0yWlP8d2xvpJ/ZvRBeln6oeMfrkKqph31pt93HqWs/gmHgZzqP3U1tUuCezU9FcypAfWmTEc6C5lnscrHLxS4Xu1wJnjHbmOQzWR3LmQk34SbchJtwE27CLbgFt+AW3IJbcAtuwS24BXfD3XA33A13w91wN9wNd8Pd5q73BQMkhG8HBzjBBSZYINyAG3ADbsANuAE34AbcgBtwG9wGt8FtcBvcBrfBbXDJxWpwO1xOgSvVCJeTuDiJi5OougLhdrgD7oA74A64A+6AO+AOuAPugDvhTrgT7oSrk6lySp9o/Y7uqEXX+XU7wQK30VETBqiZwgUSql2PmZ47ppUhOCtBjoPsBlkJoh9EvHVHRNWONjnirfVzdgNsoFeVjprQ3PQJFsJ11CK9BqGflzMU5UzE9vkQBtjADp7eCVKfrH8HeLjMuJ0J1S3cwXifRcnZC7LyRTt5XgcTLHATH8Y4DsIGLnYd7MK96JIiYG5zLoTExLmUbMwfz0d26XGzFLe1rNtouUV4HD2z2Hf1CJYhH0k0z8ot/fQxVAG+fuaWTpzAUrw8Ln0l6JlaYdWU3g/fBiNp+ZZStAWS4qnKEJRB10l5MeXFWHCW9Wahwt0v8HHT3aBxJPNNCjytXVaabaHZ1pnto5POUTpF6QwJ0uALUQcotytHcXOPJKicCcE0sBX9VKp0qC0gulWW5XcaaKWhDL50XuvuRF2s010v39uX0PYllAqnnpVb3TAMnr9R+5ua2kcbf94q5xSjbxMFm/T+nAMFm/SeW/TcSOtUJfXLyMWYRMMTfU70OdHnzPOcMKLPVIAwwQJ5A/qc6HOiz4k+J/qc6HOiz4k+J/qc6HPukyy4nNwY59QPVAGk5jrV2QcKMVAI6qYfXRmMpIY6OtEH6jJQlwF3wp1wJ9xJHXguIdWwqNdFlfj+ErrCWlJDjk9wnwf3eaDJgSYHmhnoZKCNYcsjRO1Wcrc68pGB6rT8rRoV2lD9tFEd9l4DVUMdy1mO2kd70AMiwH2qNtowT/XTy05ffNo70dSJQrDrWKfNCs+umauRizaICe/s6Gg/+hpLmnHN6TWn15xec3rN6TeY02vA/tMGTBf3uKbrTzVd7f3Gj79/b9K++LH42c596cORW+rXz8cv279fPzT7t3xo/q2l/PwB2vdvP0Ov4byG8xrOaziv4byG8xrOT4bzWs1rNa/VZOSJ87Gax3Zew3kN5zWc13Bew3kN5zWc32E4r428NvL/biMZk4wpxhRjijHFm4vZa/4ZhtNby+s4r+O8jvM6zus4r+O8/6lfh3od6v1P/Z8c54+/AP2oV5U=','base64')).toString('utf8'));
const pSha='ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9';
const dSha='283f4447eb7ba9ac2135569d9cb8557530a83bd2df6c6a5ecbf5434bccc2c260';
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
assert.equal(parentRoots.length,6);
const metadata=(floor)=>({stage:'WORK_TEST_HOST_HOLD',floor,HUMAN_REVIEW:'NOT_RUN',
  sourceLinksBound:false,current:false,asBuilt:false,productionWebGLVerified:false});
function make(variant){
 const g={scene:292,asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,
  asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},scenes:Array.from({length:596},()=>({})),
  nodes:Array(12335).fill(null),meshes:Array(4635).fill(null),
  accessors:Array(10434).fill(null),bufferViews:Array(10440).fill(null),
  buffers:[{byteLength:33606952}]};
 for(const [id,mesh] of [[9382,3332],[9384,3334],[11309,4199]])g.nodes[id]={mesh};
 for(const [id,oldId,oldMesh,newMesh,pos,view,suffix] of [
 [12332,9382,3332,4632,10431,10437,'WEST_JAMB_X2620_2820'],
 [12333,9384,3334,4633,10432,10438,'OPENING_HEAD_ABOVE_Y2090']
 ]){
  const e={stage:'WORK_TEST_NONCURRENT',originalNodeIndex:oldId,originalMeshIndex:oldMesh,
   sourceFaceTemplateNodeIndex:9383,ownerCorrection:'K16_20261115_DOOR_FACE_SPIKE_REPAIR',
   repairedDamagedVertexCount:12,asBuilt:false,current:false,
   sourceLinksBound:false,physicalHostVerified:false};
  if(variant==='first'){
   e.C80590ParentGLBSHA256=pSha;e.C80542K16K18DonorGLBSHA256=dSha;
  }else{e.baseC80590GLBSHA256=pSha;e.donorC80542GLBSHA256=dSha;}
  g.nodes[id]={mesh:newMesh,name:(variant==='first'?'C80_596_COFIT_':'C80_596_')+
     'K16_CORRECTED_V48_D1F_700_'+suffix,extras:e};
  g.meshes[newMesh]={primitives:[{attributes:{POSITION:pos,NORMAL:6325},
    indices:6326,material:333,mode:4}]};
  if(variant==='second')g.meshes[newMesh].extras={C80542K16K18DonorGLBSHA256:dSha};
  g.accessors[pos]={bufferView:view,componentType:5126,count:24,type:'VEC3',
    min:[2.62,0,-5.0945],max:[2.82,2.762,-5.0295]};
  g.bufferViews[view]={buffer:0,byteOffset:33606136+(id===12332?0:288),
   byteLength:288,target:34962};
 }
 const x={stage:'WORK_TEST_HOST_HOLD',sourceNodeIndex:11309,sourceMeshIndex:4199,
  preservedPatchTriangles:10,preservedSlabEdgeTriangles:10,excludedUnderstairWallTriangles:8,
  // Authentic C80 596 K18 node omits physicalHostVerified. No approval inferred.
  current:false,asBuilt:false,sourceLinksBound:false,
  productionWebGLVerified:false,HUMAN_REVIEW:'NOT_RUN'};
 if(variant==='first')x.C80542K16K18DonorGLBSHA256=dSha;
 else x.donorC80542GLBSHA256=dSha;
 g.nodes[12334]={name:(variant==='first'?'C80_596_COFIT_':'C80_596_')+
   'K16_K18_COFIT_WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL',
   mesh:4634,extras:x};
 g.meshes[4634]={primitives:[{attributes:{POSITION:9129},indices:10433,material:333}],
   extras:{originalMeshIndex:4199,originalNodeIndex:11309,preservedTriangles:20,removedTriangles:8,notAsBuilt:true}};
 if(variant==='second')g.meshes[4634].extras.C80542K16K18DonorGLBSHA256=dSha;
 g.accessors[10433]={bufferView:10439,componentType:5125,count:60,type:'SCALAR',min:[0],max:[55]};
 g.bufferViews[10439]={buffer:0,byteOffset:33606712,byteLength:240,target:34963};
 for(let n=0;n<6;n++){
  const old=[...parentRoots[n]],active=n!==1,i=590+n,p=584+n;
  const values=old.map(k=>active?(k===9382?12332:k===9384?12333:k===11309?12334:k):k);
  g.scenes[p]={name:'parent_'+p,nodes:old,extras:metadata(floors[n])};
  const e=metadata(floors[n]);
  if(variant==='first'){
   e.sourceSceneIndex=p;e.sourceLinksBindingVerified=false;e.humanReviewApproved=false;
   e.cofitC80596={stage:'WORK_TEST_HOST_HOLD',parentScene:p,
     parentC80590GLBSHA256:pSha,K16K18DonorC80542GLBSHA256:dSha,
     K16OriginalNodes:active?[9382,9384]:[],K16RepairedNodes:active?[12332,12333]:[],
     K18OriginalNode:active?11309:null,K18RepairedNode:active?12334:null,
     K18OmittedWallTriangles:active?8:0,K18PreservedPatchTriangles:active?10:0,
     K18PreservedSlabTriangles:active?10:0,
     sourceLinksBound:false,physicalHostVerified:false,current:false,asBuilt:false,
     productionWebGLVerified:false,publishAllowed:false,humanReview:'NOT_RUN'};
  }else{
   e.C80596K16K18Cofit={stage:'WORK_TEST_HOST_HOLD',parentSceneIndex:p,
     donorSceneIndex:536+n,sourceParentGLBSHA256:pSha,donorC80542GLBSHA256:dSha,
     activeCorrection:active,K16Replacements:active?[12332,12333]:[],
     K18Replacement:active?12334:null,
     K18PreservedHoleAndSlabTriangles:active?20:0,K18RemovedWallTriangles:active?8:0,
     K09FrameX:active?5.05:null,bathThemoX:active?5.05:null,
     sourceLinksBoundNewSHA:false,CURRENT:false,asBuilt:false,humanReview:'NOT_RUN',
     productionWebGL:'NOT_RUN'};
  }
  g.scenes[i]={name:variant==='first'?
    'C80_596_ALL5_K12_K09_THEMO_K16_K18_FROM_C80_590_SCENE_'+p+'_'+floors[n]+'_WORK_TEST_HOST_HOLD':
    'C80_596_ALL5_K12_K09_THEMO_K16_K18_COFIT_FROM_'+p+'_'+floors[n]+'_WORK_TEST_HOST_HOLD',
    nodes:values,extras:e};
 }
 return g;
}
test('both SHA variants authenticate six internal glTF scenes and reject cross-source IDs',()=>{
 assert.equal(C80596_SOURCE_ONLY,true);
 assert.equal(Object.keys(C80596_SCENES).length,6);
 for(const v of ['first','second']){
  const g=make(v),sha=C80596_VARIANTS[v].glbSHA256;
  assert.equal(c80596VariantForAuthenticatedSha(sha),v);
  // Explicit false also means HOLD, but true must never authorize K18.
  const falseHost=make(v);
  falseHost.nodes[12334].extras.physicalHostVerified=false;
  assert.equal(isC80596TwinSourceScene(falseHost,sha,592),true);
  for(let i=590;i<596;i++)
   assert.equal(isC80596TwinSourceScene(g,sha,i,C80596_SCENES[i].floor),true,v+' '+i);
  const other=v==='first'?'second':'first';
  assert.equal(isC80596TwinSourceScene(g,C80596_VARIANTS[other].glbSHA256,592),false);
  assert.equal(isC80596TwinSourceScene(g,sha,592,'1F'),false);
  assert.equal(isC80596TwinSourceScene(g,sha,596),false);
  assert.deepEqual(c80596TwinSourceReceipt(g,sha,592),{
   exactSource:true,variant:v,sourceLinksBound:false,publishAllowed:false,
   current:false,asBuilt:false,productionWebGLVerified:false,
   humanReview:'NOT_RUN',physicalHostVerified:false});
 }
});
test('mutations to geometry, roots, metadata, sourceLinks or approval always fail closed',()=>{
 const edits=[
  g=>{g.scenes[592].nodes[0]=11309;},
  g=>{g.scenes[590].nodes.push(12334);},
  g=>{g.scenes[591].nodes[0]=12334;},
  g=>{g.scenes[584].nodes[0]=12334;},
  g=>{g.scenes[592].name='C80_596_other_scene';},
  g=>{g.scenes[592].extras.sourceLinksBound=true;},
  g=>{g.scenes[592].extras.asBuilt=true;},
  g=>{g.scenes[592].extras.HUMAN_REVIEW='PASS';},
  g=>{g.scenes[592].extras.productionWebGLVerified=true;},
  g=>{g.scenes[592].extras.cofitC80596.K18PreservedPatchTriangles=8;},
  g=>{g.scenes[592].extras.C80596K16K18Cofit.K18RemovedWallTriangles=0;},
  g=>{g.nodes[12332].mesh=4634;},
  g=>{g.nodes[12334].extras.excludedUnderstairWallTriangles=0;},
  g=>{g.nodes[12334].extras.physicalHostVerified=true;},
  g=>{g.meshes[4634].extras.removedTriangles=0;},
  g=>{g.accessors[10433].count=84;},
  g=>{g.bufferViews[10439].byteOffset=0;},
  g=>{g.buffers[0].byteLength=0;},
  g=>{g.asset.extras.Canonical=true;}
 ];
 for(const v of ['first','second']){
  for(let i=0;i<edits.length;i++){
   if(i===9&&v!=='first'||i===10&&v!=='second')continue;
   const g=make(v);edits[i](g);
   assert.equal(isC80596TwinSourceScene(g,C80596_VARIANTS[v].glbSHA256,592),false,v+' mutation '+i);
  }
 }
});
test('authentic full GLB SHA and six-scene binding for each supplied source',{
 skip:!process.env.C80596_FIRST_GLB_PATH||!process.env.C80596_SECOND_GLB_PATH
},()=>{
 for(const v of ['first','second']){
  const bytes=readFileSync(process.env[v==='first'?'C80596_FIRST_GLB_PATH':'C80596_SECOND_GLB_PATH']);
  assert.equal(bytes.length,C80596_VARIANTS[v].glbBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),C80596_VARIANTS[v].glbSHA256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  const jsonLen=bytes.readUInt32LE(12);
  const gltf=JSON.parse(bytes.subarray(20,20+jsonLen).toString('utf8'));
  for(let i=590;i<596;i++)assert.equal(isC80596TwinSourceScene(gltf,C80596_VARIANTS[v].glbSHA256,i),true,v+' authentic scene '+i);
  gltf.scenes[592].extras.sourceLinksBound=true;
  assert.equal(isC80596TwinSourceScene(gltf,C80596_VARIANTS[v].glbSHA256,592),false);
 }
});
