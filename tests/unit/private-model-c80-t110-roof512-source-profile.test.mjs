import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_T110_512_GLB_SHA256 as SHA, C80_T110_512_GLB_BYTES as BYTES,
  C80_T110_512_SCENES as SCENES, C80_T110_512_ZIP_DRIVE_ID,
  c80T110Roof512Fnv32, isC80T110Roof512SourceScene as valid,
  c80T110Roof512Receipt as receipt,
} from '../../src/scripts/privateModelC80T110Roof512SourceProfile.mjs';

const fixture = process.env.C80_T110_512_GLB_PATH;
const source = fixture ? readFileSync(fixture) : null;
const authenticatedSha = source ? createHash('sha256').update(source).digest('hex') : null;
const json = source && source.toString('ascii',0,4)==='glTF'
  ? JSON.parse(source.subarray(20,20+source.readUInt32LE(12)).toString('utf8')) : null;

test('known original source identity and seven explicit glTF opt-in scene roles', () => {
  assert.match(SHA,/^[0-9a-f]{64}$/);
  assert.equal(BYTES,55324372);
  assert.equal(C80_T110_512_ZIP_DRIVE_ID,'1nrEfTvZoKvrof1I_WWxGNrfJkT2Brfd9');
  assert.deepEqual(Object.keys(SCENES),['505','506','507','508','509','510','511']);
  assert.equal(SCENES[505].floor,'2F');
  assert.equal(SCENES[508].floor,'BOTH');
  assert.equal(c80T110Roof512Fnv32([1,-1]),null);
});

test('incomplete or unauthenticated inputs always reject source and publication', () => {
  assert.equal(valid({},SHA,505,'2F'),false);
  assert.equal(valid({},'0'.repeat(64),505,'2F'),false);
  assert.equal(valid({},SHA,501,'BOTH'),false);
  const r=receipt({},SHA,505,'2F');
  assert.equal(r.exactSource,false);
  assert.equal(r.publishAllowed,false);
  assert.equal(r.sourceLinksBound,false);
  assert.equal(r.current,false);
  assert.equal(r.physicalRoofOpeningVerified,false);
});

test('authenticated full GLB source covers every new 2F/BOTH scene', {skip:!json}, () => {
  assert.equal(source.length,BYTES);
  assert.equal(authenticatedSha,SHA);
  assert.equal(json.scenes.length,512);
  for(const [id,spec] of Object.entries(SCENES)) {
    assert.equal(valid(json,authenticatedSha,Number(id),spec.floor),true,'glTF scene '+id);
    assert.equal(valid(json,authenticatedSha,Number(id),'1F'),false,'wrong floor '+id);
    assert.equal(valid(json,'0'.repeat(64),Number(id),spec.floor),false,'wrong SHA '+id);
  }
});

test('mutated SHA-locked roots, fake host and cross-floor transfer fail closed', {skip:!json}, () => {
  const mutate=(target,key,replacement,scene=508)=>{
    const previous=target[key];
    target[key]=replacement;
    try {assert.equal(valid(json,authenticatedSha,scene,SCENES[scene].floor),false,key+' must fail');}
    finally {target[key]=previous;}
  };
  mutate(json.scenes[508].nodes,469,12240);
  mutate(json.scenes[508].extras,'sourceLinksBoundForNewSHA',true);
  mutate(json.scenes[508].extras.t110RoofVentCofit,'physicalRoofOpeningVerified',true);
  mutate(json.scenes[508].extras.t110RoofVentCofit,'originalSceneIndex',500);
  mutate(json.nodes[12239].extras,'m5System','IV');
  mutate(json.nodes[12239].extras,'physicalRoofPointVerified',true);
  mutate(json.nodes[12239].extras,'flashingModeled',true);
  mutate(json.nodes[12239],'mesh',4609);
  mutate(json.nodes[12242],'children',[12239,12241],505);
  mutate(json.nodes[12241].extras,'sourceNode',12158,505);
  mutate(json.asset.extras,'current',true);
  assert.equal(valid(json,authenticatedSha,508,'BOTH'),true,'test leaves original intact');
  assert.equal(valid(json,authenticatedSha,505,'2F'),true,'2F original intact');
});
