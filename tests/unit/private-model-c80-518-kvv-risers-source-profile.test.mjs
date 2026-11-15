import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_518_GLB_SHA256 as SHA, C80_518_GLB_BYTES as BYTES,
  C80_518_ZIP_DRIVE_ID, C80_518_ZIP_SHA256,
  C80_518_SCENES as SCENES, c80518Fnv32,
  isC80518KvvSourceScene as valid, c80518KvvReceipt as receipt,
} from '../../src/scripts/privateModelC80518KvvRisersSourceProfile.mjs';

const path=process.env.C80_518_GLB_PATH;
const bytes=path ? readFileSync(path) : null;
const fullSha=bytes ? createHash('sha256').update(bytes).digest('hex') : null;
const json=bytes && bytes.toString('ascii',0,4)==='glTF'
  ? JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8')) : null;

test('original immutable source and six independent glTF scene roles', () => {
  assert.match(SHA,/^[0-9a-f]{64}$/);
  assert.equal(BYTES,55408432);
  assert.equal(C80_518_ZIP_DRIVE_ID,'1oV3H7v-RCUQcQolfc3Zt-G71ewDq9nEH');
  assert.match(C80_518_ZIP_SHA256,/^[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(SCENES),['512','513','514','515','516','517']);
  assert.equal(SCENES[512].floor,'1F');
  assert.equal(SCENES[513].floor,'2F');
  assert.deepEqual(SCENES[514].newRoots,[12243,12245,12247,12244,12246,12248]);
  assert.equal(c80518Fnv32([1,-1]),null);
});

test('missing, wrong source, and cross-floor always reject publication', () => {
  assert.equal(valid({},SHA,512,'1F'),false);
  assert.equal(valid({},'0'.repeat(64),512,'1F'),false);
  assert.equal(valid({},SHA,518,'BOTH'),false);
  assert.equal(valid({},SHA,512,'2F'),false);
  assert.equal(valid({},SHA,512),false);
  const r=receipt({},SHA,512,'1F');
  assert.equal(r.exactSource,false);
  assert.equal(r.publishAllowed,false);
  assert.equal(r.sourceLinksBound,false);
  assert.equal(r.physicalConnectionsVerified,false);
  assert.equal(r.current,false);
  assert.equal(r.asBuilt,false);
});

test('authenticated original GLB: exact six scenes pass, wrong SHA/floor fail', {skip:!json}, () => {
  assert.equal(bytes.length,BYTES);
  assert.equal(fullSha,SHA);
  for (const [key,spec] of Object.entries(SCENES)) {
    const i=Number(key);
    assert.equal(valid(json,fullSha,i,spec.floor),true,'original scene '+i);
    assert.equal(valid(json,'0'.repeat(64),i,spec.floor),false,'wrong sha '+i);
    assert.equal(valid(json,fullSha,i,spec.floor==='1F'?'2F':'1F'),false,'wrong floor '+i);
  }
});

test('authenticated GLB: shell, provenance, B open port, sourceLinks mutation fail closed', {skip:!json}, () => {
  const change=(object,key,value,scene=514)=>{
    const old=object[key];
    object[key]=value;
    try { assert.equal(valid(json,fullSha,scene,SCENES[scene].floor),false,key); }
    finally {object[key]=old;}
  };
  change(json,'scene',512);
  change(json.asset.extras,'current',true);
  change(json.scenes[514].nodes,475,12247);
  change(json.scenes[514].extras,'parentScene',509);
  change(json.scenes[514].extras,'sourceLinksBindingVerified',true);
  change(json.scenes[514].extras,'productionWebGLVerified',true);
  change(json.scenes[514].extras,'A_C_terminal','physically connected');
  change(json.nodes[12246].extras,'connectionStatus','CONNECTED');
  change(json.nodes[12245].extras,'boundTwoFloorSourceNode',10155);
  change(json.nodes[12248],'mesh',4614);
  change(json.nodes[12243].extras,'originFileId1F','wrong-pdf');
  change(json.nodes[12243].extras,'sourceLinksBoundForNewSha',true);
  change(json.nodes[12243].extras,'current',true);
  assert.equal(valid(json,fullSha,514,'BOTH'),true,'unmodified source restored');
});
