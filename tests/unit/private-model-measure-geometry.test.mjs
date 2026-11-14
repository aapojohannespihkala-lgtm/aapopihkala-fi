import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measureAlongG1Axis,extractMeasureFeatureEdges,chooseMeasureFeatureSnap,
} from '../../src/scripts/privateModelMeasureGeometry.mjs';

const g=(x,y,z=0)=>({xM:x,yM:y,sourceHeightYUpM:z});
const same=(a,b)=>assert.deepEqual([a.xM,a.yM,a.sourceHeightYUpM],[b.xM,b.yM,b.sourceHeightYUpM]);
const projector=p=>({x:p.xM*100,y:p.yM*100,visible:true});
const checker=()=>true;

test('G1 axis projection preserves A and measures X/Y/Z/XY/free without a false diagonal',()=>{
  const a=g(1,2,3),b=g(3.4,5,5);
  const expect=[
    ['free',Math.hypot(2.4,3,2),b],
    ['x',2.4,g(3.4,2,3)],
    ['y',3,g(1,5,3)],
    ['z',2,g(1,2,5)],
    ['xy',Math.hypot(2.4,3),g(3.4,5,3)],
  ];
  for(const [mode,length,end] of expect){
    const result=measureAlongG1Axis(a,b,mode);
    assert.equal(result.mode,mode);
    assert.ok(Math.abs(result.distanceM-length)<1e-12);
    same(result.from,a);
    same(result.to,end);
    assert.equal(result.workTestOnly,true);
  }
  assert.equal(measureAlongG1Axis(a,b,'unknown'),null);
  assert.equal(measureAlongG1Axis(a,g(NaN,4,5),'x'),null);
});

test('axis projection remains signed but displayed distance is nonnegative',()=>{
  const result=measureAlongG1Axis(g(3,4,5),g(1,2,1),'z');
  assert.equal(result.signedZM,-4);
  assert.equal(result.distanceM,4);
});

const squarePositions=[
  0,0,0, 2,0,0, 2,1,0,
  0,0,0, 2,1,0, 0,1,0,
];
const identity=(x,y,z)=>g(x,y,z);
test('coplanar triangle diagonal is not a building feature edge',()=>{
  const edges=extractMeasureFeatureEdges({positions:squarePositions,toG1:identity});
  assert.equal(edges.length,4);
  assert.equal(edges.some(e=>
    (e.a.xM===0 && e.a.yM===0 && e.b.xM===2 && e.b.yM===1) ||
    (e.b.xM===0 && e.b.yM===0 && e.a.xM===2 && e.a.yM===1)),false);
});

test('indexed and nonindexed geometry produce same physical boundary',()=>{
  const indexed=extractMeasureFeatureEdges({
    positions:[0,0,0,2,0,0,2,1,0,0,1,0],
    indices:[0,1,2,0,2,3],toG1:identity,
  });
  assert.equal(indexed.length,4);
});

test('crease extraction preserves a genuine fold but rejects fake planar edges',()=>{
  const vertices=[
    0,0,0,1,0,0,0,1,0,
    0,0,0,1,0,0,0,0,1,
  ];
  const edges=extractMeasureFeatureEdges({positions:vertices,toG1:identity});
  const fold=edges.find(e=>
    e.a.yM===0 && e.a.sourceHeightYUpM===0 &&
    e.b.yM===0 && e.b.sourceHeightYUpM===0 &&
    Math.abs(e.b.xM-e.a.xM)===1);
  assert.ok(fold);
  assert.equal(extractMeasureFeatureEdges({positions:vertices,toG1:null}).length,0);
  assert.equal(extractMeasureFeatureEdges({positions:vertices,toG1:identity,maxTriangles:1}).length,0);
});

const squareEdges=[
  {a:g(0,0),b:g(2,0)},
  {a:g(2,0),b:g(2,1)},
  {a:g(2,1),b:g(0,1)},
  {a:g(0,1),b:g(0,0)},
];

test('snap prefers a real corner before an adjacent feature edge',()=>{
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:3,y:2},hitPointG1:g(.025,.025),
    segments:squareEdges,projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(result.kind,'corner');
  same(result.pointG1,g(0,0));
  assert.equal(result.workTestOnly,true);
});

test('snap chooses a position along a genuine edge away from corners',()=>{
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:98,y:2},hitPointG1:g(1,.02),
    segments:squareEdges,projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(result.kind,'edge');
  assert.ok(Math.abs(result.pointG1.xM-.98)<1e-12);
  assert.equal(result.pointG1.yM,0);
});

test('fails closed for hidden, distant, no-hit and out-of-range candidates',()=>{
  const args={
    pointerPx:{x:3,y:2},hitPointG1:g(.025,.025),
    segments:squareEdges,projectToScreen:projector,isCandidateVisible:checker,
  };
  assert.equal(chooseMeasureFeatureSnap({...args,isCandidateVisible:()=>false}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,hitPointG1:null}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,pointerPx:{x:NaN,y:1}}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,pointerPx:{x:700,y:700}}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,hitPointG1:g(9,9)}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,projectToScreen:()=>({x:0,y:0,visible:false})}),null);
});

test('straight collinear subdivision is never mislabeled as a corner',()=>{
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:100,y:0},hitPointG1:g(1,0),
    segments:[{a:g(0,0),b:g(1,0)},{a:g(1,0),b:g(2,0)}],
    projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(result.kind,'edge');
});
