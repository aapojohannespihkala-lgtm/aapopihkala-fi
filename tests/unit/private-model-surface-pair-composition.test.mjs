import * as THREE from 'three';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSurfacePairSelection} from '../../src/scripts/privateModelSurfacePairSelection.mjs';
import {closestVisibleSourceMeshClearance} from '../../src/scripts/privateModelSurfaceClearanceAdapter.mjs';

// Synthetic source geometry only. These checks DO NOT certify original R34
// WebGL occlusion, clipping, provenance, model SHA or as-built surfaces.
const CONTEXT='syntheticSHA:scene822:floorBOTH:clip0:source-policy0';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,
  `expected ${actual} to be ${expected}`);
const wall=(offsetX)=>{
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, 0,0,-1, 0,1,-1,
    0,0,0, 0,1,-1, 0,1,0,
  ],3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());
  mesh.position.x=offsetX;
  return mesh;
};
const fixture=()=>{
  const root=new THREE.Group();
  root.position.set(9,2,-4);
  const a=wall(0),b=wall(.3);
  root.add(a,b);
  root.updateMatrixWorld(true);
  const names=new Map([['synthetic-wall-A',a],['synthetic-wall-B',b]]);
  const pair=createSurfacePairSelection({calculate:closestVisibleSourceMeshClearance});
  assert.ok(pair);
  assert.equal(pair.setContext(CONTEXT),true);
  const guards={
    contextKey:CONTEXT,
    acceptsSourceMesh:({mesh,sourceId})=>names.get(sourceId)===mesh,
    acceptsClippedTriangle:()=>true,
    isTriangleFrontmost:()=>true,
  };
  const pick=(sourceId,mesh,contextKey=CONTEXT)=>({
    contextKey,sourceId,mesh,selectedFaceIndices:[0,1],
    // A real THREE world point inside original face 0, not a guessed vertex.
    frontmostHit:{object:mesh,faceIndex:0,
      point:mesh.localToWorld(new THREE.Vector3(0,.2,-.4))},
  });
  return {a,b,pair,guards,pick};
};
const chooseBoth=({a,b,pair,pick})=>{
  assert.equal(pair.selectHit(pick('synthetic-wall-A',a)),true);
  assert.equal(pair.selectHit(pick('synthetic-wall-B',b)),true);
};

test('two explicit real THREE mesh hits compose selection, G1 conversion and minimum gap',()=>{
  const f=fixture();
  assert.equal(f.pair.measure(f.guards),null,'one or zero clicks cannot measure');
  assert.equal(f.pair.selectHit(f.pick('synthetic-wall-A',f.a)),true);
  assert.equal(f.pair.measure(f.guards),null,'the second surface is required');
  assert.equal(f.pair.selectHit(f.pick('synthetic-wall-B',f.b)),true);
  const result=f.pair.measure(f.guards);
  assert.ok(result);
  near(result.distanceM,.3);
  near(result.from.xM,9);
  near(result.to.xM,9.3);
  near(result.deltaXM,.3);
  near(result.deltaYM,0);
  near(result.deltaZM,0);
  assert.equal(result.sourceAId,'synthetic-wall-A');
  assert.equal(result.sourceBId,'synthetic-wall-B');
  assert.ok([0,1].includes(result.triangleAIndex));
  assert.ok([0,1].includes(result.triangleBIndex));
  assert.equal(result.meshWorldToG1Adapter,true);
  assert.equal(result.boundedSourcePatch,true);
  assert.equal(result.entireSelectedMeshesCompared,false);
  assert.equal(result.workTestOnly,true);
  assert.equal(result.surveyedClearanceVerified,false);
  assert.equal(result.asBuilt,false);
});

test('composed real mesh measurement fails closed on clipped, hidden or unverified source',()=>{
  const f=fixture();
  chooseBoth(f);
  assert.ok(f.pair.measure(f.guards));
  assert.equal(f.pair.measure({...f.guards,acceptsClippedTriangle:
    ({sourceId})=>sourceId==='synthetic-wall-A'}),null);
  assert.equal(f.pair.measure({...f.guards,isTriangleFrontmost:
    ({sourceId})=>sourceId==='synthetic-wall-A'}),null);
  assert.equal(f.pair.measure({...f.guards,acceptsSourceMesh:
    ({sourceId})=>sourceId==='synthetic-wall-A'}),null);
  f.b.material.visible=false;
  assert.equal(f.pair.measure(f.guards),null,'a hidden source is not a contact point');
  f.b.material.visible=true;
  assert.ok(f.pair.measure(f.guards),'caller may revalidate a restored visible source');
});

test('changed world mesh and model context invalidate old clicks without invented clearance',()=>{
  const f=fixture();
  chooseBoth(f);
  near(f.pair.measure(f.guards).distanceM,.3);
  f.b.position.x=.55;
  f.b.updateWorldMatrix(true,false);
  assert.equal(f.pair.measure(f.guards),null,
    'stored frontmostHit cannot migrate to a moved original face');
  const newKey='syntheticSHA:scene823:floor2F:clip1:source-policy0';
  assert.equal(f.pair.setContext(newKey),true);
  assert.equal(f.pair.status().ready,false);
  assert.equal(f.pair.selectHit(f.pick('synthetic-wall-A',f.a)),false,
    'an old scene click is not a new selection');
  assert.equal(f.pair.selectHit(f.pick('synthetic-wall-A',f.a,newKey)),true);
  assert.equal(f.pair.selectHit(f.pick('synthetic-wall-B',f.b,newKey)),true);
  near(f.pair.measure({...f.guards,contextKey:newKey}).distanceM,.55);
});
