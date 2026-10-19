/** Exact original D1F SOURCE156 seven-target production WebGL screenshot gate.
 * Standalone opt-in on trusted MAIN workflow_dispatch only.
 * This script does not publish a model, approve HUMAN_REVIEW or set viewer state.
 * Never write Access tokens, raw GLB or screenshot bytes to artifacts or logs.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';

export const SOURCE156={
  id:'d1f-source156-mirror305-k2-oak-u-two-pulls-20261018',
  sha256:'14eed1eff91785682ac7d5c7cd0e9dec6b2ba053f41f539242e2ab120a29af51',
  bytes:9792656,scene:156,scenes:158,
  keys:['mirror305','wc','odensvik','bosch','shower-glass-two-pulls','white-shelf','sauna-u'],
};
const ORIGIN='https://aapopihkala.fi';
const SOURCE_URL=ORIGIN+'/private-model/work-test/'+SOURCE156.id+'.glb';
const REVIEW=SOURCE156.id+'-review';
const OUT='test-results/d1f-source156-seven-original-production/';
const digest=x=>createHash('sha256').update(x).digest('hex');
export class Source156PixelFailure extends Error {
  constructor(code){super('D1F_SOURCE156_PIXEL_'+code);this.code=code;}
}
const insist=(condition,code)=>{if(!condition)throw new Source156PixelFailure(code);};
const ids=(start,count)=>Array.from({length:count},(_,i)=>start+i);
const DEFINITIONS=[
  {key:'mirror305',root:2855,ids:ids(2583,14)},
  {key:'wc',root:2855,ids:[2251]},
  {key:'odensvik',root:2855,ids:[2580,2581,2486]},
  {key:'bosch',root:2855,ids:ids(2499,27)},
  {key:'shower-glass-two-pulls',root:2771,ids:ids(2733,37)},
  {key:'white-shelf',root:2772,ids:ids(2773,17)},
  {key:'sauna-u',root:2653,ids:ids(2654,53)},
];

/** Full raw digest is mandatory. The independently decoded glTF root and
 * original node identities must agree with the read-only viewer bridge.
 */
