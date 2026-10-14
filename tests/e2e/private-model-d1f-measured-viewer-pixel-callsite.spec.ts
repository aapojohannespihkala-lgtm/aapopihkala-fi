import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

const oldId='d1f-combined-wall-115-100-20261013';
const measuredId='d1f-measured-wall-140-100-2350-b710-basin-20261014';

function makeProbe(reviewId:string, sha:string) {
  const source=readFileSync('src/pages/private-model/index.astro','utf8');
  const marker="window.addEventListener('d1f-combined-wall-source-probe',";
  const start=source.indexOf(marker);
  const end=source.indexOf('const orientationGizmoController =',start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const handlerSource=source.slice(start,end).replace('(event: Event)', '(event)');
  let eventListener:(e:any)=>void=()=>{throw new Error('listener missing')};
  const calls:any[]=[];
  class LocalCustomEvent { detail:any; constructor(detail:any){this.detail=detail} }
  const canvas:any={dataset:{
    modelSource:'work-test',
    workTestReviewMode:reviewId+'-review',
    d1fCombinedWallRawSha256:sha,
    d1fCombinedWallHumanReview:'NOT_RUN',
  }};
  const runtime={
    prepare:(...args:any[])=>{calls.push(['prepare',...args]);return {
      state:'PREPARED',glbSha256:sha,pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};},
    suppress:(...args:any[])=>{calls.push(['suppress',...args]);return {
      state:'SUPPRESSED',pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};},
    restore:()=>{calls.push(['restore']);return {
      state:'RESTORED',pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};},
    dispose:()=>{calls.push(['dispose']);},
  };
  const camera={};
  runInNewContext(handlerSource,{
    window:{addEventListener:(_name:string,fn:(e:any)=>void)=>{eventListener=fn;}},
    CustomEvent:LocalCustomEvent,canvas,d1fCombinedPixelRuntime:runtime,
    D1F_COMBINED_WALL_ASSETS,camera,activeCamera:camera,
  });
  const dispatch=(detail:object)=>{
    eventListener(new LocalCustomEvent(detail));
    return JSON.parse(canvas.dataset.d1fCombinedWallProbe);
  };
  return {dispatch,calls,canvas};
}

test('old and measured-basin review IDs are both source-SHA bound before pixel actions',()=>{
  for(const id of [oldId,measuredId] as const){
    const sha=D1F_COMBINED_WALL_ASSETS[id].sha256;
    const probe=makeProbe(id,sha);
    const target=id===oldId?'I03':'BASIN';
    const prepared=probe.dispatch({requestId:23,action:'prepare',targetId:target,viewIndex:0});
    expect(prepared).toMatchObject({
      state:'PREPARED',requestId:23,glbSha256:sha,
      pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN',
    });
    expect(probe.calls).toEqual([['prepare',target,0]]);
    expect(probe.dispatch({requestId:24,action:'suppress',targetId:target}))
      .toMatchObject({state:'SUPPRESSED',pixelsVerifiedByThisRuntime:false});
    expect(probe.dispatch({requestId:25,action:'restore'}))
      .toMatchObject({state:'RESTORED',pixelsVerifiedByThisRuntime:false});
    expect(probe.dispatch({requestId:26,action:'finish'}))
      .toMatchObject({state:'FINISHED',pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'});
  }
});

test('wrong SHA, wrong review ID, CURRENT, and fake human approval all block runtime invocation',()=>{
  for(const id of [oldId,measuredId] as const){
    const alternate=id===oldId?measuredId:oldId;
    const f=makeProbe(id,D1F_COMBINED_WALL_ASSETS[alternate].sha256);
    expect(f.dispatch({requestId:1,action:'prepare',targetId:'I03'})).toEqual({
      state:'REJECTED',requestId:1,
    });
    expect(f.calls).toHaveLength(0);
    const g=makeProbe(id,D1F_COMBINED_WALL_ASSETS[id].sha256);
    g.canvas.dataset.workTestReviewMode='wrong-review';
    expect(g.dispatch({requestId:2,action:'prepare',targetId:'I03'}).state).toBe('REJECTED');
    g.canvas.dataset.workTestReviewMode=id+'-review';
    g.canvas.dataset.modelSource='current';
    expect(g.dispatch({requestId:3,action:'prepare',targetId:'I03'}).state).toBe('REJECTED');
    g.canvas.dataset.modelSource='work-test';
    g.canvas.dataset.d1fCombinedWallHumanReview='PASS';
    expect(g.dispatch({requestId:4,action:'prepare',targetId:'I03'}).state).toBe('REJECTED');
    expect(g.calls).toHaveLength(0);
  }
});

test('viewer keeps five-target list only on the measured candidate and never claims rendered pixels',()=>{
  const source=readFileSync('src/pages/private-model/index.astro','utf8');
  expect(source).toContain("candidate.id === 'd1f-measured-wall-140-100-2350-b710-basin-20261014'");
  expect(source).toContain('I03,CORNER_NORTH_X2337,CORNER_SOUTH_X2337,CORNER_MIDDLE_X2589,BASIN');
  expect(source).toContain('d1fCombinedWallRawSha256: combinedWallReview.asset.sha256');
  expect(source).toContain("d1fCombinedWallHumanReview: 'NOT_RUN'");
  const f=makeProbe(measuredId,D1F_COMBINED_WALL_ASSETS[measuredId].sha256);
  expect(f.dispatch({requestId:11,action:'unknown'})).toEqual({
    state:'REJECTED',requestId:11,
  });
  expect(f.calls).toHaveLength(0);
});
