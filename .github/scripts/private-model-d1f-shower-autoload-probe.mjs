import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import {
  D1F_SHOWER_PHOTO_CANDIDATE_ID as candidateId,
  D1F_SHOWER_PHOTO_REVIEW_ID as reviewId,
  D1F_SHOWER_PHOTO_SOURCE as source,
  D1F_SHOWER_PHOTO_VARIANTS as variants,
} from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const ORIGIN = 'https://aapopihkala.fi';
const OUT = 'test-results/d1f-shower-autoload-production';
const GLB_PATH = '/private-model/work-test/' + candidateId + '.glb';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ensure = (ok, reason) => { if (!ok) throw new Error('D1F_SHOWER_AUTOLOAD_REJECTED:' + reason); };

export function exactD1FShowerAutoloadUrl(variant) {
  ensure(variants.some(v => v.name === variant), 'unknown-source-variant');
  return ORIGIN + '/private-model/?review=' + reviewId + '&wallVariant=' + variant;
}
export function expectedD1FShowerAutoloadDataset(variant) {
  const row = variants.find(v => v.name === variant);
  ensure(row, 'unknown-source-variant');
  return Object.freeze({
    modelSource: 'work-test',
    workTestReviewAutoload: 'true',
    workTestReviewMode: reviewId,
    workTestReviewCandidate: candidateId,
    d1fShowerPhotoVariant: row.name,
    d1fShowerPhotoSceneIndex: String(row.sceneIndex),
    d1fShowerPhotoRawBytes: String(source.bytes),
    d1fShowerPhotoRawSha256: source.sha256,
    d1fShowerPhotoSourceAuthenticated: 'true',
    d1fShowerPhotoGlassNode: String(row.glassNode),
    d1fShowerPhotoVisibleSourceScene: 'true',
    d1fShowerPhotoSourceRootCount: '1',
    d1fShowerPhotoGlassFocus: 'SOURCE_OBJECT_PRESENTATION_ONLY',
    d1fShowerPhotoWorkTest: 'true',
    d1fShowerPhotoProductionPixelsVerified: 'false',
    d1fShowerPhotoHumanReview: 'NOT_RUN',
    d1fShowerPhotoCurrent: 'false',
    d1fShowerPhotoAsBuilt: 'false',
  });
}

export function countD1FShowerGenericScreenChanges(a, b, threshold = 36) {
  ensure(a?.width === b?.width && a?.height === b?.height &&
    a?.rgba instanceof Uint8Array && b?.rgba instanceof Uint8Array &&
    a.rgba.length === a.width*a.height*4 && b.rgba.length === a.rgba.length &&
    a.width > 100 && a.height > 100, 'invalid-real-screen-frames');
  let changed = 0;
  for (let i=0;i<a.rgba.length;i+=4) {
    const delta = Math.abs(a.rgba[i]-b.rgba[i]) +
      Math.abs(a.rgba[i+1]-b.rgba[i+1]) + Math.abs(a.rgba[i+2]-b.rgba[i+2]);
    if (delta > threshold) changed++;
  }
  return changed;
}

const bounded = async (fn, ms=45000) => {
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('D1F_SHOWER_SMOKE_STAGE_TIMEOUT')),ms);
    })]);
  } finally { clearTimeout(timer); }
};

