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


import {
 C80_R31_SCENE756_SOURCE as S756,
 isC80R31Scene756Source as valid756,
 c80R31Scene756SourceReceipt as receipt756,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 combined L16 scene756 exact ZIP/GLB source role and two different scene755 donors',()=>{
 assert.equal(S756.sceneIndex,756);
 assert.equal(S756.parentScene,755);
 assert.equal(S756.parentGlbSha256,undefined);
 assert.equal(S756.sharedParentGlbSha256,S754.glbSha256);
 assert.equal(S756.parentRootFnv32,'106be574');
 assert.equal(S756.rootFnv32,'2bebfdbd');
 assert.notEqual(S756.curveDonorGlbSha256,S756.caseDonorGlbSha256);
 assert.notEqual(S756.glbSha256,S754.glbSha256);
 assert.notEqual(S756.glbSha256,S756.curveDonorGlbSha256);
 assert.notEqual(S756.glbSha256,S756.caseDonorGlbSha256);
 assert.match(S756.zipSha256,/^[a-f0-9]{64}$/);
 assert.match(S756.glbSha256,/^[a-f0-9]{64}$/);
 assert.equal(S756.oldCurveRoot,13484);
 assert.equal(S756.newCurveRoot,13485);
 assert.equal(S756.newCaseRoot,13486);
 for(const [sha,index,role,floor] of [
  [S756.glbSha256,756,S756.role,'BOTH'],
  [S756.glbSha256,755,S756.role,'BOTH'],
  [S756.curveDonorGlbSha256,756,S756.role,'BOTH'],
  [S756.caseDonorGlbSha256,756,S756.role,'BOTH'],
  [S754.glbSha256,756,S756.role,'BOTH'],
  [S756.glbSha256,756,S754.role,'BOTH'],
  [S756.glbSha256,756,S756.role,'1F'],
  [S756.glbSha256,756,'__proto__','BOTH'],
 ])assert.equal(valid756({},sha,index,role,floor),false);
 const r=receipt756({},S756.glbSha256,756,S756.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
 assert.equal(r.physicalHostVerified,false);
 assert.equal(r.physicalRouteVerified,false);
 assert.equal(r.physicalClearanceVerified,false);
});
const s756Path=process.env.C80_R31_L16_SCENE756_GLB_PATH;
test('R31 combined L16 scene756 authenticated original exact roots, two donors and HOLD gates',
 {skip:!s756Path},()=>{
 const {b,json}=parse(s756Path);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S756.glbBytes);
 assert.equal(sha,S756.glbSha256);
 assert.equal(json.scenes.length,S756.sceneCount);
 assert.equal(json.scenes[756].name,S756.sceneName);
 assert.equal(json.scenes[755].name,S756.parentName);
 assert.equal(fnv(json.scenes[756].nodes),S756.rootFnv32);
 assert.equal(fnv(json.scenes[755].nodes),S756.parentRootFnv32);
 const old=json.scenes[755].nodes,roots=json.scenes[756].nodes;
 assert.deepEqual(roots,[...old.map(x=>x===13484?13485:x),13486]);
 assert.ok(!roots.includes(13484));
 assert.ok(!roots.includes(13176));
 for(const id of [12497,13476,13482,13485,13486])assert.ok(roots.includes(id));
 assert.deepEqual(json.nodes[13485].children,[13483,13139,13138]);
 assert.equal(json.nodes[13486].mesh,4721);
 assert.deepEqual(json.nodes[13486].translation,[0.056,0,0]);
 assert.equal(valid756(json,sha,756,S756.role,'BOTH'),true);
 assert.equal(valid756(json,sha,755,S756.role,'BOTH'),false);
 assert.equal(valid756(json,sha,756,S754.role,'BOTH'),false);
 assert.equal(valid756(json,S756.curveDonorGlbSha256,756,S756.role,'BOTH'),false);
 assert.equal(valid756(json,S756.caseDonorGlbSha256,756,S756.role,'BOTH'),false);
 assert.equal(valid756(json,sha,756,S756.role,'2F'),false);
 assert.equal(valid754(json,sha,754,S754.role,'BOTH'),false);
 const mutate=(obj,field,value)=>{
  const prior=obj[field];
  obj[field]=value;
  try{assert.equal(valid756(json,sha,756,S756.role,'BOTH'),false,String(field));}
  finally{obj[field]=prior;}
 };
 mutate(json.scenes[756],'name','forged-scene-name');
 mutate(json.scenes[756].nodes,0,999999);
 mutate(json.scenes[755].nodes,0,999999);
 mutate(json.scenes[756].extras,'parentGLBSHA256','0'.repeat(64));
 mutate(json.scenes[756].extras,'otherBranchGLBSHA256','0'.repeat(64));
 mutate(json.scenes[756].extras,'sourceParentScene754GLBSHA256','0'.repeat(64));
 mutate(json.scenes[756].extras,'combinedArcCOWRoot',13484);
 mutate(json.scenes[756].extras,'combinedExternalCaseNode',13259);
 mutate(json.scenes[756].extras,'removedOnlyActiveLegacyCaseNode',123);
 mutate(json.scenes[756].extras,'newMeshes',1);
 mutate(json.scenes[756].extras,'newPhysicalRouteClaims',1);
 mutate(json.scenes[756].extras,'arcConnectionPhysicalContinuity','VERIFIED');
 mutate(json.scenes[756].extras,'caseLocationStatus','MEASURED');
 mutate(json.scenes[756].extras,'sourceLinksOutputSHA','BOUND');
 mutate(json.scenes[756].extras,'productionWebGL','PASS');
 mutate(json.nodes[13485],'children',[13259,13483,13139,13138]);
 mutate(json.nodes[13485].extras,'physicalConnectionVerified',true);
 mutate(json.nodes[13486],'mesh',4722);
 mutate(json.nodes[13486],'translation',[0,0,0]);
 mutate(json.nodes[13486].extras,'sourceDonorGLBSHA256','0'.repeat(64));
 mutate(json.nodes[13486].extras,'physicalXYZMeasured',true);
 mutate(json.nodes[13486].extras,'sourceLinksOutputSHABound',true);
 mutate(json.asset.extras,'current',true);
 mutate(json.asset.extras,'asBuilt',true);
 const r=receipt756(json,sha,756,S756.role,'BOTH');
 assert.equal(r.exactSource,true);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.physicalRouteVerified,false);
 assert.equal(r.physicalClearanceVerified,false);
});


