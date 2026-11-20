import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_R31_SCENE752_SOURCES as SPECS,
 c80R31Scene752RootsFnv32 as fnv,
 isC80R31Scene752Source as valid,
 c80R31Scene752SourceReceipt as receipt,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';
const paths={k5:process.env.C80_R31_K5_SCENE752_GLB_PATH,
 rain5:process.env.C80_R31_RAIN5_SCENE752_GLB_PATH};
const parse=path=>{
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(8),b.length);
 return {b,json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'))};
};
test('R31 scene752 independently pinned SHA, root hash and role',()=>{
 assert.deepEqual(Object.keys(SPECS),['k5','rain5']);
 assert.notEqual(SPECS.k5.glbSha256,SPECS.rain5.glbSha256);
 assert.notEqual(SPECS.k5.rootFnv32,SPECS.rain5.rootFnv32);
 for(const s of Object.values(SPECS)){
  assert.equal(s.sceneIndex,752);
  assert.match(s.glbSha256,/^[a-f0-9]{64}$/);
  assert.match(s.zipSha256,/^[a-f0-9]{64}$/);
 }
 assert.equal(fnv([0,-1]),null);
 assert.equal(fnv([0,1.5]),null);
 assert.equal(valid({},SPECS.k5.glbSha256,752,'k5','BOTH'),false);
 assert.equal(valid({},SPECS.rain5.glbSha256,752,'rain5','BOTH'),false);
 assert.equal(valid({},SPECS.k5.glbSha256,751,'k5','BOTH'),false);
 assert.equal(valid({},SPECS.k5.glbSha256,752,'rain5','BOTH'),false);
 assert.equal(valid({},SPECS.rain5.glbSha256,752,'k5','BOTH'),false);
 for(const role of Object.keys(SPECS)){
  const r=receipt({},SPECS[role].glbSha256,752,role,'BOTH');
  assert.equal(r.exactSource,false);
  assert.equal(r.sourceLinksBound,false);
  assert.equal(r.publishAllowed,false);
  assert.equal(r.current,false);
  assert.equal(r.asBuilt,false);
  assert.equal(r.physicalHostVerified,false);
 }
});
for(const [role,s] of Object.entries(SPECS)){
 test('original SHA/scene/root, cross-branch and mutation guards: '+role,
   {skip:!paths[role]},()=>{
  const {b,json}=parse(paths[role]);
  const sha=createHash('sha256').update(b).digest('hex');
  assert.equal(b.length,s.glbBytes);
  assert.equal(sha,s.glbSha256);
  assert.equal(valid(json,sha,752,role,'BOTH'),true);
  const other=role==='k5'?'rain5':'k5';
  assert.equal(valid(json,SPECS[other].glbSha256,752,role,'BOTH'),false);
  assert.equal(valid(json,sha,752,other,'BOTH'),false);
  assert.equal(valid(json,sha,751,role,'BOTH'),false);
  assert.equal(valid(json,sha,752,role,'1F'),false);
  const mutate=(obj,field,value)=>{
   const prior=obj[field];
   obj[field]=value;
   try{assert.equal(valid(json,sha,752,role,'BOTH'),false,String(field));}
   finally{obj[field]=prior;}
  };
  mutate(json.scenes[752],'name','wrong-scene');
  mutate(json.scenes[752].nodes,0,123456);
  mutate(json.asset.extras,'current',true);
  mutate(json.asset.extras,'asBuilt',true);
  if(role==='k5'){
   mutate(json.scenes[752].extras,'oldRootExcluded',12497);
   mutate(json.scenes[752].extras,'outputShaSourceLinks','BOUND');
  }else{
   mutate(json.scenes[752].extras,'parentGLBSHA256','0'.repeat(64));
   mutate(json.scenes[752].extras,'physicalDownspoutModelled',true);
   mutate(json.scenes[752].extras,'sourceLinksOutputShaBound',true);
   mutate(json.scenes[752].extras,'productionWebGL','PASS');
  }
  assert.equal(receipt(json,sha,752,role,'BOTH').exactSource,true);
  assert.equal(receipt(json,sha,752,role,'BOTH').publishAllowed,false);
 });
}


