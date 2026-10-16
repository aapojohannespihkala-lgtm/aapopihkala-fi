import {test} from '@playwright/test';
import assert from 'node:assert/strict';
// @ts-ignore - internal Node ESM source-only guard has no generated TS declarations
import {projectR1125SourceOnly as project} from '../../src/scripts/privateModelM5AR1125ObliqueSourceCameraCandidate.mjs';

// Synthetic source-space checks only. No GLB authentication, WebGL or HUMAN_REVIEW.
const keys=['PVK','SOK1','SOK2','SOK3','PVK_SOK1','PVK_SOK3','SOK1_SOK2',
  'SOK3_BUILDING_END','SOK2_BUILDING_END','PVK_DISCHARGE','PVK_PARKING',
  'boundary:PVK_DISCHARGE','boundary:PVK_PARKING'];
const make=(sizes:number[])=>keys.map((key,i)=>({key,points:Array.from({length:sizes[i]!},(_,j)=>
  [i+0.1*(j%3),0.1*(j%11),0.1*(j%7)])}));
const exact200k=[50000,25000,25000,25000,25000,25000,24988,2,2,2,2,2,2];

test('source-space candidate processes 130000 points without V8 spread overflow',()=>{
  const result=project(make(Array(13).fill(10000)));
  assert.equal(result.sourcePointCount,130000);
  assert.equal(result.targets.length,13);
  assert.equal(result.productionPixelProof,false);
  assert.ok(result.targets.every((x:{rect:{uMin:number,uMax:number,vMin:number,vMax:number}})=>
    x.rect.uMin>0&&x.rect.uMax<1&&x.rect.vMin>0&&x.rect.vMax<1));
});
test('source-space candidate accepts exactly 200000 points at the documented limit',()=>{
  assert.equal(exact200k.reduce((a,b)=>a+b,0),200000);
  const result=project(make(exact200k));
  assert.equal(result.sourcePointCount,200000);
  assert.equal(result.targets[0].pointCount,50000);
  assert.equal(result.originalRawDigestVerified,false);
  assert.equal(result.viewerCameraApplied,false);
  assert.equal(result.humanReview,'NOT_RUN');
});
test('source-space candidate rejects 200001 points before projection',()=>{
  const oversized=[...exact200k];oversized[6]++;
  assert.throws(()=>project(make(oversized)),/source roster or budget/);
});
test('small synthetic source camera rectangles remain deterministic',()=>{
  const result=project(make(Array(13).fill(20)));
  assert.deepEqual(result.targets.map((x:{key:string})=>x.key),keys);
  const pvk=result.targets[0].rect;
  assert.ok(pvk.uMin>0&&pvk.uMin<0.5);
  assert.ok(pvk.uMax>pvk.uMin);
  assert.ok(pvk.vMax>pvk.vMin);
  assert.equal(result.sourceSpaceOnly,true);
  assert.equal(result.current,false);
  assert.equal(result.canonical,false);
  assert.equal(result.asBuilt,false);
});
