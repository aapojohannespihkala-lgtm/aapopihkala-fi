import * as THREE from 'three';
import {snapFromVisibleMeshHit} from '../../src/scripts/privateModelMeasureSnapAdapter.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measureAlongG1Axis,extractMeasureFeatureEdges,chooseMeasureFeatureSnap,
  perpendicularToMeasureEdge,perpendicularToMeasurePlane,
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

test('a throwing world-to-G1 transform fails closed for indexed and nonindexed meshes',()=>{
  // During a scene swap the transform may be invalidated after some vertices.
  // Do not return partial boundaries or propagate an exception to the viewer.
  const interrupted=(x,y,z)=>{
    if(x===2) throw new Error('scene switched during vertex conversion');
    return g(x,y,z);
  };
  assert.deepEqual(extractMeasureFeatureEdges({
    positions:squarePositions,toG1:interrupted,
  }),[]);
  assert.deepEqual(extractMeasureFeatureEdges({
    positions:[0,0,0,2,0,0,2,1,0,0,1,0],
    indices:[0,1,2,0,2,3],toG1:interrupted,
  }),[]);
  // Failure of one read must not poison the next valid source mesh.
  assert.equal(extractMeasureFeatureEdges({
    positions:squarePositions,toG1:identity,
  }).length,4);
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


test('a non-manifold three-face edge rejects the whole mesh rather than offering false boundary snaps',()=>{
  // Three triangles share A-B, while their six outer edges look selectable.
  const positions=[
    0,0,0, 1,0,0, 0,1,0, 0,0,1, 0,-1,0,
  ];
  const indices=[0,1,2, 1,0,3, 0,1,4];
  const nonindexed=indices.flatMap(i=>positions.slice(i*3,i*3+3));
  assert.deepEqual(extractMeasureFeatureEdges({
    positions,indices,toG1:identity,
  }),[]);
  assert.deepEqual(extractMeasureFeatureEdges({
    positions:nonindexed,toG1:identity,
  }),[]);
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

test('an edge crossing the viewport snaps even when both endpoints are outside',()=>{
  const args={
    pointerPx:{x:50,y:52},hitPointG1:g(0,.02),
    segments:[{a:g(-1,0),b:g(1,0)}],
    projectToScreen:p=>({x:50+p.xM*100,y:50+p.yM*100,visible:false,offscreen:true}),
    isCandidateVisible:checker,
  };
  const snap=chooseMeasureFeatureSnap(args);
  assert.equal(snap.kind,'edge');
  same(snap.pointG1,g(0,0));
  assert.equal(chooseMeasureFeatureSnap({...args,isCandidateVisible:()=>false}),null);
});

test('a deliberate corner wins but an incidental corner does not pull an edge pick sideways',()=>{
  const args={hitPointG1:g(.08,.02),segments:squareEdges,projectToScreen:projector,
    isCandidateVisible:checker,cornerPriorityPx:6};
  assert.equal(chooseMeasureFeatureSnap({...args,pointerPx:{x:3,y:2}}).kind,'corner');
  const nearEdge=chooseMeasureFeatureSnap({...args,pointerPx:{x:9,y:2}});
  assert.equal(nearEdge.kind,'edge');
  same(nearEdge.pointG1,g(.09,0));
});

test('perpendicular uses the finite tilted edge or the actual face normal',()=>{
  const segment={a:g(1,0),b:g(3,2)};
  same(perpendicularToMeasureEdge(g(0,2),segment),g(1.5,.5));
  assert.equal(perpendicularToMeasureEdge(g(5,4),segment),null);
  assert.equal(perpendicularToMeasureEdge(g(0,2),{a:segment.a,b:segment.a}),null);
  same(perpendicularToMeasurePlane(g(0,0,2),g(1,1,0),{x:1,y:1,z:0}),g(1,1,2));
  assert.equal(perpendicularToMeasurePlane(g(0,0),g(1,0),{x:0,y:0,z:0}),null);
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

// Small tessellated details should not displace the nearest long wall edge.
const salientSegments=[
  {a:g(0,0),b:g(2,0)},
  {a:g(.5,0),b:g(.54,0)},
  {a:g(.5,0),b:g(.5,.04)},
];

test('smart snap ignores small detail corners beside a major wall edge',()=>{
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:50,y:1},hitPointG1:g(.5,.01),segments:salientSegments,
    projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(snap.kind,'edge');
  same(snap.pointG1,g(.5,0));
});

test('the same small corner becomes measurable when zoomed in',()=>{
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:250,y:1},hitPointG1:g(.5,.005),segments:salientSegments,
    projectToScreen:p=>({x:p.xM*500,y:p.yM*500,visible:true}),
    isCandidateVisible:checker,
  });
  assert.equal(snap.kind,'corner');
  same(snap.pointG1,g(.5,0));
});

test('corner salience threshold rejects invalid inputs',()=>{
  assert.equal(chooseMeasureFeatureSnap({
    pointerPx:{x:0,y:0},hitPointG1:g(0,0),segments:squareEdges,
    projectToScreen:projector,isCandidateVisible:checker,minCornerArmPx:-1,
  }),null);
});

test('short edge fragments are ignored at normal zoom, even without a competing edge',()=>{
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:52,y:0},hitPointG1:g(.51,.005),
    segments:[{a:g(.5,0),b:g(.54,0)}],
    projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(snap,null);
});

test('a genuine wall corner remains salient when each straight arm is finely subdivided',()=>{
  const edges=[];
  for(let i=0;i<16;i++){
    edges.push({a:g(i*.02,0),b:g((i+1)*.02,0)});
    edges.push({a:g(0,i*.02),b:g(0,(i+1)*.02)});
  }
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:1,y:1},hitPointG1:g(.015,.015),
    segments:edges,projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(result?.kind,'corner');
  same(result.pointG1,g(0,0));
});

