import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SUCC455_SAVO483_GLB_SHA256 as SHA,
 C80_SUCC455_SAVO483_GLB_BYTES,
 C80_SUCC455_SAVO483_ZIP_DRIVE_ID,
 C80_SUCC455_SAVO483_SOURCE_LINKS_BOUND,
 C80_SUCC455_SAVO483_PUBLISH_ALLOWED,
 C80_SUCC455_SAVO483_SCENES as scenes,
 c80Succ455Savo483Fnv32 as fnv,
 isC80Succ455Savo483SourceScene as match,
 c80Succ455Savo483Receipt,
} from '../../src/scripts/privateModelC80Succ455Room3Mj83SourceProfile.mjs';

function fixture(){
 const json={
  asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
  scene:292,
  scenes:Array.from({length:483},()=>({nodes:[]})),
  nodes:Array.from({length:12225},()=>({})),
  meshes:Array.from({length:4601},()=>({})),
 };
 json.nodes[12222]={children:[12221]};
 json.nodes[12221]={children:[12195]};
 json.nodes[12195]={mesh:4577};
 json.nodes[12223]={
  name:'C80_SUCC455_ROOM3_MJ83_SAVO_OWNER_RIGHT_KEYPAD_WORK_TEST_HOST_HOLD',mesh:4540,
  matrix:[1,0,0,0,0,1,0,0,0,0,1,0,7.569,0,.469,1],
  extras:{sourceMJ83GLBSHA256:'dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56',
   newNodeIndex:12223,sourceLinksBoundForNewSHA:false},
 };
 json.nodes[12224]={name:'C80_SUCC455_ROOM3_MJ83_SAVO_RIGHT_KEYPAD_ROOT_WORK_TEST_HOST_HOLD',
  children:[12223],extras:{newNodeIndex:12224,sourceLinksBoundForNewSHA:false,current:false,asBuilt:false}};
 for(const s of Object.values(scenes)){
  const old=Array.from({length:s.rootCount},(_,i)=>i+1);
  old[0]=12222;
  old[s.replaceAt]=12057;
  json.scenes[s.parentScene]={nodes:old};
  const roots=old.slice();
  roots[s.replaceAt]=12224;
  json.scenes[s.scene]={name:s.name,nodes:roots,extras:{
   stage:'WORK_TEST_HOST_HOLD',floor:s.floor,sourceSceneIndex:s.sourceSceneIndex,
   sourceScene:s.sourceSceneIndex,newDoorLeaf:12195,newCOWRootNode:12222,
   oldDoorLeafHiddenInThisSceneOnly:8028,notVisibleStairTransferGrilles:true,
   current:false,asBuilt:false,sourceLinksBound:false,sourceLinksBindingVerified:false,
   sourceLinks:'NOT_BOUND',productionWebGLVerified:false,humanReviewApproved:false,
   savoMJ83OwnerPointCofit:{
    stage:'WORK_TEST_HOST_HOLD',sourceScene:s.parentScene,
    sourceGlbSha256:'dbb310a015a545d4c2b3ca4175265adc1f6bc7be3fb06d840f921491e572162f',
    sourceDriveId:'1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl',
    donorMJ83GLBSHA256:'dafe740cd1f0fd4bf483b2fac35edefd617adc20cf4404e23bf451976363bf56',
    donorDriveId:'1RAVTbylCZwQKB0siLZnr0i_NcGwF5v9K',
    donorNode:12110,donorRoot:12111,newKeypadNode:12223,newKeypadRoot:12224,
    oldKeypadSuppressed:12057,sharedMesh:4540,physicalHostMeasured:false,
    sourceLinksBound:false,productionWebGL:'NOT_RUN',HUMAN_REVIEW:'NOT_RUN',
    current:false,asBuilt:false,
   },
  }};
 }
 return json;
}
test('seven exact opt-in scenes and original 476-scene lineage identify correct root/floor',()=>{
 const f=fixture();
 assert.equal(Object.keys(scenes).length,7);
 for(const s of Object.values(scenes)){
  assert.equal(fnv(f.scenes[s.scene].nodes),s.rootFnv);
  assert.equal(match(f,SHA,s.scene,s.floor),true,`scene ${s.scene}`);
  assert.equal(f.scenes[s.scene].nodes[s.replaceAt],12224);
  assert.equal(f.scenes[s.parentScene].nodes[s.replaceAt],12057);
 }
});
test('incorrect GLB SHA, unregistered scene, wrong floor and old version fail closed',()=>{
 const f=fixture();
 assert.equal(match(f,'dbb310a015a545d4c2b3ca4175265adc1f6bc7be3fb06d840f921491e572162f',476,'2F'),false);
 assert.equal(match(f,'0'.repeat(64),476,'2F'),false);
 assert.equal(match(f,SHA,475),false);
 assert.equal(match(f,SHA,483),false);
 assert.equal(match(f,SHA,476,'BOTH'),false);
 assert.equal(C80_SUCC455_SAVO483_ZIP_DRIVE_ID,'1Kz1etD708DcLNBGaKXW4N55gFcDk9O8J');
 assert.equal(C80_SUCC455_SAVO483_GLB_BYTES,54973904);
});
test('wrong scene/root order, parent node and exact scene name are rejected',()=>{
 const f=fixture();f.scenes[477].nodes.reverse();
 assert.equal(match(f,SHA,477),false);
 const g=fixture();g.scenes[477].name+='X';
 assert.equal(match(g,SHA,477),false);
 const h=fixture();h.scenes[477].nodes[scenes[477].replaceAt]=12057;
 assert.equal(match(h,SHA,477),false);
 const i=fixture();i.scenes[470].nodes[scenes[477].replaceAt]=10156;
 assert.equal(match(i,SHA,477),false);
});
test('wrong node geometry/parent and residual visible old/SK1 component are rejected',()=>{
 const f=fixture();f.nodes[12223].mesh=10;assert.equal(match(f,SHA,476),false);
 const g=fixture();g.nodes[12224].children=[12223,12057];assert.equal(match(g,SHA,476),false);
 const h=fixture();h.nodes[12222].children=[12221,10156];assert.equal(match(h,SHA,477),false);
 const i=fixture();i.nodes[12223].matrix[12]+=0.2;assert.equal(match(i,SHA,476),false);
 const j=fixture();j.nodes[12195].mesh=2461;assert.equal(match(j,SHA,476),false);
});
test('source proof mismatch and false current or physical assertion fail closed',()=>{
 const f=fixture();f.scenes[478].extras.savoMJ83OwnerPointCofit.donorDriveId='other';
 assert.equal(match(f,SHA,478),false);
 const g=fixture();g.scenes[479].extras.savoMJ83OwnerPointCofit.physicalHostMeasured=true;
 assert.equal(match(g,SHA,479),false);
 const h=fixture();h.scenes[480].extras.sourceLinksBound=true;
 assert.equal(match(h,SHA,480),false);
 const i=fixture();i.scenes[481].extras.asBuilt=true;
 assert.equal(match(i,SHA,481),false);
 const j=fixture();j.scenes[482].extras.savoMJ83OwnerPointCofit.newKeypadNode=12057;
 assert.equal(match(j,SHA,482),false);
});
test('source receipt is never a publish or as-built permission',()=>{
 const f=fixture(),r=c80Succ455Savo483Receipt(f,SHA,476,'2F');
 assert.equal(r.exactSource,true);
 assert.equal(r.sourceLinksBound,false);assert.equal(r.publishAllowed,false);
 assert.equal(r.productionWebGLVerified,false);assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);assert.equal(r.humanReview,'NOT_RUN');
 assert.equal(C80_SUCC455_SAVO483_SOURCE_LINKS_BOUND,false);
 assert.equal(C80_SUCC455_SAVO483_PUBLISH_ALLOWED,false);
 assert.equal(c80Succ455Savo483Receipt(f,'0'.repeat(64),476,'2F').exactSource,false);
});
// Large authentic GLB is deliberately not committed to the repository.
// Local source check sets C80_SUCC455_SAVO483_GLB_PATH to the verified real file.
test('authenticated full 483-scene GLB validates seven opt-ins',{
 skip:!process.env.C80_SUCC455_SAVO483_GLB_PATH,
},()=>{
 const bytes=readFileSync(process.env.C80_SUCC455_SAVO483_GLB_PATH);
 assert.equal(bytes.length,C80_SUCC455_SAVO483_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),SHA);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const size=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
 for(const s of Object.values(scenes))assert.equal(match(json,SHA,s.scene,s.floor),true,`authentic scene ${s.scene}`);
});
