import {test,expect} from '@playwright/test';
import {
  captureP186E34SourceFrames as capture,
} from '../../src/scripts/privateModelP186E34FrameCapture.mjs';
import {
  p186ePixelCandidateId as candidate, p186ePixelExpected as counts,
  p186ePixelSourcePdfDriveId as graphic,
  p186ePixelSchedulePdfDriveId as schedule,
  p186ePixelRepresentationKinds as kinds,
} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';

const W=160,H=112, bg=[32,38,43,255], amber=[255,190,20,255];
function input() {
  const floors=(['D1F','D2F'] as const).map(floor=>{
    const objects: {visible:boolean,parent:null}[]=[];
    const targets=Array.from({length:counts[floor].total},(_,i)=>{
      const kind:'group'|'special'=i<counts[floor].group?'group':'special';
      const object={visible:true,parent:null};
      objects.push(object);
      return {
        object, sourceKey:floor+'_LABEL_'+String(i+1).padStart(2,'0'),kind,
        representationKind:kinds[kind],sourcePdfDriveId:graphic,
        schedulePdfDriveId:kind==='group'?schedule:null,
        roi:{x:8+(i%6)*23,y:8+Math.floor(i/6)*23,width:10,height:10},
        presentationOnly:true,sourceDerived:true,currentGeometryClaim:false,
        asBuilt:false,canonical:false,publishToCURRENT:false,humanReview:'NOT_RUN',
      };
    });
    return {floor,sceneKey:floor+'_scene',cameraKey:floor+'_camera',
      camera:'fixed-projection-matrix-v1',targets,objects,
      shared:new Uint8Array(W*H*4),captures:0};
  });
  const renderer=async(session:typeof floors[number])=>{
    session.captures++;
    const pixels=session.shared; // intentionally reused WebGL-like RGBA backing store
    for(let at=0;at<pixels.length;at+=4)pixels.set(bg,at);
    for(const target of session.targets)if(target.object.visible){
      const {x,y,width,height}=target.roi;
      for(let row=y;row<y+height;row++)
        for(let col=x;col<x+width;col++)
          pixels.set(amber,(row*W+col)*4);
    }
    return {width:W,height:H,pixels,floor:session.floor,
      sceneKey:session.sceneKey,cameraKey:session.cameraKey,sourceCandidateId:candidate};
  };
  return {floors,captureRGBA:renderer,
    readCameraFingerprint:(session:typeof floors[number])=>session.camera};
}
const verify=(x:ReturnType<typeof input>)=>capture({
  sourceCandidateId:candidate,floors:x.floors,
  captureRGBA:x.captureRGBA,readCameraFingerprint:x.readCameraFingerprint,
});

test('all 34 historical D labels are individually captured and exactly restored',async()=>{
  const x=input(), result=await verify(x);
  expect(result).toMatchObject({targetCount:34,captureBridge:'CALLER_RENDERER_ONLY',
    exactRestoresVerified:true,sourceAuthenticated:false,
    productionScreenshotVerified:false,humanReview:'NOT_RUN'});
  expect(result.D1F.visuallyIsolated).toBe(18);
  expect(result.D2F.visuallyIsolated).toBe(16);
  expect(x.floors.map(f=>f.captures)).toEqual([37,33]); // 1 baseline + 2 per target
  expect(x.floors.every(f=>f.objects.every(o=>o.visible))).toBe(true);
});

test('camera drift during hidden frame aborts and restores the source target',async()=>{
  const x=input(), original=x.captureRGBA;
  x.captureRGBA=async s=>{
    const value=await original(s);
    if(s.floor==='D1F'&&s.targets.some(t=>!t.object.visible))
      s.camera='changed-projection-matrix';
    return value;
  };
  await expect(verify(x)).rejects.toThrow('camera drift');
  expect(x.floors[0].objects.every(o=>o.visible)).toBe(true);
});

test('renderer exception while target hidden still restores target visibility',async()=>{
  const x=input(),original=x.captureRGBA;
  x.captureRGBA=async s=>{
    if(s.floor==='D1F'&&s.targets.some(t=>!t.object.visible))
      throw new Error('renderer readPixels failed');
    return original(s);
  };
  await expect(verify(x)).rejects.toThrow('renderer readPixels failed');
  expect(x.floors[0].objects.every(o=>o.visible)).toBe(true);
});

test('unchanged hidden image does not masquerade as 34 independent label captures',async()=>{
  const x=input(),original=x.captureRGBA;
  x.captureRGBA=async s=>{
    const old=s.objects.map(o=>o.visible);
    s.objects.forEach(o=>o.visible=true);
    const frame=await original(s);
    s.objects.forEach((o,i)=>o.visible=old[i]);
    return frame;
  };
  await expect(verify(x)).rejects.toThrow('not individually visible');
  expect(x.floors[0].objects.every(o=>o.visible)).toBe(true);
});

test('restoration must also be pixel-identical, not merely visible:true',async()=>{
  const x=input(),original=x.captureRGBA;
  x.captureRGBA=async s=>{
    const frame=await original(s);
    if(s.floor==='D1F'&&s.captures===3) frame.pixels[0]^=127;
    return frame;
  };
  await expect(verify(x)).rejects.toThrow('restored frame differs');
  expect(x.floors[0].objects.every(o=>o.visible)).toBe(true);
});
