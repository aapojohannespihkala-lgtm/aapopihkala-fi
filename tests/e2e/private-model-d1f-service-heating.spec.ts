import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {D1F_SERVICE_ID,D1F_SERVICE_ASSET,D1F_SERVICE_ROWS,D1F_SERVICE_DEVICES,D1F_SERVICE_OPEN_POINTS,D1F_SERVICE_MODELS,D1F_SERVICE_PREVIOUS,D1F_SERVICE_CENTERED} from '../../src/scripts/privateModelD1FServiceContract.mjs';
import {getPrivateWorkTestCandidateById} from '../../worker/privateWorkTest';

const constants={D1F_SERVICE_ID,D1F_SERVICE_ASSET,D1F_SERVICE_ROWS,D1F_SERVICE_DEVICES,D1F_SERVICE_OPEN_POINTS,D1F_SERVICE_MODELS};
const moduleCode=readFileSync('src/scripts/privateModelD1FServiceRuntime.mjs','utf8').replace(/^import[^\n]+\n/,`const {${Object.keys(constants).join(',')}}=${JSON.stringify(constants)};\n`);

test('new service source is independently bounded without replacing the accepted WC source',()=>{
 expect(getPrivateWorkTestCandidateById(D1F_SERVICE_ID)).toMatchObject({expectedSize:D1F_SERVICE_ASSET.bytes,expectedSha256:D1F_SERVICE_ASSET.sha256});
 expect(getPrivateWorkTestCandidateById(D1F_SERVICE_CENTERED.id)?.expectedSha256).toBe(D1F_SERVICE_ASSET.parentSha256);
 expect(getPrivateWorkTestCandidateById(D1F_SERVICE_PREVIOUS.id)?.expectedSha256).toBe(D1F_SERVICE_CENTERED.asset.parentSha256);
 expect(getPrivateWorkTestCandidateById('d1f-wc-enclosure-themos-20261015')?.expectedSha256).toBe(D1F_SERVICE_PREVIOUS.asset.parentSha256);
 expect(D1F_SERVICE_MODELS.map(m=>[m.defaultScene,m.sceneCount])).toEqual([[104,108],[100,104],[96,100]]);
 expect(new Set(D1F_SERVICE_ROWS.map((r:any)=>r.rootNode)).size).toBe(4);
});

test('selecting any housing part resolves to one device, its own historical route and dated observations',async({page})=>{
 await page.goto('/about/');
 await page.setContent('<div><button id="layers-button">Layerit</button></div><div class="viewport"><canvas id="private-model-canvas"></canvas><aside id="selection-panel"></aside></div>');
 const result=await page.evaluate(async({code})=>{
  const {mountD1FServiceModel}=await import('data:text/javascript;base64,'+code);
  const target=(id:string)=>({name:id,userData:{serviceLabelFi:id},visible:true,parent:null as any,traverse(fn:any){fn(this);}});
  const ids=['THEMO_BATHROOM','THEMO_BEDROOM','THEMO_LOBBY','HEATING_A','HEATING_B','HEATING_C'];
  const targets=new Map(ids.map(id=>[id,target(id)]));
  const canvas=document.querySelector('#private-model-canvas') as HTMLCanvasElement;
  const ceiling={visible:false};
  const api=mountD1FServiceModel({THREE:{},loaded:{targets,surfaces:{KPH_CEILING:ceiling},scene:{},row:{variant:'WEST_ANCHOR_725_895_740'}},canvas,camera:{},controls:{},render(){},selectObject(){},setPerspective(){},planPreset(){ceiling.visible=true;}});
  const devices=[];
  for(const id of ids.slice(0,3)){
   const part={parent:targets.get(id)};
   const resolved=api.resolveTarget(part);api.select(part);
   devices.push({id:resolved.id,route:canvas.dataset.d1fServiceHeatingView,text:document.querySelector('#d1f-service-selected-info')?.textContent,links:[...document.querySelectorAll('#d1f-service-selected-info a')].map(a=>(a as HTMLAnchorElement).href)});
  }
  const unknown=[...document.querySelectorAll('[data-location-status="UNKNOWN"]')].map(e=>e.textContent);
  document.querySelector<HTMLButtonElement>('#d1f-heating-preset')?.click();
  const nativePreset={ceilingVisible:ceiling.visible,allRoutesShown:['HEATING_A','HEATING_B','HEATING_C'].every(id=>targets.get(id)?.visible)};
  api.dispose();return {devices,unknown,nativePreset,removed:!document.querySelector('#d1f-service-button')};
 },{code:Buffer.from(moduleCode).toString('base64')});
 expect(result.devices.map(x=>[x.id,x.route])).toEqual([['THEMO_BATHROOM','HEATING_C'],['THEMO_BEDROOM','HEATING_A'],['THEMO_LOBBY','HEATING_B']]);
 for(const d of result.devices){expect(d.text).toContain('Nykyistä kytkentää ei ole varmennettu');expect(d.text).toContain('7.-8.10.2026');expect(d.links).toHaveLength(2);}
 expect(result.devices[0].text).toContain('1046 W');expect(result.devices[0].text).toContain('Combined valittu 8.10.2026');expect(result.devices[1].text).toContain('Ei dokumentoitua asetusvalintaa');expect(result.devices[2].text).toContain('1257 W');
 expect(result.unknown).toHaveLength(6);expect(result.nativePreset).toEqual({ceilingVisible:false,allRoutesShown:true});expect(result.removed).toBe(true);
});

