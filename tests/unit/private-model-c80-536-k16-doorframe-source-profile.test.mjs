import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {
 C80_K16_GLB_SHA256, C80_K16_GLB_BYTES, C80_K16_ZIP_SHA256,
 C80_K16_SOURCE_ONLY, C80_K16_SCENES, isC80K16DoorframeSourceScene,
 resolveC80K16DoorframeSceneIndex, c80K16DoorframeSourceReceipt
} from '../../src/scripts/privateModelC80536K16DoorframeSourceProfile.mjs';

// Deflated root arrays from the actual original SHA-verified K16 GLB.
// A synthetic metadata fixture is not proof of production WebGL or physical work.
const parentRootBytes='eNrtmUsOXTUQRPfC+A5u+9dttoJYCWLvVB0HKUGJICggUDwp+dkuf9rtcl29X36Ybfzw409r9PfZkfPZrd6ncixDGsqwBdMNMwzN0J/W2vvkUufZ2njWmPmsnuk6oJ7ce3vQUJeaz9oTWIY0lGEL1vus1cPQxNVEAkrdMJ5oMUTuSzBClKHZBaKM7ek0tJalla9sj7jDdctAa7mha3wWreninZpKC9ZqPJVoadCSSusXlJb+hqEZumEYHKh3GdJAP+8zXoMZYUaYEWaEGaGJSmHM1gijljX3cKlc8lDVHLJuGIZp0JZeT5TbE61g5R0c4AQX6EPT5rTXYVBMlqIv8M/yHEvHVz7htb3c8iJ9uDVZgRq2uuzX+321y2hN4d+xvZF+ZvdCGCxdqXjH65CqqEof0e7Opq79CIaBn+lj7C5qkwK3bH4qmlMB6kubjPApaJ7FLhe7XOxyscuV4Omzjcl5JqtjOTPhJtyEm3ATbsJNuAW34BbcgltwC27BLbgFt+BuuBvuhrvhbrgb7oa74W6429z1vmCAhPDt4AAnuMAEC4QbcANuwA24ATfgBtyAG3ADboPb4Da4DW6D2+A2uA0uZ7Ea3A6XLPBFNcIlExeZuMhE3SsQboc74A64A+6AO+AOuAPugDvgDrgT7oQ74U64ykxdp3RG63d0Ry268tflBAvcRkdNGKBmCl+Q0N11n+m5Y1oZglwJzjg43eBUgugHEQ8irtuONDnirfWTuwE20KtKR01objqDhZub4DHTaxBS74yMCtDnEdtZIgywgR08rRP0LY1NvU869uEy7/Z56PbCHfR3RkrUXpD1L8pJfR1MsMBNlOjjaAgbyLyOp/bi1uZcURzMbT4RIZEZ1Mz4+dGbM/XmZJc2N8tyW8sa3oFm4AZZ97taBMuQj+SaunJJP52Suoyv61xS9gksy8v90s+D6lQKK6i0f/hlGEnJD1b6LbH+T90SQRn0tJQXU16MxWdZexaK3D2AU0/vhPpxsG9y2dM6ZtXZFp1tzdlOo/RJpQ8qfU6CNPhtVDLl9i1S9Nyiwy+fh2Aa2Ip+6sCU4BYTvTDLUjwNlNJQBj9ArzV4ojTW7K7B9/aDtP0gpcKpunKpG4ahcW6+U5v7tY9OfnhhTkajdRM1m7R+mAM1m7SeF/W8TuvcUO4yPRd9Ej1PtDrR6kSrM089YUSruQ3CBAtkBLQ60epEqxOtTrQ60epEqxOtTrQ60erc57Dgkr8xTu4PFALk5nVuah+oxUAtuD39aMygJzepoxl9oDQDpRlwJ9wJd8KdcCfcCXfCnXAn3AkXBXLqS1WsqMHbHuhzoM+BfgaaGehkLMZcKN9K3llGzkCBWn5WmQqFqH7KC0R7BvFxYkexttpHgVAFIsDbqjIKMY8G0OqdCmmd6OvERaAQsUjjhXIs1rnQDGZsnEgb9Gfk3zVjXZ96fer1qdenXp/6TXzq9V//af+ld3tcz/V/9Vzt/ebfgV/v1P7id+PHnu4vfUPyVn36JfmVHvDTL8/+Tb48v+grP/4idcQ+9136RdeZ13Ve13ld53Wd13Ve1/kduc7rN6/fvH7zj37zPTE/fvN4z3/EddZ1ndd1Xtd5Xed1ndd1fjeu83rJ6yW/Jy9Jn6RP0afoU/QpRi7WUPNfcZ3777tObyqv7by289rOazuv7by28/7Ffm3qtan3L/Y/sZ2//gZyMl3K';
const parentRoots=JSON.parse(inflateSync(Buffer.from(parentRootBytes,'base64')).toString());
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'];
const extras=(floor,sourceSceneIndex)=>({
 floor,sourceSceneIndex,stage:'WORK_TEST_HOST_HOLD',sourceLinksBindingVerified:false,
 physicalHiddenRouteVerified:false,productionWebGLVerified:false,
 humanReviewApproved:false,asBuilt:false
});
const correction=(originalNodeIndex,originalMeshIndex)=>({
 stage:'WORK_TEST_NONCURRENT',asBuilt:false,modelStage:'WORK_TEST',
 ownerCorrection:'K16_20261115_DOOR_FACE_SPIKE_REPAIR',
 originalNodeIndex,originalMeshIndex,sourceFaceTemplateNodeIndex:9383,
 badVertexCoordinate:[2.762,2.762,-2.762],repairedDamagedVertexCount:12,
 physicalHostVerified:false,sourceLinksBound:false,current:false,
 geometryRectificationMethod:'intact face-order donor 9383 plus unaffected 12 original vertices'
});
function mockGltf(){
 const gltf={
  scene:292,asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,
    current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
  scenes:Array.from({length:536},()=>({})),nodes:Array(12257).fill(null),
  meshes:Array(4623).fill(null),accessors:Array(10410).fill(null),
  bufferViews:Array(10414).fill(null)
 };
 gltf.nodes[9382]={mesh:3332}; gltf.nodes[9383]={mesh:3333};
 gltf.nodes[9384]={mesh:3334};
 gltf.nodes[12255]={name:'K16_CORRECTED_V48_D1F_700_WEST_JAMB_X2620_2820',
  mesh:4621,extras:correction(9382,3332)};
 gltf.nodes[12256]={name:'K16_CORRECTED_V48_D1F_700_OPENING_HEAD_ABOVE_Y2090',
  mesh:4622,extras:correction(9384,3334)};
 for(const [n,mesh,acc] of [[12255,4621,10408],[12256,4622,10409]]){
  gltf.meshes[mesh]={primitives:[{mode:4,attributes:{POSITION:acc,NORMAL:6325},
    indices:6326,material:333}]};
  gltf.accessors[acc]={componentType:5126,type:'VEC3',count:24,
    bufferView:n===12255?10412:10413,
    min:[2.62,n===12255?0:2.0875,-5.0945],
    max:[n===12255?2.82:3.52,2.762,-5.0295]};
 }
 for(let n=0;n<6;n++){
  const p=524+n,i=530+n,old=parentRoots[p];
  const newer=n===1?[...old]:old.map(id=>id===9382?12255:id===9384?12256:id);
  gltf.scenes[p]={name:'C80_530_V27_NO_TRENCH_FROM_SCENE_'+(p-6)+'_WORK_TEST_HOST_HOLD',
    nodes:[...old],extras:extras(floors[n],p-6)};
  gltf.scenes[i]={name:'C80_536_K16_DOOR_HEAD_WESTJAMB_RECTIFIED_FROM_530_SCENE_'+p+'_WORK_TEST_HOST_HOLD',
    nodes:newer,extras:extras(floors[n],p)};
 }
 return gltf;
}
const accept=(g,i=532,floor=null)=>isC80K16DoorframeSourceScene(g,C80_K16_GLB_SHA256,i,floor);
test('K16 six exact opt-in scene/floor source receipts',()=>{
 const g=mockGltf();
 assert.equal(C80_K16_SOURCE_ONLY,true);
 assert.equal(Object.keys(C80_K16_SCENES).length,6);
 for(let i=530;i<=535;i++){
  assert.equal(accept(g,i,C80_K16_SCENES[i].floor),true,'scene '+i);
  assert.equal(resolveC80K16DoorframeSceneIndex(C80_K16_GLB_SHA256,i-6,C80_K16_SCENES[i].floor),i);
 }
 assert.equal(resolveC80K16DoorframeSceneIndex(C80_K16_GLB_SHA256,530,'1F'),null);
 assert.equal(resolveC80K16DoorframeSceneIndex('0'.repeat(64),524,'1F'),null);
 assert.equal(accept(g,525),false);
 assert.equal(accept(g,532,'1F'),false);
 assert.equal(isC80K16DoorframeSourceScene(g,'0'.repeat(64),532),false);
 assert.deepEqual(c80K16DoorframeSourceReceipt(g,C80_K16_GLB_SHA256,532),{
  exactSource:true,sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,
  asBuilt:false,physicalHostVerified:false
 });
});
test('K16 fail-closed: source graph, geometry and approval mutations',()=>{
 const mutate=[
  g=>{g.scenes[532].nodes[0]=9382;},
  g=>{g.scenes[530].nodes[20]=100;},
  g=>{g.scenes[525].nodes.pop();},
  g=>{g.scenes[534].extras.sourceSceneIndex=529;},
  g=>{g.scenes[533].extras.sourceLinksBindingVerified=true;},
  g=>{g.scenes[530].extras.productionWebGLVerified=true;},
  g=>{g.asset.extras.current=true;},
  g=>{g.asset.extras.HUMAN_REVIEW='APPROVED';},
  g=>{g.nodes[12255].extras.physicalHostVerified=true;},
  g=>{g.nodes[12256].extras.originalNodeIndex=9383;},
  g=>{g.meshes[4622].primitives[0].attributes.POSITION=9185;},
  g=>{g.accessors[10409].max[2]=-2.762;},
  g=>{g.nodes[9382].mesh=4621;},
  g=>{g.scenes[531].nodes.push(12255);},
  g=>{g.nodes[12256].extras.sourceLinksBound=true;}
 ];
 for(const [n,change] of mutate.entries()){
  const g=mockGltf();change(g);assert.equal(accept(g),false,'mutation '+n);
 }
});
test('authentic complete GLB optional: SHA, all scenes, negative mutations',{
 skip:!process.env.C80_536_K16_GLB_PATH
},()=>{
 const bytes=readFileSync(process.env.C80_536_K16_GLB_PATH);
 assert.equal(bytes.length,C80_K16_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),C80_K16_GLB_SHA256);
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 const jsonLength=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 for(let i=530;i<536;i++)assert.equal(accept(gltf,i),true);
 gltf.scenes[532].extras.sourceLinksBindingVerified=true;
 assert.equal(accept(gltf),false);
 assert.equal(C80_K16_ZIP_SHA256.length,64);
});
