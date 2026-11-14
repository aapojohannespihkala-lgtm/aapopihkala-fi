import * as THREE from 'three';
import {snapFromVisibleMeshHit} from '../../src/scripts/privateModelMeasureSnapAdapter.mjs';
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


test('reversed coplanar triangle winding does not manufacture a building diagonal',()=>{
  const edges=extractMeasureFeatureEdges({
    positions:[0,0,0,2,0,0,2,1,0,0,1,0],
    // The second triangle has deliberately opposite winding on the same plane.
    indices:[0,1,2,3,2,0],toG1:identity,
  });
  assert.equal(edges.length,4);
});

test('screen-to-world edge interpolation accounts for perspective clip W',()=>{
  // With endpoint inverse-Ws 1 and 0.5, the world midpoint projects
  // past the centre of this screen segment. Screen t=0.5 -> world t=1/3.
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:50,y:0},hitPointG1:g(2/3,0,2/3),
    segments:[{a:g(0,0,0),b:g(2,0,2)}],
    projectToScreen:p=>({
      x:p.xM===0?0:100,y:0,visible:true,invW:p.xM===0?1:0.5,
    }),
    isCandidateVisible:()=>true,maxWorldGapM:1,
  });
  assert.equal(result.kind,'edge');
  assert.ok(Math.abs(result.pointG1.xM-2/3)<1e-12);
  assert.ok(Math.abs(result.pointG1.sourceHeightYUpM-2/3)<1e-12);
});

test('invalid or one-sided inverse clip W fails closed',()=>{
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:50,y:0},hitPointG1:g(1,0,0),
    segments:[{a:g(0,0),b:g(2,0)}],
    projectToScreen:p=>({
      x:p.xM*50,y:0,visible:true,...(p.xM===0?{invW:1}:{})
    }),
    isCandidateVisible:()=>true,maxWorldGapM:2,
  });
  assert.equal(result,null);
});


test('validated front-face corner snaps to a real box corner with correct G1 north/up',()=>{
  const geometry=new THREE.BoxGeometry(2,2,2);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
  mesh.updateMatrixWorld(true);
  const camera=new THREE.PerspectiveCamera(60,1,0.1,20);
  camera.position.set(0,0,5);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  const rect={left:0,top:0,width:400,height:400};
  const ndc=new THREE.Vector3(1,1,1).project(camera);
  const pointerPx={x:200*(ndc.x+1)+2,y:200*(1-ndc.y)+2};
  const hit={object:mesh,point:new THREE.Vector3(.94,.94,1)};
  const result=snapFromVisibleMeshHit({
    frontmostHit:hit,camera,rect,pointerPx,
    acceptsFrontmostHit:()=>true,
    isFeatureVisible:({pointWorld})=>pointWorld.z>=.999,
  });
  assert.ok(result);
  assert.equal(result.kind,'corner');
  assert.ok(Math.abs(result.pointG1.xM-1)<1e-9);
  assert.ok(Math.abs(result.pointG1.yM+1)<1e-9);
  assert.ok(Math.abs(result.pointG1.sourceHeightYUpM-1)<1e-9);
  assert.equal(result.workTestOnly,true);
});

test('adapter rejects non-frontmost hits, hidden snap candidates and missing guards',()=>{
  const geometry=new THREE.BoxGeometry(2,2,2);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
  const camera=new THREE.PerspectiveCamera(60,1,0.1,20);
  camera.position.z=5;
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  const projected=new THREE.Vector3(1,1,1).project(camera);
  const args={
    frontmostHit:{object:mesh,point:new THREE.Vector3(.94,.94,1)},
    camera,rect:{left:0,top:0,width:400,height:400},
    pointerPx:{x:200*(projected.x+1),y:200*(1-projected.y)},
    acceptsFrontmostHit:()=>true,isFeatureVisible:()=>true,
  };
  assert.equal(snapFromVisibleMeshHit({...args,acceptsFrontmostHit:()=>false}),null);
  assert.equal(snapFromVisibleMeshHit({...args,isFeatureVisible:()=>false}),null);
  assert.equal(snapFromVisibleMeshHit({...args,isFeatureVisible:undefined}),null);
  assert.equal(snapFromVisibleMeshHit({...args,acceptsFrontmostHit:undefined}),null);
  assert.equal(snapFromVisibleMeshHit({...args,frontmostHit:null}),null);
  assert.equal(snapFromVisibleMeshHit({...args,pointerPx:{x:-1,y:0}}),null);
  assert.equal(snapFromVisibleMeshHit({...args,pointerPx:{x:Infinity,y:0}}),null);
});