export function verifySource156OriginalGlb(bytes) {
  insist(Buffer.isBuffer(bytes) && bytes.length===SOURCE156.bytes &&
    bytes.readUInt32LE(0)===0x46546c67 &&
    bytes.readUInt32LE(4)===2 && bytes.readUInt32LE(8)===bytes.length &&
    digest(bytes)===SOURCE156.sha256,'ORIGINAL_BINARY_IDENTITY');
  const len=bytes.readUInt32LE(12);
  insist(bytes.readUInt32LE(16)===0x4e4f534a &&
    len>=100 && len%4===0 && len+20<bytes.length,
    'ORIGINAL_GLB_JSON_CHUNK');
  let g;
  try{g=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));}
  catch{throw new Source156PixelFailure('ORIGINAL_JSON_PARSE');}
  insist(g?.asset?.version==='2.0' && g.scene===156 &&
    g.scenes?.length===SOURCE156.scenes &&
    JSON.stringify(g.scenes?.[156]?.nodes)===
      JSON.stringify([2855,2615,2640,2653,2707,2771,2772]) &&
    g.nodes?.[2855]?.name===
      'SOURCE156_ROOM_MIRROR_CONDITIONAL_305MM_SOURCE_CLONE_2770_WORK_TEST' &&
    g.nodes?.[2771]?.name===
      'TWO_HANDLE_SOURCE_EXACT_GLASS_REPLACEMENT_WORK_TEST_ONLY' &&
    g.nodes?.[2772]?.name===
      'D1F_SHELF_PHOTO_RIGHT_SOURCE146_HOST_WORLD_Y_UP_UNSURVEYED',
    'ORIGINAL_SCENE_ROOT_IDENTITY');
  const descendants=root=>{
    const seen=new Set(),remaining=[root];
    while(remaining.length){
      const id=remaining.pop();
      insist(Number.isInteger(id) && g.nodes?.[id] && !seen.has(id),
        'ORIGINAL_DESCENDANT_TREE');
      seen.add(id);
      const children=g.nodes[id].children??[];
      insist(Array.isArray(children),'ORIGINAL_DESCENDANT_CHILDREN');
      remaining.push(...children);
    }
    return seen;
  };
  const byRoot=new Map([2855,2653,2771,2772].map(root=>[root,descendants(root)]));
  const all=DEFINITIONS.flatMap(d=>d.ids);
  insist(all.length===152 && new Set(all).size===152 &&
    DEFINITIONS.every(d=>d.ids.every(id=>
      byRoot.get(d.root)?.has(id) &&
      typeof g.nodes[id]?.name==='string' &&
      Number.isInteger(g.nodes[id]?.mesh))),
    'ORIGINAL_152_SOURCE_NODES');
  return Object.freeze({sha256:SOURCE156.sha256,bytes:SOURCE156.bytes,
    scene:156,originalTargetCount:7,originalSourceNodeCount:152,
    keys:Object.freeze(DEFINITIONS.map(d=>d.key)),sourceAuthenticated:true,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN'});
}

/** Validate camera projections independently of the viewer status claim.
 * The actual viewer may return an offscreen/occluded object: fail closed.
 */
export function verifySource156Projection(p, focusedKey) {
  insist(SOURCE156.keys.includes(focusedKey),'FOCUS_KEY');
  insist(p?.sourceSceneIndex===156 && p.originalTargetCount===7 &&
    p.productionPixelsVerified===false && p.humanReview==='NOT_RUN' &&
    Array.isArray(p.centers) && p.centers.length===7,
    'SEVEN_PROJECTION_CONTRACT');
  const found=new Set();
  for(let i=0;i<7;i++){
    const c=p.centers[i],key=SOURCE156.keys[i];
    insist(c?.key===key && !found.has(key) &&
      Number.isFinite(c.u) && Number.isFinite(c.v) &&
      typeof c.onScreen==='boolean',
      'PROJECTED_ORIGINAL_IDENTITY_OR_WRONG_ORDER');
    found.add(key);
  }
  const focused=p.centers.find(c=>c.key===focusedKey);
  insist(focused?.onScreen===true &&
    focused.u>0 && focused.u<1 && focused.v>0 && focused.v<1,
    'FOCUSED_ORIGINAL_OFFSCREEN');
  return focused;
}

/** Pure visible RGB pixel proof; exact RGBA restore. Synthetic fixtures
 * cannot establish authenticated production provenance by themselves.
 */
export function verifySource156FrameTriplet({before,hidden,restored,center}) {
  const frames=[before,hidden,restored];
  insist(frames.every(f=>Number.isInteger(f?.width) &&
    Number.isInteger(f?.height) && f.width>=256 && f.height>=256 &&
    f.width*f.height<=4000000 && f.rgba instanceof Uint8Array &&
    f.rgba.length===f.width*f.height*4 &&
    f.width===before.width && f.height===before.height),
    'PNG_SHAPE');
  insist(center?.onScreen===true &&
    Number.isFinite(center.u) && Number.isFinite(center.v) &&
    center.u>0 && center.u<1 && center.v>0 && center.v<1 &&
    SOURCE156.keys.includes(center.key),'SOURCE_CENTER');
  const w=before.width,h=before.height;
  const x=Math.round(center.u*(w-1)),y=Math.round(center.v*(h-1));
  const radius=Math.max(20,Math.round(Math.min(w,h)*0.065));
  let changed=0,roiChanged=0,restoreDelta=0;
  for(let i=0;i<w*h;i++){
    const at=i*4;let rgbChange=false,notRestored=false;
    for(let k=0;k<4;k++){
      if(k<3 && Math.abs(before.rgba[at+k]-hidden.rgba[at+k])>=24)
        rgbChange=true;
      if(before.rgba[at+k]!==restored.rgba[at+k])notRestored=true;
    }
    if(notRestored)restoreDelta++;
    if(rgbChange){
      changed++;
      const dx=i%w-x,dy=Math.floor(i/w)-y;
      if(dx*dx+dy*dy<=radius*radius)roiChanged++;
    }
  }
  const offRoiChanged=changed-roiChanged;
  const offRoiLimit=Math.max(512,roiChanged*12);
  insist(changed>=16 && roiChanged>=4 &&
    offRoiChanged<=offRoiLimit && restoreDelta===0,
    'SOURCE_VISIBLE_RGB_AND_EXACT_RESTORE');
  return Object.freeze({key:center.key,changedRgbPixels:changed,
    roiChangedRgbPixels:roiChanged,offRoiChangedRgbPixels:offRoiChanged,
    restoredRgbaDiffPixels:restoreDelta,roiRadius:radius,
    authenticatedProduction:false,humanReview:'NOT_RUN'});
}

export async function runSource156ProductionProof({env=process.env,browserType}={}){
  const report={result:'FAIL',stage:'TRUSTED_MAIN',failureCode:null,
    sourceId:SOURCE156.id,sourceSha256:SOURCE156.sha256,
    sourceBytes:SOURCE156.bytes,scene:156,originalNodeCount:152,
    targetCount:7,actualProductionWebglSourcePixelsVerified:false,
    originalSourceAuthenticated:false,oneLinkAutoload:false,
    sourceEvidence:[],current:false,canonical:false,asBuilt:false,
    humanReview:'NOT_RUN'};
  let browser=null,context=null,canvas=null;
  try{
    insist(env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi' &&
      env.GITHUB_REF==='refs/heads/main' &&
      env.GITHUB_EVENT_NAME==='workflow_dispatch' &&
      env.PROBE_MODE==='d1f-source156-original7-pixels',
      'TRUSTED_MAIN_DISPATCH_ONLY');
    insist(Boolean(env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID &&
      env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET),'SERVICE_SECRETS_REQUIRED');
    if(!browserType)({chromium:browserType}=await import('@playwright/test'));
    browser=await browserType.launch({headless:true});
    context=await browser.newContext({viewport:{width:1536,height:900},
      deviceScaleFactor:1});
    let originalRequests=0,sourceAuthenticated=false,wrongSource=0;
    await context.route('**/*',async route=>{
      const request=route.request(),url=request.url();
      if(!url.startsWith(ORIGIN+'/')){await route.continue();return;}
      const headers={...request.headers(),
        'cf-access-client-id':env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID,
        'cf-access-client-secret':env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET};
      if(url===ORIGIN+'/private-model/model.glb' ||
          (url.startsWith(ORIGIN+'/private-model/work-test/') &&
          url.endsWith('.glb') && url!==SOURCE_URL))wrongSource++;
      if(url===SOURCE_URL){
        originalRequests++;
        try{
          const response=await route.fetch({headers,maxRedirects:0,
            maxRetries:0,timeout:30000});
          const raw=await response.body();
          insist(response.status()===200 && response.url()===SOURCE_URL,
            'ORIGINAL_HTTP_RESPONSE');
          verifySource156OriginalGlb(raw);
          sourceAuthenticated=true;
          await route.fulfill({response,body:raw});
        }catch(e){
          await route.abort();
          throw e instanceof Source156PixelFailure ? e :
            new Source156PixelFailure('SOURCE_FETCH');
        }
      }else await route.continue({headers});
    });
    report.stage='AUTHENTICATED_AUTOLOAD';
    const page=await context.newPage();
    await page.goto(ORIGIN+'/private-model/?review='+encodeURIComponent(REVIEW),
      {waitUntil:'domcontentloaded',timeout:60000});
    canvas=page.locator('#private-model-canvas');
    await page.waitForFunction(({id,sha})=>{
      const d=document.querySelector('#private-model-canvas')?.dataset;
      return d?.modelSource==='work-test' &&
        d.workTestReviewAutoload==='true' &&
        d.p137eLoadedCandidateId===id &&
        d.d1fSource156OriginalAuthenticated==='true' &&
        d.d1fSource156PixelIsolationReady==='true' &&
        d.d1fSource156OriginalSha256===sha;
    },{id:SOURCE156.id,sha:SOURCE156.sha256},{timeout:80000});
    insist(originalRequests===1 && wrongSource===0 && sourceAuthenticated,
      'ACTUAL_ONE_LINK_ORIGINAL_SOURCE');
    report.originalSourceAuthenticated=true;
    report.oneLinkAutoload=true;
    const state=await canvas.evaluate(el=>({
      scene:el.dataset.d1fSource156SceneIndex,
      count:el.dataset.d1fSource156OriginalTargetCount,
      current:el.dataset.d1fSource156Current,
      canonical:el.dataset.d1fSource156Canonical,
      asBuilt:el.dataset.d1fSource156AsBuilt,
      humanReview:el.dataset.d1fSource156HumanReview,
      prematurePixels:el.dataset.d1fSource156ProductionPixelsVerified,
    }));
    insist(state.scene==='156' && state.count==='7' &&
      state.current==='false' && state.canonical==='false' &&
      state.asBuilt==='false' && state.humanReview==='NOT_RUN' &&
      state.prematurePixels==='false','VIEWER_NO_PROMOTION');
    report.stage='SEVEN_SOURCE_CAMERAS';
    const methods=await canvas.evaluate(el=>({
      focus:typeof el.d1fSource156FocusOriginalTarget==='function',
      project:typeof el.d1fSource156RefreshOriginalProjection==='function',
      visibility:typeof el.d1fSource156SetOriginalVisibility==='function',
      restore:typeof el.d1fSource156RestoreOriginalVisibility==='function',
    }));
    insist(Object.values(methods).every(Boolean),'SEVEN_ORIGINAL_CAMERA_BRIDGE');
    const bounds=await canvas.boundingBox();
    insist(Boolean(bounds) && bounds.width>=256 && bounds.height>=256,
      'VISIBLE_RENDER_CANVAS');
    const capture=async()=>decodeD1FScreenshotPng(
      await canvas.screenshot({animations:'disabled',timeout:20000}));
    report.stage='SEVEN_ACTUAL_ORIGINAL_TARGET_PIXELS';
    for(const key of SOURCE156.keys){
      try{
        const camera=await canvas.evaluate(key=>
          document.querySelector('#private-model-canvas')
            .d1fSource156FocusOriginalTarget(key),key);
        insist(camera?.key===key && camera.sourceSceneIndex===156 &&
          camera.verticalFovDegrees===50 &&
          camera.productionPixelsVerified===false &&
          camera.humanReview==='NOT_RUN' &&
          camera.current===false && camera.canonical===false &&
          camera.asBuilt===false,
          'ORIGINAL_TARGET_CAMERA_IDENTITY');
        await page.waitForTimeout(120);
        const projected=await canvas.evaluate(el=>({
          cameraKey:el.dataset.d1fSource156OriginalCameraKey,
          projection:el.d1fSource156RefreshOriginalProjection(),
        }));
        insist(projected.cameraKey===key,'ORIGINAL_CAMERA_NOT_SELECTED');
        const center=verifySource156Projection(projected.projection,key);
        // Every original group uses its OWN verified perspective and baseline.
        // The six unrelated original groups may legitimately be off-screen.
        const before=await capture();
        const hiddenState=await canvas.evaluate(key=>
          document.querySelector('#private-model-canvas')
            .d1fSource156SetOriginalVisibility(key,'HIDE'),key);
        insist(hiddenState?.key===key && hiddenState.activeHiddenCount===1 &&
          hiddenState.sourceSceneIndex===156 &&
          hiddenState.humanReview==='NOT_RUN' &&
          hiddenState.productionPixelsVerified===false,
          'HIDE_TARGET');
        await page.waitForTimeout(120);
        const hidden=await capture();
        const restoredState=await canvas.evaluate(key=>
          document.querySelector('#private-model-canvas')
            .d1fSource156SetOriginalVisibility(key,'RESTORE'),key);
        insist(restoredState?.key===key && restoredState.activeHiddenCount===0 &&
          restoredState.sourceSceneIndex===156,
          'RESTORE_TARGET');
        await page.waitForTimeout(120);
        const restored=await capture();
        report.sourceEvidence.push(verifySource156FrameTriplet({
          before,hidden,restored,center}));
      }finally{
        await canvas.evaluate(el=>el.d1fSource156RestoreOriginalVisibility?.())
          .catch(()=>{});
      }
    }
    insist(report.sourceEvidence.length===7 &&
      report.sourceEvidence.every((x,i)=>
        x.key===SOURCE156.keys[i] &&
        x.changedRgbPixels>=16 &&
        x.roiChangedRgbPixels>=4 &&
        x.restoredRgbaDiffPixels===0),
      'ALL_SEVEN_ORIGINAL_VISIBLE_RGB');
    report.result='PASS';report.stage='COMPLETE';
    report.actualProductionWebglSourcePixelsVerified=true;
  }catch(e){
    report.failureCode=e instanceof Source156PixelFailure ?
      e.code:'BROWSER_OR_UNEXPECTED';
  }finally{
    if(canvas)await canvas.evaluate(el=>
      el.d1fSource156RestoreOriginalVisibility?.()).catch(()=>{});
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    mkdirSync(OUT,{recursive:true});
    writeFileSync(OUT+'seven-original-source-pixels.json',
      JSON.stringify(report,null,2)+'\n');
  }
  return report;
}
if(process.argv[1]?.endsWith('private-model-d1f-source156-seven-production-probe.mjs')){
  const result=await runSource156ProductionProof();
  if(result.result!=='PASS'){
    console.error('D1F SOURCE156 original seven production pixels FAIL: '+result.failureCode);
    process.exitCode=1;
  }else console.log('D1F SOURCE156 seven original source WebGL pixel targets verified');
}
