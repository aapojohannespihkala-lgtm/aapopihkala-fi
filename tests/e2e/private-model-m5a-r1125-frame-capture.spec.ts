import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {captureM5AR1125FrameSequence as capture} from '../../src/scripts/privateModelM5AR1125FrameCaptureSequence.mjs';
import {m5aR1125SourcePixelKinds as kinds} from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys=Object.keys(kinds), W=192, H=160;
function setup() {
  const root={visible:true,parent:null};
  const targets=Object.fromEntries(keys.map(key=>[key,{
    visible:true,parent:root,material:{visible:true,opacity:1},isMesh:true,
  }]));
  const camera={isPerspectiveCamera:true,
    matrixWorld:{elements:Array.from({length:16},(_,i)=>i%5===0?1:0)},
    projectionMatrix:{elements:Array.from({length:16},(_,i)=>i%5===0?1:0)},
    updateMatrixWorld(){}, updateProjectionMatrix(){},
  };
  const pixels=new Uint8Array(W*H*4);
  let reads=0;
  const captureRGBA=async()=>{
    reads++;
    for(let i=0;i<pixels.length;i+=4){pixels[i]=20;pixels[i+1]=28;pixels[i+2]=40;pixels[i+3]=255;}
    for(let n=0;n<keys.length;n++) if(targets[keys[n]].visible){
      const x=8+(n%6)*28,y=10+Math.floor(n/6)*40;
      for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++){
        const at=((y+dy)*W+x+dx)*4;
        pixels.set([200,100,25,255],at);
      }
    }
    return pixels; // intentionally reusable backing store
  };
  return {root,targets,camera,captureRGBA,reads:()=>reads,params:{
    sceneRoot:root,camera,sceneIndex:63,width:W,height:H,targets,captureRGBA,
  }};
}

test('exact 13 source targets produce baseline, 13 hides, 13 exact restores',async()=>{
  const s=setup(),result=await capture(s.params);
  assert.equal(s.reads(),27);
  assert.equal(Object.keys(result.mutedFrames).length,13);
  assert.equal(Object.keys(result.restoredFrames).length,13);
  assert.deepEqual(Object.keys(result.mutedFrames),keys);
  assert.equal(result.sourceObjectCount,13);
  assert.equal(result.captureScope,'CALLER_RENDERER_ONLY');
  assert.equal(result.originalGlbDigestAuthenticated,false);
  assert.equal(result.productionProvenanceVerified,false);
  assert.equal(result.humanReview,'NOT_RUN');
  assert(keys.every(k=>!result.mutedFrames[k].every((v,i)=>v===result.baseline[i])));
  assert(keys.every(k=>result.restoredFrames[k].every((v,i)=>v===result.baseline[i])));
  assert(keys.every(k=>s.targets[k].visible));
  assert.equal(result.cameraStates.baseline.length,34);
  assert(keys.every(k=>result.cameraStates.muted[k].length===34));
});

test('missing target, duplicate object and foreign root reject without captures',async()=>{
  const a=setup();delete a.targets[keys[0]];
  await assert.rejects(()=>capture(a.params),/exact 13 source objects/);
  const b=setup();b.targets[keys[1]]=b.targets[keys[0]];
  await assert.rejects(()=>capture(b.params),/distinct source objects/);
  const c=setup();c.targets[keys[2]].parent={visible:true,parent:null};
  await assert.rejects(()=>capture(c.params),/outside source root/);
});

test('camera mutation during hidden frame aborts and restores all source objects',async()=>{
  const s=setup(),original=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await original();
    if(keys.some(k=>!s.targets[k].visible))s.camera.projectionMatrix.elements[0]=1.1;
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/camera\/viewport drift/);
  assert(keys.every(k=>s.targets[k].visible));
});

test('renderer exception while hidden restores target and all peers',async()=>{
  const s=setup(),original=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    if(keys.some(k=>!s.targets[k].visible))throw Error('WebGL readPixels unavailable');
    return original();
  };
  await assert.rejects(()=>capture(s.params),/WebGL readPixels unavailable/);
  assert(keys.every(k=>s.targets[k].visible));
});

test('peer-parent visibility and material mutations fail closed and are restored',async()=>{
  const s=setup(),orig=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await orig();
    if(keys.some(k=>!s.targets[k].visible)) {
      s.root.visible=false;
      s.targets[keys[5]].material.opacity=0;
    }
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/invisible or cyclic ancestor|source\/peer\/parent visibility changed/);
  assert.equal(s.root.visible,true);
  assert.equal(s.targets[keys[5]].material.opacity,1);
  assert(keys.every(k=>s.targets[k].visible));
});

test('a readback that does not show any hide fails closed',async()=>{
  const s=setup(),orig=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const hidden=keys.find(k=>!s.targets[k].visible);
    if(hidden)s.targets[hidden].visible=true;
    const frame=await orig();
    if(hidden)s.targets[hidden].visible=false;
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/muting target did not change RGBA/);
  assert(keys.every(k=>s.targets[k].visible));
});

test('pixel restoration mismatch aborts rather than claiming success',async()=>{
  const s=setup(),orig=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await orig();
    if(s.reads()===3)frame[0]^=17;
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/restore differs at pixel level/);
  assert(keys.every(k=>s.targets[k].visible));
});

test('27-frame capture memory guard rejects oversized canvas before rendering',async()=>{
  const s=setup();
  s.params.width=2000;
  s.params.height=1201; // 2,402,000 pixels would retain excessive RGBA memory
  await assert.rejects(()=>capture(s.params),/exact scene63\/canvas\/renderer contract/);
  assert.equal(s.reads(),0);
  s.params.width=1920;
  s.params.height=1200; // 2,304,000 pixels remains an allowed bound
  await assert.rejects(()=>capture(s.params),/RGBA exact byte length/);
  assert.equal(s.reads(),1); // bound passed, then mock frame size rejected
});