test('a 4px detail branch cannot become a salient corner by borrowing long wall arms',()=>{
  const segments=[];
  for(let i=0;i<15;i++){
    segments.push({a:g(i*.02,0),b:g((i+1)*.02,0)});
  }
  segments.push({a:g(.1,0),b:g(.1,.04)});
  const result=chooseMeasureFeatureSnap({
    pointerPx:{x:10,y:1},hitPointG1:g(.1,.01),
    segments,projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(result?.kind,'edge');
  same(result.pointG1,g(.1,0));
});

test('small subdivided details do not inherit salience across an actual 90-degree bend',()=>{
  const detail=[{a:g(0,0),b:g(.04,0)},{a:g(.04,0),b:g(.04,.04)}];
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:4,y:0},hitPointG1:g(.04,.005),segments:detail,
    projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(snap,null);
});

test('a gentle bend never becomes a straight segment for a perpendicular measurement',()=>{
  const first={a:g(0,0),b:g(.12,0)};
  const second={a:first.b,b:g(.24,.012)};
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:7,y:0},hitPointG1:g(.07,.01),segments:[first,second],
    projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(snap?.kind,'edge');
  assert.deepEqual(snap.segment,first);
  assert.equal(perpendicularToMeasureEdge(g(.18,1),snap.segment),null);
});


test('real building corner retains 20px straight wall arms across a tiny T-junction',()=>{
  const segments=[];
  for(let i=0;i<20;i++){
    segments.push({a:g(i*.01,0),b:g((i+1)*.01,0)});
    segments.push({a:g(0,i*.01),b:g(0,(i+1)*.01)});
  }
  segments.push({a:g(.05,0),b:g(.05,.04)});
  const args={segments,projectToScreen:projector,isCandidateVisible:checker};
  const corner=chooseMeasureFeatureSnap({
    ...args,pointerPx:{x:1,y:1},hitPointG1:g(.01,.01),
  });
  assert.equal(corner?.kind,'corner');
  same(corner.pointG1,g(0,0));
  // A deliberate pick beyond the 3px corner-priority radius remains on the wall.
  const branch=chooseMeasureFeatureSnap({
    ...args,pointerPx:{x:5,y:1},hitPointG1:g(.05,.01),cornerPriorityPx:3,
  });
  assert.equal(branch?.kind,'edge');
  same(branch.pointG1,g(.05,0));
});

test('30000-way ambiguous shared vertex fails closed as a corner',()=>{
  const count=30000;
  const segments=Array.from({length:count},(_,i)=>{
    const theta=2*Math.PI*i/count;
    return {a:g(0,0),b:g(.3*Math.cos(theta),.3*Math.sin(theta))};
  });
  const snap=chooseMeasureFeatureSnap({
    pointerPx:{x:0,y:0},hitPointG1:g(0,0),
    segments,projectToScreen:projector,isCandidateVisible:checker,
  });
  assert.equal(snap?.kind,'edge');
});

