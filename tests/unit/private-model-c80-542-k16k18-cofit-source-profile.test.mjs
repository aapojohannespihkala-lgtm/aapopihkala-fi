import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_542_K16_K18_GLB_SHA256 as SHA,
 C80_542_K16_K18_GLB_BYTES as BYTES,
 C80_542_K16_K18_ZIP_SHA256 as ZIP,
 C80_542_K16_K18_ZIP_DRIVE_ID as DRIVE,
 C80_542_K16_K18_K16_SHA256 as K16,
 C80_542_K16_K18_K18_SHA256 as K18,
 C80_542_K16_K18_ORIGINAL_SHA256 as ORIGINAL,
 C80_542_K16_K18_SCENES as SCENES,
 c80542RootFnv32,
 isC80542K16K18GeometryEvidence as geometry,
 isC80542K16K18SourceScene as valid,
 c80542K16K18SourceReceipt as receipt
} from '../../src/scripts/privateModelC80542K16K18CofitSourceProfile.mjs';

test('combined source receipt pins the original GLB/ZIP, parent and six scenes',()=>{
 for(const s of [SHA,ZIP,K16,K18,ORIGINAL])assert.match(s,/^[a-f0-9]{64}$/);
 assert.equal(BYTES,55760700);
 assert.equal(DRIVE,'1pgU2riJV94YJxntdefHIRoHz2xKWJAmi');
 assert.deepEqual(Object.keys(SCENES),['536','537','538','539','540','541']);
 for(const [id,row] of Object.entries(SCENES)){
  assert.equal(row.scene,Number(id));
  assert.equal(row.parent,Number(id)-6);
  assert.equal(row.floor,id==='536'?'1F':id==='537'?'2F':'BOTH');
  assert.equal(row.active,id!=='537');
  assert.equal(row.rootCount,id==='536'?294:id==='537'?190:477);
  assert.match(row.parentFnv,/^[0-9a-f]{8}$/);
  assert.match(row.rootFnv,/^[0-9a-f]{8}$/);
 }
 assert.equal(SCENES[537].rootFnv,SCENES[537].parentFnv);
 assert.equal(c80542RootFnv32([]),'811c9dc5');
 assert.equal(c80542RootFnv32([0]),'050c5d1f');
 assert.equal(c80542RootFnv32([-1]),null);
 assert.equal(c80542RootFnv32(['0']),null);
});

test('source-only interface refuses spoofed files, scenes, geometry and approval',()=>{
 const cases=[
  [null,SHA,538,'BOTH'],
  [{},SHA,538,'BOTH'],
  [{scenes:[]},SHA,538,'BOTH'],
  [{scene:292,scenes:[]},SHA,538,'BOTH'],
  [{scene:292,scenes:Array(542).fill({})},SHA,538,'BOTH'],
  [{scene:292,nodes:Array(12258),meshes:Array(4624),accessors:Array(10411),
    bufferViews:Array(10415),scenes:Array(542),asset:{extras:{ModelStage:'WORK_TEST',current:true}}},SHA,538,'BOTH'],
  [{},'0'.repeat(64),538,'BOTH'],
  [{},SHA,532,'BOTH'],
  [{},SHA,537,'BOTH'],
  [{},SHA,538,'2F'],
 ];
 for(const [json,sha,index,floor] of cases){
  assert.equal(valid(json,sha,index,floor),false);
  assert.equal(geometry(json),false);
 }
 assert.equal(valid({},SHA,537,'2F'),false);
 assert.deepEqual(receipt({},SHA,538,'BOTH'),{
  exactSource:false,sourceOnly:true,sourceLinksBound:false,
  publishAllowed:false,current:false,asBuilt:false,
  physicalHostVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
});

const originalPath=process.env.C80_542_K16_K18_GLB_PATH;
test('authentic original GLB SHA, K16+K18 geometry, six opt-in scenes and negatives',
 {skip:!originalPath},()=>{
 const bytes=readFileSync(originalPath);
 assert.equal(bytes.byteLength,BYTES);
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 assert.equal(geometry(json),true);
 for(const [id,row] of Object.entries(SCENES)){
  assert.equal(valid(json,SHA,Number(id),row.floor),true,'scene '+id);
  assert.equal(valid(json,ORIGINAL,Number(id),row.floor),false,'wrong SHA '+id);
  assert.equal(valid(json,SHA,Number(id),'OTHER'),false,'wrong floor '+id);
 }
 const mutate=(object,key,value)=>{
  const before=object[key];object[key]=value;
  try{assert.equal(valid(json,SHA,538,'BOTH'),false,'reject '+key)}
  finally{object[key]=before}
 };
 mutate(json.asset.extras,'current',true);
 mutate(json.asset.extras,'HUMAN_REVIEW','APPROVED');
 mutate(json.scenes[538].extras,'sourceLinksBindingVerified',true);
 mutate(json.scenes[538].extras,'productionWebGLVerified',true);
 mutate(json.scenes[538].extras.cofitK16K18,'publishAllowed',true);
 mutate(json.scenes[538].extras.cofitK16K18,'K18CorrectedNode',11309);
 mutate(json.nodes[12255].extras,'current',true);
 mutate(json.nodes[12256].extras,'originalNodeIndex',9383);
 mutate(json.nodes[12257].extras,'excludedUnderstairWallTriangles',0);
 mutate(json.meshes[4623].primitives[0],'indices',9130);
 mutate(json.accessors[10410],'count',84);
 assert.equal(valid(json,SHA,537,'2F'),true,'2F remains unchanged');
});
