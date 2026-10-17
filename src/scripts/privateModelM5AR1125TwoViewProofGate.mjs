/**
 * R1125 two-view aggregation gate for independently calculated source-footprint
 * isolation reports. One 27-frame camera cycle does NOT mean 27 viewpoints.
 *
 * This checks the shape and invariants of two complete 1+13+13 captures and
 * existing geometry-derived source pixel detector outputs. It does not run a
 * renderer, authenticate original GLB bytes, or establish production/HUMAN_REVIEW.
 */
import {m5aR1125SourcePixelKinds as kinds} from './privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys=Object.keys(kinds);
const reject=message=>{throw new Error('R1125_TWO_VIEW: '+message);};
const must=(condition,message)=>{if(!condition)reject(message);};
const exactKeys=record=>record&&typeof record==='object'&&!Array.isArray(record)&&
  Object.keys(record).length===keys.length&&keys.every(key=>Object.hasOwn(record,key));
const frame=(bytes,length)=>bytes instanceof Uint8Array&&bytes.length===length;
const equals=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);
const snapshot=state=>Array.isArray(state)&&state.length===34&&
  state.every(value=>typeof value==='number'&&Number.isFinite(value));
const cameraSame=(a,b)=>snapshot(a)&&snapshot(b)&&a.every((value,index)=>value===b[index]);

function verifyView(view,index) {
  must(view?.sceneIndex===63&&view?.capture&&view?.sourcePixelDelta,
    'view '+index+' requires scene63 capture and geometry-derived delta');
  const {capture,sourcePixelDelta:delta}=view;
  const {width,height,baseline,mutedFrames,restoredFrames,cameraStates}=capture;
  must(Number.isInteger(width)&&width>=128&&Number.isInteger(height)&&height>=128&&
    width*height<=2304000,'invalid canvas');
  const length=width*height*4;
  must(capture.sourceObjectCount===13&&capture.captureScope==='CALLER_RENDERER_ONLY'&&
    frame(baseline,length)&&exactKeys(mutedFrames)&&exactKeys(restoredFrames)&&
    cameraStates&&snapshot(cameraStates.baseline)&&
    cameraStates.baseline[0]===width&&cameraStates.baseline[1]===height&&
    exactKeys(cameraStates.muted)&&exactKeys(cameraStates.restored),
    'incomplete 27-frame source capture');
  for(const key of keys) {
    must(frame(mutedFrames[key],length)&&frame(restoredFrames[key],length)&&
      !equals(mutedFrames[key],baseline)&&equals(restoredFrames[key],baseline)&&
      cameraSame(cameraStates.muted[key],cameraStates.baseline)&&
      cameraSame(cameraStates.restored[key],cameraStates.baseline),
      'source pixels or camera state invalid for '+key);
  }
  must(delta.requiredSourceCount===13&&delta.allSourceTargetsIsolated===true&&
    delta.footprintEvidenceScope==='EXCLUSIVE_SOURCE_GEOMETRY_SCREEN_PIXELS'&&
    Array.isArray(delta.sourceIsolation)&&delta.sourceIsolation.length===13,
    'source-geometry detector missing or failed');
  const byKey=new Map();
  for(const item of delta.sourceIsolation){
    must(item&&Object.hasOwn(kinds,item.key)&&!byKey.has(item.key)&&
      item.kind===kinds[item.key],'duplicate/unknown detector target');
    byKey.set(item.key,item);
  }
  for(const key of keys){
    const item=byKey.get(key);
    must(item&&item.passed===true&&item.footprintStatus==='VISIBLE_EXCLUSIVE_SOURCE_PIXELS'&&
      Number.isInteger(item.minimum)&&item.minimum>0&&
      item.exclusiveOriginalPixels>=item.minimum&&
      item.exclusiveLostPixels>=item.minimum&&
      item.exclusiveRemainingPixels===0&&item.remainingClassPixels===0&&
      item.outsideChangedPixels===0&&item.restoreChangedPixels===0&&
      item.peersPreserved===true,'unproved exclusive source pixels: '+key);
  }
  return {label:index===0?'VIEW_A':'VIEW_B',camera:[...cameraStates.baseline],
    isolatedKeys:keys.length,width,height};
}

/** Fail closed if both captures show the same camera pose. */
export function assessM5AR1125TwoViewProof({views}={}) {
  must(Array.isArray(views)&&views.length===2,'exactly two independent 27-frame views required');
  const a=verifyView(views[0],0),b=verifyView(views[1],1);
  // A different viewport or projection alone is not an independent orbit view.
  must(a.camera.slice(2,18).some((value,i)=>Math.abs(value-b.camera[i+2])>1e-6),
    'two distinct world-camera poses required');
  return Object.freeze({
    sourceTargetCount:13,viewCount:2,frameCount:54,
    eachViewFramePattern:'1_BASELINE_13_MUTED_13_RESTORED',
    eachViewGeometryExclusivePixels:true,
    viewSummaries:[{label:a.label,isolatedKeys:13,width:a.width,height:a.height},
                   {label:b.label,isolatedKeys:13,width:b.width,height:b.height}],
    scope:'CALLER_CAPTURE_AGGREGATION_ONLY',
    originalGlbDigestAuthenticated:false,productionProvenanceVerified:false,
    authenticatedLiveAutoloadVerified:false,humanReview:'NOT_RUN',
    currentGeometryClaim:false,canonicalClaim:false,asBuiltClaim:false,
  });
}
