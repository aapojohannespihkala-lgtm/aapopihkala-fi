import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_572_GLB_SHA256 as SHA,C80_572_GLB_BYTES as BYTES,
 C80_572_ZIP_SHA256 as ZIP,C80_572_ZIP_DRIVE_ID as DRIVE,
 C80_572_PARENT_GLB_SHA256 as PARENT,C80_572_SCENES as SCENES,
 isC80572SavoEvidence as evidence,isC80572SavoRootReplacement as replacement,
 isC80572SavoSourceScene as valid,c80572SavoReceipt as receipt,
} from '../../src/scripts/privateModelC80572SavoCleanSourceProfile.mjs';

test('572 exact source identity, scenes and fail-closed receipt',()=>{
 assert.match(SHA,/^[0-9a-f]{64}$/);
 assert.match(ZIP,/^[0-9a-f]{64}$/);
 assert.match(PARENT,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,56525464);
 assert.equal(DRIVE,'15RZerMjyHIpY-ccx8GOFTMKKJNl2_FHh');
 assert.deepEqual(Object.keys(SCENES),['566','567','568','569','570','571']);
 for(const [idx,s] of Object.entries(SCENES)){
  assert.equal(s.parent,Number(idx)-6);
  assert.equal(s.k07Active,Number(idx)!==566);
 }
 assert.equal(valid({},SHA,568,'BOTH'),false);
 assert.equal(valid({},PARENT,568,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),568,'BOTH'),false);
 assert.equal(valid({},SHA,562,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,568,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalSavoMountVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',
 });
});
test('only exact 2F/BOTH root replacement, never 1F, no duplicates',()=>{
 assert.equal(replacement([1,2],[1,2],false),true);
 assert.equal(replacement([1,12312],[1,12312],false),false);
 assert.equal(replacement([1,12312,7],[1,12263,7],true),true);
 assert.equal(replacement([1,12263,7],[1,12263,7],true),false);
 assert.equal(replacement([1,12312,12312],[1,12263,7],true),false);
 assert.equal(replacement([1,12312,7],[1,7,12263],true),false);
 assert.equal(replacement([1,12312,7],[1,12312,7],true),false);
});
test('new clean typography identity and provenance required',()=>{
 const n={name:'SAVO_K07_NOSKEW_NO_PHOTO_TRACE_CYLINDRICAL_HORIZONTAL_LOGO',
  mesh:4629,extras:{modelRole:'K07_SAVO_CONTROL_PANEL',
   origin:'vector_font_source_not_photo_traced',
   correctModelTypeplate:'Savo I-7603/ISASC505',
   sourceGLBSHA256:PARENT,wordmarkBaselineY:4.6313,controlAxisZ:-3.55,
   cylindricalRadiusMetres:0.1602,
   textKerningMode:'single font path common baseline',imageGenerated:false,
   photoTraced:false,sourceLinksNewGLBSHA:'NOT_BOUND',
   productionWebGL:'NOT_VERIFIED',current:false,asBuilt:false}};
 const json={nodes:Array(12313),meshes:Array(4630)};
 json.nodes[12312]=n;json.meshes[4629]={primitives:[{}]};
 assert.equal(evidence(json),true);
 n.extras.photoTraced=true;assert.equal(evidence(json),false);
 n.extras.photoTraced=false;
 n.extras.sourceLinksNewGLBSHA='BOUND';assert.equal(evidence(json),false);
 n.extras.sourceLinksNewGLBSHA='NOT_BOUND';
 n.extras.wordmarkBaselineY=4.72;assert.equal(evidence(json),false);
});
const file=process.env.C80_572_SAVO_GLB_PATH;
test('optional original 56.5 MB GLB: exact SHA, all six scene DFS and negative guards',
 {skip:!file},()=>{
  assert.ok(existsSync(file));
  const bin=readFileSync(file);
  assert.equal(bin.length,BYTES);
  assert.equal(bin.toString('ascii',0,4),'glTF');
  assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
  const len=bin.readUInt32LE(12);
  const json=JSON.parse(bin.subarray(20,20+len).toString('utf8'));
  for(let i=566;i<=571;i++){
   const floor=i===566?'1F':i===567?'2F':'BOTH';
   assert.equal(valid(json,SHA,i,floor),true,'scene '+i);
   assert.equal(valid(json,SHA,i,'WRONG'),false);
   assert.equal(valid(json,PARENT,i,floor),false);
  }
  const bad=structuredClone(json);
  bad.nodes[12312].extras.productionWebGL='VERIFIED';
  assert.equal(valid(bad,SHA,568,'BOTH'),false);
  const badRoot=structuredClone(json);
  const pos=badRoot.scenes[568].nodes.indexOf(12312);
  assert.ok(pos>=0);
  badRoot.scenes[568].nodes[pos]=12263;
  assert.equal(valid(badRoot,SHA,568,'BOTH'),false);
 });
