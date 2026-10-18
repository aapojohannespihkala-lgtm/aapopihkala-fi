/** Main-only opt-in 20-target WebGL screenshot proof for exact R1125 scene64.
 * Work-test only. It cannot approve physical diameters, CURRENT or HUMAN_REVIEW.
 * No image or service-token bytes are written to logs or artifacts.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';
import {M5A_R1125_NUMBERED_CANDIDATE_ID as ID,
 M5A_R1125_NUMBERED_REVIEW_ID as REVIEW,
 M5A_R1125_NUMBERED_SOURCE as SOURCE,
 M5A_R1125_NUMBERED_SOURCE_IDS as NUMBERED} from '../../src/scripts/privateModelM5AR1125NumberedScene64Review.mjs';

const ORIGIN='https://aapopihkala.fi';
const SOURCE_URL=ORIGIN+'/private-model/work-test/'+ID+'.glb';
const OUT='test-results/m5a-r1125-scene64-production/';
const digest=buf=>createHash('sha256').update(buf).digest('hex');
export class Scene64ProofFailure extends Error {
  constructor(code){super('M5A_SCENE64_PROOF_'+code);this.code=code;}
}
const requireProof=(ok,code)=>{if(!ok)throw new Scene64ProofFailure(code);};

/** Independently derive all thirteen original keys from the exact GLB's
 * JSON node table, not from viewer-returned DOM/canvas claims.
 * The caller must first authenticate the *raw full GLB SHA-256*.
 */
export function verifyScene64OriginalNodeKeys(g){
  requireProof(g?.asset?.version==='2.0' && g.scene===64 &&
    g.scenes?.length===65 && g.nodes?.length===1222 &&
    g.meshes?.length===661 && g.scenes[64]?.nodes?.[17]===1125 &&
    g.nodes[1125]?.name==='M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',
    'ORIGINAL_13_NODE_ROOT');
  const ids=g.nodes[1125].children;
  requireProof(Array.isArray(ids) && ids.length===13 &&
    new Set(ids).size===13, 'ORIGINAL_13_NODE_IDS');
  const names=ids.map(i=>Number.isInteger(i) && i>=0 &&
    i<g.nodes.length ? g.nodes[i]?.name : null);
  requireProof(names.every(n=>typeof n==='string' && n.length>0) &&
    new Set(names).size===13, 'ORIGINAL_13_NODE_NAMES');
  return Object.freeze(names.map(name=>'original:'+name));
}

export function verifyScene64PixelProjection(projection,expectedOriginalKeys){
  requireProof(Array.isArray(expectedOriginalKeys) &&
    expectedOriginalKeys.length===13 &&
    expectedOriginalKeys.every(k=>typeof k==='string' &&
      k.startsWith('original:')) &&
    new Set(expectedOriginalKeys).size===13,
    'AUTHENTICATED_ORIGINAL_KEYS_REQUIRED');
  requireProof(projection?.sourceSceneIndex===64 &&
    projection.sourceTargetCount===20 &&
    projection.originalCount===13 && projection.numberCount===7 &&
    projection.originalGlbDigestVerifiedByLoader===true &&
    projection.productionPixelsVerified===false &&
    projection.humanReview==='NOT_RUN' &&
    Array.isArray(projection.centers) &&
    projection.centers.length===20,'SOURCE_PROJECTION');
  const keys=new Set(), originals=[], numbers=[];
  for(const center of projection.centers){
    requireProof(typeof center?.key==='string' && !keys.has(center.key) &&
      Number.isFinite(center.u) && Number.isFinite(center.v) &&
      center.u>0 && center.u<1 && center.v>0 && center.v<1 &&
      center.onScreen===true,'PROJECTED_TARGET_NOT_VISIBLE');
    keys.add(center.key);
    if(center.kind==='original' && center.key.startsWith('original:'))
      originals.push(center.key);
    else if(center.kind==='number' && center.key.startsWith('number:'))
      numbers.push(center.key.slice(7));
    else throw new Scene64ProofFailure('SOURCE_TARGET_TYPE');
  }
  requireProof(originals.length===13 && numbers.length===7 &&
    originals.every((key,i)=>key===expectedOriginalKeys[i]) &&
    NUMBERED.every((id,i)=>numbers[i]===id),'EXACT_13_PLUS_7_IDENTITIES');
  return projection.centers;
}

