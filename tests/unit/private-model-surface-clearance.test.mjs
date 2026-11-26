import * as THREE from 'three';
import { closestVisibleSourceMeshClearance as meshClearance } from '../../src/scripts/privateModelSurfaceClearanceAdapter.mjs';
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

const makeWorkTestWall=(offsetX=0)=>{
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, 0,0,-1, 0,1,-1,
    0,0,0, 0,1,-1, 0,1,0,
  ],3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
  mesh.position.set(offsetX,0,0);
  mesh.updateMatrixWorld(true);
  return mesh;
};
const meshInput=(a=makeWorkTestWall(),b=makeWorkTestWall(.3),extras={})=>({
  sourceA:{sourceId:'selected-A',mesh:a},
  sourceB:{sourceId:'selected-B',mesh:b},
  acceptsSourceMesh:()=>true,
  acceptsClippedTriangle:()=>true,
  isTriangleFrontmost:()=>true,
  ...extras,
});

test('source-mesh adapter uses transformed world triangles and correct G1 normal clearance',()=>{
  const r=meshClearance(meshInput());
  assert.ok(r);
  near(r.distanceM,.3);
  near(r.deltaXM,.3);
  near(r.deltaYM,0);
  near(r.deltaZM,0);
  assert.equal(r.meshWorldToG1Adapter,true);
  assert.equal(r.renderedSourceChecksCallerSupplied,true);
  assert.equal(r.asBuilt,false);
  assert.equal(r.workTestOnly,true);
  assert.equal(r.triangleAIndex,0);
});

test('source-mesh adapter fail-closes clipping, occlusion, source mismatch and missing checks',()=>{
  const a=makeWorkTestWall(),b=makeWorkTestWall(.3),data=meshInput(a,b);
  assert.equal(meshClearance({...data,acceptsSourceMesh:()=>false}),null);
  assert.equal(meshClearance({...data,acceptsClippedTriangle:undefined}),null);
  assert.equal(meshClearance({...data,isTriangleFrontmost:undefined}),null);
  assert.equal(meshClearance({...data,acceptsClippedTriangle:()=>1}),null);
  assert.equal(meshClearance({...data,isTriangleFrontmost:()=>false}),null);
  assert.equal(meshClearance({...data,acceptsClippedTriangle:()=>{throw Error('cut unknown')}}),null);
  assert.equal(meshClearance({...data,sourceB:{sourceId:'selected-A',mesh:b}}),null);
  assert.equal(meshClearance({...data,sourceB:{sourceId:'different-id',mesh:a}}),null);
  b.visible=false;
  assert.equal(meshClearance(data),null);
});

test('source-mesh adapter rejects partial, deformed and unbounded geometry instead of truncating',()=>{
  const a=makeWorkTestWall(),b=makeWorkTestWall(.3),data=meshInput(a,b);
  a.geometry.setDrawRange(0,3);
  assert.equal(meshClearance(data),null);
  a.geometry.setDrawRange(0,Infinity);
  a.isSkinnedMesh=true;
  assert.equal(meshClearance(data),null);
  a.isSkinnedMesh=false;
  a.geometry.attributes.position.setX(0,Infinity);
  assert.equal(meshClearance(data),null);
  assert.equal(meshClearance({...data,maxTrianglesPerSource:65}),null);
});

const makeLargeWorkTestWall=(offsetX=0,triCount=180,indexed=false)=>{
  const geom=new THREE.BufferGeometry();
  const position=[
    0,0,0, 0,0,-1, 0,1,-1,
    0,0,0, 0,1,-1, 0,1,0,
  ];
  if(indexed){
    geom.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
    geom.setIndex(Array.from({length:triCount},(_,i)=>i%2===0 ? [0,1,2]:[3,4,5]).flat());
  }else{
    const values=[];
    for(let i=0;i<triCount;i++){
      values.push(...position.slice(i%2===0?0:9,i%2===0?9:18));
    }
    geom.setAttribute('position',new THREE.Float32BufferAttribute(values,3));
  }
  const mesh=new THREE.Mesh(geom,new THREE.MeshBasicMaterial());
  mesh.position.x=offsetX;
  mesh.updateMatrixWorld(true);
  return mesh;
};
const facePatch=(sourceId,mesh,faceIndices,faceIndex=faceIndices[0])=>({
  sourceId,mesh,selectedFaceIndices:faceIndices,
  frontmostHit:{object:mesh,faceIndex,point:new THREE.Vector3(mesh.position.x,.2,-.2)},
});

