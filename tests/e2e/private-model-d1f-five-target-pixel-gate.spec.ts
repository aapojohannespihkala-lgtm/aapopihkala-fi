import { test, expect } from '@playwright/test';
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';
import {
  D1F_FOUR_PIXEL_TARGETS, D1F_FIVE_PIXEL_TARGETS, D1F_PIXEL_SUPPRESSION,
  evaluateD1FOneTargetPixelSample, evaluateD1FOneMeasuredTargetPixelSample,
  evaluateD1FFourTargetPixelGate, evaluateD1FFiveTargetPixelGate,
} from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';

const measured = D1F_COMBINED_WALL_ASSETS['d1f-measured-wall-140-100-2350-b710-basin-20261014'].sha256;
const oldSha = D1F_COMBINED_WALL_ASSETS['d1f-combined-wall-115-100-20261013'].sha256;
const methods = {...D1F_PIXEL_SUPPRESSION, BASIN:'BASIN_NODE_VISIBILITY_ONLY'};

const makeProof = (id: string, sha = measured) => {
  const width=40,height=40;
  const baseline = new Uint8Array(width*height*4);
  const suppressed = baseline.slice();
  for (let y=12;y<20;y++) for(let x=12;x<20;x++) {
    const offset = 4*(y*width+x);
    suppressed[offset]=200; suppressed[offset+1]=100; suppressed[offset+2]=40;
  }
  const stamp = {
    width,height,cameraFingerprint:'real-source-camera-fixture',
    glbSha256:sha,variant:'WEST_ANCHOR_725_895_740',
  };
  return {
    targetId:id,
    baseline:{...stamp,rgba:baseline},
    suppressed:{...stamp,rgba:suppressed},
    roi:{x:10,y:10,width:12,height:12},
    suppressionMethod:methods[id as keyof typeof methods],
    targetIdentityVerified:true,roiProvenance:'PROJECTED_EXACT_TARGET_GEOMETRY',
    suppressionRestored:true,
  };
};
const proofs = (sha = measured) => D1F_FIVE_PIXEL_TARGETS.map(id=>makeProof(id,sha));

test('exact measured 5 targets include one basin, preserve original four target order',()=>{
  expect(D1F_FIVE_PIXEL_TARGETS).toEqual([...D1F_FOUR_PIXEL_TARGETS,'BASIN']);
  const p=proofs();
  expect(evaluateD1FOneMeasuredTargetPixelSample(p[4])).toMatchObject({
    targetId:'BASIN',result:'PASS_TARGET_DIFFERENTIAL_PIXELS_ONLY',
    suppressionMethod:'BASIN_NODE_VISIBILITY_ONLY',changedInside:64,changedOutside:0,
  });
  const gate=evaluateD1FFiveTargetPixelGate(p);
  expect(gate.gate).toBe('PASS_FIVE_INDEPENDENT_DIFFERENTIAL_PIXEL_CONTRACTS_ONLY');
  expect(gate.checkedTargetCount).toBe(5);
  expect(gate.targets.map(x=>x.targetId)).toEqual([...D1F_FIVE_PIXEL_TARGETS]);
  expect(gate).toMatchObject({
    originalGlbBytesAuthenticatedByThisFunction:false,
    actualBrowserWebGlVerifiedByThisFunction:false,
    productionPublicationVerifiedByThisFunction:false,humanReview:'NOT_RUN',
  });
});

test('old source remains strictly four targets and cannot prove BASIN',()=>{
  const old=D1F_FOUR_PIXEL_TARGETS.map(id=>makeProof(id,oldSha));
  expect(evaluateD1FFourTargetPixelGate(old).checkedTargetCount).toBe(4);
  expect(()=>evaluateD1FOneTargetPixelSample(makeProof('BASIN',oldSha))).toThrow('unknown target ID');
  expect(()=>evaluateD1FFourTargetPixelGate(proofs())).toThrow('four separate samples');
});

test('measured contract rejects old or falsified hashes and inconsistent frame source',()=>{
  expect(()=>evaluateD1FFiveTargetPixelGate(proofs(oldSha))).toThrow('image size, camera, GLB or variant changed');
  const a=proofs();
  a[3].suppressed.glbSha256='0'.repeat(64);
  expect(()=>evaluateD1FFiveTargetPixelGate(a)).toThrow('image size, camera, GLB or variant changed');
});

test('measured contract rejects absent/duplicated basin and lowered pixel thresholds',()=>{
  expect(()=>evaluateD1FFiveTargetPixelGate(proofs().slice(0,4))).toThrow('five separate measured samples');
  const p=proofs();
  p[4].targetId='I03';
  expect(()=>evaluateD1FFiveTargetPixelGate(p)).toThrow('five distinct measured');
  expect(()=>evaluateD1FFiveTargetPixelGate(proofs(),{minRoiChangedPixels:1})).toThrow('five separate measured samples');
  expect(()=>evaluateD1FFiveTargetPixelGate(proofs(),{outsideChangeAllowance:100})).toThrow('five separate measured samples');
});

test('basin source ROI, suppression and restoration cannot be replaced by generic pixels',()=>{
  const wrong=proofs();
  wrong[4].suppressionMethod='WHOLE_WALL_VISIBILITY';
  expect(()=>evaluateD1FFiveTargetPixelGate(wrong)).toThrow('suppression/ROI provenance not verified');
  const fake=proofs();
  fake[4].roiProvenance='GENERIC_CANVAS_RECT';
  expect(()=>evaluateD1FFiveTargetPixelGate(fake)).toThrow('suppression/ROI provenance not verified');
  const clipped=proofs();
  clipped[4].roi.x=39;
  expect(()=>evaluateD1FFiveTargetPixelGate(clipped)).toThrow('ROI invalid or clipped');
  const unrestored=proofs();
  unrestored[4].suppressionRestored=false;
  expect(()=>evaluateD1FFiveTargetPixelGate(unrestored)).toThrow('suppression/ROI provenance not verified');
});