import {
 C80_R31_R300_SOURCE as R300,
 C80_R31_R300_VIEWS as R300_VIEWS,
 isC80R31R300CopperSource as validR300,
 c80R31R300CopperSourceReceipt as receiptR300,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 R300 scene759/760 share a single GLB SHA but have distinct screen roles',()=>{
 const n=R300_VIEWS.normal,s=R300_VIEWS.service;
 assert.notEqual(n.role,s.role);
 assert.notEqual(n.sceneIndex,s.sceneIndex);
 assert.equal(n.sceneIndex,759);
 assert.equal(s.sceneIndex,760);
 assert.equal(n.rootCount,s.rootCount+1);
 assert.notEqual(n.rootFnv32,s.rootFnv32);
 assert.match(R300.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(R300.zipSha256,/^[a-f0-9]{64}$/);
 assert.notEqual(R300.glbSha256,S756.glbSha256);
 assert.deepEqual(R300.copperLeaves,[13492,13493]);
 assert.deepEqual(R300.copperMeshes,[5163,5164]);
 for(const v of Object.values(R300_VIEWS)){
  for(const [sha,index,role,floor] of [
   [R300.glbSha256,v.sceneIndex,v.role,'BOTH'],
   [R300.glbSha256,v.sceneIndex-1,v.role,'BOTH'],
   [R300.glbSha256,v.sceneIndex,v.role,'1F'],
   [S756.glbSha256,v.sceneIndex,v.role,'BOTH'],
   [R300.glbSha256,v.sceneIndex,'__proto__','BOTH'],
  ])assert.equal(validR300({},sha,index,role,floor),false);
  const receipt=receiptR300({},R300.glbSha256,v.sceneIndex,v.role,'BOTH');
  assert.equal(receipt.exactSource,false);
  assert.equal(receipt.publishAllowed,false);
  assert.equal(receipt.sourceLinksBound,false);
  assert.equal(receipt.physicalConnectionsVerified,false);
  assert.equal(receipt.serviceClearanceVerified,false);
  assert.equal(receipt.current,false);
  assert.equal(receipt.asBuilt,false);
 }
});
const r300FixturePath=process.env.C80_R31_R300_SCENE760_GLB_PATH;
test('R31 R300 ORIGINAL GLB: both views, root/parent SHA, copper pair, plexi & mutations',
 {skip:!r300FixturePath},()=>{
 const {b,json}=parse(r300FixturePath),sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,R300.glbBytes);
 assert.equal(sha,R300.glbSha256);
 assert.equal(json.scenes.length,R300.sceneCount);
 const parent=json.scenes[R300.parentSceneIndex].nodes;
 const normal=json.scenes[R300_VIEWS.normal.sceneIndex].nodes;
 const service=json.scenes[R300_VIEWS.service.sceneIndex].nodes;
 assert.equal(fnv(parent),R300.parentRootFnv32);
 assert.equal(fnv(normal),R300_VIEWS.normal.rootFnv32);
 assert.equal(fnv(service),R300_VIEWS.service.rootFnv32);
 assert.deepEqual(normal,[...parent,R300.copperRoot]);
 assert.deepEqual(service,normal.filter(n=>n!==R300.screenRoot));
 assert.ok(normal.includes(R300.screenRoot));
 assert.ok(!service.includes(R300.screenRoot));
 assert.deepEqual(json.nodes[R300.copperRoot].children,R300.copperLeaves);
 for(const v of Object.values(R300_VIEWS)){
  const check=()=>validR300(json,sha,v.sceneIndex,v.role,'BOTH');
  assert.equal(check(),true);
  assert.equal(validR300(json,sha,v.sceneIndex,v.role==='R300_VISIBLE_COPPER_NORMAL_SCREEN_ON'?
   R300_VIEWS.service.role:R300_VIEWS.normal.role,'BOTH'),false);
  assert.equal(validR300(json,sha,v.sceneIndex,R300_VIEWS.normal.role,'1F'),false);
  assert.equal(validR300(json,S756.glbSha256,v.sceneIndex,v.role,'BOTH'),false);
  const mutate=(obj,key,val)=>{
   const old=obj[key];obj[key]=val;
   try{assert.equal(check(),false,'wrong '+key);}
   finally{obj[key]=old;}
  };
  mutate(json.scenes[v.sceneIndex],'name','wrong-scene');
  mutate(json.scenes[v.sceneIndex].nodes,0,999999);
  mutate(json.scenes[R300.parentSceneIndex].nodes,0,999999);
  mutate(json.scenes[v.sceneIndex].extras,'sourceGLBSHA256','0'.repeat(64));
  mutate(json.scenes[v.sceneIndex].extras,'splashScreenVisible',!v.screenVisible);
  mutate(json.scenes[v.sceneIndex].extras,'maintenanceAccessPhysicallyVerified',true);
  mutate(json.scenes[v.sceneIndex].extras,'physicalWaterConnectionsVerified',1);
  mutate(json.scenes[v.sceneIndex].extras,'sourceLinksOutputShaBound',true);
  mutate(json.scenes[v.sceneIndex].extras,'productionWebGL','PASS');
  mutate(json.nodes[R300.copperRoot],'children',[13492]);
  mutate(json.nodes[13492],'mesh',0);
  mutate(json.nodes[13493].extras,'copperFunction','ASSUMED_COLD');
  mutate(json.asset.extras,'current',true);
  mutate(json.asset.extras,'asBuilt',true);
  assert.equal(receiptR300(json,sha,v.sceneIndex,v.role,'BOTH').exactSource,true);
  assert.equal(receiptR300(json,sha,v.sceneIndex,v.role,'BOTH').publishAllowed,false);
 }
});


import {
 C80_R31_VM20_HATCH_SOURCE as HATCH,
 C80_R31_VM20_HATCH_VIEWS as HATCH_VIEWS,
 isC80R31Vm20HatchSource as validHatch,
 c80R31Vm20HatchSourceReceipt as receiptHatch,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 D1F VM20 761/762 source roles share one SHA and preserve screen-on parent 759',()=>{
 const c=HATCH_VIEWS.closed,o=HATCH_VIEWS.opened;
 assert.equal(HATCH.parentSceneIndex,759);
 assert.equal(c.sceneIndex,761);
 assert.equal(o.sceneIndex,762);
 assert.notEqual(c.role,o.role);
 assert.notEqual(c.rootFnv32,o.rootFnv32);
 assert.equal(c.rootCount,o.rootCount);
 assert.equal(HATCH.screenRoot,11625);
 assert.equal(HATCH.copperRoot,13494);
 assert.notEqual(HATCH.glbSha256,R300.glbSha256);
 assert.match(HATCH.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(HATCH.zipSha256,/^[a-f0-9]{64}$/);
 for(const view of Object.values(HATCH_VIEWS)){
  for(const [sha,i,role,floor] of [
   [HATCH.glbSha256,view.sceneIndex,view.role,'BOTH'],
   [HATCH.glbSha256,view.sceneIndex-1,view.role,'BOTH'],
   [R300.glbSha256,view.sceneIndex,view.role,'BOTH'],
   [HATCH.glbSha256,view.sceneIndex,view.role,'1F'],
   [HATCH.glbSha256,view.sceneIndex,'__proto__','BOTH'],
  ])assert.equal(validHatch({},sha,i,role,floor),false);
  const receipt=receiptHatch({},HATCH.glbSha256,view.sceneIndex,view.role,'BOTH');
  assert.equal(receipt.exactSource,false);
  assert.equal(receipt.publishAllowed,false);
  assert.equal(receipt.sourceLinksBound,false);
  assert.equal(receipt.physicalOpeningMeasured,false);
  assert.equal(receipt.plumbingConnectivityVerified,false);
  assert.equal(receipt.current,false);
  assert.equal(receipt.asBuilt,false);
 }
});
const hatchFixturePath=process.env.C80_R31_VM20_SCENE762_GLB_PATH;
test('R31 D1F VM20 ORIGINAL GLB: scene761 closed and scene762 opened, exact wall, source root and negative mutations',
 {skip:!hatchFixturePath},()=>{
 const {b,json}=parse(hatchFixturePath),sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,HATCH.glbBytes);
 assert.equal(sha,HATCH.glbSha256);
 assert.equal(json.scenes.length,HATCH.sceneCount);
 const parent=json.scenes[759].nodes;
 const closed=json.scenes[761].nodes;
 const opened=json.scenes[762].nodes;
 assert.equal(fnv(parent),HATCH.parentRootFnv32);
 assert.equal(fnv(closed),HATCH_VIEWS.closed.rootFnv32);
 assert.equal(fnv(opened),HATCH_VIEWS.opened.rootFnv32);
 assert.deepEqual(closed,parent.map(n=>n===HATCH.oldWallRoot?HATCH.newWallRoot:n));
 assert.deepEqual(opened,closed.map(n=>n===HATCH.oldS2Root?HATCH.newS2Root:n));
 assert.ok(parent.includes(HATCH.screenRoot));
 assert.ok(closed.includes(HATCH.screenRoot));
 assert.ok(opened.includes(HATCH.screenRoot));
 assert.ok(!closed.includes(HATCH.oldWallRoot));
 assert.ok(!opened.includes(HATCH.oldS2Root));
 assert.deepEqual(json.nodes[HATCH.newS2Root].children,
  json.nodes[HATCH.oldS2Root].children.map(n=>
   n===HATCH.oldLeafNode?HATCH.newLeafNode:n));
 for(const v of Object.values(HATCH_VIEWS)){
  const check=()=>validHatch(json,sha,v.sceneIndex,v.role,'BOTH');
  assert.equal(check(),true,v.role);
  assert.equal(validHatch(json,R300.glbSha256,v.sceneIndex,v.role,'BOTH'),false);
  assert.equal(validHatch(json,sha,v.sceneIndex,v.role==='VM20_D1F_UPPER_ACCESS_HATCH_CLOSED'?
   HATCH_VIEWS.opened.role:HATCH_VIEWS.closed.role,'BOTH'),false);
  assert.equal(validHatch(json,sha,v.sceneIndex,v.role,'2F'),false);
  const mutate=(obj,key,val)=>{
   const old=obj[key];obj[key]=val;
   try{assert.equal(check(),false,'wrong '+key);}
   finally{obj[key]=old;}
  };
  mutate(json.scenes[v.sceneIndex],'name','forged');
  mutate(json.scenes[759].nodes,0,999999);
  mutate(json.scenes[761].nodes,0,999999);
  mutate(json.scenes[762].nodes,0,999999);
  mutate(json.scenes[v.sceneIndex].extras,'parentGLBSHA256','0'.repeat(64));
  mutate(json.scenes[v.sceneIndex].extras,'sourceParentZipDriveID','WRONG');
  mutate(json.scenes[v.sceneIndex].extras,'photoRelativeNotMeasured',false);
  mutate(json.scenes[v.sceneIndex].extras,'activePhysicalPlumbingUnmodified',false);
  mutate(json.scenes[v.sceneIndex].extras,'sourceLinksOutputSHA','BOUND');
  mutate(json.scenes[v.sceneIndex].extras,'productionWebGL','PASS');
  mutate(json.nodes[HATCH.newWallRoot],'mesh',0);
  mutate(json.nodes[HATCH.newWallRoot].extras,'replacesNode',123);
  mutate(json.nodes[HATCH.newLeafNode].extras,'photoRightHinge',false);
  mutate(json.nodes[HATCH.newLeafNode].extras,'swing','MEASURED');
  mutate(json.nodes[HATCH.newS2Root].extras,'allOtherChildrenExact',false);
  mutate(json.nodes[HATCH.newS2Root],'children',[HATCH.newLeafNode]);
  mutate(json.asset.extras,'current',true);
  mutate(json.asset.extras,'asBuilt',true);
  const receipt=receiptHatch(json,sha,v.sceneIndex,v.role,'BOTH');
  assert.equal(receipt.exactSource,true);
  assert.equal(receipt.publishAllowed,false);
  assert.equal(receipt.physicalOpeningMeasured,false);
  assert.equal(receipt.plumbingConnectivityVerified,false);
 }
});