test('wrong raw bytes cannot reach the scene parser or ready service UI',async({page})=>{
 await page.goto('/about/');
 const result=await page.evaluate(async({code,id})=>{
  const {loadD1FServiceModel}=await import('data:text/javascript;base64,'+code);let parsed=false;
  const prior=window.fetch;window.fetch=async()=>new Response(new Uint8Array(32),{status:200});
  try{await loadD1FServiceModel({candidate:{id,path:'/invalid-test.glb'},search:'',loader:{parseAsync(){parsed=true;}}});return {rejected:false,parsed};}
  catch{return {rejected:true,parsed};}finally{window.fetch=prior;}
 },{code:Buffer.from(moduleCode).toString('base64'),id:D1F_SERVICE_ID});
 expect(result).toEqual({rejected:true,parsed:false});
});

test('authenticated production proof is main-only and covers all four source variants',()=>{
 const workflow=readFileSync('.github/workflows/private-model-d1f-service-review.yml','utf8');
 expect(workflow).toContain("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'");expect(workflow).not.toContain('pull_request');
 for(const row of D1F_SERVICE_ROWS)expect(workflow).toContain(row.variant);
 const probe=readFileSync('.github/scripts/private-model-d1f-service-probe.mjs','utf8');
 expect(probe).toContain("url.origin!==ORIGIN");expect(probe).toContain("hash(raw)===ASSET.sha256");expect(probe).toContain("evidence.targets.length===12&&evidence.devices.length===3");
});


test('WC selection distinguishes measured closed-lid top from approximate porcelain and connection geometry',async({page})=>{
 await page.goto('/about/');await page.setContent('<div><button id="layers-button">Layerit</button></div><div class="viewport"><canvas id="private-model-canvas"></canvas><aside id="selection-panel"></aside></div>');
 const result=await page.evaluate(async({code})=>{
  const {mountD1FServiceModel}=await import('data:text/javascript;base64,'+code);
  const product={nominalWidthMm:355,nominalProjectionMm:535,model:'Nordic3 3530',installedHeightVerified:true,closedLidState:'CLOSED',closedLidTopAboveFinishedFloorMm:450,dimensionSource:'https://www.gustavsberg.com/drawing',userUrl:'https://byggerom.se/toilet'};
  const toilet={userData:{product,serviceLabelFi:'WC-istuin',equalSideClearanceMm:332.5,sourceCenterYM:4.522,sideWallFacesYM:[4.012,5.032],sourceFloorZM:.08,sourceClosedLidTopZM:.53},visible:true};
  const canvas=document.querySelector('#private-model-canvas') as HTMLCanvasElement;
  const api=mountD1FServiceModel({THREE:{},loaded:{targets:new Map([['TOILET',toilet]]),surfaces:{},scene:{},row:{variant:'WEST_ANCHOR_725_895_740'}},canvas,camera:{},controls:{},render(){},selectObject(){},setPerspective(){},planPreset(){}});
  api.select(toilet);const text=document.querySelector('#d1f-service-selected-info')?.textContent;const links=[...document.querySelectorAll('#d1f-service-selected-info a')].map(a=>(a as HTMLAnchorElement).hostname);const dataset=JSON.parse(canvas.dataset.d1fServiceWcProduct!);api.dispose();return {text,links,dataset};
 },{code:Buffer.from(moduleCode).toString('base64')});
 expect(result.text).toContain('Nordic³ 3530');expect(result.text).toContain('355 mm leveä, 535 mm seinästä');expect(result.text).toContain('332.5 mm kummallakin puolella');expect(result.text).toContain('450 mm kylpyhuoneen lattiasta, käyttäjän mittaus 16.10.2026');expect(result.text).toContain('Kulhon ja kannen muoto, kerrospaksuudet ja piiloliitännät ovat likimääräisiä');expect(result.links).toEqual(['www.gustavsberg.com','byggerom.se']);expect(result.dataset.installedHeightVerified).toBe(true);expect(result.dataset.closedLidState).toBe('CLOSED');expect(result.dataset.closedLidTopAboveFinishedFloorMm).toBe(450);expect(result.dataset.sourceClosedLidTopZM-result.dataset.sourceFloorZM).toBeCloseTo(.450,6);
});

