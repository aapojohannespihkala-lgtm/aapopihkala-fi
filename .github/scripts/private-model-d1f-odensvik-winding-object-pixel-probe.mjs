/**
 * Authenticated production WebGL proof for the *corrected* 116-scene ODENSVIK
 * source; never accepts the older 112-scene/generic orbit proof.
 * The browser toggles only the loaded glTF source node objects, not proxies.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';
import {
  D1F_ODENSVIK_WINDING_CANDIDATE_ID as CANDIDATE,
  D1F_ODENSVIK_WINDING_REVIEW_ID as REVIEW,
  D1F_ODENSVIK_WINDING_VARIANTS as VARIANTS,
  D1F_ODENSVIK_WINDING_SOURCE as SOURCE,
} from '../../src/scripts/privateModelD1FOdensvikWindingReview.mjs';

const ORIGIN='https://aapopihkala.fi';
const OUT='test-results/d1f-odensvik-winding-original-object-pixels';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=reason=>{throw new Error('D1F_ODENSVIK_WINDING_PIXEL_REJECTED:'+reason);};
const requireProof=(value,reason)=>{if(!value)fail(reason);};
export const ORIGINAL_OBJECT_KINDS=Object.freeze(['BOWL','COUNTER','CABINET']);

export function exactCorrectedWindingReviewUrl(variant) {
  requireProof(VARIANTS.some(v=>v.variant===variant) &&
    VARIANTS.map(v=>v.sceneIndex).join(',')==='112,113,114,115',
    'unknown-corrected-scene');
  return ORIGIN+'/private-model/?review='+REVIEW+'&wallVariant='+variant;
}

/** Whole-frame object-suppression difference, not colored-background or orbit evidence. */
export function countCorrectedWindingObjectPixels(before,hidden,threshold=48) {
  requireProof(before?.rgba instanceof Uint8Array &&
    hidden?.rgba instanceof Uint8Array &&
    Number.isInteger(before.width) && Number.isInteger(before.height) &&
    before.width>100 && before.height>100 &&
    before.width*before.height<=4000000 &&
    before.width===hidden.width && before.height===hidden.height &&
    before.rgba.length===before.width*before.height*4 &&
    hidden.rgba.length===before.rgba.length &&
    Number.isInteger(threshold)&&threshold>=16&&threshold<=160,
    'invalid-real-screenshot-pair');
  let changed=0;
  for(let p=0;p<before.rgba.length;p+=4) {
    const rgb=Math.abs(before.rgba[p]-hidden.rgba[p])+
      Math.abs(before.rgba[p+1]-hidden.rgba[p+1])+
      Math.abs(before.rgba[p+2]-hidden.rgba[p+2]);
    if(rgb>threshold)changed++;
  }
  return changed;
}

/**
 * Negative guard against global camera/background drift being misread as
 * a single-object HIDE. This is a spatial-locality check, NOT a geometry-
 * projected source ROI; it cannot establish production source-bound pixels.
 */