test('a 3m physical wall corner remains salient at 30/40/100 px per metre',()=>{
  const segments=[];
  for(let i=0;i<150;i++) segments.push({
    a:g(i*.02,0),b:g((i+1)*.02,0),
  });
  for(let i=0;i<100;i++) segments.push({
    a:g(0,i*.02),b:g(0,(i+1)*.02),
  });
  for(const pixelsPerMetre of [30,40,100]){
    const snap=chooseMeasureFeatureSnap({
      pointerPx:{x:.35,y:.35},hitPointG1:g(.015,.015),
      segments,projectToScreen:p=>({
        x:p.xM*pixelsPerMetre,y:p.yM*pixelsPerMetre,visible:true,
      }),isCandidateVisible:checker,
    });
    assert.equal(snap?.kind,'corner',`zoom ${pixelsPerMetre} px/m`);
    same(snap.pointG1,g(0,0));
  }
  const far=chooseMeasureFeatureSnap({
    pointerPx:{x:90,y:0},hitPointG1:g(.015,.015),segments,
    projectToScreen:p=>({x:p.xM*30,y:p.yM*30,visible:true}),
    isCandidateVisible:checker,
  });
  assert.equal(far,null,'full-edge context must never snap to a 3m remote point');
});
test('source-mesh adapter recognises a 3m L-corner across 2cm triangulated arms at overview zoom',()=>{
  // One genuine planar L-shaped wall footprint: the physical inner corner is
  // at (0,0), and its two 3m arms have 150 individual 2cm boundary segments.
  // Triangulation spokes are coplanar and must not become measurable edges.
  const boundary=[[0,0]];
  for(let i=1;i<=150;i++) boundary.push([i*.02,0]);
  boundary.push([3,-.1],[-.1,-.1],[-.1,3],[0,3]);
  for(let i=149;i>=1;i--) boundary.push([0,i*.02]);
  const positions=[];
  for(let i=0;i<boundary.length;i++){
    const a=boundary[i],b=boundary[(i+1)%boundary.length];
    positions.push(-.05,-.05,0,a[0],a[1],0,b[0],b[1],0);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.updateMatrixWorld(true);
  const rect={left:0,top:0,width:480,height:480};
  for(const pixelsPerMetre of [30,40]){
    const halfSpan=240/pixelsPerMetre;
    const camera=new THREE.OrthographicCamera(-halfSpan,halfSpan,halfSpan,-halfSpan,.1,30);
    camera.position.set(1.5,1.5,10);
    camera.lookAt(1.5,1.5,0);
    camera.updateMatrixWorld(true);
    const projection=new THREE.Vector3(0,0,0).project(camera);
    const pointerPx={x:240*(projection.x+1),y:240*(1-projection.y)};
    const args={
      frontmostHit:{object:mesh,point:new THREE.Vector3(-.025,-.025,0)},
      camera,rect,pointerPx,
      acceptsFrontmostHit:()=>true,
      isFeatureVisible:({pointWorld})=>Math.abs(pointWorld.z)<1e-5,
    };
    const snap=snapFromVisibleMeshHit(args);
    assert.equal(snap?.kind,'corner','real subdivided corner at '+pixelsPerMetre+' px/m');
    assert.ok(Math.abs(snap.pointG1.xM)<1e-7);
    assert.ok(Math.abs(snap.pointG1.sourceHeightYUpM)<1e-7);
    assert.ok(Math.abs(snap.pointG1.yM)<1e-7);
    // Full-edge salience is context only. A distant validated surface hit must
    // never permit a false 3m-long jump back to this screen-space corner.
    assert.equal(snapFromVisibleMeshHit({
      ...args,frontmostHit:{object:mesh,point:new THREE.Vector3(2,-.05,0)},
    }),null);
  }
});

test('dense visible wall candidates use one nearest-first visibility raycast',()=>{
  for(const count of [1000,10000,30000]){
    // Reverse rank: each successive 20px-long edge is closer to the pointer.
    // The old scan raycast every edge as the best distance improved.
    const segments=Array.from({length:count},(_,i)=>{
      const y=.1*(count-i)/count;
      return {a:g(-.1,y),b:g(.1,y)};
    });
    let checked=0;
    const result=chooseMeasureFeatureSnap({
      pointerPx:{x:0,y:0},hitPointG1:g(0,0),
      segments,projectToScreen:projector,
      isCandidateVisible:()=>{checked++;return true;},
    });
    assert.equal(result?.kind,'edge','dense visible edge '+count);
    assert.ok(Math.abs(result.pointG1.yM-.1/count)<1e-8);
    assert.equal(checked,1,'nearest-first visibility budget '+count);
  }
});

test('nearest-first visibility rejects hidden nearest and uses next visible edge',()=>{
  const segments=[
    {a:g(-.1,.06),b:g(.1,.06)},
    {a:g(-.1,.02),b:g(.1,.02)},
  ];
  let checked=0;
  const hit=chooseMeasureFeatureSnap({
    pointerPx:{x:0,y:0},hitPointG1:g(0,0),
    segments,projectToScreen:projector,
    isCandidateVisible:(p)=>{checked++;return p.yM>.04;},
  });
  assert.equal(hit?.kind,'edge');
  same(hit.pointG1,g(0,.06));
  assert.equal(checked,2,'hidden nearest requires exactly one fallback');
  const tied=chooseMeasureFeatureSnap({
    pointerPx:{x:0,y:0},hitPointG1:g(0,0),
    segments:[{a:g(-.1,.05),b:g(.1,.05)},{a:g(-.1,-.05),b:g(.1,-.05)}],
    projectToScreen:projector,isCandidateVisible:checker,
  });
  same(tied.pointG1,g(0,.05));
});

test('dense hidden edge candidates use a bounded nearest-first visibility budget',()=>{
  // Forty long, parallel visible-size features are within the cursor window.
  // Without a bound, every candidate would trigger a costly source re-raycast.
  const segments=Array.from({length:40},(_,i)=>({
    a:g(-.1,i*.001),b:g(.1,i*.001),
  }));
  const args={
    pointerPx:{x:0,y:0},hitPointG1:g(0,0),segments,
    projectToScreen:projector,
  };
  let probes=0;
  assert.equal(chooseMeasureFeatureSnap({
    ...args,isCandidateVisible:()=>{probes++;return false;},
  }),null);
  assert.equal(probes,16);

  probes=0;
  const nearestVisible=chooseMeasureFeatureSnap({
    ...args,isCandidateVisible:()=>++probes===4,
  });
  assert.equal(nearestVisible.kind,'edge');
  assert.ok(Math.abs(nearestVisible.pointG1.yM-.003)<1e-12);
  assert.equal(probes,4);

  probes=0;
  assert.equal(chooseMeasureFeatureSnap({
    ...args,isCandidateVisible:()=>++probes===17,
  }),null);
  assert.equal(probes,16);
});

test('hidden corner probes do not starve an eligible edge, and budgets fail closed',()=>{
  const checked=[];
  const args={
    pointerPx:{x:0,y:0},hitPointG1:g(.025,.025),
    segments:squareEdges,projectToScreen:projector,
    maxVisibilityChecks:1,
    isCandidateVisible:(_p,kind)=>{checked.push(kind);return kind==='edge';},
  };
  assert.equal(chooseMeasureFeatureSnap(args)?.kind,'edge');
  assert.deepEqual(checked,['corner','edge']);
  assert.equal(chooseMeasureFeatureSnap({...args,maxVisibilityChecks:0}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,maxVisibilityChecks:17}),null);
  assert.equal(chooseMeasureFeatureSnap({...args,maxVisibilityChecks:1.5}),null);
});

test('projection and source visibility callback exceptions fail closed without throwing',()=>{
  const args={
    pointerPx:{x:2,y:2},hitPointG1:g(.02,.02),
    segments:squareEdges,projectToScreen:projector,isCandidateVisible:checker,
  };
  assert.equal(chooseMeasureFeatureSnap({
    ...args,projectToScreen:()=>{throw Error('scene disposed during projection');},
  }),null);
  let calls=0;
  assert.equal(chooseMeasureFeatureSnap({
    ...args,isCandidateVisible:(_p,kind)=>{
      calls++;
      if(kind==='corner') throw Error('frontmost source visibility is stale');
      return true;
    },
  }),null,'a failed corner check must not fall back to an unchecked edge');
  assert.ok(calls>0,'the throwing visibility path was exercised');
  assert.equal(chooseMeasureFeatureSnap(args)?.kind,'corner',
    'valid visible source geometry still snaps normally');
});
