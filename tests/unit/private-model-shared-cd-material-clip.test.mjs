import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSharedCdMaterialClip } from '../../src/scripts/privateModelSharedCdMaterialClip.mjs';

const SHA='e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807';
const KEY='node@9bd394795b6bee37de9aea6f6b128cf93e9489a34015852d2d59082a3529013e:n1276';
const scope=()=>({objectKey:KEY,apartmentScope:'SHARED_CD',storeyScope:'BOTH',role:'SHARED_BOUNDARY',phaseScope:'ACTIVE_IN_SELECTED_WORKTEST'});
const matrix=[1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1];
class Vector3 { constructor(x,y,z){Object.assign(this,{x,y,z});} }
class Plane {constructor(normal,constant){this.normal=normal;this.constant=constant;} distance(x,y,z){return this.normal.x*x+this.normal.y*y+this.normal.z*z+this.constant;}}
class Material {constructor(){this.clippingPlanes=[];this.disposed=false;} clone(){const m=new Material();m.clippingPlanes=[...this.clippingPlanes];return m;} dispose(){this.disposed=true;}}
const setup=({group=false}={})=>{
  const source={...scope(),zipSha256:SHA};
  const parent=group?{parent:null,userData:{ylisViewScope:scope()}}:null;
  const mesh={isMesh:true,material:new Material(),parent,userData:group?{}:{ylisViewScope:scope()},visible:true};
  const renderer={localClippingEnabled:true};
  const ctl=createSharedCdMaterialClip({mesh,renderer,THREE:{Plane,Vector3}});
  const proof={floor:'1F',source,expectedZipSha256:SHA,expectedObjectKey:KEY,g1LocalToWorld:matrix,matrixReference:'G1_LOCAL_TO_WORLD'};
  return {mesh,renderer,ctl,proof};
};
test('1F installs local half-space without source mutation or automatic visibility permit',()=>{
 const f=setup(),original=f.mesh.material;
 const r=f.ctl.apply(f.proof);assert.equal(r.materialClipped,true);assert.equal(r.sourceVisible,false);
 assert.equal(f.mesh.material.clippingPlanes.length,1);assert.equal(f.ctl.active,true);
 const plane=f.mesh.material.clippingPlanes[0];
 assert.ok(plane.distance(0,2,0)<0 && plane.distance(0,3,0)>0);
 f.ctl.restore();assert.equal(f.mesh.material,original);assert.equal(original.disposed,false);
});
test('2F uses opposite half-space',()=>{
 const f=setup();f.ctl.apply({...f.proof,floor:'2F'});
 const p=f.mesh.material.clippingPlanes[0];assert.ok(p.distance(0,2,0)>0&&p.distance(0,3,0)<0);
});
test('node metadata inherited from glTF multi-primitive parent group',()=>{
 const f=setup({group:true});
 assert.equal(f.ctl.apply(f.proof).ok,true);assert.equal(f.ctl.active,true);
});
test('WHOLE/BOTH return to exact unmodified source material',()=>{
 const f=setup(),original=f.mesh.material;f.ctl.apply(f.proof);
 for(const floor of ['BOTH','WHOLE'])assert.equal(f.ctl.apply({...f.proof,floor}).reason,'SOURCE_ORIGINAL');
 assert.equal(f.mesh.material,original);assert.equal(f.ctl.active,false);
});
test('wrong raw ZIP SHA is rejected',()=>{
 const f=setup();assert.equal(f.ctl.apply({...f.proof,expectedZipSha256:'f'.repeat(64)}).ok,false);
});
test('mismatching child metadata cannot silently inherit parent scope',()=>{
 const f=setup({group:true});f.mesh.userData.ylisViewScope={...scope(),apartmentScope:'C'};
 assert.equal(f.ctl.apply(f.proof).reason,'SOURCE_MESH_SCOPE_MISMATCH');
});
test('unknown or singular G1 transform fails closed',()=>{
 const f=setup();assert.equal(f.ctl.apply({...f.proof,g1LocalToWorld:null}).ok,false);
 assert.equal(f.ctl.apply({...f.proof,g1LocalToWorld:Array(16).fill(0)}).ok,false);
});
test('local clipping disabled fails closed both at installation and after installation',()=>{
 const f=setup();f.renderer.localClippingEnabled=false;
 assert.equal(f.ctl.apply(f.proof).reason,'LOCAL_CLIPPING_DISABLED');
 f.renderer.localClippingEnabled=true;f.ctl.apply(f.proof);f.renderer.localClippingEnabled=false;
 assert.equal(f.ctl.active,false);
});
test('clip removal or plane mutation invalidates active permit',()=>{
 const f=setup();f.ctl.apply(f.proof);
 f.mesh.material.clippingPlanes=[];assert.equal(f.ctl.active,false);
 f.ctl.apply(f.proof);f.mesh.material.clippingPlanes[0].constant=99;assert.equal(f.ctl.active,false);
});
test('externally changed material is never overwritten',()=>{
 const f=setup();f.ctl.apply(f.proof);const external=new Material();
 f.mesh.material=external;assert.equal(f.ctl.apply(f.proof).reason,'MATERIAL_OWNERSHIP_CHANGED');
 assert.equal(f.mesh.material,external);
});
test('uncloneable material rolls back',()=>{
 const f=setup();f.mesh.material={};
 assert.equal(f.ctl.apply(f.proof).ok,false);
});
test('disposed adapter never mounts a new clip',()=>{
 const f=setup();f.ctl.dispose();assert.equal(f.ctl.apply(f.proof).reason,'ADAPTER_DISPOSED');
});