export function requireCorrectedWindingLocalizedPixels(before,hidden,threshold=48) {
  const changed=countCorrectedWindingObjectPixels(before,hidden,threshold);
  let left=before.width,top=before.height,right=-1,bottom=-1,observed=0;
  for(let y=0;y<before.height;y++)for(let x=0;x<before.width;x++){
    const p=(y*before.width+x)*4;
    const rgb=Math.abs(before.rgba[p]-hidden.rgba[p])+
      Math.abs(before.rgba[p+1]-hidden.rgba[p+1])+
      Math.abs(before.rgba[p+2]-hidden.rgba[p+2]);
    if(rgb>threshold) {
      observed++;
      left=Math.min(left,x);right=Math.max(right,x);
      top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
  }
  requireProof(changed===observed&&changed>=96,'no-localized-object-difference');
  const frameArea=before.width*before.height;
  const boxArea=(right-left+1)*(bottom-top+1);
  const changedFraction=changed/frameArea,footprintFraction=boxArea/frameArea;
  const occupiedFraction=changed/boxArea;
  // Suppressing one original source node must not repaint a large portion of
  // the viewport or scatter changes across a sparse whole-frame footprint.
  requireProof(changedFraction<=0.35&&footprintFraction<=0.55&&
    occupiedFraction>=0.12,'global-or-scattered-frame-drift');
  return Object.freeze({changed,roi:{x:left,y:top,width:right-left+1,
    height:bottom-top+1},changedFraction,footprintFraction,
    occupiedFraction,sourceProjectedRoiVerified:false});
}

export async function runCorrectedWindingObjectPixelProbe() {
  const variant=process.env.D1F_ODENSVIK_VARIANT;
  const evidence={
    result:'FAIL',phase:'TRUSTED_MAIN',variant,origin:ORIGIN,
    candidateId:CANDIDATE,sceneIndex:null,expectedSourceBytes:SOURCE.bytes,
    expectedSourceSha256:SOURCE.sha256,sourceNetworkHashMatch:false,
    oneLinkAutoload:false,sourceObjectPixelProof:{},allObjectPixelsVerified:false,
    humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false,
  };
  let browser;
  fs.mkdirSync(OUT,{recursive:true});
  const key=String(variant??'invalid').replace(/[^a-zA-Z0-9_-]/g,'');
  try{
    requireProof(process.env.GITHUB_EVENT_NAME==='workflow_dispatch' &&
      process.env.GITHUB_REF==='refs/heads/main' &&
      process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      process.env.PROBE_MODE==='d1f-odensvik-winding-pixels',
      'untrusted-ref-or-mode');
    const url=exactCorrectedWindingReviewUrl(variant);
    const chosen=VARIANTS.find(v=>v.variant===variant);
    evidence.sceneIndex=chosen.sceneIndex;
    requireProof(SOURCE.bytes===8899324 &&
      SOURCE.sha256==='e9cbdd7dbebeab78d57939f8758c5cb467f481d79f6bb1550f5e35f09344a1bb',
      'source-contract-drift');
    const id=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const secret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    requireProof(Boolean(id&&secret),'missing-readonly-viewer-identity');
    const path='/private-model/work-test/'+CANDIDATE+'.glb';
    evidence.phase='AUTHENTICATED_ONE_LINK';
    browser=await chromium.launch({headless:true});
    const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await ctx.route('**/*',route=>{
      const request=route.request();
      if(new URL(request.url()).origin!==ORIGIN)return route.abort();
      return route.continue({headers:{...request.headers(),
        'CF-Access-Client-Id':id,'CF-Access-Client-Secret':secret}});
    });
    const page=await ctx.newPage();
    page.setDefaultTimeout(45000);
    const responses=[];
    page.on('response',response=>{
      if(response.url()===ORIGIN+path)responses.push(response);
    });
    const nav=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    requireProof(nav?.status()===200 && page.url()===url &&
      nav.headers()['content-type']?.includes('text/html'),
      'wrong-production-page');
    const canvas=page.locator('#private-model-canvas');
    const expected={
      modelSource:'work-test',
      workTestReviewAutoload:'true',
      workTestReviewCandidate:CANDIDATE,
      workTestReviewMode:REVIEW,
      d1fOdensvikWindingVariant:variant,
      d1fOdensvikWindingSceneIndex:String(chosen.sceneIndex),
      d1fOdensvikWindingRawBytes:String(SOURCE.bytes),
      d1fOdensvikWindingRawSha256:SOURCE.sha256,
      d1fOdensvikWindingSourceAuthenticated:'true',
      d1fOdensvikWindingSourceTargetCount:'40',
      d1fOdensvikWindingObjectBinding:'BOWL,COUNTER,CABINET',
      d1fOdensvikWindingWorkTest:'true',
      d1fOdensvikWindingProductionPixelsVerified:'false',
      d1fOdensvikWindingHumanReview:'NOT_RUN',
      d1fOdensvikWindingCurrent:'false',
      d1fOdensvikWindingCanonical:'false',
      d1fOdensvikWindingAsBuilt:'false',
    };
    await page.waitForFunction(want=>{
      const el=document.querySelector('#private-model-canvas');
      return el && Object.entries(want).every(([key,value])=>el.dataset[key]===value) &&
        typeof el.d1fOdensvikWindingSourceVisibility==='function';
    },expected,{timeout:45000});
    evidence.oneLinkAutoload=true;
    evidence.phase='PRODUCTION_SOURCE_BYTES';
    requireProof(responses.length===1 && responses[0].status()===200,
      'not-single-exact-source-GLB');
    const raw=await responses[0].body();
    requireProof(raw.length===SOURCE.bytes&&sha(raw)===SOURCE.sha256 &&
      raw.subarray(0,4).toString()==='glTF','production-source-hash-mismatch');
    evidence.sourceNetworkHashMatch=true;
    evidence.phase='TRUE_SOURCE_OBJECT_PIXEL_DIFF';
    requireProof(await canvas.evaluate(el=>Boolean(
      el.getContext('webgl2')||el.getContext('webgl'))),'no-WebGL');
    const frame=async(label)=>{
      await page.evaluate(()=>new Promise(done=>
        requestAnimationFrame(()=>requestAnimationFrame(done))));
      const png=await canvas.screenshot({animations:'disabled',timeout:25000});
      requireProof(png.length>100 && png.subarray(1,4).toString()==='PNG',
        'invalid-browser-frame');
      const decoded=decodeD1FScreenshotPng(png);
      requireProof(decoded.width>200&&decoded.height>200&&
        decoded.rgba instanceof Uint8Array,'invalid-PNG-image');
      fs.writeFileSync(OUT+'/'+key+'-'+label+'.png',png);
      return {...decoded,pngSha256:sha(png)};
    };
    const sourceVisible=await frame('all-original-objects-visible');
    for(const kind of ORIGINAL_OBJECT_KINDS){
      const toggled=await canvas.evaluate((el,target)=>
        el.d1fOdensvikWindingSourceVisibility(target,'HIDE'),kind);
      requireProof(toggled?.kind===kind && toggled.operation==='HIDE' &&
        toggled.hiddenCount===1 && toggled.humanReview==='NOT_RUN',
        'not-identified-original-object-suppressed-'+kind);
      const hidden=await frame(kind.toLowerCase()+'-original-hidden');
      const localProof=requireCorrectedWindingLocalizedPixels(sourceVisible,hidden);
      const hiddenPixels=localProof.changed;
      const restored=await canvas.evaluate((el,target)=>
        el.d1fOdensvikWindingSourceVisibility(target,'RESTORE'),kind);
      requireProof(restored?.kind===kind&&restored.operation==='RESTORE'&&
        restored.hiddenCount===0&&restored.humanReview==='NOT_RUN',
        'not-restored-original-object-'+kind);
      const restoredImage=await frame(kind.toLowerCase()+'-original-restored');
      const remainingPixels=countCorrectedWindingObjectPixels(sourceVisible,restoredImage);
      evidence.sourceObjectPixelProof[kind]={
        hiddenPixels,spatialLocality:localProof,restoreResidualPixels:remainingPixels,
        baselineSha256:sourceVisible.pngSha256,
        hiddenSha256:hidden.pngSha256,
        restoredSha256:restoredImage.pngSha256,
        sourceSpecificOriginal:true,
        threshold:48,
        passed:hiddenPixels>=96 &&
          remainingPixels<=Math.max(96,Math.floor(hiddenPixels*0.12)),
      };
      requireProof(evidence.sourceObjectPixelProof[kind].passed,
        'insufficient-source-original-object-pixels-'+kind);
    }
    requireProof(responses.length===1,'unexpected-repeat-source-network-load');
    evidence.allObjectPixelsVerified=true;
    evidence.result='PASS_AUTHENTICATED_EXACT_SOURCE_AND_THREE_REAL_OBJECT_PIXELS';
    evidence.phase='COMPLETE';
  }catch(e){
    evidence.errorCode=String(e?.message??e).slice(0,220);
    process.exitCode=1;
  }finally{
    if(browser)await browser.close().catch(()=>{});
    fs.writeFileSync(OUT+'/'+key+'-evidence.json',JSON.stringify(evidence,null,2)+'\n');
    console.log(JSON.stringify(evidence));
  }
  return evidence;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)
  await runCorrectedWindingObjectPixelProbe();
