import { test, expect } from '@playwright/test';
// @ts-ignore - focused noncanonical pure pixel gate uses the existing ES module contract.
import { evaluateD1FShowerGlassPixelEvidence, D1F_SHOWER_GLASS_PARTS } from '../../src/scripts/privateModelD1FShowerGlassPixelEvidence.mjs';
// @ts-ignore - immutable 124-scene source has independent GLB SHA and variant tests.
import { D1F_SHOWER_PHOTO_SOURCE, D1F_SHOWER_PHOTO_VARIANTS } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const error='D1F_SHOWER_GLASS_PIXEL_GATE_REJECTED';
const width=48,height=48;
const frames=(variant:any,index:number,p:number)=>{
  const cameraFingerprint='camera-shower-source-'+index;
  const info={width,height,sceneIndex:index,variant,cameraFingerprint,
    sourceSha256:D1F_SHOWER_PHOTO_SOURCE.sha256};
  const baseline=new Uint8Array(width*height*4).fill(120);
  const suppressed=baseline.slice(),restored=baseline.slice();
  const roi={x:2+p*15,y:16,width:12,height:12};
  for(let y=roi.y;y<roi.y+roi.height;y++)for(let x=roi.x;x<roi.x+roi.width;x++){
    const i=4*(y*width+x);suppressed[i]=181;
  }
  return {cameraFingerprint,roi,frames:{
    baseline:{...info,rgba:baseline},suppressed:{...info,rgba:suppressed},
    restored:{...info,rgba:restored}}};
};
function fixture(){
  return D1F_SHOWER_PHOTO_VARIANTS.flatMap((v:any)=>D1F_SHOWER_GLASS_PARTS.map((part:any,p:number)=>({
    candidateId:'d1f-shower-glass-photo-20261016',
    sourceSha256:D1F_SHOWER_PHOTO_SOURCE.sha256,sourceBytes:D1F_SHOWER_PHOTO_SOURCE.bytes,
    variant:v.name,sceneIndex:v.sceneIndex,rootNode:v.rootNode,glassNode:v.glassNode,
    meshIndex:777,primitiveIndex:part.primitiveIndex,part:part.part,
    targetIsolationMethod:'SOURCE_GLTF_MESH_777_PRIMITIVE_'+part.primitiveIndex+'_ONLY',
    targetIdentityVerified:true,singlePrimitiveSuppressionVerified:true,
    sameCameraVerified:true,suppressionRestoredVerified:true,
    roiProvenance:'PROJECTED_EXACT_GLASS_PRIMITIVE_GEOMETRY',
    ...frames(v.name,v.sceneIndex,p),
  })));
}
test('requires all four exact source scenes and 12 separate visible parts without human approval',()=>{
  const out=evaluateD1FShowerGlassPixelEvidence(fixture());
  expect(out).toMatchObject({result:'PASS_TWELVE_SUPPLIED_OBJECT_DIFFERENTIALS_ONLY',
    checkedSourceScenes:4,checkedSeparateGlassSubparts:12,
    rawGlbAuthenticatedByThisFunction:false,
    authenticatedProductionBrowserVerifiedByThisFunction:false,
    screenshotOriginAuthenticatedByThisFunction:false,
    humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false});
  expect(out.sceneIndices).toEqual([120,121,122,123]);
  expect(new Set(out.samples.map((x:any)=>x.variant+':'+x.part)).size).toBe(12);
  expect(out.samples.every((x:any)=>x.changedInsideTarget>=10 &&
    x.changedOutsideTarget===0 && x.restoredPixelDrift===0)).toBe(true);
});
test('missing, extra and duplicated glass primitive samples fail closed',()=>{
  const f=fixture();
  expect(()=>evaluateD1FShowerGlassPixelEvidence(f.slice(1))).toThrow(error);
  expect(()=>evaluateD1FShowerGlassPixelEvidence([...f,f[0]])).toThrow(error);
  expect(()=>evaluateD1FShowerGlassPixelEvidence([...f.slice(0,11),f[0]])).toThrow(error);
});
test('wrong archived source candidate, hash and declared bytes never pass',()=>{
  for(const change of [
    (f:any[])=>f[0].candidateId='current',
    (f:any[])=>f[0].sourceSha256='f'.repeat(64),
    (f:any[])=>f[0].sourceBytes=1,
    (f:any[])=>f[0].frames.baseline.sourceSha256='f'.repeat(64),
  ]) {const f=fixture();change(f);expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);}
});
test('different scene, glass root, primitive and suppression identity fail',()=>{
  for(const change of [
    (f:any[])=>f[0].sceneIndex=119,
    (f:any[])=>f[0].rootNode=1,
    (f:any[])=>f[0].glassNode=2460,
    (f:any[])=>f[0].primitiveIndex=2,
    (f:any[])=>f[0].meshIndex=5,
    (f:any[])=>f[0].targetIsolationMethod='WHOLE_SCENE_HIDDEN',
  ]) {const f=fixture();change(f);expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);}
});
test('false claim of provenance, restored visibility or independent target isolation fails',()=>{
  for(const change of [
    (f:any[])=>f[0].roiProvenance='MANUAL_ROI',
    (f:any[])=>f[0].targetIdentityVerified=false,
    (f:any[])=>f[0].singlePrimitiveSuppressionVerified=false,
    (f:any[])=>f[0].sameCameraVerified=false,
    (f:any[])=>f[0].suppressionRestoredVerified=false,
  ]) {const f=fixture();change(f);expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);}
});
test('missing panes, low-contrast pane and false metal pixels fail',()=>{
  for(const change of [
    (f:any[])=>f[0].frames.suppressed.rgba.set(f[0].frames.baseline.rgba),
    (f:any[])=>{const a=f[0].frames.suppressed.rgba,b=f[0].frames.baseline.rgba;for(let i=0;i<a.length;i++)a[i]=b[i]+4;},
    (f:any[])=>f[2].frames.suppressed.rgba.set(f[2].frames.baseline.rgba),
  ]) {const f=fixture();change(f);expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);}
});
test('different camera in a suppressed screenshot cannot count as unchanged camera',()=>{
  const f=fixture();f[0].frames.suppressed.cameraFingerprint='different-camera';
  expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);
});
test('baseline must remain identical across all three parts of each scene',()=>{
  const f=fixture();f[1].frames.baseline.rgba[2]=202;
  expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);
});
test('whole-scene pixel change outside projected target ROI is rejected',()=>{
  const f=fixture();const s=f[0].frames.suppressed.rgba;
  for(let i=0;i<width*height*4;i+=4)s[i]=240;
  expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);
});
test('damaged or unrestored glass visibility is rejected',()=>{
  const f=fixture();f[0].frames.restored.rgba[4*(20*width+5)]=140;
  expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);
});
test('clipped, implausibly small or generic ROI is rejected',()=>{
  for(const change of [
    (f:any[])=>f[0].roi={x:44,y:16,width:12,height:12},
    (f:any[])=>f[0].roi={x:2,y:16,width:1,height:12},
    (f:any[])=>f[0].roi={x:0,y:0,width:48,height:48},
  ]){const f=fixture();change(f);expect(()=>evaluateD1FShowerGlassPixelEvidence(f)).toThrow(error);}
});
