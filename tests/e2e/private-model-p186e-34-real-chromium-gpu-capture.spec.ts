import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// Real Chromium/WebGL raster; the objects below are synthetic historical
// WORK_TEST label analogues, never the original GLB or production viewer.
const bundleSource = [
  "import * as THREE from 'three';",
  "import { captureP186E34SourceFrames as capture } from './src/scripts/privateModelP186E34FrameCapture.mjs';",
  "import { p186ePixelCandidateId as candidate, p186ePixelExpected as counts, p186ePixelSourcePdfDriveId as graphic, p186ePixelSchedulePdfDriveId as schedule, p186ePixelRepresentationKinds as kinds } from './src/scripts/privateModelP186E34PixelEvidence.mjs';",
  "window.runP186E34Gpu = async (nonpainting = false) => {",
  " const W=192, H=128;",
  " const renderer = new THREE.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:false});",
  " renderer.setPixelRatio(1); renderer.setSize(W,H,false);",
  " renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.NoToneMapping;",
  " renderer.setClearColor(0x20262b,1);",
  " const target = new THREE.WebGLRenderTarget(W,H,{depthBuffer:true,stencilBuffer:false});",
  " const floors = ['D1F','D2F'].map((floor,fi)=>{",
  "  const scene=new THREE.Scene(); const camera=new THREE.OrthographicCamera(0,W,H,0,0.1,100);",
  "  camera.position.set(0,0,9+fi); camera.lookAt(0,0,0);",
  "  camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);",
  "  const targets=Array.from({length:counts[floor].total},(_,i)=>{",
  "   const kind=i<counts[floor].group?'group':'special';",
  "   const x=18+(i%6)*29, y=18+Math.floor(i/6)*29;",
  "   const material=new THREE.MeshBasicMaterial({color:0xffbe14});",
  "   const object=new THREE.Mesh(new THREE.PlaneGeometry(8,8),material);",
  "   object.position.set(x,y,0); scene.add(object);",
  "   return {object,sourceKey:floor+'_SOURCE_'+String(i+1).padStart(2,'0'),",
  "    kind,representationKind:kinds[kind],sourcePdfDriveId:graphic,",
  "    schedulePdfDriveId:kind==='group'?schedule:null,",
  "    roi:{x:x-7,y:y-7,width:14,height:14},",
  "    presentationOnly:true,sourceDerived:true,currentGeometryClaim:false,",
  "    asBuilt:false,canonical:false,publishToCURRENT:false,humanReview:'NOT_RUN'};",
  "  });",
  "  return {floor,scene,camera,targets,sceneKey:floor+'_GPU_SCENE',",
  "   cameraKey:floor+'_GPU_CAMERA',calls:0};",
  " });",
  " const captureRGBA=async session=>{",
  "  session.calls++; const pixels=new Uint8Array(W*H*4);",
  "  renderer.setRenderTarget(target);",
  "  try { renderer.clear(true,true,true); renderer.render(session.scene,session.camera);",
  "   renderer.readRenderTargetPixels(target,0,0,W,H,pixels); }",
  "  finally { renderer.setRenderTarget(null); }",
  "  return {pixels,width:W,height:H,floor:session.floor,",
  "   cameraKey:session.cameraKey,sceneKey:session.sceneKey,sourceCandidateId:candidate};",
  " };",
  " const fingerprint=session=>{",
  "  session.camera.updateMatrixWorld(true);session.camera.updateProjectionMatrix();",
  "  return [...session.camera.matrixWorld.elements,...session.camera.projectionMatrix.elements,W,H].join(':');",
  " };",
  " if(nonpainting) floors[0].targets[0].object.material.colorWrite=false;",
  " try {",
  "  const evidence=await capture({sourceCandidateId:candidate,floors,captureRGBA,",
  "   readCameraFingerprint:fingerprint});",
  "  return {realGpu:renderer.isWebGLRenderer && !!renderer.getContext().readPixels,",
  "   calls:floors.map(x=>x.calls), separateCameras:fingerprint(floors[0])!==fingerprint(floors[1]),",
  "   allVisible:floors.every(f=>f.targets.every(t=>t.object.visible)),",
  "   targetCount:evidence.targetCount,d1:evidence.D1F.visuallyIsolated,",
  "   d2:evidence.D2F.visuallyIsolated,restore:evidence.exactRestoresVerified,",
  "   sourceAuthenticated:evidence.sourceAuthenticated,production:evidence.productionScreenshotVerified,",
  "   humanReview:evidence.humanReview};",
  " } catch(error) { if(!nonpainting) throw error;",
  "  return {rejected:true,message:String(error.message),",
  "   restored:floors.every(f=>f.targets.every(t=>t.object.visible))};",
  " } finally {",
  "  target.dispose();renderer.dispose();",
  "  for(const floor of floors)for(const item of floor.targets){",
  "   item.object.geometry.dispose();item.object.material.dispose();",
  "  }",
  " }",
  "};",
].join('\n');

test('34 D electrical source labels require real Chromium WebGL hide and byte-exact restore', async () => {
  const bundle = await build({
    stdin: { resolveDir: process.cwd(), sourcefile: 'p186e-34-real-gpu.mjs',
      contents: bundleSource },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2022',
    write: false, logLevel: 'silent',
  });
  const browser = await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ]});
  try {
    const page=await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({content:bundle.outputFiles[0]!.text});
    const positive=await page.evaluate(() => (window as any).runP186E34Gpu(false));
    expect(positive).toMatchObject({
      realGpu:true,calls:[37,33],separateCameras:true,allVisible:true,
      targetCount:34,d1:18,d2:16,restore:true,
      sourceAuthenticated:false,production:false,humanReview:'NOT_RUN',
    });
    const invisible=await page.evaluate(() => (window as any).runP186E34Gpu(true));
    expect(invisible).toMatchObject({rejected:true,restored:true});
    expect(invisible.message).toMatch(/individually visible|source.*material|not.*painting/i);
  } finally { await browser.close(); }
});
