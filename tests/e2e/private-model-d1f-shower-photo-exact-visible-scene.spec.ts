import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
// @ts-ignore - source-only exact GLB camera planner, not a production screenshot proof.
import { planD1FSourceGlassCamera } from '../../src/scripts/privateModelD1FShowerGlassSourceCameraFit.mjs';

const source=readFileSync('src/pages/private-model/index.astro','utf8');
const branchStart='          } else if (showerPhotoReview) {';
const branchEnd='          } else if (combinedWallReview) {';
const block=(source.split(branchStart)[1]?.split(branchEnd)[0] ?? '').replaceAll('(part: any)', '(part)');
const selected='WEST_ANCHOR_725_895_740';
const partName='D1F_ALAJARVI_DOUBLE_CURVED_GLASS_900_WORK_TEST_0';

function runVisibleSourceFocus({missingGlass=false,wrongRoot=false,notSource=false,emptyGeometry=false}={}){
  const fullModelScene=new THREE.Scene();
  const originalRoot=new THREE.Group();
  originalRoot.name='D1F_ROOT_'+(wrongRoot?'NOT_SELECTED':selected)+'_SHOWER_GLASS_900_WORK_TEST';
  for(let i=0;i<43;i++) originalRoot.add(new THREE.Group());
  const glass=new THREE.Group();
  glass.name=missingGlass?'WRONG_GLASS_SOURCE':partName;
  for(let i=0;i<3;i++) glass.add(new THREE.Mesh(
    new THREE.BoxGeometry(emptyGeometry?0:i===2?0.1:0.4,emptyGeometry?0:1.85,emptyGeometry?0:0.02),
    new THREE.MeshBasicMaterial({color:i===2?0xa0a0a0:0xc0ffff,transparent:i!==2,opacity:i===2?1:0.27})));
  originalRoot.add(glass);
  fullModelScene.add(originalRoot);
  fullModelScene.updateMatrixWorld(true);
  const camera=new THREE.PerspectiveCamera(38,1.5,0.01,5000);
  camera.position.set(12,8,14);
  const controls={enableRotate:false,enabled:false,target:new THREE.Vector3(0,0,0),update(){}};
  const canvas={dataset:{} as Record<string,string>,
    getBoundingClientRect(){return {width:1280,height:800};}},status={textContent:''};
  const planControls={enabled:true},isoControls={enabled:true};
  const selectedScene=notSource?new THREE.Scene():fullModelScene;
  const showerPhotoReview={
    gltf:{scene:selectedScene},
    selected:{variant:selected,sceneIndex:120,rootNode:2457,glassNode:2456},
    asset:{bytes:8914072,sha256:'992819363a6e368546e870f9ff2a17ddf0904e760269fc20aec509aa310ba35e'},
    rawGlbByteIdentityVerified:true,
    humanReview:'NOT_RUN',
  };
  const effect:{mounted:any,orbit:boolean}={mounted:null,orbit:false};
  const focus=new Function(
    'THREE','showerPhotoReview','fullModelScene','deactivateElevationView',
    'planControls','isoControls','controls','camera','setModelScene',
    'canvas','syncViewState','status','D1F_SHOWER_PHOTO_CANDIDATE_ID',
    'planD1FSourceGlassCamera', 
    'let activeCamera=camera;\n'+block+'\nreturn {activeCamera};'
  );
  const before=originalRoot.children.slice();
  const response=()=>focus(
    THREE,showerPhotoReview,fullModelScene,()=>{},planControls,isoControls,
    controls,camera,(root:any)=>{effect.mounted=root;},
    canvas,()=>{effect.orbit=true;},status,'d1f-shower-glass-photo-20261016',
    planD1FSourceGlassCamera);
  return {response,scene:fullModelScene,glass,originalRoot,before,camera,controls,canvas,effect,planControls,isoControls};
}

test('only exact D1F photo shower branch bypasses legacy derived D overview',()=>{
  expect(block).toContain('const showerSourceScene = showerPhotoReview.gltf.scene;');
  expect(block).toContain('setModelScene(showerSourceScene)');
  expect(block).not.toContain("applyStandardViewPreset('d-apartment')");
  expect(block).not.toContain('buildP167fDOverviewScene(');
  expect(source).toContain('const dOverviewScene = buildP167fDOverviewScene()');
});

test('actual visible scene remains the selected 124-source root, with orbit and bounded photo-glass focus',()=>{
  const f=runVisibleSourceFocus();
  const result=f.response();
  expect(result.activeCamera).toBe(f.camera);
  expect(f.effect.mounted).toBe(f.scene);
  expect(f.effect.orbit).toBe(true);
  expect(f.controls.enabled).toBe(true);
  expect(f.controls.enableRotate).toBe(true);
  expect(f.planControls.enabled).toBe(false);
  expect(f.isoControls.enabled).toBe(false);
  expect(f.canvas.dataset).toMatchObject({
    contentScene:'full-model',standardViewPreset:'d-apartment',
    d1fShowerPhotoVisibleSourceScene:'true',
    d1fShowerPhotoSourceRootCount:'1',
    d1fShowerPhotoGlassFocus:'SOURCE_OBJECT_PRESENTATION_ONLY',
    d1fShowerPhotoProductionPixelsVerified:'false'});
  const actualFocus=new THREE.Box3().setFromObject(f.glass).getCenter(new THREE.Vector3());
  expect(f.controls.target.distanceTo(actualFocus)).toBeLessThan(0.00001);
  expect(f.camera.position.distanceTo(actualFocus)).toBeGreaterThan(2.8);
  expect(f.originalRoot.children).toEqual(f.before);
  expect(f.originalRoot.children).toHaveLength(44);
});

test('legacy-substituted source scene cannot pass even with correct-looking glass objects',()=>{
  const f=runVisibleSourceFocus({notSource:true});
  expect(f.response).toThrow('D1F_SHOWER_PHOTO_VISIBLE_SOURCE_SCENE_REJECTED');
  expect(f.effect.mounted).toBeNull();
});

test('a scene missing its glass node cannot silently show a generic full-building screenshot',()=>{
  const f=runVisibleSourceFocus({missingGlass:true});
  expect(f.response).toThrow('D1F_SHOWER_PHOTO_VISIBLE_SOURCE_SCENE_REJECTED');
  expect(f.effect.mounted).toBeNull();
});

test('wrong root variant cannot be mistaken for the expected 124-scene bathroom root',()=>{
  const f=runVisibleSourceFocus({wrongRoot:true});
  expect(f.response).toThrow('D1F_SHOWER_PHOTO_VISIBLE_SOURCE_SCENE_REJECTED');
  expect(f.effect.mounted).toBeNull();
});

test('unrenderable zero-area source glass fails before model replacement or camera acceptance',()=>{
  const f=runVisibleSourceFocus({emptyGeometry:true});
  expect(f.response).toThrow('D1F_SHOWER_PHOTO_VISIBLE_BOUNDS_REJECTED');
  expect(f.effect.mounted).toBeNull();
});

test('shower focus does not upgrade human review, as-built or production pixel status',()=>{
  expect(block).toContain("d1fShowerPhotoProductionPixelsVerified = 'false'");
  expect(block).not.toMatch(/d1fShowerPhotoHumanReview\s*=\s*'PASS'/);
  expect(block).not.toMatch(/d1fShowerPhotoAsBuilt\s*=\s*'true'/);
});
