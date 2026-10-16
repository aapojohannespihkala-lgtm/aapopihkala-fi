import {D1F_SERVICE_ID,D1F_SERVICE_ASSET,D1F_SERVICE_ROWS,D1F_SERVICE_DEVICES,D1F_SERVICE_OPEN_POINTS,D1F_SERVICE_MODELS} from './privateModelD1FServiceContract.mjs';

const reject=()=>{throw new Error('D1F_SERVICE_SOURCE_REJECTED');};
const isWork=u=>u?.WORK_TEST_ONLY===true&&u.current===false&&u.Canonical===false&&u.asBuilt===false&&u.publishToCURRENT===false;
export async function loadD1FServiceModel({candidate,search,loader}){
 const model=D1F_SERVICE_MODELS.find(m=>m.id===candidate.id);if(!model)return null;const asset=model.asset,rows=model.rows;
 const params=new URLSearchParams(search),variant=params.get('wallVariant')??rows[0].variant;
 const row=rows.find(r=>r.variant===variant);if(!row)reject();
 const r=await fetch(candidate.path,{credentials:'same-origin',signal:AbortSignal.timeout(45000)});
 if(r.status!==200)reject();const raw=await r.arrayBuffer();
 const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(raw.byteLength!==asset.bytes||digest!==asset.sha256)reject();
 const gltf=await loader.parseAsync(raw,candidate.path.replace(/[^/]+$/,'')),j=gltf.parser.json;
 if(j.scene!==model.defaultScene||j.scenes.length!==model.sceneCount||gltf.scenes.length!==model.sceneCount||j.extras?.[model.sourceKey]?.parentRawSha256!==asset.parentSha256)reject();
 for(const expected of rows){const s=j.scenes[expected.sceneIndex];
  if(!isWork(s.extras)||s.extras.variant!==expected.variant||s.extras[model.parentSceneKey]!==expected.sceneIndex-4||s.nodes.length!==1||s.nodes[0]!==expected.rootNode)reject();
  for(const [key,id]of Object.entries({...expected.serviceNodes,...expected.routes}))if(j.nodes[id]?.extras?.serviceTargetId!==key||!isWork(j.nodes[id].extras))reject();
 }
 const selected=gltf.scenes[row.sceneIndex];gltf.scene=selected;
 const find=id=>{const name=j.nodes[id]?.name,matches=[];selected.traverse(o=>{if(o.name===name||o.name===name?.replace(/\s/g,'_'))matches.push(o);});if(matches.length!==1)reject();return matches[0];};
 const targets=new Map(Object.entries({...row.serviceNodes,...row.routes,...row.themos}).map(([key,id])=>[key,find(id)]));
 if(new Set(targets.values()).size!==12)reject();
 return {gltf,scene:selected,row,targets,asset,surfaces:Object.fromEntries(Object.entries(row.surfaces).map(([key,id])=>[key,find(id)])),wall:find(row.wallNode),rawByteIdentityVerified:true};
}

