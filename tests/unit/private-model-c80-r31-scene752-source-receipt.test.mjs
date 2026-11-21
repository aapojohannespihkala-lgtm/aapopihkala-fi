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
