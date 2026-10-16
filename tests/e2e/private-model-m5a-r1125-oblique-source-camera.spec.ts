import {test} from '@playwright/test';
import assert from 'node:assert/strict';
// @ts-ignore - internal Node ESM source-only guard has no generated TS declarations
import {projectR1125SourceOnly as project,proposeAuthenticatedR1125SourceCamera as authenticate} from '../../src/scripts/privateModelM5AR1125ObliqueSourceCameraCandidate.mjs';

// Synthetic camera fixtures are not source authentication and not WebGL pixels.
const keys=['PVK','SOK1','SOK2','SOK3','PVK_SOK1','PVK_SOK3','SOK1_SOK2',
  'SOK3_BUILDING_END','SOK2_BUILDING_END','PVK_DISCHARGE','PVK_PARKING',
  'boundary:PVK_DISCHARGE','boundary:PVK_PARKING'];
const make=()=>keys.map((key,i)=>({key,points:[[i,0,0],[i,1,0],[i,.5,1]]}));
test('13 projected source objects fit but never claim viewer, occlusion or physical proof',()=>{
  const p=project(make());
  assert.equal(p.targets.length,13);
  assert.equal(p.sourcePointCount,39);
  assert.equal(p.originalRawDigestVerified,false);
  assert.equal(p.productionPixelProof,false);
  assert.equal(p.viewerCameraApplied,false);
  assert.equal(p.occlusionVerified,false);
  assert.equal(p.humanReview,'NOT_RUN');
  assert.ok(p.targets.every((t:{rect:{uMin:number,vMin:number,uMax:number,vMax:number}})=>
    t.rect.uMin>0&&t.rect.vMin>0&&t.rect.uMax<1&&t.rect.vMax<1));
});
test('an untrusted synthetic list cannot claim original SHA authentication',()=>{
  assert.equal(project(make()).originalRawDigestVerified,false);
  assert.throws(()=>authenticate(Buffer.alloc(3112432)),/original raw SHA-256/);
  assert.throws(()=>authenticate(Buffer.alloc(8)),/original raw bytes/);
});
test('unknown, duplicate and missing source target identities fail closed',()=>{
  const a=make();a[0]!.key='FORGED';
  assert.throws(()=>project(a),/duplicate or unknown source identity/);
  const b=make();b[0]!.key=b[1]!.key;
  assert.throws(()=>project(b),/duplicate or unknown source identity/);
  assert.throws(()=>project(make().slice(1)),/13 source targets/);
});
test('nonfinite and malformed source coordinates fail closed',()=>{
  const f=make();f[0]!.points[0]![0]=Number.NaN;
  assert.throws(()=>project(f),/nonfinite source vertex/);
  const g=make();g[0]!.points[0]!.pop();
  assert.throws(()=>project(g),/nonfinite source vertex/);
  const h=make();h[0]!.points=[];
  assert.throws(()=>project(h),/source points/);
});
test('angle and padding changes require independent real-source review',()=>{
  assert.throws(()=>project(make(),{azimuthDegrees:15}),/unverified camera angle override/);
  assert.throws(()=>project(make(),{elevationDegrees:0}),/unverified camera angle override/);
  assert.throws(()=>project(make(),{padding:0.4}),/source padding/);
});
test('bad viewport and excessive projection image size are rejected',()=>{
  assert.throws(()=>project(make(),{width:319}),/viewport/);
  assert.throws(()=>project(make(),{width:4096,height:4096}),/viewport/);
  assert.throws(()=>project(make(),{height:200}),/viewport/);
});
test('per-source 3D bounds preserve distinct source keys and source-only flags',()=>{
  const p=project(make(),{width:960,height:600});
  assert.deepEqual(p.targets.map((t:{key:string})=>t.key),keys);
  assert.equal(p.sourceSpaceOnly,true);
  assert.equal(p.babylonSceneRootRotationNotApplied,true);
  assert.equal(p.asBuilt,false);
  assert.equal(p.physicalPipeDiameterVerified,false);
});
test('finite but untrusted input cannot manufacture a production-approved camera',()=>{
  const p=project(make().map(x=>({...x,points:x.points.map(y=>y.map(z=>z+1000000))})));
  assert.equal(p.current,false);
  assert.equal(p.canonical,false);
  assert.equal(p.physicalElevationsVerified,false);
  assert.equal(p.productionPixelProof,false);
});
