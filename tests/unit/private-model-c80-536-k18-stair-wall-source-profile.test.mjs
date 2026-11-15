import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_536_K18_GLB_SHA256 as SHA,C80_536_K18_GLB_BYTES as BYTES,
 C80_536_K18_ZIP_SHA256 as ZIP,C80_536_K18_ZIP_DRIVE_ID as DRIVE,
 C80_536_K18_PARENT_SHA256 as PARENT,C80_536_K18_SCENES as SCENES,
 isC80536K18GeometryEvidence as evidence,isC80536K18SourceScene as valid,
 c80536K18Receipt as receipt,
} from '../../src/scripts/privateModelC80536K18StairWallSourceProfile.mjs';

const file=process.env.C80_536_K18_GLB_PATH;
const bytes=file?readFileSync(file):null;
const sha=bytes?createHash('sha256').update(bytes).digest('hex'):null;
const json=bytes&&bytes.toString('ascii',0,4)==='glTF'
 ?JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8')):null;
function syntheticEvidence(){
 const nodes=new Array(12256).fill(null),meshes=new Array(4622).fill(null);
 const accessors=new Array(10409).fill(null);
 nodes[11309]={name:'V86_D1F_K17_STAIR_HOLE_FILL_UNDERSTAIR_WALL_SLAB_EDGE',mesh:4199};
 nodes[12255]={
  name:'WP_D_K18_STAIR_V86_PRESERVE_HOLE_FILL_AND_SLAB_EDGE_DELETE_EXTRANEOUS_UNDERSTAIR_WALL',
  mesh:4621,extras:{
   stage:'WORK_TEST_HOST_HOLD',ownerPointG1:[2.299,6.429,1.448],
   sourceNodeIndex:11309,sourceMeshIndex:4199,
   preservedPatchTriangles:10,preservedSlabEdgeTriangles:10,
   excludedUnderstairWallTriangles:8,ownerPDF:'1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT',
   ownerPage:18,current:false,asBuilt:false,sourceLinksBound:false,
   HUMAN_REVIEW:'NOT_RUN',productionWebGLVerified:false,
  }
 };
 meshes[4199]={primitives:[{attributes:{POSITION:9129},indices:9130,material:333}]};
 meshes[4621]={primitives:[{attributes:{POSITION:9129},indices:10408,material:333}],
  extras:{stage:'WORK_TEST_HOST_HOLD',originalMeshIndex:4199,
   originalNodeIndex:11309,originalVertexAccessorIndex:9129,
   originalMaterialIndex:333,preservedTriangles:20,removedTriangles:8,
   retainedParts:['HOLE_PATCH_10tri','SLAB_EDGE_10tri'],
   ownerEvidencePDFDriveID:'1rVMhTd5jugp7WOQYvhzA1jdki-toYLGT',
   ownerEvidencePage:18,sourceGLBSHA256:PARENT,notAsBuilt:true}};
 accessors[9129]={count:56};
 accessors[9130]={count:84};
 accessors[10408]={count:60,componentType:5125,type:'SCALAR'};
 return {nodes,meshes,accessors,bufferViews:new Array(10413).fill(null)};
}
test('K18 receipt stays source-only and pins original bytes/scene scope',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);assert.match(ZIP,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,55664888);assert.equal(DRIVE,'180BpviPo47Ct3KoU-dGs55MP8_MViPYZ');
 assert.deepEqual(Object.keys(SCENES),['530','531','532','533','534','535']);
 for(const [key,spec] of Object.entries(SCENES)){
  assert.equal(spec.parent,Number(key)-6);
  assert.equal(spec.k18Active,key!=='531');
  assert.equal(spec.floor,key==='530'?'1F':key==='531'?'2F':'BOTH');
 }
 assert.equal(valid({},SHA,532,'BOTH'),false);
 assert.equal(valid({},PARENT,532,'BOTH'),false);
 assert.equal(valid({},SHA,529,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,532,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalWallVerified:false,physicalHoleVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
});
test('K18 structural evidence is strict about the kept 20 and excluded 8 triangles',()=>{
 const j=syntheticEvidence();assert.equal(evidence(j),true);
 const mutate=(obj,key,value)=>{
  const before=obj[key];obj[key]=value;
  try{assert.equal(evidence(j),false,'reject '+key);}
  finally{obj[key]=before;}
 };
 mutate(j.nodes[12255].extras,'preservedPatchTriangles',8);
 mutate(j.nodes[12255].extras,'excludedUnderstairWallTriangles',0);
 mutate(j.nodes[12255].extras,'current',true);
 mutate(j.nodes[12255].extras,'sourceLinksBound',true);
 mutate(j.nodes[12255].extras,'productionWebGLVerified',true);
 mutate(j.nodes[12255].extras,'ownerPDF','other');
 mutate(j.nodes[12255],'mesh',4199);
 mutate(j.meshes[4621].primitives[0],'indices',9130);
 mutate(j.meshes[4621].extras,'notAsBuilt',false);
 mutate(j.accessors[10408],'count',84);
 assert.equal(evidence(j),true);
});
test('K18 authentic 55MB GLB six-scene root, source and stage parity',
 {skip:!json},()=>{
 assert.equal(bytes.length,BYTES);assert.equal(sha,SHA);
 assert.equal(evidence(json),true);
 for(const [id,spec] of Object.entries(SCENES)){
  const i=Number(id);
  assert.equal(valid(json,sha,i,spec.floor),true,'authentic scene '+id);
  assert.equal(valid(json,PARENT,i,spec.floor),false,'wrong SHA '+id);
  assert.equal(valid(json,sha,i,'OTHER'),false,'wrong floor '+id);
 }
 assert.deepEqual(json.scenes[531].nodes,json.scenes[525].nodes);
});
test('K18 authentic GLB rejects old root, altered parent, publish and physical spoof',
 {skip:!json},()=>{
 const mutate=(obj,key,value,i=532)=>{
  const before=obj[key];obj[key]=value;
  try{assert.equal(valid(json,sha,i,SCENES[i].floor),false,'reject '+key);}
  finally{obj[key]=before;}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.scenes[532].extras,'publishAllowed',true);
 mutate(json.scenes[532].extras,'sourceLinksBound',true);
 mutate(json.scenes[532].extras,'sourceSceneIndex',525);
 mutate(json.scenes[532].nodes,0,11309);
 mutate(json.nodes[12255].extras,'current',true);
 mutate(json.nodes[12255].extras,'excludedUnderstairWallTriangles',0);
 mutate(json.meshes[4621].primitives[0],'indices',9130);
 assert.equal(valid(json,sha,530,'1F'),true);
 assert.equal(valid(json,sha,531,'2F'),true);
 assert.equal(valid(json,sha,532,'BOTH'),true);
});
