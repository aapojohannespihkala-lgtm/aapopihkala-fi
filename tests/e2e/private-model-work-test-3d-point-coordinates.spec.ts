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
  for (const frontStyle of ['invisible','zero-opacity'] as const) {
    const point=hit(220,240,({mesh})=>{
      const materials=Array.from({length:6},()=>
        new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,visible:false}),
      );
      materials[4].visible=frontStyle!=='invisible';
      if(frontStyle==='zero-opacity') materials[4].opacity=0;
      materials[5].visible=true;
      mesh.material=materials;
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
    mesh.material=materials;
  });
  expect(point).toBeNull();
});
