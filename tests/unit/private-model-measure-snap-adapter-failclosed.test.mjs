import * as THREE from 'three';
import test from 'node:test';
import assert from 'node:assert/strict';
import {snapFromVisibleMeshHit} from '../../src/scripts/privateModelMeasureSnapAdapter.mjs';

const fixture=()=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld(true);
  const camera=new THREE.PerspectiveCamera(60,1,0.1,20);
  camera.position.set(0,0,5);
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  const ndc=new THREE.Vector3(1,1,1).project(camera);
  return {
    mesh,camera,frontmostHit:{object:mesh,point:new THREE.Vector3(.94,.94,1)},
    rect:{left:0,top:0,width:400,height:400},
    pointerPx:{x:200*(ndc.x+1)+2,y:200*(1-ndc.y)+2},
    acceptsFrontmostHit:()=>true,
    isFeatureVisible:({pointWorld})=>pointWorld.z>=.999,
  };
};
const fail=()=>{throw new Error('source scene disposed during pointer preview');};

test('adapter still accepts a validated frontmost visible source box corner',()=>{
  const result=snapFromVisibleMeshHit(fixture());
  assert.equal(result?.kind,'corner');
  assert.equal(result?.workTestOnly,true);
});

test('source-hit acceptance callback exception fails closed instead of reaching viewer UI',()=>{
  const args=fixture();
  assert.equal(snapFromVisibleMeshHit({...args,acceptsFrontmostHit:fail}),null);
  assert.equal(snapFromVisibleMeshHit(args)?.kind,'corner');
});

test('candidate visibility callback exception fails closed without selecting an unseen edge',()=>{
  const args=fixture();
  assert.equal(snapFromVisibleMeshHit({...args,isFeatureVisible:fail}),null);
  assert.equal(snapFromVisibleMeshHit(args)?.kind,'corner');
});

test('mesh and camera world-matrix exceptions fail closed without scene mutation',()=>{
  const args=fixture();
  args.mesh.updateWorldMatrix=fail;
  assert.equal(snapFromVisibleMeshHit(args),null);
  const args2=fixture();
  args2.camera.updateMatrixWorld=fail;
  assert.equal(snapFromVisibleMeshHit(args2),null);
});

test('invalidated BufferGeometry position accessor fails closed',()=>{
  const args=fixture();
  args.mesh.geometry.attributes.position.getX=fail;
  assert.equal(snapFromVisibleMeshHit(args),null);
});


test('replacing the position backing array invalidates cached snap edges even with unchanged version',()=>{
  const args=fixture();
  assert.equal(snapFromVisibleMeshHit(args)?.kind,'corner');
  const position=args.mesh.geometry.getAttribute('position');
  const previousArray=position.array,version=position.version;
  const shifted=previousArray.slice();
  for(let i=0;i<shifted.length;i+=position.itemSize) shifted[i]+=.5;
  position.copy(new THREE.BufferAttribute(shifted,position.itemSize));
  assert.notStrictEqual(position.array,previousArray);
  assert.equal(position.version,version);
  const projected=new THREE.Vector3(1.5,1,1).project(args.camera);
  const updated={
    ...args,
    frontmostHit:{object:args.mesh,point:new THREE.Vector3(1.44,.94,1)},
    pointerPx:{x:200*(projected.x+1)+2,y:200*(1-projected.y)+2},
  };
  const result=snapFromVisibleMeshHit(updated);
  assert.equal(result?.kind,'corner');
  assert.ok(Math.abs(result.pointG1.xM-1.5)<1e-6);
});

test('replacing index backing array with degenerate triangles invalidates old selectable corners',()=>{
  const args=fixture();
  assert.equal(snapFromVisibleMeshHit(args)?.kind,'corner');
  const index=args.mesh.geometry.getIndex();
  const previousArray=index.array,version=index.version;
  index.copy(new THREE.BufferAttribute(new Uint16Array(index.count),1));
  assert.notStrictEqual(index.array,previousArray);
  assert.equal(index.version,version);
  assert.equal(snapFromVisibleMeshHit(args),null);
});