import {
 C80_R31_RK142_SOURCE as RK142,
 isC80R31RK142Source as validRK142,
 c80R31RK142SourceReceipt as receiptRK142,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 RK14.2 scene763 pins a distinct schematic SHA and rejects source confusion',()=>{
 assert.equal(RK142.sceneIndex,763);
 assert.equal(RK142.parentScene,762);
 assert.equal(RK142.sceneCount,764);
 assert.equal(RK142.newRoot,13499);
 assert.equal(RK142.newLeaf,13498);
 assert.equal(RK142.newMesh,5166);
 assert.equal(RK142.role,'RK14_2_WINE_COOLER_2015_SCHEMATIC_ONLY');
 assert.notEqual(RK142.glbSha256,R300.glbSha256);
 assert.notEqual(RK142.glbSha256,HATCH.glbSha256);
 assert.match(RK142.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(RK142.zipSha256,/^[a-f0-9]{64}$/);
 for(const [sha,scene,role,floor] of [
  [RK142.glbSha256,763,RK142.role,'BOTH'],
  [RK142.glbSha256,762,RK142.role,'BOTH'],
  [RK142.glbSha256,761,RK142.role,'BOTH'],
  [HATCH.glbSha256,763,RK142.role,'BOTH'],
  [R300.glbSha256,763,RK142.role,'BOTH'],
  [RK142.glbSha256,763,'__proto__','BOTH'],
  [RK142.glbSha256,763,RK142.role,'2F'],
 ])assert.equal(validRK142({},sha,scene,role,floor),false);
 const r=receiptRK142({},RK142.glbSha256,763,RK142.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.physicalCableRouteVerified,false);
 assert.equal(r.physicalConnectionVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const rk142Fixture=process.env.C80_R31_RK142_SCENE763_GLB_PATH;
test('R31 ORIGINAL RK14.2 scene763 SHA, ordered roots, labels and HOLD metadata',
 {skip:!rk142Fixture},()=>{
 const {b,json}=parse(rk142Fixture);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,RK142.glbBytes);
 assert.equal(sha,RK142.glbSha256);
 assert.equal(json.scene,RK142.defaultScene);
 assert.equal(json.scenes.length,RK142.sceneCount);
 assert.equal(json.nodes.length,RK142.nodeCount);
 assert.equal(json.meshes.length,RK142.meshCount);
 const parent=json.scenes[RK142.parentScene];
 const target=json.scenes[RK142.sceneIndex];
 assert.equal(parent.name,RK142.parentSceneName);
 assert.equal(target.name,RK142.sceneName);
 assert.equal(fnv(parent.nodes),RK142.parentRootFnv32);
 assert.equal(fnv(target.nodes),RK142.targetRootFnv32);
 assert.deepEqual(target.nodes,[...parent.nodes,RK142.newRoot]);
 assert.deepEqual(json.nodes[RK142.newRoot].children,[RK142.newLeaf]);
 const check=()=>validRK142(json,sha,RK142.sceneIndex,RK142.role,'BOTH');
 assert.equal(check(),true);
 assert.equal(validRK142(json,HATCH.glbSha256,RK142.sceneIndex,RK142.role,'BOTH'),false);
 assert.equal(validRK142(json,sha,762,RK142.role,'BOTH'),false);
 assert.equal(validRK142(json,sha,763,RK142.role,'1F'),false);
 const mutate=(o,k,v)=>{
  const old=o[k];o[k]=v;
  try{assert.equal(check(),false,'mutated '+k);}
  finally{o[k]=old;}
 };
 mutate(target,'name','FORGED_763');
 mutate(target.nodes,0,123456);
 mutate(parent.nodes,0,123456);
 mutate(target.extras,'sourceParentGLBSHA256','0'.repeat(64));
 mutate(target.extras,'physicalCableConnectionVerified',true);
 mutate(target.extras,'sourceLinksBoundForOutputSHA',true);
 mutate(target.extras,'sourceRole','2026_CURRENT');
 mutate(json.nodes[RK142.newRoot],'children',[13013]);
 mutate(json.nodes[RK142.newRoot].extras,'physicalConnectionVerified',true);
 mutate(json.nodes[RK142.newRoot].extras,'sourceLinksBoundForOutputSHA',true);
 mutate(json.nodes[RK142.newLeaf],'mesh',0);
 mutate(json.nodes[RK142.newLeaf].extras,'2026CircuitConnectionVerified',true);
 mutate(json.nodes[RK142.newLeaf].extras,'physicalWiringRouteVerified',true);
 mutate(json.nodes[RK142.newLeaf].extras,'circuitId','RK14.3');
 mutate(json.nodes[RK142.newLeaf].extras,'sourceProductRootNode',12633);
 mutate(json.nodes[RK142.newLeaf].extras,'sourceLinksBoundForOutputSHA',true);
 mutate(json.nodes[RK142.newLeaf].extras.sourceLinks[0],'docId','WRONG_SOURCE');
 mutate(json.asset.extras,'current',true);
 mutate(json.asset.extras,'asBuilt',true);
 assert.equal(check(),true);
 const receipt=receiptRK142(json,sha,763,RK142.role,'BOTH');
 assert.equal(receipt.exactSource,true);
 assert.equal(receipt.publishAllowed,false);
 assert.equal(receipt.sourceLinksBound,false);
 assert.equal(receipt.humanReview,'NOT_RUN');
});


import {
 C80_R31_RK143_SOURCE as RK143,
 isC80R31RK143Source as validRK143,
 c80R31RK143SourceReceipt as receiptRK143,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 RK14.2 and RK14.3 same scene763 use distinct immutable source identities',()=>{
 assert.equal(RK143.sceneIndex,RK142.sceneIndex);
 assert.equal(RK143.sceneIndex,763);
 assert.equal(RK143.parentScene,761);
 assert.equal(RK142.parentScene,762);
 assert.notEqual(RK143.glbSha256,RK142.glbSha256);
 assert.notEqual(RK143.zipDriveId,RK142.zipDriveId);
 assert.equal(RK143.parentGlbSha256,RK142.parentGLBSHA256);
 assert.equal(RK143.newNode,13498);
 assert.equal(RK143.newMesh,5166);
 assert.equal(RK143.parentRootFnv32,'da71cd8f');
 assert.equal(RK143.targetRootFnv32,'166b4e6f');
 for(const [sha,scene,role,floor] of [
  [RK143.glbSha256,763,RK143.role,'BOTH'],
  [RK142.glbSha256,763,RK143.role,'BOTH'],
  [RK143.glbSha256,763,RK142.role,'BOTH'],
  [RK143.glbSha256,762,RK143.role,'BOTH'],
  [RK143.glbSha256,763,RK143.role,'2F'],
  [RK143.glbSha256,763,'__proto__','BOTH'],
 ])
  assert.equal(validRK143({},sha,scene,role,floor),false);
 const r=receiptRK143({},RK143.glbSha256,763,RK143.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.physicalCableVerified,false);
 assert.equal(r.electricalSafetyVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const rk143Fixture=process.env.C80_R31_RK143_SCENE763_GLB_PATH;
test('R31 ORIGINAL RK14.3 scene763 exact roots, 2015 hood and no-current gates',
 {skip:!rk143Fixture},()=>{
 const {b,json}=parse(rk143Fixture);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,RK143.glbBytes);
 assert.equal(sha,RK143.glbSha256);
 assert.equal(json.scene,RK143.defaultScene);
 assert.equal(json.scenes.length,RK143.sceneCount);
 assert.equal(json.nodes.length,RK143.nodeCount);
 assert.equal(json.meshes.length,RK143.meshCount);
 assert.equal(json.materials.length,RK143.materialCount);
 assert.equal(json.accessors.length,RK143.accessorCount);
 assert.equal(json.bufferViews.length,RK143.bufferViewCount);
 const parent=json.scenes[RK143.parentScene],target=json.scenes[RK143.sceneIndex];
 assert.equal(parent.name,RK143.parentSceneName);
 assert.equal(target.name,RK143.sceneName);
 assert.equal(fnv(parent.nodes),RK143.parentRootFnv32);
 assert.equal(fnv(target.nodes),RK143.targetRootFnv32);
 assert.deepEqual(target.nodes,[...parent.nodes,RK143.newNode]);
 const check=()=>validRK143(json,sha,RK143.sceneIndex,RK143.role,'BOTH');
 assert.equal(check(),true);
 for(const [source,scene,role,floor] of [
  [RK142.glbSha256,763,RK143.role,'BOTH'],
  [RK143.glbSha256,763,RK142.role,'BOTH'],
  [RK143.glbSha256,762,RK143.role,'BOTH'],
  [RK143.glbSha256,763,RK143.role,'1F'],
 ])assert.equal(validRK143(json,source,scene,role,floor),false);
 const change=(o,k,value)=>{
  const old=o[k];o[k]=value;
  try{assert.equal(check(),false,'mutated '+String(k));}
  finally{o[k]=old;}
 };
 change(target,'name','FORGED');
 change(target.nodes,0,999999);
 change(parent.nodes,0,999999);
 change(target.extras,'sourceSceneIndex',762);
 change(target.extras,'sourceGLBSHA256','0'.repeat(64));
 change(target.extras,'physical2026ConnectionsVerified',true);
 change(target.extras,'sourceLinksOutputSHA','BOUND');
 change(target.extras,'visualDiagramOnly',false);
 change(json.nodes[RK143.newNode],'mesh',0);
 change(json.nodes[RK143.newNode].extras,'circuitId','RK14.2');
 change(json.nodes[RK143.newNode].extras,'actualCableRouteVerified',true);
 change(json.nodes[RK143.newNode].extras,'electricalSafetyApproval',true);
 change(json.nodes[RK143.newNode].extras.sourceLinks[0],'link','WRONG_SOURCE');
 change(json.asset.extras,'current',true);
 change(json.asset.extras,'asBuilt',true);
 assert.equal(check(),true);
});


import {
 C80_R31_SCENE765_RK142_RK143_MJ83_SOURCE as S765,
 isC80R31Scene765RK142RK143MJ83Source as validS765,
 c80R31Scene765RK142RK143MJ83SourceReceipt as receiptS765,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 765 SHA-locked 2015 dual schematic + 2026 MJ83 panel is source-only, not published',()=>{
 assert.equal(S765.sceneIndex,765);
 assert.equal(S765.parentScene,764);
 assert.equal(S765.sceneCount,766);
 assert.equal(S765.parentRootCount,497);
 assert.equal(S765.targetRootCount,498);
 assert.equal(S765.parentRootFnv32,'957cc832');
 assert.equal(S765.targetRootFnv32,'dfc19064');
 assert.equal(S765.newPanelRoot,13502);
 assert.equal(S765.newPanelLeaf,13501);
 assert.equal(S765.reusedPanelMesh,4540);
 assert.notEqual(S765.glbSha256,RK143.glbSha256);
 assert.notEqual(S765.glbSha256,RK142.glbSha256);
 assert.notEqual(S765.glbSha256,S756.glbSha256);
 assert.match(S765.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(S765.zipSha256,/^[a-f0-9]{64}$/);
 for(const [sha,index,role,floor] of [
  [S765.glbSha256,765,S765.role,'BOTH'],
  [S765.glbSha256,764,S765.role,'BOTH'],
  [S765.glbSha256,765,S765.role,'2F'],
  [S765.glbSha256,765,'__proto__','BOTH'],
  [RK143.glbSha256,765,S765.role,'BOTH'],
  [RK142.glbSha256,765,S765.role,'BOTH'],
  [S765.glbSha256,765,RK143.role,'BOTH'],
 ])assert.equal(validS765({},sha,index,role,floor),false);
 const r=receiptS765({},S765.glbSha256,765,S765.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.productionWebGLVerified,false);
 assert.equal(r.physicalCableVerified,false);
 assert.equal(r.electricalSafetyVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});

const scene765OriginalGlbPath=process.env.C80_R31_RK142_RK143_MJ83_SCENE765_GLB_PATH;
test('R31 765 ORIGINAL G2b GLB: exact SHA, parent/role, shared mesh and fail-closed mutations',
 {skip:!scene765OriginalGlbPath},()=>{
 const {b,json}=parse(scene765OriginalGlbPath);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S765.glbBytes);
 assert.equal(sha,S765.glbSha256);
 assert.equal(json.scene,S765.defaultScene);
 assert.equal(json.scenes.length,S765.sceneCount);
 assert.equal(json.nodes.length,S765.nodeCount);
 assert.equal(json.meshes.length,S765.meshCount);
 assert.equal(json.materials.length,S765.materialCount);
 assert.equal(json.accessors.length,S765.accessorCount);
 assert.equal(json.bufferViews.length,S765.bufferViewCount);
 const parent=json.scenes[S765.parentScene],target=json.scenes[S765.sceneIndex];
 assert.equal(parent.name,S765.parentSceneName);
 assert.equal(target.name,S765.sceneName);
 assert.equal(fnv(parent.nodes),S765.parentRootFnv32);
 assert.equal(fnv(target.nodes),S765.targetRootFnv32);
 assert.deepEqual(target.nodes,[...parent.nodes,S765.newPanelRoot]);
 assert.ok(target.nodes.includes(S765.wineRoot));
 assert.ok(target.nodes.includes(S765.hoodRoot));
 assert.deepEqual(json.nodes[S765.newPanelRoot].children,[S765.newPanelLeaf]);
 assert.equal(json.nodes[S765.newPanelLeaf].mesh,S765.reusedPanelMesh);
 const check=()=>validS765(json,sha,S765.sceneIndex,S765.role,'BOTH');
 assert.equal(check(),true);
 for(const [otherSha,otherScene,otherRole,otherFloor] of [
  [RK143.glbSha256,765,S765.role,'BOTH'],
  [RK142.glbSha256,765,S765.role,'BOTH'],
  [sha,764,S765.role,'BOTH'],
  [sha,765,RK143.role,'BOTH'],
  [sha,765,S765.role,'1F'],
 ])assert.equal(validS765(json,otherSha,otherScene,otherRole,otherFloor),false);
 const change=(o,key,value)=>{
  const old=o[key];o[key]=value;
  try{assert.equal(check(),false,'wrong '+String(key));}
  finally{o[key]=old;}
 };
 change(target,'name','FORGED_SCENE765');
 change(target.nodes,0,999999);
 change(parent.nodes,0,999999);
 change(target.extras,'stage','CURRENT');
 change(target.extras,'sourceRole','2026_INSTALLED');
 change(target.extras,'actualCableRouteVerified',true);
 change(target.extras,'electricalSafetyApproval',true);
 change(target.extras,'sourceLinksOutputSHA','BOUND');
 change(target.extras,'productionWebGL','PASS');
 change(json.nodes[S765.newPanelRoot],'children',[13500]);
 change(json.nodes[S765.newPanelRoot].extras,'cofitBaseGLBSHA256','0'.repeat(64));
 change(json.nodes[S765.newPanelRoot].extras,'sourceLinksBoundForNewSHA',true);
 change(json.nodes[S765.newPanelLeaf],'mesh',0);
 change(json.nodes[S765.newPanelLeaf].extras,'cofitSourceGLBSHA256','0'.repeat(64));
 change(json.nodes[S765.newPanelLeaf].extras,'current',true);
 change(json.asset.extras,'current',true);
 change(json.asset.extras,'asBuilt',true);
 const r=receiptS765(json,sha,S765.sceneIndex,S765.role,'BOTH');
 assert.equal(r.exactSource,true);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.humanReview,'NOT_RUN');
});

import {
 C80_R31_SCENE766_CLOSED_VM20_SOURCE as S766,
 isC80R31Scene766ClosedVm20Source as validS766,
 c80R31Scene766ClosedVm20Receipt as receiptS766,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 scene766 SHA-gated closed-hatch original is source-only',()=>{
 assert.equal(S766.sceneIndex,766);
 assert.equal(S766.parentScene,765);
 assert.equal(S766.parentRootFnv32,S765.targetRootFnv32);
 assert.equal(S766.rootFnv32,'aee109ba');
 assert.notEqual(S766.glbSha256,S765.glbSha256);
 assert.notEqual(S766.zipDriveId,S765.zipDriveId);
 assert.match(S766.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(S766.zipSha256,/^[a-f0-9]{64}$/);
 for(const [sha,i,role,floor] of [
  [S766.glbSha256,766,S766.role,'BOTH'],
  [S766.glbSha256,765,S766.role,'BOTH'],
  [S765.glbSha256,766,S766.role,'BOTH'],
  [S766.glbSha256,766,S765.role,'BOTH'],
  [S766.glbSha256,766,S766.role,'2F'],
  [S766.glbSha256,766,'__proto__','BOTH'],
 ])assert.equal(validS766({},sha,i,role,floor),false);
 const r=receiptS766({},S766.glbSha256,766,S766.role,'BOTH');
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.physicalHatchOpeningVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const scene766OriginalGlbPath=process.env.C80_R31_RK142_RK143_MJ83_VM20_CLOSED_SCENE766_GLB_PATH;
test('R31 scene766 ORIGINAL GLB exact SHA, roots, role, parent and fail-closed mutations',
 {skip:!scene766OriginalGlbPath},()=>{
 const {b,json}=parse(scene766OriginalGlbPath);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S766.glbBytes);
 assert.equal(sha,S766.glbSha256);
 assert.equal(json.scene,S766.defaultScene);
 assert.equal(json.scenes.length,S766.sceneCount);
 assert.equal(json.nodes.length,S766.nodeCount);
 assert.equal(json.meshes.length,S766.meshCount);
 assert.equal(json.materials.length,S766.materialCount);
 assert.equal(json.accessors.length,S766.accessorCount);
 assert.equal(json.bufferViews.length,S766.bufferViewCount);
 const parent=json.scenes[S766.parentScene],target=json.scenes[S766.sceneIndex];
 assert.equal(parent.name,S766.parentSceneName);
 assert.equal(target.name,S766.sceneName);
 assert.equal(fnv(parent.nodes),S766.parentRootFnv32);
 assert.equal(fnv(target.nodes),S766.rootFnv32);
 assert.equal(fnv(json.scenes[761].nodes),S766.closedSourceRootFnv32);
 assert.deepEqual(target.nodes,
  parent.nodes.map(id=>id===S766.openRoot?S766.closedRoot:id));
 const check=()=>validS766(json,sha,766,S766.role,'BOTH');
 assert.equal(check(),true);
 assert.equal(validS766(json,S765.glbSha256,766,S766.role,'BOTH'),false);
 assert.equal(validS766(json,sha,765,S766.role,'BOTH'),false);
 assert.equal(validS766(json,sha,766,S765.role,'BOTH'),false);
 assert.equal(validS766(json,sha,766,S766.role,'2F'),false);
 const change=(obj,key,value)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(check(),false,'tampered '+String(key));}
  finally{obj[key]=old;}
 };
 change(target,'name','FORGED');
 change(target.nodes,0,999999);
 change(parent.nodes,0,999999);
 change(json.scenes[761].nodes,0,999999);
 change(target.extras,'sourceGlbSha256','0'.repeat(64));
 change(target.extras,'vm20AccessView','OPEN');
 change(target.extras,'vm20ClosedNode',13496);
 change(target.extras,'sourceLinksForNewShaBound',true);
 change(target.extras,'productionWebGL','PASS');
 change(target.extras,'physical2026GroupConnectionVerified',true);
 change(json.nodes[S766.closedLeaf],'mesh',0);
 change(json.nodes[S766.openLeaf],'mesh',0);
 change(json.asset.extras,'current',true);
 change(json.asset.extras,'asBuilt',true);
 const r=receiptS766(json,sha,766,S766.role,'BOTH');
 assert.equal(r.exactSource,true);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.physicalHatchOpeningVerified,false);
 assert.equal(r.current,false);
});

