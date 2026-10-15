import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {D1F_WC_THEMO_ID,D1F_WC_THEMO_ASSET,D1F_WC_THEMO_TARGETS} from '../../src/scripts/privateModelD1FWcThemoContract.mjs';
import {D1F_WC_THEMO_SUPPRESSION} from '../../src/scripts/privateModelD1FBathroomPixelRuntime.mjs';
import {evaluateD1FWcThemoTargetPixelGate,evaluateD1FBathroomTargetPixelGate,evaluateD1FOneMeasuredTargetPixelSample} from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';
function sample(targetId:string){
 const a=new Uint8Array(64*64*4).fill(60),b=a.slice();
 for(let y=20;y<32;y++)for(let x=20;x<32;x++)b[4*(y*64+x)]=200;
 const f={width:64,height:64,cameraFingerprint:'fixed-source-camera',glbSha256:D1F_WC_THEMO_ASSET.sha256,variant:'WEST_ANCHOR_725_895_740'};
 return {targetId,baseline:{...f,rgba:a},suppressed:{...f,rgba:b},roi:{x:20,y:20,width:12,height:12},suppressionMethod:D1F_WC_THEMO_SUPPRESSION[targetId],targetIdentityVerified:true,roiProvenance:'PROJECTED_EXACT_TARGET_GEOMETRY',suppressionRestored:true};
}
test('WC/Themo release requires all seventeen distinct targets and cannot reuse thirteen-target bathroom proof',()=>{
 const all=D1F_WC_THEMO_TARGETS.map(sample),o={candidateId:D1F_WC_THEMO_ID};
 expect(evaluateD1FWcThemoTargetPixelGate(all,o)).toMatchObject({checkedTargetCount:17,humanReview:'NOT_RUN',actualBrowserWebGlVerifiedByThisFunction:false});
 for(let i=0;i<all.length;i++)expect(()=>evaluateD1FWcThemoTargetPixelGate(all.filter((_,j)=>i!==j),o)).toThrow();
 expect(()=>evaluateD1FWcThemoTargetPixelGate([...all.slice(0,16),all[0]],o)).toThrow();
 expect(()=>evaluateD1FBathroomTargetPixelGate(all.slice(0,13),o)).toThrow();
});
test('each WC/Themo differential rejects old source, changed camera, broad suppression and failed restoration',()=>{
 const o={candidateId:D1F_WC_THEMO_ID};
 for(const target of ['WC_ENCLOSURE','THEMO_LOBBY','THEMO_BEDROOM','THEMO_BATHROOM']){
  expect(evaluateD1FOneMeasuredTargetPixelSample(sample(target),o).changedOutside).toBe(0);
  for(const mutate of [(s:any)=>s.baseline.glbSha256='0'.repeat(64),(s:any)=>s.suppressed.cameraFingerprint='another-camera',(s:any)=>s.suppressionMethod='WHOLE_SCENE_HIDDEN',(s:any)=>s.suppressionRestored=false,(s:any)=>s.suppressed.rgba=s.baseline.rgba.slice()]){
   const s=sample(target);mutate(s);expect(()=>evaluateD1FOneMeasuredTargetPixelSample(s,o)).toThrow();
  }
 }
});
test('the trusted render requires three independent viewing angles for each Themo',()=>{
 const script=readFileSync('.github/scripts/private-model-d1f-measured-production-probe.mjs','utf8');
 expect(script).toContain("requiredViews=WC_THEMO&&targetId.startsWith('THEMO_')?3:1");
 expect(script).toContain('check(accepted===requiredViews)');
 expect(script).toContain('themoAngleProofs.length===9');
 expect(script).toContain('evaluateD1FOneMeasuredTargetPixelSample(sample,{candidateId:ID})');
});
