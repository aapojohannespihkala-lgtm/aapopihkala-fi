import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { BoxGeometry, Mesh, MeshBasicMaterial, OrthographicCamera } from 'three';
// @ts-ignore - source-proof native ESM imported for CI contract tests.
import {
  D1F_ODENSVIK_PIXEL_TARGETS,
  verifyD1FOdensvikPixelSource,
  countD1FOdensvikPixelDiff,
  projectD1FOdensvikObjectPixelRoi,
  runD1FOdensvikSourcePixelProof,
} from '../../src/scripts/privateModelD1FOdensvikTargetPixelProof.mjs';

test('ODENSVIK 40/40 successor has four exact scenes and 12 independently testable mesh targets',()=>{
  expect(D1F_ODENSVIK_PIXEL_TARGETS.map((v:any)=>v.scene)).toEqual([108,109,110,111]);
  expect(D1F_ODENSVIK_PIXEL_TARGETS.map((v:any)=>v.root)).toEqual([2428,2484,2540,2596]);
  expect(D1F_ODENSVIK_PIXEL_TARGETS.flatMap((v:any)=>v.targets.map((t:any)=>t[0])))
    .toEqual(Array.from({length:4},()=>['counter','bowl','cabinet']).flat());
  expect(D1F_ODENSVIK_PIXEL_TARGETS.map((v:any)=>v.targets[1][3])).toEqual([3,3,3,3]);
  expect(D1F_ODENSVIK_PIXEL_TARGETS.map((v:any)=>v.targets[1][2])).toEqual([766,766,767,767]);
});

test('source-proof image comparison requires isolated pixels and exact framebuffer restoration',()=>{
  const baseline=new Uint8Array(64*4), hidden=baseline.slice();
  for(let i=0;i<64;i++)hidden[i*4]=180;
  const accepted=countD1FOdensvikPixelDiff(baseline,hidden,baseline);
  expect(accepted).toEqual({changedPixels:64,restoredDriftPixels:0,visible:true});
  expect(countD1FOdensvikPixelDiff(baseline,baseline,baseline).visible).toBe(false);
  expect(countD1FOdensvikPixelDiff(baseline,hidden,hidden).visible).toBe(false);
  expect(()=>countD1FOdensvikPixelDiff(baseline,hidden,new Uint8Array(13)))
    .toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
});

test('12 original source targets only earn pixels inside their own conservative projected ROI',()=>{
  const width=8,height=8,baseline=new Uint8Array(width*height*4);
  const outsideOnly=baseline.slice(),insideOnly=baseline.slice(),restored=baseline.slice();
  const roi={left:2,right:6,bottom:2,top:6};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const index=(y*width+x)*4;
    const inside=x>=roi.left&&x<roi.right&&y>=roi.bottom&&y<roi.top;
    (inside?insideOnly:outsideOnly)[index]=180;
  }
  const options={roi,width,height,minimum:16};
  expect(countD1FOdensvikPixelDiff(baseline,outsideOnly,restored,options))
    .toEqual({changedPixels:0,restoredDriftPixels:0,visible:false});
  expect(countD1FOdensvikPixelDiff(baseline,insideOnly,restored,options))
    .toEqual({changedPixels:16,restoredDriftPixels:0,visible:true});
  restored[0]=10; // Outside the source footprint: restoration is still global.
  expect(countD1FOdensvikPixelDiff(baseline,insideOnly,restored,options).visible).toBe(false);
  expect(()=>countD1FOdensvikPixelDiff(baseline,insideOnly,baseline,{
    roi:{left:3,right:9,bottom:2,top:6},width,height,minimum:1,
  })).toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
});

test('projected original object ROI uses WebGL bottom-left pixels and rejects missing visibility',()=>{
  const camera=new OrthographicCamera(-1,1,1,-1,0.1,100);
  camera.position.set(0,0,4);camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const mesh=new Mesh(new BoxGeometry(0.4,0.4,0.4),new MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  const roi=projectD1FOdensvikObjectPixelRoi(mesh,camera,80,80,{padding:0});
  expect(roi.left).toBeLessThan(40);
  expect(roi.right).toBeGreaterThan(40);
  expect(roi.bottom).toBeLessThan(40);
  expect(roi.top).toBeGreaterThan(40);
  mesh.position.set(8,0,0);mesh.updateMatrixWorld(true);
  expect(()=>projectD1FOdensvikObjectPixelRoi(mesh,camera,80,80))
    .toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
  mesh.position.set(0,0,4);mesh.updateMatrixWorld(true);
  expect(()=>projectD1FOdensvikObjectPixelRoi(mesh,camera,80,80))
    .toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
});

test('untrusted and obsolete source is rejected before GLTFLoader or GPU capture',async()=>{
  await expect(verifyD1FOdensvikPixelSource(new Uint8Array(64)))
    .rejects.toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
  const wrong=new Uint8Array(8876156);
  new DataView(wrong.buffer).setUint32(0,0x46546c67,true);
  await expect(verifyD1FOdensvikPixelSource(wrong))
    .rejects.toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
  let loaderUsed=false;
  const loader={parseAsync:()=>{loaderUsed=true;throw Error('must not parse')}};
  await expect(runD1FOdensvikSourcePixelProof({
    rawGlb:wrong,loader,renderer:null,target:null,camera:null,width:800,height:600,
  })).rejects.toThrow('D1F_ODENSVIK_TARGET_PIXELS_REJECTED');
  expect(loaderUsed).toBe(false);
});

test('real-WebGL proof runner explicitly cannot certify one-link production or human approval',()=>{
  const source=readFileSync('src/scripts/privateModelD1FOdensvikTargetPixelProof.mjs','utf8');
  expect(source).toContain('authenticatedProductionOriginVerified:false');
  expect(source).toContain('oneLinkAutoloadVerified:false');
  expect(source).toContain('individualProductionPixelsVerified:false');
  expect(source).toContain("humanReview:'NOT_RUN'");
  expect(source).toContain('createD1FShowerGlassWebGLCapture({renderer,target,width,height})');
  expect(source).toContain('gltf.parser.associations.get(object)');
  expect(source).toContain('finally{obj.visible=true;}');
  expect(source).toContain('const pixelRoi=projectD1FOdensvikObjectPixelRoi(obj,camera,width,height);');
  expect(source).toContain('countD1FOdensvikPixelDiff(before,hidden,restored,{roi:pixelRoi,width,height})');
});