/** Technical pixel deltas for THREE ACTUAL PNG-derived RGBA frames.
 * This pure helper is also exercised with synthetic arrays in tests. A return
 * value cannot independently assert production source/provenance.
 */
export function verifyScene64FrameTriplet({before,hidden,restored,center,
 minChangedPixels=16,minRoiPixels=4}){
  const frames=[before,hidden,restored];
  requireProof(frames.every(f=>Number.isInteger(f?.width) &&
    Number.isInteger(f?.height) && f.width>=256 && f.height>=256 &&
    f.width*f.height<=4000000 && f.rgba instanceof Uint8Array &&
    f.rgba.length===f.width*f.height*4 &&
    f.width===before.width && f.height===before.height),
    'PNG_FRAME_SHAPE');
  requireProof(Number.isFinite(center?.u) && Number.isFinite(center?.v) &&
    center.u>0 && center.u<1 && center.v>0 && center.v<1 &&
    center.onScreen===true,'PNG_TARGET_PROJECTION');
  requireProof(Number.isInteger(minChangedPixels) && minChangedPixels>=16 &&
    Number.isInteger(minRoiPixels) && minRoiPixels>=4,'PIXEL_HARD_FLOORS');
  const w=before.width,h=before.height;
  const cx=Math.round(center.u*(w-1)),cy=Math.round(center.v*(h-1));
  const radius=Math.max(20,Math.round(Math.min(w,h)*0.065)),r2=radius*radius;
  let changed=0,roiChanged=0,restorationChanged=0;
  for(let pixel=0;pixel<w*h;pixel++){
    const offset=pixel*4;
    let delta=false,reverted=false;
    for(let channel=0;channel<4;channel++){
      delta ||= Math.abs(before.rgba[offset+channel]-hidden.rgba[offset+channel])>=24;
      // Restoration is exact, unlike the deliberately tolerant HIDE delta.\n      reverted ||= before.rgba[offset+channel]!==restored.rgba[offset+channel];
    }
    if(reverted) restorationChanged++;
    if(delta){
      changed++;
      const x=pixel%w,y=Math.floor(pixel/w);
      if((x-cx)**2+(y-cy)**2<=r2)roiChanged++;
    }
  }
  // Center ROI alone cannot prove an individual object if an unrelated
  // WebGL repaint changes most of the frame. This intentionally conservative
  // bound fails closed for long objects extending beyond the center ROI too;
  // those require a camera/geometry-specific ROI before production approval.
  const offRoiChangedPixels=changed-roiChanged;
  const offRoiHardCeiling=Math.max(512,roiChanged*12);
  requireProof(changed>=minChangedPixels && roiChanged>=minRoiPixels &&
    restorationChanged===0 && offRoiChangedPixels<=offRoiHardCeiling,
    'ORIGINAL_OBJECT_PIXEL_DELTA');
  return Object.freeze({key:center.key,changedPixels:changed,
    projectedRoiChangedPixels:roiChanged,restorationChangedPixels:0,
    offRoiChangedPixels,offRoiHardCeiling,
    roiRadiusPixels:radius,technicalRgbaEvidence:true,
    productionProvenanceVerified:false,humanReview:'NOT_RUN'});
}
export function verifyScene64OriginalGlb(bytes){
  requireProof(Buffer.isBuffer(bytes) && bytes.length===SOURCE.bytes &&
    bytes.readUInt32LE(0)===0x46546c67 &&
    bytes.readUInt32LE(4)===2 && bytes.readUInt32LE(8)===bytes.length &&
    digest(bytes)===SOURCE.sha256,'ORIGINAL_SOURCE_BINARY');
  const len=bytes.readUInt32LE(12);
  requireProof(bytes.readUInt32LE(16)===0x4e4f534a &&
    len>=100 && len%4===0 && len+20<bytes.length,
    'ORIGINAL_SOURCE_JSON_CHUNK');
  let originalSourceKeys;
  try{
    originalSourceKeys=verifyScene64OriginalNodeKeys(
      JSON.parse(bytes.subarray(20,20+len).toString('utf8')));
  }catch(e){
    if(e instanceof Scene64ProofFailure)throw e;
    throw new Scene64ProofFailure('ORIGINAL_SOURCE_JSON_PARSE');
  }
  return Object.freeze({byteLength:bytes.length,sha256:SOURCE.sha256,
    originalSourceKeys,originalSourceDigestVerified:true,
    canonical:false,asBuilt:false});
}

