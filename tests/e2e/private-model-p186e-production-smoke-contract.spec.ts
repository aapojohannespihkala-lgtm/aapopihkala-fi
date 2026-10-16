import {test,expect} from '@playwright/test';
import type {BrowserType,Request} from 'playwright';
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  P186E_PRODUCTION_FLOORS,expectedP186EProductionDataset,
  validateP186EProductionDataset,countP186EFramePixels,
  P186E_PRODUCTION_SOURCE,verifyP186EProductionSourceResponse,
  runP186EProductionProbe,classifyP186EProductionFailure,
  captureP186EProductionSourceRequest,
} from '../../.github/scripts/private-model-p186e-production-probe.mjs';
import {P186ECaptionFailure} from '../../src/scripts/privateModelP186ECaptionPixelEvidence.mjs';

const good = (floor: 'D1F'|'D2F') => ({
  ...expectedP186EProductionDataset(floor),
  p186eReviewContextRenderableCount:'5',
});

test('both exact historic D floors keep source-only 18+16 identity and no-promotion',()=>{
  expect(P186E_PRODUCTION_FLOORS).toEqual(['D1F','D2F']);
  expect(validateP186EProductionDataset('D1F',good('D1F')))
    .toMatchObject({sourceLabels:18,groups:14,special:4,noPromotion:true});
  expect(validateP186EProductionDataset('D2F',good('D2F')))
    .toMatchObject({sourceLabels:16,groups:15,special:1,noPromotion:true});
  expect(good('D1F')).toMatchObject({
    modelSource:'work-test',workTestReviewAutoload:'true',
    p186eHumanReview:'NOT_RUN',p186eCurrentClaim:'false',
    p186eCanonical:'false',p186eAsBuiltClaim:'false',
  });
});

test('missing source, wrong floor count, physical promotion, absent wall fail closed',()=>{
  for(const change of [
    {modelSource:'current'},{workTestReviewAutoload:'false'},
    {p186eReviewTargetRenderableCount:'17'},{p186eReviewGroupTargetCount:'15'},
    {p186eSourceContextReady:'false'},
    {p186eExactCurrentXYClaim:'true'}, {p186eAsBuiltClaim:'true'},
    {p186eCanonical:'true'}, {p186eHumanReview:'PASS'},
  ]){
    expect(()=>validateP186EProductionDataset('D1F',{...good('D1F'),...change}))
      .toThrow(/P186E_PROD_DATASET_SOURCE_OR_PROMOTION/);
  }
  expect(()=>validateP186EProductionDataset('D2F',{
    ...good('D2F'),p186eReviewContextRenderableCount:'0',
  })).toThrow(/DRAWABLE_ARCHITECTURE_CONTEXT/);
  expect(()=>expectedP186EProductionDataset('D3F')).toThrow(/P186E_PROD_FLOOR/);
});

test('screen pixels only support aggregate render proof, not 34 individual pixels',()=>{
  const rgba=new Uint8Array(64*64*4);
  for(let i=0;i<rgba.length;i+=4)rgba.set([32,42,52,255],i);
  for(let i=0;i<64;i+=1)rgba.set([255,211,77,255],i*4);
  const value=countP186EFramePixels(rgba,64,64);
  expect(value).toMatchObject({aggregateAmberPixels:64,
    nonBackgroundPixels:64,individuallyIsolatedTargetsVerified:0});
  expect(()=>countP186EFramePixels(new Uint8Array(4),64,64))
    .toThrow(/P186E_PROD_RGBA/);
});

test('production workflow only dispatches this probe on protected main with server-side secrets',()=>{
  const yaml=readFileSync('.github/workflows/private-model-production-review-smoke.yml','utf8');
  const script=readFileSync('.github/scripts/private-model-p186e-production-probe.mjs','utf8');
  expect(yaml).toContain('- p186e-labels-render');
  expect(yaml).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.probe_mode == 'p186e-labels-render'");
  expect(yaml).toContain('node .github/scripts/private-model-p186e-production-probe.mjs');
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_ID: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_ID }}');
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET: ${{ secrets.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET }}');
  expect(script).toContain('all34IndividuallyVerified:false');
  expect(script).toContain("env.GITHUB_REF==='refs/heads/main'");
  expect(script).toContain("env.GITHUB_EVENT_NAME==='workflow_dispatch'");
  expect(script).toContain("env.PROBE_MODE==='p186e-labels-render'");
  expect(script).toContain('const report=await runP186EProductionProbe()');
  expect(script).toContain("if(report.result!=='PASS')process.exitCode=1");
  expect(script).not.toContain("publishToCURRENT:true");
});

const foreignGlb=()=>{
  const bytes=Buffer.alloc(P186E_PRODUCTION_SOURCE.byteLength);
  bytes.writeUInt32LE(0x46546c67,0);bytes.writeUInt32LE(2,4);
  bytes.writeUInt32LE(bytes.length,8);
  return bytes;
};
const sourceResponse=(bytes:Buffer,overrides:Record<string,unknown>={})=>({
  url:()=>P186E_PRODUCTION_SOURCE.url,status:()=>200,
  headers:()=>({'content-type':'model/gltf-binary'}),body:async()=>bytes,
  ...overrides,
});

