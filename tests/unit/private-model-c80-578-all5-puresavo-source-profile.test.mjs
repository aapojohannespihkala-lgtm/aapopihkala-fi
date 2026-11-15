import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_578_GLB_SHA256 as SHA,C80_578_GLB_BYTES as BYTES,
 C80_578_ZIP_SHA256 as ZIP,C80_578_ZIP_DRIVE_ID as DRIVE,
 C80_578_PARENT_GLB_SHA256 as PARENT,C80_578_ALL5_DONOR_GLB_SHA256 as DONOR,
 C80_578_SCENES as SCENES,isC80578RootReplacement as roots,
 isC80578All5Evidence as evidence,isC80578All5SourceScene as valid,
 c80578All5Receipt as receipt,
} from '../../src/scripts/privateModelC80578All5PureSavoSourceProfile.mjs';

test('C80 578 original SHA and exactly six opt-in scenes are pinned',()=>{
 for(const hash of [SHA,ZIP,PARENT,DONOR])assert.match(hash,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,56568384);
 assert.equal(DRIVE,'1qlWVFgSvoiX3Rj0xG_5kQHTWOwPkFxp0');
 assert.deepEqual(Object.keys(SCENES),['572','573','574','575','576','577']);
 for(const [s,v] of Object.entries(SCENES)){
  assert.equal(v.parent,Number(s)-6);
  assert.equal(v.k03Active,Number(s)>572);
 }
 assert.equal(valid({},SHA,574,'BOTH'),false);
 assert.equal(valid({},PARENT,574,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),574,'BOTH'),false);
 assert.equal(valid({},SHA,568,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,574,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalDownspoutVerified:false,physicalVentConnectionVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
});
test('C80 578 keeps 1F isolated; 2F and BOTH require exactly one K03 root',()=>{
 assert.equal(roots([2,12315,9],[2,12251,9],false),true);
 assert.equal(roots([2,12315,9,12316],[2,12251,9],true),true);
 assert.equal(roots([2,12315,9],[2,12251,9],true),false);
 assert.equal(roots([2,12315,12316,12316],[2,12251,9],true),false);
 assert.equal(roots([2,12251,9],[2,12251,9],false),false);
 assert.equal(roots([2,12315,9],[2,12315,9],false),false);
});
test('C80 578 evidence rejects fake or current/as-built geometry',()=>{
 const nodes=Array(12320);
 nodes[12315]={name:'WPA_K01_D_GABLE_TWO_PRESENCE_ZONES_SW_OWNER_LOCATION_CORRECTED_ROOT_WORK_TEST_HOST_HOLD__C80578_COW',children:[12313,12314],extras:{
  m5System:'SADEVESI',presentationOnly:true,workAssumption:true,physicalRouteClaim:false,
  asBuiltClaim:false,sourceLinksBound:false,current:false,asBuilt:false,
  C80578ParentGLBSHA256:PARENT,C80578OriginalDonorGLBSHA256:DONOR}};
 nodes[12316]={name:'C80_548_K03_D2F_WC_KSO125_WALL_VISUAL_ROOT_WORK_TEST_HOST_HOLD__C80578_COW',children:[12317,12318,12319],extras:{
  m5System:'IV',sourceMode:'WORK_TEST_VISUAL_ONLY',ownerPointYLIS_G1_LOCAL_XYZ:[5,5.45,5.2],
  sourceLinksBound:false,physicalDuctConnectionVerified:false,realWallOpeningVerified:false,
  diameterAndSKUVerified:false,CURRENT:false,asBuilt:false,
  C80578ParentGLBSHA256:PARENT,C80578OriginalDonorGLBSHA256:DONOR}};
 nodes[12312]={name:'SAVO_K07_NOSKEW_NO_PHOTO_TRACE_CYLINDRICAL_HORIZONTAL_LOGO',mesh:4629,extras:{
  origin:'vector_font_source_not_photo_traced',correctModelTypeplate:'Savo I-7603/ISASC505',
  wordmarkBaselineY:4.6313,controlAxisZ:-3.55,photoTraced:false,
  sourceLinksNewGLBSHA:'NOT_BOUND',current:false,asBuilt:false}};
 for(let i=0;i<2;i++)nodes[12313+i]={mesh:4618,extras:{
  presentationOnly:true,sourceLinksBound:false,asBuilt:false,physicalRouteClaim:false}};
 for(let i=0;i<3;i++)nodes[12317+i]={mesh:460+i,
  matrix:[0,0,-1,0,0,1,0,0,1,0,0,0,2.69,0.859775,-3.02,1],
  extras:{m5System:'IV',sourceMeshReusedUnmodified:true,
   physicalDuctConnectionVerified:false,current:false,asBuilt:false}};
 const json={nodes,meshes:Array(4630)};
 json.meshes[4629]={primitives:[{}]};
 assert.equal(evidence(json),true);
 nodes[12315].extras.physicalRouteClaim=true;
 assert.equal(evidence(json),false);
 nodes[12315].extras.physicalRouteClaim=false;
 nodes[12316].extras.sourceLinksBound=true;
 assert.equal(evidence(json),false);
 nodes[12316].extras.sourceLinksBound=false;
 nodes[12312].extras.wordmarkBaselineY=4.9;
 assert.equal(evidence(json),false);
});
const file=process.env.C80_578_ALL5_GLB_PATH;
test('optional original GLB: all six source-scene root hashes and DFS, negative mutations',
 {skip:!file},()=>{
 const bin=readFileSync(file);
 assert.equal(bin.length,BYTES);
 assert.equal(bin.toString('ascii',0,4),'glTF');
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const len=bin.readUInt32LE(12);
 const json=JSON.parse(bin.subarray(20,20+len).toString('utf8'));
 for(let i=572;i<=577;i++){
  const floor=i===572?'1F':i===573?'2F':'BOTH';
  assert.equal(valid(json,SHA,i,floor),true,'scene '+i);
  assert.equal(valid(json,SHA,i,'WRONG'),false);
  assert.equal(valid(json,PARENT,i,floor),false);
 }
 const wrong=structuredClone(json);
 wrong.scenes[574].nodes[wrong.scenes[574].nodes.indexOf(12316)]=12251;
 assert.equal(valid(wrong,SHA,574,'BOTH'),false);
 const fake=structuredClone(json);
 fake.nodes[12316].extras.realWallOpeningVerified=true;
 assert.equal(valid(fake,SHA,574,'BOTH'),false);
});
