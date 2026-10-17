import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {assessM5AR1125TwoViewProof as assess} from '../../src/scripts/privateModelM5AR1125TwoViewProofGate.mjs';
import {m5aR1125SourcePixelKinds as kinds} from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys=Object.keys(kinds), width=128, height=128, n=width*height*4;
function fixture(){
  const makeView=(orbit:number,yawDegrees=0)=>{
    const camera=[width,height,...Array.from({length:16},(_,i)=>i%5===0?1:0),
      ...Array.from({length:16},(_,i)=>i%5===0?1:0)];
    const yaw=yawDegrees*Math.PI/180;
    camera[2]=Math.cos(yaw);  // world matrix first column X
    camera[4]=-Math.sin(yaw);
    camera[10]=Math.sin(yaw); // world matrix third column / optical axis
    camera[12]=Math.cos(yaw);
    camera[14]=orbit; // world matrix X translation, not projection or viewport
    const baseline=new Uint8Array(n);baseline.fill(5);
    const mutedFrames:Record<string,Uint8Array>={};
    const restoredFrames:Record<string,Uint8Array>={};
    const muted:Record<string,number[]>={};
    const restored:Record<string,number[]>={};
    for(const [i,key] of keys.entries()){
      mutedFrames[key]=Uint8Array.from(baseline);
      mutedFrames[key][i*4]=200;
      restoredFrames[key]=Uint8Array.from(baseline);
      muted[key]=[...camera];restored[key]=[...camera];
    }
    return {sceneIndex:63,capture:{
      width,height,baseline,mutedFrames,restoredFrames,
      sourceObjectCount:13,captureScope:'CALLER_RENDERER_ONLY',
      cameraStates:{baseline:camera,muted,restored},
    },sourcePixelDelta:{
      requiredSourceCount:13,allSourceTargetsIsolated:true,
      footprintEvidenceScope:'EXCLUSIVE_SOURCE_GEOMETRY_SCREEN_PIXELS',
      sourceIsolation:keys.map(key=>({
        key,kind:kinds[key as keyof typeof kinds],minimum:8,
        exclusiveOriginalPixels:12,exclusiveLostPixels:12,
        exclusiveRemainingPixels:0,remainingClassPixels:0,
        outsideChangedPixels:0,restoreChangedPixels:0,
        peersPreserved:true,passed:true,
        footprintStatus:'VISIBLE_EXCLUSIVE_SOURCE_PIXELS',
      })),
    }};
  };
  return {views:[makeView(0),makeView(3,12)]};
}
test('two distinct pose reports require 54 source-isolation frames, never 54 viewpoints',()=>{
  const result=assess(fixture());
  assert.equal(result.sourceTargetCount,13);
  assert.equal(result.viewCount,2);
  assert.equal(result.frameCount,54);
  assert.equal(result.eachViewGeometryExclusivePixels,true);
  assert.equal(result.scope,'CALLER_CAPTURE_AGGREGATION_ONLY');
  assert.equal(result.originalGlbDigestAuthenticated,false);
  assert.equal(result.productionProvenanceVerified,false);
  assert.equal(result.authenticatedLiveAutoloadVerified,false);
  assert.equal(result.humanReview,'NOT_RUN');
  assert.equal(result.canonicalClaim,false);
});
test('same world-camera pose is not a second orbit, even with changed projection',()=>{
  const f=fixture();
  changeSecondWorldAxis(f,0);
  f.views[1].capture.cameraStates.baseline[14]=0;
  for(const key of keys){
    f.views[1].capture.cameraStates.muted[key][14]=0;
    f.views[1].capture.cameraStates.restored[key][14]=0;
  }
  f.views[1].capture.cameraStates.baseline[30]=2;
  for(const key of keys){
    f.views[1].capture.cameraStates.muted[key][30]=2;
    f.views[1].capture.cameraStates.restored[key][30]=2;
  }
  assert.throws(()=>assess(f),/two distinct world-camera poses/);
});
test('missing pixel or wrongly restored target fails closed',()=>{
  const a=fixture();a.views[0].sourcePixelDelta.sourceIsolation[2].passed=false;
  assert.throws(()=>assess(a),/unproved exclusive source pixels/);
  const b=fixture();b.views[1].capture.restoredFrames[keys[4]][0]=99;
  assert.throws(()=>assess(b),/source pixels or camera state invalid/);
  const c=fixture();c.views[0].sourcePixelDelta.sourceIsolation[0].outsideChangedPixels=1;
  assert.throws(()=>assess(c),/unproved exclusive source pixels/);
});
test('13 source IDs and same-camera 27-frame cycles are mandatory in both views',()=>{
  const a=fixture();
  delete a.views[1].capture.mutedFrames[keys[3]];
  assert.throws(()=>assess(a),/incomplete 27-frame source capture/);
  const b=fixture();b.views[1].capture.cameraStates.muted[keys[5]][14]+=1;
  assert.throws(()=>assess(b),/source pixels or camera state invalid/);
  const c=fixture();c.views[1].sceneIndex=62;
  assert.throws(()=>assess(c),/requires scene63/);
  const d=fixture();d.views.pop();
  assert.throws(()=>assess(d),/exactly two independent/);
});

const changeSecondWorldAxis=(state:ReturnType<typeof fixture>,yawDegrees:number)=>{
  const yaw=yawDegrees*Math.PI/180;
  const view=state.views[1];
  const apply=(camera:number[])=>{
    camera[2]=Math.cos(yaw); camera[4]=-Math.sin(yaw);
    camera[10]=Math.sin(yaw); camera[12]=Math.cos(yaw);
  };
  apply(view.capture.cameraStates.baseline);
  for(const key of keys){
    apply(view.capture.cameraStates.muted[key]);
    apply(view.capture.cameraStates.restored[key]);
  }
};
test('translation alone is not a distinct viewing angle',()=>{
  const state=fixture();
  changeSecondWorldAxis(state,0);
  assert.throws(()=>assess(state),/two distinct camera viewing directions/);
});
test('camera roll without changed optical axis is not a distinct view',()=>{
  const state=fixture();
  changeSecondWorldAxis(state,0);
  const rotateRoll=(camera:number[])=>{
    const angle=Math.PI/6;
    camera[2]=Math.cos(angle); camera[3]=Math.sin(angle);
    camera[6]=-Math.sin(angle); camera[7]=Math.cos(angle);
  };
  rotateRoll(state.views[1].capture.cameraStates.baseline);
  for(const key of keys){
    rotateRoll(state.views[1].capture.cameraStates.muted[key]);
    rotateRoll(state.views[1].capture.cameraStates.restored[key]);
  }
  assert.throws(()=>assess(state),/two distinct camera viewing directions/);
});
test('tiny one-degree bearing change is insufficient for reliable two-angle evidence',()=>{
  const state=fixture();
  changeSecondWorldAxis(state,1);
  assert.throws(()=>assess(state),/separated by at least 2 degrees/);
});
test('real 12-degree world viewing direction passes and stays source-only',()=>{
  const result=assess(fixture());
  assert.equal(result.minimumViewBearingSeparationDegrees,2);
  assert.ok(result.observedViewBearingSeparationDegrees>=11.99);
  assert.ok(result.observedViewBearingSeparationDegrees<=12.01);
  assert.equal(result.frameCount,54);
  assert.equal(result.productionProvenanceVerified,false);
  assert.equal(result.originalGlbDigestAuthenticated,false);
  assert.equal(result.humanReview,'NOT_RUN');
});