test('a plausible same-size GLB cannot authenticate by header, dataset or pixel count',async()=>{
  await expect(verifyP186EProductionSourceResponse(sourceResponse(foreignGlb())))
    .rejects.toThrow(/ORIGINAL_GLB_DIGEST/);
  await expect(verifyP186EProductionSourceResponse(sourceResponse(Buffer.alloc(16))))
    .rejects.toThrow(/ORIGINAL_GLB_SIZE/);
  const badHeader=foreignGlb();badHeader.writeUInt32LE(1,4);
  await expect(verifyP186EProductionSourceResponse(sourceResponse(badHeader)))
    .rejects.toThrow(/ORIGINAL_GLB_HEADER/);
});

test('wrong URL, HTTP and HTML responses are rejected before reading their body',async()=>{
  let reads=0;
  for(const overrides of [
    {url:()=>P186E_PRODUCTION_SOURCE.url+'?different-source=1'},
    {url:()=> 'https://aapopihkala.fi/private-model/model.glb'},
    {status:()=>302},{status:()=>404},
    {headers:()=>({'content-type':'text/html'})},
  ]){
    await expect(verifyP186EProductionSourceResponse(sourceResponse(Buffer.alloc(0),{
      ...overrides,body:async()=>{reads++;return foreignGlb();},
    }))).rejects.toThrow(/ORIGINAL_GLB_(RESPONSE|CONTENT_TYPE)/);
  }
  expect(reads).toBe(0);
});

// Exercise the exported driver used by the CLI, rather than a copied guard.
// These are deliberately synthetic browser events, never production evidence.
for(const scenario of ['missing','duplicate','current','corrupt','html','body-unavailable']){
  test('actual production driver rejects '+scenario+' autoload before screenshots',async()=>{
    const outputDirectory=mkdtempSync(join(tmpdir(),'p186e-source-gate-'));
    let screenshots=0,closed=false,currentUrl='';
    let routeHandler:Function;
    const listeners=new Map<string,Function>();
    const canvas={
      evaluate:async()=>good('D1F'),
      screenshot:async()=>{screenshots++;throw Error('MUST_NOT_CAPTURE_UNVERIFIED_SOURCE');},
    };
    const page={
      locator:()=>canvas,on:(name:string,fn:Function)=>listeners.set(name,fn),
      url:()=>currentUrl,waitForFunction:async()=>{},
      goto:async(url:string)=>{
        currentUrl=url;
        if(scenario!=='missing'){
          const request={url:()=>P186E_PRODUCTION_SOURCE.url,headers:()=>({})};
          const response=sourceResponse(foreignGlb(),scenario==='html'?
            {headers:()=>({'content-type':'text/html'})}:scenario==='body-unavailable'?
            {body:async()=>{throw Error('response.body: No resource with given identifier found test-only-secret');}}:{});
          listeners.get('request')!(request);
          if(['corrupt','html','body-unavailable'].includes(scenario))
            await routeHandler({request:()=>request,fetch:async()=>({...response,dispose:async()=>{}}),
              fulfill:async()=>{},abort:async()=>{}});
          listeners.get('response')!({...response,request:()=>request});
        }
        if(scenario==='duplicate'){
          listeners.get('request')!({url:()=>P186E_PRODUCTION_SOURCE.url});
          listeners.get('response')!(sourceResponse(foreignGlb()));
        }
        if(scenario==='current')listeners.get('request')!({
          url:()=> 'https://aapopihkala.fi/private-model/model.glb',
        });
        return {status:()=>200,headers:()=>({'content-type':'text/html'})};
      },
    };
    const env={
      GITHUB_REPOSITORY:'aapojohannespihkala-lgtm/aapopihkala-fi',
      GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_dispatch',
      PROBE_MODE:'p186e-labels-render',CF_ACCESS_VIEWER_PROBE_CLIENT_ID:'test-only-id',
      CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET:'test-only-secret',
    };
    try{
      const report=await runP186EProductionProbe({env,outputDirectory,logger:()=>{},
        browserType:{launch:async()=>({
          newContext:async()=>({route:async(_pattern:string,handler:Function)=>{routeHandler=handler;},newPage:async()=>page}),
          close:async()=>{closed=true;},
        })} as unknown as BrowserType,
      });
      expect(report).toMatchObject({result:'FAIL',stage:'ORIGINAL_SOURCE_GLB_D1F',
        originalSourceGlbDigestVerified:false,authenticatedBrowserProbe:false,
        all34IndividuallyVerified:false,current:false,canonical:false,asBuilt:false,
        humanReview:'NOT_RUN',views:[],
      });
      expect(report.failureCode).toBe('P186E_PROD_'+(scenario==='corrupt'?
        'ORIGINAL_GLB_DIGEST':scenario==='html'?'ORIGINAL_GLB_CONTENT_TYPE':
          scenario==='body-unavailable'?'BROWSER_RESOURCE_UNAVAILABLE':'ORIGINAL_GLB_AUTOLOAD'));
      expect(report.sourceGlbChecks).toEqual([]);
      expect(screenshots).toBe(0);expect(closed).toBe(true);
      const saved=readFileSync(join(outputDirectory,'evidence.json'),'utf8');
      expect(JSON.parse(saved)).toEqual(report);
      expect(saved).not.toContain('test-only-secret');
    }finally{rmSync(outputDirectory,{recursive:true,force:true});}
  });
}