export async function runScene64ProductionProof({
  env=process.env,browserType,logger=()=>{},
}={}){
  const report={status:'FAIL',stage:'MAIN_ONLY',failureCode:null,
    candidateId:ID,sceneIndex:64,sourceSha256:SOURCE.sha256,
    sourceRawByteLength:SOURCE.bytes,originalSourceAuthenticated:false,
    authenticatedBrowserPixelsVerified:false,sourceTargetCount:20,
    targets:[],current:false,canonical:false,asBuilt:false,
    humanReview:'NOT_RUN'};
  let browser=null,context=null,canvas=null;
  try{
    requireProof(env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      env.GITHUB_REF==='refs/heads/main' &&
      env.GITHUB_EVENT_NAME==='workflow_dispatch' &&
      env.PROBE_MODE==='r1125-scene64-pixels','TRUSTED_MAIN_ONLY');
    requireProof(Boolean(env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID &&
      env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET),'AUTH_SECRETS');
    if(!browserType)({chromium:browserType}=await import('@playwright/test'));
    browser=await browserType.launch({headless:true});
    context=await browser.newContext({viewport:{width:1536,height:900},
      deviceScaleFactor:1});
    let sourceRequests=0,sourceVerified=false,unexpectedCurrent=0;
    let originalSourceKeys=null;
    await context.route('**/*',async route=>{
      const request=route.request(),url=request.url();
      if(!url.startsWith(ORIGIN+'/')){
        await route.continue();return;
      }
      const headers={...request.headers(),
        'cf-access-client-id':env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID,
        'cf-access-client-secret':env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET};
      if(url===ORIGIN+'/private-model/model.glb')unexpectedCurrent++;
      if(url===SOURCE_URL){
        sourceRequests++;
        try{
          const response=await route.fetch({headers,maxRedirects:0,
            maxRetries:0,timeout:30000});
          const bytes=await response.body();
          requireProof(response.status()===200,'SOURCE_HTTP');
          const verified=verifyScene64OriginalGlb(bytes);
          originalSourceKeys=verified.originalSourceKeys;
          sourceVerified=true;
          await route.fulfill({response,body:bytes});
        }catch(error){
          await route.abort();
          throw error instanceof Scene64ProofFailure ?
            error : new Scene64ProofFailure('SOURCE_REQUEST');
        }
      }else await route.continue({headers});
    });
    report.stage='AUTOLOAD';
    const page=await context.newPage();
    await page.goto(ORIGIN+'/private-model/?review='+encodeURIComponent(REVIEW),
      {waitUntil:'domcontentloaded',timeout:60000});
    canvas=page.locator('#private-model-canvas');
    await page.waitForFunction(expected=>{
      const c=document.querySelector('#private-model-canvas');
      return c?.dataset.modelSource==='work-test' &&
        c.dataset.workTestReviewAutoload==='true' &&
        c.dataset.p137eLoadedCandidateId===expected &&
        c.dataset.m5aR1125Scene64SourceVerified==='true' &&
        c.dataset.m5aR1125Scene64PixelIsolationReady==='true';
    },ID,{timeout:80000});
    requireProof(sourceRequests===1 && sourceVerified &&
      unexpectedCurrent===0,'EXACT_AUTOLOAD_PROVENANCE');
    report.originalSourceAuthenticated=true;
    const status=await canvas.evaluate(el=>({
      source:el.dataset.modelSource,
      candidate:el.dataset.p137eLoadedCandidateId,
      scene:el.dataset.m5aR1125Scene64SceneIndex,
      originals:el.dataset.m5aR1125Scene64OriginalTargetCount,
      numbered:el.dataset.m5aR1125Scene64NumberedTargetCount,
      human:el.dataset.m5aR1125Scene64HumanReview,
      pixelStatus:el.dataset.m5aR1125Scene64SourcePixelEvidence,
    }));
    requireProof(status.source==='work-test'&&status.candidate===ID &&
      status.scene==='64' && status.originals==='13' &&
      status.numbered==='7' && status.human==='NOT_RUN' &&
      status.pixelStatus==='NOT_RUN','VIEWER_NO_PROMOTION');
    const projection=await canvas.evaluate(el=>{
      if(typeof el.m5aR1125Scene64RefreshSourceProjection!=='function' ||
        typeof el.m5aR1125Scene64SetSourceVisibility!=='function' ||
        typeof el.m5aR1125Scene64Restore!=='function')
        throw Error('missing-source-isolation-capability');
      return el.m5aR1125Scene64RefreshSourceProjection();
    });
    const targets=verifyScene64PixelProjection(projection,originalSourceKeys);
    const box=await canvas.boundingBox();
    requireProof(Boolean(box)&&box.width>=256&&box.height>=256,
      'REAL_CANVAS_BOUNDS');
    const capture=async()=>decodeD1FScreenshotPng(
      await page.screenshot({clip:box,animations:'disabled'}));
    const baseline=await capture();
    report.stage='TWENTY_ORIGINAL_PIXEL_TARGETS';
    for(const center of targets){
      try{
        const hiddenState=await canvas.evaluate((key)=>
          document.querySelector('#private-model-canvas')
            .m5aR1125Scene64SetSourceVisibility(key,'HIDE'),center.key);
        requireProof(hiddenState?.activeHiddenCount===1 &&
          hiddenState?.productionPixelsVerified===false,
          'HIDE_SOURCE_TARGET');
        await page.waitForTimeout(100);
        const hidden=await capture();
        const restoredState=await canvas.evaluate((key)=>
          document.querySelector('#private-model-canvas')
            .m5aR1125Scene64SetSourceVisibility(key,'RESTORE'),center.key);
        requireProof(restoredState?.activeHiddenCount===0,
          'RESTORE_SOURCE_TARGET');
        await page.waitForTimeout(100);
        const restored=await capture();
        const pixels=verifyScene64FrameTriplet({
          before:baseline,hidden,restored,center});
        report.targets.push({key:center.key,changedPixels:pixels.changedPixels,
          roiChangedPixels:pixels.projectedRoiChangedPixels,
          restoredPixels:pixels.restorationChangedPixels});
      }finally{
        await canvas.evaluate(el=>el.m5aR1125Scene64Restore?.())
          .catch(()=>{});
      }
    }
    requireProof(report.targets.length===20 &&
      report.targets.every(x=>x.changedPixels>=16&&x.roiChangedPixels>=4 &&
        x.restoredPixels===0),'TWENTY_SOURCE_PIXEL_COMPLETENESS');
    report.status='PASS';
    report.stage='COMPLETE';
    report.authenticatedBrowserPixelsVerified=true;
    logger('M5A scene64: 20 real source-target pixel deltas and restoration verified');
  }catch(error){
    report.failureCode=error instanceof Scene64ProofFailure ?
      error.code:'BROWSER_OR_UNEXPECTED_FAILURE';
  }finally{
    if(canvas)await canvas.evaluate(el=>el.m5aR1125Scene64Restore?.())
      .catch(()=>{});
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    mkdirSync(OUT,{recursive:true});
    writeFileSync(OUT+'source64-original-target-pixels.json',
      JSON.stringify(report,null,2)+'\n');
  }
  return report;
}
if(process.argv[1]?.endsWith('private-model-m5a-scene64-production-probe.mjs')){
  const report=await runScene64ProductionProof({logger:message=>console.log(message)});
  if(report.status!=='PASS'){
    console.error('M5A scene64 production pixel proof FAIL: '+report.failureCode);
    process.exitCode=1;
  }
}