import {
 C80_R31_SCENE753_SOURCE as S753,
 isC80R31Scene753Source as valid753,
 c80R31Scene753SourceReceipt as receipt753,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 scene753 SHA-locked, never confuses RAIN5 or K5 scene752',()=>{
 assert.equal(S753.sceneIndex,753);
 assert.equal(S753.sourceScene,752);
 assert.notEqual(S753.glbSha256,SPECS.k5.glbSha256);
 assert.notEqual(S753.glbSha256,SPECS.rain5.glbSha256);
 assert.equal(S753.parentGlbSha256,SPECS.rain5.glbSha256);
 assert.equal(S753.k5DonorGlbSha256,SPECS.k5.glbSha256);
 assert.equal(S753.parentRootFnv32,SPECS.rain5.rootFnv32);
 assert.equal(valid753({},S753.glbSha256,753,S753.role,'BOTH'),false);
 assert.equal(valid753({},S753.glbSha256,752,S753.role,'BOTH'),false);
 assert.equal(valid753({},S753.glbSha256,753,'rain5','BOTH'),false);
 assert.equal(valid753({},SPECS.rain5.glbSha256,753,S753.role,'BOTH'),false);
 const r=receipt753({},S753.glbSha256,753,S753.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.physicalHostVerified,false);
 assert.equal(r.physicalDownspoutVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const combined753Path=process.env.C80_R31_ROOF5K5_SCENE753_GLB_PATH;
test('R31 scene753 authenticated original exact parent/root and mutation gates',
 {skip:!combined753Path},()=>{
 const {b,json}=parse(combined753Path);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S753.glbBytes);
 assert.equal(sha,S753.glbSha256);
 assert.equal(valid753(json,sha,753,S753.role,'BOTH'),true);
 assert.equal(valid753(json,sha,752,S753.role,'BOTH'),false);
 assert.equal(valid753(json,sha,753,'rain5','BOTH'),false);
 assert.equal(valid753(json,sha,753,S753.role,'1F'),false);
 assert.equal(valid753(json,SPECS.rain5.glbSha256,753,S753.role,'BOTH'),false);
 assert.equal(valid(json,sha,752,'rain5','BOTH'),false);
 const prev=json.scenes[752].nodes,roots=json.scenes[753].nodes;
 assert.deepEqual(roots,prev.filter(n=>n!==13176));
 assert.ok(roots.includes(12497));
 assert.ok(roots.includes(13476));
 assert.ok(!roots.includes(13176));
 const mutate=(obj,field,value)=>{
  const prior=obj[field];
  obj[field]=value;
  try{assert.equal(valid753(json,sha,753,S753.role,'BOTH'),false,String(field));}
  finally{obj[field]=prior;}
 };
 mutate(json.scenes[753],'name','wrong-scene');
 mutate(json.scenes[753].nodes,0,999999);
 mutate(json.scenes[752].nodes,0,999999);
 mutate(json.scenes[753].extras,'parentGLBSHA256','0'.repeat(64));
 mutate(json.scenes[753].extras,'sourceDonorK5OffGLBSHA256','0'.repeat(64));
 mutate(json.scenes[753].extras,'oldIncorrectRootSuppressed',12497);
 mutate(json.scenes[753].extras,'sourceLinksOutputSHA','BOUND');
 mutate(json.scenes[753].extras,'physicalDownspoutClaims',1);
 mutate(json.scenes[753].extras,'newPhysicalSocketNodes',1);
 mutate(json.scenes[753].extras,'humanReview','PASSED');
 mutate(json.asset.extras,'current',true);
 assert.equal(receipt753(json,sha,753,S753.role,'BOTH').exactSource,true);
 assert.equal(receipt753(json,sha,753,S753.role,'BOTH').publishAllowed,false);
});


import {
 C80_R31_SCENE754_SOURCE as S754,
 isC80R31Scene754Source as valid754,
 c80R31Scene754SourceReceipt as receipt754,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 scene754 is SHA/scene/role-locked independently from scene752/753',()=>{
 assert.equal(S754.sceneIndex,754);
 assert.equal(S754.sourceScene,753);
 assert.equal(S754.parentGlbSha256,S753.glbSha256);
 assert.equal(S754.parentRootFnv32,S753.rootFnv32);
 assert.equal(S754.rootFnv32,'bae9bd94');
 assert.equal(S754.visualRoot,13482);
 assert.deepEqual(S754.visualLeaves,[13477,13478,13479,13480,13481]);
 assert.notEqual(S754.glbSha256,S753.glbSha256);
 assert.notEqual(S754.glbSha256,SPECS.k5.glbSha256);
 assert.notEqual(S754.glbSha256,SPECS.rain5.glbSha256);
 assert.match(S754.zipSha256,/^[a-f0-9]{64}$/);
 assert.match(S754.glbSha256,/^[a-f0-9]{64}$/);
 for(const [sha,index,role,floor] of [
  [S754.glbSha256,754,S754.role,'BOTH'],
  [S754.glbSha256,753,S754.role,'BOTH'],
  [S754.glbSha256,754,S753.role,'BOTH'],
  [S753.glbSha256,754,S754.role,'BOTH'],
  [S754.glbSha256,754,S754.role,'1F'],
 ])assert.equal(valid754({},sha,index,role,floor),false);
 const r=receipt754({},S754.glbSha256,754,S754.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.physicalHostVerified,false);
 assert.equal(r.physicalLocationMeasured,false);
 assert.equal(r.physicalDownspoutVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const s754Path=process.env.C80_R31_H18116_SCENE754_GLB_PATH;
test('R31 scene754 authenticated original GLB, parent/root and host-hold mutation gates',
 {skip:!s754Path},()=>{
 const {b,json}=parse(s754Path);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S754.glbBytes);
 assert.equal(sha,S754.glbSha256);
 assert.equal(json.scenes[754].name,S754.sceneName);
 assert.equal(fnv(json.scenes[754].nodes),S754.rootFnv32);
 assert.equal(fnv(json.scenes[753].nodes),S754.parentRootFnv32);
 assert.deepEqual(json.scenes[754].nodes,[...json.scenes[753].nodes,13482]);
 assert.ok(!json.scenes[754].nodes.includes(13176));
 assert.ok(json.scenes[754].nodes.includes(12497));
 assert.ok(json.scenes[754].nodes.includes(13476));
 assert.equal(valid754(json,sha,754,S754.role,'BOTH'),true);
 assert.equal(valid754(json,sha,753,S754.role,'BOTH'),false);
 assert.equal(valid754(json,sha,754,S753.role,'BOTH'),false);
 assert.equal(valid754(json,S753.glbSha256,754,S754.role,'BOTH'),false);
 assert.equal(valid754(json,sha,754,S754.role,'2F'),false);
 assert.equal(valid753(json,sha,753,S753.role,'BOTH'),false);
 const mutate=(obj,field,value)=>{
  const prior=obj[field];
  obj[field]=value;
  try{assert.equal(valid754(json,sha,754,S754.role,'BOTH'),false,String(field));}
  finally{obj[field]=prior;}
 };
 mutate(json.scenes[754],'name','wrong-scene');
 mutate(json.scenes[754].nodes,0,999999);
 mutate(json.scenes[753].nodes,0,999999);
 mutate(json.scenes[754].extras,'parentGLBSHA256','0'.repeat(64));
 mutate(json.scenes[754].extras,'sourceVisualDonorGLBSHA256','0'.repeat(64));
 mutate(json.scenes[754].extras,'H18116VisualRole','WRONG_K5_ROLE');
 mutate(json.scenes[754].extras,'H18116ExactXYZ','SURVEYED');
 mutate(json.scenes[754].extras,'H18116OldWrongK5SourceInactive',false);
 mutate(json.scenes[754].extras,'additionalPhysicalSocketClaims',1);
 mutate(json.scenes[754].extras,'sourceLinksOutputSHA','BOUND');
 mutate(json.scenes[754].extras,'productionWebGL','SUCCESS');
 mutate(json.nodes[13482],'children',[13477]);
 mutate(json.nodes[13482].extras,'exactPhysicalPositionVerified',true);
 mutate(json.nodes[13482].extras,'presentationOnly',false);
 mutate(json.nodes[13477],'mesh',400);
 mutate(json.nodes[13477].extras,'sourceDonorNodeIndex',0);
 mutate(json.nodes[13477].extras,'sourceLinksOutputSHABound',true);
 mutate(json.asset.extras,'current',true);
 mutate(json.asset.extras,'asBuilt',true);
 const receipt=receipt754(json,sha,754,S754.role,'BOTH');
 assert.equal(receipt.exactSource,true);
 assert.equal(receipt.publishAllowed,false);
 assert.equal(receipt.sourceLinksBound,false);
 assert.equal(receipt.physicalHostVerified,false);
 assert.equal(receipt.physicalLocationMeasured,false);
 assert.equal(receipt.physicalDownspoutVerified,false);
});
