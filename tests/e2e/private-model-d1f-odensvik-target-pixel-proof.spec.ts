import { expect, test } from '@playwright/test';
// @ts-ignore - source-proof native ESM imported for CI contract tests.
import {
  D1F_ODENSVIK_PIXEL_TARGETS,
  verifyD1FOdensvikPixelSource,
  countD1FOdensvikPixelDiff,
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
  const fs=require('node:fs');
  const source=fs.readFileSync('src/scripts/privateModelD1FOdensvikTargetPixelProof.mjs','utf8');
  expect(source).toContain('authenticatedProductionOriginVerified:false');
  expect(source).toContain('oneLinkAutoloadVerified:false');
  expect(source).toContain('individualProductionPixelsVerified:false');
  expect(source).toContain("humanReview:'NOT_RUN'");
  expect(source).toContain('createD1FShowerGlassWebGLCapture({renderer,target,width,height})');
  expect(source).toContain('gltf.parser.associations.get(object)');
  expect(source).toContain('finally{obj.visible=true;}');
});