import {
 C80_R31_SCENE767_2F_L12_RK14_MJ83_SOURCE as S767,
 isC80R31Scene767Source as validS767,
 c80R31Scene767SourceReceipt as receiptS767,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

test('R31 767 has a distinct source-only 2F view and rejects 766/BOTH confusion',()=>{
 assert.equal(S767.sceneIndex,767);
 assert.equal(S767.source2FScene,743);
 assert.equal(S767.source2FRootCount,199);
 assert.equal(S767.source2FRootFnv32,'e89d7b8b');
 assert.equal(S767.rootCount,202);
 assert.equal(S767.rootFnv32,'aeef8956');
 assert.notEqual(S767.glbSha256,S766.glbSha256);
 assert.notEqual(S767.zipDriveId,S766.zipDriveId);
 assert.match(S767.glbSha256,/^[a-f0-9]{64}$/);
 assert.match(S767.zipSha256,/^[a-f0-9]{64}$/);
 for(const [sha,i,role,floor] of [
  [S767.glbSha256,767,S767.role,'2F'],
  [S767.glbSha256,766,S767.role,'2F'],
  [S766.glbSha256,767,S767.role,'2F'],
  [S767.glbSha256,767,S766.role,'2F'],
  [S767.glbSha256,767,S767.role,'BOTH'],
  [S767.glbSha256,767,'__proto__','2F'],
 ])assert.equal(validS767({},sha,i,role,floor),false);
 const r=receiptS767({},S767.glbSha256,767,S767.role,'2F');
 assert.equal(r.exactSource,false);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.latest2FParityVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
const scene767OriginalGlbPath=process.env.C80_R31_2F_L12_RK14_MJ83_SCENE767_GLB_PATH;
test('R31 ORIGINAL scene767: SHA + 2F source743 rebase with L12 roots + negative mutations',
 {skip:!scene767OriginalGlbPath},()=>{
 const {b,json}=parse(scene767OriginalGlbPath);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S767.glbBytes);
 assert.equal(sha,S767.glbSha256);
 assert.equal(json.scene,S767.defaultScene);
 assert.equal(json.scenes.length,S767.sceneCount);
 assert.equal(json.nodes.length,S767.nodeCount);
 assert.equal(json.meshes.length,S767.meshCount);
 assert.equal(json.materials.length,S767.materialCount);
 assert.equal(json.accessors.length,S767.accessorCount);
 assert.equal(json.bufferViews.length,S767.bufferViewCount);
 const source=json.scenes[S767.source2FScene],target=json.scenes[767];
 assert.equal(source.name,S767.source2FSceneName);
 assert.equal(target.name,S767.sceneName);
 assert.equal(fnv(source.nodes),S767.source2FRootFnv32);
 assert.equal(fnv(target.nodes),S767.rootFnv32);
 assert.deepEqual(target.nodes,
  [...source.nodes.map(x=>x===S767.old2FRoot?S767.new2FRoot:x),...S767.preservedReviewRoots]);
 assert.equal(target.nodes.length,202);
 assert.ok(!target.nodes.includes(S767.old2FRoot));
 assert.ok(target.nodes.includes(S767.new2FRoot));
 for(const x of S767.preservedReviewRoots)assert.ok(target.nodes.includes(x));
 const check=()=>validS767(json,sha,767,S767.role,'2F');
 assert.equal(check(),true);
 for(const [wrongSha,wrongScene,wrongRole,wrongFloor] of [
  [S766.glbSha256,767,S767.role,'2F'],
  [sha,766,S767.role,'2F'],
  [sha,767,S766.role,'2F'],
  [sha,767,S767.role,'BOTH'],
 ])assert.equal(validS767(json,wrongSha,wrongScene,wrongRole,wrongFloor),false);
 const mutate=(obj,key,value)=>{
  const old=obj[key];obj[key]=value;
  try{assert.equal(check(),false,'tampered '+String(key));}
  finally{obj[key]=old;}
 };
 mutate(target,'name','FORGED');
 mutate(target.nodes,0,999999);
 mutate(source.nodes,0,999999);
 mutate(target.extras,'baseOriginalGlbSHA256','0'.repeat(64));
 mutate(target.extras,'reviewSource2FSceneIndex',766);
 mutate(target.extras,'donorOriginalGlbSHA256','0'.repeat(64));
 mutate(target.extras,'fullLatestR3002FParity',true);
 mutate(target.extras,'sourceLinksOutputSHABound',true);
 mutate(target.extras,'physicalDrainJoint',true);
 mutate(target.extras,'published',true);
 mutate(json.nodes[S767.new2FRoot].extras,'original2FRoot',12345);
 mutate(json.nodes[S767.new2FRoot],'children',[S767.wasteLeaves[0]]);
 mutate(json.nodes[S767.wasteLeaves[0]],'mesh',0);
 mutate(json.nodes[S767.wasteLeaves[1]].extras,'m5System','VESI');
 mutate(json.asset.extras,'current',true);
 mutate(json.asset.extras,'asBuilt',true);
 const receipt=receiptS767(json,sha,767,S767.role,'2F');
 assert.equal(receipt.exactSource,true);
 assert.equal(receipt.publishAllowed,false);
 assert.equal(receipt.latest2FParityVerified,false);
 assert.equal(receipt.electricalSafetyVerified,false);
});

import {
 C80_R31_SCENE768_2F_RK141_COFIT_SOURCE as S768,
 C80_R31_SCENE767_2F_L12_RK14_MJ83_SOURCE as S767_768,
 isC80R31Scene768Source as validS768,
 c80R31Scene768SourceReceipt as receiptS768,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';

const scene768OriginalGlbPath=process.env.C80_R31_2F_RK141_COFIT_SCENE768_GLB_PATH;
const source768ParentRoots=[7356,2658,6431,12440,13164,7361,7366,7367,5323,7368,5327,5629,13165,7369,5835,5836,9263,7370,6435,7371,8003,6472,6473,6474,6475,6476,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,12437,10795,9573,9574,9575,9576,7904,7905,7906,7907,7908,7909,7932,12136,7979,8024,8025,8026,9264,8199,8895,12106,9197,9198,9199,9200,9257,9332,9911,9912,9761,9338,9763,9764,9762,13141,10976,13505,10555,10556,10557,10558,10559,10560,10561,10562,10656,10657,10659,10763,12633,10771,10772,10773,10774,10775,10776,10777,10778,10779,10780,10781,10782,10783,10784,10785,10786,10787,12635,12636,12637,12638,12639,12144,12634,11304,11319,11339,11340,11341,11342,11343,11344,11345,11346,11347,11348,13227,13228,13229,13230,13231,12264,12265,12266,12267,12268,12269,12270,12271,11535,11536,11624,11625,11645,11648,13319,11662,11677,12157,11713,11727,11721,11722,11723,13242,13243,13244,13245,13246,12358,11858,11891,11907,11574,12622,12051,12137,12165,12166,12167,12168,12242,12244,12246,12248,12315,12312,12316,12431,12432,12433,12434,12435,12643,12623,12624,12625,12626,12466,12503,12504,12497,12505,13247,12695,13176,13252,13253,13309,13325,13499,13500,13502];
test('R31 scene768 synthetic positive receipt and fail-closed source/host/circuit mutations',()=>{
 assert.equal(source768ParentRoots.length,202);
 assert.equal(fnv(source768ParentRoots),S768.baseRootFnv32);
 assert.equal(fnv([...source768ParentRoots,S768.newRoot]),S768.rootFnv32);
 assert.equal(S768.baseGlbSha256,S767_768.glbSha256);
 assert.equal(S768.newRoot,13506);
 assert.notEqual(S768.glbSha256,S767_768.glbSha256);
 const n13506={
  name:S768.newNodeName,mesh:S768.newMesh,
  extras:{
   m5System:'SAHKO',ylisTechRole:'HISTORICAL_SCHEMATIC_REVIEW_GUIDE',
   stage:'WORK_TEST_HOST_HOLD',circuitId:'RK14.1',historicalCircuit:true,
   evidenceLevel:'HISTORICAL_2015_PLUS_2026_WORK_ASSUMPTION',
   physicalRouteVerified:false,physicalWiring2026Verified:false,
   switchControlsVerified:false,newPhysicalCableClaim:false,
   electricalSafetyApproval:false,confidence:'LOW_PHYSICAL_ROUTE',
   sourcePanelCircuitNode:13012,sourcePanelMesh:3754,
   sourceSwitchNotBound:13246,sourceLinksOutputSHA:'NOT_BOUND',
   sourceOriginalDriveId:S768.rk141DonorDriveId,
   sourceOriginalGLBSha256:S768.rk141DonorGlbSha256,
   donorNode:13483,donorMesh:5162,outputScene:768,
   current:false,asBuilt:false,humanReview:'NOT_RUN',productionWebGL:'NOT_RUN',
  },
 };
 const e={
  stage:'WORK_TEST_HOST_HOLD',WORK_TEST:true,HOST_HOLD:true,
  sourceBaseScene:767,sourceBaseDriveId:S768.baseZipDriveId,
  sourceBaseGlbSha256:S768.baseGlbSha256,
  rk141DonorDriveId:S768.rk141DonorDriveId,
  rk141DonorGLBSHA256:S768.rk141DonorGlbSha256,
  circuits2015:['RK14.1','RK14.2','RK14.3'],
  rebaseMap:{node13483:13506,mesh5162:5168,material812:814,
   'accessors11247-11248':'11265-11266'},
  physicalWiringVerified:false,latest2F_R300RoofHostParity:false,
  sourceLinksOutputSHA:'NOT_BOUND',sourceLinksOutputSHABound:false,
  published:false,productionWebGL:'NOT_RUN',HUMAN_REVIEW:'NOT_RUN',
  current:false,asBuilt:false,canonical:false,fullLatestR3002FParity:false,
  physicalRouteVerified:false,
 };
 const json={
  scene:292,asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,
   HUMAN_REVIEW:'NOT_RUN'}},
  scenes:Array(769),nodes:Array(13507),meshes:Array(5169),
  materials:Array(815),accessors:Array(11267),bufferViews:Array(11273),
 };
 json.scenes[767]={name:S767_768.sceneName,nodes:[...source768ParentRoots]};
 json.scenes[768]={name:S768.sceneName,nodes:[...source768ParentRoots,13506],extras:e};
 json.nodes[13505]={children:[13503,13504]};
 json.nodes[13503]={mesh:4991,extras:{m5System:'VIEMARI'}};
 json.nodes[13504]={mesh:3702,extras:{m5System:'VIEMARI'}};
 json.nodes[13506]=n13506;
 const check=()=>validS768(json,S768.glbSha256,768,S768.role,'2F');
 assert.equal(check(),true);
 for(const [sha,index,role,floor] of [
  [S767_768.glbSha256,768,S768.role,'2F'],
  [S768.glbSha256,767,S768.role,'2F'],
  [S768.glbSha256,768,S767_768.role,'2F'],
  [S768.glbSha256,768,S768.role,'BOTH'],
  [S768.glbSha256,768,'__proto__','2F'],
 ])assert.equal(validS768(json,sha,index,role,floor),false);
 const mutate=(o,key,value)=>{const before=o[key];o[key]=value;
  try{assert.equal(check(),false,'must reject mutation: '+key);}
  finally{o[key]=before;}};
 mutate(json.scenes[768],'name','FORGED');
 mutate(json.scenes[768].nodes,0,999999);
 mutate(json.scenes[767].nodes,0,999999);
 mutate(e,'sourceBaseGlbSha256','0'.repeat(64));
 mutate(e,'rk141DonorGLBSHA256','0'.repeat(64));
 mutate(e,'latest2F_R300RoofHostParity',true);
 mutate(e,'physicalWiringVerified',true);
 mutate(e,'sourceLinksOutputSHABound',true);
 mutate(e,'published',true);
 mutate(e.rebaseMap,'mesh5162',0);
 mutate(n13506,'mesh',0);
 mutate(n13506.extras,'physicalWiring2026Verified',true);
 mutate(n13506.extras,'newPhysicalCableClaim',true);
 mutate(n13506.extras,'electricalSafetyApproval',true);
 mutate(n13506.extras,'circuitId','RK14.2');
 mutate(json.nodes[13503].extras,'m5System','VESI');
 mutate(json.asset.extras,'current',true);
 const r=receiptS768(json,S768.glbSha256,768,S768.role,'2F');
 assert.equal(r.exactSource,true);
 assert.equal(r.publishAllowed,false);
 assert.equal(r.sourceLinksBound,false);
 assert.equal(r.latest2FParityVerified,false);
 assert.equal(r.physicalCableRouteVerified,false);
 assert.equal(r.productionWebGLVerified,false);
 assert.equal(r.current,false);
 assert.equal(r.asBuilt,false);
});
test('R31 original scene768 optional complete-GLB SHA and gated parent/new RK14.1', 
 {skip:!scene768OriginalGlbPath},()=>{
 const {b,json}=parse(scene768OriginalGlbPath);
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,S768.glbBytes);
 assert.equal(sha,S768.glbSha256);
 const check=()=>validS768(json,sha,768,S768.role,'2F');
 assert.equal(check(),true);
 assert.equal(fnv(json.scenes[767].nodes),S768.baseRootFnv32);
 assert.equal(fnv(json.scenes[768].nodes),S768.rootFnv32);
 assert.deepEqual(json.scenes[768].nodes,[...json.scenes[767].nodes,13506]);
 const mutate=(o,key,value)=>{const before=o[key];o[key]=value;
  try{assert.equal(check(),false,'original mutation '+key);}
  finally{o[key]=before;}};
 mutate(json.scenes[768].extras,'physicalWiringVerified',true);
 mutate(json.scenes[768].extras,'latest2F_R300RoofHostParity',true);
 mutate(json.nodes[13506].extras,'sourceLinksOutputSHA','BOUND');
 mutate(json.nodes[13506],'mesh',0);
 mutate(json.asset.extras,'asBuilt',true);
});


