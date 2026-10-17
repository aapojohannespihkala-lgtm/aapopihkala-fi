/**
 * Read-only, trusted-main D1F ODENSVIK production autoload probe.
 * Requires PR1350 source contract to be in main, verified publisher output,
 * and explicit workflow_dispatch. Generic WebGL pixels NEVER prove a bowl,
 * counter or cabinet; those require separate object-specific suppression.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';

const ORIGIN = 'https://aapopihkala.fi';
const OUT = 'test-results/d1f-odensvik-autoload-production';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const requireProof = (truth, why) => {
  if (!truth) throw new Error('D1F_ODENSVIK_PRODUCTION_AUTOLOAD_REJECTED:' + why);
};
const deadline = async (task, ms) => {
  let handle;
  try {
    return await Promise.race([Promise.resolve().then(task),
      new Promise((_,reject) => {
        handle=setTimeout(() => reject(new Error('D1F_ODENSVIK_STAGE_TIMEOUT')),ms);
      })]);
  } finally { clearTimeout(handle); }
};

export function exactD1FOdensvikReviewUrl(reviewId, variant, variants) {
  requireProof(typeof reviewId === 'string' &&
    /^d1f-odensvik-[a-z0-9-]+-review$/.test(reviewId) &&
    Array.isArray(variants) && variants.some(v=>v.variant===variant),
    'unregistered-review-source-variant');
  return ORIGIN+'/private-model/?review='+reviewId+'&wallVariant='+variant;
}

/** Validates only generic rendered colors and orbit motion, not product-specific objects. */
export function countD1FOdensvikGenericPixelChanges(a,b,threshold=36) {
  requireProof(a && b && a.width===b.width && a.height===b.height &&
    a.width>100 && a.height>100 &&
    a.rgba instanceof Uint8Array && b.rgba instanceof Uint8Array &&
    a.rgba.length===a.width*a.height*4 && b.rgba.length===a.rgba.length &&
    Number.isInteger(threshold) && threshold>=1 && threshold<=128,'invalid-real-frame-pair');
  let changed=0;
  for(let i=0;i<a.rgba.length;i+=4) {
    const delta=Math.abs(a.rgba[i]-b.rgba[i])+
      Math.abs(a.rgba[i+1]-b.rgba[i+1])+
      Math.abs(a.rgba[i+2]-b.rgba[i+2]);
    if(delta>threshold)changed++;
  }
  return changed;
}

