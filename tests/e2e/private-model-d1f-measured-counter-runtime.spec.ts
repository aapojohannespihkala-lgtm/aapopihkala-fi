import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { createD1FCombinedWallPixelRuntime } from '../../src/scripts/privateModelD1FCombinedWallPixelRuntime.mjs';
import { D1F_COMBINED_WALL_ASSETS } from '../../src/scripts/privateModelD1FCombinedWallSceneContract.mjs';

// Synthetic Three geometry matching the exact raw Drive GLB structure.
// Does NOT assert original source bytes, browser pixels, or production publication.
const sha = D1F_COMBINED_WALL_ASSETS['d1f-measured-wall-140-100-2350-b710-basin-20261014'].sha256;
const triangles = [0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
function fixture(finished = false, west = true, corrections = false) {
  const count = (finished && west ? 256 : 240)+(corrections ? 16 : 0);
  const indexCount = (finished && west ? 480 : 396)+(corrections ? 60 : 0);
  const scene = new THREE.Scene(), root = new THREE.Group(), wall = new THREE.Group();
  root.rotation.x = -Math.PI / 2; scene.add(root); root.add(wall);
  wall.userData.sourceNodeIndex = 798;
  const positions = new Float32Array(count * 3);
  // Finished-face raw scenes 80..83: I03 is 2350 mm high from source Z=.08.
  // WEST keeps the fixed basin host and shifts I03 -18 mm in source X.
  // The earlier measured source retains its original 0..2.76 m fixture.
  const x = finished && west ? 5.288 : 5.306;
  const bottom = finished ? .08 : 0;
  const top = finished ? 2.43 : 2.76;
  [[x,3.807,bottom],[x+.96,3.807,bottom],[x+.96,4.012,bottom],[x,4.012,bottom],
    [x,3.807,top],[x+.96,3.807,top],[x+.96,4.012,top],[x,4.012,top]]
    .forEach((p,i) => positions.set(p,(128+i)*3));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setIndex([...triangles.map(i=>i+144),...triangles.map(i=>i+128),
    ...Array.from({length:indexCount-72},(_,i)=>176+triangles[i%36])]);
  if(corrections) {
    // A synthetic source slab, B-wall block and door reveal ring. No private GLB is committed.
    const base=west?256:240, shift=west?0:.018;
    for(const [j,px] of [4.078+shift,4.788+shift].entries())
      for(const [k,py] of [5.032,5.147].entries())
        for(const [m,pz] of [.08,2.015].entries()) positions.set([px,py,pz],(base+[4,5,6,7,12,13,14,15][j*4+k*2+m])*3);
    for(let i=200;i<216;i++)positions.set([3.788+shift+(i%2)*.1, .249+((i>>1)%2)*1.793, i%4<2?.08:2.43],i*3);
    const idx=Array.from(geometry.index!.array);
    const stepOffsets=Array.from({length:12},(_,i)=>180+i*3);
    stepOffsets.forEach((o,i)=>idx.splice(o,3,...triangles.slice(i*3,i*3+3).map(v=>v+200)));
    const reveals=Array.from({length:8},(_,i)=>indexCount-24+i*3), rv=[4,5,6,7,12,13,14,15];
    reveals.forEach((o,i)=>idx.splice(o,3,base+rv[i],base+rv[(i+1)%8],base+rv[(i+2)%8]));
    geometry.setIndex(idx);
    wall.userData.userReviewCorrections={lobbyDoor:{revealFocusIndexOffsets:reveals},wallContinuity:{focusIndexOffsets:stepOffsets}};
  }
  const mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
  wall.add(mesh);
  // The separate source primitive contains no I03 triangles.
  const context = new THREE.BufferGeometry();
  context.setAttribute('position',new THREE.BufferAttribute(positions,3));
  context.setIndex(Array.from({length:finished && west ? 576 : 612},(_,i)=>i%3));
  wall.add(new THREE.Mesh(context,new THREE.MeshBasicMaterial()));
  const corners = ['CORNER_NORTH_X2337','CORNER_SOUTH_X2337','CORNER_MIDDLE_X2589']
    .map((name,i)=>{
      const object = new THREE.Mesh(new THREE.BoxGeometry(.04,.04,2.76),new THREE.MeshBasicMaterial());
      object.userData.independentlyAddressableCorner=name;
      object.position.set(i+1,3,0); wall.add(object); return {name,object};
    });
  const basinGeometry = new THREE.BoxGeometry(.495,1.025,corrections ? .06 : .02);
  basinGeometry.translate(4.1355,3.2495,corrections ? .915 : .935);
  const counter = new THREE.Mesh(basinGeometry,new THREE.MeshBasicMaterial());
  Object.assign(counter.userData,{
    WORK_TEST_ONLY:true,current:false,Canonical:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN',
    logicalFixtureId:'D1F_KPH_BASIN_TOP_WORK_PROXY_01',
    sourceRecord:corrections ? 'G2_D1F_FOUR_USER_REVIEW_CORRECTIONS_20261014_2330' : finished ? 'G2_D1F_KPH_FINISHED_FACE_2360_FOUR_HYPOTHESES_20261014_1600' : 'G2_D1F_KPH_BASIN_SOURCE_FACE_X3P888_WORK_TEST_20261014',
    sourceHostFaceXM:3.888,finishedFloorWorkZM:.08,absoluteFaceSurveyVerified:false,
  });
  if (finished) {
    Object.assign(counter.userData,{workingHostFaceXM:west ? 3.888 : 3.906,physicalFinishedFaceVerified:false});
    counter.position.x = west ? 0 : .018;
  }
  root.add(counter);
  const camera = new THREE.PerspectiveCamera(38,1280/900,.01,5000);
  camera.position.set(4,4,4); camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const controls:any={target:new THREE.Vector3(),enabled:true,enableDamping:true,autoRotate:false,
    update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};
  const selected = {scene,wall,corners,counter,workTestOnly:true,variant:west ? 'WEST_ANCHOR_725_895_740' : 'EAST_ANCHOR_725_895_740'};
  const options = {THREE,selected,sourceSha:corrections ? D1F_COMBINED_WALL_ASSETS['d1f-four-review-corrections-20261014'].sha256 : finished ? D1F_COMBINED_WALL_ASSETS['d1f-finished-face-2360-wall-basin-20261014'].sha256 : sha,camera,controls,
    canvas:{getBoundingClientRect:()=>({width:1280,height:900})},render:()=>{}};
  return {options,mesh,counter,corners,camera,controls};
}

test('measured source suppresses exactly I03 triangles, restores 360 other indices', () => {
  const f=fixture(),original=f.mesh.geometry;
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  const prepared=runtime.prepare('I03');
  expect(prepared.sourceI03Indices).toMatchObject({count:36,sourceVertices:[128,135],
    offsets:Array.from({length:12},(_,i)=>36+i*3)});
  runtime.suppress('I03');
  expect(f.mesh.geometry.index!.count).toBe(360);
  expect(f.counter.visible).toBe(true);
  expect(f.corners.every(c=>c.object.visible)).toBe(true);
  expect(runtime.restore()).toMatchObject({state:'RESTORED',suppressionRestored:true});
  expect(f.mesh.geometry).toBe(original);
  runtime.dispose();
});

test('measured basin independently disappears and returns without hiding walls or corners', () => {
  const f=fixture();
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  const prepared=runtime.prepare('BASIN');
  expect(prepared).toMatchObject({targetId:'BASIN',suppressionMethod:'BASIN_NODE_VISIBILITY_ONLY',
    roiProvenance:'PROJECTED_EXACT_TARGET_GEOMETRY',pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'});
  expect(prepared.roi.width).toBeGreaterThanOrEqual(8);
  runtime.suppress('BASIN');
  expect(f.counter.visible).toBe(false);
  expect(f.mesh.geometry.index!.count).toBe(396);
  expect(f.corners.every(c=>c.object.visible)).toBe(true);
  expect(runtime.restore()).toMatchObject({suppressionRestored:true,
    cameraFingerprint:prepared.cameraFingerprint});
  expect(f.counter.visible).toBe(true);
  runtime.dispose();
  expect(f.controls.enabled).toBe(true);
});

test('rejects false basin host, geometrical drift, hidden model and wrong SHA', () => {
  const bad=fixture();
  expect(()=>createD1FCombinedWallPixelRuntime({...bad.options,sourceSha:'0'.repeat(64)})).toThrow();
  bad.counter.geometry.translate(.1,0,0);
  expect(()=>createD1FCombinedWallPixelRuntime(bad.options)).toThrow();
  const future=fixture();
  future.counter.userData.current=true;
  expect(()=>createD1FCombinedWallPixelRuntime(future.options)).toThrow();
  const hidden=fixture();
  hidden.counter.visible=false;
  expect(()=>createD1FCombinedWallPixelRuntime(hidden.options)).toThrow();
});

for (const west of [true,false]) {
  test('finished-face '+(west?'WEST':'EAST')+' restores all five targets with exactly36 I03 indices suppressed', () => {
    const f=fixture(true,west),original=f.mesh.geometry;
    const runtime=createD1FCombinedWallPixelRuntime(f.options);
    for (const target of ['I03',...f.corners.map(c=>c.name),'BASIN']) {
      const prepared=runtime.prepare(target);
      runtime.suppress(target);
      expect(f.mesh.geometry.index!.count).toBe((west?480:396)-(target==='I03'?36:0));
      expect(f.counter.visible).toBe(target!=='BASIN');
      const restored=runtime.restore();
      expect(restored).toMatchObject({suppressionRestored:true,cameraFingerprint:prepared.cameraFingerprint});
      expect(f.mesh.geometry).toBe(original);
      expect(f.counter.visible).toBe(true);
      expect(f.corners.every(c=>c.object.visible)).toBe(true);
    }
    runtime.dispose(); expect(f.controls.enabled).toBe(true);
  });
}
test('finished source rejects wrong variant layout and shifted or physically approved counter', () => {
  const layout=fixture(true,true); layout.options.selected.variant='EAST_ANCHOR_725_895_740';
  expect(()=>createD1FCombinedWallPixelRuntime(layout.options)).toThrow();
  const shifted=fixture(true,false); shifted.counter.position.x=0;
  expect(()=>createD1FCombinedWallPixelRuntime(shifted.options)).toThrow();
  const physical=fixture(true,true); physical.counter.userData.physicalFinishedFaceVerified=true;
  expect(()=>createD1FCombinedWallPixelRuntime(physical.options)).toThrow();
});

for(const west of [true,false]) test('four corrections '+(west?'WEST':'EAST')+' validate geometry and isolate each added indexed target', () => {
  const f=fixture(true,west,true),source=f.mesh.geometry;
  const runtime=createD1FCombinedWallPixelRuntime(f.options);
  expect(runtime.inspectCorrections()).toMatchObject({clearDoorWidthMm:710,clearDoorHeightMm:1935,
    bWallJointStepMm:0,counterThicknessMm:60,reachableRoomFootprintCount:0,humanReview:'NOT_RUN'});
  for(const [id,count] of [['LOBBY_DOOR_REVEALS',24],['B_WALL_CONTINUITY',36]] as const){
    const p=runtime.prepare(id,1);expect(p.sourceTargetIndices?.count).toBe(count);
    runtime.suppress(id);expect(f.mesh.geometry.index!.count).toBe((west?540:456)-count);
    expect(f.counter.visible).toBe(true);expect(f.corners.every(c=>c.object.visible)).toBe(true);
    expect(()=>runtime.inspectCorrections()).toThrow();runtime.restore();expect(f.mesh.geometry).toBe(source);
  }
  expect(runtime.inspectCorrections().gate).toBe('PASS_FOUR_REPORTED_CORRECTIONS_IN_LOADED_GEOMETRY');runtime.dispose();
});

test('four-correction geometry gate rejects reintroduced step, 20 mm slab, footprint and wrong reveal roster',()=>{
  for(const kind of ['step','slab','footprint','roster']){
    const f=fixture(true,true,true);
    if(kind==='step')f.mesh.geometry.attributes.position.setZ(202,2.76);
    if(kind==='slab')f.counter.geometry.scale(1,1,1/3);
    if(kind==='footprint'){const floor=new THREE.Group();floor.userData.representationKind='referenceFootprint';f.options.selected.scene.add(floor);}
    if(kind==='roster')f.options.selected.wall.userData.userReviewCorrections.lobbyDoor.revealFocusIndexOffsets[0]-=3;
    expect(()=>createD1FCombinedWallPixelRuntime(f.options),kind).toThrow('D1F_SOURCE_PIXEL_RUNTIME_REJECTED');
  }
});
