import { test, expect } from '@playwright/test';
// @ts-ignore - source-only original GLB camera framing is native ESM.
import { planD1FSourceGlassCamera, SHOWER_SOURCE } from '../../src/scripts/privateModelD1FShowerGlassSourceCameraFit.mjs';
import { readFileSync } from 'node:fs';

// Source mesh777 primitive coordinates from immutable 124-scene WORK_TEST GLB;
// exact source fetch/digest and current world transforms are verified by caller.
// Selected source root quaternion -90 degrees X: local [x,y,z] -> world [x,z,-y].
// These are GLTFLoader world bounds, not an as-built installation survey.
const westWorldBounds={min:[5.336,0.08,-2.954],max:[6.26,1.98,-2.03]};
const boundsForScene=(sceneIndex:number)=>{
  const eastShift=sceneIndex>=122?0.018:0; // source EAST working hypothesis
  return {min:[westWorldBounds.min[0]+eastShift,...westWorldBounds.min.slice(1)],
    max:[westWorldBounds.max[0]+eastShift,...westWorldBounds.max.slice(1)]};
};
const dot=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+x*b[i],0);
const diff=(a:number[],b:number[])=>a.map((x,i)=>x-b[i]);
const corners=(box:{min:number[],max:number[]})=>[0,1].flatMap(x=>[0,1].flatMap(y=>[0,1].map(z=>[
  x?box.max[0]:box.min[0], y?box.max[1]:box.min[1], z?box.max[2]:box.min[2]
])));

for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  test('original D1F mesh777 glass fits all source scenes '+viewport.width+'x'+viewport.height,()=>{
    for(const scene of SHOWER_SOURCE.scenes) {
      const worldBounds=boundsForScene(scene.sceneIndex);
      const pose=planD1FSourceGlassCamera({
        source:SHOWER_SOURCE,sceneIndex:scene.sceneIndex,rootNode:scene.rootNode,
        glassNode:scene.glassNode,glassMeshIndex:777,glassWorldBounds:worldBounds,
        viewportWidth:viewport.width,viewportHeight:viewport.height,
      });
      expect(pose.up).toEqual([0,1,0]); // world-Y-up after original root rotation
      expect(pose.cameraTrueUp[1]).toBeGreaterThan(0.98);
      expect(pose.cameraForward[2]).toBeLessThan(-0.9);
      expect(worldBounds.max[1]-worldBounds.min[1]).toBeCloseTo(1.9,5);
      expect(pose.presentationOnly).toBe(true);
      expect(pose.originalSourceBytesAuthenticatedByHelper).toBe(false);
      expect(pose.productionPixelEvidence).toBe(false);
      expect(pose.humanReview).toBe('NOT_RUN');
      for(const point of corners(worldBounds)) {
        const delta=diff(point,pose.position);
        const depth=dot(delta,pose.cameraForward);
        expect(depth).toBeGreaterThan(0);
        const h=Math.atan(Math.abs(dot(delta,pose.cameraRight))/depth);
        const v=Math.atan(Math.abs(dot(delta,pose.cameraTrueUp))/depth);
        expect(h).toBeLessThan(pose.horizontalFovDeg*Math.PI/360);
        expect(v).toBeLessThan(pose.verticalFovDeg*Math.PI/360);
      }
    }
  });
}

test('world-Y-up camera rejects foreign identity and degenerate source bounds',()=>{
  const original={source:SHOWER_SOURCE,sceneIndex:120,rootNode:2457,glassNode:2456,
    glassMeshIndex:777,glassWorldBounds:westWorldBounds,viewportWidth:1000,viewportHeight:750};
  for(const invalid of [{sceneIndex:124},{glassNode:2458},{glassMeshIndex:776},
    {source:{...SHOWER_SOURCE,sha256:'0'.repeat(64)}},
    {glassWorldBounds:{min:[5,2,0],max:[6,NaN,2]}}]) {
    expect(()=>planD1FSourceGlassCamera({...original,...invalid}))
      .toThrow('D1F_GLASS_CAMERA_SOURCE_REJECTED');
  }
});

test('proof runner uses actual GLTF parser associations and restores caller camera',()=>{
  const code=readFileSync('src/scripts/privateModelD1FShowerGlassWebGLProofRunner.mjs','utf8');
  expect(code).toContain('sourceGlassCameraFitApplied: sourceCameraFit !== null');
  expect(code).toContain('association?.meshes === 777');
  expect(code).toContain('glassGroup.children.every(child => child?.isMesh)');
  expect(code).toContain('camera.position.copy(cameraSnapshot.position)');
  expect(code).toContain('camera.up.copy(cameraSnapshot.up)');
  expect(code).toContain('sourceCameraFitIsProductionAutoloadProof: false');
});
