import {expect,test} from '@playwright/test';
import * as THREE from 'three';
import {pickVisibleWorkTest3DPoint} from '../../src/scripts/privateModelWorkTest3DPoint';

const setup=()=>{
  const root=new THREE.Group();
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(2,2,2),
    new THREE.MeshBasicMaterial({color:0xdddddd}),
  );
  mesh.position.set(2,0,-3);
  mesh.name = 'WORK_TEST_BOX_SURFACE';
  root.add(mesh);
  root.updateMatrixWorld(true);
  const camera=new THREE.PerspectiveCamera(55,1,0.1,100);
  camera.position.set(2,3,9);
  camera.lookAt(2,0,-3);
  camera.updateMatrixWorld(true);
  return {root,mesh,camera,raycaster:new THREE.Raycaster(),
    rect:{left:20,top:40,width:400,height:400}};
};
const hit=(x=220,y=240,mutate?:(s:ReturnType<typeof setup>)=>void)=>{
  const s=setup();
  mutate?.(s);
  s.root.updateMatrixWorld(true);
  return pickVisibleWorkTest3DPoint({
    clientX:x,clientY:y,rect:s.rect,camera:s.camera,
    modelRoot:s.root,raycaster:s.raycaster,
  });
};
test('a real 3D mesh click yields source-model YLIS XY, never surveyed XY',()=>{
  const point=hit();
  expect(point).not.toBeNull();
  expect(point!.xM).toBeCloseTo(2,2);
  expect(point!.yM).toBeGreaterThan(1.9);
  expect(point!.yM).toBeLessThan(3.1);
  expect(point!.surfaceObjectName).toBe('WORK_TEST_BOX_SURFACE');
  expect(point!.surfaceNormalG1).not.toBeNull();
  expect(point!.surfaceNormalG1!.x).toBeCloseTo(0, 4);
  expect(point!.surfaceNormalG1!.y).toBeCloseTo(-1, 4);
  expect(point!.surfaceNormalG1!.z).toBeCloseTo(0, 4);
  expect(point).toMatchObject({
    coordinateFrame:'YLIS-G1-LOCAL',
    interpretation:'WORK_TEST_MODEL_POINT_ONLY',
    exactXY:false,humanReview:'NOT_RUN',
    current:false,canonical:false,asBuilt:false,
  });
});
test('no arbitrary ground-plane coordinate outside the canvas or with invalid pointer',()=>{
  expect(hit(0,0)).toBeNull();
  expect(hit(1000,1000)).toBeNull();
  expect(hit(Number.NaN,240)).toBeNull();
  expect(hit(220,240,({root})=>root.clear())).toBeNull();
});
test('invisible and opacity-zero source meshes cannot create a position',()=>{
  expect(hit(220,240,({mesh})=>{mesh.visible=false;})).toBeNull();
  expect(hit(220,240,({mesh})=>{
    (mesh.material as THREE.MeshBasicMaterial).opacity=0;
  })).toBeNull();
});
test('presentation-only geometry cannot masquerade as a source point',()=>{
  expect(hit(220,240,({mesh})=>{mesh.userData.PresentationOnly=true;}))
    .toBeNull();
  expect(hit(220,240,({root,mesh})=>{
    root.remove(mesh);
    const overlay=new THREE.Group();
    overlay.userData.PresentationOnly=true;
    overlay.add(mesh);
    root.add(overlay);
  })).toBeNull();
});
test('a source point must come from an actual intersected visible surface',()=>{
  const point=hit(220,240,({mesh})=>{mesh.position.x=40;});
  expect(point).toBeNull();
});


test('mixed-material raycast ignores hidden front face and reports the visible rear point',()=>{
  // BoxGeometry groups: 4 is the camera-facing +Z side, 5 the rear -Z side.
  // Both are raycastable with DoubleSide even when their materials do not render.
  // The old whole-mesh check accepted hidden +Z because -Z was visible.
  for (const frontStyle of ['invisible','zero-opacity','no-color-write'] as const) {
    const point=hit(220,240,({mesh})=>{
      const materials=Array.from({length:6},()=>
        new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,visible:false}),
      );
      materials[4].visible=frontStyle!=='invisible';
      if(frontStyle==='zero-opacity') materials[4].opacity=0;
      if(frontStyle==='no-color-write') materials[4].colorWrite=false;
      materials[5].visible=true;
      (mesh as THREE.Mesh).material=materials;
    });
    // Object at Z=-3 with a 2m box: the visible back face is at Z=-4.
    // YLIS model Y equals -world Z, not the hidden face's Z=-2 -> Y=2.
    expect(point).not.toBeNull();
    expect(point!.yM).toBeCloseTo(4,2);
  }
});

