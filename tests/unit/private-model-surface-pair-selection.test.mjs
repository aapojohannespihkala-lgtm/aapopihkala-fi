import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSurfacePairSelection} from '../../src/scripts/privateModelSurfacePairSelection.mjs';

const mesh=id=>({isMesh:true,id});
const hit=(sourceId,object,faceIndex=1,selectedFaceIndices=[1,2])=>({
  contextKey:'modelSHA:scene822:floorBOTH:clip0:source0',sourceId,mesh:object,
  frontmostHit:{object,faceIndex,point:{x:0,y:.2,z:-.2}},selectedFaceIndices,
});
const goodChecks={
  contextKey:'modelSHA:scene822:floorBOTH:clip0:source0',
  acceptsSourceMesh:()=>true,acceptsClippedTriangle:()=>true,
  isTriangleFrontmost:()=>true,
};
const make=()=>{
  const calls=[];
  const pair=createSurfacePairSelection({calculate:args=>{
    calls.push(args);
    return Object.freeze({distanceM:.3,sourceAId:args.sourceA.sourceId,
      sourceBId:args.sourceB.sourceId});
  }});
  return {pair,calls};
};

test('two explicit distinct clicked source surfaces enter ready, no guess or extra UI mode',()=>{
  const {pair,calls}=make(),a=mesh('A'),b=mesh('B');
  assert.equal(pair.setContext(goodChecks.contextKey),true);
  assert.equal(pair.selectHit(hit('A',a)),true);
  assert.equal(pair.measure(goodChecks),null);
  assert.equal(pair.selectHit(hit('B',b)),true);
  assert.deepEqual(pair.status(),{
    contextKey:goodChecks.contextKey,firstSourceId:'A',secondSourceId:'B',ready:true,
  });
  assert.equal(pair.measure(goodChecks).distanceM,.3);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].sourceA.selectedFaceIndices,[1,2]);
  assert.equal(calls[0].sourceA.frontmostHit.object,a);
});

test('context changes invalidate BOTH selected surfaces, including clipping and floor',()=>{
  const {pair}=make(),a=mesh('A'),b=mesh('B');
  pair.setContext(goodChecks.contextKey);
  pair.selectHit(hit('A',a));pair.selectHit(hit('B',b));
  assert.equal(pair.measure({...goodChecks,contextKey:'changed-clip'}),null);
  pair.setContext('changed-clip');
  assert.equal(pair.status().ready,false);
  assert.equal(pair.measure(goodChecks),null);
  assert.equal(pair.selectHit(hit('C',mesh('C'))),false); // stale event
  assert.equal(pair.setContext(''),false);
  assert.equal(pair.status().contextKey,null);
});

test('same source never forms a pair; reselection resets second; third starts a fresh first',()=>{
  const {pair}=make(),a=mesh('A'),b=mesh('B'),c=mesh('C');
  pair.setContext(goodChecks.contextKey);
  assert.equal(pair.selectHit(hit('A',a)),true);
  assert.equal(pair.selectHit(hit('A',a,2,[2])),true);
  assert.equal(pair.status().ready,false);
  assert.equal(pair.selectHit(hit('B',a)),false); // source ID alias
  assert.equal(pair.selectHit(hit('A',b)),false); // mesh alias
  pair.selectHit(hit('B',b));
  assert.equal(pair.status().ready,true);
  assert.equal(pair.selectHit(hit('B',b,2,[2])),true);
  assert.equal(pair.status().ready,true);
  assert.equal(pair.selectHit(hit('C',c)),true);
  assert.equal(pair.status().ready,false);
  assert.equal(pair.status().firstSourceId,'C');
  pair.clear();assert.equal(pair.status().firstSourceId,null);
});

test('fail closed on malformed candidate evidence and missing independent guards',()=>{
  const {pair,calls}=make(),a=mesh('A'),b=mesh('B');
  pair.setContext(goodChecks.contextKey);
  assert.equal(pair.selectHit(hit('A',a,1,[2])),false);
  assert.equal(pair.selectHit(hit('A',a,1,[1,1])),false);
  assert.equal(pair.selectHit(hit('A',a,1,Array.from({length:65},(_,i)=>i))),false);
  assert.equal(pair.selectHit({...hit('A',a),frontmostHit:{object:b,faceIndex:1,point:{x:0,y:0,z:0}}}),false);
  assert.equal(pair.selectHit({...hit('A',a),frontmostHit:{object:a,faceIndex:1,point:{x:Infinity,y:0,z:0}}}),false);
  assert.equal(pair.selectHit(hit('A',a)),true);
  assert.equal(pair.selectHit(hit('B',b)),true);
  assert.equal(pair.measure({...goodChecks,acceptsSourceMesh:null}),null);
  assert.equal(pair.measure({...goodChecks,acceptsClippedTriangle:undefined}),null);
  assert.equal(pair.measure({...goodChecks,isTriangleFrontmost:undefined}),null);
  assert.equal(calls.length,0);
});

