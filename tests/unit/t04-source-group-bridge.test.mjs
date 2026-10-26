import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSharedCdMaterialClip } from '../../src/scripts/privateModelSharedCdMaterialClip.mjs';
import { createT04FloorScopeBridge } from '../../src/scripts/privateModelT04FloorScopeBridge.mjs';

const SHA='e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807';
const KEY='node@9bd394795b6bee37de9aea6f6b128cf93e9489a34015852d2d59082a3529013e:n1276';
const S={objectKey:KEY,apartmentScope:'SHARED_CD',storeyScope:'BOTH',
  role:'SHARED_BOUNDARY',phaseScope:'ACTIVE_IN_SELECTED_WORKTEST'};
const M=[1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1];
class Vector3 {constructor(x,y,z){Object.assign(this,{x,y,z});}}
class Plane {constructor(normal,constant){this.normal=normal;this.constant=constant;}}
class Material {constructor(){this.clippingPlanes=[];this.disposed=false;}clone(){return new Material();}dispose(){this.disposed=true;}}
function setup({badSecond=false,conflictSecond=false,permitRefused=false}={}) {
 const group={parent:null,userData:{ylisViewScope:S}};
 const first={parent:group,userData:{},isMesh:true,material:new Material(),visible:true};
 const second={parent:group,userData:conflictSecond?{ylisViewScope:{...S,apartmentScope:'C'}}:{},
   isMesh:true,material:badSecond?{}:new Material(),visible:true};
 const renderer={localClippingEnabled:true},meshes=[first,second];
 const clips=meshes.map(mesh=>createSharedCdMaterialClip({mesh,renderer,THREE:{Vector3,Plane}}));
 const scope={
   t04Granted:false,
   apply(floor,permit){
     this.permit=permit;
     this.t04Granted=!permitRefused && Boolean(
       permit && permit.sourceObjectKey===KEY && permit.meshes.length===2 &&
       new Set(permit.meshes).size===2 && permit.meshes.every(mesh=>meshes.includes(mesh)) &&
       permit.clippedNow());
     return {included:this.t04Granted?2:0,exceptions:this.t04Granted?[]:
       [{objectKey:KEY,reason:'STOREY_CLIPPING_PENDING'}]};
   },
   restore(){this.t04Granted=false;this.permit=null;},
   enforce(){if(this.permit && !this.permit.clippedNow())this.t04Granted=false;},
 };
 const bridge=createT04FloorScopeBridge({mainScope:scope,sharedMeshes:meshes,clippingAdapters:clips});
 const evidence={source:{...S,zipSha256:SHA},floor:'1F',expectedZipSha256:SHA,
   expectedObjectKey:KEY,g1LocalToWorld:M,matrixReference:'G1_LOCAL_TO_WORLD'};
 return {group,first,second,renderer,clips,scope,bridge,evidence};
}
test('both primitives are clipped before one atomic source-object permit',()=>{
 const f=setup();const r=f.bridge.apply('1F',f.evidence);
 assert.equal(r.status,'T04_CLIPPED_SOURCE');assert.equal(r.primitiveCount,2);
 assert.equal(f.scope.t04Granted,true);assert.ok(f.clips.every(c=>c.active));
 assert.equal(f.first.material.clippingPlanes.length,1);
 assert.equal(f.second.material.clippingPlanes.length,1);
});
test('second primitive material error rolls back the first, no partial grant',()=>{
 const f=setup({badSecond:true}),old=f.first.material;
 const r=f.bridge.apply('1F',f.evidence);
 assert.equal(r.status,'T04_HOLD');assert.equal(f.scope.t04Granted,false);
 assert.equal(f.first.material,old);assert.ok(f.clips.every(c=>!c.active));
});
test('conflicting child scope is rejected without trusting its parent',()=>{
 const f=setup({conflictSecond:true});
 assert.equal(f.bridge.apply('1F',f.evidence).status,'T04_HOLD');
 assert.ok(f.clips.every(c=>!c.active));
});
test('wrong source SHA blocks both, not just the first primitive',()=>{
 const f=setup();const proof={...f.evidence,expectedZipSha256:'f'.repeat(64)};
 assert.equal(f.bridge.apply('1F',proof).status,'T04_HOLD');
 assert.ok(f.clips.every(c=>!c.active));
});
test('scope refusal rolls back correctly clipped materials',()=>{
 const f=setup({permitRefused:true}),first=f.first.material,second=f.second.material;
 assert.equal(f.bridge.apply('1F',f.evidence).status,'T04_HOLD');
 assert.equal(f.first.material,first);assert.equal(f.second.material,second);
});
test('D/2F overrides stale 1F evidence and uses the correct plane on both primitives',()=>{
 const f=setup();assert.equal(f.bridge.apply('2F',f.evidence).status,'T04_CLIPPED_SOURCE');
 assert.ok(f.clips.every(c=>c.activeFloor==='2F'));
 assert.equal(f.evidence.floor,'1F');
 assert.ok(f.first.material.clippingPlanes[0].constant<0);
 assert.ok(f.second.material.clippingPlanes[0].constant<0);
});
test('BOTH and WHOLE restore both original materials and grant nothing',()=>{
 const f=setup(),originals=[f.first.material,f.second.material];f.bridge.apply('1F',f.evidence);
 assert.equal(f.bridge.apply('BOTH').status,'D_BOTH_ORIGINAL');
 assert.equal(f.scope.t04Granted,false);
 assert.equal(f.first.material,originals[0]);assert.equal(f.second.material,originals[1]);
 assert.equal(f.bridge.apply('WHOLE').status,'WHOLE_ORIGINAL');
});
test('after one primitive loses its clipping plane, permit becomes invalid',()=>{
 const f=setup();f.bridge.apply('1F',f.evidence);
 f.second.material.clippingPlanes=[];
 assert.equal(f.scope.permit.clippedNow(),false);
});
test('disabling renderer local clipping also invalidates permit',()=>{
 const f=setup();f.bridge.apply('1F',f.evidence);
 f.renderer.localClippingEnabled=false;
 assert.equal(f.scope.permit.clippedNow(),false);
});
test('disposed bridge is fail-closed',()=>{
 const f=setup();f.bridge.dispose();
 assert.equal(f.bridge.apply('1F',f.evidence).status,'HOLD');
});