async function main() {
  const variant = process.env.D1F_SHOWER_VARIANT;
  const evidence = {
    result:'FAIL', phase:'TRUSTED_MAIN', candidateId, variant,
    sourceBytes:source.bytes, sourceSha256:source.sha256,
    singleLinkAutoloadVerified:false, productionSourceByteReadbackVerified:false,
    generalWebGlRenderVisible:false, freeOrbitRenderResponsive:false,
    individualGlassPrimitivePixelsVerified:false, productionPublishProvenByThisJob:false,
    humanReview:'NOT_RUN', current:false, canonical:false, asBuilt:false,
  };
  let browser;
  try {
    ensure(process.env.GITHUB_REF==='refs/heads/main' &&
      process.env.GITHUB_EVENT_NAME==='workflow_dispatch' &&
      process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      process.env.PROBE_MODE==='d1f-shower-autoload', 'untrusted-dispatch');
    const url = exactD1FShowerAutoloadUrl(variant);
    const expected = expectedD1FShowerAutoloadDataset(variant);
    const id = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const secret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    ensure(Boolean(id && secret), 'missing-readonly-viewer-identity');
    evidence.phase='BROWSER';
    browser = await bounded(()=>chromium.launch({headless:true}),45000);
    const context = await bounded(()=>browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),10000);
    await context.route('**/*',route=>{
      const requested = new URL(route.request().url());
      if (requested.origin!==ORIGIN) return route.abort();
      return route.continue({headers:{...route.request().headers(),
        'CF-Access-Client-Id':id,'CF-Access-Client-Secret':secret}});
    });
    const page = await bounded(()=>context.newPage(),10000);
    const responses = [];
    page.on('response',response=>{
      if(response.url()===ORIGIN+GLB_PATH) responses.push(response);
    });
    evidence.phase='PROTECTED_ONE_LINK';
    const navigation = await bounded(()=>page.goto(url,{waitUntil:'domcontentloaded',timeout:45000}),50000);
    ensure(navigation?.status()===200 && page.url()===url &&
      navigation.headers()['content-type']?.includes('text/html'), 'not-authenticated-target-viewer');
    const canvas = page.locator('#private-model-canvas');
    await page.waitForFunction(expected=>{
      const d=document.querySelector('#private-model-canvas')?.dataset;
      return d && Object.entries(expected).every(([key,value])=>d[key]===value);
    },expected,{timeout:45000});
    evidence.singleLinkAutoloadVerified=true;
    evidence.phase='EXACT_RAW_GLB_NETWORK';
    ensure(responses.length===1 && responses[0].status()===200, 'not-one-exact-GLB-response');
    const glb = await bounded(()=>responses[0].body(),25000);
    ensure(glb.length===source.bytes && digest(glb)===source.sha256 &&
      glb.subarray(0,4).toString()==='glTF', 'wrong-production-source-bytes');
    evidence.productionSourceByteReadbackVerified=true;
    evidence.phase='WEBGL_VISIBLE_SCENE';
    ensure(await canvas.evaluate(element=>Boolean(
      element.getContext('webgl2') || element.getContext('webgl'))),'missing-real-WebGL-context');
    await bounded(()=>page.evaluate(()=>new Promise(resolve=>
      requestAnimationFrame(()=>requestAnimationFrame(resolve)))),5000);
    const capture = async name=>{
      const png = await bounded(()=>canvas.screenshot({timeout:25000,animations:'disabled'}),30000);
      ensure(png.length>100 && png.subarray(1,4).toString()==='PNG','invalid-screen-capture');
      const decoded = await bounded(()=>page.evaluate(async encoded=>{
        const image = new Image();
        image.src='data:image/png;base64,'+encoded;
        await image.decode();
        const drawing=document.createElement('canvas');
        drawing.width=image.naturalWidth;drawing.height=image.naturalHeight;
        const ctx=drawing.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(image,0,0);
        const bytes=ctx.getImageData(0,0,drawing.width,drawing.height).data;
        let chars='';for(let i=0;i<bytes.length;i+=32768)
          chars+=String.fromCharCode(...bytes.subarray(i,i+32768));
        return {width:drawing.width,height:drawing.height,rgba64:btoa(chars)};
      },png.toString('base64')),25000);
      const rgba=new Uint8Array(Buffer.from(decoded.rgba64,'base64'));
      ensure(decoded.width*decoded.height<=4_000_000 &&
        rgba.length===decoded.width*decoded.height*4,'incorrect-canvas-frame');
      fs.mkdirSync(OUT,{recursive:true});
      fs.writeFileSync(OUT+'/'+variant.toLowerCase()+'-'+name+'.png',png);
      return {width:decoded.width,height:decoded.height,rgba,pngSha256:digest(png)};
    };
    const first=await capture('original');
    let nonBackground=0;
    // General visible-color pixels: no claims about individual glass leaves.
    for(let i=0;i<first.rgba.length;i+=4) {
      const distance=Math.abs(first.rgba[i]-32)+Math.abs(first.rgba[i+1]-42)+
        Math.abs(first.rgba[i+2]-52);
      if(distance>36)nonBackground++;
    }
    const rect=await canvas.boundingBox();
    ensure(rect?.width>200 && rect?.height>200,'missing-viewer-canvas');
    await page.mouse.move(rect.x+rect.width*.48,rect.y+rect.height*.48);
    await page.mouse.down();
    await page.mouse.move(rect.x+rect.width*.70,rect.y+rect.height*.59,{steps:14});
    await page.mouse.up();
    await page.mouse.move(0,0);
    await page.waitForTimeout(350);
    const second=await capture('orbit');
    const orbitChanged=countD1FShowerGenericScreenChanges(first,second);
    evidence.generalNonBackgroundPixels=nonBackground;
    evidence.genericOrbitChangedPixels=orbitChanged;
    evidence.originalScreenshotSha256=first.pngSha256;
    evidence.orbitScreenshotSha256=second.pngSha256;
    ensure(nonBackground>=1500 && orbitChanged>=750,'no-visible-orbit-responsive-source-scene');
    evidence.generalWebGlRenderVisible=true;
    evidence.freeOrbitRenderResponsive=true;
    evidence.result='PASS_AUTOLOAD_AND_GENERAL_RENDER_ONLY';
    evidence.phase='COMPLETE';
  } catch(err) {
    evidence.result='FAIL';
    evidence.failureCode=String(err?.message ?? err).slice(0,120);
    process.exitCode=1;
  } finally {
    if(browser)await bounded(()=>browser.close(),10000).catch(()=>{});
    fs.mkdirSync(OUT,{recursive:true});
    fs.writeFileSync(OUT+'/'+String(variant??'invalid').replace(/[^A-Za-z0-9_-]/g,'')+'-evidence.json',
      JSON.stringify(evidence,null,2)+'\n');
    console.log(JSON.stringify(evidence));
  }
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  await main();
}
