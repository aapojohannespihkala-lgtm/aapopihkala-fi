/** Main-only opt-in P186E historical label two-floor real production renderer smoke.
 * Original GLB authentication, source readiness and 34 selective hide/restore frames.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import {
  p186ePixelCandidateId, p186ePixelExpected,
  p186ePixelSourcePdfDriveId, p186ePixelSchedulePdfDriveId,
  verifyP186E34SourcePixelEvidence,
} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';
import {deriveP186EOriginalRoster,captureP186EIndividualFloor,
  P186EIndividualCaptureFailure} from './private-model-p186e-individual-capture.mjs';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';
import {deriveP186EOriginalCaptionRoster,verifyP186ECaptionFrame,verifyP186ECuesWithCaptions,P186ECaptionFailure}
  from '../../src/scripts/privateModelP186ECaptionPixelEvidence.mjs';

const ORIGIN = 'https://aapopihkala.fi';
const OUT = 'test-results/p186e-production-twofloor';
const sha256 = value => createHash('sha256').update(value).digest('hex');
class P186EProductionFailure extends Error {}
const reject = code => { throw new P186EProductionFailure('P186E_PROD_' + code); };
const need = (condition, code) => { if (!condition) reject(code); };
// Emit only fixed technical classes. Browser error text can contain request
// details and credentials, so never copy it into logs or the evidence artifact.
export function classifyP186EProductionFailure(error) {
  if (error instanceof P186EProductionFailure || error instanceof P186EIndividualCaptureFailure ||
      error instanceof P186ECaptionFailure) return error.message;
  const message=String(error?.message||'');
  for(const [pattern,code] of [
    [/evicted from inspector cache/i,'BROWSER_RESOURCE_EVICTED'],
    [/No (?:data|resource) (?:found )?for resource with given identifier|No resource with given identifier/i,'BROWSER_RESOURCE_UNAVAILABLE'],
    [/transferred.*offscreen|offscreen.*transferred/i,'BROWSER_OFFSCREEN_CONTEXT'],
    [/Function statements require a function name|Passed function is not well-serializable/i,'BROWSER_CALLBACK_SERIALIZATION'],
    [/Execution context was destroyed/i,'BROWSER_EXECUTION_CONTEXT_DESTROYED'],
    [/Target page, context or browser has been closed|Target closed/i,'BROWSER_TARGET_CLOSED'],
    [/Timeout.*exceeded|timed out/i,'BROWSER_TIMEOUT'],
    [/SecurityError|Tainted canvases/i,'BROWSER_SECURITY'],
    [/TypeError:/i,'BROWSER_TYPE_ERROR'],
  ]) if(pattern.test(message)) return 'P186E_PROD_'+code;
  return 'UNEXPECTED_BROWSER_OR_SOURCE_FAILURE';
}
export const P186E_PRODUCTION_FLOORS = Object.freeze(['D1F', 'D2F']);
// Consumer of the immutable raw Drive artifact, independently hashed 2026-10-16.
// Never infer source authentication from the canvas dataset or a screenshot.
export const P186E_PRODUCTION_SOURCE = Object.freeze({
  driveFileId:'1xBP1B3AYnNaQ9Xw9H5hI66SpDR_XyZgs',
  byteLength:3217892,
  sha256:'a92cecbdb419048ca985bbc91663f7c511929924bf889cabc8cc3847602dacb5',
  url:ORIGIN+'/private-model/work-test/'+p186ePixelCandidateId+'.glb',
});

function verifyP186ESourceResponseMetadata(response) {
  need(response && response.url()===P186E_PRODUCTION_SOURCE.url &&
    response.status()===200,'ORIGINAL_GLB_RESPONSE');
  const contentType=response.headers()['content-type']?.split(';')[0].trim();
  need(contentType==='model/gltf-binary' || contentType==='application/octet-stream',
    'ORIGINAL_GLB_CONTENT_TYPE');
}

// Read the response of the same intercepted browser request before delivering
// its identical bytes to the viewer. No independent URL fetch or redirect.
export async function captureP186EProductionSourceRequest(route,headers) {
  const response=await route.fetch({headers,maxRedirects:0,maxRetries:0,timeout:25000});
  try {return {request:route.request(),response,bytes:await response.body()};}
  catch(error){await response.dispose().catch(()=>{});throw error;}
}

export async function verifyP186EProductionSourceResponse(response) {
  verifyP186ESourceResponseMetadata(response);
  const bytes=await response.body();
  need(Buffer.isBuffer(bytes) && bytes.length===P186E_PRODUCTION_SOURCE.byteLength,
    'ORIGINAL_GLB_SIZE');
  need(bytes.readUInt32LE(0)===0x46546c67 && bytes.readUInt32LE(4)===2 &&
    bytes.readUInt32LE(8)===bytes.length,'ORIGINAL_GLB_HEADER');
  need(sha256(bytes)===P186E_PRODUCTION_SOURCE.sha256,'ORIGINAL_GLB_DIGEST');
  return {...P186E_PRODUCTION_SOURCE,originalSourceGlbDigestVerified:true};
}

function verifyP186EAutoloadRequests(requests,responses) {
  need(requests.length===1 && requests[0]===P186E_PRODUCTION_SOURCE.url &&
    responses.length===1,'ORIGINAL_GLB_AUTOLOAD');
}

export function expectedP186EProductionDataset(floor) {
  const expected = p186ePixelExpected[floor];
  need(Boolean(expected), 'FLOOR');
  const d2f = floor === 'D2F';
  return Object.freeze({
    modelSource:'work-test', workTestReviewAutoload:'true',
    workTestReviewCandidate:p186ePixelCandidateId,
    workTestReviewMode:p186ePixelCandidateId + '-review',
    p186eReviewVariant:floor,
    p186eReviewTargetRenderableCount:String(expected.total),
    p186eReviewGroupTargetCount:String(expected.group),
    p186eReviewSpecialTargetCount:String(expected.special),
    p186eReviewSemanticViolationCount:'0',
    p186eSourceContextReady:'true',
    p186ePositionSourcePdfDriveId:p186ePixelSourcePdfDriveId,
    p186eSchedulePdfDriveId:p186ePixelSchedulePdfDriveId,
    p186ePresentationOnly:'true', p186eDeviceGeometryClaim:'false',
    p186eSocketGeometryClaim:'false', p186eSwitchOrFixtureClaim:'false',
    p186ePhysicalCableRouteClaim:'false', p186eConnectionTopologyClaim:'false',
    p186eExactCurrentXYClaim:'false', p186eExactZClaim:'false',
    p186eCurrentClaim:'false', p186eAsBuiltClaim:'false',
    p186eCanonical:'false', p186ePublishToCurrent:'false',
    p186eHumanReview:'NOT_RUN', contentScene:'full-model',
    contentFloor:d2f?'2F':'1F', standardViewPreset:d2f?'d-2f':'d-1f',
  });
}

export function validateP186EProductionDataset(floor, data) {
  const expected = expectedP186EProductionDataset(floor);
  need(data !== null && typeof data === 'object' &&
    Object.entries(expected).every(([key,value])=>data[key]===value),
    'DATASET_SOURCE_OR_PROMOTION');
  need(Number.isSafeInteger(Number(data.p186eReviewContextRenderableCount)) &&
    Number(data.p186eReviewContextRenderableCount)>0,
    'DRAWABLE_ARCHITECTURE_CONTEXT');
  return {floor,sourceLabels:p186ePixelExpected[floor].total,
    groups:p186ePixelExpected[floor].group,
    special:p186ePixelExpected[floor].special,
    noPromotion:true};
}

export function countP186EFramePixels(rgba, width, height) {
  need(Number.isSafeInteger(width) && Number.isSafeInteger(height) &&
    width>=32 && height>=32 && width*height<=4000000 &&
    rgba instanceof Uint8Array && rgba.length===width*height*4, 'RGBA');
  let nonBackground=0, amber=0;
  for(let i=0;i<rgba.length;i+=4){
    const r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3];
    if(a>=200 && Math.max(Math.abs(r-32),Math.abs(g-42),Math.abs(b-52))>=24)
      nonBackground++;
    if(a>=200 && r>=145 && g>=85 && b<=165 && r-g>=18 && g-b>=18)
      amber++;
  }
  return {width,height,nonBackgroundPixels:nonBackground,
    aggregateAmberPixels:amber,individuallyIsolatedTargetsVerified:0};
}

// Dependency injection exercises this exact production call path without Access
// secrets in PR tests. The CLI below always uses the real browser and environment.
export async function runP186EProductionProbe({
  env=process.env,browserType=chromium,outputDirectory=OUT,logger=console.log,
}={}){
  const report={result:'FAIL',stage:'TRUSTED_MAIN',
    failureCode:null,
    reviewCandidate:p186ePixelCandidateId,sourcePdfId:p186ePixelSourcePdfDriveId,
    schedulePdfId:p186ePixelSchedulePdfDriveId,views:[],sourceGlbChecks:[],individualCaptures:[],
    authenticatedBrowserProbe:false,originalSourceGlbDigestVerified:false,
    all34IndividuallyVerified:false,all34CaptionGlyphsVerified:false,captionChecks:[],productionPublishedByThisProbe:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN'};
  let browser;
  const bounded = async (action,timeout=45000)=>{
    let timer;
    try {return await Promise.race([Promise.resolve().then(action),
      new Promise((_,rejectTimeout)=>{timer=setTimeout(
        ()=>rejectTimeout(new P186EProductionFailure('P186E_PROD_STAGE_DEADLINE')),timeout);})]);}
    finally {clearTimeout(timer);}
  };
  try{
    need(env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi'
      && env.GITHUB_REF==='refs/heads/main'
      && env.GITHUB_EVENT_NAME==='workflow_dispatch'
      && env.PROBE_MODE==='p186e-labels-render','MAIN_ONLY');
    const clientId=env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const clientSecret=env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    need(Boolean(clientId && clientSecret),'AUTH_CONFIGURATION');
    report.stage='BROWSER_INIT';
    browser=await bounded(()=>browserType.launch({headless:true}),30000);
    const context=await bounded(()=>browser.newContext({
      viewport:{width:1920,height:1200},deviceScaleFactor:1,
    }),15000);
    const sourceCaptures=[];
    let sourceCaptureError,resolveSourceFailure;
    // Never send Cloudflare service credentials to a third-party origin.
    await context.route('**/*',async route=>{
      if(new URL(route.request().url()).origin!==ORIGIN)return route.abort();
      const headers={...route.request().headers(),
        'CF-Access-Client-Id':clientId,
        'CF-Access-Client-Secret':clientSecret};
      if(route.request().url()!==P186E_PRODUCTION_SOURCE.url)
        return route.continue({headers});
      let capture;
      try{
        capture=await captureP186EProductionSourceRequest(route,headers);
        const response=capture.response;
        const sourceGlb=await verifyP186EProductionSourceResponse({
          url:()=>response.url(),status:()=>response.status(),
          headers:()=>response.headers(),body:async()=>capture.bytes,
        });
        sourceCaptures.push({request:capture.request,sourceGlb,
          roster:deriveP186EOriginalRoster(capture.bytes),
          captionRoster:deriveP186EOriginalCaptionRoster(capture.bytes)});
        await route.fulfill({response,body:capture.bytes});
      }catch(error){
        sourceCaptureError=error;
        resolveSourceFailure?.();
        await route.abort().catch(()=>{});
      }finally{
        if(capture)await capture.response.dispose().catch(()=>{});
      }
    });
    const page=await bounded(()=>context.newPage(),15000);
    const canvas=page.locator('#private-model-canvas');
    const glbRequests=[],sourceResponses=[];
    page.on('request',request=>{
      if(/\.glb$/i.test(new URL(request.url()).pathname))glbRequests.push(request.url());
    });
    page.on('response',response=>{
      if(response.url()===P186E_PRODUCTION_SOURCE.url)sourceResponses.push(response);
    });
    const individualSessions=[];
    for(const floor of P186E_PRODUCTION_FLOORS){
      glbRequests.length=0;sourceResponses.length=0;
      sourceCaptures.length=0;sourceCaptureError=null;
      const sourceFailure=new Promise(resolve=>{resolveSourceFailure=resolve;});
      const url=ORIGIN+'/private-model/?review='+
        encodeURIComponent(p186ePixelCandidateId+'-review')+
        '&floor='+floor.toLowerCase();
      report.stage='VIEWER_NAVIGATION_'+floor;
      const response=await bounded(()=>page.goto(url,{
        waitUntil:'domcontentloaded',timeout:45000}),50000);
      need(response?.status()===200 && page.url()===url
        && response.headers()['content-type']?.includes('text/html'),
        'EXACT_VIEWER_RESPONSE');
      report.stage='ORIGINAL_SOURCE_SCENE_'+floor;
      const expected=expectedP186EProductionDataset(floor);
      await Promise.race([page.waitForFunction(required=>{
        const data=document.querySelector('#private-model-canvas')?.dataset;
        return data&&Object.entries(required).every(([k,v])=>data[k]===v);
      },expected,{timeout:60000}),sourceFailure]);
      if(sourceCaptureError){
        report.stage='ORIGINAL_SOURCE_GLB_'+floor;
        throw sourceCaptureError;
      }
      const data=await bounded(()=>canvas.evaluate(element=>({...element.dataset})),10000);
      const identity=validateP186EProductionDataset(floor,data);
      report.stage='ORIGINAL_SOURCE_GLB_'+floor;
      verifyP186EAutoloadRequests(glbRequests,sourceResponses);
      need(sourceCaptures.length===1 &&
        sourceCaptures[0].request===sourceResponses[0].request(),
        'ORIGINAL_GLB_REQUEST_CAPTURE_BINDING');
      verifyP186ESourceResponseMetadata(sourceResponses[0]);
      const sourceGlb=sourceCaptures[0].sourceGlb;
      report.sourceGlbChecks.push({floor,...sourceGlb,
        captureMethod:'same-browser-request-verified-byte-forwarding'});
      report.stage='WEBGL_CONTEXT_'+floor;
      const webgl=await bounded(()=>canvas.evaluate(element=>
        Boolean(element.getContext('webgl2')||element.getContext('webgl'))),10000);
      need(webgl,'NO_WEBGL_CONTEXT');
      report.stage='VIEWER_RENDER_SETTLE_'+floor;
      await bounded(()=>page.evaluate(()=>new Promise(resolve=>
        requestAnimationFrame(()=>requestAnimationFrame(resolve)))),10000);
      report.stage='ACTUAL_VIEWER_PIXELS_'+floor;
      const beforeSnapshot=await bounded(()=>canvas.evaluate(el=>({...el.dataset})),10000);
      const png=await bounded(()=>canvas.screenshot({timeout:30000}),35000);
      need(png.length>100 && png.subarray(1,4).toString()==='PNG','PNG');
      let captured;
      try{captured=decodeD1FScreenshotPng(png);}catch{reject('PNG_DECODE');}
      fs.mkdirSync(outputDirectory,{recursive:true});
      fs.writeFileSync(outputDirectory+'/'+floor.toLowerCase()+'-production.png',png);
      const sample=countP186EFramePixels(captured.rgba,captured.width,captured.height);
      // Aggregate proof only; no individual 18/16 target isolation is claimed.
      need(sample.width>=32 && sample.height>=32
        && sample.width*sample.height<=4000000
        && sample.nonBackgroundPixels>=1500
        && sample.aggregateAmberPixels>=20,'REAL_RENDER_PIXEL_FLOOR');
      const after=await bounded(()=>canvas.evaluate(el=>({...el.dataset})),10000);
      validateP186EProductionDataset(floor,after);
      verifyP186EAutoloadRequests(glbRequests,sourceResponses);
      report.stage='READABLE_SOURCE_CAPTION_PIXELS_'+floor;
      need(typeof beforeSnapshot.p186eCaptionLayout==='string' &&
        beforeSnapshot.p186eCaptionLayout===after.p186eCaptionLayout,'CAPTION_LAYOUT_DRIFT');
      let layout;
      try{layout=JSON.parse(after.p186eCaptionLayout);}catch{reject('CAPTION_LAYOUT_JSON');}
      const captionCheck=verifyP186ECaptionFrame({floor,layout,
        originalCaptions:sourceCaptures[0].captionRoster[floor],...captured});
      report.captionChecks.push(captionCheck);
      report.stage='INDIVIDUAL_SOURCE_FRAMES_'+floor;
      const individual=await bounded(()=>captureP186EIndividualFloor({
        page,canvas,floor,originalRoster:sourceCaptures[0].roster[floor],outputDirectory,
      }),240000);
      captionCheck.sourceCueVisibility=verifyP186ECuesWithCaptions({layout,...captured,session:individual.session});
      individualSessions.push(individual.session);
      report.individualCaptures.push(individual.summary);
      validateP186EProductionDataset(floor,await canvas.evaluate(el=>({...el.dataset})));
      verifyP186EAutoloadRequests(glbRequests,sourceResponses);
      report.views.push({...identity,pixels:sample,pngSha256:sha256(png),
        sourceGlb,
        actualWebGlContextVerified:true,sourceSceneMetadataVerified:true,
        authenticatedPageHttp200:true});
    }
    need(report.views.length===2
      && report.views[0].pngSha256!==report.views[1].pngSha256,
      'TWO_DISTINCT_FLOOR_FRAMES');
    need(report.views.every(view=>view.sourceGlb.originalSourceGlbDigestVerified===true),
      'BOTH_FLOOR_SOURCE_DIGESTS');
    report.originalSourceGlbDigestVerified=true;
    report.stage='VERIFY_ALL_34_INDIVIDUAL_SOURCE_FRAMES';
    report.individualEvidence=verifyP186E34SourcePixelEvidence({
      sourceCandidateId:p186ePixelCandidateId,floors:individualSessions,
    });
    need(report.individualEvidence.targetCount===34&&
      report.individualEvidence.D1F.visuallyIsolated===18&&
      report.individualEvidence.D2F.visuallyIsolated===16,'ALL_34_INDIVIDUAL_FRAMES');
    report.all34IndividuallyVerified=true;
    need(report.captionChecks.length===2 && report.captionChecks.reduce((n,c)=>n+c.captionCount,0)===34,
      'ALL_34_CAPTION_GLYPHS');
    report.all34CaptionGlyphsVerified=true;
    report.result='PASS';
    report.stage='COMPLETE';
    report.authenticatedBrowserProbe=true;
  }catch(err){
    report.result='FAIL';
    report.failureCode=classifyP186EProductionFailure(err);
  }finally{
    if(browser)await bounded(()=>browser.close(),10000).catch(()=>{
      report.result='FAIL';report.failureCode='BROWSER_CLOSE_FAILED';
    });
    fs.mkdirSync(outputDirectory,{recursive:true});
    fs.writeFileSync(outputDirectory+'/evidence.json',JSON.stringify(report,null,2)+'\n');
    // No credentials, response headers, or private raw GLB emitted.
    logger(JSON.stringify(report));
  }
  return report;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const report=await runP186EProductionProbe();
  if(report.result!=='PASS')process.exitCode=1;
}