test('browser failures emit fixed technical classes and never copy untrusted messages',()=>{
  expect(classifyP186EProductionFailure(new P186ECaptionFailure('GLYPH_PIXELS')))
    .toBe('P186E_CAPTION_GLYPH_PIXELS');
  for(const [message,code] of [
    ['Request content was evicted from inspector cache','BROWSER_RESOURCE_EVICTED'],
    ['No data found for resource with given identifier','BROWSER_RESOURCE_UNAVAILABLE'],
    ['Cannot get context from a canvas transferred to offscreen','BROWSER_OFFSCREEN_CONTEXT'],
    ['Function statements require a function name','BROWSER_CALLBACK_SERIALIZATION'],
    ['Execution context was destroyed','BROWSER_EXECUTION_CONTEXT_DESTROYED'],
    ['Target page, context or browser has been closed','BROWSER_TARGET_CLOSED'],
    ['Timeout 30000ms exceeded','BROWSER_TIMEOUT'],
    ['SecurityError: Tainted canvases may not be exported','BROWSER_SECURITY'],
    ['page.evaluate: TypeError: cannot call method','BROWSER_TYPE_ERROR'],
  ]) expect(classifyP186EProductionFailure(Error(message+' test-only-secret')))
    .toBe('P186E_PROD_'+code);
  for(const message of ['test-only-secret','P186E_PROD_test-only-secret'])
    expect(classifyP186EProductionFailure(Error(message)))
      .toBe('UNEXPECTED_BROWSER_OR_SOURCE_FAILURE');
});

test('same browser request forwards the complete decompressed 3MB body once',async({browser})=>{
  const bytes=foreignGlb();
  const expectedHash=createHash('sha256').update(bytes).digest('hex');
  let upstreamRequests=0,requestId='';
  const server=createServer((request,response)=>{
    if(request.url==='/source.glb'){
      upstreamRequests++;requestId=String(request.headers['x-local-test-id']);
      response.writeHead(200,{'content-type':'model/gltf-binary','content-encoding':'gzip'});
      response.end(gzipSync(bytes));
    }else{response.writeHead(200,{'content-type':'text/html'});response.end('<!doctype html><title>Local forwarding fixture</title>');}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',()=>resolve()));
  const origin='http://127.0.0.1:'+(server.address() as AddressInfo).port;
  const context=await browser.newContext();
  const page=await context.newPage();
  let captureHash='',browserRequests=0,bound=false;
  let capturedRequest:Request;
  page.on('request',request=>{if(request.url()===origin+'/source.glb')browserRequests++;});
  page.on('response',response=>{
    if(response.url()===origin+'/source.glb')bound=response.request()===capturedRequest;
  });
  await context.route(origin+'/source.glb',async route=>{
    const capture=await captureP186EProductionSourceRequest(route,{
      ...route.request().headers(),'x-local-test-id':'forwarded-once',
    });
    try{
      capturedRequest=capture.request;
      captureHash=createHash('sha256').update(capture.bytes).digest('hex');
      await route.fulfill({response:capture.response,body:capture.bytes});
    }finally{await capture.response.dispose();}
  });
  try{
    await page.goto(origin);
    const actual=await page.evaluate(async()=>{
      const response=await fetch('/source.glb');
      const bytes=await response.arrayBuffer();
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return {status:response.status,type:response.headers.get('content-type'),
        length:bytes.byteLength,sha256:Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('')};
    });
    expect(actual).toEqual({status:200,type:'model/gltf-binary',length:bytes.length,sha256:expectedHash});
    expect(captureHash).toBe(expectedHash);expect(bound).toBe(true);
    expect(browserRequests).toBe(1);expect(upstreamRequests).toBe(1);
    expect(requestId).toBe('forwarded-once');
  }finally{await context.close();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('source capture never follows redirects or retries and disposes failed body reads',async()=>{
  let options:Record<string,unknown>={},disposed=false;
  const headers={'CF-Access-Client-Id':'test-only-id','CF-Access-Client-Secret':'test-only-secret'};
  await expect(captureP186EProductionSourceRequest({
    request:()=>({}),fetch:async(value:Record<string,unknown>)=>{
      options=value;return {body:async()=>{throw Error('unavailable');},dispose:async()=>{disposed=true;}};
    },
  },headers)).rejects.toThrow('unavailable');
  expect(options).toEqual({headers,maxRedirects:0,maxRetries:0,timeout:25000});
  expect(disposed).toBe(true);
});