test('bounded source-hit face patches measure two 180-triangle meshes without full scan',()=>{
  const a=makeLargeWorkTestWall(0),b=makeLargeWorkTestWall(.3);
  const da=facePatch('selected-A',a,[92,93],92);
  const db=facePatch('selected-B',b,[74,75],74);
  const visitedA=[],visitedB=[];
  const result=meshClearance(meshInput(a,b,{
    sourceA:da,sourceB:db,
    acceptsClippedTriangle:({sourceId,triangleIndex})=>{
      (sourceId==='selected-A'?visitedA:visitedB).push(triangleIndex);
      return true;
    },
  }));
  assert.ok(result);
  near(result.distanceM,.3);
  assert.equal(result.boundedSourcePatch,true);
  assert.equal(result.entireSelectedMeshesCompared,false);
  assert.equal(result.triangleAIndex,92);
  assert.equal(result.triangleBIndex,74);
  assert.deepEqual(visitedA,[92,93]);
  assert.deepEqual(visitedB,[74,75]);
  assert.equal(result.asBuilt,false);
});

test('indexed source-hit patches preserve original indexed face IDs',()=>{
  const a=makeLargeWorkTestWall(0,200,true);
  const b=makeLargeWorkTestWall(.3,200,true);
  const result=meshClearance(meshInput(a,b,{
    sourceA:facePatch('selected-A',a,[111],111),
    sourceB:facePatch('selected-B',b,[159],159),
  }));
  assert.ok(result);
  near(result.distanceM,.3);
  assert.equal(result.triangleAIndex,111);
  assert.equal(result.triangleBIndex,159);
});

test('explicit source patches reject missing, stale, duplicate, oversized, and invisible anchor hits',()=>{
  const a=makeLargeWorkTestWall(),b=makeLargeWorkTestWall(.3);
  const da=facePatch('selected-A',a,[52,53],52);
  const db=facePatch('selected-B',b,[58],58);
  const args=meshInput(a,b,{sourceA:da,sourceB:db});
  assert.equal(meshClearance(meshInput(a,b)),null); // whole mesh >64
  assert.equal(meshClearance({...args,sourceA:{sourceId:'selected-A',mesh:a,selectedFaceIndices:[52]}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,selectedFaceIndices:[53]}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,selectedFaceIndices:[52,52]}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,selectedFaceIndices:[52,180]}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,selectedFaceIndices:[52,-1]}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,selectedFaceIndices:Array(65).fill(52)}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,frontmostHit:{...da.frontmostHit,object:b}}}),null);
  assert.equal(meshClearance({...args,sourceA:{...da,frontmostHit:{...da.frontmostHit,point:null}}}),null);
  assert.equal(meshClearance({...args,acceptsClippedTriangle:({sourceId,triangleIndex})=>
    !(sourceId==='selected-A'&&triangleIndex===52)}),null);
  assert.equal(meshClearance({...args,isTriangleFrontmost:({sourceId,triangleIndex})=>
    !(sourceId==='selected-B'&&triangleIndex===58)}),null);
});

test('source patch material-group visibility must match the selected face, not a different group',()=>{
  const a=makeLargeWorkTestWall(),b=makeLargeWorkTestWall(.3);
  a.material=[new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial({visible:false})];
  a.geometry.clearGroups();
  a.geometry.addGroup(0,90*3,0);
  a.geometry.addGroup(90*3,90*3,1);
  const args=meshInput(a,b,{
    sourceA:facePatch('selected-A',a,[100],100),
    sourceB:facePatch('selected-B',b,[50],50),
  });
  assert.equal(meshClearance(args),null);
  const good={...args,sourceA:facePatch('selected-A',a,[50],50)};
  assert.ok(meshClearance(good));
  a.geometry.addGroup(0,180*3,0); // overlapping group is ambiguous
  assert.equal(meshClearance(good),null);
});