import {
 C80_R31_SCENE771772_2F_R300_SOURCE as S771772,
 isC80R31Scene771772Source as validate771772,
 c80R31Scene771772SourceReceipt as receipt771772,
 C80_R31_SCENE768_2F_RK141_COFIT_SOURCE as S768_771772,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';
const original771772Path=process.env.C80_R31_2F_R300_SCENE771772_GLB_PATH;
const root768_771772=[7356,2658,6431,12440,13164,7361,7366,7367,5323,7368,5327,5629,13165,7369,5835,5836,9263,7370,6435,7371,8003,6472,6473,6474,6475,6476,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,12437,10795,9573,9574,9575,9576,7904,7905,7906,7907,7908,7909,7932,12136,7979,8024,8025,8026,9264,8199,8895,12106,9197,9198,9199,9200,9257,9332,9911,9912,9761,9338,9763,9764,9762,13141,10976,13505,10555,10556,10557,10558,10559,10560,10561,10562,10656,10657,10659,10763,12633,10771,10772,10773,10774,10775,10776,10777,10778,10779,10780,10781,10782,10783,10784,10785,10786,10787,12635,12636,12637,12638,12639,12144,12634,11304,11319,11339,11340,11341,11342,11343,11344,11345,11346,11347,11348,13227,13228,13229,13230,13231,12264,12265,12266,12267,12268,12269,12270,12271,11535,11536,11624,11625,11645,11648,13319,11662,11677,12157,11713,11727,11721,11722,11723,13242,13243,13244,13245,13246,12358,11858,11891,11907,11574,12622,12051,12137,12165,12166,12167,12168,12242,12244,12246,12248,12315,12312,12316,12431,12432,12433,12434,12435,12643,12623,12624,12625,12626,12466,12503,12504,12497,12505,13247,12695,13176,13252,13253,13309,13325,13499,13500,13502,13506];
const makeSynthetic771772=()=>{
 const s=S771772,base=[...root768_771772];
 const normal=base.map(n=>n===s.oldR200?s.r300:n===s.oldP02?s.newP02:n);
 normal.splice(normal.indexOf(s.r300)+1,0,s.copper);
 const service=normal.filter(n=>n!==s.plexi);
 const json={scene:s.defaultScene,scenes:Array(s.sceneCount),nodes:Array(s.nodeCount),
  meshes:Array(s.meshCount),materials:Array(s.materialCount),
  accessors:Array(s.accessorCount),bufferViews:Array(s.bufferViewCount),
  asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}}};
 json.scenes[768]={name:S768_771772.sceneName,nodes:base};
 const donor769_771772=[6430,12415,9280,8746,12545,8748,12546,8750,12547,8752,12548,13466,13166,5224,6457,13184,7647,7648,12411,9281,5285,6955,6956,6957,6958,6959,6960,6631,6632,7651,7652,7653,7654,12145,12421,7655,8756,8672,6524,7656,7657,7658,8673,6620,7660,12439,6652,6727,6728,6847,6848,9201,9202,9203,9204,9205,9206,9207,9208,12422,12423,12424,12425,12426,12427,12428,12429,6850,13495,12498,7594,8758,7597,9282,12410,12412,12413,12414,8007,9261,12404,8760,8674,8675,8681,8684,8687,9262,8846,8690,9283,12408,8857,9286,13258,9003,9006,12254,9194,12409,9287,12403,9272,10660,9277,12438,12416,9385,9387,12417,9394,9395,9396,13137,3698,10563,10564,10565,10566,10567,10568,10569,10570,10571,10572,10573,10574,10575,10576,10577,10578,10579,10580,10581,10582,10583,10584,10585,10586,10587,10588,10589,10590,10591,10592,10593,10594,10595,10596,10597,10598,10599,10600,10601,10602,10603,10604,10605,10606,10607,10608,10609,10610,10611,10612,10613,10614,10615,10616,10617,10618,10619,10620,10621,10622,10623,10624,10625,10626,10627,10628,10629,10630,10631,10632,10633,10634,10635,10636,10637,10638,10639,10640,10641,10642,10643,10644,10645,10646,10647,10648,10649,10650,10651,10652,10653,10654,7227,8843,11362,11307,11308,12402,11310,11311,12521,11675,12098,11546,11560,12629,11589,11591,11604,13236,11612,12114,12115,12238,7356,2658,6431,12440,13164,7361,7366,7367,5323,7368,5327,5629,13165,7369,5835,5836,9263,7370,6435,7371,8003,6472,6473,6474,6475,6476,6517,6518,6519,6831,6832,6564,6565,6994,7372,6653,6729,6730,12437,10795,9573,9574,9575,9576,7904,7905,7906,7907,7908,7909,7932,12136,7979,8024,8025,8026,9264,8199,8895,12106,9197,9198,9199,9200,9257,9332,9911,9912,9761,9338,9763,9764,9762,13141,13469,13358,10555,10556,10557,10558,10559,10560,10561,10562,10656,10657,10659,10763,12633,10771,10772,10773,10774,10775,10776,10777,10778,10779,10780,10781,10782,10783,10784,10785,10786,10787,12635,12636,12637,12638,12639,12144,12634,11304,11319,11339,11340,11341,11342,11343,11344,11345,11346,11347,11348,13227,13228,13229,13230,13231,12264,12265,12266,12267,12268,12269,12270,12271,11535,11536,11624,11625,11645,11648,13319,11662,11677,12157,13491,11721,11722,11723,11730,12510,13237,13238,12134,11775,13239,11819,11824,13242,13243,13244,13245,13246,12358,11858,11891,11900,11901,11902,11903,11904,13179,13180,11907,12529,12522,12523,12524,12525,12526,11574,11945,11996,12622,12051,12137,12020,12024,13250,13181,12086,12087,12088,12089,12090,12091,12486,12419,12418,12165,12166,12167,12168,12261,12237,12239,12243,12245,12247,12244,12246,12248,12315,12312,12316,12430,12441,12431,12432,12433,12434,12435,13167,12643,12477,12476,12623,12624,12625,12626,13488,13331,12554,12487,13185,12489,12503,12504,12497,12511,12505,12558,13485,12568,12632,13247,12695,13188,13252,13253,13263,13307,13309,13324,13325,13363,13369,13414,13472,13476,13482,13486,13494,13499,13500,13502,13506];
 json.scenes[769]={name:'BOTH source normal',nodes:donor769_771772};
 json.scenes[770]={name:'BOTH source service',nodes:donor769_771772.filter(n=>n!==11625)};
 const e={
  stage:'WORK_TEST_HOST_HOLD',sourceDriveId:s.parentDriveId,
  sourceGLBSHA256:s.parentGlbSha256,source2FSceneIndex:768,
  donorBOTHNormalSceneIndex:769,donorBOTHServiceSceneIndex:770,
  sourceRootMapping:{12466:13488,11713:13491},newCopperRoot:13494,
  plexyRoot:11625,r300SKU:'NOT_VERIFIED',
  copper:'2026_PHOTO_BASED_WORK_ASSUMPTION',
  rk141to3:'HISTORICAL_SCHEMATIC_2015',L12:'VIEMARI_SOURCE_REVIEW',
  sourceLinksForOutputSHA:'NOT_BOUND',productionWebGL:'NOT_RUN',
  humanReview:'NOT_RUN',current:false,asBuilt:false
 };
 json.scenes[771]={name:s.normal.name,nodes:normal,extras:{...e,plexyState:'PLEX_ON'}};
 json.scenes[772]={name:s.service.name,nodes:service,extras:{...e,plexyState:'PLEX_OFF'}};
 json.nodes[13488]={children:[13487,13429,13430]};
 json.nodes[13487]={children:[13415,13416,13417,13418,13419,13420,13421,13422,13423,13424]};
 json.nodes[13491]={children:[13489,13490]};
 json.nodes[13494]={children:[13492,13493]};
 json.nodes[13492]={mesh:5163};json.nodes[13493]={mesh:5164};
 json.nodes[11625]={mesh:4419};
 json.nodes[13506]={mesh:5168,extras:{historicalCircuit:true,physicalWiring2026Verified:false,sourceLinksOutputSHA:'NOT_BOUND'}};
 json.nodes[13505]={children:[13503,13504]};
 json.nodes[13503]={mesh:4991,extras:{m5System:'VIEMARI'}};
 json.nodes[13504]={mesh:3702,extras:{m5System:'VIEMARI'}};
 return json;
};
test('R31 771/772 source identity and fail-closed synthetic negative boundaries',()=>{
 const s=S771772;
 assert.equal(s.normal.index,771);assert.equal(s.service.index,772);
 assert.equal(s.normal.rootCount,204);assert.equal(s.service.rootCount,203);
 assert.equal(fnv(root768_771772),s.base2FRootFnv32);
 assert.equal(s.parentDriveId,'1N34goHGseX62ZubtLJZVRz4CvUqiFo6_');
 assert.equal(s.glbSha256.length,64);assert.notEqual(s.glbSha256,S768_771772.glbSha256);
 const j=makeSynthetic771772();
 assert.equal(validate771772(j,s.glbSha256,771,s.normal.role,'2F'),true);
 assert.equal(validate771772(j,s.glbSha256,772,s.service.role,'2F'),true);
 for(const [sha,i,role,floor] of [
  [s.glbSha256,770,s.normal.role,'2F'],
  [s.glbSha256,771,s.service.role,'2F'],
  [s.glbSha256,772,s.normal.role,'2F'],
  [s.glbSha256,771,s.normal.role,'BOTH'],
  [S768_771772.glbSha256,771,s.normal.role,'2F'],
  [s.glbSha256,772,'__proto__','2F'],
 ])assert.equal(validate771772(j,sha,i,role,floor),false);
 for(const [i,role] of [[771,s.normal.role],[772,s.service.role]]){
  const out=receipt771772(j,s.glbSha256,i,role,'2F');
  assert.equal(out.exactSource,true);
  assert.equal(out.sourceLinksBound,false);assert.equal(out.publishAllowed,false);
  assert.equal(out.productionWebGLVerified,false);
  assert.equal(out.physicalMaintenanceClearanceVerified,false);
  assert.equal(out.current,false);
 }
 const mutation=(o,key,value)=>{const oldValue=o[key];o[key]=value;
  try{assert.equal(validate771772(j,s.glbSha256,771,s.normal.role,'2F'),false,'reject '+String(key));}
  finally{o[key]=oldValue;}};
 mutation(j.scenes[771].extras,'sourceLinksForOutputSHA','BOUND');
 mutation(j.scenes[771].extras,'r300SKU','verified');
 mutation(j.nodes[13506].extras,'physicalWiring2026Verified',true);
 mutation(j.nodes[13494],'children',[13492]);
});
test('R31 original private scene771/772 normal/service, SHA, root and mutation gates',
 {skip:!original771772Path},()=>{
 const {b,json}=parse(original771772Path),s=S771772;
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,s.glbBytes);assert.equal(sha,s.glbSha256);
 const normal=json.scenes[771],service=json.scenes[772],base=json.scenes[768];
 assert.deepEqual(base.nodes,root768_771772);
 assert.equal(fnv(normal.nodes),s.normal.rootFnv32);
 assert.equal(fnv(service.nodes),s.service.rootFnv32);
 assert.deepEqual(service.nodes,normal.nodes.filter(x=>x!==s.plexi));
 for(const [i,view] of [[771,s.normal],[772,s.service]]){
  const good=()=>validate771772(json,sha,i,view.role,'2F');
  assert.equal(good(),true,'original GLB must be accepted: '+i);
  assert.equal(receipt771772(json,sha,i,view.role,'2F').publishAllowed,false);
  for(const [wrongSHA,wrongIndex,wrongRole,wrongFloor] of [
   [S768_771772.glbSha256,i,view.role,'2F'],[sha,i===771?772:771,view.role,'2F'],
   [sha,i,s.normal.role===view.role?s.service.role:s.normal.role,'2F'],
   [sha,i,view.role,'BOTH']
  ])assert.equal(validate771772(json,wrongSHA,wrongIndex,wrongRole,wrongFloor),false);
  const change=(obj,key,value)=>{const prior=obj[key];obj[key]=value;
   try{assert.equal(good(),false,'tampered '+i+' '+String(key));}
   finally{obj[key]=prior;}};
  change(json.scenes[i].extras,'sourceGLBSHA256','0'.repeat(64));
  change(json.scenes[i].extras,'sourceLinksForOutputSHA','BOUND');
  change(json.scenes[i].extras,'copper','VERIFIED');
  change(json.scenes[i].extras,'plexyState','UNKNOWN');
  change(json.scenes[i],'name','FORGED');
  change(json.scenes[i].nodes,0,99999);
  change(json.nodes[13494],'children',[13492]);
  change(json.nodes[13506].extras,'physicalWiring2026Verified',true);
  change(json.nodes[13503].extras,'m5System','VESI');
  change(json.asset.extras,'asBuilt',true);
 }
});