test('adapter applies mesh world transform and G1 mapping before picking',()=>{
  const mesh=new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,1,0),
    ]),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(1,2,-1);
  mesh.rotation.z=Math.PI/2;
  mesh.updateMatrixWorld(true);
  const corner=mesh.localToWorld(new THREE.Vector3(0,0,0));
  const camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,20);
  camera.position.set(1,2,6);
  camera.lookAt(1,2,-1);
  camera.updateMatrixWorld(true);
  const projection=corner.clone().project(camera);
  const result=snapFromVisibleMeshHit({
    frontmostHit:{
      object:mesh,
      point:mesh.localToWorld(new THREE.Vector3(.025,.02,0)),
    },
    camera,rect:{left:10,top:20,width:400,height:400},
    pointerPx:{x:10+200*(projection.x+1),y:20+200*(1-projection.y)},
    acceptsFrontmostHit:()=>true,isFeatureVisible:()=>true,
  });
  assert.ok(result);
  assert.equal(result.kind,'corner');
  assert.ok(Math.abs(result.pointG1.xM-1)<1e-9);
  assert.ok(Math.abs(result.pointG1.yM-1)<1e-9);
  assert.ok(Math.abs(result.pointG1.sourceHeightYUpM-2)<1e-9);
});

test('adapter fails closed before scanning excessively large geometry',()=>{
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,250,250),new THREE.MeshBasicMaterial());
  const camera=new THREE.PerspectiveCamera(50,1,.1,20);
  camera.position.z=5;
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  const r=snapFromVisibleMeshHit({
    frontmostHit:{object:mesh,point:new THREE.Vector3(0,0,0)},
    camera,rect:{left:0,top:0,width:400,height:400},
    pointerPx:{x:200,y:200},
    acceptsFrontmostHit:()=>true,isFeatureVisible:()=>true,
  });
  assert.equal(r,null);
});


test('adapter rejects mesh animation or partial-draw geometry rather than false geometry snaps',()=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial());
  const camera=new THREE.PerspectiveCamera(60,1,.1,20);
  camera.position.z=5;
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  const ndc=new THREE.Vector3(1,1,1).project(camera);
  const args={
    frontmostHit:{object:mesh,point:new THREE.Vector3(.98,.98,1)},
    camera,rect:{left:0,top:0,width:400,height:400},
    pointerPx:{x:200*(ndc.x+1),y:200*(1-ndc.y)},
    acceptsFrontmostHit:()=>true,isFeatureVisible:()=>true,
  };
  const baseline=snapFromVisibleMeshHit(args);
  assert.ok(baseline);
  mesh.isInstancedMesh=true;
  assert.equal(snapFromVisibleMeshHit(args),null);
  mesh.isInstancedMesh=false;
  mesh.isSkinnedMesh=true;
  assert.equal(snapFromVisibleMeshHit(args),null);
  mesh.isSkinnedMesh=false;
  mesh.geometry.morphAttributes.position=[new THREE.Float32BufferAttribute([0,0,0],3)];
  assert.equal(snapFromVisibleMeshHit(args),null);
  mesh.geometry.morphAttributes.position=[];
  mesh.geometry.setDrawRange(0,3);
  assert.equal(snapFromVisibleMeshHit(args),null);
  mesh.geometry.setDrawRange(0,Infinity);
  assert.ok(snapFromVisibleMeshHit(args));
});
