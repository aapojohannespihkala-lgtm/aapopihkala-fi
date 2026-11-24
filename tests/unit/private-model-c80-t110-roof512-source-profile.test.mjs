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

// R34 root fixture originates from the existing exact R34 source-receipt tests.
import {R34_T110_SHA,r34T110RoofWarning} from '../../src/scripts/privateModelC80T110Roof512SourceProfile.mjs';
const r34Original=JSON.parse(readFileSync(new URL('../fixtures/private-model-r34-scene-roots.json',import.meta.url),'utf8'));
function r34Fixture(){
 const x={asset:{extras:{...r34Original.asset}},scene:r34Original.defaultScene};
 for(const [k,n] of Object.entries(r34Original.counts))x[k]=Array.from({length:n},()=>({}));
 for(const i of [822,823,824,825])x.scenes[i]={...r34Original.scenes[i],nodes:[...r34Original.scenes[i].nodes],extras:{stage:'WORK_TEST',physicalHost:'HOST_HOLD',current:false,asBuilt:false,humanReview:'NOT_RUN'}};
 const hold={m5System:'VIEMARI',stage:'WORK_TEST_HOST_HOLD',modelStage:'WORK_TEST',current:false,asBuilt:false,humanReview:'NOT_RUN',workAssumption:true,sourceGlbSHA256:'78fbc1c65d3a879a3097d16cc9646c098499c839828563ea23afab0ecf5214ab',sourcePdfDriveId:'1Guc8pv0oSw18bTxP0Rk4-aLtu5erPFWH',existingT110Node:10145,sourceRoofNode:6642,sourceLinksBoundForNewSHA:false,roofOpeningCut:false,insulationModeled:false,flashingModeled:false,capModeled:false,physicalRoofPointVerified:false,visualProtrusionAboveRoof_m:0.45,centerWorldGlbXZ_m:[6.315,-6.28]};
 for(const n of [12239,12240])x.nodes[n]={mesh:4611,extras:{...hold}};
 x.nodes[12242]={children:[12240,12241]};return x;
}
test('R34 T110 warning only follows exact four mounted scene roles and selected source leaf',()=>{
 for(const i of [822,823,824,825]){
  const floor=i<824?'BOTH':'2F',node=i<824?12239:12240;
  const x=r34Fixture(),r=r34T110RoofWarning(x,R34_T110_SHA,i,floor,node);
  assert.ok(r);assert.equal(r.physicalRoofOpeningVerified,false);assert.equal(r.publishAllowed,false);assert.equal(r.sourceLinksBound,false);
  assert.equal(r34T110RoofWarning(x,SHA,i,floor,node),null);
  assert.equal(r34T110RoofWarning(x,R34_T110_SHA,i,'1F',node),null);
  assert.equal(r34T110RoofWarning(x,R34_T110_SHA,i,floor,node===12239?12240:12239),null);
  for(const mutate of [j=>j.scenes[i].nodes.reverse(),j=>delete j.scenes[i].nodes[0],j=>j.nodes[node].mesh=4610,j=>j.nodes[node].extras.m5System='VESI',j=>j.nodes[node].extras.sourcePdfDriveId='different',j=>j.nodes[node].extras.sourceGlbSHA256='different',j=>j.nodes[node].extras.roofOpeningCut=true,j=>j.nodes[node].extras.flashingModeled=true,j=>j.nodes[node].extras.physicalRoofPointVerified=true,j=>j.scenes[i].extras.physicalHost='VERIFIED',j=>j.scenes[i].extras.humanReview='APPROVED',j=>j.nodes[j.scenes[i].nodes.find(n=>n!==12242&&n!==node)].children=[10146],j=>j.asset.extras.asBuilt=true]){
   const bad=r34Fixture();mutate(bad);assert.equal(r34T110RoofWarning(bad,R34_T110_SHA,i,floor,node),null);
  }
  if(i>=824){const bad=r34Fixture();bad.nodes[12242].children=[12241];assert.equal(r34T110RoofWarning(bad,R34_T110_SHA,i,floor,node),null);}
 }
});
