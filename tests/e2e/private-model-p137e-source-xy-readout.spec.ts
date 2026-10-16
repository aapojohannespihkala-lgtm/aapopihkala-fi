import { test, expect } from '@playwright/test';
import { Matrix4, PerspectiveCamera, OrthographicCamera, Vector3 } from 'three';
// @ts-ignore - isolated Three.js maths helper with strict source provenance.
import { locateP137ESourceXYAtPointer } from '../../src/scripts/privateModelP137ESourceXYReadout.mjs';

const rigid = new Matrix4().makeRotationX(-Math.PI/2);
const sourceBounds = {minX:4,maxX:6,minY:1,maxY:3};
const camera = () => {
  const cam=new PerspectiveCamera(38,1,0.01,100);
  cam.position.set(5,3,-2);
  cam.lookAt(new Vector3(5,0.08,-2));
  cam.updateMatrixWorld(true);
  return cam;
};
const inputs=()=>({
  camera:camera(),
  pointerNdc:{x:0,y:0},
  worldFromYlisG1:rigid.clone(),
  sourceTransformVerified:true,
  floorLocalZ:0.08,
  sourceBounds,
});

test('real YLIS-G1 XY is recovered through exact -90deg source-to-Three world transform',()=>{
  const result=locateP137ESourceXYAtPointer(inputs());
  expect(result?.sourceCoordinateSystem).toBe('YLIS-G1-LOCAL');
  if (!result) throw new Error('Expected an intersecting authenticated YLIS-G1 source floor');
  expect(result.sourceXMetres).toBeCloseTo(5,6);
  expect(result.sourceYMetres).toBeCloseTo(2,6);
  expect(result.sourceFloorZMetres).toBe(0.08);
  expect(result).toMatchObject({
    presentationOnly:true,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
    physicalDevicePositionVerified:false,
    transformProvenance:'CALLER_VERIFIED_SOURCE_MATRIX',
  });
});
test('an actual orthographic camera works without assuming an axis convention',()=>{
  const cam=new OrthographicCamera(-2,2,2,-2,.01,100);
  cam.position.set(5,3,-2);
  cam.lookAt(new Vector3(5,.08,-2));
  const result=locateP137ESourceXYAtPointer({...inputs(),camera:cam});
  expect(result?.sourceXMetres).toBeCloseTo(5,6);
  expect(result?.sourceYMetres).toBeCloseTo(2,6);
});
test('missing transform trust, forged scale and coordinates outside source footprint reject',()=>{
  const normal=inputs();
  for(const extra of [
    {sourceTransformVerified:false},
    {worldFromYlisG1:new Matrix4().makeScale(2,1,1)},
    {floorLocalZ:NaN},
    {pointerNdc:{x:1.2,y:0}},
    {sourceBounds:{minX:4,maxX:4,minY:1,maxY:3}},
  ]) {
    expect(()=>locateP137ESourceXYAtPointer({...normal,...extra}))
      .toThrow('P137E_SOURCE_XY_READOUT_REJECTED');
  }
  expect(locateP137ESourceXYAtPointer({...inputs(),
    sourceBounds:{minX:10,maxX:11,minY:10,maxY:11}})).toBeNull();
});
test('source plane behind the actual camera produces no invented coordinate',()=>{
  const cam=camera();
  cam.position.set(5,-2,-2);
  cam.lookAt(new Vector3(5,-3,-2));
  expect(locateP137ESourceXYAtPointer({...inputs(),camera:cam})).toBeNull();
});