test('raycast input mutation cannot move selected anchor, thrown calculator fails closed',()=>{
  const a=mesh('A'),b=mesh('B'),p=hit('A',a);
  const originalPoint=p.frontmostHit.point;
  const {pair,calls}=make();
  pair.setContext(goodChecks.contextKey);
  pair.selectHit(p);
  originalPoint.x=99;p.selectedFaceIndices.push(99);
  pair.selectHit(hit('B',b));
  pair.measure(goodChecks);
  assert.equal(calls[0].sourceA.frontmostHit.point.x,0);
  assert.deepEqual(calls[0].sourceA.selectedFaceIndices,[1,2]);
  const bad=createSurfacePairSelection({calculate:()=>{throw Error('view changed')}});
  bad.setContext(goodChecks.contextKey);
  bad.selectHit(hit('A',a));bad.selectHit(hit('B',b));
  assert.equal(bad.measure(goodChecks),null);
});

test('invalid construction disallows unbounded work or non-function calculator',()=>{
  assert.equal(createSurfacePairSelection(),null);
  assert.equal(createSurfacePairSelection({calculate:()=>null,maxFaces:65}),null);
  assert.equal(createSurfacePairSelection({calculate:()=>null,maxFaces:0}),null);
});

test('reentrant context/selection changes during calculate discard stale clearance',()=>{
  const a=mesh('A'),b=mesh('B'),c=mesh('C');
  const variants=[
    pair=>pair.setContext('modelSHA:scene823:floor2F:clip0:source0'),
    pair=>pair.clear(),
    pair=>pair.selectHit(hit('C',c)),
  ];
  for(const invalidate of variants){
    let pair;
    pair=createSurfacePairSelection({calculate:()=>{
      invalidate(pair);
      return Object.freeze({distanceM:.12});
    }});
    assert.equal(pair.setContext(goodChecks.contextKey),true);
    assert.equal(pair.selectHit(hit('A',a)),true);
    assert.equal(pair.selectHit(hit('B',b)),true);
    assert.equal(pair.measure(goodChecks),null,
      'selection/context invalidated during calculate must fail closed');
    assert.equal(pair.status().ready,false);
  }
});

test('calculator output is bound to the exact two selected source IDs and finite clearance',()=>{
  const a=mesh('A'),b=mesh('B');
  const invalid=[
    {sourceAId:'A',sourceBId:'old-B',distanceM:.2},
    {sourceAId:'old-A',sourceBId:'B',distanceM:.2},
    {sourceAId:'B',sourceBId:'A',distanceM:.2},
    {sourceAId:'A',sourceBId:'B',distanceM:NaN},
    {sourceAId:'A',sourceBId:'B',distanceM:Infinity},
    {sourceAId:'A',sourceBId:'B',distanceM:-.01},
    {sourceAId:'A',sourceBId:'B'},
    Promise.resolve({sourceAId:'A',sourceBId:'B',distanceM:.2}),
  ];
  for (const result of invalid){
    const pair=createSurfacePairSelection({calculate:()=>result});
    pair.setContext(goodChecks.contextKey);
    pair.selectHit(hit('A',a));pair.selectHit(hit('B',b));
    assert.equal(pair.measure(goodChecks),null,'wrong/invalid output must fail closed');
    assert.equal(pair.status().ready,true,'rejecting a result must not alter clicks');
  }
  const pair=createSurfacePairSelection({calculate:()=>({
    sourceAId:'A',sourceBId:'B',distanceM:0,
  })});
  pair.setContext(goodChecks.contextKey);
  pair.selectHit(hit('A',a));pair.selectHit(hit('B',b));
  assert.equal(pair.measure(goodChecks).distanceM,0,'touching surfaces may have zero clearance');
});

test('invalidated or empty raycast events fail closed without corrupting selected pair',()=>{
  const {pair}=make(),a=mesh('A'),b=mesh('B');
  pair.setContext(goodChecks.contextKey);
  assert.equal(pair.selectHit(hit('A',a)),true);
  const stale=hit('B',b);
  const badClick={...stale,frontmostHit:{
    object:b,faceIndex:1,point:{x:0,y:0,z:0,clone(){throw Error('scene disposed')}},
  }};
  const badKey={get contextKey(){throw Error('stale picker')}};
  for(const input of [null,false,0,'',badKey,badClick]){
    assert.doesNotThrow(()=>assert.equal(pair.selectHit(input),false));
    assert.equal(pair.status().firstSourceId,'A');
    assert.equal(pair.status().ready,false);
  }
  assert.equal(pair.selectHit(hit('B',b)),true);
  assert.equal(pair.measure(goodChecks).distanceM,.3);
});
