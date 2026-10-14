import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { D1F_COMBINED_WALL_ASSETS, D1F_COMBINED_WALL_VARIANTS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';
import { D1F_MEASURED_PIXEL_TARGETS, evaluateD1FOneTargetPixelSample, evaluateD1FMeasuredFiveTargetPixelGate } from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';

const ORIGIN = 'https://aapopihkala.fi';
const ID = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const ASSET = D1F_COMBINED_WALL_ASSETS[ID];
const PATH = '/private-model/work-test/' + ID + '.glb';
const OUT = 'test-results/d1f-measured-production';
const hash = b => createHash('sha256').update(b).digest('hex');
const evidence = { result: 'FAIL', phase: 'TRUSTED_PUBLISHER', candidateId: ID,
  sourceBytes: ASSET.bytes, sourceSha256: ASSET.sha256, variants: [],
  authenticatedAutoloadVerified: false, actualBrowserWebGlVerified: false,
  fiveTargetsRenderedVerified: false, humanReview: 'NOT_RUN', current: false, asBuilt: false };
const bounded = async (fn, ms = 45000) => {
  let timer;
  try { return await Promise.race([Promise.resolve().then(fn),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('D1F_STAGE_TIMEOUT')),ms);})]); }
  finally {clearTimeout(timer);}
};
const check = (ok) => { if (!ok) throw new Error('D1F_PRODUCTION_PROBE_REJECTED'); };
let browser;
const driverDeadline=setTimeout(()=>{
  Object.assign(evidence,{result:'FAIL',failureCode:'D1F_DRIVER_DEADLINE_EXCEEDED',
    authenticatedAutoloadVerified:false,actualBrowserWebGlVerified:false,fiveTargetsRenderedVerified:false});
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(OUT+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
  process.exit(1);
},540000);
try {
  check(process.env.GITHUB_REF === 'refs/heads/main' &&
    process.env.GITHUB_REPOSITORY === 'aapojohannespihkala-lgtm/aapopihkala-fi');
  check(process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
    process.env.PROBE_MODE === 'd1f-measured-pixels');
  const requestedVariant = process.env.D1F_COMBINED_VARIANT;
  check(D1F_COMBINED_WALL_VARIANTS.includes(requestedVariant));
  // Matrix row proves only this source variant; overall success requires all four jobs.
  evidence.probeVariant = requestedVariant;
  evidence.allFourVariantsVerifiedByThisJob = false;
  evidence.trigger = 'TRUSTED_MAIN_EXPLICIT_DISPATCH';
  // Publication is independently proven by the canonical publisher. This
  // read-only browser gate verifies the fixed published bytes again.
  evidence.productionPublicationVerifiedByThisFunction = false;
  evidence.phase = 'AUTH_CONFIGURATION';
  const clientId = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
  check(Boolean(clientId && clientSecret));
  evidence.phase = 'BROWSER_START';
  browser = await bounded(()=>chromium.launch({headless:true}));
  const context = await bounded(()=>browser.newContext({ viewport:{width:1440,height:1000}, deviceScaleFactor:1 }),15000);
  // Service credentials are attached only to the fixed same-origin project.
  await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== ORIGIN) return route.abort();
    return route.continue({headers:{...route.request().headers(),
      'CF-Access-Client-Id':clientId,'CF-Access-Client-Secret':clientSecret}});
  });
  const page = await bounded(()=>context.newPage(),15000);
  let responses = [];
  page.on('response', response => { if(response.url() === ORIGIN + PATH) responses.push(response); });
  const canvas = page.locator('#private-model-canvas');
  let requestId = 0;
  const send = async (action, targetId, viewIndex = 0) => {
    const currentId = ++requestId;
    console.log(JSON.stringify({phase:evidence.phase,variant:evidence.currentVariant,target:targetId,viewIndex,action}));
    await bounded(()=>page.evaluate(detail => window.dispatchEvent(
      new CustomEvent('d1f-combined-wall-source-probe',{detail})),
      {action,targetId,viewIndex,requestId:currentId}),5000);
    await page.waitForFunction(id => {
      try {return JSON.parse(document.querySelector('#private-model-canvas').dataset.d1fCombinedWallProbe).requestId===id;}
      catch{return false;}
    },currentId,{timeout:5000});
    const value = await bounded(()=>canvas.evaluate(c=>JSON.parse(c.dataset.d1fCombinedWallProbe)),5000);
    evidence.lastProbeAction=action;
    evidence.lastProbeState=['PREPARED','SUPPRESSED','RESTORED','FINISHED','REJECTED'].includes(value.state)
      ? value.state : 'INVALID';
    check(value.state !== 'REJECTED');
    await bounded(()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))),5000);
    return value;
  };
  const capture = async name => {
    // Allowlisted target/view names only. Preserve the exact screenshot stage on timeout.
    evidence.currentCapture = name;
    console.log(JSON.stringify({phase:evidence.phase,capture:name}));
    const png = await bounded(()=>canvas.screenshot({timeout:25000}),30000);
    check(png.length > 100 && png.subarray(1,4).toString() === 'PNG');
    const decoded = await bounded(()=>page.evaluate(async data => {
      const image = new Image(); image.src='data:image/png;base64,'+data; await image.decode();
      const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const rgba=ctx.getImageData(0,0,c.width,c.height).data;
      let binary=''; for(let i=0;i<rgba.length;i+=32768)
        binary+=String.fromCharCode(...rgba.subarray(i,i+32768));
      return {width:c.width,height:c.height,rgbaBase64:btoa(binary)};
    },png.toString('base64')),25000);
    const rgba=new Uint8Array(Buffer.from(decoded.rgbaBase64,'base64'));
    check(decoded.width*decoded.height<=10000000 && rgba.length===decoded.width*decoded.height*4);
    fs.mkdirSync(OUT,{recursive:true}); fs.writeFileSync(OUT+'/'+name+'.png',png);
    return {width:decoded.width,height:decoded.height,rgba,pngSha256:hash(png)};
  };
  const deltaCount = (a,b) => {
    check(a.width===b.width && a.height===b.height);
    let count=0;
    for(let i=0;i<a.rgba.length;i+=4)
      if(Math.max(Math.abs(a.rgba[i]-b.rgba[i]),Math.abs(a.rgba[i+1]-b.rgba[i+1]),
        Math.abs(a.rgba[i+2]-b.rgba[i+2]))>=28)count++;
    return count;
  };
  for(const variant of [requestedVariant]) {
    evidence.currentVariant=variant;
    responses=[];
    const url=ORIGIN+'/private-model/?review='+ID+'-review&wallVariant='+variant;
    evidence.phase='VIEWER_HTTP';
    const navigation=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    check(navigation?.status()===200 && page.url()===url &&
      navigation.headers()['content-type']?.includes('text/html'));
    evidence.phase='EXACT_AUTOLOAD';
    const required={modelSource:'work-test',workTestReviewAutoload:'true',workTestReviewMode:ID+'-review',
      d1fCombinedWallVariant:variant,d1fCombinedWallCornerCount:'3',d1fCombinedWallPixelTargets:'I03,CORNER_NORTH_X2337,CORNER_SOUTH_X2337,CORNER_MIDDLE_X2589,BASIN',d1fCombinedWallRawBytes:String(ASSET.bytes),
      d1fCombinedWallRawSha256:ASSET.sha256,d1fCombinedWallPhysicalXYVerified:'false',
      d1fCombinedWallHumanReview:'NOT_RUN'};
    await page.waitForFunction(required=>{
      const dataset=document.querySelector('#private-model-canvas')?.dataset;
      return dataset && Object.entries(required).every(([k,v])=>dataset[k]===v);
    },required,{timeout:45000});
    evidence.phase='VIEWER_SOURCE_BYTES';
    check(responses.length===1 && responses[0].status()===200);
    const raw=await bounded(()=>responses[0].body(),25000);
    check(raw.length===ASSET.bytes && hash(raw)===ASSET.sha256 && raw.subarray(0,4).toString()==='glTF');
    check(await canvas.evaluate(c=>Boolean(c.getContext('webgl2')||c.getContext('webgl'))));
    const prefix=variant.toLowerCase();
    evidence.phase='GENERAL_RENDER_PIXELS';
    await bounded(()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))),5000);
    const initial=await capture(prefix+'-overview');
    let nonBackground=0;
    for(let i=0;i<initial.rgba.length;i+=4)
      if(Math.max(Math.abs(initial.rgba[i]-32),Math.abs(initial.rgba[i+1]-42),
        Math.abs(initial.rgba[i+2]-52))>=24)nonBackground++;
    const rect=await canvas.boundingBox();check(Boolean(rect));
    await bounded(async()=>{
      await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.5);
      await page.mouse.down(); await page.mouse.move(rect.x+rect.width*.62,rect.y+rect.height*.55,{steps:12});
      await page.mouse.up(); await page.mouse.move(0,0);
    },10000);
    await page.waitForTimeout(500);
    const orbited=await capture(prefix+'-orbit');
    const orbitChanged=deltaCount(initial,orbited);
    check(nonBackground>=1500 && orbitChanged>=750);
    evidence.phase='FIVE_SOURCE_TARGET_PIXELS';
    const samples=[], captures=[];
    for(const targetId of D1F_MEASURED_PIXEL_TARGETS) {
      evidence.currentTarget=targetId;
      let accepted=false;
      for(let viewIndex=0;viewIndex<4&&!accepted;viewIndex++) {
        evidence.currentViewIndex=viewIndex;
        let sample, prepared, baseline, suppressed, restored;
        try { prepared=await send('prepare',targetId,viewIndex); }
        catch { continue; }
        try {
          baseline=await capture(prefix+'-'+targetId.toLowerCase()+'-v'+viewIndex+'-before');
          const hidden=await send('suppress',targetId);
          suppressed=await capture(prefix+'-'+targetId.toLowerCase()+'-v'+viewIndex+'-hidden');
          check(hidden.cameraFingerprint===prepared.cameraFingerprint);
        } finally {
          if(prepared)restored=await send('restore',targetId);
        }
        if(!prepared)continue;
        const afterRestore=await capture(prefix+'-'+targetId.toLowerCase()+'-v'+viewIndex+'-restored');
        check(restored.suppressionRestored===true && restored.cameraFingerprint===prepared.cameraFingerprint &&
          deltaCount(baseline,afterRestore)<=8);
        const frame=png=>({...png,cameraFingerprint:prepared.cameraFingerprint,
          glbSha256:prepared.glbSha256,variant:prepared.variant});
        sample={targetId,baseline:frame(baseline),suppressed:frame(suppressed),roi:prepared.roi,
          suppressionMethod:prepared.suppressionMethod,targetIdentityVerified:prepared.targetIdentityVerified,
          roiProvenance:prepared.roiProvenance,suppressionRestored:true};
        try {evaluateD1FOneTargetPixelSample(sample);}
        catch {continue;}
        samples.push(sample);
        captures.push({targetId,viewIndex,cameraFingerprint:prepared.cameraFingerprint,roi:prepared.roi,
          sourceI03Indices:prepared.sourceI03Indices,beforePngSha256:baseline.pngSha256,
          hiddenPngSha256:suppressed.pngSha256,restoredPngSha256:afterRestore.pngSha256});
        accepted=true;
      }
      check(accepted);
    }
    const pixels=evaluateD1FMeasuredFiveTargetPixelGate(samples);
    await send('finish',null);
    evidence.variants.push({variant,exactAutoloadResponseVerified:true,actualWebGlContextVerified:true,
      nonBackgroundPixels:nonBackground,orbitChangedPixels:orbitChanged,pixels,captures});
  }
  evidence.phase='COMPLETE';evidence.result='PASS';
  evidence.authenticatedAutoloadVerified=true;evidence.actualBrowserWebGlVerified=true;
  evidence.fiveTargetsRenderedVerified=true;
} catch {
  evidence.result='FAIL';
  process.exitCode=1;
} finally {
  clearTimeout(driverDeadline);
  if(browser)await bounded(()=>browser.close(),10000).catch(()=>{});
  fs.mkdirSync(OUT,{recursive:true});
  fs.writeFileSync(OUT+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
  // Never export upstream errors, headers, raw URLs or credentials.
  console.log(JSON.stringify(evidence));
}
