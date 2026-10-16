import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createP186ELabelPixelRuntime as create} from '../../src/scripts/privateModelP186ELabelPixelRuntime.mjs';
import {p186ePixelExpected,p186ePixelRepresentationKinds as kinds,
  p186ePixelSourcePdfDriveId as graphic,p186ePixelSchedulePdfDriveId as schedule} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';

function fixture(floor:'D1F'|'D2F'='D1F'){
  const root=new THREE.Group(),count=p186ePixelExpected[floor],targets:THREE.LineSegments[]=[];
  for(let i=0;i<count.total;i++){
    const kind=i<count.group?'group':'special';
    const geometry=new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-.08,0,0),new THREE.Vector3(.08,0,0),
      new THREE.Vector3(0,0,-.08),new THREE.Vector3(0,0,.08),
    ]);
    const source=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xffd34d}));
    source.position.set((i%6)*2,0,Math.floor(i/6)*2);
    source.userData={Pass:'P186E-X1',hostStorey:floor==='D1F'?'D_1F':'D_2F',
      representationKind:kinds[kind],annotationStableKey:floor+'_GROUP_'+i,sourceLabelId:floor+'_SPECIAL_'+i,
      sourcePdfDriveId:graphic,schedulePdfDriveId:schedule,sourceDerived:true,presentationOnly:true,
      sourceLabelAnchor:true,Canonical:false,canonical:false,current:false,currentGeometryClaim:false,
      asBuilt:false,publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN',deviceGeometryClaim:false,
      socketGeometryClaim:false,switchOrFixtureClaim:false,physicalCableRouteClaim:false,
      connectionTopologyClaim:false,exactCurrentXYClaim:false,exactZClaim:false,
      p186eReviewRole:'QUESTION_TARGET_80',p186eReviewVariant:floor};
    const cue=new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]),
      new THREE.PointsMaterial({color:0xffd34d,size:13,sizeAttenuation:false}));
    cue.userData={p186eViewOnlyCue:true};source.add(cue);
    const caption=new THREE.Sprite(new THREE.SpriteMaterial());
    caption.userData={p186eViewerSourceCaption:true};source.add(caption);
    root.add(source);targets.push(source);
  }
  const camera=new THREE.OrthographicCamera(-8,8,6,-6,.01,100);
  camera.position.set(5,20,2);camera.up.set(0,0,-1);camera.lookAt(5,0,2);camera.updateMatrixWorld(true);
  let width=1100,height=1000,renders=0;
  const canvas={getBoundingClientRect:()=>({width,height})};
  const controls={enabled:true,enableDamping:true,autoRotate:false,target:new THREE.Vector3(5,0,2),update:()=>{}};
  const runtime=()=>create({THREE,root,floor,canvas,camera,controls,render:()=>{renders++;}});
  return {root,targets,camera,canvas,controls,runtime,resize:()=>{width++;},renders:()=>renders};
}
for(const floor of ['D1F','D2F'] as const)test('actual Three source nodes selectively hide and fully restore '+floor,()=>{
  const f=fixture(floor),runtime=f.runtime();
  const original=f.targets.map(t=>({geometry:t.geometry,material:t.material,position:t.position.toArray()}));
  const camera=f.camera.matrixWorld.toArray();
  const prepared=runtime.prepare();
  expect(prepared.targets).toHaveLength(p186ePixelExpected[floor].total);
  expect(prepared).toMatchObject({captionsTemporarilyHidden:true,captionPixelsVerified:false,pixelsVerifiedByThisRuntime:false});
  for(const target of prepared.targets){
    const hidden=runtime.hide(target.sourceKey);
    expect(hidden.hiddenSourceKey).toBe(target.sourceKey);
    expect(f.targets.filter(t=>!t.visible)).toHaveLength(1);
    expect(runtime.restore().cameraFingerprint).toBe(prepared.cameraFingerprint);
  }
  expect(runtime.dispose()).toMatchObject({state:'FINISHED',sourceVisibilityRestored:true,
    captionVisibilityRestored:true,cameraRestored:true,pixelsVerifiedByThisRuntime:false});
  expect(f.controls.enabled).toBe(true);expect(f.controls.enableDamping).toBe(true);
  expect(f.camera.matrixWorld.toArray()).toEqual(camera);
  f.targets.forEach((t,i)=>{
    expect(t.visible&&t.children.every(c=>c.visible)).toBe(true);
    expect(t.geometry).toBe(original[i].geometry);expect(t.material).toBe(original[i].material);
    expect(t.position.toArray()).toEqual(original[i].position);
  });
});

test('source substitution and promotion fail before any visibility mutation',()=>{
  for(const change of ['key','promotion','missing']){
    const f=fixture();
    if(change==='key')f.targets[1].userData.annotationStableKey=f.targets[0].userData.annotationStableKey;
    if(change==='promotion')f.targets[0].userData.currentGeometryClaim=true;
    if(change==='missing')f.root.remove(f.targets[0]);
    expect(()=>f.runtime()).toThrow(/ROSTER|SOURCE/);
    expect(f.targets.every(t=>t.visible&&t.children.every(c=>c.visible))).toBe(true);
  }
});

