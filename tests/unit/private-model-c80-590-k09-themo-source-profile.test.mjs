import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_590_GLB_SHA256 as SHA,C80_590_GLB_BYTES as BYTES,
 C80_590_ZIP_SHA256 as ZIP,C80_590_ZIP_DRIVE_ID as DRIVE,
 C80_590_PARENT_GLB_SHA256 as PARENT,
 C80_590_K09_DONOR_GLB_SHA256 as K09DONOR,
 C80_590_SCENES as SCENES,c80590Fnv32 as fnv,
 isC80590RootReplacement as roots,
 isC80590K09ThemoEvidence as evidence,
 isC80590K09ThemoSourceScene as valid,
 c80590K09ThemoReceipt as receipt,
} from '../../src/scripts/privateModelC80590K09ThemoSourceProfile.mjs';

test('590 source receipt pins one real GLB and exactly six opt-in scenes',()=>{
 for(const v of [SHA,ZIP,PARENT,K09DONOR])assert.match(v,/^[0-9a-f]{64}$/);
 assert.equal(BYTES,56661700);
 assert.equal(DRIVE,'1qfmULhkxKfNWh9H9XUI4XczVwXIv8XoT');
 assert.deepEqual(Object.keys(SCENES),['584','585','586','587','588','589']);
 for(const [id,s] of Object.entries(SCENES)){
  assert.equal(s.parent,Number(id)-6);
  assert.equal(s.floor,id==='584'?'1F':id==='585'?'2F':'BOTH');
  assert.equal(s.hasK09,id!=='585');
 }
 assert.equal(fnv([1,2,3]),'56cf37ab');
 assert.equal(fnv([-1]),null);
 assert.equal(valid({},SHA,586,'BOTH'),false);
 assert.equal(valid({},PARENT,586,'BOTH'),false);
 assert.equal(valid({},SHA,580,'BOTH'),false);
 assert.deepEqual(receipt({},SHA,586,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalHostVerified:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
});
test('1F and BOTH replace ONLY K12/K09 and Themo root and hide old SW04',()=>{
 const p=[7,6365,9,12322,12,11779,13];
 assert.equal(roots([7,12331,9,12329,12,13],p,true),true);
 assert.equal(roots([7,12331,9,12329,12,11779,13],p,true),false);
 assert.equal(roots([7,12331,9,12329,12,13,12329],p,true),false);
 assert.equal(roots(p,p,true),false);
 assert.equal(roots([7,6365,9],[7,6365,9],false),true);
 assert.equal(roots([7,12331,9],[7,6365,9],false),false);
 assert.equal(roots([7,12329,9],[7,12329,9],false),false);
});
test('K09 and Themo source evidence rejects fake, wrong host and approval',()=>{
 assert.equal(evidence({}),false);
 assert.equal(evidence({nodes:Array(12332)}),false);
 const nodes=Array(12332);
 nodes[12322]={children:[
  1669,1670,1671,1672,1673,1674,1712,1713,12320,12321,
 ]};
 nodes[12329]={
  name:'C80_590_K12_100x100_TILES_AND_K09_OWNER20CM_KPH_CONTROLS_COW_ROOT',
  translation:[6.53,0,0],
  children:[12323,12324,12325,12326,12327,12328,1712,1713,12320,12321],
  extras:{
   K09ThemoX:5.05,
   approval:'OWNER_ESTIMATED_CENTER20CM_TOP102CM_AND_SAME_VERTICAL_THEMO',
   sourceLinksBound:false,sourceLinksBoundNewSHA:false,current:false,
   asBuilt:false,HUMAN_REVIEW:'NOT_RUN',status:'WORK_TEST_HOST_HOLD',
  },
 };
 for(let i=0;i<6;i++)nodes[12323+i]={
  name:'K09_D1F_KPH_OWNER20CM_102CM_REHOST_TEST_'+i,
  mesh:773+i,translation:[-0.164,-0.08,0],
  extras:{sourceLinksBoundNewSHA:false,asBuilt:false,status:'WORK_TEST_HOST_HOLD'},
 };
 nodes[12330]={
  name:'C80_590_D_THEMO_BATHROOM_ALIGNED_X5p050_WITH_K09_OWNER20CM_WORK_TEST',
  children:[6361,6362,6363,6364],translation:[5.05,5.032,1.48],
  extras:{workAssumption:true,asBuilt:false,fitExactPhysicalWallHostVerified:false},
 };
 nodes[12331]={
  name:'C80_590_D1F_THEMO3_BATHROOM_X5p050_ALIGN_K09_COPY_ON_WRITE',
  children:[6350,6355,12330],
  extras:{WORK_TEST_ONLY:true,current:false,asBuilt:false,
   physicalHost:'HOST_HOLD',publishToCURRENT:false},
 };
 for(const [i,mesh] of [[12320,4630],[12321,4631]]){
  nodes[i]={mesh,extras:{sourceLinksBound:false}};
 }
 const json={nodes};
 assert.equal(evidence(json),true);
 nodes[12330].translation=[4.88,5.032,1.48];
 assert.equal(evidence(json),false);
 nodes[12330].translation=[5.05,5.032,1.48];
 nodes[12329].extras.sourceLinksBoundNewSHA=true;
 assert.equal(evidence(json),false);
 nodes[12329].extras.sourceLinksBoundNewSHA=false;
 nodes[12331].extras.publishToCURRENT=true;
 assert.equal(evidence(json),false);
 nodes[12331].extras.publishToCURRENT=false;
 nodes[12329].children.push(1669);
 assert.equal(evidence(json),false);
});
const file=process.env.C80_590_GLB_PATH;
test('original GLB: six scene/root/DFS receipts and false-source negative tamper',
 {skip:!file},()=>{
 const bytes=readFileSync(file);
 assert.equal(bytes.length,BYTES);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 const len=bytes.readUInt32LE(12);
 const json=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));
 assert.equal(evidence(json),true);
 for(let i=584;i<=589;i++){
  const f=i===584?'1F':i===585?'2F':'BOTH';
  assert.equal(valid(json,SHA,i,f),true,'authentic scene '+i);
  assert.equal(valid(json,SHA,i,'wrong'),false);
  assert.equal(valid(json,PARENT,i,f),false);
 }
 const forged=structuredClone(json);
 forged.scenes[586].nodes[forged.scenes[586].nodes.indexOf(12329)]=12322;
 assert.equal(valid(forged,SHA,586,'BOTH'),false);
 const physical=structuredClone(json);
 physical.nodes[12330].translation[0]=4.88;
 assert.equal(valid(physical,SHA,586,'BOTH'),false);
 const bound=structuredClone(json);
 bound.scenes[586].extras.sourceLinksBoundNewSHA=true;
 assert.equal(valid(bound,SHA,586,'BOTH'),false);
});
