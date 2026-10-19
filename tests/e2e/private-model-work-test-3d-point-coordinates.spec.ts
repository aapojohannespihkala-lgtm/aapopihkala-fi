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
