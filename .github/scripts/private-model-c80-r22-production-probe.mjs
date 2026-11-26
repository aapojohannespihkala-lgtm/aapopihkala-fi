import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
import {C80_620R22_GLB_SHA256 as SHA,C80_620R22_GLB_BYTES as BYTES} from '../../src/scripts/privateModelC80620R22SourceProfile.mjs';
const ID='c80-620r22-r21-s2vp1-k1k2k5k6k7k9-20261119',ORIGIN='https://aapopihkala.fi';
const dir='test-results/c80-r22-production';fs.mkdirSync(dir,{recursive:true});
const check=(v,c)=>{if(!v)throw new Error(c);};
const report={result:'FAIL',candidate:ID,expectedSHA256:SHA,sourceAuthenticated:false,productionWebGL:false,humanReview:'NOT_RUN',errors:[]};
let browser;
try{
 check(process.env.GITHUB_REF==='refs/heads/main'&&process.env.GITHUB_REPOSITORY==='aapojohannespihkala-lgtm/aapopihkala-fi'&&process.env.GITHUB_EVENT_NAME==='workflow_dispatch','TRUSTED_MAIN_ONLY');
 const id=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID,secret=process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;check(id&&secret,'ACCESS_REQUIRED');
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await context.route('**/*',async route=>{
  const req=route.request();if(!req.url().startsWith(ORIGIN+'/'))return route.continue();
  const headers={...req.headers(),'CF-Access-Client-Id':id,'CF-Access-Client-Secret':secret};
  if(req.url()===ORIGIN+'/private-model/work-test/'+ID+'.glb'){
   const response=await route.fetch({headers,maxRedirects:0,timeout:120000}),body=await response.body();
   check(response.status()===200&&body.length===BYTES&&createHash('sha256').update(body).digest('hex')===SHA,'EXACT_SOURCE_READBACK');report.sourceAuthenticated=true;
   await route.fulfill({response,body});return;
  }await route.continue({headers});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e.message).slice(0,300)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,300));});
 const url=ORIGIN+'/private-model/?review='+ID+'-review';
 const nav=await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});check(nav?.status()===200&&page.url()===url,'PROTECTED_VIEWER_HTTP');
 await page.waitForFunction(sha=>{const d=document.querySelector('#private-model-canvas')?.dataset;return d?.mainViewSourceSha256===sha&&d.layersRuntime==='active';},SHA,{timeout:180000});
 const canvas=page.locator('#private-model-canvas');
 let d=await canvas.evaluate(el=>({...el.dataset}));
 check(d.mainViewSourceSha256===SHA&&Number(d.layersBindingCount)>=842&&Number(d.concealedTechnicalCount)>=8,'SOURCE_BINDING_CONCEALED_GATE');
 const layers=page.locator('#layers-button');if(await layers.getAttribute('aria-expanded')!=='true')await layers.click();
 await page.getByRole('checkbox',{name:'Talotekniikka korostettuna, muut harmaana',exact:true}).check();
 await page.waitForFunction(()=>{const d=document.querySelector('#private-model-canvas')?.dataset;return d?.technicalReviewSystems&&JSON.parse(d.technicalReviewSystems).IV>=179;},null,{timeout:30000});
 d=await canvas.evaluate(el=>({...el.dataset}));const systems=JSON.parse(d.technicalReviewSystems);
 for(const[k,min]of Object.entries({GREY:47,VESI:113,VESI_LV:39,SAHKO:183,VIEMARI:57,IV:179}))check(systems[k]>=min,'TECHNICAL_'+k);
 check(await canvas.evaluate(el=>Boolean(el.getContext('webgl2')||el.getContext('webgl'))),'REAL_WEBGL');
 check(report.sourceAuthenticated&&report.errors.length===0,'SOURCE_AND_CONSOLE');
 await page.screenshot({path:dir+'/production.png',fullPage:false});
 Object.assign(report,{result:'PASS',productionWebGL:true,url,dataset:{mainViewSourceSha256:d.mainViewSourceSha256,layersBindingCount:Number(d.layersBindingCount),concealedTechnicalCount:Number(d.concealedTechnicalCount),technicalReviewSystems:systems},testedCommit:process.env.D_VIEW_TESTED_COMMIT});
}catch(e){report.failure=String(e.message).slice(0,300);process.exitCode=1;}finally{if(browser)await browser.close();fs.writeFileSync(dir+'/evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
