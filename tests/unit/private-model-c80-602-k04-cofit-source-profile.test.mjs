import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80602_GLB_SHA256 as SHA,C80602_GLB_BYTES as BYTES,
 C80602_ZIP_DRIVE_ID as ZIP,
 C80602_SOURCE_ONLY,C80602_SOURCE_LINKS_BOUND,C80602_PUBLISH_ALLOWED,
 C80602_SCENES as SPECS,
 c80602RootFnv32 as fnv,
 c80602K04RootReplacement as roots,
 c80602K04SourceNodesExact as nodesExact,
 isC80602K04SourceScene as exact,
 c80602K04SourceReceipt as receipt,
} from '../../src/scripts/privateModelC80602K04CofitSourceProfile.mjs';

const old=[11830,11833,11836,11839],news=[12340,12343,12346,12337];
test('C80 602 source contract: 6 floor roles and no stage elevation',()=>{
 assert.equal(SHA.length,64);
 assert.equal(BYTES,56765356);
 assert.equal(ZIP,'1FH4aHwm24niQbVMMK5keZotms1lUYUM7');
 assert.equal(C80602_SOURCE_ONLY,true);
 assert.equal(C80602_SOURCE_LINKS_BOUND,false);
 assert.equal(C80602_PUBLISH_ALLOWED,false);
 assert.deepEqual(Object.keys(SPECS).map(Number),[596,597,598,599,600,601]);
 assert.deepEqual(Object.values(SPECS).map(s=>s.floor),['1F','2F','BOTH','BOTH','BOTH','BOTH']);
 assert.deepEqual(Object.values(SPECS).map(s=>s.rootCount),[293,191,477,477,477,477]);
});
test('K04 all four roots switch atomically, preserving every non-K04 root',()=>{
 const parent=[9007,...old,171,223],next=[9007,...news,171,223];
 assert.ok(roots(parent,next,true));
 assert.ok(roots([9007,171,223],[9007,171,223],false));
 assert.equal(roots(parent,parent,true),false);
 assert.equal(roots(parent,next,false),false);
 assert.equal(roots(parent,[9007,...news,171,224],true),false);
 assert.equal(roots(parent,[9007,12340,12343,12346,11839,171,223],true),false);
 assert.equal(roots([...parent,11830],[...next,12340],true),false);
 assert.equal(fnv([1,2,3]),'56cf37ab');
 assert.equal(fnv([1,2,'3']),null);
 assert.equal(fnv(null),null);
});
function fixtureNodes(){
 const nodes=new Array(12347);
 const pairs=[
  [12340,[12338,12339],12260],
  [12343,[12341,12342],12263],
  [12346,[12344,12345],12266],
  [12337,[12335,12336],12257],
 ];
 for(const [id,children,donor] of pairs){
  const base={
   C80602CofitParentGLBSHA256:'10515e412ea523dbe10ea6b551235e8aedb3eedb0ac2247e9f90923b35cb34c3',
   C80602K04DonorGLBSHA256:'5a4c217cd486f6dd884bba4cd5d8cbb086a0a5841521b586d79be33d96a1fbdd',
   C80602SourceExactMeshUnchanged:true,C80602WorkAssumptionNotAsBuilt:true,
   sourceLinksBoundNewGLBSHA:false,current:false,asBuilt:false,
  };
  nodes[id]={name:'K04_TEST_ROOT',children,extras:{
   ...base,C80602DonorOriginalNodeId:donor,physicalPositionVerified:false,
   productSkuVerified:false,productionWebGL:'NOT_VERIFIED'
  }};
  children.forEach((child,j)=>{
   nodes[child]={name:'K04_TEST_CHILD',mesh:j?4496:4495,extras:{...base}};
  });
 }
 return {nodes};
}
test('K04 node/mesh/source provenance fail-closed on host and approval changes',()=>{
 const json=fixtureNodes();
 assert.equal(nodesExact(json),true);
 const n=json.nodes[12343],old=n.extras.physicalPositionVerified;
 n.extras.physicalPositionVerified=true;
 assert.equal(nodesExact(json),false);
 n.extras.physicalPositionVerified=old;
 json.nodes[12339].mesh=1;
 assert.equal(nodesExact(json),false);
 json.nodes[12339].mesh=4496;
 json.nodes[12340].children.reverse();
 assert.equal(nodesExact(json),false);
 json.nodes[12340].children.reverse();
 json.nodes[12340].extras.sourceLinksBoundNewGLBSHA=true;
 assert.equal(nodesExact(json),false);
 json.nodes[12340].extras.sourceLinksBoundNewGLBSHA=false;
 assert.equal(nodesExact(json),true);
});
test('wrong GLB source, scene, metadata and CURRENT cannot grant source receipt',()=>{
 assert.equal(exact(null,SHA,596),false);
 assert.equal(exact({},'wrong',596),false);
 assert.equal(exact({},SHA,590),false);
 assert.equal(exact({},SHA,602),false);
 assert.equal(exact({},SHA,596,'2F'),false);
 const r=receipt(null,SHA,596);
 assert.deepEqual(r,{exactSource:false,sourceLinksBound:false,
  current:false,asBuilt:false,physicalHostVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',publishAllowed:false});
 assert.equal(Object.isFrozen(r),true);
});
const path=process.env.C80_602_K04_GLB_PATH;
test('original full GLB: 6 exact root/DFS scenes, K04 all active, statuses HOLD',
 {skip:!path},()=>{
 const bin=readFileSync(path);
 assert.equal(bin.length,BYTES);
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 assert.equal(bin.toString('utf8',0,4),'glTF');
 const len=bin.readUInt32LE(12);
 const json=JSON.parse(bin.subarray(20,20+len).toString('utf8'));
 for(const [scene,spec] of Object.entries(SPECS)){
  assert.ok(exact(json,SHA,+scene,spec.floor),`scene ${scene}`);
  assert.equal(receipt(json,SHA,+scene).exactSource,true);
 }
 assert.equal(exact(json,SHA,596,'BOTH'),false);
 assert.equal(exact(json,'different sha',598),false);
 const k=json.scenes[598];
 const old=k.extras.physicalK04InstallationVerified;
 k.extras.physicalK04InstallationVerified=true;
 assert.equal(exact(json,SHA,598),false);
 k.extras.physicalK04InstallationVerified=old;
 const root=k.nodes.indexOf(12340);
 assert.ok(root>=0);
 k.nodes[root]=11830;
 assert.equal(exact(json,SHA,598),false);
 k.nodes[root]=12340;
 assert.equal(exact(json,SHA,598),true);
});
