import { test, expect } from '@playwright/test';
import { Group, PerspectiveCamera } from 'three';
import * as THREE from 'three';
// @ts-ignore - internal WORK_TEST-only source composition module.
import { captureAuthenticatedM5AR1125SourceEvidence as capture }
  from '../../src/scripts/privateModelM5AR1125AuthenticatedCaptureBridge.mjs';

// Only the original 3,112,432-byte SHA-verified GLB may reach the renderer.
// These synthetic fixtures intentionally cannot pass source authentication.
// Positive synthetic 27-frame adapter tests live in the existing module tests;
// none of them can stand in for production-original source pixel evidence.
function fixture() {
  const scene = new Group();
  const gltf = { scenes:Array.from({length:64},(_,i)=>i===63?scene:null) };
  const camera = new PerspectiveCamera(50,1.2,0.1,100);
  camera.position.z=12;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  let gpuCalls=0;
  const renderer={
    isWebGLRenderer:true,
    getRenderTarget:()=>{gpuCalls++;return null;},
    setRenderTarget:()=>{gpuCalls++;},
    render:()=>{gpuCalls++;},
    readRenderTargetPixels:()=>{gpuCalls++;},
  };
  const args={gltf,camera,renderer,THREE,width:192,height:160,
    originalRaw:new Uint8Array(3_112_432)};
  return {args, gpuCalls:()=>gpuCalls};
}

test('wrong original 3,112,432-byte GLB digest rejects before any GPU call',async()=>{
  const f=fixture();
  await expect(capture(f.args)).rejects.toThrow();
  expect(f.gpuCalls()).toBe(0);
  expect(f.args.gltf.scenes[63]).toBeInstanceOf(Group);
  expect(f.args.gltf.scenes[63]?.children).toHaveLength(0);
});

test('missing, short and non-byte-array original sources reject before any GPU call',async()=>{
  for(const raw of [undefined,new Uint8Array(3),new ArrayBuffer(3_112_432)]){
    const f=fixture();
    await expect(capture({...f.args,originalRaw:raw})).rejects
      .toThrow('R1125_AUTHENTIC_CAPTURE_BRIDGE');
    expect(f.gpuCalls()).toBe(0);
  }
});

test('foreign scene, invalid camera, fake renderer or oversized frame reject before GPU',async()=>{
  const cases=[
    (f:ReturnType<typeof fixture>)=>({...f.args,gltf:{scenes:[]}}),
    (f:ReturnType<typeof fixture>)=>({...f.args,camera:null}),
    (f:ReturnType<typeof fixture>)=>({...f.args,
      renderer:{...f.args.renderer,isWebGLRenderer:false}}),
    (f:ReturnType<typeof fixture>)=>({...f.args,width:1920,height:1201}),
  ];
  for(const invalid of cases){
    const f=fixture();
    await expect(capture(invalid(f))).rejects.toThrow(
      'R1125_AUTHENTIC_CAPTURE_BRIDGE');
    expect(f.gpuCalls()).toBe(0);
  }
});

test('caller-supplied human, current or production PASS flags cannot bypass original SHA',async()=>{
  const f=fixture();
  await expect(capture({
    ...f.args,
    humanReview:'PASS',
    productionCanvasPixelProvenanceVerified:true,
    current:true,
    asBuilt:true,
  })).rejects.toThrow();
  expect(f.gpuCalls()).toBe(0);
});
