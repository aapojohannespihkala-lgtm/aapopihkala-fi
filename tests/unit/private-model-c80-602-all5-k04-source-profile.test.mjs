import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 C80_602_GLB_SHA256 as SHA,C80_602_GLB_BYTES as BYTES,
 C80_602_PARENT_GLB_SHA256 as PARENT,
 C80_602_K04_DONOR_GLB_SHA256 as DONOR,
 C80_602_SCENES as SPECS,
 isC80602All5K04SourceScene as exact,
 c80602SourceReceipt as receipt,
 c80602RootFnv32 as fnv,
} from '../../src/scripts/privateModelC80602All5K04SourceProfile.mjs';
// Exact parent root lists extracted from original SHA-locked 56.8 MB GLB,
// compressed for offline Node CI. They are source IDs, not source geometry.
const rootZip='eNrtmU2OJTcMgy9Ui5L/JJ+lMfe/RsjPs5gGJkgH6EUm8Ibwc5llW5JpFt7Hxxr9fXbkfHar96kcy5CGMmzB9IMZhmboT2vtfXJp8GxtPGvMfFbPdB9QT+69/dLQkJrP2hNYhjSUYQvW+6zVw9DE1UQCWt0wnmgxprB70AhxhqYX+Of2fHq31qWlr2yPyMN9y8DT8oOuCVi15ot3ai6tWMvxXKKlQWsqbUBQWvsbhmbohmFwpN5lSAPjvNF4DWaEGWFGmBFmhCYqxTFbI45a1tzDrXLLr6rmmHXDMEyDtvR6otyeaAUr7+AAJ7hAZ02b016HQTFZCr/AP8tzLOWvnOK1vdzyIp3dmqxAD7aG7Nf7fbXLaE3x37G9kX5m90J4WbpT8Y7XIVVTnX1ptz1PthqoV/Vyr0jKZHdzu9Mv7ZufiudUiPrSNiOcB8202Odin4t9Lva5EjxjtjHJaLI+FjQTbsJNuAk34SbchFtwC27BLbgFt+AW3IJbcAvuhrvhbrgb7oa74W64G+6Gu81d7wsGSBDfDg5wggtMsEC4ATfgBtyAG3ADbsANuAE34Da4DW6D2+A2uA1ug9vgkovV4Ha41IHPqhEutbioxUUt6mSBcDvcAXfAHXAH3AF3wB1wJ9wJd8CdcCfcCXfCVW3qQKVrWr+jO2rRVcFuJ1jU4HDbURMGqJliUacvNTc9d0xrQ1ArQY6D7AZZCaIfRLx1R0TnHXVyxFvrp3YDbKBXlY6a0Nx0BQvhsqr0GoTuL2coypmI7foQBtjADp6nE+SEsv4d4OEy43YmdHLhDsa7FiVoL8jKF+2kvw4mWOAmPoxxHIQNXOw62IWfokyKgLnNuRASE+dSwjF/PB/ZpcjNYtzWsnKj5pbhcRTNct/1RLAM+Uik6Su39NNlqAP4us8tVZzAYrw8Ln0pqE+tsG5K8Yfvg5G0fE8p2gKJ8dTJEJRBF0p5MeXFWHCW9Wahw90vcLnpdtA4kvkmBzytXVaabaHZ1pnt0knnKJ2idIYEafCVqALKjS6qTNWUBJUzIZgGtqKfSpWK2gKie2VZgKeBVhrK4GvntfJO1MVKbdHd29fQ9jWUCqf6yq1uGAbP3zj7mzO1jzb+vFdOFaNvEwWbPP05Bwo2eXru0XMnrXMqOb+MXIxJNDzR50SfE33OPP2EEX3mBAgTLJA3oM+JPif6nOhzos+JPif6nOhzos+JPuc+yYJL5cY4VY8evEcVfOY6p7MPFGKgEJybfnRlMJIz1NGJPlAXa5QQ7oQ74U64k3PguYSchsV5XZwS319Cn7CWnCHHJ7jRgxs90ORAkwPNDHQy0Maw6RGidiu5Wx35yEB1Wv5WjQptqH7aqA57r4GqoY7lLEftoz3oARHgPlUbbZjn9POUnb44tXeiqROFYNexTpsVnl0zVyMXbRAT3tnR0X70NZY049rTa0+vPb329NrTb7Gn14L9py2Yru5xbdefarva+42ff//epn3xc/FXQ/elT0duqc8fkF82gJ8/Nfu3fGr+ran89RO0799+iF7LeS3ntZzXcl7LeS3ntZyfLOc1m9dsXrPJyBPnYzaP8byW81rOazmv5byW81rOazm/x3JeI3mN5P/dSDImGVOMKcYUY4o3F7PX/DMsp7eW13Nez3k95/Wc13Nez3n/Wb8e9XrU+8/6P3vOH38BHSRY/Q==';
const roots=JSON.parse(inflateSync(Buffer.from(rootZip,'base64')).toString('utf8'));
const floors=['1F','2F','BOTH','BOTH','BOTH','BOTH'],off=[11830,11833,11836,11839],on=[12340,12343,12346,12337];
export function makeC80602Fixture(){
 const g={scene:292,scenes:Array.from({length:602},()=>({})),
  asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,
   asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
  nodes:Array.from({length:12347},()=>({})),
  meshes:Array.from({length:4635},()=>({})),
  accessors:Array.from({length:10434},()=>({})),
  bufferViews:Array.from({length:10440},()=>({})),
  buffers:[{byteLength:33606952}]};
 g.meshes[4495]={primitives:[{}]};g.meshes[4496]={primitives:[{}]};
 const rootIds=[12340,12343,12346,12337],stable=['01','02','03','04'];
 const kids=[[12338,12339],[12341,12342],[12344,12345],[12335,12336]];
 for(let i=0;i<4;i++){
  g.nodes[rootIds[i]]={name:'K04_WALLHOST_D2F-SW-'+stable[i]+'_ROOT_WORK_TEST_HOST_HOLD',
   children:kids[i],
   extras:{stableID:'D2F-SW-'+stable[i],role:'WALL_LIGHT_SWITCH_OWNER_MARKUP_WORK_TEST'}};
  kids[i].forEach((kid,n)=>{g.nodes[kid]={name:'K04_PART_'+kid,
    mesh:n===0?4495:4496,extras:{sourceParentGLBSHA256:'donor'}};});
 }
 for(let n=0;n<6;n++){
  const i=596+n,p=590+n,d=536+n,floor=floors[n],active=n!==0;
  const old=roots[n],now=old.map(v=>active?(on[off.indexOf(v)]??v):v);
  g.scenes[p]={name:'C80_596_ALL5_K12_K09_THEMO_K16_K18_COFIT_FROM_'+(p-6)+'_'+floor+'_WORK_TEST_HOST_HOLD',
   nodes:[...old],extras:{current:false,asBuilt:false}};
  g.scenes[i]={name:'C80_602_ALL5_K12_K09_THEMO_K16_K18_K04_WALLHOST_COFIT_FROM_'+p+'_'+floor+'_WORK_TEST_HOST_HOLD',
   nodes:now,
   extras:{
    WORK_TEST:true,stage:'WORK_TEST_HOST_HOLD',floor,HOST_HOLD:true,
    C80602ParentSceneIndex:p,C80602ParentGLBSHA256:PARENT,
    C80602K04DonorSceneIndex:d,C80602K04DonorGLBSHA256:DONOR,
    C80602K04DonorZipDriveID:'1J0tJLyTdlDd79T3ZLTKqwaSB-0GR2U6c',
    C80602SourceZipDriveID:'1p74OzCIJRrtRhmsHSrYavH7lguZErys7',
    C80602K04SW01to04:active,C80602PreserveAll5K12K09ThemoK16K18:true,
    C80602CorrectedK04RootNodes:active?on:[],
    C80602ReplacedK04OriginalRootNodes:active?off:[],
    originalSourceLinksUnchanged:true,sourceLinksBound:false,
    sourceLinksBoundNewGLBSHA:false,current:false,asBuilt:false,
    HUMAN_REVIEW:'NOT_RUN',productionWebGLVerified:false,
    physicalK04InstallationVerified:false,physicalWallHostVerified:false,
    productSkuVerified:false
   }};
 }
 return g;
}
test('C80 602 six source-derived scenes accept correct SHA, floor and roots',()=>{
 const j=makeC80602Fixture();
 assert.equal(Object.keys(SPECS).length,6);
 for(const [index,spec] of Object.entries(SPECS)){
  const i=Number(index);
  assert.equal(fnv(j.scenes[i].nodes),spec.rootFnv);
  assert.equal(fnv(j.scenes[i-6].nodes),spec.parentFnv);
  assert.equal(exact(j,SHA,i,spec.floor),true,'source scene '+i);
 }
 assert.equal(exact(j,'0'.repeat(64),598),false);
 assert.equal(exact(j,SHA,598,'1F'),false);
 assert.deepEqual(receipt(j,SHA,598),{
  exactSource:true,sourceLinksBound:false,publishAllowed:false,
  current:false,asBuilt:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN',physicalHostVerified:false
 });
});
test('C80 602 swapped root, source SHA, child and approval spoofing fail closed',()=>{
 const alterations=[
  j=>j.scenes[598].nodes.splice(j.scenes[598].nodes.indexOf(12340),1,11830),
  j=>j.scenes[596].nodes[0]=12340,
  j=>j.scenes[597].extras.C80602ParentGLBSHA256='wrong',
  j=>j.scenes[601].extras.C80602K04SW01to04=false,
  j=>j.scenes[598].extras.sourceLinksBound=true,
  j=>j.scenes[598].extras.current=true,
  j=>j.scenes[598].extras.physicalK04InstallationVerified=true,
  j=>j.asset.extras.asBuilt=true,
  j=>j.nodes[12340].children.pop(),
  j=>j.nodes[12343].extras.stableID='wrong',
  j=>j.nodes[12344].mesh=0,
  j=>j.meshes[4495].primitives=[],
  j=>j.buffers[0].byteLength=0,
  j=>j.scenes[594].nodes.reverse(),
 ];
 for(let i=0;i<alterations.length;i++){
  const g=makeC80602Fixture();alterations[i](g);
  assert.equal(exact(g,SHA,598),false,'mutation '+i);
 }
});
const original=process.env.C80_602_GLB_PATH;
test('C80 602 complete original GLB six SHA-authenticated source scenes',
 {skip:!original},()=>{
 const b=readFileSync(original);
 assert.equal(b.length,BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),SHA);
 assert.equal(b.toString('ascii',0,4),'glTF');
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 for(const [i,spec] of Object.entries(SPECS)){
  assert.equal(exact(j,SHA,Number(i),spec.floor),true,'original '+i);
 }
 j.scenes[598].extras.C80602K04SW01to04=false;
 assert.equal(exact(j,SHA,598),false);
});