test('a mixed-material hit on hidden faces alone never invents a model coordinate',()=>{
  const point=hit(220,240,({mesh})=>{
    const materials=Array.from({length:6},()=>
      new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}),
    );
    // Only a side face is visible, but the central pointer intersects the
    // hidden +Z and -Z faces, not the painted side surface.
    materials[0].visible=true;
    (mesh as THREE.Mesh).material=materials;
  });
  expect(point).toBeNull();
});

test('normal is unit length in G1 under nonuniform scale and oblique mesh rotation',()=>{
  const p=hit(220,240,({mesh})=>{
    mesh.rotation.y=0.4;
    mesh.scale.set(1.3,0.7,2.1);
    mesh.updateMatrixWorld(true);
  });
  expect(p).not.toBeNull();
  const n=p!.surfaceNormalG1!;
  expect(Math.hypot(n.x,n.y,n.z)).toBeCloseTo(1,6);
  expect(n.y).toBeLessThan(0);
  expect(p!.surfaceObjectName).toBe('WORK_TEST_BOX_SURFACE');
});
test('mesh without name returns unknown label without inventing source identity',()=>{
  const p=hit(220,240,({mesh})=>{mesh.name='';});
  expect(p).not.toBeNull();
  expect(p!.surfaceObjectName).toBeNull();
});

test('clipped-away front surface cannot be picked; visible rear remains selectable',()=>{
  const p=hit(220,240,({mesh})=>{
    const m=mesh.material as THREE.MeshBasicMaterial;
    m.side=THREE.DoubleSide;
    // Front box face is world Z=-2, rear Z=-4. Keep only Z <= -3.
    m.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,0,-1),-3)];
  });
  expect(p).not.toBeNull();
  expect(p!.yM).toBeCloseTo(4,2);
  expect(p!.surfaceObjectName).toBe('WORK_TEST_BOX_SURFACE');
});
test('no 3D coordinate when every raycast surface is clipped away',()=>{
  const p=hit(220,240,({mesh})=>{
    const m=mesh.material as THREE.MeshBasicMaterial;
    m.side=THREE.DoubleSide;
    // Both front and rear box faces are on the discarded side.
    m.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,0,-1),-5)];
  });
  expect(p).toBeNull();
});
test('clipIntersection respects Three.js plane combination semantics',()=>{
  const p=hit(220,240,({mesh})=>{
    const m=mesh.material as THREE.MeshBasicMaterial;
    m.side=THREE.DoubleSide;
    m.clipIntersection=true;
    m.clippingPlanes=[
      new THREE.Plane(new THREE.Vector3(0,0,-1),-3),
      new THREE.Plane(new THREE.Vector3(1,0,0),10),
    ];
  });
  // Only one plane rejects the near face: clipIntersection keeps it.
  expect(p).not.toBeNull();
  expect(p!.yM).toBeCloseTo(2,2);
  const q=hit(220,240,({mesh})=>{
    const m=mesh.material as THREE.MeshBasicMaterial;
    m.side=THREE.DoubleSide;
    m.clipIntersection=true;
    m.clippingPlanes=[
      new THREE.Plane(new THREE.Vector3(0,0,-1),-3),
      new THREE.Plane(new THREE.Vector3(0,0,-1),-2.5),
    ];
  });
  // Both planes reject the near face, leaving only the far face.
  expect(q).not.toBeNull();
  expect(q!.yM).toBeCloseTo(4,2);
});
test('multi-material clipping applies only to the hit face material',()=>{
  const p=hit(220,240,({mesh})=>{
    const materials=Array.from({length:6},()=>
      new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}),
    );
    materials[4].visible=true;
    materials[4].clippingPlanes=[
      new THREE.Plane(new THREE.Vector3(0,0,-1),-3),
    ];
    materials[5].visible=true;
    (mesh as THREE.Mesh).material=materials;
  });
  expect(p).not.toBeNull();
  expect(p!.yM).toBeCloseTo(4,2);
});
