/** Main-only opt-in P186E historical label two-floor real production renderer smoke.
 * Scene readiness and aggregate real pixels ONLY. Not 34 individual pixel proof.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import {
  p186ePixelCandidateId, p186ePixelExpected,
  p186ePixelSourcePdfDriveId, p186ePixelSchedulePdfDriveId,
} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';

const ORIGIN = 'https://aapopihkala.fi';
const OUT = 'test-results/p186e-production-twofloor';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const reject = code => { throw new Error('P186E_PROD_' + code); };
const need = (condition, code) => { if (!condition) reject(code); };
export const P186E_PRODUCTION_FLOORS = Object.freeze(['D1F', 'D2F']);

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

async function run(){
  const report={result:'FAIL',stage:'TRUSTED_MAIN',
    reviewCandidate:p186ePixelCandidateId,sourcePdfId:p186ePixelSourcePdfDriveId,
    schedulePdfId:p186ePixelSchedulePdfDriveId,views:[],
    authenticatedBrowserProbe:false,originalSourceGlbDigestVerified:false,
    all34IndividuallyVerified:false,productionPublishedByThisProbe:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN'};
  let browser;
  const bounded = async (action,timeout=45000)=>{
    let timer;
    try {return await Promise.race([Promise.resolve().then(action),
      new Promise((_,rejectTimeout)=>{timer=setTimeout(
        ()=>rejectTimeout(new Error('P186E_PROD_STAGE_DEADLINE')),timeout);})]);}
    finally {clearTimeout(timer);}
  };
  try{
    need(process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi'
      && process.env.GITHUB_REF==='refs/heads/main'
      && process.env.GITHUB_EVENT_NAME==='workflow_dispatch'
      && process.env.PROBE_MODE==='p186e-labels-render','MAIN_ONLY');
    const clientId=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const clientSecret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    need(Boolean(clientId && clientSecret),'AUTH_CONFIGURATION');
    report.stage='BROWSER_INIT';
    browser=await bounded(()=>chromium.launch({headless:true}),30000);
    const context=await bounded(()=>browser.newContext({
      viewport:{width:1440,height:960},deviceScaleFactor:1,
    }),15000);
    // Never send Cloudflare service credentials to a third-party origin.
    await context.route('**/*',async route=>{
      if(new URL(route.request().url()).origin!==ORIGIN)return route.abort();
      return route.continue({headers:{...route.request().headers(),
        'CF-Access-Client-Id':clientId,
        'CF-Access-Client-Secret':clientSecret}});
    });
    const page=await bounded(()=>context.newPage(),15000);
    const canvas=page.locator('#private-model-canvas');
    for(const floor of P186E_PRODUCTION_FLOORS){
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
      await page.waitForFunction(required=>{
        const data=document.querySelector('#private-model-canvas')?.dataset;
        return data&&Object.entries(required).every(([k,v])=>data[k]===v);
      },expected,{timeout:60000});
      const data=await bounded(()=>canvas.evaluate(element=>({...element.dataset})),10000);
      const identity=validateP186EProductionDataset(floor,data);
      const webgl=await bounded(()=>canvas.evaluate(element=>
        Boolean(element.getContext('webgl2')||element.getContext('webgl'))),10000);
      need(webgl,'NO_WEBGL_CONTEXT');
      await bounded(()=>page.evaluate(()=>new Promise(resolve=>
        requestAnimationFrame(()=>requestAnimationFrame(resolve)))),10000);
      report.stage='ACTUAL_VIEWER_PIXELS_'+floor;
      const png=await bounded(()=>canvas.screenshot({timeout:30000}),35000);
      need(png.length>100 && png.subarray(1,4).toString()==='PNG','PNG');
      const sample=await bounded(()=>page.evaluate(async base64=>{
        const image=new Image();
        image.src='data:image/png;base64,'+base64;await image.decode();
        const c=document.createElement('canvas');c.width=image.naturalWidth;
        c.height=image.naturalHeight;
        const ctx=c.getContext('2d',{willReadFrequently:true});
        if(!ctx)throw Error('P186E_CANVAS_READBACK');
        ctx.drawImage(image,0,0);
        const bytes=ctx.getImageData(0,0,c.width,c.height).data;
        let nonBackground=0,amber=0;
        for(let i=0;i<bytes.length;i+=4){
          const [r,g,b,a]=[bytes[i],bytes[i+1],bytes[i+2],bytes[i+3]];
          if(a>=200&&Math.max(Math.abs(r-32),Math.abs(g-42),Math.abs(b-52))>=24)
            nonBackground++;
          if(a>=200&&r>=145&&g>=85&&b<=165&&r-g>=18&&g-b>=18)amber++;
        }
        return {width:c.width,height:c.height,
          nonBackgroundPixels:nonBackground,aggregateAmberPixels:amber};
      },png.toString('base64')),30000);
      // Aggregate proof only; no individual 18/16 target isolation is claimed.
      need(sample.width>=32 && sample.height>=32
        && sample.width*sample.height<=4000000
        && sample.nonBackgroundPixels>=1500
        && sample.aggregateAmberPixels>=20,'REAL_RENDER_PIXEL_FLOOR');
      const after=await bounded(()=>canvas.evaluate(el=>({...el.dataset})),10000);
      validateP186EProductionDataset(floor,after);
      fs.mkdirSync(OUT,{recursive:true});
      fs.writeFileSync(OUT+'/'+floor.toLowerCase()+'-production.png',png);
      report.views.push({...identity,pixels:sample,pngSha256:sha256(png),
        actualWebGlContextVerified:true,sourceSceneMetadataVerified:true,
        authenticatedPageHttp200:true});
    }
    need(report.views.length===2
      && report.views[0].pngSha256!==report.views[1].pngSha256,
      'TWO_DISTINCT_FLOOR_FRAMES');
    report.result='PASS';
    report.stage='COMPLETE';
    report.authenticatedBrowserProbe=true;
  }catch(err){
    report.result='FAIL';
    const message=String(err?.message||'');
    report.failureCode=message.startsWith('P186E_PROD_')?
      message.slice(0,90):'UNEXPECTED_BROWSER_OR_SOURCE_FAILURE';
    process.exitCode=1;
  }finally{
    if(browser)await bounded(()=>browser.close(),10000).catch(()=>{
      report.result='FAIL';report.failureCode='BROWSER_CLOSE_FAILED';process.exitCode=1;
    });
    fs.mkdirSync(OUT,{recursive:true});
    fs.writeFileSync(OUT+'/evidence.json',JSON.stringify(report,null,2)+'\n');
    // No credentials, response headers, or private raw GLB emitted.
    console.log(JSON.stringify(report));
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  await run();
}