export async function runD1FOdensvikAutoloadProbe() {
  const variant=process.env.D1F_ODENSVIK_VARIANT;
  const evidence={
    result:'FAIL', phase:'SOURCE-CONTRACT', variant,
    origin:ORIGIN, singleLinkAutoloadVerified:false,
    productionSourceByteReadbackVerified:false,
    generalWebGlRenderVisible:false, orbitRenderResponsive:false,
    bowlPixelsVerified:false, counterPixelsVerified:false,
    cabinetPixelsVerified:false, userReview:'NOT_RUN',
    current:false, canonical:false, asBuilt:false,
  };
  let browser;
  try {
    requireProof(process.env.GITHUB_EVENT_NAME==='workflow_dispatch' &&
      process.env.GITHUB_REF==='refs/heads/main' &&
      process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      process.env.PROBE_MODE==='d1f-odensvik-autoload','untrusted-workflow');
    // These canonical exported values must already be merged via PR1350.
    // Do not establish a parallel source registry here.
    const source=await import('../../src/scripts/privateModelD1FOdensvikSourceReview.mjs');
    const candidateId=source.D1F_ODENSVIK_CANDIDATE_ID;
    const reviewId=source.D1F_ODENSVIK_REVIEW_ID;
    const variants=source.D1F_ODENSVIK_VARIANTS;
    const expectedSource=source.D1F_ODENSVIK_SOURCE;
    requireProof(Array.isArray(variants) && variants.length===4 &&
      variants.map(v=>v.sceneIndex).join(',')==='108,109,110,111' &&
      variants.some(v=>v.variant===variant) &&
      expectedSource.bytes===8876156 &&
      /^[0-9a-f]{64}$/.test(expectedSource.sha256),'source-contract-not-merged-or-invalid');
    Object.assign(evidence,{candidateId,sourceBytes:expectedSource.bytes,
      sourceSha256:expectedSource.sha256});
    const path='/private-model/work-test/'+candidateId+'.glb';
    const url=exactD1FOdensvikReviewUrl(reviewId,variant,variants);
    const selected=variants.find(v=>v.variant===variant);
    const id=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const secret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    requireProof(Boolean(id && secret),'missing-readonly-access-identity');
    evidence.phase='AUTHENTICATED_BROWSER';
    browser=await deadline(()=>chromium.launch({headless:true}),45000);
    const ctx=await deadline(()=>browser.newContext({
      viewport:{width:1440,height:900},deviceScaleFactor:1,
    }),15000);
    await ctx.route('**/*',route=>{
      const origin=new URL(route.request().url()).origin;
      if(origin!==ORIGIN)return route.abort();
      return route.continue({headers:{...route.request().headers(),
        'CF-Access-Client-Id':id,'CF-Access-Client-Secret':secret}});
    });
    const page=await deadline(()=>ctx.newPage(),10000);
    const responses=[];
    page.on('response',r=>{if(r.url()===ORIGIN+path)responses.push(r);});
    evidence.phase='ONE_LINK';
    const navigation=await deadline(()=>page.goto(url,{
      waitUntil:'domcontentloaded',timeout:45000,
    }),50000);
    requireProof(navigation?.status()===200 && page.url()===url &&
      navigation.headers()['content-type']?.includes('text/html'),
      'wrong-or-untrusted-viewer-page');
    const expected={
      modelSource:'work-test',
      workTestReviewAutoload:'true',
      workTestReviewCandidate:candidateId,
      workTestReviewMode:reviewId,
      d1fOdensvikVariant:variant,
      d1fOdensvikSceneIndex:String(selected.sceneIndex),
      d1fOdensvikRawBytes:String(expectedSource.bytes),
      d1fOdensvikRawSha256:expectedSource.sha256,
      d1fOdensvikSourceAuthenticated:'true',
      d1fOdensvikSemanticTargetCount:'40',
      d1fOdensvikWorkTest:'true',
      d1fOdensvikProductionPixelsVerified:'false',
      d1fOdensvikHumanReview:'NOT_RUN',
      d1fOdensvikCurrent:'false',
      d1fOdensvikCanonical:'false',
      d1fOdensvikAsBuilt:'false',
    };
    const canvas=page.locator('#private-model-canvas');
    await page.waitForFunction(expected=>{
      const d=document.querySelector('#private-model-canvas')?.dataset;
      return d && Object.entries(expected).every(([k,v])=>d[k]===v);
    },expected,{timeout:45000});
    evidence.singleLinkAutoloadVerified=true;
    evidence.phase='SOURCE_NETWORK';
    requireProof(responses.length===1 && responses[0].status()===200,
      'not-one-GLB-response');
    const raw=await deadline(()=>responses[0].body(),25000);
    requireProof(raw.byteLength===expectedSource.bytes &&
      sha(raw)===expectedSource.sha256 &&
      raw.subarray(0,4).toString()==='glTF','not-exact-published-40pointer-GLB');
    evidence.productionSourceByteReadbackVerified=true;
    evidence.phase='GENERIC_WEBGL';
    requireProof(await canvas.evaluate(element=>Boolean(
      element.getContext('webgl2')||element.getContext('webgl'))),
      'missing-WebGL-context');
    await deadline(()=>page.evaluate(()=>new Promise(resolve=>
      requestAnimationFrame(()=>requestAnimationFrame(resolve)))),5000);
    const capture=async label=>{
      const png=await deadline(()=>canvas.screenshot({
        animations:'disabled',timeout:25000,
      }),30000);
      requireProof(png.length>100 && png.subarray(1,4).toString()==='PNG',
        'invalid-WebGL-screenshot');
      const data=decodeD1FScreenshotPng(png);
      requireProof(data.width>100 && data.height>100 &&
        data.width*data.height<=4000000 &&
        data.rgba instanceof Uint8Array &&
        data.rgba.length===data.width*data.height*4,'invalid-screenshot-decoder');
      fs.mkdirSync(OUT,{recursive:true});
      fs.writeFileSync(OUT+'/'+variant.toLowerCase()+'-'+label+'.png',png);
      return {...data,hash:sha(png)};
    };
    const before=await capture('initial');
    let colored=0;
    for(let i=0;i<before.rgba.length;i+=4) {
      const distance=Math.abs(before.rgba[i]-32)+
        Math.abs(before.rgba[i+1]-42)+Math.abs(before.rgba[i+2]-52);
      if(distance>36)colored++;
    }
    const rect=await canvas.boundingBox();
    requireProof(rect?.width>200&&rect?.height>200,'hidden-canvas');
    await page.mouse.move(rect.x+rect.width*.48,rect.y+rect.height*.48);
    await page.mouse.down();
    await page.mouse.move(rect.x+rect.width*.71,rect.y+rect.height*.58,{steps:14});
    await page.mouse.up();
    await page.mouse.move(0,0);
    await page.waitForTimeout(350);
    const after=await capture('orbit');
    const changes=countD1FOdensvikGenericPixelChanges(before,after);
    Object.assign(evidence,{generalNonBackgroundPixels:colored,
      orbitChangedPixels:changes,
      initialScreenshotSha256:before.hash,orbitScreenshotSha256:after.hash});
    requireProof(colored>=1500&&changes>=750,'no-general-visible-orbit-render');
    evidence.generalWebGlRenderVisible=true;
    evidence.orbitRenderResponsive=true;
    evidence.phase='COMPLETE';
    evidence.result='PASS_ONE_LINK_EXACT_RAW_AND_GENERAL_WEBGL_ONLY';
  } catch(error) {
    evidence.failureCode=String(error?.message??error).slice(0,190);
    process.exitCode=1;
  } finally {
    if(browser)await deadline(()=>browser.close(),12000).catch(()=>{});
    fs.mkdirSync(OUT,{recursive:true});
    fs.writeFileSync(OUT+'/'+String(variant??'invalid').replace(/[^a-zA-Z0-9_-]/g,'')+
      '-evidence.json',JSON.stringify(evidence,null,2)+'\n');
    console.log(JSON.stringify(evidence));
  }
  return evidence;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)
  await runD1FOdensvikAutoloadProbe();
