import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {captureM5AR1125FrameSequence as capture} from '../../src/scripts/privateModelM5AR1125FrameCaptureSequence.mjs';
import {m5aR1125SourcePixelKinds as kinds} from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

// These are synthetic renderer state regressions, NOT original GLB/WebGL evidence.
const keys=Object.keys(kinds), W=192, H=160;
const vec=(x:number,y:number)=>({x,y});
const material=()=>({visible:true,opacity:1,depthTest:true,depthWrite:true,
  color:{r:.2,g:.4,b:.6},emissive:{r:0,g:0,b:0},
  map:{offset:vec(0,0),repeat:vec(1,1),center:vec(.5,.5),rotation:0,flipY:true}});
function setup(){
  const root={visible:true,parent:null};
  const targets:Record<string,{visible:boolean;parent:typeof root;material:any;isMesh:boolean}>=
    Object.fromEntries(keys.map(key=>[key,{visible:true,parent:root,material:material(),isMesh:true}]));
  const camera={isPerspectiveCamera:true,
    matrixWorld:{elements:Array.from({length:16},(_,i):number=>i%5===0?1:0)},
    projectionMatrix:{elements:Array.from({length:16},(_,i):number=>i%5===0?1:0)},
    updateMatrixWorld(){},updateProjectionMatrix(){}};
  const pixels=new Uint8Array(W*H*4);
  let reads=0;
  const captureRGBA=async()=>{
    reads++;
    for(let i=0;i<pixels.length;i+=4){pixels[i]=20;pixels[i+1]=28;pixels[i+2]=40;pixels[i+3]=255;}
    keys.forEach((key,n)=>{
      if(!targets[key].visible)return;
      const x=8+(n%6)*28,y=10+Math.floor(n/6)*40;
      for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++){
        const at=((y+dy)*W+x+dx)*4;
        pixels[at]=200;pixels[at+1]=100;pixels[at+2]=25;pixels[at+3]=255;
      }
    });
    return pixels; // renderer may reuse the same buffer
  };
  return {targets,reads:()=>reads,params:{sceneRoot:root,camera,sceneIndex:63,
    width:W,height:H,targets,captureRGBA}};
}
const hidden=(s:ReturnType<typeof setup>)=>keys.some(key=>!s.targets[key].visible);

test('clean 27-frame synthetic sequence remains accepted without production promotion',async()=>{
  const s=setup(),r=await capture(s.params);
  assert.equal(s.reads(),27);assert.equal(Object.keys(r.restoredFrames).length,13);
  assert.equal(r.productionProvenanceVerified,false);assert.equal(r.humanReview,'NOT_RUN');
});
test('hidden-frame RGB mutation fails closed and restores original color',async()=>{
  const s=setup(),m=s.targets[keys[2]].material,original=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await original();
    if(hidden(s))m.color.g=.95;
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/source material color\/depth\/texture state drift/);
  assert.equal(m.color.g,.4);assert(keys.every(key=>s.targets[key].visible));
});
test('equal-coordinate UV offset reference replacement is detected and rolled back',async()=>{
  const s=setup(),m=s.targets[keys[4]].material,offset=m.map.offset,original=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await original();
    if(hidden(s))m.map.offset=vec(0,0);
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/source material color\/depth\/texture state drift/);
  assert.equal(m.map.offset,offset);assert.equal(offset.x,0);assert.equal(offset.y,0);
  assert(keys.every(key=>s.targets[key].visible));
});
test('material array member replacement is detected and restored',async()=>{
  const s=setup(),object=s.targets[keys[6]],first=object.material;
  object.material=[first,material()];const members=[...object.material];
  const original=s.params.captureRGBA;
  s.params.captureRGBA=async()=>{
    const frame=await original();
    if(hidden(s))object.material[0]=material();
    return frame;
  };
  await assert.rejects(()=>capture(s.params),/source object material\/geometry\/parent binding drift/);
  assert.deepEqual(object.material,members);assert(keys.every(key=>s.targets[key].visible));
});
test('renderer exception after UV tamper restores original vector reference and values',async()=>{
  const s=setup(),m=s.targets[keys[1]].material,original=s.params.captureRGBA;
  const center=m.map.center;
  s.params.captureRGBA=async()=>{
    if(hidden(s)){
      center.x=.8;m.map.center=vec(.8,.9);
      throw new Error('readPixels interrupted');
    }
    return original();
  };
  await assert.rejects(()=>capture(s.params),/readPixels interrupted/);
  assert.equal(m.map.center,center);assert.equal(center.x,.5);assert.equal(center.y,.5);
  assert(keys.every(key=>s.targets[key].visible));
});
