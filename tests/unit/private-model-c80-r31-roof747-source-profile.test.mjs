import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_R31_ROOF_SOURCES as SPECS,c80R31RoofRootsFnv32,
 isC80R31RoofSourceScene as valid,c80R31RoofSourceReceipt as receipt,
} from '../../src/scripts/privateModelC80R31Roof747SourceProfile.mjs';
const paths={746:process.env.C80_R31_D_ROOF746_GLB_PATH,747:process.env.C80_R31_D_E220S747_GLB_PATH};
const parse=path=>{
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 return {b,json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'))};
};
test('R31 roof 746 and E220S 747 have distinct immutable output SHAs and glTF indices',()=>{
 assert.deepEqual(Object.keys(SPECS),['746','747']);
 assert.equal(SPECS[746].parentScene,744);
 assert.equal(SPECS[747].parentScene,746);
 assert.equal(SPECS[746].roofRoot,13337);
 assert.equal(SPECS[747].roofRoot,13359);
 assert.notEqual(SPECS[746].glbSha256,SPECS[747].glbSha256);
 assert.equal(c80R31RoofRootsFnv32([0,-1]),null);
 for(const s of Object.values(SPECS)){
  assert.match(s.glbSha256,/^[a-f0-9]{64}$/);
  assert.match(s.zipSha256,/^[a-f0-9]{64}$/);
 }
});
test('unverified or mismatched version cannot bind source links or publish',()=>{
 for(const [i,s] of Object.entries(SPECS)){
  const idx=Number(i);
  assert.equal(valid({},s.glbSha256,idx,'BOTH'),false);
  assert.equal(valid({},'0'.repeat(64),idx,'BOTH'),false);
  assert.equal(valid({},s.glbSha256,s.parentScene,'BOTH'),false);
  assert.equal(valid({},s.glbSha256,idx,'1F'),false);
  const r=receipt({},s.glbSha256,idx,'BOTH');
  assert.equal(r.exactSource,false);
  assert.equal(r.sourceLinksBound,false);
  assert.equal(r.publishAllowed,false);
  assert.equal(r.current,false);
  assert.equal(r.asBuilt,false);
  assert.equal(r.physicalRoofOpeningVerified,false);
 }
});
for(const [key,s] of Object.entries(SPECS)){
 const idx=Number(key),path=paths[idx];
 test('authentic SHA-locked C80 R31 roof scene '+idx+' and fail-closed edits',{skip:!path},()=>{
  const {b,json}=parse(path),sha=createHash('sha256').update(b).digest('hex');
  assert.equal(b.length,s.glbBytes);
  assert.equal(sha,s.glbSha256);
  assert.equal(valid(json,sha,idx,'BOTH'),true);
  assert.equal(valid(json,SPECS[idx===746?747:746].glbSha256,idx,'BOTH'),false);
  const mutate=(target,key,value)=>{
   const old=target[key];target[key]=value;
   try{assert.equal(valid(json,sha,idx,'BOTH'),false,String(key));}
   finally{target[key]=old;}
  };
  mutate(json.scenes[idx].nodes,0,13359);
  mutate(json.scenes[idx].extras,'sourceLinksBoundForOutputSHA',true);
  mutate(json.scenes[idx].extras,'productionWebGLVerified',true);
  mutate(json.scenes[idx].extras,'sourceGLBSHA256','0'.repeat(64));
  mutate(json.asset.extras,'current',true);
  mutate(json.nodes[s.roofRoot].extras,'asBuilt',true);
  if(idx===747){
   mutate(json.scenes[idx].extras,'verifiedConnections',1);
   mutate(json.nodes[13340].extras,'physicalVerified',true);
   mutate(json.nodes[13358].extras,'sourceLinksBoundForOutputSHA',true);
  }
  assert.equal(valid(json,sha,idx,'BOTH'),true);
 });
}
