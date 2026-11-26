import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {R34_KATTO5_P186_WPT2_SOURCE as SOURCE,
 r34Katto5P186Wpt2CombinedGate as gate,
 resolveR34Katto5P186Wpt2CombinedScene as resolve
} from '../../src/scripts/privateModelR34Katto5P186Wpt2CombinedSourceGate.mjs';

test('source receiver is opt-in, never registers or accepts a synthetic source',()=>{
 const fake={scenes:[],nodes:[],meshes:[],scene:292};
 assert.equal(gate(fake,SOURCE.glbSha256),null);
 assert.equal(gate({},SOURCE.glbSha256),null);
 assert.equal(resolve(fake,SOURCE.glbSha256,'BOTH'),null);
 for(const bad of ['2F','1F','BOTH_HIST',null])
  assert.equal(resolve(fake,SOURCE.glbSha256,bad),null);
 assert.equal(resolve(fake,SOURCE.glbSha256,'BOTH','true'),null);
 assert.equal(resolve(fake,'0'.repeat(64),'BOTH',true),null);
});

const path=process.env.R34_KATTO5_P186_WPT2_GLB_PATH;
test('original 67MB GLB: exact source/scene/2015 isolation and negative guards',
 {skip:!path},()=>{
 const bytes=readFileSync(path);
 assert.equal(bytes.length,SOURCE.glbBytes);
 const sha=createHash('sha256').update(bytes).digest('hex');
 assert.equal(sha,SOURCE.glbSha256);
 assert.equal(bytes.subarray(0,4).toString('ascii'),'glTF');
 const chunkLength=bytes.readUInt32LE(12);
 assert.equal(bytes.subarray(16,20).toString('ascii'),'JSON');
 const json=JSON.parse(bytes.subarray(20,20+chunkLength).toString('utf8'));
 const receipt=gate(json,sha);
 assert.ok(receipt);
 assert.deepEqual([receipt.clean.BOTH,receipt.historical2015.BOTH],[866,867]);
 assert.equal(receipt.productionWebGLVerified,false);
 assert.equal(receipt.structuralOpeningsVerified,false);
 assert.equal(resolve(json,sha,'BOTH',false)?.scene,866);
 assert.equal(resolve(json,sha,'BOTH',true)?.scene,867);
 assert.equal(resolve(json,sha,'2F',true),null);
 function rejectMutation(target,key,value){
  const old=target[key];target[key]=value;
  try{assert.equal(gate(json,sha),null,'mutation '+key+' must fail closed');}
  finally{target[key]=old;}
 }
 rejectMutation(json,'scene',866);
 rejectMutation(json.scenes[866].extras,'current',true);
 rejectMutation(json.scenes[867].extras,'2015SchematicOptIn',false);
 rejectMutation(json.scenes[867].extras,'optinHist2015',false);
 rejectMutation(json.scenes[866].extras,'sourceLinksBound',true);
 rejectMutation(json.scenes[866].extras,'noFirestopProof',false);
 rejectMutation(json.scenes[864].extras,'asBuilt',true);
 rejectMutation(json.nodes[14062].extras,'structuralCutVerified',true);
 rejectMutation(json.nodes[14060].extras,'presentationOnly',false);
 rejectMutation(json.nodes[14061],'mesh',5307);
 rejectMutation(json.nodes[13979].extras,'current',true);
 // Independently found source-gate gaps. None may change documentary WORK_TEST
 // data into claims about the 2015 cable route or a 2026 installed host.
 rejectMutation(json.nodes[13979].extras,'sourceLinksBoundToNewSHA',true);
 rejectMutation(json.nodes[13979].extras,'physicalConnectionsVerified',true);
 rejectMutation(json.nodes[14060].extras,'sourceLinksBoundForNewSHA',true);
 rejectMutation(json.nodes[14060].extras,'sourceLinksBound',true);
 rejectMutation(json.nodes[14061].extras,'physicalCable',true);
 rejectMutation(json.nodes[14062].extras,'sourceLinksBound',true);
 rejectMutation(json.scenes[862].extras,'humanReview',true);
 rejectMutation(json.scenes[866].extras,'humanReview','APPROVED');
 rejectMutation(json.scenes[867].extras,'HUMAN_REVIEW','APPROVED');
 rejectMutation(json.scenes[866].extras,'productionWebGLVerified',true);
 rejectMutation(json.scenes[866].extras,'sourceLinksBoundToNewSHA',true);
 rejectMutation(json.scenes[867].extras,'humanReviewVerified',true);
 const roots=json.scenes[866].nodes,at=roots.indexOf(14062);
 assert.ok(at>=0);
 const old=roots[at];roots[at]=13369;
 try{assert.equal(gate(json,sha),null);}finally{roots[at]=old;}
 assert.ok(gate(json,sha),'must restore exact source state');
});