test('temporary 13 to 9 px source cues clear only a marginal ROI overlap and fully restore',()=>{
  const f=fixture();
  // Deliberately crowd two original-source GL_LINES in presentation space,
  // not the original model/physical wiring; projection is 1000 CSS pixels high.
  f.camera.left=-12;f.camera.right=12;f.camera.top=9;f.camera.bottom=-9;
  f.camera.updateProjectionMatrix();
  f.targets[1].position.set(0,0,.26);
  const original=f.targets.map(t=>(t.children.find(c=>(c as THREE.Points).isPoints===true) as THREE.Points).material as THREE.PointsMaterial);
  expect(original.every(m=>m.size===13)).toBe(true);
  const runtime=f.runtime(),prepared=runtime.prepare();
  expect(prepared.temporaryCuePointSizePx).toBe(9);
  expect(original.every(m=>m.size===9)).toBe(true);
  expect(prepared.targets).toHaveLength(p186ePixelExpected.D1F.total);
  const hidden=runtime.hide(prepared.targets[0].sourceKey);
  expect(hidden.temporaryCuePointSizePx).toBe(9);
  expect(runtime.restore().hiddenSourceKey).toBeNull();
  expect(runtime.dispose()).toMatchObject({
    state:'FINISHED',cueSizeRestored:true,sourceVisibilityRestored:true,
    captionVisibilityRestored:true,cameraRestored:true,
  });
  expect(original.every(m=>m.size===13)).toBe(true);
  expect(f.controls.enabled).toBe(true);
});

test('cue size cannot be modified during the source-only pixel session',()=>{
  const f=fixture(),runtime=f.runtime(),prepared=runtime.prepare();
  const cue=f.targets[0].children.find(c=>(c as THREE.Points).isPoints===true) as THREE.Points;
  (cue.material as THREE.PointsMaterial).size=5;
  expect(()=>runtime.inspect()).toThrow('SOURCE_DRIFT');
  expect(runtime.dispose()).toMatchObject({cueSizeRestored:true});
  expect((cue.material as THREE.PointsMaterial).size).toBe(13);
  expect(prepared.humanReview).toBe('NOT_RUN');
});

test('overlapping projected source regions abort preparation and restore captions and controls',()=>{
  const f=fixture();f.targets[1].position.copy(f.targets[0].position);
  const runtime=f.runtime();expect(()=>runtime.prepare()).toThrow('ROI_OVERLAP');
  expect(f.targets.every(t=>t.visible&&t.children.every(c=>c.visible))).toBe(true);
  expect(f.controls.enabled&&f.controls.enableDamping).toBe(true);
});

test('renderer invalidation counters do not replace material appearance checks',()=>{
  const f=fixture(),runtime=f.runtime();
  (f.targets[0].material as THREE.Material).needsUpdate=true;
  const prepared=runtime.prepare();
  (f.targets[0].material as THREE.Material).needsUpdate=true;
  expect(runtime.hide(prepared.targets[0].sourceKey).hiddenSourceKey).toBe(prepared.targets[0].sourceKey);
  expect(runtime.restore().hiddenSourceKey).toBeNull();
  expect(runtime.dispose().sourceVisibilityRestored).toBe(true);
});

for(const drift of ['camera','viewport','geometry','material','material-pass','shader','source','peer'])test('rejects '+drift+' drift and cleanup restores owned visibility',()=>{
  const f=fixture(),runtime=f.runtime();const prepared=runtime.prepare();
  runtime.hide(prepared.targets[0].sourceKey);
  if(drift==='camera'){f.camera.position.x++;f.camera.updateMatrixWorld(true);}
  if(drift==='viewport')f.resize();
  if(drift==='geometry')f.targets[1].geometry.attributes.position.setX(0,20);
  if(drift==='material')(f.targets[1].material as THREE.LineBasicMaterial).color.setHex(0xffffff);
  if(drift==='material-pass')(f.targets[1].material as THREE.Material).forceSinglePass=true;
  if(drift==='shader')(f.targets[1].material as any).defines={P186E_CHANGED:1};
  if(drift==='source')f.targets[1].userData.current=true;
  if(drift==='peer')f.targets[1].visible=false;
  expect(()=>runtime.inspect()).toThrow(/DRIFT/);
  runtime.dispose();
  expect(f.targets.every(t=>t.visible&&t.children.every(c=>c.visible))).toBe(true);
  expect(f.controls.enabled).toBe(true);
});