const element=(tag,text)=>{const e=document.createElement(tag);for(const a of document.querySelector('#selection-panel')?.attributes??[])if(a.name.startsWith('data-astro-'))e.setAttribute(a.name,a.value);if(text!==undefined)e.textContent=text;return e;};
const sourceLink=(label,url)=>{const a=element('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
export function mountD1FServiceModel({THREE,loaded,canvas,camera,controls,render,selectObject,setPerspective,planPreset,getCamera=()=>camera}){
 const {targets,surfaces}=loaded,asset=loaded.asset??D1F_SERVICE_ASSET,wc=targets.get('TOILET')?.userData?.product,byObject=new Map([...targets].map(([id,o])=>[o,id]));
 const routes=[...targets].filter(([id])=>id.startsWith('HEATING_'));
 const originalMaterials=new Map();let view='room',active=null,probe=null;
 for(const [id,o]of routes){o.traverse(p=>{if(p.isMesh){originalMaterials.set(p,p.material);p.material=new THREE.MeshBasicMaterial({color:{HEATING_A:0xed7521,HEATING_B:0x29a6c9,HEATING_C:0xab61db}[id],side:THREE.DoubleSide});}});o.visible=false;}
 const toolbar=document.querySelector('#layers-button')?.parentElement;
 const button=element('button','Huolto');button.id='d1f-service-button';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','d1f-service-panel');
 const heatButton=element('button','Lattialämmitys');heatButton.id='d1f-heating-preset';heatButton.type='button';
 toolbar?.append(button,heatButton);
 const panel=element('aside');panel.id='d1f-service-panel';panel.className='selection-panel';panel.hidden=true;panel.setAttribute('aria-label','Kylpyhuoneen huolto ja lämmitys');
 const header=element('div');header.className='selection-header';header.append(element('h2','Kylpyhuone ja lämmitys'));const close=element('button','Sulje');close.type='button';header.append(close);panel.append(header);
 const summary=element('p',wc?.closedLidState==='CLOSED'?'WC:n suljetun kannen yläpinta on 450 mm kylpyhuoneen lattiasta käyttäjän mittauksen mukaan. Kulhon ja kannen muotoa on tarkennettu valokuvan perusteella.':wc?'WC on Gustavsberg Nordic³ 3530:n nimellismittoihin sovitettu työmalli ja keskitetty sivuseinien väliin. Muiden kalusteiden muodot ja mitat ovat työoletuksia.':'Kalusteiden muodot ja mitat ovat työmallin oletuksia. Mitattu allastaso ja hyväksytyt seinäpinnat säilyvät vertailupohjana.');summary.style.fontSize='12px';panel.append(summary);
 for(const [id,o]of targets){if(id.startsWith('HEATING_'))continue;const b=element('button',id.startsWith('THEMO_')?D1F_SERVICE_DEVICES[id].label:o.userData.serviceLabelFi);b.type='button';b.dataset.serviceTarget=id;b.style.cssText='display:block;width:100%;margin:5px 0;text-align:left';b.addEventListener('click',()=>{setPerspective();focus(id);selectObject(o);});panel.append(b);}
 const unresolved=element('details');unresolved.id='d1f-service-open-points';unresolved.append(element('summary','Tekniset pisteet, joiden sijainti on avoin'));
 const list=element('ul');for(const p of D1F_SERVICE_OPEN_POINTS){const li=element('li',p.label+': '+p.status);li.dataset.locationStatus='UNKNOWN';list.append(li);}unresolved.append(list);panel.append(unresolved);
 panel.append(sourceLink('Laite- ja materiaalitiedot','https://docs.google.com/document/d/1-OxwgtepDX6wiJZCSPzPbnr0Up6PFDHrVE4TWjRplxY/edit'));
 canvas.closest('.viewport')?.append(panel);
 const info=element('section');info.id='d1f-service-selected-info';info.hidden=true;info.style.cssText='border-top:1px solid #e2e3de;margin-top:10px;padding-top:10px;font-size:13px';
 const selectionPanel=document.querySelector('#selection-panel'),priorMaxHeight=selectionPanel?.style.maxHeight;
 if(selectionPanel){selectionPanel.append(info);selectionPanel.style.maxHeight='calc(100% - 260px)';}
 panel.style.maxHeight='calc(100% - 260px)';
 const toggle=open=>{panel.hidden=!open;button.setAttribute('aria-expanded',String(open));if(open)document.querySelector('#selection-panel')?.setAttribute('hidden','');};
 button.addEventListener('click',()=>toggle(panel.hidden));close.addEventListener('click',()=>toggle(false));
 const routeView=key=>{for(const[id,o]of routes)o.visible=key==='ALL'||id===key;canvas.dataset.d1fServiceHeatingView=key??'HIDDEN';};
 const resolveTarget=object=>{let o=object;while(o&&o!==loaded.scene){const id=byObject.get(o);if(id)return {id,object:o,label:D1F_SERVICE_DEVICES[id]?.label??o.userData.serviceLabelFi??id};o=o.parent;}return null;};
 const clearSelection=()=>{active=null;info.hidden=true;info.replaceChildren();delete canvas.dataset.d1fServiceSelectedTarget;routeView(view==='heating'?'ALL':null);};
 const line=(label,value)=>info.append(element('p',label+': '+value));
 const select=object=>{const target=resolveTarget(object);if(!target){clearSelection();return;}toggle(false);info.hidden=false;info.replaceChildren();active=target.id;canvas.dataset.d1fServiceSelectedTarget=active;
  const d=D1F_SERVICE_DEVICES[active];
  if(d){routeView(d.route);info.append(element('h3',d.label));line('Asennus','Käyttäjän vahvistama 7.10.2026');line('Heating output',d.outputW+' W, sovellushavainto kirjattu 7.-8.10.2026');line('Lämmitysalue','Vuoden 2015 suunnitelma '+d.areaLabel+' ('+d.route.slice(-1)+')');line('Suunnitteluteho',d.designW+' W, vuoden 2015 lähde');line('Ryhmäsidonta',d.group+' on suunnitelmalähteistä johdettu. Nykyistä kytkentää ei ole varmennettu.');line('Asetushavainto',d.setting);line('Lattia-anturi','Tyyppi ja vaihtototeuma avoinna');
   info.append(sourceLink('Themon käyttöohjeet','https://support.themo.io/fi/support/solutions/articles/36000426193-lista-tukiartikkeleista'),element('br'),sourceLink('Kohteen huolto- ja asetushavainnot','https://docs.google.com/document/d/1W6iUJoqfkM0efZpmcneXeD8bqYlLUk0tQwWebmcHKcI/edit'));
  }else if(active.startsWith('HEATING_')){routeView(active);line('Reittiesitys','Vuoden 2015 piirustuksen katkoviivat. Nykyistä kaapelireittiä tai asennussyvyyttä ei ole varmennettu.');}
  else if(active==='TOILET'&&target.object.userData.product){const u=target.object.userData,p=u.product;line('Malli','Gustavsberg Nordic³ 3530 / All-in-One');line('Nimellismitat',p.nominalWidthMm+' mm leveä, '+p.nominalProjectionMm+' mm seinästä');line('Sijoitus','Keskitetty sivuseinien työpintojen väliin käyttäjän ohjeella 16.10.2026. Sivuväli '+u.equalSideClearanceMm+' mm kummallakin puolella.');line('Rakenne','Seinä-WC. Huuhtelusäiliö on koteloinnin sisällä.');if(p.installedHeightVerified&&p.closedLidState==='CLOSED')line('Korkeus','Suljetun kannen yläpinta '+p.closedLidTopAboveFinishedFloorMm+' mm kylpyhuoneen lattiasta, käyttäjän mittaus 16.10.2026.');line('Työmallin rajaus',p.installedHeightVerified?'Kulhon ja kannen muoto, kerrospaksuudet ja piiloliitännät ovat likimääräisiä.':'Muoto on likimääräinen. Asennuskorkeutta, kiinnityksiä ja piiloliitäntöjä ei ole mitattu.');info.append(sourceLink('Valmistajan mittapiirros',p.dimensionSource),element('br'),sourceLink('Käyttäjän yksilöimä WC-malli',p.userUrl));}
  else{line('Kaluste',target.label);line('Sijainti ja koko',object.userData.placementBasis==='WORK_CENTER_ON_MEASURED_COUNTER'?'Työmallin sijoitus mitatun allastason keskelle. Kulhon mitat ja aukotus avoinna.':'Lähteiden huonekontekstiin sovitettu työmalli. Tarkka koko ja asennussijainti avoinna.');info.append(sourceLink('Laite- ja materiaalitiedot','https://docs.google.com/document/d/1-OxwgtepDX6wiJZCSPzPbnr0Up6PFDHrVE4TWjRplxY/edit'));}
 };
 const focus=(id,viewIndex=0)=>{
  const target=targets.get(id);if(!target)reject();target.visible=true;for(const[k,o]of Object.entries(surfaces))if(k.includes('CEILING'))o.visible=false;
  loaded.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(target),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const distance=Math.max(id==='TOILET'&&wc?1.65:.45,Math.max(size.x,size.y,size.z)/2/Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*1.6);
  const heat=id.startsWith('HEATING_');let direction=heat?new THREE.Vector3(.01,1,.005):id==='MIRROR'||id.startsWith('BASIN')?new THREE.Vector3(1,.55,viewIndex===1?.3:-.15):id.startsWith('THEMO_')?new THREE.Vector3(viewIndex===1?.35:.05,.20,id==='THEMO_LOBBY'?-.95:.95):new THREE.Vector3(-1,.7,viewIndex===1?-.4:.25);
  direction.normalize();camera.up.set(0,1,0);camera.position.copy(center).addScaledVector(direction,distance);controls.target.copy(center);camera.near=.01;camera.updateProjectionMatrix();controls.update();render();
  return {box,center};
 };
 heatButton.addEventListener('click',()=>{toggle(false);view='heating';const checkbox=document.querySelector('#architecture-ceilings-visible');if(checkbox?.checked){checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));}planPreset();for(const[k,o]of Object.entries(surfaces))if(k.includes('CEILING'))o.visible=false;routeView('ALL');canvas.dataset.d1fServicePreset='FLOOR_HEATING_2015';});
 const onProbe=event=>{
  const d=event.detail;if(!d||!Number.isSafeInteger(d.requestId))return;
  let value={requestId:d.requestId,state:'REJECTED'};
  try{
   if(!targets.has(d.targetId)&&d.action!=='finish')reject();const o=targets.get(d.targetId);
   if(d.action==='prepare'||d.action==='prepare-native'){
    if(probe)reject();const native=d.action==='prepare-native';if(native&&(!d.targetId.startsWith('HEATING_')||canvas.dataset.d1fServiceHeatingView!=='ALL'))reject();if(!native)setPerspective();const savedVisible=o.visible,cam=native?getCamera():camera;
    const saved={position:camera.position.clone(),up:camera.up.clone(),target:controls.target.clone(),near:camera.near,fov:camera.fov,ceilings:Object.entries(surfaces).filter(([k])=>k.includes('CEILING')).map(([,o])=>[o,o.visible])};
    const box=native?new THREE.Box3().setFromObject(o):focus(d.targetId,d.viewIndex??0).box;const xs=[],ys=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(cam);xs.push((p.x+1)*canvas.width/2);ys.push((1-p.y)*canvas.height/2);}
    const x=Math.max(0,Math.floor(Math.min(...xs))-8),y=Math.max(0,Math.floor(Math.min(...ys))-8),right=Math.min(canvas.width,Math.ceil(Math.max(...xs))+8),bottom=Math.min(canvas.height,Math.ceil(Math.max(...ys))+8);
    probe={targetId:d.targetId,o,savedVisible,saved,native,cam,pose:{position:cam.position.clone(),quaternion:cam.quaternion.clone(),target:controls.target.clone(),up:cam.up.clone()},roi:{x,y,width:right-x,height:bottom-y},cameraFingerprint:JSON.stringify([cam.position.toArray(),cam.quaternion.toArray(),cam.projectionMatrix.elements])};
    value={...value,state:'PREPARED',roi:probe.roi,targetId:d.targetId,sourceNode:loaded.row.serviceNodes[d.targetId]??loaded.row.routes[d.targetId]??loaded.row.themos[d.targetId],sourceSha256:asset.sha256,cameraFingerprint:probe.cameraFingerprint,nativePreset:native,projection:cam.isOrthographicCamera?'orthographic':'perspective'};
   }else if(d.action==='suppress'||d.action==='restore'){
    if(!probe||probe.targetId!==d.targetId)reject();o.visible=d.action==='restore';render();value={...value,state:d.action==='restore'?'RESTORED':'SUPPRESSED',cameraFingerprint:probe.cameraFingerprint};
   }else if(d.action==='finish'){
    if(!probe)reject();const p=probe;p.o.visible=p.savedVisible;if(!p.native){camera.position.copy(p.saved.position);camera.up.copy(p.saved.up);camera.near=p.saved.near;camera.fov=p.saved.fov;controls.target.copy(p.saved.target);camera.updateProjectionMatrix();for(const[o,visible]of p.saved.ceilings)o.visible=visible;controls.update();}probe=null;render();value={...value,state:'FINISHED'};
   }else reject();
  }catch{if(probe){probe.o.visible=probe.savedVisible;probe=null;}}
  canvas.dataset.d1fServiceProbe=JSON.stringify(value);
 };
 window.addEventListener('d1f-service-source-probe',onProbe);
 if(wc)canvas.dataset.d1fServiceWcProduct=JSON.stringify({model:wc.model,nominalWidthMm:wc.nominalWidthMm,nominalProjectionMm:wc.nominalProjectionMm,centerYM:targets.get('TOILET').userData.sourceCenterYM,sideFacesYM:targets.get('TOILET').userData.sideWallFacesYM,equalSideClearanceMm:targets.get('TOILET').userData.equalSideClearanceMm,installedHeightVerified:wc.installedHeightVerified,closedLidState:wc.closedLidState??'OPEN_WORK_PROXY',closedLidTopAboveFinishedFloorMm:wc.closedLidTopAboveFinishedFloorMm??null,sourceFloorZM:targets.get('TOILET').userData.sourceFloorZM??null,sourceClosedLidTopZM:targets.get('TOILET').userData.sourceClosedLidTopZM??null});
 Object.assign(canvas.dataset,{d1fServiceReady:'true',d1fServiceVariant:loaded.row.variant,d1fServiceFixtureCount:'6',d1fServiceThemoCount:'3',d1fServiceRouteCount:'3',d1fServiceSourceSha256:asset.sha256,d1fServiceHumanReview:'NOT_RUN'});
 return {resolveTarget,select,clearSelection,pinFrame(){if(probe){probe.cam.position.copy(probe.pose.position);probe.cam.up.copy(probe.pose.up);if(probe.native)probe.cam.quaternion.copy(probe.pose.quaternion);else{controls.target.copy(probe.pose.target);camera.lookAt(controls.target);}probe.cam.updateMatrixWorld();}},dispose(){window.removeEventListener('d1f-service-source-probe',onProbe);button.remove();heatButton.remove();panel.remove();info.remove();if(selectionPanel)selectionPanel.style.maxHeight=priorMaxHeight;for(const[o,m]of originalMaterials){o.material.dispose();o.material=m;}for(const k of Object.keys(canvas.dataset))if(k.startsWith('d1fService'))delete canvas.dataset[k];}};
}


