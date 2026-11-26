import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closestClearanceBetweenSelectedSurfaces as minimum } from '../../src/scripts/privateModelSurfaceClearance.mjs';

const g=(x,y,z)=>({xM:x,yM:y,sourceHeightYUpM:z});
const squareAtX=x=>[
  [g(x,0,0),g(x,1,0),g(x,1,1)],
  [g(x,0,0),g(x,1,1),g(x,0,1)],
];
const input=(a,b,more={})=>({
  surfaceA:{sourceId:'visible-source-A',triangles:a},
  surfaceB:{sourceId:'visible-source-B',triangles:b},
  acceptsTriangleA:()=>true,acceptsTriangleB:()=>true,...more,
});
const near=(actual,want)=>assert.ok(Math.abs(actual-want)<1e-8,
  `expected ${actual} to be ${want}`);

test('two parallel triangulated vertical walls return the shortest normal gap, not a diagonal',()=>{
  const result=minimum(input(squareAtX(0),squareAtX(.3)));
  assert.ok(result);
  near(result.distanceM,.3);
  near(result.from.xM,0);
  near(result.to.xM,.3);
  near(result.deltaXM,.3);
  near(result.deltaYM,0);
  near(result.deltaZM,0);
  near(result.directionG1.xM,1);
  assert.equal(result.sourceAId,'visible-source-A');
  assert.equal(result.sourceBId,'visible-source-B');
  assert.equal(result.workTestOnly,true);
  assert.equal(result.surveyedClearanceVerified,false);
  assert.equal(result.asBuilt,false);
  assert.equal(result.visibleTrianglesOnly,true);
  assert.ok(Object.isFrozen(result.from));
});

test('two stacked overlapping triangles use two real face points',()=>{
  const result=minimum(input(
    [[g(0,0,0),g(2,0,0),g(0,2,0)]],
    [[g(.5,.5,1),g(1,.5,1),g(.5,1,1)]],
  ));
  assert.ok(result);
  near(result.distanceM,1);
  near(result.from.sourceHeightYUpM,0);
  near(result.to.sourceHeightYUpM,1);
  near(result.from.xM,result.to.xM);
  near(result.from.yM,result.to.yM);
});

test('non-coplanar crossing triangles return zero even when no vertex touches the other face',()=>{
  const result=minimum(input(
    [[g(-1,-1,0),g(1,-1,0),g(0,1,0)]],
    [[g(0,-.5,-1),g(0,.5,1),g(0,-.5,1)]],
  ));
  assert.ok(result);
  near(result.distanceM,0);
  assert.deepEqual(result.from,result.to);
  assert.equal(result.directionG1,null);
});

test('coplanar crossing triangles intersect along their edges',()=>{
  const result=minimum(input(
    [[g(0,0,0),g(2,0,0),g(1,2,0)]],
    [[g(0,1.5,0),g(2,1.5,0),g(1,-.5,0)]],
  ));
  assert.ok(result);
  near(result.distanceM,0);
});

test('only caller-confirmed visible source triangles can contribute a contact point',()=>{
  const result=minimum(input(
    [...squareAtX(0),...squareAtX(10)],
    squareAtX(.3),
    {acceptsTriangleA:(_triangle,index)=>index>=2},
  ));
  assert.ok(result);
  near(result.distanceM,9.7);
  near(result.from.xM,10);
  near(result.to.xM,.3);
  assert.equal(result.triangleAIndex,2);
  assert.equal(minimum(input(squareAtX(0),squareAtX(.3),
    {acceptsTriangleB:()=>false})),null);
});

test('visibility and source identity are fail-closed, no guessed geometry',()=>{
  const data=input(squareAtX(0),squareAtX(.3));
  assert.equal(minimum({...data,acceptsTriangleA:undefined}),null);
  assert.equal(minimum({...data,acceptsTriangleB:()=>undefined}),null);
  assert.equal(minimum({...data,acceptsTriangleB:()=>{throw Error('visibility unknown')}}),null);
  assert.equal(minimum({...data,surfaceB:{sourceId:data.surfaceA.sourceId,triangles:squareAtX(.3)}}),null);
  assert.equal(minimum({...data,surfaceA:{sourceId:'',triangles:squareAtX(0)}}),null);
  assert.equal(minimum({...data,surfaceB:{sourceId:'B',triangles:[]}}),null);
});

test('reject nonfinite, degenerate or unbounded source geometry before comparisons',()=>{
  const data=input(squareAtX(0),squareAtX(.3));
  assert.equal(minimum({...data,surfaceA:{sourceId:'A',
    triangles:[[g(0,0,0),g(0,0,0),g(1,0,0)]]}}),null);
  assert.equal(minimum({...data,surfaceA:{sourceId:'A',
    triangles:[[g(Infinity,0,0),g(0,1,0),g(0,0,1)]]}}),null);
  assert.equal(minimum({...data,maxPairs:2}),null);
  assert.equal(minimum({...data,maxPairs:4097}),null);
  const tooMany=Array.from({length:65},()=>squareAtX(0)[0]);
  assert.equal(minimum({...data,surfaceA:{sourceId:'A',triangles:tooMany}}),null);
});
