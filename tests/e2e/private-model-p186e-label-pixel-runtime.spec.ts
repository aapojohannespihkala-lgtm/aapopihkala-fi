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

test('overlapping projected source regions abort preparation and restore captions and controls',()=>{
  const f=fixture();f.targets[1].position.copy(f.targets[0].position);
  const runtime=f.runtime();expect(()=>runtime.prepare()).toThrow('ROI_OVERLAP');
  expect(f.targets.every(t=>t.visible&&t.children.every(c=>c.visible))).toBe(true);
  expect(f.controls.enabled&&f.controls.enableDamping).toBe(true);
});

for(const drift of ['camera','viewport','geometry','material','source','peer'])test('rejects '+drift+' drift and cleanup restores owned visibility',()=>{
  const f=fixture(),runtime=f.runtime();const prepared=runtime.prepare();
  runtime.hide(prepared.targets[0].sourceKey);
  if(drift==='camera'){f.camera.position.x++;f.camera.updateMatrixWorld(true);}
  if(drift==='viewport')f.resize();
  if(drift==='geometry')f.targets[1].geometry.attributes.position.setX(0,20);
  if(drift==='material')(f.targets[1].material as THREE.LineBasicMaterial).color.setHex(0xffffff);
  if(drift==='source')f.targets[1].userData.current=true;
  if(drift==='peer')f.targets[1].visible=false;
  expect(()=>runtime.inspect()).toThrow(/DRIFT/);
  runtime.dispose();
  expect(f.targets.every(t=>t.visible&&t.children.every(c=>c.visible))).toBe(true);
  expect(f.controls.enabled).toBe(true);
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