for(const floor of ['D1F','D2F'] as const)test('real WebGL DoubleSide renders preserve source capture '+floor,async({page})=>{
  const files:Record<string,string>={
    '/three.module.js':readFileSync('node_modules/three/build/three.module.js','utf8'),
    '/three.core.js':readFileSync('node_modules/three/build/three.core.js','utf8'),
    '/runtime.mjs':readFileSync('src/scripts/privateModelP186ELabelPixelRuntime.mjs','utf8'),
    '/privateModelP186E34PixelEvidence.mjs':readFileSync('src/scripts/privateModelP186E34PixelEvidence.mjs','utf8'),
  };
  await page.route('https://p186e.test/**',route=>{
    const path=new URL(route.request().url()).pathname;
    return route.fulfill(path==='/'?{contentType:'text/html',body:'<!doctype html><body></body>'}:
      files[path]?{contentType:'text/javascript',body:files[path]}:{status:404,body:''});
  });
  await page.goto('https://p186e.test/');
  const f=fixture(floor);
  const result=await page.evaluate(async({floor,targets,positions})=>{
    const origin='https://p186e.test';
    const THREE=await import(origin+'/three.module.js');
    const {createP186ELabelPixelRuntime:create}=await import(origin+'/runtime.mjs');
    const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
    scene.background=new THREE.Color(0x17212b);
    const sources=targets.map(({data,position})=>{
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      // The original source GLB material is BLEND + doubleSided. The viewer
      // clones it with opacity .8, retaining DoubleSide and two render passes.
      const source=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({
        color:0xffd34d,side:THREE.DoubleSide,transparent:true,opacity:.8,depthTest:false,depthWrite:false,
      }));
      source.position.fromArray(position);source.userData=data;root.add(source);
      const cue=new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]),
        new THREE.PointsMaterial({color:0xffd34d,size:13,sizeAttenuation:false,depthTest:false,depthWrite:false}));
      cue.userData={p186eViewOnlyCue:true};source.add(cue);
      const caption=new THREE.Sprite(new THREE.SpriteMaterial());
      caption.userData={p186eViewerSourceCaption:true};source.add(caption);
      return source;
    });
    const canvas=document.createElement('canvas');document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,preserveDrawingBuffer:true,antialias:false});
    renderer.setPixelRatio(1);renderer.setSize(1100,1000);
    const camera=new THREE.OrthographicCamera(-8,8,6,-6,.01,100);
    camera.position.set(5,20,2);camera.up.set(0,0,-1);camera.lookAt(5,0,2);camera.updateMatrixWorld(true);
    const controls={enabled:true,enableDamping:true,autoRotate:false,target:new THREE.Vector3(5,0,2),update:()=>{}};
    const render=()=>renderer.render(scene,camera);
    const runtime=create({THREE,root,floor,canvas,camera,controls,render});
    try{
      const initialVersion=sources[0].material.version;
      render();render();
      const renderedVersion=sources[0].material.version;
      const prepared=runtime.prepare();
      const pixels=()=>{
        const gl=renderer.getContext(),data=new Uint8Array(1100*1000*4);
        gl.readPixels(0,0,1100,1000,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;
      };
      const baseline=pixels();runtime.hide(prepared.targets[0].sourceKey);const hidden=pixels();
      runtime.restore();const restored=pixels();
      const changed=baseline.reduce((n,v,i)=>n+Number(v!==hidden[i]),0);
      const exactRestore=baseline.every((v,i)=>v===restored[i]);
      const finish=runtime.dispose();
      return {initialVersion,renderedVersion,changed,exactRestore,finish,targets:prepared.targets.length};
    }finally{runtime.dispose();renderer.dispose();}
  },{floor,targets:f.targets.map(t=>({data:t.userData,position:t.position.toArray()})),
    positions:Array.from(f.targets[0].geometry.attributes.position.array)});
  expect(result.renderedVersion).toBeGreaterThan(result.initialVersion);
  expect(result.changed).toBeGreaterThan(0);
  expect(result.exactRestore).toBe(true);
  expect(result.targets).toBe(p186ePixelExpected[floor].total);
  expect(result.finish).toMatchObject({sourceVisibilityRestored:true,captionVisibilityRestored:true,cameraRestored:true});
});

test('viewer source mounts the runtime and HUD occupies the source column',async({page})=>{
  const index=readFileSync('src/pages/private-model/index.astro','utf8');
  const rule=index.match(/\.viewport:has\(#p186e-source-context:not\(\[hidden\]\)\) \.orientation-gizmo\s*\{[^}]+\}/)?.[0];
  expect(rule).toBeTruthy();
  expect(index).toContain('p186ePixelRuntime = createP186ELabelPixelRuntime({');
  expect(index).toContain("window.addEventListener('p186e-source-pixel-probe'");
  expect(index).toContain('p186ePixelRuntime?.pinFrame();');
  expect(index).toContain('activePlanFocusBounds = p186ePixelRuntime.sourceBounds();');
  for(const width of [1440,1920]){
    await page.setViewportSize({width,height:1200});
    await page.setContent(`<style>.viewport{position:relative;width:100%;height:1000px;--m5a-source-panel-width:620px}canvas{width:calc(100% - 644px);height:1000px;margin-left:644px}.orientation-gizmo{position:absolute;right:12px;bottom:12px;width:212px;height:220px}${rule}</style><div class="viewport"><canvas></canvas><aside id="p186e-source-context"></aside><aside class="orientation-gizmo">Coordinate panel</aside></div>`);
    const canvas=await page.locator('canvas').boundingBox(),hud=await page.locator('.orientation-gizmo').boundingBox();
    expect(hud!.x+hud!.width).toBeLessThan(canvas!.x);
    expect(hud!.width).toBeGreaterThan(100);
  }
});