import {
 C80_R31_SCENE773774_SW04_SOURCE as SW04,
 isC80R31Scene773774SW04Source as validSW04,
 c80R31Scene773774SW04SourceReceipt as receiptSW04,
} from '../../src/scripts/privateModelC80R31Scene752SourceReceipt.mjs';
const sw04OriginalPath=process.env.C80_R31_2F_SW04_SCENE773774_GLB_PATH;
const makeSyntheticSW04=()=>{
 const j=makeSynthetic771772(),s=SW04;
 j.scenes.length=s.sceneCount;j.nodes.length=s.nodeCount;
 j.meshes.length=s.meshCount;j.accessors.length=s.accessorCount;
 j.bufferViews.length=s.bufferViewCount;
 j.nodes[13245]={children:[13219,13220]};
 j.nodes[13507]={
  name:'K3_D2F_SW04_WHITE_EXXACT_STYLE_REFERENCE_87x87MM_WORK_TEST_HOST_HOLD',
  children:[13508,13509],extras:{
   stableID:'D2F-SW-04',sourceOriginalG2bDriveID:s.parentZipDriveId,
   sourceOriginalGlbSHA256:s.parentGlbSha256,sourcePreviousRootNode:13245,
   sourcePreviousLeaves:[13219,13220],sourceHostNodeID:10794,sourceHostMeshID:4188,
   proxyFrameOuterM:0.087,proxyFrameThicknessM:0.0116,
   geometrySource:'PROCEDURAL_VISUAL_PROXY_NOT_MANUFACTURER_CAD',
   installedSwitchSkuVerified:false,measuredPhysicalWallHostVerified:false,
   physicalInstalledPositionVerified:false,electricalCircuitVerified:false,
   workTest:true,hostHold:true,current:false,asBuilt:false,
   sourceLinksBoundToOutputSha:false,productionWebGLVerified:false,humanReview:false,
  }};
 j.nodes[13508]={mesh:5169};j.nodes[13509]={mesh:5170};
 for(const [v,p] of [[s.normal,SW04.normal],[s.service,SW04.service]]){
  const base=j.scenes[v.parentIndex];
  j.scenes[v.index]={
   name:v.name,nodes:base.nodes.map(n=>n===13245?13507:n),
   extras:{...base.extras,sourceGlbSHA256:s.parentGlbSha256,
    sourceSceneName:base.name,sourceLinksNewShaBound:false,
    newRoot:13507,sourceRootReplaced:13245,productSkuInstalledVerified:false}};
 }
 return j;
};
test('R31 2F SW04 SHA/role/scene/root and metadata gate synthetic positive+negative',()=>{
 const j=makeSyntheticSW04(),s=SW04;
 assert.equal(j.scenes.length,775);assert.equal(s.glbSha256.length,64);
 for(const v of [s.normal,s.service]){
  const good=()=>validSW04(j,s.glbSha256,v.index,v.role,'2F');
  assert.equal(fnv(j.scenes[v.index].nodes),v.rootFnv32);
  assert.equal(good(),true);
  assert.equal(receiptSW04(j,s.glbSha256,v.index,v.role,'2F').publishAllowed,false);
  for(const [sha,i,role,floor] of [
   [s.parentGlbSha256,v.index,v.role,'2F'],
   [s.glbSha256,v.parentIndex,v.role,'2F'],
   [s.glbSha256,v.index,v===s.normal?s.service.role:s.normal.role,'2F'],
   [s.glbSha256,v.index,v.role,'BOTH'],
   [s.glbSha256,v.index,'__proto__','2F']
  ])assert.equal(validSW04(j,sha,i,role,floor),false);
  const mutate=(obj,key,value)=>{const old=obj[key];obj[key]=value;
   try{assert.equal(good(),false,'reject '+String(key));}finally{obj[key]=old;}};
  mutate(j.scenes[v.index].nodes,0,999999);
  mutate(j.scenes[v.index].extras,'sourceGlbSHA256','0'.repeat(64));
  mutate(j.scenes[v.index].extras,'sourceLinksNewShaBound',true);
  mutate(j.scenes[v.index].extras,'productSkuInstalledVerified',true);
  mutate(j.nodes[13507].extras,'installedSwitchSkuVerified',true);
  mutate(j.nodes[13507].extras,'electricalCircuitVerified',true);
  mutate(j.nodes[13507],'children',[13508]);
  mutate(j.nodes[13509],'mesh',0);
  mutate(j.asset.extras,'asBuilt',true);
 }
 assert.equal(validSW04({},s.glbSha256,773,s.normal.role,'2F'),false);
});
test('R31 SW04 original GLB SHA, source parent and plexi source mutation gates',
 {skip:!sw04OriginalPath},()=>{
 const {b,json}=parse(sw04OriginalPath),s=SW04;
 const sha=createHash('sha256').update(b).digest('hex');
 assert.equal(b.length,s.glbBytes);assert.equal(sha,s.glbSha256);
 for(const v of [s.normal,s.service]){
  const good=()=>validSW04(json,sha,v.index,v.role,'2F');
  assert.equal(fnv(json.scenes[v.index].nodes),v.rootFnv32);
  assert.equal(good(),true);
  assert.deepEqual(json.scenes[v.index].nodes,
   json.scenes[v.parentIndex].nodes.map(n=>n===s.oldSwitchRoot?s.newSwitchRoot:n));
  const mutate=(o,k,value)=>{const old=o[k];o[k]=value;
   try{assert.equal(good(),false,'original tamper '+k);}finally{o[k]=old;}};
  mutate(json.scenes[v.index].extras,'sourceGlbSHA256','0'.repeat(64));
  mutate(json.scenes[v.index].extras,'sourceLinksForOutputSHA','BOUND');
  mutate(json.nodes[s.newSwitchRoot].extras,'physicalInstalledPositionVerified',true);
  mutate(json.nodes[s.newSwitchRoot].extras,'sourceHostMeshID',0);
  mutate(json.nodes[s.children[0]],'mesh',0);
  mutate(json.asset.extras,'current',true);
 }
});
