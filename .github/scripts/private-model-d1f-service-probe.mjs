import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';
import {D1F_SERVICE_ID as ID,D1F_SERVICE_ASSET as ASSET,D1F_SERVICE_ROWS as ROWS,D1F_SERVICE_DEVICES as DEVICES} from '../../src/scripts/privateModelD1FServiceContract.mjs';

if (process.env.D1F_SERVICE_SOURCE156_AUTOLOAD === '1') {
  // Independent generic render proof. NOT seven-object pixel proof.
  const id='d1f-source156-mirror305-k2-oak-u-two-pulls-20261018';
  const expectedSha='14eed1eff91785682ac7d5c7cd0e9dec6b2ba053f41f539242e2ab120a29af51';
  const expectedBytes=9792656,origin='https://aapopihkala.fi';
  const sourcePath='/private-model/work-test/'+id+'.glb';
  const targetUrl=origin+'/private-model/?review='+id+'-review';
  const dir='test-results/d1f-source156-original-autoload';
  fs.mkdirSync(dir,{recursive:true});
  const report={result:'FAIL',phase:'TRUSTED_MAIN',candidateId:id,sourceSha256:expectedSha,
    sourceBytes:expectedBytes,sourceSceneIndex:156,originalTargetCount:7,
    authenticatedOriginal:false,webGlRendered:false,sevenOriginalObjectPixelsVerified:false,
    productionObjectPixelProof:false,current:false,canonical:false,asBuilt:false,
    humanReview:'NOT_RUN',sourceRequests:0,unexpectedCurrentRequests:0};
  const write=()=>fs.writeFileSync(dir+'/evidence.json',JSON.stringify(report,null,2)+'\n');
  let browser156=null;
  try {
    check(process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      process.env.GITHUB_REF==='refs/heads/main' &&
      process.env.GITHUB_EVENT_NAME==='workflow_dispatch','MAIN_ONLY');
    const clientId=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
    const clientSecret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
    check(Boolean(clientId&&clientSecret),'CLOUDFLARE_ACCESS_REQUIRED');
    browser156=await chromium.launch({headless:true});
    const context=await browser156.newContext({viewport:{width:1400,height:920},deviceScaleFactor:1});
    await context.route('**/*',async route=>{
      const req=route.request(),requestUrl=req.url();
      if(!requestUrl.startsWith(origin+'/'))return route.continue();
      const headers={...req.headers(),'CF-Access-Client-Id':clientId,
        'CF-Access-Client-Secret':clientSecret};
      if(requestUrl===origin+'/private-model/model.glb')report.unexpectedCurrentRequests++;
      if(requestUrl===origin+sourcePath){
        report.sourceRequests++;
        const response=await route.fetch({headers,maxRedirects:0,timeout:30000});
        const body=await response.body();
        check(response.status()===200&&!response.headers()['location'],'ORIGINAL_SOURCE_HTTP');
        check(body.length===expectedBytes&&hash(body)===expectedSha,'ORIGINAL_SOURCE_SHA_OR_LENGTH');
        report.authenticatedOriginal=true;
        await route.fulfill({response,body});
        return;
      }
      await route.continue({headers});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>{report.pageError=String(e.message).slice(0,400);});
    report.phase='ONE_LINK_AUTOLOAD';
    const nav=await page.goto(targetUrl,{waitUntil:'domcontentloaded',timeout:45000});
    check(nav?.status()===200&&page.url()===targetUrl,'REVIEW_URL_OR_HTTP');
    await page.waitForFunction(({id,sha})=>{
      const d=document.querySelector('#private-model-canvas')?.dataset;
      return d?.modelSource==='work-test' &&
        d?.workTestReviewAutoload==='true' &&
        d?.workTestReviewCandidate===id &&
        d?.workTestReviewMode===id+'-review' &&
        d?.d1fSource156OriginalAuthenticated==='true' &&
        d?.d1fSource156OriginalSha256===sha &&
        d?.d1fSource156SceneIndex==='156' &&
        d?.d1fSource156PixelIsolationReady==='true' &&
        d?.d1fSource156OriginalTargetCount==='7' &&
        d?.d1fSource156ProductionPixelsVerified==='false' &&
        d?.d1fSource156HumanReview==='NOT_RUN' &&
        d?.d1fSource156Current==='false' &&
        d?.d1fSource156Canonical==='false' &&
        d?.d1fSource156AsBuilt==='false';
    },{id,sha:expectedSha},{timeout:60000});
    check(report.authenticatedOriginal&&report.sourceRequests===1 &&
      report.unexpectedCurrentRequests===0,'SOURCE_FETCH_IDENTITY_OR_CROSSLOAD');
    const canvas=page.locator('#private-model-canvas');
    check(await canvas.evaluate(el=>Boolean(el.getContext('webgl2')||
      el.getContext('webgl'))),'REAL_WEBGL_CONTEXT');
    const capture=async(label)=>{
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const png=await canvas.screenshot({timeout:20000});
      fs.writeFileSync(dir+'/'+label+'.png',png);
      return decodeD1FScreenshotPng(png);
    };
    report.phase='GENERAL_WEBGL_PIXELS';
    const baseline=await capture('original-scene156-overview');
    const reference=[32,42,52];let colored=0;
    for(let i=0;i<baseline.rgba.length;i+=4){
      if(Math.max(...reference.map((c,k)=>Math.abs(baseline.rgba[i+k]-c)))>=24)colored++;
    }
    check(colored>=1000,'NON_BACKGROUND_PIXELS');
    report.generalNonBackgroundPixels=colored;
    const b=await canvas.boundingBox();check(b&&b.width>=256&&b.height>=256,'CANVAS_BOUNDS');
    await page.mouse.move(b.x+b.width*.45,b.y+b.height*.45);
    await page.mouse.down();
    await page.mouse.move(b.x+b.width*.58,b.y+b.height*.51,{steps:10});
    await page.mouse.up();
    const orbit=await capture('original-scene156-orbit');let changed=0;
    check(orbit.width===baseline.width&&orbit.height===baseline.height,'SCREENSHOT_DIMENSIONS');
    for(let i=0;i<baseline.rgba.length;i+=4){
      if(Math.max(Math.abs(orbit.rgba[i]-baseline.rgba[i]),
        Math.abs(orbit.rgba[i+1]-baseline.rgba[i+1]),
        Math.abs(orbit.rgba[i+2]-baseline.rgba[i+2]))>=28)changed++;
    }
    check(changed>=500,'WEBGL_ORBIT_CHANGED_PIXELS');
    report.orbitChangedPixels=changed;
    report.webGlRendered=true;
    report.result='PASS_GENERIC_ORIGINAL_WEBGL_ONLY';
    report.phase='COMPLETE';
  } catch(error) {
    report.failure=String(error?.message||error).slice(0,600);
    process.exitCode=1;
  } finally {
    write();
    if(browser156)await browser156.close();
    console.log(JSON.stringify(report));
  }
} else {
const LOCAL=process.env.D1F_SERVICE_LOCAL_TEST==='1';
const ORIGIN=LOCAL?'http://127.0.0.1:4321':'https://aapopihkala.fi';
const variant=process.env.D1F_SERVICE_VARIANT??ROWS[0].variant,OUT='test-results/d1f-service';
const hash=b=>createHash('sha256').update(b).digest('hex');
const check=(ok,code)=>{if(!ok)throw new Error(code);};
const evidence={result:'FAIL',candidateId:ID,variant,sourceSha256:ASSET.sha256,sourceBytes:ASSET.bytes,localTest:LOCAL,productionAuthenticatedVerified:false,humanReview:'NOT_RUN',targets:[],devices:[]};
fs.mkdirSync(OUT,{recursive:true});let browser;
const write=()=>fs.writeFileSync(OUT+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
const deadline=setTimeout(()=>{evidence.failure='DRIVER_DEADLINE';write();process.exit(1);},720000);
try{
 check(ROWS.some(r=>r.variant===variant),'INVALID_VARIANT');
 if(!LOCAL)check(process.env.GITHUB_EVENT_NAME==='workflow_dispatch'&&process.env.GITHUB_REF==='refs/heads/main'&&process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi','TRUSTED_MAIN_REQUIRED');
 const clientId=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID,clientSecret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
 if(!LOCAL)check(clientId&&clientSecret,'SERVICE_AUTH_REQUIRED');
 browser=await chromium.launch({headless:true,...(LOCAL&&process.env.D1F_SERVICE_CHROME?{executablePath:process.env.D1F_SERVICE_CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const path='/private-model/work-test/'+ID+'.glb';
 const localRaw=LOCAL?fs.readFileSync(process.env.D1F_SERVICE_LOCAL_GLB):null;
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==ORIGIN)return route.abort();
  if(LOCAL){
   if(url.pathname===path)return route.fulfill({status:200,contentType:'model/gltf-binary',body:localRaw});
   if(url.pathname==='/private-model/work-test/catalog.json')return route.fulfill({json:{candidates:[{id:ID,label:'Kylpyhuone ja lämmitys',path}]}});
   return route.continue();
  }
  return route.continue({headers:{...route.request().headers(),'CF-Access-Client-Id':clientId,'CF-Access-Client-Secret':clientSecret}});
 });
 const page=await context.newPage(),responses=[];page.on('response',r=>{if(r.url()===ORIGIN+path)responses.push(r);});
 page.on('pageerror',e=>{evidence.pageError=String(e.message).slice(0,500);});
 const canvas=page.locator('#private-model-canvas');const url=ORIGIN+'/private-model/?review='+ID+'-review&wallVariant='+variant;
 evidence.phase='AUTOLOAD';const nav=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});check(nav.status()===200&&page.url()===url,'HTTP_OR_URL');
 await page.waitForFunction(({ID,variant,sha})=>{const d=document.querySelector('#private-model-canvas')?.dataset;return d?.modelSource==='work-test'&&d.workTestReviewAutoload==='true'&&d.workTestReviewCandidate===ID&&d.workTestReviewMode===ID+'-review'&&d.d1fServiceReady==='true'&&d.d1fServiceVariant===variant&&d.d1fServiceSourceSha256===sha;},{ID,variant,sha:ASSET.sha256},{timeout:60000});
 check(responses.length===1&&responses[0].status()===200,'SOURCE_RESPONSE');const raw=await responses[0].body();check(raw.length===ASSET.bytes&&hash(raw)===ASSET.sha256,'EXACT_SOURCE_IDENTITY');
 check(await canvas.evaluate(c=>Boolean(c.getContext('webgl2')||c.getContext('webgl'))),'ACTUAL_WEBGL');
 const wc=await canvas.evaluate(c=>JSON.parse(c.dataset.d1fServiceWcProduct??'null'));check(wc?.model==='Nordic3 3530'&&wc.nominalWidthMm===355&&wc.nominalProjectionMm===535&&Math.abs(wc.centerYM-(wc.sideFacesYM[0]+wc.sideFacesYM[1])/2)<1e-9&&wc.equalSideClearanceMm===332.5&&wc.installedHeightVerified===true&&wc.closedLidState==='CLOSED'&&wc.closedLidTopAboveFinishedFloorMm===450&&Math.abs(wc.sourceClosedLidTopZM-wc.sourceFloorZM-.450)<1e-6,'WC_PRODUCT_CENTER_AND_MEASURED_CLOSED_LID_HEIGHT');evidence.wcProduct=wc;
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const capture=async name=>{await settle();const png=await canvas.screenshot({timeout:20000});fs.writeFileSync(OUT+'/'+name+'.png',png);return {...decodeD1FScreenshotPng(png),sha256:hash(png)};};
 const delta=(a,b,roi=null)=>{check(a.width===b.width&&a.height===b.height,'FRAME_SIZE');let inside=0,outside=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const i=4*(y*a.width+x);if(Math.max(...[0,1,2].map(k=>Math.abs(a.rgba[i+k]-b.rgba[i+k])))>=28){if(!roi||(x>=roi.x&&y>=roi.y&&x<roi.x+roi.width&&y<roi.y+roi.height))inside++;else outside++;}}return {inside,outside};};
 const initial=await capture('overview');let n=0;for(let i=0;i<initial.rgba.length;i+=4)if(Math.max(Math.abs(initial.rgba[i]-32),Math.abs(initial.rgba[i+1]-42),Math.abs(initial.rgba[i+2]-52))>=24)n++;check(n>=1500,'NON_BACKGROUND_FLOOR');evidence.nonBackgroundPixels=n;
 const bounds=await canvas.boundingBox();await page.mouse.move(bounds.x+bounds.width*.45,bounds.y+bounds.height*.48);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.55,bounds.y+bounds.height*.52,{steps:8});await page.mouse.up();const orbit=await capture('orbit');evidence.orbitChangedPixels=delta(initial,orbit).inside;check(evidence.orbitChangedPixels>=750,'ORBIT_FLOOR');
 evidence.phase='DEVICE_INTERACTION';
 for(const [id,d]of Object.entries(DEVICES)){
  await page.locator('#d1f-service-button').click();await page.locator('[data-service-target="'+id+'"]').click();
  check(await canvas.getAttribute('data-d1f-service-selected-target')===id,'WRONG_DEVICE');check(await canvas.getAttribute('data-d1f-service-heating-view')===d.route,'WRONG_AREA');
  const text=await page.locator('#d1f-service-selected-info').innerText();check(text.includes(d.outputW+' W')&&text.includes(d.group)&&text.includes('Nykyistä kytkentää ei ole varmennettu'),'DEVICE_PROVENANCE');
  check(await page.locator('#d1f-service-selected-info a').count()===2,'DEVICE_LINKS');const lastLink=page.locator('#d1f-service-selected-info a').last();await lastLink.scrollIntoViewIfNeeded();const linkBox=await lastLink.boundingBox(),panelBox=await page.locator('#selection-panel').boundingBox();check(linkBox.y>=panelBox.y&&linkBox.y+linkBox.height<=panelBox.y+panelBox.height+1,'SERVICE_LINK_CLIPPED');await capture(id.toLowerCase()+'-selected');evidence.devices.push({id,route:d.route,outputW:d.outputW,group:d.group,interaction:'PASS',linksWithinPanel:true});
 }
 await page.locator('#clear-selection-button').click();
 evidence.phase='EACH_SOURCE_TARGET_PIXELS';let requestId=0;
 const send=async(action,targetId,viewIndex=0)=>{const id=++requestId;await page.evaluate(detail=>window.dispatchEvent(new CustomEvent('d1f-service-source-probe',{detail})),{requestId:id,action,targetId,viewIndex});const v=await canvas.evaluate(c=>JSON.parse(c.dataset.d1fServiceProbe));check(v.requestId===id&&v.state!=='REJECTED','PROBE_'+action);return v;};
 const row=ROWS.find(r=>r.variant===variant);
 for(const targetId of Object.keys({...row.serviceNodes,...row.routes,...row.themos})){
  let passed=false;
  for(let view=0;view<3&&!passed;view++){
   const prepared=await send('prepare',targetId,view);check(prepared.sourceSha256===ASSET.sha256,'PROBE_SOURCE_SHA');
   try{
    const before=await capture(targetId.toLowerCase()+'-v'+view+'-before');const hidden=await send('suppress',targetId);const without=await capture(targetId.toLowerCase()+'-v'+view+'-hidden');const restored=await send('restore',targetId);const after=await capture(targetId.toLowerCase()+'-v'+view+'-restored');
    check(hidden.cameraFingerprint===prepared.cameraFingerprint&&restored.cameraFingerprint===prepared.cameraFingerprint,'FIXED_CAMERA');
    const diff=delta(before,without,prepared.roi),restore=delta(before,after);check(restore.inside+restore.outside<=8,'RESTORATION');
    if(diff.inside>=80&&diff.outside<=8){evidence.targets.push({targetId,view,sourceNode:prepared.sourceNode,roi:prepared.roi,changedInside:diff.inside,changedOutside:diff.outside,restoredChangedPixels:restore.inside+restore.outside,beforeSha256:before.sha256,hiddenSha256:without.sha256,restoredSha256:after.sha256});passed=true;}
   }finally{await send('finish',targetId);}
  }
  check(passed,'TARGET_NOT_RENDERED_'+targetId);console.log(JSON.stringify({targetId,result:'PASS'}));
 }
 await page.locator('#d1f-heating-preset').click();check(await canvas.getAttribute('data-d1f-service-heating-view')==='ALL','HEATING_PRESET');await capture('heating-preset');
 evidence.phase='NATIVE_HEATING_PRESET_PIXELS';evidence.nativePresetTargets=[];
 for(const targetId of Object.keys(row.routes)){
  const prepared=await send('prepare-native',targetId);check(prepared.nativePreset===true&&prepared.projection==='orthographic'&&prepared.sourceSha256===ASSET.sha256,'NATIVE_PLAN_SOURCE');
  try{
   const before=await capture('native-'+targetId.toLowerCase()+'-before');await send('suppress',targetId);const hidden=await capture('native-'+targetId.toLowerCase()+'-hidden');await send('restore',targetId);const restored=await capture('native-'+targetId.toLowerCase()+'-restored');
   const diff=delta(before,hidden,prepared.roi),restore=delta(before,restored);check(diff.inside>=80&&diff.outside<=8&&restore.inside+restore.outside<=8,'NATIVE_PRESET_AREA_NOT_RENDERED_'+targetId);
   evidence.nativePresetTargets.push({targetId,sourceNode:prepared.sourceNode,roi:prepared.roi,changedInside:diff.inside,changedOutside:diff.outside,restoredChangedPixels:restore.inside+restore.outside,beforeSha256:before.sha256,hiddenSha256:hidden.sha256,restoredSha256:restored.sha256});
  }finally{await send('finish',targetId);}
 }
 evidence.phase='COMPLETE';check(evidence.targets.length===12&&evidence.devices.length===3&&evidence.nativePresetTargets.length===3,'TARGET_COVERAGE');evidence.result='PASS';evidence.productionAuthenticatedVerified=!LOCAL;
}catch(e){evidence.failure=String(e.message).slice(0,600);process.exitCode=1;}
finally{clearTimeout(deadline);write();if(browser)await browser.close();console.log(JSON.stringify(evidence));}



}
